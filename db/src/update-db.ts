import { db } from "./index";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Running database column additions...");
  try {
    await db.execute(sql`ALTER TABLE "lesson_completions" ADD COLUMN IF NOT EXISTS "feedback_rating" integer;`);
    console.log("Added feedback_rating column successfully!");
    
    await db.execute(sql`ALTER TABLE "lesson_completions" ADD COLUMN IF NOT EXISTS "feedback_comment" text;`);
    console.log("Added feedback_comment column successfully!");
    
    console.log("Database update complete!");
  } catch (error) {
    console.error("Failed to update database schema:", error);
  }
}

run();
