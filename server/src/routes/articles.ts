import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";
import { authenticate, authorize } from "../middleware/auth";

const router: IRouter = Router();

// Public: list published articles
router.get("/articles", async (req, res): Promise<void> => {
  const articles = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.isPublished, true))
    .orderBy(desc(articlesTable.createdAt));
  res.json(articles);
});

// Public: get single article by slug
router.get("/articles/:slug", async (req, res): Promise<void> => {
  const [article] = await db.select().from(articlesTable).where(eq(articlesTable.slug, req.params.slug));
  if (!article || !article.isPublished) { res.status(404).json({ error: "Not found" }); return; }
  res.json(article);
});

// Admin: list ALL articles (incl. drafts)
router.get("/admin/articles", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const articles = await db.select().from(articlesTable).orderBy(desc(articlesTable.createdAt));
  res.json(articles);
});

// Admin: create article
router.post("/articles", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const { title, excerpt, content, author, category, imageUrl, isPublished, readTime } = req.body;
  if (!title || !excerpt || !content) { res.status(400).json({ error: "Title, excerpt and content required" }); return; }
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
  const [article] = await db.insert(articlesTable).values({ title, slug, excerpt, content, author: author || "Admin", category: category || "General", imageUrl, isPublished: isPublished ?? false, readTime }).returning();
  res.status(201).json(article);
});

// Admin: update article
router.put("/articles/:id", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { title, excerpt, content, author, category, imageUrl, isPublished, readTime } = req.body;
  const [article] = await db.update(articlesTable)
    .set({ title, excerpt, content, author, category, imageUrl, isPublished, readTime, updatedAt: new Date() })
    .where(eq(articlesTable.id, id))
    .returning();
  if (!article) { res.status(404).json({ error: "Not found" }); return; }
  res.json(article);
});

// Admin: delete article
router.delete("/articles/:id", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(articlesTable).where(eq(articlesTable.id, id));
  res.sendStatus(204);
});

export default router;
