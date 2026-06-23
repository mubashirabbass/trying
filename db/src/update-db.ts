import { db } from "./index";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Running database migrations...");
  try {
    await db.execute(sql`ALTER TABLE "lesson_completions" ADD COLUMN IF NOT EXISTS "feedback_rating" integer;`);
    console.log("Added feedback_rating column successfully!");
    
    await db.execute(sql`ALTER TABLE "lesson_completions" ADD COLUMN IF NOT EXISTS "feedback_comment" text;`);
    console.log("Added feedback_comment column successfully!");
    
    // Create course_categories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "course_categories" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);
    console.log("Created course_categories table successfully!");

    // Seed default categories if they don't exist
    const defaultCategories = [
      { name: "IT", slug: "it", description: "IT Specialization" },
      { name: "Graphics", slug: "graphics", description: "Graphic Design" },
      { name: "Freelancing", slug: "freelancing", description: "Freelancing Mastery" },
      { name: "AI", slug: "ai", description: "AI Engineering" },
      { name: "MS Office", slug: "ms-office", description: "MS Office Suite" },
      { name: "Web", slug: "web", description: "Web Development" },
      { name: "Computer Basic", slug: "computer-basic", description: "Computer Basic" }
    ];

    for (const cat of defaultCategories) {
      await db.execute(sql`
        INSERT INTO "course_categories" ("name", "slug", "description")
        VALUES (${cat.name}, ${cat.slug}, ${cat.description})
        ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED.name, "description" = EXCLUDED.description;
      `);
    }
    console.log("Default categories seeded successfully!");
    
    console.log("Database update complete!");
  } catch (error) {
    console.error("Failed to update database schema:", error);
  }
}

run();
