import { Router, type IRouter } from "express";
import { db, messageThreadsTable, messagesTable, usersTable, coursesTable } from "@workspace/db";
import { eq, or, desc, and } from "drizzle-orm";
import { messageMediaUpload } from "../middleware/upload";
import { uploadToCloudinary } from "../lib/cloudinary";

const router: IRouter = Router();

const allowedAttachmentTypes = new Set(["image", "audio"]);
const ONLINE_WINDOW_MS = 60_000;
const presence = new Map<number, number>();

const isOnline = (userId?: number | null) => !!userId && Date.now() - (presence.get(userId) || 0) < ONLINE_WINDOW_MS;

router.post("/presence/heartbeat", async (req, res): Promise<void> => {
  const userId = Number(req.body.userId);
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }
  presence.set(userId, Date.now());
  res.json({ online: true, lastSeenAt: new Date().toISOString() });
});

router.post("/presence/offline", async (req, res): Promise<void> => {
  const userId = Number(req.body.userId);
  if (userId) presence.delete(userId);
  res.json({ online: false });
});

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
      studentOnline: isOnline(t.studentId),
      teacherOnline: isOnline(t.teacherId),
      lastMessagePreview: lastMsg?.body || (lastMsg?.attachmentType === "image" ? "Image" : lastMsg?.attachmentType === "audio" ? "Voice note" : ""),
      messageCount: allMsgs.length
    };
  }));
  res.json(threadsWithDetails);
});

router.post("/messages/upload", messageMediaUpload.single("media"), async (req: any, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "Media file is required" });
    return;
  }

  const mimeType = String(req.file.mimetype || "").toLowerCase().split(";", 1)[0];
  const isImage = ["image/jpeg", "image/png", "image/webp"].includes(mimeType);
  const isAudio = mimeType.startsWith("audio/") || ["video/webm", "video/mp4", "application/octet-stream"].includes(mimeType);
  if (!isImage && !isAudio) {
    res.status(400).json({ error: "Only images and voice notes are allowed" });
    return;
  }

  const result = await uploadToCloudinary(
    req.file.buffer,
    isImage ? "message-images" : "message-voice-notes",
    isImage ? "image" : "video"
  );

  res.status(201).json({
    url: result.secure_url,
    publicId: result.public_id,
    type: isImage ? "image" : "audio",
    mimeType: req.file.mimetype,
    name: req.file.originalname,
    size: req.file.size,
  });
});

router.post("/messages/threads", async (req, res): Promise<void> => {
  const { studentId, teacherId, courseId } = req.body;
  if (!studentId || !teacherId) { res.status(400).json({ error: "Missing fields" }); return; }
  
  // Check if thread already exists for this student-teacher pair
  const existing = await db.select().from(messageThreadsTable)
    .where(and(
      eq(messageThreadsTable.studentId, Number(studentId)),
      eq(messageThreadsTable.teacherId, Number(teacherId))
    ));
  
  if (existing.length > 0) {
    // Thread already exists, return it
    res.json(existing[0]);
    return;
  }
  
  // Create new thread
  const [row] = await db.insert(messageThreadsTable).values({ 
    studentId: Number(studentId), 
    teacherId: Number(teacherId), 
    courseId: courseId ? Number(courseId) : null 
  }).returning();
  
  res.status(201).json(row);
});

router.get("/messages/threads/:threadId", async (req, res): Promise<void> => {
  const threadId = Number(req.params.threadId);
  const viewerId = req.query.viewerId ? Number(req.query.viewerId) : null;
  const [thread] = await db.select().from(messageThreadsTable).where(eq(messageThreadsTable.id, threadId));
  if (viewerId && thread) {
    const existing = await db.select().from(messagesTable).where(eq(messagesTable.threadId, threadId));
    await Promise.all(existing
      .filter((message) => message.senderId !== viewerId && !message.isRead)
      .map((message) => db.update(messagesTable).set({ isRead: true }).where(eq(messagesTable.id, message.id))));
  }

  const msgs = await db.select({
    id: messagesTable.id,
    threadId: messagesTable.threadId,
    senderId: messagesTable.senderId,
    body: messagesTable.body,
    attachmentUrl: messagesTable.attachmentUrl,
    attachmentType: messagesTable.attachmentType,
    attachmentName: messagesTable.attachmentName,
    attachmentSize: messagesTable.attachmentSize,
    isRead: messagesTable.isRead,
    createdAt: messagesTable.createdAt,
    senderName: usersTable.name,
    senderRole: usersTable.role,
  }).from(messagesTable)
    .leftJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
    .where(eq(messagesTable.threadId, threadId))
    .orderBy(messagesTable.createdAt);
  res.json(msgs.map((message) => {
    const recipientId = thread?.studentId === message.senderId ? thread?.teacherId : thread?.studentId;
    return {
      ...message,
      isDelivered: message.isRead || isOnline(recipientId),
    };
  }));
});

