import { pgTable, text, serial, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { lessonsTable } from "./lessons";

export const videoAccessLogsTable = pgTable("video_access_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  accessedAt: timestamp("accessed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    userIdIdx: index("video_log_user_id_idx").on(table.userId),
    lessonIdIdx: index("video_log_lesson_id_idx").on(table.lessonId),
  };
});

export const insertVideoAccessLogSchema = createInsertSchema(videoAccessLogsTable).omit({ id: true, accessedAt: true });
export type InsertVideoAccessLog = z.infer<typeof insertVideoAccessLogSchema>;
export type VideoAccessLog = typeof videoAccessLogsTable.$inferSelect;
