
import { db } from "../db/src/index";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Adding image column to branches...");
  try {
    await db.execute(sql`ALTER TABLE branches ADD COLUMN IF NOT EXISTS image text`);
    console.log("Success!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

migrate();
