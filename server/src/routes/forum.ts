import { Router, type IRouter } from "express";
import { db, forumPostsTable, forumRepliesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/forum/courses/:courseId/posts", async (req, res): Promise<void> => {
  const courseId = Number(req.params.courseId);
  const posts = await db.select({
    id: forumPostsTable.id,
    courseId: forumPostsTable.courseId,
    userId: forumPostsTable.userId,
    title: forumPostsTable.title,
    body: forumPostsTable.body,
    isPinned: forumPostsTable.isPinned,
    upvotes: forumPostsTable.upvotes,
    createdAt: forumPostsTable.createdAt,
    updatedAt: forumPostsTable.updatedAt,
    authorName: usersTable.name,
    authorRole: usersTable.role,
  }).from(forumPostsTable)
    .leftJoin(usersTable, eq(forumPostsTable.userId, usersTable.id))
    .where(eq(forumPostsTable.courseId, courseId))
    .orderBy(desc(forumPostsTable.isPinned), desc(forumPostsTable.createdAt));
  res.json(posts);
});

router.post("/forum/courses/:courseId/posts", async (req, res): Promise<void> => {
  const courseId = Number(req.params.courseId);
  const { userId, title, body } = req.body;
  if (!userId || !title || !body) { res.status(400).json({ error: "Missing fields" }); return; }
  const [row] = await db.insert(forumPostsTable).values({ courseId, userId: Number(userId), title, body }).returning();
  res.status(201).json(row);
});

router.get("/forum/posts/:postId/replies", async (req, res): Promise<void> => {
  const postId = Number(req.params.postId);
  const replies = await db.select({
    id: forumRepliesTable.id,
    postId: forumRepliesTable.postId,
    userId: forumRepliesTable.userId,
    body: forumRepliesTable.body,
    createdAt: forumRepliesTable.createdAt,
    authorName: usersTable.name,
    authorRole: usersTable.role,
  }).from(forumRepliesTable)
    .leftJoin(usersTable, eq(forumRepliesTable.userId, usersTable.id))
    .where(eq(forumRepliesTable.postId, postId))
    .orderBy(forumRepliesTable.createdAt);
  res.json(replies);
});

router.post("/forum/posts/:postId/replies", async (req, res): Promise<void> => {
  const postId = Number(req.params.postId);
  const { userId, body } = req.body;
  if (!userId || !body) { res.status(400).json({ error: "Missing fields" }); return; }
  const [row] = await db.insert(forumRepliesTable).values({ postId, userId: Number(userId), body }).returning();
  
  // Trigger notification for post author
  try {
    const [post] = await db.select().from(forumPostsTable).where(eq(forumPostsTable.id, postId));
    if (post && post.userId !== Number(userId)) {
      const { notificationTriggers } = await import("../lib/notifications");
      notificationTriggers.forumReply(post.userId, post.title)
        .catch(err => console.error("Failed to trigger forum notification:", err));
    }
  } catch (err) {
    console.error("Error triggering forum notification:", err);
  }

  res.status(201).json(row);
});

router.patch("/forum/posts/:postId/pin", async (req, res): Promise<void> => {
  const postId = Number(req.params.postId);
  const { isPinned } = req.body;
  await db.update(forumPostsTable).set({ isPinned: Boolean(isPinned) }).where(eq(forumPostsTable.id, postId));
  res.json({ success: true });
});

router.patch("/forum/posts/:postId/upvote", async (req, res): Promise<void> => {
  const postId = Number(req.params.postId);
  const [post] = await db.select().from(forumPostsTable).where(eq(forumPostsTable.id, postId));
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  await db.update(forumPostsTable).set({ upvotes: (post.upvotes ?? 0) + 1 }).where(eq(forumPostsTable.id, postId));
  res.json({ success: true });
});

router.delete("/forum/posts/:postId", async (req, res): Promise<void> => {
  const postId = Number(req.params.postId);
  await db.delete(forumPostsTable).where(eq(forumPostsTable.id, postId));
  res.json({ success: true });
});

router.delete("/forum/replies/:replyId", async (req, res): Promise<void> => {
  const replyId = Number(req.params.replyId);
  await db.delete(forumRepliesTable).where(eq(forumRepliesTable.id, replyId));
  res.json({ success: true });
});

export default router;
