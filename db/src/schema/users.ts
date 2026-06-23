import { pgTable, text, serial, timestamp, boolean, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { branchesTable } from "./branches";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("student"),
  phone: text("phone"),
  cnic: text("cnic"),
  dob: timestamp("dob", { withTimezone: true }),
  avatar: text("avatar"),
  qualification: text("qualification"),
  specialization: text("specialization"),
  obtainedMarks: integer("obtained_marks"),
  totalMarks: integer("total_marks"),
  educationDocumentUrl: text("education_document_url"),
  experience: text("experience"),
  salary: integer("salary"),
  address: text("address"),
  designation: text("designation"),
  gender: text("gender"),
  joiningDate: timestamp("joining_date", { withTimezone: true }),
  branchId: integer("branch_id").references(() => branchesTable.id),
  nameUrdu: text("name_urdu"),
  fatherName: text("father_name"),
  session: text("session"),
  semesterTerm: text("semester_term"),
  shift: text("shift"),
  rollNo: text("roll_no"),
  regNo: text("reg_no"),
  department: text("department"),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  isIdentityVerified: boolean("is_identity_verified").notNull().default(false),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => {
  return {
    branchIdIdx: index("user_branch_id_idx").on(table.branchId),
  };
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
