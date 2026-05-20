import { Router, type IRouter } from "express";
import { db, usersTable, coursesTable, enrollmentsTable, paymentsTable, quizResultsTable, assignmentSubmissionsTable, branchesTable } from "@workspace/db";
import { eq, desc, sql, count, avg, sum } from "drizzle-orm";
import { generatePdf, generateReportHtml } from "../lib/pdf";
import { logger } from "../lib/logger";

import { authenticate, authorize } from "../middleware/auth";

const router: IRouter = Router();

// Apply security to all report routes
router.use(authenticate);

// 6. Detailed Student Progress PDF (Accessed by Student or Admin)
router.get("/reports/students/:userId/progress", async (req: any, res): Promise<void> => {
  const userId = Number(req.params.userId);
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid userId" }); return; }

  // Only Admin or the User themselves can access this
  if (req.user?.role !== "admin" && req.user?.id !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  
  try {
    const [student] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!student) { res.status(404).json({ error: "Student not found" }); return; }

    const enrollments = await db.select({
      id: enrollmentsTable.id,
      courseId: enrollmentsTable.courseId,
      progress: enrollmentsTable.progress,
      courseName: coursesTable.title,
    }).from(enrollmentsTable)
      .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
      .where(eq(enrollmentsTable.userId, userId));

    const quizResults = await db.select().from(quizResultsTable).where(eq(quizResultsTable.userId, userId));
    const assignments = await db.select().from(assignmentSubmissionsTable).where(eq(assignmentSubmissionsTable.userId, userId));

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Student Progress Report - ${student.name}</title>
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 4px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 28px; font-weight: bold; margin: 0; }
          .student-info { margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #2563eb; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 10px; border-bottom: 2px solid #eee; background: #f8fafc; font-size: 12px; }
          td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .progress-bar { height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden; width: 100px; }
          .progress-fill { height: 100%; background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="color: #2563eb; font-weight: 900; margin-bottom: 10px;">GLOBAL COLLEGE</div>
          <h1 class="title">Academic Progress Report</h1>
        </div>

        <div class="student-info">
          <div>
            <p><strong>Name:</strong> ${student.name}</p>
            <p><strong>Email:</strong> ${student.email}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Student ID:</strong> GC-${student.id}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Course Enrollments</div>
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${enrollments.map(e => `
                <tr>
                  <td>${e.courseName}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <div class="progress-bar"><div class="progress-fill" style="width: ${e.progress}%"></div></div>
                      <span>${e.progress}%</span>
                    </div>
                  </td>
                  <td>${e.progress === 100 ? 'Completed' : 'In Progress'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Quiz Results</div>
          <table>
            <thead>
              <tr>
                <th>Quiz</th>
                <th>Score</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              ${quizResults.map(r => `
                <tr>
                  <td>Quiz ID: ${r.quizId}</td>
                  <td>${r.percentage}%</td>
                  <td style="color: ${r.passed ? '#10b981' : '#ef4444'}">${r.passed ? 'PASSED' : 'FAILED'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    const pdfBuffer = await generatePdf(html);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=progress-report-${student.id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error("Student Progress PDF Export failed:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// Admin-only reports below this line
// 1. Branch Overview
router.get("/reports/branch", authorize("admin"), async (req, res): Promise<void> => {
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
router.get("/reports/students", authorize("admin"), async (req, res): Promise<void> => {
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
router.get("/reports/enrollments", authorize("admin"), async (req, res): Promise<void> => {
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
router.get("/reports/revenue", authorize("admin"), async (req, res): Promise<void> => {
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
router.get("/reports/full-list", authorize("admin"), async (req, res): Promise<void> => {
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
router.post("/reports/export-pdf", authorize("admin"), async (req, res): Promise<void> => {
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

// Excel Export
router.post("/reports/export-excel", authorize("admin"), async (req, res): Promise<void> => {
  const { title, headers, rows } = req.body;
  if (!title || !headers || !rows) { res.status(400).json({ error: "Missing data" }); return; }

  try {
    const { default: ExcelJS } = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title);

    // Style the header
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' } // Primary Blue
      };
      cell.font = {
        color: { argb: 'FFFFFFFF' },
        bold: true
      };
    });

    // Add rows
    worksheet.addRows(rows);

    // Auto-fit columns (simplified)
    worksheet.columns.forEach((col: any) => {
      col.width = 20;
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${title.toLowerCase().replace(/\s+/g, '-')}-report.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error("Excel Export failed:", error);
    res.status(500).json({ error: "Excel generation failed" });
  }
});

export default router;
