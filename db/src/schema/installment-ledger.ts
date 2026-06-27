import { pgTable, serial, timestamp, integer, real, text, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { coursesTable } from "./courses";

/**
 * One row per (student, course, month).
 * Tracks the aggregated payment state for a single monthly installment.
 */
export const installmentLedgerTable = pgTable("installment_ledger", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  monthNumber: integer("month_number").notNull(),          // 1-based (Month 1, Month 2 …)
  installmentAmount: real("installment_amount").notNull(), // Fixed monthly fee (totalFee / durationMonths)
  totalFee: real("total_fee").notNull(),                   // Full course fee (for receipt display)
  totalPaid: real("total_paid").notNull().default(0),      // Cumulative paid for this month so far
  remainingBalance: real("remaining_balance").notNull(),   // installmentAmount - totalPaid
  status: text("status").notNull().default("unpaid"),      // 'unpaid' | 'partial' | 'paid'
  /** JSON array of {paymentId, amount, paidAt, method, notes} */
  paymentHistory: jsonb("payment_history").notNull().default("[]"),
  receiptNumber: text("receipt_number"),                   // e.g. RCP-2026-0001-M01
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({
  uniqueEntry: uniqueIndex("ledger_user_course_month_idx").on(table.userId, table.courseId, table.monthNumber),
}));

export const insertInstallmentLedgerSchema = createInsertSchema(installmentLedgerTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInstallmentLedger = z.infer<typeof insertInstallmentLedgerSchema>;
export type InstallmentLedger = typeof installmentLedgerTable.$inferSelect;
