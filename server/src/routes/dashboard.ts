import { Router, type IRouter } from "express";
import { db, usersTable, coursesTable, enrollmentsTable, paymentsTable, certificatesTable, assignmentsTable, assignmentSubmissionsTable } from "@workspace/db";
import { eq, count, sum } from "drizzle-orm";
import { GetStudentDashboardQueryParams, GetTeacherDashboardQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/admin", async (req, res): Promise<void> => {
  const students = await db.select({ c: count() }).from(usersTable).where(eq(usersTable.role, "student"));
  const teachers = await db.select({ c: count() }).from(usersTable).where(eq(usersTable.role, "teacher"));
  const courses = await db.select({ c: count() }).from(coursesTable);
  const enrollments = await db.select({ c: count() }).from(enrollmentsTable);
  const revenue = await db.select({ total: sum(paymentsTable.amount) }).from(paymentsTable).where(eq(paymentsTable.status, "verified"));
  const pendingPayments = await db.select({ c: count() }).from(paymentsTable).where(eq(paymentsTable.status, "pending"));

  const recentEnrollments = await db.select({
    id: enrollmentsTable.id,
    userId: enrollmentsTable.userId,
    courseId: enrollmentsTable.courseId,
    progress: enrollmentsTable.progress,
    status: enrollmentsTable.status,
    enrolledAt: enrollmentsTable.enrolledAt,
    courseName: coursesTable.title,
    userName: usersTable.name,
  }).from(enrollmentsTable)
    .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
    .leftJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id))
    .limit(5);

  const recentPayments = await db.select({
    id: paymentsTable.id,
    userId: paymentsTable.userId,
    courseId: paymentsTable.courseId,
    amount: paymentsTable.amount,
    method: paymentsTable.method,
    status: paymentsTable.status,
    receiptUrl: paymentsTable.receiptUrl,
    createdAt: paymentsTable.createdAt,
    userName: usersTable.name,
    courseName: coursesTable.title,
  }).from(paymentsTable)
    .leftJoin(usersTable, eq(paymentsTable.userId, usersTable.id))
    .leftJoin(coursesTable, eq(paymentsTable.courseId, coursesTable.id))
    .limit(5);

  const coursesByCategory = await db.select({ category: coursesTable.category, count: count() })
    .from(coursesTable).groupBy(coursesTable.category);

  res.json({
    totalStudents: Number(students[0]?.c ?? 0),
    totalTeachers: Number(teachers[0]?.c ?? 0),
    totalCourses: Number(courses[0]?.c ?? 0),
    totalEnrollments: Number(enrollments[0]?.c ?? 0),
    totalRevenue: Number(revenue[0]?.total ?? 0),
    pendingPayments: Number(pendingPayments[0]?.c ?? 0),
    recentEnrollments,
    recentPayments,
    coursesByCategory: coursesByCategory.map(c => ({ category: c.category, count: Number(c.count) })),
  });
});

router.get("/dashboard/student", async (req, res): Promise<void> => {
  const params = GetStudentDashboardQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const userId = Number(params.data.userId);

  const enrolled = await db.select({ c: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.userId, userId));
  const completed = await db.select({ c: count() }).from(enrollmentsTable)
    .where(eq(enrollmentsTable.userId, userId));
  const certificates = await db.select({ c: count() }).from(certificatesTable).where(eq(certificatesTable.userId, userId));

  const pendingSubmissions = await db.select({ c: count() }).from(assignmentSubmissionsTable)
    .where(eq(assignmentSubmissionsTable.userId, userId));

  res.json({
    enrolledCourses: Number(enrolled[0]?.c ?? 0),
    completedCourses: 0,
    certificates: Number(certificates[0]?.c ?? 0),
    overallProgress: 0,
    pendingAssignments: Number(pendingSubmissions[0]?.c ?? 0),
    recentActivity: [],
  });
});

router.get("/dashboard/teacher", async (req, res): Promise<void> => {
  const params = GetTeacherDashboardQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const userId = Number(params.data.userId);

  const courses = await db.select({ c: count() }).from(coursesTable).where(eq(coursesTable.teacherId, userId));
  const coursesList = await db.select({ id: coursesTable.id }).from(coursesTable).where(eq(coursesTable.teacherId, userId));
  const courseIds = coursesList.map(c => c.id);

  const enrollmentCount = courseIds.length > 0
    ? await db.select({ c: count() }).from(enrollmentsTable)
    : [{ c: 0 }];

  const recentSubmissions = await db.select().from(assignmentSubmissionsTable).limit(5);

  res.json({
    totalCourses: Number(courses[0]?.c ?? 0),
    totalStudents: Number(enrollmentCount[0]?.c ?? 0),
    pendingAssignments: recentSubmissions.filter(s => s.status === "submitted").length,
    averageRating: 4.5,
    recentSubmissions,
  });
});

export default router;
