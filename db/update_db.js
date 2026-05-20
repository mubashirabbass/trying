import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5ueXkUdMx1Aj@ep-morning-mud-an6hqm9i.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function main() {
  console.log("Connecting to database from db directory...");
  try {
    await client.connect();
    console.log("Connected successfully!");

    // 1. Add columns to lesson_completions
    console.log("Checking columns on lesson_completions...");
    await client.query(`
      ALTER TABLE "lesson_completions" ADD COLUMN IF NOT EXISTS "feedback_rating" integer;
    `);
    await client.query(`
      ALTER TABLE "lesson_completions" ADD COLUMN IF NOT EXISTS "feedback_comment" text;
    `);
    console.log("Updated lesson_completions table");

    // 2. Add columns to lessons
    console.log("Checking columns on lessons...");
    await client.query(`
      ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "notes" text;
    `);
    await client.query(`
      ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "resources" text;
    `);
    console.log("Updated lessons table");

    // 3. Create live_classes table
    console.log("Checking live_classes table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "live_classes" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "meeting_link" text NOT NULL,
        "target_type" text NOT NULL,
        "course_id" integer,
        "student_id" integer,
        "scheduled_at" timestamp with time zone DEFAULT now() NOT NULL,
        "description" text,
        "is_completed" boolean DEFAULT false NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    console.log("Created live_classes table");

    // 4. Add constraints to live_classes
    console.log("Checking constraints on live_classes...");
    await client.query(`
      ALTER TABLE "live_classes" 
      ADD CONSTRAINT "live_classes_course_id_courses_id_fk" 
      FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") 
      ON DELETE cascade ON UPDATE no action;
    `).catch(e => console.log("FK course_id for live_classes already exists or error:", e.message));

    await client.query(`
      ALTER TABLE "live_classes" 
      ADD CONSTRAINT "live_classes_student_id_users_id_fk" 
      FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") 
      ON DELETE cascade ON UPDATE no action;
    `).catch(e => console.log("FK student_id for live_classes already exists or error:", e.message));

    console.log("Database update completed successfully!");
    await client.end();
  } catch (err) {
    console.error("Database update failed:", err);
    process.exit(1);
  }
}

main();
