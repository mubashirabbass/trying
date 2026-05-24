import { Router, type IRouter } from "express";
import { db, certificatesTable, coursesTable, usersTable, attendanceTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { ListCertificatesQueryParams, VerifyCertificateQueryParams } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { generatePdf } from "../lib/pdf";
import { authenticate, AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

// PUBLIC ROUTES
router.get("/certificates/verify", async (req, res): Promise<void> => {
  const params = VerifyCertificateQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  let certs;
  if (params.data.cnic) {
    const usersByCnic = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.cnic, params.data.cnic));
    const userIds = usersByCnic.map(u => u.id);
    if (userIds.length === 0) {
      res.json({ isValid: false, message: "No certificate found for this CNIC", certificate: null });
      return;
    }
    certs = await db.select({
      id: certificatesTable.id,
      userId: certificatesTable.userId,
      courseId: certificatesTable.courseId,
      certificateNumber: certificatesTable.certificateNumber,
      issuedAt: certificatesTable.issuedAt,
      studentName: usersTable.name,
      courseName: coursesTable.title,
    }).from(certificatesTable)
      .leftJoin(usersTable, eq(certificatesTable.userId, usersTable.id))
      .leftJoin(coursesTable, eq(certificatesTable.courseId, coursesTable.id))
      .where(eq(certificatesTable.userId, userIds[0]));
  } else if (params.data.certificateNumber) {
    certs = await db.select({
      id: certificatesTable.id,
      userId: certificatesTable.userId,
      courseId: certificatesTable.courseId,
      certificateNumber: certificatesTable.certificateNumber,
      issuedAt: certificatesTable.issuedAt,
      studentName: usersTable.name,
      courseName: coursesTable.title,
    }).from(certificatesTable)
      .leftJoin(usersTable, eq(certificatesTable.userId, usersTable.id))
      .leftJoin(coursesTable, eq(certificatesTable.courseId, coursesTable.id))
      .where(eq(certificatesTable.certificateNumber, params.data.certificateNumber));
  } else {
    res.status(400).json({ error: "Provide cnic or certificateNumber" });
    return;
  }

  if (certs.length === 0) {
    res.json({ isValid: false, message: "Certificate not found", certificate: null });
    return;
  }

  const cert = certs[0];
  res.json({ isValid: true, message: "Certificate is valid", certificate: cert });
});

// PRIVATE ROUTES (Require Auth)
router.get("/certificates", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const certs = await db.select({
    id: certificatesTable.id,
    userId: certificatesTable.userId,
    courseId: certificatesTable.courseId,
    certificateNumber: certificatesTable.certificateNumber,
    issuedAt: certificatesTable.issuedAt,
    studentName: usersTable.name,
    courseName: coursesTable.title,
  }).from(certificatesTable)
    .leftJoin(usersTable, eq(certificatesTable.userId, usersTable.id))
    .leftJoin(coursesTable, eq(certificatesTable.courseId, coursesTable.id))
    .where(eq(certificatesTable.userId, userId));

  res.json(certs);
});

