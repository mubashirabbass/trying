import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
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
  categoryId: integer("category_id"),
  rating: text("rating").default("5"),
  category: text("category"),
  metric1Value: text("metric1_value"),
  metric1Label: text("metric1_label"),
  metric2Value: text("metric2_value"),
  metric2Label: text("metric2_label"),
  metric3Value: text("metric3_value"),
  metric3Label: text("metric3_label"),
  externalLink: text("external_link"),
  storyContent: text("story_content"),
  storyType: text("story_type").default("standard"),
  isHidden: boolean("is_hidden").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSuccessStorySchema = createInsertSchema(successStoriesTable).omit({ id: true, createdAt: true });
export type InsertSuccessStory = z.infer<typeof insertSuccessStorySchema>;
export type SuccessStory = typeof successStoriesTable.$inferSelect;
