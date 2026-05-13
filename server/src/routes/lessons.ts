import { Router, type IRouter } from "express";
import { db, lessonsTable, lessonCompletionsTable } from "@workspace/db";
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
import { AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

router.get("/lessons", async (req: AuthRequest, res): Promise<void> => {
  const params = ListLessonsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const courseId = Number(params.data.courseId);
  const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, courseId)).orderBy(lessonsTable.orderIndex);

  const userId = req.user?.id;
  if (userId) {
    const completions = await db.select().from(lessonCompletionsTable).where(eq(lessonCompletionsTable.userId, userId));
    const completionMap = new Map(completions.map(c => [c.lessonId, c.isCompleted]));
    res.json(lessons.map(l => ({ ...l, isCompleted: completionMap.get(l.id) ?? false })));
    return;
  }
  res.json(lessons.map(l => ({ ...l, isCompleted: false })));
});

router.post("/lessons", async (req, res): Promise<void> => {
  const parsed = CreateLessonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [lesson] = await db.insert(lessonsTable).values(parsed.data).returning();
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

router.put("/lessons/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateLessonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [lesson] = await db.update(lessonsTable).set(parsed.data).where(eq(lessonsTable.id, id)).returning();
  if (!lesson) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...lesson, isCompleted: false });
});

router.delete("/lessons/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
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
        isCompleted: parsed.data.isCompleted, 
        watchedPercent: parsed.data.watchedPercent ?? existing.watchedPercent,
        completedAt: parsed.data.isCompleted && !existing.isCompleted ? new Date() : existing.completedAt
      })
      .where(eq(lessonCompletionsTable.id, existing.id))
      .returning();
  } else {
    [completion] = await db.insert(lessonCompletionsTable)
      .values({ 
        lessonId, 
        userId: userId, 
        isCompleted: parsed.data.isCompleted, 
        watchedPercent: parsed.data.watchedPercent ?? 0,
        completedAt: parsed.data.isCompleted ? new Date() : null
      })
      .returning();
  }
  res.json(completion);
});

export default router;
