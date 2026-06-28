import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  label: text("label"),
  category: text("category").notNull().default("general"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const announcementLogsTable = pgTable("announcement_logs", {
  id: serial("id").primaryKey(),
  sentBy: text("sent_by").notNull(),
  targetType: text("target_type").notNull().default("ALL"),
  targetId: text("target_id"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isHidden: boolean("is_hidden").notNull().default(false),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSettingSchema = createInsertSchema(settingsTable).omit({ id: true, updatedAt: true });
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settingsTable.$inferSelect;

export const insertAnnouncementSchema = createInsertSchema(announcementLogsTable).omit({ id: true, sentAt: true });
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type AnnouncementLog = typeof announcementLogsTable.$inferSelect;