router.post("/messages/threads/:threadId/messages", async (req, res): Promise<void> => {
  const threadId = Number(req.params.threadId);
  const { senderId, body, attachmentUrl, attachmentType, attachmentName, attachmentSize } = req.body;
  const cleanBody = typeof body === "string" ? body.trim() : "";
  const cleanAttachmentUrl = typeof attachmentUrl === "string" ? attachmentUrl.trim() : "";
  const cleanAttachmentType = typeof attachmentType === "string" ? attachmentType : null;
  if (!senderId || (!cleanBody && !cleanAttachmentUrl)) { res.status(400).json({ error: "Missing fields" }); return; }
  if (cleanAttachmentUrl && (!cleanAttachmentType || !allowedAttachmentTypes.has(cleanAttachmentType))) {
    res.status(400).json({ error: "Invalid attachment type" });
    return;
  }

  const [row] = await db.insert(messagesTable).values({
    threadId,
    senderId: Number(senderId),
    body: cleanBody,
    attachmentUrl: cleanAttachmentUrl || null,
    attachmentType: cleanAttachmentUrl ? cleanAttachmentType : null,
    attachmentName: cleanAttachmentUrl && typeof attachmentName === "string" ? attachmentName : null,
    attachmentSize: cleanAttachmentUrl && attachmentSize ? Number(attachmentSize) : null,
  }).returning();
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
  const msgs = await db.select().from(messagesTable).where(eq(messagesTable.threadId, threadId));
  await Promise.all(msgs
    .filter((message) => !userId || message.senderId !== Number(userId))
    .map((message) => db.update(messagesTable).set({ isRead: true }).where(eq(messagesTable.id, message.id))));
  res.json({ success: true });
});

// Delete a single message
router.delete("/messages/:messageId", async (req, res): Promise<void> => {
  const messageId = Number(req.params.messageId);
  const userId = req.query.userId ? Number(req.query.userId) : null;
  
  if (!userId) {
    res.status(400).json({ error: "userId required" });
    return;
  }

  // Check if message exists and belongs to user
  const [message] = await db.select().from(messagesTable).where(eq(messagesTable.id, messageId));
  
  if (!message) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  if (message.senderId !== userId) {
    res.status(403).json({ error: "You can only delete your own messages" });
    return;
  }

  // Delete the message
  await db.delete(messagesTable).where(eq(messagesTable.id, messageId));
  
  res.json({ success: true, message: "Message deleted" });
});

// Delete entire thread (chat)
router.delete("/messages/threads/:threadId", async (req, res): Promise<void> => {
  const threadId = Number(req.params.threadId);
  const userId = req.query.userId ? Number(req.query.userId) : null;
  
  if (!userId) {
    res.status(400).json({ error: "userId required" });
    return;
  }

  // Check if thread exists and user is part of it
  const [thread] = await db.select().from(messageThreadsTable).where(eq(messageThreadsTable.id, threadId));
  
  if (!thread) {
    res.status(404).json({ error: "Thread not found" });
    return;
  }

  // Check if user is part of this thread (either student or teacher)
  if (thread.studentId !== userId && thread.teacherId !== userId) {
    res.status(403).json({ error: "You can only delete your own conversations" });
    return;
  }

  // Delete all messages in thread (cascade will handle this, but explicit is better)
  await db.delete(messagesTable).where(eq(messagesTable.threadId, threadId));
  
  // Delete the thread
  await db.delete(messageThreadsTable).where(eq(messageThreadsTable.id, threadId));
  
  res.json({ success: true, message: "Chat deleted successfully" });
});

// Update/Edit a message
router.patch("/messages/:messageId", async (req, res): Promise<void> => {
  const messageId = Number(req.params.messageId);
  const { userId, body } = req.body;
  
  if (!userId || !body?.trim()) {
    res.status(400).json({ error: "userId and body required" });
    return;
  }

  // Check if message exists and belongs to user
  const [message] = await db.select().from(messagesTable).where(eq(messagesTable.id, messageId));
  
  if (!message) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  if (message.senderId !== userId) {
    res.status(403).json({ error: "You can only edit your own messages" });
    return;
  }

  // Update the message
  const [updated] = await db.update(messagesTable)
    .set({ body: body.trim() })
    .where(eq(messagesTable.id, messageId))
    .returning();
  
  res.json(updated);
});

export default router;
