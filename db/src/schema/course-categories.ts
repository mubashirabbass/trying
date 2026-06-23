import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const courseCategoriesTable = pgTable("course_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCourseCategorySchema = createInsertSchema(courseCategoriesTable).omit({ id: true, createdAt: true });
export type InsertCourseCategory = z.infer<typeof insertCourseCategorySchema>;
export type CourseCategory = typeof courseCategoriesTable.$inferSelect;
