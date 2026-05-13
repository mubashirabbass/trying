import { pgTable, text, serial, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { coursesTable } from "./courses";
import { sectionsTable } from "./sections";

export const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  sectionId: integer("section_id").references(() => sectionsTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  encryptedYoutubeId: text("encrypted_youtube_id"),
  pdfUrl: text("pdf_url"),
  duration: integer("duration"),
  orderIndex: integer("order_index").notNull().default(0),
  completionThreshold: integer("completion_threshold").notNull().default(80), // Percentage
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    courseIdIdx: index("lesson_course_id_idx").on(table.courseId),
    sectionIdIdx: index("lesson_section_id_idx").on(table.sectionId),
  };
});

import { usersTable } from "./users";

export const lessonCompletionsTable = pgTable("lesson_completions", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  watchedPercent: integer("watched_percent").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => {
  return {
    lessonIdIdx: index("lesson_completion_lesson_id_idx").on(table.lessonId),
    userIdIdx: index("lesson_completion_user_id_idx").on(table.userId),
  };
});

export const insertLessonSchema = createInsertSchema(lessonsTable).omit({ id: true, createdAt: true });
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessonsTable.$inferSelect;

export const insertLessonCompletionSchema = createInsertSchema(lessonCompletionsTable).omit({ id: true, updatedAt: true });
export type InsertLessonCompletion = z.infer<typeof insertLessonCompletionSchema>;
export type LessonCompletion = typeof lessonCompletionsTable.$inferSelect;
