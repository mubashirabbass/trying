import { pgTable, text, serial, timestamp, integer, real, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { coursesTable } from "./courses";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),                          // Amount paid in this transaction
  totalFee: real("total_fee"),                               // Full course fee (for context)
  remainingFee: real("remaining_fee"),                       // Remaining balance after this payment
  paymentPlan: text("payment_plan").notNull().default("full"), // 'full' | 'monthly'
  installmentMonths: integer("installment_months"),          // Total months if monthly plan
  installmentNumber: integer("installment_number"),          // Which installment is this (1, 2, 3...)
  method: text("method").notNull().default("cash"),
  status: text("status").notNull().default("pending"),       // pending, approved, rejected
  receiptUrl: text("receipt_url"),
  notes: text("notes"),
  rejectionReason: text("rejection_reason"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: integer("reviewed_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => {
  return {
    userIdIdx: index("payment_user_id_idx").on(table.userId),
    courseIdIdx: index("payment_course_id_idx").on(table.courseId),
  };
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
