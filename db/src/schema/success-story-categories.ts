import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const successStoryCategoriesTable = pgTable("success_story_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSuccessStoryCategorySchema = createInsertSchema(successStoryCategoriesTable).omit({ id: true, createdAt: true });
export type InsertSuccessStoryCategory = z.infer<typeof insertSuccessStoryCategorySchema>;
export type SuccessStoryCategory = typeof successStoryCategoriesTable.$inferSelect;
