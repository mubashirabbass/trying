import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const userId = Number(req.query.userId);
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }
  const rows = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(rows);
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, id));
  res.json({ success: true });
});

router.patch("/notifications/read-all", async (req, res): Promise<void> => {
  const userId = Number(req.query.userId);
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }
  await db.update(notificationsTable).set({ isRead: true }).where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));
  res.json({ success: true });
});

router.post("/notifications", async (req, res): Promise<void> => {
  const { userId, type, title, message, link } = req.body;
  if (!userId || !title || !message) { res.status(400).json({ error: "Missing fields" }); return; }
  const [row] = await db.insert(notificationsTable).values({ userId: Number(userId), type: type || "info", title, message, link }).returning();
  res.status(201).json(row);
});

router.delete("/notifications/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(notificationsTable).where(eq(notificationsTable.id, id));
  res.json({ success: true });
});

export default router;
