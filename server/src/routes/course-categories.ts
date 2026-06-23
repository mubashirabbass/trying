import { Router, type IRouter } from "express";
import { db, courseCategoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, authorize } from "../middleware/auth";
import { z } from "zod/v4";

const router: IRouter = Router();

const CourseCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional().nullable(),
});

// GET /api/course-categories
router.get("/course-categories", async (req, res) => {
  try {
    const categories = await db.select().from(courseCategoriesTable);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/course-categories
router.post("/course-categories", authenticate, authorize("admin"), async (req, res) => {
  const parsed = CourseCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [category] = await db.insert(courseCategoriesTable).values(parsed.data).returning();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// PUT /api/course-categories/:id
router.put("/course-categories/:id", authenticate, authorize("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = CourseCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    const [category] = await db
      .update(courseCategoriesTable)
      .set(parsed.data)
      .where(eq(courseCategoriesTable.id, id))
      .returning();
      
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// DELETE /api/course-categories/:id
router.delete("/course-categories/:id", authenticate, authorize("admin"), async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [deleted] = await db
      .delete(courseCategoriesTable)
      .where(eq(courseCategoriesTable.id, id))
      .returning();
      
    if (!deleted) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
