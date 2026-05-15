
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { pgTable, serial, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Minimal schema for updating users
const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function resetPasswords() {
  const newHash = await bcrypt.hash("password123", 12);
  
  const emails = ["admin@gmail.com", "test@example.com", "haider@gmail.com"];
  
  for (const email of emails) {
    await db.update(usersTable)
      .set({ passwordHash: newHash })
      .where(eq(usersTable.email, email));
    console.log(`Reset password for ${email} to 'password123'`);
  }
  process.exit(0);
}

resetPasswords().catch(err => {
  console.error(err);
  process.exit(1);
});
