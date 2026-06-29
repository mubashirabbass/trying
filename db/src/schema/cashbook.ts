import { pgTable, text, serial, timestamp, integer, decimal, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cashbookEntriesTable = pgTable("cashbook_entries", {
  id: serial("id").primaryKey(),
  
  // Date and reference info
  entryDate: timestamp("entry_date", { withTimezone: true }).notNull(),
  pageNo: text("page_no").notNull().default(""),
  
  // Entry details
  description: text("description").notNull(),
  category: text("category").notNull().default(""),
  
  // Type: income or expense
  entryType: text("entry_type").notNull(), // 'income' | 'expense'
  
  // Amount in Pakistani currency (Rupees and Paisa)
  rupees: integer("rupees").notNull().default(0),
  paisa: integer("paisa").notNull().default(0),
  
  // Month and year for filtering/grouping
  month: text("month").notNull(), // Urdu month name
  year: text("year").notNull(),
  
  // Audit fields
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => {
  return {
    entryDateIdx: index("cashbook_entries_entry_date_idx").on(table.entryDate),
    entryTypeIdx: index("cashbook_entries_entry_type_idx").on(table.entryType),
    monthYearIdx: index("cashbook_entries_month_year_idx").on(table.month, table.year),
    categoryIdx: index("cashbook_entries_category_idx").on(table.category),
    createdAtIdx: index("cashbook_entries_created_at_idx").on(table.createdAt),
  };
});

export const insertCashbookEntrySchema = createInsertSchema(cashbookEntriesTable).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const updateCashbookEntrySchema = insertCashbookEntrySchema.partial();

export type InsertCashbookEntry = z.infer<typeof insertCashbookEntrySchema>;
export type CashbookEntry = typeof cashbookEntriesTable.$inferSelect;
export type UpdateCashbookEntry = z.infer<typeof updateCashbookEntrySchema>;