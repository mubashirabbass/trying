import { Router, type IRouter } from "express";
import { db, lessonsTable, lessonProgressTable } from "@workspace/db";
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
import { getSession } from "../lib/auth";

const router: IRouter = Router();

router.get("/lessons", async (req, res): Promise<void> => {
  const params = ListLessonsQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const courseId = Number(params.data.courseId);
  const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, courseId)).orderBy(lessonsTable.orderIndex);

  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const session = getSession(auth.slice(7));
    if (session) {
      const progress = await db.select().from(lessonProgressTable).where(eq(lessonProgressTable.userId, session.userId));
      const progressMap = new Map(progress.map(p => [p.lessonId, p.isCompleted]));
      res.json(lessons.map(l => ({ ...l, isCompleted: progressMap.get(l.id) ?? false })));
      return;
    }
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

router.post("/lessons/:id/progress", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const lessonId = parseInt(raw, 10);
  if (isNaN(lessonId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  const session = getSession(auth.slice(7));
  if (!session) { res.status(401).json({ error: "Invalid token" }); return; }

  const parsed = UpdateLessonProgressBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [existing] = await db.select().from(lessonProgressTable)
    .where(and(eq(lessonProgressTable.lessonId, lessonId), eq(lessonProgressTable.userId, session.userId)));

  let progress;
  if (existing) {
    [progress] = await db.update(lessonProgressTable)
      .set({ isCompleted: parsed.data.isCompleted, watchedSeconds: parsed.data.watchedSeconds ?? existing.watchedSeconds })
      .where(eq(lessonProgressTable.id, existing.id))
      .returning();
  } else {
    [progress] = await db.insert(lessonProgressTable)
      .values({ lessonId, userId: session.userId, isCompleted: parsed.data.isCompleted, watchedSeconds: parsed.data.watchedSeconds ?? 0 })
      .returning();
  }
  res.json(progress);
});

export default router;
