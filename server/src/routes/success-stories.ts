import { Router, type IRouter } from "express";
import { db, successStoriesTable, pool } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateSuccessStoryBody } from "@workspace/api-zod";

import { authenticate, authorize } from "../middleware/auth";

const router: IRouter = Router();

async function ensureSuccessStoriesColumns() {
  try {
    await pool.query(`
      ALTER TABLE success_stories 
      ADD COLUMN IF NOT EXISTS rating text DEFAULT '5',
      ADD COLUMN IF NOT EXISTS category text,
      ADD COLUMN IF NOT EXISTS metric1_value text,
      ADD COLUMN IF NOT EXISTS metric1_label text,
      ADD COLUMN IF NOT EXISTS metric2_value text,
      ADD COLUMN IF NOT EXISTS metric2_label text,
      ADD COLUMN IF NOT EXISTS metric3_value text,
      ADD COLUMN IF NOT EXISTS metric3_label text,
      ADD COLUMN IF NOT EXISTS category_id integer
    `);
    console.log("Success stories columns ensured");
  } catch (e) {
    console.error("Error ensuring success_stories columns:", e);
  }
}

ensureSuccessStoriesColumns();

router.get("/", async (req, res): Promise<void> => {
  const stories = await db.select().from(successStoriesTable);
  res.json(stories);
});

router.post("/", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const parsed = CreateSuccessStoryBody.safeParse(req.body);
  if (!parsed.success) { 
    res.status(400).json({ error: parsed.error.message }); 
    return; 
  }
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

router.delete("/:id", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(successStoriesTable).where(eq(successStoriesTable.id, id));
  res.sendStatus(204);
});

export default router;
