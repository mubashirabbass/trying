import { pgTable, text, serial, timestamp, integer, index, date, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const teacherAttendanceTable = pgTable("teacher_attendance", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => usersTable.id),
  date: date("date").notNull(),
  status: text("status").notNull().default("present"), // present, absent, late, half_day, leave
  checkInTime: text("check_in_time"), // Time as string (HH:MM format)
  checkOutTime: text("check_out_time"), // Time as string (HH:MM format)
  workingHours: text("working_hours"), // Calculated working hours
  recordedById: integer("recorded_by_id").references(() => usersTable.id), // Admin who marked it (null if self-marked)
  notes: text("notes"),
  leaveType: text("leave_type"), // sick, casual, earned, unpaid
  isApproved: boolean("is_approved").default(true), // For leave requests
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => {
  return {
    teacherIdIndex: index("teacher_attendance_teacher_id_idx").on(table.teacherId),
    dateIndex: index("teacher_attendance_date_idx").on(table.date),
  };
});

export const insertTeacherAttendanceSchema = createInsertSchema(teacherAttendanceTable).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export type InsertTeacherAttendance = z.infer<typeof insertTeacherAttendanceSchema>;
export type TeacherAttendance = typeof teacherAttendanceTable.$inferSelect;
