import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { articlesTable } from "@workspace/db";
import { eq, desc, asc, and } from "drizzle-orm";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

// Public: list published articles
router.get("/articles", async (req, res): Promise<void> => {
  try {
    const articles = await db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.isPublished, true))
      .orderBy(desc(articlesTable.createdAt));
    res.json(articles);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch articles" });
  }
});

// Public: get single article by slug
router.get("/articles/:slug", async (req, res): Promise<void> => {
  try {
    const [article] = await db.select().from(articlesTable).where(eq(articlesTable.slug, req.params.slug));
    if (!article || !article.isPublished) { res.status(404).json({ error: "Not found" }); return; }
    res.json(article);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch article" });
  }
});

// Admin/Teacher: list ALL articles (incl. drafts)
router.get("/admin/articles", authenticate, authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  try {
    // Both admin and teacher see all articles, but can only manage what they own (managed in endpoints below)
    const articles = await db
      .select()
      .from(articlesTable)
      .orderBy(desc(articlesTable.createdAt));
    res.json(articles);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch admin articles" });
  }
});

// Admin/Teacher: create article
router.post("/articles", authenticate, authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  try {
    const { title, excerpt, content, author, category, imageUrl, isPublished, isFeatured, readTime } = req.body;
    if (!title || !excerpt || !content) { res.status(400).json({ error: "Title, excerpt and content required" }); return; }
    
    // Auto-generate unique slug
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
    
    const [article] = await db.insert(articlesTable).values({
      title,
      slug,
      excerpt,
      content,
      // Fallback author to req.user.name if empty
      author: author || req.user.name,
      category: category || "General",
      imageUrl,
      isPublished: isPublished ?? false,
      // Only admins can mark articles as featured
      isFeatured: req.user.role === "admin" ? (isFeatured ?? false) : false,
      readTime: readTime || "5 min read"
    }).returning();
    
    res.status(201).json(article);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create article" });
  }
});

// Admin/Teacher: update article
router.put("/articles/:id", authenticate, authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    
    const [existing] = await db.select().from(articlesTable).where(eq(articlesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    
    // Check permission: teachers can only edit their own articles (matching by name or title)
    if (req.user.role === "teacher" && existing.author !== req.user.name) {
      res.status(403).json({ error: "You do not have permission to modify this article" });
      return;
    }
    
    const { title, excerpt, content, author, category, imageUrl, isPublished, isFeatured, readTime } = req.body;
    
    const updateData: any = {
      title,
      excerpt,
      content,
      author: author || existing.author,
      category: category || existing.category,
      imageUrl,
      isPublished,
      readTime,
      updatedAt: new Date()
    };
    
    // Only admins are allowed to change featured status
    if (req.user.role === "admin" && isFeatured !== undefined) {
      updateData.isFeatured = isFeatured;
    }
    
    const [article] = await db.update(articlesTable)
      .set(updateData)
      .where(eq(articlesTable.id, id))
      .returning();
      
    res.json(article);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update article" });
  }
});

// Admin/Teacher: delete article
router.delete("/articles/:id", authenticate, authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    
    const [existing] = await db.select().from(articlesTable).where(eq(articlesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    
    // Check permission: teachers can only delete their own articles
    if (req.user.role === "teacher" && existing.author !== req.user.name) {
      res.status(403).json({ error: "You do not have permission to delete this article" });
      return;
    }
    
    await db.delete(articlesTable).where(eq(articlesTable.id, id));
    res.sendStatus(204);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete article" });
  }
});

export default router;
