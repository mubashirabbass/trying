import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { coursesTable } from "./courses";

export const liveClassesTable = pgTable("live_classes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  meetingLink: text("meeting_link").notNull(),
  targetType: text("target_type").notNull(), // "all" | "course" | "student"
  courseId: integer("course_id").references(() => coursesTable.id, { onDelete: "cascade" }),
  studentId: integer("student_id").references(() => usersTable.id, { onDelete: "cascade" }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull().defaultNow(),
  description: text("description"),
  isCompleted: boolean("is_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: integer("created_by").references(() => usersTable.id, { onDelete: "set null" }),
  createdByRole: text("created_by_role"), // "admin" | "teacher"
});

export const insertLiveClassSchema = createInsertSchema(liveClassesTable).omit({ id: true, createdAt: true });
export type InsertLiveClass = z.infer<typeof insertLiveClassSchema>;
export type LiveClass = typeof liveClassesTable.$inferSelect;
