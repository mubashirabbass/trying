import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const identityVerificationsTable = pgTable("identity_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull().default("CNIC"),
  cnicNumber: text("cnic_number"),
  documentUrl: text("document_url").notNull(),
  status: text("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: integer("reviewed_by").references(() => usersTable.id),
});

export const insertIdentityVerificationSchema = createInsertSchema(identityVerificationsTable).omit({ id: true, submittedAt: true, reviewedAt: true, reviewedBy: true, status: true });
export type InsertIdentityVerification = z.infer<typeof insertIdentityVerificationSchema>;
export type IdentityVerification = typeof identityVerificationsTable.$inferSelect;
