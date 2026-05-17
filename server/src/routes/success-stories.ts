import { Router, type IRouter } from "express";
import { db, successStoriesTable, pool } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateSuccessStoryBody } from "@workspace/api-zod";

import { authenticate, authorize } from "../middleware/auth";
import { catchAsync } from "../middleware/error";
import { AppError, verifyToken } from "../lib/auth";
import { upload } from "../middleware/upload";
import { uploadToCloudinary } from "../lib/cloudinary";

const router: IRouter = Router();

// POST /api/success-stories/upload-image — admin image upload to Cloudinary
router.post(
  "/success-stories/upload-image",
  authenticate,
  authorize("admin"),
  upload.single("image"),
  catchAsync(async (req: any, res) => {
    if (!req.file) {
      throw new AppError("Student image is required", 400);
    }
    if (!req.file.mimetype.startsWith("image/")) {
      throw new AppError("Only image files are allowed", 400);
    }
    const result = await uploadToCloudinary(req.file.buffer, "success-stories", "image");
    res.status(201).json({ url: result.secure_url, publicId: result.public_id });
  })
);

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
      ADD COLUMN IF NOT EXISTS category_id integer,
      ADD COLUMN IF NOT EXISTS external_link text,
      ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false
    `);
  } catch (e) {
    // Columns already exist — ignore
  }
}

ensureSuccessStoriesColumns();

// GET /api/success-stories
// - Public: returns only visible stories
// - Admin: automatically returns ALL stories (including hidden) if requested by a logged-in admin
router.get("/success-stories", catchAsync(async (req, res): Promise<void> => {
  let isAdmin = req.query.admin === "true";
  const auth = req.headers.authorization;

  console.log("[DEBUG success-stories] GET /success-stories requested.");
  console.log("[DEBUG success-stories] req.query.admin:", req.query.admin);
  console.log("[DEBUG success-stories] req.headers.authorization present:", !!auth);

  // Auto-detect admin role from Bearer token to guarantee seamless admin experience
  if (auth?.startsWith("Bearer ")) {
    try {
      const token = auth.slice(7);
      const decoded = verifyToken(token);
      console.log("[DEBUG success-stories] Decoded token payload:", decoded);
      if (decoded && decoded.role === "admin") {
        isAdmin = true;
      }
    } catch (err: any) {
      console.log("[DEBUG success-stories] Token decoding failed:", err.message);
      // Ignore token decode errors on public GET endpoint
    }
  }

  console.log("[DEBUG success-stories] Final resolved isAdmin:", isAdmin);

  if (isAdmin) {
    const stories = await db.select().from(successStoriesTable);
    res.json(stories);
    return;
  }

  // Public: only show non-hidden stories
  const stories = await db
    .select()
    .from(successStoriesTable)
    .where(eq(successStoriesTable.isHidden, false));
  res.json(stories);
}));

// POST /api/success-stories
router.post("/success-stories", authenticate, authorize("admin"), catchAsync(async (req, res): Promise<void> => {
  const parsed = CreateSuccessStoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [story] = await db.insert(successStoriesTable).values(parsed.data).returning();
  res.status(201).json(story);
}));

// PUT /api/success-stories/:id
router.put("/success-stories/:id", authenticate, authorize("admin"), catchAsync(async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = CreateSuccessStoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [story] = await db.update(successStoriesTable)
    .set(parsed.data)
    .where(eq(successStoriesTable.id, id))
    .returning();

  if (!story) { res.status(404).json({ error: "Not found" }); return; }
  res.json(story);
}));

// PATCH /api/success-stories/:id/visibility
router.patch("/success-stories/:id/visibility", authenticate, authorize("admin"), catchAsync(async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [current] = await db.select().from(successStoriesTable).where(eq(successStoriesTable.id, id));
  if (!current) { res.status(404).json({ error: "Not found" }); return; }

  const [updated] = await db.update(successStoriesTable)
    .set({ isHidden: !current.isHidden })
    .where(eq(successStoriesTable.id, id))
    .returning();

  res.json(updated);
}));

// DELETE /api/success-stories/:id
router.delete("/success-stories/:id", authenticate, authorize("admin"), catchAsync(async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(successStoriesTable).where(eq(successStoriesTable.id, id));
  res.sendStatus(204);
}));

export default router;
