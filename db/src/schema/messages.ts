import { pgTable, text, serial, timestamp, boolean, integer, unique, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { coursesTable } from "./courses";

export const messageThreadsTable = pgTable("message_threads", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  teacherId: integer("teacher_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  courseId: integer("course_id").references(() => coursesTable.id, { onDelete: "set null" }),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Ensure only one thread per student-teacher pair
  uniqueStudentTeacher: unique().on(table.studentId, table.teacherId),
  studentIdIdx: index("thread_student_id_idx").on(table.studentId),
  teacherIdIdx: index("thread_teacher_id_idx").on(table.teacherId),
}));

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  threadId: integer("thread_id").notNull().references(() => messageThreadsTable.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  attachmentUrl: text("attachment_url"),
  attachmentType: text("attachment_type"),
  attachmentName: text("attachment_name"),
  attachmentSize: integer("attachment_size"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  threadIdIdx: index("message_thread_id_idx").on(table.threadId),
  senderIdIdx: index("message_sender_id_idx").on(table.senderId),
}));

export const insertMessageSchema = createInsertSchema(messagesTable).omit({ id: true, createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;

export const insertThreadSchema = createInsertSchema(messageThreadsTable).omit({ id: true, createdAt: true, lastMessageAt: true });
export type InsertThread = z.infer<typeof insertThreadSchema>;
export type MessageThread = typeof messageThreadsTable.$inferSelect;
