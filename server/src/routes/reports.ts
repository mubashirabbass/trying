import { Router, type IRouter } from "express";
import { db, usersTable, coursesTable, enrollmentsTable, paymentsTable, quizResultsTable, assignmentSubmissionsTable, branchesTable } from "@workspace/db";
import { eq, desc, sql, count, avg, sum } from "drizzle-orm";
import { generatePdf, generateReportHtml } from "../lib/pdf";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// 1. Branch Overview
router.get("/reports/branch", async (req, res): Promise<void> => {
  const branches = await db.select({
    id: branchesTable.id,
    name: branchesTable.name,
    city: branchesTable.city,
  }).from(branchesTable);

  const reportData = await Promise.all(branches.map(async (b) => {
    const studentCount = await db.select({ c: count() }).from(usersTable).where(eq(usersTable.branchId, b.id));
    const activeEnrollments = await db.select({ c: count() })
      .from(enrollmentsTable)
      .leftJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id))
      .where(eq(usersTable.branchId, b.id));

    return {
      name: b.name,
      city: b.city,
      students: Number(studentCount[0]?.c ?? 0),
      active: Number(activeEnrollments[0]?.c ?? 0),
      courses: 12 // Simplified for now
    };
  }));

  res.json(reportData);
});

// 2. Student Progress
router.get("/reports/students", async (req, res): Promise<void> => {
  const students = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    branchId: usersTable.branchId,
  }).from(usersTable).where(eq(usersTable.role, "student")).limit(100);

  const reportData = await Promise.all(students.map(async (s) => {
    const branch = s.branchId ? await db.select().from(branchesTable).where(eq(branchesTable.id, s.branchId)) : [];
    const enrollments = await db.select({ c: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.userId, s.id));
    const quizAvg = await db.select({ a: avg(quizResultsTable.percentage) }).from(quizResultsTable).where(eq(quizResultsTable.userId, s.id));
    const assignAvg = await db.select({ a: avg(assignmentSubmissionsTable.marks) }).from(assignmentSubmissionsTable).where(eq(assignmentSubmissionsTable.userId, s.id));

    return {
      name: s.name,
      branch: branch[0]?.name || "Unknown",
      courses: Number(enrollments[0]?.c ?? 0),
      completion: "75%", // Simplified
      quizAvg: `${Math.round(Number(quizAvg[0]?.a ?? 0))}%`,
      assignAvg: `${Math.round(Number(assignAvg[0]?.a ?? 0))}%`
    };
  }));

  res.json(reportData);
});

// 3. Enrollments
router.get("/reports/enrollments", async (req, res): Promise<void> => {
  const courses = await db.select({
    id: coursesTable.id,
    title: coursesTable.title,
    isFree: coursesTable.isFree,
  }).from(coursesTable);

  const reportData = await Promise.all(courses.map(async (c) => {
    const enrolled = await db.select({ c: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, c.id));
    const completed = await db.select({ c: count() }).from(enrollmentsTable).where(sql`${enrollmentsTable.courseId} = ${c.id} AND ${enrollmentsTable.progress} = 100`);

    return {
      course: c.title,
      enrolled: Number(enrolled[0]?.c ?? 0),
      completed: Number(completed[0]?.c ?? 0),
      active: Number(enrolled[0]?.c ?? 0) - Number(completed[0]?.c ?? 0),
      free: c.isFree
    };
  }));

  res.json(reportData);
});

// 4. Revenue
router.get("/reports/revenue", async (req, res): Promise<void> => {
  const methods = ["EasyPaisa", "JazzCash", "Bank Transfer", "Card"];
  
  const reportData = await Promise.all(methods.map(async (m) => {
    const stats = await db.select({
      count: count(),
      total: sum(paymentsTable.amount),
    }).from(paymentsTable).where(eq(paymentsTable.method, m));

    const approved = await db.select({ c: count() }).from(paymentsTable).where(sql`${paymentsTable.method} = ${m} AND ${paymentsTable.status} = 'verified'`);
    const pending = await db.select({ c: count() }).from(paymentsTable).where(sql`${paymentsTable.method} = ${m} AND ${paymentsTable.status} = 'pending'`);

    return {
      method: m,
      transactions: Number(stats[0]?.count ?? 0),
      totalPKR: Number(stats[0]?.total ?? 0),
      approved: Number(approved[0]?.c ?? 0),
      pending: Number(pending[0]?.c ?? 0)
    };
  }));

  res.json(reportData);
});

// 5. Full Student List
router.get("/reports/full-list", async (req, res): Promise<void> => {
  const students = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    branchId: usersTable.branchId,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.role, "student")).orderBy(desc(usersTable.createdAt));

  const reportData = await Promise.all(students.map(async (s) => {
    const branch = s.branchId ? await db.select().from(branchesTable).where(eq(branchesTable.id, s.branchId)) : [];
    const enrollments = await db.select({ c: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.userId, s.id));

    return {
      name: s.name,
      email: s.email,
      branch: branch[0]?.name || "N/A",
      enrolled: Number(enrollments[0]?.c ?? 0),
      status: "Active",
      joined: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : "N/A"
    };
  }));

  res.json(reportData);
});

// PDF Export
router.post("/reports/export-pdf", async (req, res): Promise<void> => {
  const { title, headers, rows } = req.body;
  if (!title || !headers || !rows) { res.status(400).json({ error: "Missing data" }); return; }

  try {
    const html = generateReportHtml(title, headers, rows);
    const pdfBuffer = await generatePdf(html);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${title.toLowerCase().replace(/\s+/g, '-')}-report.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error("PDF Export failed:", error);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

export default router;
