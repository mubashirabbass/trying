import { Router, type IRouter } from "express";
import { db, certificatesTable, coursesTable, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { ListCertificatesQueryParams, VerifyCertificateQueryParams } from "@workspace/api-zod";
import { randomBytes } from "crypto";

const router: IRouter = Router();

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
