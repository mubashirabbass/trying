import { Router, type IRouter } from "express";
import { db, lessonsTable, lessonCompletionsTable, videoAccessLogsTable, coursesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListLessonsQueryParams,
  CreateLessonBody,
  GetLessonParams,
  UpdateLessonParams,
  UpdateLessonBody,
  DeleteLessonParams,
  UpdateLessonProgressParams,
  UpdateLessonProgressBody,
} from "@workspace/api-zod";
import { AuthRequest, authorize } from "../middleware/auth";
import { encrypt, decrypt } from "../lib/crypto";
import jwt from "jsonwebtoken";
import { enrollmentsTable } from "@workspace/db";
import { upload } from "../middleware/upload";
import { uploadToCloudinary } from "../lib/cloudinary";

const router: IRouter = Router();

router.get("/lessons", async (req: AuthRequest, res): Promise<void> => {
  const params = ListLessonsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const courseId = Number(params.data.courseId);

  const userId = req.user?.id;
  const isStaff = req.user?.role === "admin" || req.user?.role === "teacher";

  if (!isStaff) {
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }
    const [enrollment] = await db.select().from(enrollmentsTable)
      .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, courseId)));
    if (!enrollment || enrollment.status !== "active") {
      res.status(403).json({ error: "You are not enrolled in this course or your admission is pending approval." });
      return;
    }
  }

  const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, courseId)).orderBy(lessonsTable.orderIndex);

  if (userId) {
    const completions = await db.select().from(lessonCompletionsTable).where(eq(lessonCompletionsTable.userId, userId));
    const completionMap = new Map(completions.map(c => [c.lessonId, c.isCompleted]));
    res.json(lessons.map(l => ({ ...l, isCompleted: completionMap.get(l.id) ?? false })));
    return;
  }
  res.json(lessons.map(l => ({ ...l, isCompleted: false })));
});

router.post("/lessons", authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateLessonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  
  const courseId = Number(parsed.data.courseId);
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) { res.status(404).json({ error: "Course not found" }); return; }

  if (req.user.role === "teacher" && course.teacherId !== req.user.id) {
    res.status(403).json({ error: "You do not have permission to manage lessons for this course" });
    return;
  }

  const data: any = { ...parsed.data };
  if (data.videoUrl && (data.videoUrl.includes("youtube.com") || data.videoUrl.includes("youtu.be"))) {
    data.encryptedYoutubeId = encrypt(data.videoUrl);
  }

  // Extract custom fields bypassed in schema
  if (req.body.completionThreshold !== undefined) {
    data.completionThreshold = req.body.completionThreshold === "" || req.body.completionThreshold === null 
      ? 80 
      : Number(req.body.completionThreshold);
  }
  if (req.body.sectionId !== undefined) {
    data.sectionId = req.body.sectionId === null || req.body.sectionId === "" ? null : Number(req.body.sectionId);
  }
  if (req.body.notes !== undefined) {
    data.notes = req.body.notes || null;
  }
  if (req.body.resources !== undefined) {
    data.resources = req.body.resources || null;
  }

  const [lesson] = await db.insert(lessonsTable).values(data).returning();
  res.status(201).json({ ...lesson, isCompleted: false });
});

router.get("/lessons/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, id));
  if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }
  res.json({ ...lesson, isCompleted: false });
});

router.put("/lessons/:id", authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existingLesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, id));
  if (!existingLesson) { res.status(404).json({ error: "Lesson not found" }); return; }

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, existingLesson.courseId));
  if (!course) { res.status(404).json({ error: "Associated course not found" }); return; }

  if (req.user.role === "teacher" && course.teacherId !== req.user.id) {
    res.status(403).json({ error: "You do not have permission to modify this lesson" });
    return;
  }

  const parsed = UpdateLessonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  
  const data: any = { ...parsed.data };
  if (data.videoUrl && (data.videoUrl.includes("youtube.com") || data.videoUrl.includes("youtu.be"))) {
    data.encryptedYoutubeId = encrypt(data.videoUrl);
  }

  // Extract custom fields bypassed in schema
  if (req.body.completionThreshold !== undefined) {
    data.completionThreshold = req.body.completionThreshold === "" || req.body.completionThreshold === null 
      ? 80 
      : Number(req.body.completionThreshold);
  }
  if (req.body.sectionId !== undefined) {
    data.sectionId = req.body.sectionId === null || req.body.sectionId === "" ? null : Number(req.body.sectionId);
  }
  if (req.body.notes !== undefined) {
    data.notes = req.body.notes || null;
  }
  if (req.body.resources !== undefined) {
    data.resources = req.body.resources || null;
  }

  const [lesson] = await db.update(lessonsTable).set(data).where(eq(lessonsTable.id, id)).returning();
  res.json({ ...lesson, isCompleted: false });
});

router.delete("/lessons/:id", authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existingLesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, id));
  if (!existingLesson) { res.status(404).json({ error: "Lesson not found" }); return; }

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, existingLesson.courseId));
  if (!course) { res.status(404).json({ error: "Associated course not found" }); return; }

  if (req.user.role === "teacher" && course.teacherId !== req.user.id) {
    res.status(403).json({ error: "You do not have permission to delete this lesson" });
    return;
  }

  await db.delete(lessonsTable).where(eq(lessonsTable.id, id));
  res.sendStatus(204);
});

