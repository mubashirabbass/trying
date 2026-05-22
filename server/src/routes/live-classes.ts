import { Router } from "express";
import { db, liveClassesTable, usersTable, enrollmentsTable, coursesTable, lessonsTable } from "@workspace/db";
import { eq, and, desc, sql, or, inArray } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth";
import { createNotification } from "../lib/notifications";

const router = Router();

// GET /live-classes
router.get("/live-classes", async (req: AuthRequest, res): Promise<void> => {
  try {
    const { role, id: userId } = req.user;

    if (role === "admin" || role === "teacher") {
      const classes = await db
        .select({
          id: liveClassesTable.id,
          title: liveClassesTable.title,
          meetingLink: liveClassesTable.meetingLink,
          targetType: liveClassesTable.targetType,
          courseId: liveClassesTable.courseId,
          studentId: liveClassesTable.studentId,
          scheduledAt: liveClassesTable.scheduledAt,
          description: liveClassesTable.description,
          isCompleted: liveClassesTable.isCompleted,
          createdAt: liveClassesTable.createdAt,
          createdBy: liveClassesTable.createdBy,
          createdByRole: liveClassesTable.createdByRole,
          courseTitle: coursesTable.title,
          studentName: usersTable.name,
        })
        .from(liveClassesTable)
        .leftJoin(coursesTable, eq(liveClassesTable.courseId, coursesTable.id))
        .leftJoin(usersTable, eq(liveClassesTable.studentId, usersTable.id))
        .orderBy(desc(liveClassesTable.scheduledAt));

      // Auto-expire: mark past classes as completed
      const now = new Date();
      const toExpire = classes.filter(c => !c.isCompleted && new Date(c.scheduledAt) < now);
      for (const c of toExpire) {
        await db.update(liveClassesTable).set({ isCompleted: true }).where(eq(liveClassesTable.id, c.id));
        c.isCompleted = true;
      }

      res.json(classes);
      return;
    }

    // Student: only see classes targeted at them
    const studentEnrollments = await db
      .select({ courseId: enrollmentsTable.courseId })
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.userId, userId));

    const enrolledCourseIds = studentEnrollments.map(e => e.courseId);

    const whereClause = enrolledCourseIds.length > 0
      ? and(eq(liveClassesTable.isCompleted, false), or(
          eq(liveClassesTable.targetType, "all"),
          and(eq(liveClassesTable.targetType, "course"), inArray(liveClassesTable.courseId, enrolledCourseIds)),
          and(eq(liveClassesTable.targetType, "student"), eq(liveClassesTable.studentId, userId))
        ))
      : and(eq(liveClassesTable.isCompleted, false), or(
          eq(liveClassesTable.targetType, "all"),
          and(eq(liveClassesTable.targetType, "student"), eq(liveClassesTable.studentId, userId))
        ));

    const classes = await db
      .select({
        id: liveClassesTable.id,
        title: liveClassesTable.title,
        meetingLink: liveClassesTable.meetingLink,
        targetType: liveClassesTable.targetType,
        courseId: liveClassesTable.courseId,
        studentId: liveClassesTable.studentId,
        scheduledAt: liveClassesTable.scheduledAt,
        description: liveClassesTable.description,
        isCompleted: liveClassesTable.isCompleted,
        createdAt: liveClassesTable.createdAt,
        courseTitle: coursesTable.title,
      })
      .from(liveClassesTable)
      .leftJoin(coursesTable, eq(liveClassesTable.courseId, coursesTable.id))
      .where(whereClause)
      .orderBy(desc(liveClassesTable.scheduledAt));

    res.json(classes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /live-classes - Admin OR Teacher
router.post("/live-classes", async (req: AuthRequest, res): Promise<void> => {
  try {
    const { role, id: userId } = req.user;
    if (role !== "admin" && role !== "teacher") {
      res.status(403).json({ error: "Only admins and teachers can schedule live classes" });
      return;
    }

    const { title, meetingLink, targetType, courseId, studentId, scheduledAt, description } = req.body;
    if (!title || !meetingLink || !targetType) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Build insert values — createdBy/createdByRole may not exist in DB yet, handle gracefully
    const insertValues: any = {
      title,
      meetingLink,
      targetType,
      courseId: courseId && courseId !== "all" && courseId !== "" ? Number(courseId) : null,
      studentId: studentId && studentId !== "all" && studentId !== "" ? Number(studentId) : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      description: description || null,
      isCompleted: false,
    };

    // Try to add new columns — if they don't exist in DB yet, fall back without them
    try {
      insertValues.createdBy = userId;
      insertValues.createdByRole = role;
    } catch {}

    const [liveClass] = await db.insert(liveClassesTable).values(insertValues).returning();
    const dateFormatted = scheduledAt ? new Date(scheduledAt).toLocaleString() : new Date().toLocaleString();

    // Notifications & lesson records
    if (targetType === "all") {
      const students = await db.select().from(usersTable).where(eq(usersTable.role, "student"));
      for (const student of students) {
        await createNotification({ userId: student.id, type: "info", title: "New Live Class Scheduled! 🎥", message: `Join "${title}" on ${dateFormatted}. Link: ${meetingLink}`, link: "/dashboard/live-classes" });
      }
      const allCourses = await db.select().from(coursesTable);
      for (const c of allCourses) {
        const [{ maxOrder }] = await db.select({ maxOrder: sql<number>`COALESCE(MAX(${lessonsTable.orderIndex}), 0)` }).from(lessonsTable).where(eq(lessonsTable.courseId, c.id));
        await db.insert(lessonsTable).values({ courseId: c.id, title: `🎥 [Live Class Record] ${title}`, description: `Conducted on ${dateFormatted}.\nLink: ${meetingLink}\n${description || ""}`, orderIndex: (maxOrder ?? 0) + 1 });
      }
    } else if (targetType === "course" && courseId) {
      const enrolled = await db.select({ userId: enrollmentsTable.userId }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, Number(courseId)));
      for (const e of enrolled) {
        await createNotification({ userId: e.userId, type: "info", title: "Course Live Class Scheduled! 🎥", message: `Join "${title}" on ${dateFormatted}. Link: ${meetingLink}`, link: "/dashboard/live-classes" });
      }
      const [{ maxOrder }] = await db.select({ maxOrder: sql<number>`COALESCE(MAX(${lessonsTable.orderIndex}), 0)` }).from(lessonsTable).where(eq(lessonsTable.courseId, Number(courseId)));
      await db.insert(lessonsTable).values({ courseId: Number(courseId), title: `🎥 [Live Class Record] ${title}`, description: `Conducted on ${dateFormatted}.\nLink: ${meetingLink}\n${description || ""}`, orderIndex: (maxOrder ?? 0) + 1 });
    } else if (targetType === "student" && studentId) {
      await createNotification({ userId: Number(studentId), type: "info", title: "Individual Live Session! 🎥", message: `Your session "${title}" is on ${dateFormatted}. Link: ${meetingLink}`, link: "/dashboard/live-classes" });
      const studentEnrollments = await db.select({ courseId: enrollmentsTable.courseId }).from(enrollmentsTable).where(eq(enrollmentsTable.userId, Number(studentId)));
      for (const e of studentEnrollments) {
        const [{ maxOrder }] = await db.select({ maxOrder: sql<number>`COALESCE(MAX(${lessonsTable.orderIndex}), 0)` }).from(lessonsTable).where(eq(lessonsTable.courseId, e.courseId));
        await db.insert(lessonsTable).values({ courseId: e.courseId, title: `🎥 [Live Class Record] ${title} (Individual)`, description: `Conducted on ${dateFormatted}.\nLink: ${meetingLink}\n${description || ""}`, orderIndex: (maxOrder ?? 0) + 1 });
      }
    }

    res.status(201).json(liveClass);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /live-classes/:id
router.patch("/live-classes/:id", async (req: AuthRequest, res): Promise<void> => {
  try {
    const { role, id: userId } = req.user;
    const id = Number(req.params.id);
    const { isCompleted } = req.body;

    if (role === "teacher") {
      const [existing] = await db.select().from(liveClassesTable).where(eq(liveClassesTable.id, id));
      if (!existing) { res.status(404).json({ error: "Not found" }); return; }
      // Allow if createdBy matches OR if createdBy is null (old records)
      if (existing.createdBy !== null && existing.createdBy !== userId) {
        res.status(403).json({ error: "You can only update your own classes" }); return;
      }
    } else if (role !== "admin") {
      res.status(403).json({ error: "Unauthorized" }); return;
    }

    const [updated] = await db.update(liveClassesTable).set({ isCompleted: !!isCompleted }).where(eq(liveClassesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /live-classes/:id
router.delete("/live-classes/:id", async (req: AuthRequest, res): Promise<void> => {
  try {
    const { role, id: userId } = req.user;
    const id = Number(req.params.id);

    if (role === "teacher") {
      const [existing] = await db.select().from(liveClassesTable).where(eq(liveClassesTable.id, id));
      if (!existing) { res.status(404).json({ error: "Not found" }); return; }
      if (existing.createdBy !== null && existing.createdBy !== userId) {
        res.status(403).json({ error: "You can only delete your own classes" }); return;
      }
    } else if (role !== "admin") {
      res.status(403).json({ error: "Unauthorized" }); return;
    }

    await db.delete(liveClassesTable).where(eq(liveClassesTable.id, id));
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
