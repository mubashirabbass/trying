import { Router } from "express";
import { db, liveClassesTable, usersTable, enrollmentsTable, coursesTable, lessonsTable } from "@workspace/db";
import { eq, and, desc, sql, or, inArray } from "drizzle-orm";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { createNotification } from "../lib/notifications";

const router = Router();

// GET /live-classes - List live classes (filtered by target criteria for students, full access for staff)
router.get("/live-classes", authenticate, async (req: AuthRequest, res): Promise<void> => {
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
          courseTitle: coursesTable.title,
          studentName: usersTable.name,
        })
        .from(liveClassesTable)
        .leftJoin(coursesTable, eq(liveClassesTable.courseId, coursesTable.id))
        .leftJoin(usersTable, eq(liveClassesTable.studentId, usersTable.id))
        .orderBy(desc(liveClassesTable.scheduledAt));

      res.json(classes);
    } else {
      // Get student's enrolled courses
      const studentEnrollments = await db
        .select({ courseId: enrollmentsTable.courseId })
        .from(enrollmentsTable)
        .where(eq(enrollmentsTable.userId, userId));
      
      const enrolledCourseIds = studentEnrollments.map(e => e.courseId);

      let classes;
      if (enrolledCourseIds.length > 0) {
        // Targeted to all OR targeted to student's course OR targeted to student specifically
        classes = await db
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
          .where(
            and(
              eq(liveClassesTable.isCompleted, false),
              or(
                eq(liveClassesTable.targetType, "all"),
                and(eq(liveClassesTable.targetType, "course"), inArray(liveClassesTable.courseId, enrolledCourseIds)),
                and(eq(liveClassesTable.targetType, "student"), eq(liveClassesTable.studentId, userId))
              )
            )
          )
          .orderBy(desc(liveClassesTable.scheduledAt));
      } else {
        classes = await db
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
          .where(
            and(
              eq(liveClassesTable.isCompleted, false),
              or(
                eq(liveClassesTable.targetType, "all"),
                and(eq(liveClassesTable.targetType, "student"), eq(liveClassesTable.studentId, userId))
              )
            )
          )
          .orderBy(desc(liveClassesTable.scheduledAt));
      }

      res.json(classes);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /live-classes - Admin schedules/creates a new live class
router.post("/live-classes", authenticate, authorize("admin"), async (req: AuthRequest, res): Promise<void> => {
  try {
    const { title, meetingLink, targetType, courseId, studentId, scheduledAt, description } = req.body;

    if (!title || !meetingLink || !targetType) {
      res.status(400).json({ error: "Missing required fields (title, meetingLink, targetType)" });
      return;
    }

    const [liveClass] = await db
      .insert(liveClassesTable)
      .values({
        title,
        meetingLink,
        targetType,
        courseId: courseId && courseId !== "all" && courseId !== "" ? Number(courseId) : null,
        studentId: studentId && studentId !== "all" && studentId !== "" ? Number(studentId) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        description: description || null,
        isCompleted: false
      })
      .returning();

    const dateFormatted = scheduledAt ? new Date(scheduledAt).toLocaleString() : new Date().toLocaleString();

    // ───── Notification Dispatch and Course Lesson Registry ─────
    if (targetType === "all") {
      // 1. Get all students
      const students = await db.select().from(usersTable).where(eq(usersTable.role, "student"));
      
      // 2. Dispatch notifications
      for (const student of students) {
        await createNotification({
          userId: student.id,
          type: "info",
          title: "New Live Class Scheduled! 🎥",
          message: `Join live class "${title}" on ${dateFormatted}. Link: ${meetingLink}`,
          link: "/dashboard/live-classes"
        });
      }

      // 3. Register a text lesson in ALL courses to serve as a history record
      const courses = await db.select().from(coursesTable);
      for (const c of courses) {
        const maxOrder = await db
          .select({ maxOrder: sql<number>`COALESCE(MAX(${lessonsTable.orderIndex}), 0)` })
          .from(lessonsTable)
          .where(eq(lessonsTable.courseId, c.id));
        
        await db.insert(lessonsTable).values({
          courseId: c.id,
          title: `🎥 [Live Class Record] ${title}`,
          description: `An online live class was conducted on ${dateFormatted}.\nMeeting Link: ${meetingLink}\nDetails: ${description || "No further details provided."}`,
          orderIndex: (maxOrder[0]?.maxOrder ?? 0) + 1,
        });
      }
    } else if (targetType === "course" && courseId && courseId !== "all") {
      // 1. Get all enrolled students
      const enrollments = await db
        .select({ userId: enrollmentsTable.userId })
        .from(enrollmentsTable)
        .where(eq(enrollmentsTable.courseId, Number(courseId)));

      // 2. Dispatch notifications
      for (const enrollment of enrollments) {
        await createNotification({
          userId: enrollment.userId,
          type: "info",
          title: "Course Live Class Scheduled! 🎥",
          message: `Join course live class "${title}" on ${dateFormatted}. Link: ${meetingLink}`,
          link: "/dashboard/live-classes"
        });
      }

      // 3. Register a text lesson in the targeted course
      const maxOrder = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(${lessonsTable.orderIndex}), 0)` })
        .from(lessonsTable)
        .where(eq(lessonsTable.courseId, Number(courseId)));

      await db.insert(lessonsTable).values({
        courseId: Number(courseId),
        title: `🎥 [Live Class Record] ${title}`,
        description: `An online live class was conducted on ${dateFormatted}.\nMeeting Link: ${meetingLink}\nDetails: ${description || "No further details provided."}`,
        orderIndex: (maxOrder[0]?.maxOrder ?? 0) + 1,
      });
    } else if (targetType === "student" && studentId && studentId !== "all") {
      // 1. Send single notification
      await createNotification({
        userId: Number(studentId),
        type: "info",
        title: "Individual Live Session! 🎥",
        message: `Your live session "${title}" is scheduled on ${dateFormatted}. Link: ${meetingLink}`,
        link: "/dashboard/live-classes"
      });

      // 2. Register as a text record lesson in all active courses of that student
      const studentEnrollments = await db
        .select({ courseId: enrollmentsTable.courseId })
        .from(enrollmentsTable)
        .where(eq(enrollmentsTable.userId, Number(studentId)));

      for (const enrollment of studentEnrollments) {
        const maxOrder = await db
          .select({ maxOrder: sql<number>`COALESCE(MAX(${lessonsTable.orderIndex}), 0)` })
          .from(lessonsTable)
          .where(eq(lessonsTable.courseId, enrollment.courseId));

        await db.insert(lessonsTable).values({
          courseId: enrollment.courseId,
          title: `🎥 [Live Class Record] ${title} (Individual Session)`,
          description: `An individual online session was conducted on ${dateFormatted}.\nMeeting Link: ${meetingLink}\nDetails: ${description || "No further details provided."}`,
          orderIndex: (maxOrder[0]?.maxOrder ?? 0) + 1,
        });
      }
    }

    res.status(201).json(liveClass);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /live-classes/:id - Update live class status (e.g. mark as completed)
router.patch("/live-classes/:id", authenticate, authorize("admin"), async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { isCompleted } = req.body;

    const [updated] = await db
      .update(liveClassesTable)
      .set({ isCompleted: !!isCompleted })
      .where(eq(liveClassesTable.id, Number(id)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Live class not found" });
      return;
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /live-classes/:id - Delete a live class
router.delete("/live-classes/:id", authenticate, authorize("admin"), async (req: AuthRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    await db.delete(liveClassesTable).where(eq(liveClassesTable.id, Number(id)));
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
