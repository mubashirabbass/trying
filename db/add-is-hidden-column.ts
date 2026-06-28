import "dotenv/config";
import { db } from "./src/index";
import { sql } from "drizzle-orm";

async function addColumn() {
  try {
    console.log("Adding is_hidden column to announcement_logs table...");
    await db.execute(sql`
      ALTER TABLE announcement_logs 
      ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false NOT NULL;
    `);
    console.log("✓ Column added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error adding column:", error);
    process.exit(1);
  }
}

addColumn();
