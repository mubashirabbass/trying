import { Router, type IRouter } from "express";
import { db, messageThreadsTable, messagesTable, usersTable, coursesTable } from "@workspace/db";
import { eq, or, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/messages/threads", async (req, res): Promise<void> => {
  const userId = Number(req.query.userId);
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }
  const threads = await db.select({
    id: messageThreadsTable.id,
    studentId: messageThreadsTable.studentId,
    teacherId: messageThreadsTable.teacherId,
    courseId: messageThreadsTable.courseId,
    lastMessageAt: messageThreadsTable.lastMessageAt,
    createdAt: messageThreadsTable.createdAt,
    courseName: coursesTable.title,
  }).from(messageThreadsTable)
    .leftJoin(coursesTable, eq(messageThreadsTable.courseId, coursesTable.id))
    .where(or(eq(messageThreadsTable.studentId, userId), eq(messageThreadsTable.teacherId, userId)))
    .orderBy(desc(messageThreadsTable.lastMessageAt));

  const threadsWithUsers = await Promise.all(threads.map(async (t) => {
    const [student] = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, t.studentId));
    const [teacher] = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, t.teacherId));
    return { ...t, studentName: student?.name, teacherName: teacher?.name };
  }));
  res.json(threadsWithUsers);
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