router.post("/lessons/:id/progress", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const lessonId = parseInt(raw, 10);
  if (isNaN(lessonId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = UpdateLessonProgressBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [existing] = await db.select().from(lessonCompletionsTable)
    .where(and(eq(lessonCompletionsTable.lessonId, lessonId), eq(lessonCompletionsTable.userId, userId)));

  let completion;
  if (existing) {
    [completion] = await db.update(lessonCompletionsTable)
      .set({ 
        isCompleted: existing.isCompleted, 
        watchedPercent: (parsed.data as any).watchedPercent ?? existing.watchedPercent,
        completedAt: existing.completedAt
      })
      .where(eq(lessonCompletionsTable.id, existing.id))
      .returning();
  } else {
    [completion] = await db.insert(lessonCompletionsTable)
      .values({ 
        lessonId, 
        userId: userId, 
        isCompleted: false, 
        watchedPercent: (parsed.data as any).watchedPercent ?? 0,
        completedAt: null
      })
      .returning();
  }

  res.json(completion);
});

router.post("/lessons/:id/feedback", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const lessonId = parseInt(raw, 10);
  if (isNaN(lessonId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { rating, comment } = req.body;
  if (rating === undefined || rating < 1 || rating > 5) {
    res.status(400).json({ error: "Rating must be between 1 and 5 stars" });
    return;
  }

  const [existing] = await db.select().from(lessonCompletionsTable)
    .where(and(eq(lessonCompletionsTable.lessonId, lessonId), eq(lessonCompletionsTable.userId, userId)));

  let completion;
  if (existing) {
    [completion] = await db.update(lessonCompletionsTable)
      .set({ 
        isCompleted: true, 
        watchedPercent: 100,
        completedAt: existing.completedAt || new Date(),
        feedbackRating: Number(rating),
        feedbackComment: comment || null
      })
      .where(eq(lessonCompletionsTable.id, existing.id))
      .returning();
  } else {
    [completion] = await db.insert(lessonCompletionsTable)
      .values({ 
        lessonId, 
        userId: userId, 
        isCompleted: true, 
        watchedPercent: 100,
        completedAt: new Date(),
        feedbackRating: Number(rating),
        feedbackComment: comment || null
      })
      .returning();
  }

  // Update enrollment progress
  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId));
  if (lesson) {
    const allLessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, lesson.courseId));
    const completed = await db.select().from(lessonCompletionsTable)
      .where(and(
        eq(lessonCompletionsTable.userId, userId),
        eq(lessonCompletionsTable.isCompleted, true)
      ));
    
    const courseLessonIds = new Set(allLessons.map(l => l.id));
    const completedCount = completed.filter(c => courseLessonIds.has(c.lessonId)).length;
    const progress = Math.min(100, Math.round((completedCount / allLessons.length) * 100));

    await db.update(enrollmentsTable)
      .set({ progress, updatedAt: new Date() })
      .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, lesson.courseId)));
  }

  res.json(completion);
});

router.get("/lessons/:id/stream-token", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const lessonId = parseInt(raw, 10);
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId));
  if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }

  // Verify active enrollment
  const [enrollment] = await db.select().from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, lesson.courseId)));
  
  const isStaff = req.user?.role === "admin" || req.user?.role === "teacher";
  
  if ((!enrollment || enrollment.status !== "active") && !isStaff) {
    res.status(403).json({ error: "Your enrollment is not active or is pending administrator approval." });
    return;
  }

  const token = jwt.sign(
    { userId, lessonId, exp: Math.floor(Date.now() / 1000) + (60 * 60) }, // 1 hour
    process.env.JWT_SECRET || "fallback_secret"
  );

  res.json({ token });
});

router.get("/lessons/:id/embed", async (req, res): Promise<void> => {
  const lessonId = parseInt(req.params.id, 10);
  const token = req.query.token as string;

  if (!token) { res.status(401).json({ error: "Token required" }); return; }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as any;
    if (decoded.lessonId !== lessonId) {
      res.status(401).json({ error: "Invalid token for this lesson" });
      return;
    }

    const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId));
    if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }

    // 1. Log video access
    await db.insert(videoAccessLogsTable).values({
      userId: decoded.userId,
      lessonId,
      ipAddress: req.ip || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
    }).catch(err => console.error("Failed to log video access:", err));

    let videoUrl = "";
    if (lesson.encryptedYoutubeId) {
      videoUrl = decrypt(lesson.encryptedYoutubeId);
    } else if (lesson.videoUrl) {
      // Legacy fallback
      videoUrl = lesson.videoUrl;
    } else {
      res.status(404).json({ error: "No video available for this lesson" });
      return;
    }

    res.json({ url: videoUrl });
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

router.post(
  "/lessons/upload-pdf",
  authorize("admin", "teacher"),
  upload.single("pdf"),
  async (req: any, res): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "PDF file is required" });
        return;
      }

      if (req.file.mimetype !== "application/pdf") {
        res.status(400).json({ error: "Only PDF files are allowed" });
        return;
      }

      const result = await uploadToCloudinary(req.file.buffer, "lesson-pdfs", "raw");
      res.status(201).json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error: any) {
      console.error("PDF upload error:", error);
      res.status(500).json({ error: error.message || "Failed to upload PDF" });
    }
  }
);

export default router;
