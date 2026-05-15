import { Router, type IRouter } from "express";
import { db, certificatesTable, coursesTable, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { ListCertificatesQueryParams, VerifyCertificateQueryParams } from "@workspace/api-zod";
import { randomBytes } from "crypto";

import { generatePdf } from "../lib/pdf";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/certificates/:id/download", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const certs = await db.select({
    id: certificatesTable.id,
    certificateNumber: certificatesTable.certificateNumber,
    issuedAt: certificatesTable.issuedAt,
    studentName: usersTable.name,
    courseName: coursesTable.title,
  }).from(certificatesTable)
    .leftJoin(usersTable, eq(certificatesTable.userId, usersTable.id))
    .leftJoin(coursesTable, eq(certificatesTable.courseId, coursesTable.id))
    .where(eq(certificatesTable.id, id));

  if (certs.length === 0) { res.status(404).json({ error: "Certificate not found" }); return; }
  const cert = certs[0];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Certificate of Completion</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Montserrat:wght@400;700;900&display=swap');
        body { margin: 0; padding: 0; background-color: #fff; }
        .cert-container { 
          width: 1000px; 
          height: 700px; 
          padding: 50px; 
          border: 20px solid #0b1e4a; 
          position: relative; 
          margin: 0 auto;
          box-sizing: border-box;
          font-family: 'Montserrat', sans-serif;
        }
        .inner-border {
          border: 2px solid #c5a059;
          height: 100%;
          width: 100%;
          padding: 40px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .logo { font-size: 24px; font-weight: 900; color: #0b1e4a; margin-bottom: 20px; }
        .title { font-family: 'Libre Baskerville', serif; font-size: 56px; color: #c5a059; margin: 20px 0; text-transform: uppercase; }
        .subtitle { font-size: 18px; color: #666; letter-spacing: 5px; text-transform: uppercase; margin-bottom: 40px; }
        .awarded-to { font-size: 20px; color: #333; margin-bottom: 10px; }
        .student-name { font-family: 'Libre Baskerville', serif; font-size: 48px; font-weight: 700; color: #0b1e4a; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 30px; min-width: 500px; }
        .description { font-size: 16px; color: #666; max-width: 700px; line-height: 1.6; margin-bottom: 50px; }
        .course-name { font-weight: 700; color: #0b1e4a; }
        .footer { width: 100%; display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; }
        .sig-block { border-top: 1px solid #ccc; width: 200px; padding-top: 10px; font-size: 12px; color: #666; }
        .cert-id { position: absolute; bottom: 20px; right: 20px; font-size: 10px; color: #999; }
        .seal { width: 120px; height: 120px; background: #c5a059; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 14px; text-align: center; box-shadow: 0 0 0 10px rgba(197, 160, 89, 0.2); }
      </style>
    </head>
    <body>
      <div class="cert-container">
        <div class="inner-border">
          <div class="logo">GLOBAL COLLEGE</div>
          <div class="subtitle">Certificate of Completion</div>
          <div class="title">Honors</div>
          <div class="awarded-to">This is to certify that</div>
          <div class="student-name">${cert.studentName}</div>
          <div class="description">
            has successfully completed the comprehensive training program in <br/>
            <span class="course-name">${cert.courseName}</span><br/>
            demonstrating exceptional dedication and professional competence in the field of study.
          </div>
          
          <div class="footer">
            <div class="sig-block">
              <strong>Zain Ul Abadin</strong><br/>
              Academic Director
            </div>
            <div class="seal">OFFICIAL<br/>SEAL</div>
            <div class="sig-block">
              <strong>${new Date(cert.issuedAt!).toLocaleDateString()}</strong><br/>
              Date of Issue
            </div>
          </div>
          
          <div class="cert-id">
            Verify: https://globalcollege.edu.pk/verify-certificate | ID: ${cert.certificateNumber}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const pdfBuffer = await generatePdf(html, { 
      landscape: true, 
      width: '1000px', 
      height: '700px',
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

router.get("/certificates", async (req, res): Promise<void> => {
  const params = ListCertificatesQueryParams.safeParse(req.query);
  let query = db.select({
    id: certificatesTable.id,
    userId: certificatesTable.userId,
    courseId: certificatesTable.courseId,
    certificateNumber: certificatesTable.certificateNumber,
    issuedAt: certificatesTable.issuedAt,
    studentName: usersTable.name,
    courseName: coursesTable.title,
  }).from(certificatesTable)
    .leftJoin(usersTable, eq(certificatesTable.userId, usersTable.id))
    .leftJoin(coursesTable, eq(certificatesTable.courseId, coursesTable.id));

  if (params.success && params.data.userId) {
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
      .where(eq(certificatesTable.userId, Number(params.data.userId)));
    res.json(certs);
    return;
  }

  const certs = await query;
  res.json(certs);
});

export default router;
