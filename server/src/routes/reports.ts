import { Router, type IRouter } from "express";
import { 
  db, 
  usersTable, 
  coursesTable, 
  enrollmentsTable, 
  paymentsTable, 
  quizResultsTable, 
  assignmentSubmissionsTable, 
  branchesTable,
  teacherAttendanceTable,
  installmentLedgerTable
} from "@workspace/db";
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
  try {
    const branches = await db.select({
      id: branchesTable.id,
      name: branchesTable.name,
      city: branchesTable.city,
    }).from(branchesTable);

    const studentCounts = await db.select({
      branchId: usersTable.branchId,
      c: count(usersTable.id)
    }).from(usersTable).where(eq(usersTable.role, "student")).groupBy(usersTable.branchId);
    const studentCountMap = Object.fromEntries(studentCounts.map(r => [r.branchId, Number(r.c)]));

    const activeEnrollments = await db.select({
      branchId: usersTable.branchId,
      c: count(enrollmentsTable.id)
    }).from(enrollmentsTable)
      .leftJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id))
      .groupBy(usersTable.branchId);
    const activeEnrollmentsMap = Object.fromEntries(activeEnrollments.map(r => [r.branchId, Number(r.c)]));

    const branchCourses = await db.select({
      branchId: usersTable.branchId,
      c: sql<number>`count(distinct ${enrollmentsTable.courseId})`
    }).from(enrollmentsTable)
      .leftJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id))
      .groupBy(usersTable.branchId);
    const branchCoursesMap = Object.fromEntries(branchCourses.map(r => [r.branchId, Number(r.c)]));

    const reportData = branches.map((b) => ({
      name: b.name,
      city: b.city,
      students: studentCountMap[b.id] ?? 0,
      active: activeEnrollmentsMap[b.id] ?? 0,
      courses: branchCoursesMap[b.id] ?? 0
    }));

    res.json(reportData);
  } catch (error) {
    logger.error("Branch report failed:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// 2. Student Progress
router.get("/reports/students", authorize("admin"), async (req, res): Promise<void> => {
  try {
    const students = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      branchName: branchesTable.name,
    })
    .from(usersTable)
    .leftJoin(branchesTable, eq(usersTable.branchId, branchesTable.id))
    .where(eq(usersTable.role, "student"));

    const userEnrollments = await db.select({
      userId: enrollmentsTable.userId,
      count: count(enrollmentsTable.id),
      avgProgress: avg(enrollmentsTable.progress),
    }).from(enrollmentsTable).groupBy(enrollmentsTable.userId);
    const enrollMap = Object.fromEntries(userEnrollments.map(e => [e.userId, {
      count: Number(e.count || 0),
      avgProgress: Math.round(Number(e.avgProgress || 0))
    }]));

    const quizAverages = await db.select({
      userId: quizResultsTable.userId,
      avgPercentage: avg(quizResultsTable.percentage),
    }).from(quizResultsTable).groupBy(quizResultsTable.userId);
    const quizMap = Object.fromEntries(quizAverages.map(q => [q.userId, Math.round(Number(q.avgPercentage || 0))]));

    const assignmentAverages = await db.select({
      userId: assignmentSubmissionsTable.userId,
      avgMarks: avg(assignmentSubmissionsTable.marks),
    }).from(assignmentSubmissionsTable).groupBy(assignmentSubmissionsTable.userId);
    const assignmentMap = Object.fromEntries(assignmentAverages.map(a => [a.userId, Math.round(Number(a.avgMarks || 0))]));

    const reportData = students.map(s => {
      const enroll = enrollMap[s.id] || { count: 0, avgProgress: 0 };
      return {
        name: s.name,
        branch: s.branchName || "N/A",
        courses: enroll.count,
        completion: `${enroll.avgProgress}%`,
        quizAvg: `${quizMap[s.id] || 0}%`,
        assignAvg: `${assignmentMap[s.id] || 0}%`
      };
    });

    res.json(reportData);
  } catch (error) {
    logger.error("Students progress report failed:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// 3. Enrollments
router.get("/reports/enrollments", authorize("admin"), async (req, res): Promise<void> => {
  try {
    const courses = await db.select({
      id: coursesTable.id,
      title: coursesTable.title,
      isFree: coursesTable.isFree,
    }).from(coursesTable);

    const enrollmentsCount = await db.select({
      courseId: enrollmentsTable.courseId,
      total: count(enrollmentsTable.id),
      completed: sum(sql`case when ${enrollmentsTable.progress} = 100 then 1 else 0 end`),
    }).from(enrollmentsTable).groupBy(enrollmentsTable.courseId);
    const countsMap = Object.fromEntries(enrollmentsCount.map(e => [e.courseId, {
      total: Number(e.total || 0),
      completed: Number(e.completed || 0)
    }]));

    const reportData = courses.map(c => {
      const counts = countsMap[c.id] || { total: 0, completed: 0 };
      return {
        course: c.title,
        enrolled: counts.total,
        completed: counts.completed,
        active: counts.total - counts.completed,
        free: c.isFree
      };
    });

    res.json(reportData);
  } catch (error) {
    logger.error("Enrollments report failed:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// 4. Revenue
router.get("/reports/revenue", authorize("admin"), async (req, res): Promise<void> => {
  try {
    const stats = await db.select({
      method: paymentsTable.method,
      count: count(paymentsTable.id),
      total: sum(paymentsTable.amount),
      approved: sum(sql`case when ${paymentsTable.status} = 'approved' or ${paymentsTable.status} = 'verified' then 1 else 0 end`),
      pending: sum(sql`case when ${paymentsTable.status} = 'pending' then 1 else 0 end`),
    }).from(paymentsTable).groupBy(paymentsTable.method);

    const statsMap = Object.fromEntries(stats.map(s => [s.method, s]));
    const methods = ["EasyPaisa", "JazzCash", "Bank Transfer", "Card"];
    const reportData = methods.map(m => {
      const s = statsMap[m] || { count: 0, total: 0, approved: 0, pending: 0 };
      return {
        method: m,
        transactions: Number(s.count || 0),
        totalPKR: Number(s.total || 0),
        approved: Number(s.approved || 0),
        pending: Number(s.pending || 0)
      };
    });

    res.json(reportData);
  } catch (error) {
    logger.error("Revenue report failed:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// 5. Full Student List
router.get("/reports/full-list", authorize("admin"), async (req, res): Promise<void> => {
  try {
    const students = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      branchName: branchesTable.name,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .leftJoin(branchesTable, eq(usersTable.branchId, branchesTable.id))
    .where(eq(usersTable.role, "student"))
    .orderBy(desc(usersTable.createdAt));

    const enrollCounts = await db.select({
      userId: enrollmentsTable.userId,
      c: count(),
    }).from(enrollmentsTable).groupBy(enrollmentsTable.userId);
    const countMap = Object.fromEntries(enrollCounts.map(e => [e.userId, Number(e.c)]));

    const reportData = students.map(s => ({
      name: s.name,
      email: s.email,
      branch: s.branchName || "N/A",
      enrolled: countMap[s.id] ?? 0,
      status: "Active",
      joined: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : "N/A"
    }));

    res.json(reportData);
  } catch (error) {
    logger.error("Full Student List report failed:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// 6. Student Performance Analysis
router.get("/reports/student-performance", authorize("admin"), async (req, res): Promise<void> => {
  try {
    const students = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      branchName: branchesTable.name,
    })
    .from(usersTable)
    .leftJoin(branchesTable, eq(usersTable.branchId, branchesTable.id))
    .where(eq(usersTable.role, "student"));

    const userEnrollments = await db.select({
      userId: enrollmentsTable.userId,
      count: count(enrollmentsTable.id),
      avgProgress: avg(enrollmentsTable.progress),
    }).from(enrollmentsTable).groupBy(enrollmentsTable.userId);
    const enrollMap = Object.fromEntries(userEnrollments.map(e => [e.userId, {
      count: Number(e.count || 0),
      avgProgress: Math.round(Number(e.avgProgress || 0))
    }]));

    const quizAverages = await db.select({
      userId: quizResultsTable.userId,
      avgPercentage: avg(quizResultsTable.percentage),
    }).from(quizResultsTable).groupBy(quizResultsTable.userId);
    const quizMap = Object.fromEntries(quizAverages.map(q => [q.userId, Math.round(Number(q.avgPercentage || 0))]));

    const assignmentAverages = await db.select({
      userId: assignmentSubmissionsTable.userId,
      avgMarks: avg(assignmentSubmissionsTable.marks),
    }).from(assignmentSubmissionsTable).groupBy(assignmentSubmissionsTable.userId);
    const assignmentMap = Object.fromEntries(assignmentAverages.map(a => [a.userId, Math.round(Number(a.avgMarks || 0))]));

    const reportData = students.map(s => {
      const enroll = enrollMap[s.id] || { count: 0, avgProgress: 0 };
      return {
        name: s.name,
        branch: s.branchName || "N/A",
        courses: enroll.count,
        quizAvg: `${quizMap[s.id] || 0}%`,
        assignAvg: `${assignmentMap[s.id] || 0}%`,
        completion: `${enroll.avgProgress}%`
      };
    });

    res.json(reportData);
  } catch (error) {
    logger.error("Student performance report failed:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// 7. Teacher Attendance Report
router.get("/reports/teacher-attendance", authorize("admin"), async (req, res): Promise<void> => {
  try {
    const teachers = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      branchName: branchesTable.name,
    })
    .from(usersTable)
    .leftJoin(branchesTable, eq(usersTable.branchId, branchesTable.id))
    .where(eq(usersTable.role, "teacher"));

    const attendanceStats = await db.select({
      teacherId: teacherAttendanceTable.teacherId,
      totalDays: count(teacherAttendanceTable.id),
      present: sum(sql`case when ${teacherAttendanceTable.status} = 'present' then 1 else 0 end`),
      absent: sum(sql`case when ${teacherAttendanceTable.status} = 'absent' then 1 else 0 end`),
    }).from(teacherAttendanceTable).groupBy(teacherAttendanceTable.teacherId);
    const attMap = Object.fromEntries(attendanceStats.map(a => [a.teacherId, {
      totalDays: Number(a.totalDays || 0),
      present: Number(a.present || 0),
      absent: Number(a.absent || 0)
    }]));

    const reportData = teachers.map(t => {
      const att = attMap[t.id] || { totalDays: 0, present: 0, absent: 0 };
      const rate = att.totalDays > 0 ? Math.round((att.present / att.totalDays) * 100) : 100;
      return {
        name: t.name,
        branch: t.branchName || "N/A",
        totalDays: att.totalDays,
        present: att.present,
        absent: att.absent,
        rate: `${rate}%`
      };
    });

    res.json(reportData);
  } catch (error) {
    logger.error("Teacher attendance report failed:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// 8. Fee Installments ledger Report
router.get("/reports/fee-installments", authorize("admin"), async (req, res): Promise<void> => {
  try {
    const ledgers = await db.select({
      id: installmentLedgerTable.id,
      studentName: usersTable.name,
      courseName: coursesTable.title,
      month: installmentLedgerTable.monthNumber,
      amount: installmentLedgerTable.installmentAmount,
      paid: installmentLedgerTable.totalPaid,
      remaining: installmentLedgerTable.remainingBalance,
      status: installmentLedgerTable.status,
    })
    .from(installmentLedgerTable)
    .leftJoin(usersTable, eq(installmentLedgerTable.userId, usersTable.id))
    .leftJoin(coursesTable, eq(installmentLedgerTable.courseId, coursesTable.id))
    .orderBy(desc(installmentLedgerTable.createdAt));

    const reportData = ledgers.map(l => ({
      studentName: l.studentName || "Unknown",
      courseName: l.courseName || "Unknown",
      month: `Month ${l.month}`,
      amount: l.amount,
      paid: l.paid,
      remaining: l.remaining,
      status: l.status ? l.status.toUpperCase() : "UNPAID"
    }));

    res.json(reportData);
  } catch (error) {
    logger.error("Fee installments report failed:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// 9. Course Revenue Breakdown
router.get("/reports/course-revenue", authorize("admin"), async (req, res): Promise<void> => {
  try {
    const courses = await db.select({
      id: coursesTable.id,
      title: coursesTable.title,
      fee: coursesTable.fee,
      isFree: coursesTable.isFree,
    }).from(coursesTable);

    const enrollmentCounts = await db.select({
      courseId: enrollmentsTable.courseId,
      c: count(enrollmentsTable.id),
    }).from(enrollmentsTable).groupBy(enrollmentsTable.courseId);
    const enrollMap = Object.fromEntries(enrollmentCounts.map(e => [e.courseId, Number(e.c || 0)]));

    const collectedPayments = await db.select({
      courseId: paymentsTable.courseId,
      total: sum(paymentsTable.amount),
    })
    .from(paymentsTable)
    .where(sql`${paymentsTable.status} = 'approved' or ${paymentsTable.status} = 'verified'`)
    .groupBy(paymentsTable.courseId);
    const collectMap = Object.fromEntries(collectedPayments.map(p => [p.courseId, Number(p.total || 0)]));

    const reportData = courses.map(c => {
      const enrolled = enrollMap[c.id] || 0;
      const collected = collectMap[c.id] || 0;
      const expected = c.isFree ? 0 : enrolled * c.fee;
      return {
        course: c.title,
        enrolled,
        fee: c.isFree ? 0 : c.fee,
        expected,
        collected,
        pending: Math.max(0, expected - collected)
      };
    });

    res.json(reportData);
  } catch (error) {
    logger.error("Course revenue report failed:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// 10. Monthly Trends Report
router.get("/reports/monthly-trends", authorize("admin"), async (req, res): Promise<void> => {
  try {
    const enrollmentsByMonth = await db.select({
      monthStr: sql<string>`to_char(${enrollmentsTable.enrolledAt}, 'YYYY-MM')`,
      c: count(enrollmentsTable.id)
    }).from(enrollmentsTable).groupBy(sql`to_char(${enrollmentsTable.enrolledAt}, 'YYYY-MM')`);

    const paymentsByMonth = await db.select({
      monthStr: sql<string>`to_char(${paymentsTable.createdAt}, 'YYYY-MM')`,
      transactions: count(paymentsTable.id),
      total: sum(paymentsTable.amount),
    })
    .from(paymentsTable)
    .where(sql`${paymentsTable.status} = 'approved' or ${paymentsTable.status} = 'verified'`)
    .groupBy(sql`to_char(${paymentsTable.createdAt}, 'YYYY-MM')`);

    const allMonths = Array.from(new Set([
      ...enrollmentsByMonth.map(e => e.monthStr),
      ...paymentsByMonth.map(p => p.monthStr)
    ])).filter(Boolean).sort().reverse();

    const enrollMap = Object.fromEntries(enrollmentsByMonth.map(e => [e.monthStr, e.c]));
    const payMap = Object.fromEntries(paymentsByMonth.map(p => [p.monthStr, p]));

    const reportData = allMonths.map(m => {
      const pay = payMap[m] || { transactions: 0, total: 0 };
      return {
        month: m,
        enrollments: Number(enrollMap[m] || 0),
        transactions: Number(pay.transactions || 0),
        revenue: Number(pay.total || 0)
      };
    });

    res.json(reportData);
  } catch (error) {
    logger.error("Monthly trends report failed:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
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
