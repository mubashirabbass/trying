import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const successStoriesTable = pgTable("success_stories", {
  id: serial("id").primaryKey(),
  studentName: text("student_name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image"),
  course: text("course"),
  achievement: text("achievement"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSuccessStorySchema = createInsertSchema(successStoriesTable).omit({ id: true, createdAt: true });
export type InsertSuccessStory = z.infer<typeof insertSuccessStorySchema>;
export type SuccessStory = typeof successStoriesTable.$inferSelect;
