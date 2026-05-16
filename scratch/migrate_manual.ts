
import { db } from "../db/src/index";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Running manual migration for branches table...");
  try {
    // Add head_name if it doesn't exist
    await db.execute(sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS head_name text`);
    // Add manual_student_count if it doesn't exist
    await db.execute(sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS manual_student_count integer NOT NULL DEFAULT 0`);
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit();
  }
}

migrate();
