import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const franchiseApplicationsTable = pgTable("franchise_applications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city"),
  description: text("description").notNull(),
  status: text("status").default("pending"), // pending | reviewed | approved | rejected
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
