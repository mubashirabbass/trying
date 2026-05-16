import { Router, type IRouter } from "express";
import { db, successStoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateSuccessStoryBody } from "@workspace/api-zod";

import { authenticate, authorize } from "../middleware/auth";

const router: IRouter = Router();

router.get("/success-stories", async (req, res): Promise<void> => {
  const stories = await db.select().from(successStoriesTable);
  res.json(stories);
});

router.post("/success-stories", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const parsed = CreateSuccessStoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [story] = await db.insert(successStoriesTable).values(parsed.data).returning();
  res.status(201).json(story);
});

router.put("/success-stories/:id", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = CreateSuccessStoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [story] = await db.update(successStoriesTable).set(parsed.data).where(eq(successStoriesTable.id, id)).returning();
  if (!story) { res.status(404).json({ error: "Not found" }); return; }
  res.json(story);
});

router.delete("/success-stories/:id", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(successStoriesTable).where(eq(successStoriesTable.id, id));
  res.sendStatus(204);
});

export default router;
