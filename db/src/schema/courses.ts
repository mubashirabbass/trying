import { pgTable, text, serial, timestamp, boolean, integer, real, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  duration: text("duration").notNull(),
  totalDurationHours: real("total_duration_hours").notNull().default(0),
  fee: real("fee").notNull().default(0),
  thumbnail: text("thumbnail"),
  syllabus: text("syllabus"),
  teacherId: integer("teacher_id").references(() => usersTable.id),
  status: text("status").notNull().default("draft"), // draft, pending, live, rejected, archived
  rejectionNote: text("rejection_note"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isFree: boolean("is_free").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => {
  return {
    slugIndex: uniqueIndex("course_slug_idx").on(table.slug),
    teacherIdIndex: index("course_teacher_id_idx").on(table.teacherId),
  };
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;
