import { Router, type IRouter } from "express";
import { db, attendanceTable, enrollmentsTable, usersTable, coursesTable } from "@workspace/db";
import { eq, and, sql, inArray } from "drizzle-orm";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

const parseRouteNumber = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? parseInt(raw, 10) : NaN;
};

// Get attendance for a course (Admin/Teacher view)
router.get("/attendance/course/:courseId", authenticate, authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  const courseId = parseRouteNumber(req.params.courseId);
  if (isNaN(courseId)) { res.status(400).json({ error: "Invalid courseId" }); return; }

  // Verify teacher ownership if it's a teacher
  if (req.user?.role === "teacher") {
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
    if (!course || course.teacherId !== req.user.id) {
      res.status(403).json({ error: "Unauthorized access to this course" });
      return;
    }
  }

  const { date } = req.query;
  let conditions = [eq(attendanceTable.courseId, courseId)];
  if (date && typeof date === "string") {
    conditions.push(eq(attendanceTable.date, date));
  }

  const records = await db
    .select({
      id: attendanceTable.id,
      userId: attendanceTable.userId,
      courseId: attendanceTable.courseId,
      date: attendanceTable.date,
      status: attendanceTable.status,
      notes: attendanceTable.notes,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(attendanceTable)
    .leftJoin(usersTable, eq(attendanceTable.userId, usersTable.id))
    .where(and(...conditions))
    .orderBy(attendanceTable.date);

  res.json(records);
});

// Get enrolled students for a course (used for marking attendance sheet)
router.get("/attendance/course/:courseId/students", authenticate, authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  const courseId = parseRouteNumber(req.params.courseId);
  if (isNaN(courseId)) { res.status(400).json({ error: "Invalid courseId" }); return; }

  if (req.user?.role === "teacher") {
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
    if (!course || course.teacherId !== req.user.id) {
      res.status(403).json({ error: "Unauthorized access to this course" });
      return;
    }
  }

  const students = await db
    .select({
      userId:  enrollmentsTable.userId,
      name:    usersTable.name,
      email:   usersTable.email,
      rollNo:  usersTable.rollNo,
      regNo:   usersTable.regNo,
    })
    .from(enrollmentsTable)
    .leftJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id))
    .where(and(
      eq(enrollmentsTable.courseId, courseId),
      inArray(enrollmentsTable.status, ["active", "pending", "completed"])
    ))
    .orderBy(usersTable.rollNo);   // sort by roll number in ascending order

  res.json(students);
});

// Bulk upsert attendance records
router.post("/attendance/bulk", authenticate, authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  const { courseId, date, records } = req.body;
  
  if (!courseId || !date || !Array.isArray(records)) {
    res.status(400).json({ error: "courseId, date, and records array are required" });
    return;
  }

  try {
    // Basic permissions check for teacher
    if (req.user?.role === "teacher") {
      const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
      if (!course || course.teacherId !== req.user.id) {
        res.status(403).json({ error: "Unauthorized access to this course" });
        return;
      }
    }

    const recordedById = req.user?.id;

    // For each record, upsert (insert or update based on user+course+date)
    // Drizzle doesn't have a clean bulk upsert on multiple composite keys without unique constraints defined at DB level easily.
    // Instead we can fetch existing, delete them, and insert new, OR fetch existing and do an update, and insert missing.
    // Easiest is to delete existing for this course and date, then insert all.
    await db.delete(attendanceTable)
      .where(and(
        eq(attendanceTable.courseId, courseId),
        eq(attendanceTable.date, date)
      ));

    if (records.length > 0) {
      const toInsert = records.map((r: any) => ({
        userId: r.userId,
        courseId,
        date,
        status: r.status,
        notes: r.notes || null,
        recordedById
      }));

      await db.insert(attendanceTable).values(toInsert);
    }

    res.json({ success: true, message: "Attendance saved successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get attendance for a student (Student view)
router.get("/attendance/my", authenticate, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { courseId } = req.query;
  let conditions = [eq(attendanceTable.userId, userId)];
  if (courseId && !isNaN(Number(courseId))) {
    conditions.push(eq(attendanceTable.courseId, Number(courseId)));
  }

  const records = await db
    .select({
      id: attendanceTable.id,
      courseId: attendanceTable.courseId,
      courseName: coursesTable.title,
      date: attendanceTable.date,
      status: attendanceTable.status,
    })
    .from(attendanceTable)
    .leftJoin(coursesTable, eq(attendanceTable.courseId, coursesTable.id))
    .where(and(...conditions))
    .orderBy(attendanceTable.date);

  // Return a summary as well
  const courseSummary: Record<number, { courseName: string, present: number, total: number }> = {};
  
  for (const r of records) {
    if (!courseSummary[r.courseId]) {
      courseSummary[r.courseId] = { courseName: r.courseName || "Unknown", present: 0, total: 0 };
    }
    courseSummary[r.courseId].total += 1;
    if (r.status === "present" || r.status === "late") {
      courseSummary[r.courseId].present += 1;
    }
  }

  const summary = Object.entries(courseSummary).map(([cId, stats]) => ({
    courseId: Number(cId),
    courseName: stats.courseName,
    present: stats.present,
    total: stats.total,
    percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
  }));

  res.json({ records, summary });
});

export default router;
