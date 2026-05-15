
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { pgTable, serial, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";

// Minimal schema for listing users
const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("student"),
  isActive: boolean("is_active").notNull().default(true),
});

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function listUsers() {
  const users = await db.select().from(usersTable);
  console.log("Users in DB:");
  users.forEach(u => {
    console.log(`- ${u.name} (${u.email}) [${u.role}]`);
  });
  process.exit(0);
}

listUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
