import { Router } from "express";
import { db, liveClassesTable, usersTable, enrollmentsTable, coursesTable, lessonsTable } from "@workspace/db";
import { eq, and, desc, sql, or, inArray, ne, gt } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth";
import { createNotification } from "../lib/notifications";

const router = Router();

// ── GET /live-classes/history — stats + full log for admin/teacher ──────────
router.get("/live-classes/history", async (req: AuthRequest, res): Promise<void> => {
  try {
    const { role, id: userId } = req.user;
    if (role !== "admin" && role !== "teacher") {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    // Fetch ALL records (no isCancelled filter) for history
    let query = db
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
        isCancelled: liveClassesTable.isCancelled,
        cancelledAt: liveClassesTable.cancelledAt,
        createdAt: liveClassesTable.createdAt,
        createdBy: liveClassesTable.createdBy,
        createdByRole: liveClassesTable.createdByRole,
        courseTitle: coursesTable.title,
        studentName: usersTable.name,
      })
      .from(liveClassesTable)
      .leftJoin(coursesTable, eq(liveClassesTable.courseId, coursesTable.id))
      .leftJoin(usersTable, eq(liveClassesTable.studentId, usersTable.id));

    if (role === "teacher") {
      query = query.where(eq(liveClassesTable.createdBy, userId)) as any;
    }

    const allClasses = await query.orderBy(desc(liveClassesTable.scheduledAt));

    const total = allClasses.length;
    const conducted = allClasses.filter(c => c.isCompleted && !c.isCancelled).length;
    const cancelled = allClasses.filter(c => c.isCancelled).length;
    const upcoming = allClasses.filter(c => !c.isCompleted && !c.isCancelled).length;

    res.json({ total, conducted, cancelled, upcoming, log: allClasses });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /live-classes
router.get("/live-classes", async (req: AuthRequest, res): Promise<void> => {
  try {
    const { role, id: userId } = req.user;

    if (role === "admin" || role === "teacher") {
      // Exclude cancelled (soft-deleted) records from active view
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
          isCancelled: liveClassesTable.isCancelled,
          cancelledAt: liveClassesTable.cancelledAt,
          createdAt: liveClassesTable.createdAt,
          createdBy: liveClassesTable.createdBy,
          createdByRole: liveClassesTable.createdByRole,
          courseTitle: coursesTable.title,
          studentName: usersTable.name,
        })
        .from(liveClassesTable)
        .leftJoin(coursesTable, eq(liveClassesTable.courseId, coursesTable.id))
        .leftJoin(usersTable, eq(liveClassesTable.studentId, usersTable.id))
        .where(eq(liveClassesTable.isCancelled, false))
        .orderBy(desc(liveClassesTable.scheduledAt));

      // Auto-expire: mark past classes as completed only if they started more than 3 hours ago
      const now = new Date();
      const threshold = 3 * 60 * 60 * 1000; // 3 hours
      const toExpire = classes.filter(c => !c.isCompleted && (now.getTime() - new Date(c.scheduledAt).getTime()) > threshold);
      if (toExpire.length > 0) {
        const toExpireIds = toExpire.map(c => c.id);
        db.update(liveClassesTable)
          .set({ isCompleted: true })
          .where(inArray(liveClassesTable.id, toExpireIds))
          .catch(err => console.error("Failed to auto-expire live classes:", err));
        for (const c of toExpire) {
          c.isCompleted = true;
        }
      }

      res.json(classes);
      return;
    }

    // Student: only see classes targeted at them (exclude cancelled)
    const studentEnrollments = await db
      .select({ courseId: enrollmentsTable.courseId })
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.userId, userId));

    const enrolledCourseIds = studentEnrollments.map(e => e.courseId);

    const baseCondition = eq(liveClassesTable.isCancelled, false);
    const cutOff = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago

    const whereClause = enrolledCourseIds.length > 0
      ? and(baseCondition, eq(liveClassesTable.isCompleted, false), gt(liveClassesTable.scheduledAt, cutOff), or(
          eq(liveClassesTable.targetType, "all"),
          and(eq(liveClassesTable.targetType, "course"), inArray(liveClassesTable.courseId, enrolledCourseIds)),
          and(eq(liveClassesTable.targetType, "student"), eq(liveClassesTable.studentId, userId))
        ))
      : and(baseCondition, eq(liveClassesTable.isCompleted, false), gt(liveClassesTable.scheduledAt, cutOff), or(
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

    // Validate scheduledAt is not in the past
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (isNaN(scheduledDate.getTime())) {
        res.status(400).json({ error: "Invalid date/time format" });
        return;
      }
      if (scheduledDate <= new Date()) {
        res.status(400).json({ error: "Scheduled time cannot be in the past. Please select a future date and time." });
        return;
      }
    }

    const insertValues: any = {
      title,
      meetingLink,
      targetType,
      courseId: courseId && courseId !== "all" && courseId !== "" ? Number(courseId) : null,
      studentId: studentId && studentId !== "all" && studentId !== "" ? Number(studentId) : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      description: description || null,
      isCompleted: false,
      isCancelled: false,
      createdBy: userId,
      createdByRole: role,
    };

    const [liveClass] = await db.insert(liveClassesTable).values(insertValues).returning();
    res.status(201).json(liveClass);

    // Run notifications & lesson records asynchronously in the background so HTTP response is instant
    const dateFormatted = scheduledAt ? new Date(scheduledAt).toLocaleString() : new Date().toLocaleString();
    (async () => {
      try {
        const { bulkCreateNotifications } = await import("../lib/notifications");

        if (targetType === "all") {
          // 1. Fetch target students
          const students = await db.select().from(usersTable).where(eq(usersTable.role, "student"));
          
          // 2. Bulk insert notifications in a single query
          const notifications = students.map(student => ({
            userId: student.id,
            type: "info" as const,
            title: "New Live Class Scheduled! 🎥",
            message: `Join "${title}" on ${dateFormatted}. Link: ${meetingLink}`,
            link: "/dashboard/live-classes"
          }));
          await bulkCreateNotifications(notifications);

          // 3. Parallelize lessons insertion across all courses
          const allCourses = await db.select().from(coursesTable);
          await Promise.all(
            allCourses.map(async (c) => {
              const [{ maxOrder }] = await db
                .select({ maxOrder: sql<number>`COALESCE(MAX(${lessonsTable.orderIndex}), 0)` })
                .from(lessonsTable)
                .where(eq(lessonsTable.courseId, c.id));
              
              await db.insert(lessonsTable).values({
                courseId: c.id,
                title: `🎥 [Live Class Record] ${title}`,
                description: `Conducted on ${dateFormatted}.\nLink: ${meetingLink}\n${description || ""}`,
                orderIndex: (maxOrder ?? 0) + 1
              });
            })
          );

        } else if (targetType === "course" && courseId) {
          // 1. Fetch enrolled students
          const enrolled = await db.select({ userId: enrollmentsTable.userId }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, Number(courseId)));
          
          // 2. Bulk insert notifications
          const notifications = enrolled.map(e => ({
            userId: e.userId,
            type: "info" as const,
            title: "Course Live Class Scheduled! 🎥",
            message: `Join "${title}" on ${dateFormatted}. Link: ${meetingLink}`,
            link: "/dashboard/live-classes"
          }));
          await bulkCreateNotifications(notifications);

          // 3. Insert course lesson record
          const [{ maxOrder }] = await db
            .select({ maxOrder: sql<number>`COALESCE(MAX(${lessonsTable.orderIndex}), 0)` })
            .from(lessonsTable)
            .where(eq(lessonsTable.courseId, Number(courseId)));
          
          await db.insert(lessonsTable).values({
            courseId: Number(courseId),
            title: `🎥 [Live Class Record] ${title}`,
            description: `Conducted on ${dateFormatted}.\nLink: ${meetingLink}\n${description || ""}`,
            orderIndex: (maxOrder ?? 0) + 1
          });

        } else if (targetType === "student" && studentId) {
          // 1. Single notification
          const { createNotification } = await import("../lib/notifications");
          await createNotification({
            userId: Number(studentId),
            type: "info",
            title: "Individual Live Session! 🎥",
            message: `Your session "${title}" is on ${dateFormatted}. Link: ${meetingLink}`,
            link: "/dashboard/live-classes"
          });

          // 2. Fetch student courses & add lesson record to each
          const studentEnrollments = await db.select({ courseId: enrollmentsTable.courseId }).from(enrollmentsTable).where(eq(enrollmentsTable.userId, Number(studentId)));
          await Promise.all(
            studentEnrollments.map(async (e) => {
              const [{ maxOrder }] = await db
                .select({ maxOrder: sql<number>`COALESCE(MAX(${lessonsTable.orderIndex}), 0)` })
                .from(lessonsTable)
                .where(eq(lessonsTable.courseId, e.courseId));
              
              await db.insert(lessonsTable).values({
                courseId: e.courseId,
                title: `🎥 [Live Class Record] ${title} (Individual)`,
                description: `Conducted on ${dateFormatted}.\nLink: ${meetingLink}\n${description || ""}`,
                orderIndex: (maxOrder ?? 0) + 1
              });
            })
          );
        }
      } catch (bgError) {
        console.error("[BG LIVE CLASS BACKGROUND WORK ERROR]", bgError);
      }
    })();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /live-classes/:id — mark as completed / re-open
router.patch("/live-classes/:id", async (req: AuthRequest, res): Promise<void> => {
  try {
    const { role, id: userId } = req.user;
    const id = Number(req.params.id);
    const { isCompleted } = req.body;

    if (role === "teacher") {
      const [existing] = await db.select().from(liveClassesTable).where(eq(liveClassesTable.id, id));
      if (!existing) { res.status(404).json({ error: "Not found" }); return; }
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

// DELETE /live-classes/:id — soft-delete (mark as cancelled, preserve in history)
router.delete("/live-classes/:id", async (req: AuthRequest, res): Promise<void> => {
  try {
    const { role, id: userId } = req.user;
    const id = Number(req.params.id);

    const [existing] = await db.select().from(liveClassesTable).where(eq(liveClassesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }

    if (role === "teacher") {
      if (existing.createdBy !== null && existing.createdBy !== userId) {
        res.status(403).json({ error: "You can only cancel your own classes" }); return;
      }
    } else if (role !== "admin") {
      res.status(403).json({ error: "Unauthorized" }); return;
    }

    // Soft-delete: mark as cancelled so it appears in history
    await db.update(liveClassesTable)
      .set({ isCancelled: true, cancelledAt: new Date() })
      .where(eq(liveClassesTable.id, id));

    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
