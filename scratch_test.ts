import { db } from "./db/src/index";
import { sql } from "drizzle-orm";

async function main() {
  console.log("--- RUNNING DIRECT SQL SCHEMA MIGRATION ---");
  
  await db.execute(sql`
    ALTER TABLE articles 
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;
  `);
  
  console.log("Migration executed successfully! is_featured column is live.");
  process.exit(0);
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
