import { Router, type IRouter } from "express";
import { db, successStoryCategoriesTable, pool } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateSuccessStoryCategoryBody } from "@workspace/api-zod";
import { authenticate, authorize } from "../middleware/auth";

const router: IRouter = Router();

async function ensureCategoryTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS success_story_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log("Success story categories table ensured");
  } catch (e) {
    console.error("Error ensuring success_story_categories table:", e);
  }
}

ensureCategoryTable();

router.get("/", async (req, res): Promise<void> => {
  const categories = await db.select().from(successStoryCategoriesTable);
  res.json(categories);
});

router.post("/", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const parsed = CreateSuccessStoryCategoryBody.safeParse(req.body);
  if (!parsed.success) { 
    console.error("Category validation failed:", parsed.error.message);
    res.status(400).json({ error: parsed.error.message }); 
    return; 
  }
  console.log("Creating category with data:", JSON.stringify(parsed.data, null, 2));
  try {
    const [category] = await db.insert(successStoryCategoriesTable).values(parsed.data).returning();
    console.log("Created category:", JSON.stringify(category, null, 2));
    res.status(201).json(category);
  } catch (err) {
    console.error("Database error creating category:", err);
    res.status(500).json({ error: "Database error. Possible duplicate slug?" });
  }
});

router.delete("/:id", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(successStoryCategoriesTable).where(eq(successStoryCategoriesTable.id, id));
  res.sendStatus(204);
});

export default router;