router.get("/certificates/:id/download", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const certs = await db.select({
    id: certificatesTable.id,
    certificateNumber: certificatesTable.certificateNumber,
    issuedAt: certificatesTable.issuedAt,
    studentName: usersTable.name,
    courseName: coursesTable.title,
  }).from(certificatesTable)
    .leftJoin(usersTable, eq(certificatesTable.userId, usersTable.id))
    .leftJoin(coursesTable, eq(certificatesTable.courseId, coursesTable.id))
    .where(and(eq(certificatesTable.id, id), eq(certificatesTable.userId, userId)));

  if (certs.length === 0) { res.status(404).json({ error: "Certificate not found" }); return; }
  const cert = certs[0];

  // Professional Certificate HTML Template
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Certificate of Completion</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Montserrat:wght@400;700&family=Playfair+Display:ital,wght@1,600&display=swap');
        body { margin: 0; padding: 0; background-color: #fff; font-family: 'Montserrat', sans-serif; }
        .cert-container { 
          width: 1120px; 
          height: 790px; 
          padding: 40px; 
          border: 20px solid #1e293b; 
          position: relative; 
          margin: 0 auto;
          box-sizing: border-box;
        }
        .inner-border {
          border: 4px solid #d4af37;
          height: 100%;
          width: 100%;
          padding: 60px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
        }
        .logo { font-family: 'Cinzel', serif; font-size: 32px; font-weight: 700; color: #1e293b; margin-bottom: 40px; letter-spacing: 4px; }
        .subtitle { font-size: 16px; text-transform: uppercase; letter-spacing: 6px; font-weight: 700; color: #6366f1; margin-bottom: 20px; }
        .title { font-family: 'Cinzel', serif; font-size: 56px; color: #1e293b; margin: 0; line-height: 1; }
        .awarded-to { font-family: 'Playfair Display', serif; font-size: 24px; font-style: italic; margin: 40px 0 20px; color: #64748b; }
        .student-name { font-size: 48px; font-weight: 700; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 40px; min-width: 400px; }
        .description { font-size: 20px; color: #64748b; max-width: 700px; line-height: 1.6; margin-bottom: 60px; }
        .course-name { color: #6366f1; font-weight: 700; }
        .footer { width: 100%; display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; }
        .sig-block { width: 250px; text-align: center; }
        .sig-line { border-top: 1px solid #1e293b; margin-bottom: 10px; }
        .sig-name { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
        .sig-title { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
        .date-block { text-align: center; }
        .date-text { font-size: 14px; font-weight: 700; color: #1e293b; }
        .cert-id { position: absolute; bottom: 60px; right: 60px; font-size: 10px; color: #94a3b8; font-family: monospace; }
        .seal { width: 100px; height: 100px; background: #d4af37; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; box-shadow: 0 4px 10px rgba(0,0,0,0.1); position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); }
      </style>
    </head>
    <body>
      <div class="cert-container">
        <div class="inner-border">
          <div class="logo">GLOBAL COLLEGE</div>
          <div class="subtitle">Certificate of Achievement</div>
          <h1 class="title">EXCELLENCE</h1>
          <p class="awarded-to">This is proudly presented to</p>
          <div class="student-name">${cert.studentName}</div>
          <p class="description">
            For successfully completing all academic requirements for the course <br/>
            <span class="course-name">${cert.courseName}</span><br/>
            demonstrating exceptional dedication and professional competence.
          </p>
          <div class="footer">
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-name">Academic Board</div>
              <div class="sig-title">Director</div>
            </div>
            <div class="date-block">
              <div class="date-text">Awarded on</div>
              <div class="date-text">${new Date(cert.issuedAt!).toLocaleDateString()}</div>
            </div>
            <div class="sig-block">
              <div class="sig-line"></div>
              <div class="sig-name">Registrar</div>
              <div class="sig-title">Academic Affairs</div>
            </div>
          </div>
          <div class="seal">OFFICIAL SEAL</div>
          <div class="cert-id">VERIFY ID: ${cert.certificateNumber}</div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const pdfBuffer = await generatePdf(html, { 
      landscape: true, 
      width: '1120px', 
      height: '790px',
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' } 
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=certificate-${cert.certificateNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    logger.error("Failed to generate certificate PDF:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// ADMIN ROUTES
router.get("/admin/certificates", authenticate, async (req: AuthRequest, res): Promise<void> => {
  if (req.user?.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }

  const certs = await db.select({
    id: certificatesTable.id,
    userId: certificatesTable.userId,
    courseId: certificatesTable.courseId,
    certificateNumber: certificatesTable.certificateNumber,
    issuedAt: certificatesTable.issuedAt,
    isRevoked: certificatesTable.isRevoked,
    revocationReason: certificatesTable.revocationReason,
    studentName: usersTable.name,
    studentEmail: usersTable.email,
    courseName: coursesTable.title,
  }).from(certificatesTable)
    .leftJoin(usersTable, eq(certificatesTable.userId, usersTable.id))
    .leftJoin(coursesTable, eq(certificatesTable.courseId, coursesTable.id))
    .orderBy(desc(certificatesTable.issuedAt));

  res.json(certs);
});

router.post("/admin/certificates/revoke", authenticate, async (req: AuthRequest, res): Promise<void> => {
  if (req.user?.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const { id, reason } = req.body;
  if (!id) { res.status(400).json({ error: "Certificate ID is required" }); return; }

  await db.update(certificatesTable)
    .set({ isRevoked: true, revocationReason: reason || "Administrative revocation" })
    .where(eq(certificatesTable.id, id));

  res.json({ success: true, message: "Certificate revoked" });
});

router.post("/admin/certificates/issue", authenticate, async (req: AuthRequest, res): Promise<void> => {
  if (req.user?.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const { userId, courseId } = req.body;
  if (!userId || !courseId) { res.status(400).json({ error: "User ID and Course ID are required" }); return; }

  // Check attendance logic
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) { res.status(404).json({ error: "Course not found" }); return; }

  const attendanceRecords = await db.select().from(attendanceTable)
    .where(and(eq(attendanceTable.userId, userId), eq(attendanceTable.courseId, courseId)));
  
  if (attendanceRecords.length > 0) {
    const totalClasses = attendanceRecords.length;
    const presentClasses = attendanceRecords.filter(r => r.status === "present" || r.status === "late").length;
    const attendancePercentage = (presentClasses / totalClasses) * 100;
    
    if (attendancePercentage < course.minAttendancePercentage) {
      res.status(400).json({ 
        error: `Cannot issue certificate. Student attendance is ${Math.round(attendancePercentage)}%, which is below the minimum requirement of ${course.minAttendancePercentage}%.` 
      });
      return;
    }
  } else if (course.minAttendancePercentage > 0) {
      res.status(400).json({ 
        error: `Cannot issue certificate. No attendance records found, but ${course.minAttendancePercentage}% is required.` 
      });
      return;
  }

  const certNumber = `GC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
  
  const [newCert] = await db.insert(certificatesTable).values({
    userId,
    courseId,
    certificateNumber: certNumber,
    issuedAt: new Date(),
    isRevoked: false
  }).returning();

  res.json(newCert);
});

export default router;
