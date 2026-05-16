import { Router, type IRouter } from "express";
import { db, messageThreadsTable, messagesTable, usersTable, coursesTable } from "@workspace/db";
import { eq, or, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/messages/threads", async (req, res): Promise<void> => {
  const userId = req.query.userId ? Number(req.query.userId) : null;
  const userRole = (req as any).user?.role;

  let queryBuilder = db.select({
    id: messageThreadsTable.id,
    studentId: messageThreadsTable.studentId,
    teacherId: messageThreadsTable.teacherId,
    courseId: messageThreadsTable.courseId,
    lastMessageAt: messageThreadsTable.lastMessageAt,
    createdAt: messageThreadsTable.createdAt,
    courseName: coursesTable.title,
  }).from(messageThreadsTable)
    .leftJoin(coursesTable, eq(messageThreadsTable.courseId, coursesTable.id));

  let threads;
  if (userId) {
    threads = await queryBuilder
      .where(or(eq(messageThreadsTable.studentId, userId), eq(messageThreadsTable.teacherId, userId)))
      .orderBy(desc(messageThreadsTable.lastMessageAt));
  } else if (userRole === "admin") {
    threads = await queryBuilder.orderBy(desc(messageThreadsTable.lastMessageAt));
  } else {
    res.status(400).json({ error: "userId required for non-admin users" });
    return;
  }

  const threadsWithDetails = await Promise.all(threads.map(async (t) => {
    const [student] = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, t.studentId));
    const [teacher] = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, t.teacherId));
    
    const [lastMsg] = await db.select().from(messagesTable)
      .where(eq(messagesTable.threadId, t.id))
      .orderBy(desc(messagesTable.createdAt))
      .limit(1);
    
    const allMsgs = await db.select().from(messagesTable).where(eq(messagesTable.threadId, t.id));

    return { 
      ...t, 
      studentName: student?.name, 
      teacherName: teacher?.name,
      lastMessagePreview: lastMsg?.body,
      messageCount: allMsgs.length
    };
  }));
  res.json(threadsWithDetails);
});

router.post("/messages/threads", async (req, res): Promise<void> => {
  const { studentId, teacherId, courseId } = req.body;
  if (!studentId || !teacherId) { res.status(400).json({ error: "Missing fields" }); return; }
  const existing = await db.select().from(messageThreadsTable)
    .where(eq(messageThreadsTable.studentId, Number(studentId)));
  const found = existing.find(t => t.teacherId === Number(teacherId) && t.courseId === (courseId ? Number(courseId) : null));
  if (found) { res.json(found); return; }
  const [row] = await db.insert(messageThreadsTable).values({ studentId: Number(studentId), teacherId: Number(teacherId), courseId: courseId ? Number(courseId) : null }).returning();
  res.status(201).json(row);
});

router.get("/messages/threads/:threadId", async (req, res): Promise<void> => {
  const threadId = Number(req.params.threadId);
  const msgs = await db.select({
    id: messagesTable.id,
    threadId: messagesTable.threadId,
    senderId: messagesTable.senderId,
    body: messagesTable.body,
    isRead: messagesTable.isRead,
    createdAt: messagesTable.createdAt,
    senderName: usersTable.name,
    senderRole: usersTable.role,
  }).from(messagesTable)
    .leftJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
    .where(eq(messagesTable.threadId, threadId))
    .orderBy(messagesTable.createdAt);
  res.json(msgs);
});

router.post("/messages/threads/:threadId/messages", async (req, res): Promise<void> => {
  const threadId = Number(req.params.threadId);
  const { senderId, body } = req.body;
  if (!senderId || !body) { res.status(400).json({ error: "Missing fields" }); return; }
  const [row] = await db.insert(messagesTable).values({ threadId, senderId: Number(senderId), body }).returning();
  await db.update(messageThreadsTable).set({ lastMessageAt: new Date() }).where(eq(messageThreadsTable.id, threadId));
  
  // Trigger notification for recipient
  try {
    const [thread] = await db.select().from(messageThreadsTable).where(eq(messageThreadsTable.id, threadId));
    const [sender] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, Number(senderId)));
    if (thread && sender) {
      const recipientId = thread.studentId === Number(senderId) ? thread.teacherId : thread.studentId;
      const { notificationTriggers } = await import("../lib/notifications");
      notificationTriggers.newMessage(recipientId, sender.name || "A user")
        .catch(err => console.error("Failed to trigger message notification:", err));
    }
  } catch (err) {
    console.error("Error triggering message notification:", err);
  }

  res.status(201).json(row);
});

router.patch("/messages/threads/:threadId/read", async (req, res): Promise<void> => {
  const threadId = Number(req.params.threadId);
  const { userId } = req.body;
  await db.update(messagesTable).set({ isRead: true })
    .where(eq(messagesTable.threadId, threadId));
  res.json({ success: true });
});

export default router;
