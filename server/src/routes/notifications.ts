import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

import { authenticate, authorize } from "../middleware/auth";

const router: IRouter = Router();

router.use(authenticate);

router.get("/notifications", async (req: any, res): Promise<void> => {
  const userId = Number(req.query.userId);
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }

  // Only owner or admin
  if (req.user?.role !== "admin" && req.user?.id !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rows = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(rows);
});

router.patch("/notifications/:id/read", async (req: any, res): Promise<void> => {
  const id = Number(req.params.id);
  
  // Verify ownership before updating
  const [notification] = await db.select().from(notificationsTable).where(eq(notificationsTable.id, id));
  if (!notification) { res.status(404).json({ error: "Not found" }); return; }
  if (req.user?.id !== notification.userId && req.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, id));
  res.json({ success: true });
});

router.patch("/notifications/read-all", async (req: any, res): Promise<void> => {
  const userId = Number(req.query.userId);
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }

  // Only owner or admin
  if (req.user?.role !== "admin" && req.user?.id !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.update(notificationsTable).set({ isRead: true }).where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));
  res.json({ success: true });
});

router.post("/notifications", authorize("admin"), async (req, res): Promise<void> => {
  const { userId, type, title, message, link } = req.body;
  if (!userId || !title || !message) { res.status(400).json({ error: "Missing fields" }); return; }
  const [row] = await db.insert(notificationsTable).values({ userId: Number(userId), type: type || "info", title, message, link }).returning();
  res.status(201).json(row);
});

router.delete("/notifications/:id", async (req: any, res): Promise<void> => {
  const id = Number(req.params.id);

  // Verify ownership before deleting
  const [notification] = await db.select().from(notificationsTable).where(eq(notificationsTable.id, id));
  if (!notification) { res.status(404).json({ error: "Not found" }); return; }
  if (req.user?.id !== notification.userId && req.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db.delete(notificationsTable).where(eq(notificationsTable.id, id));
  res.json({ success: true });
});

export default router;
