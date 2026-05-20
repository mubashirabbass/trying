import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5ueXkUdMx1Aj@ep-morning-mud-an6hqm9i.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function main() {
  console.log("Connecting...");
  try {
    await client.connect();
    console.log("Connected successfully!");

    // Create live_classes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "live_classes" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "meeting_link" text NOT NULL,
        "target_type" text NOT NULL,
        "course_id" integer,
        "student_id" integer,
        "scheduled_at" timestamp with time zone NOT NULL DEFAULT now(),
        "description" text,
        "is_completed" boolean NOT NULL DEFAULT false,
        "created_at" timestamp with time zone NOT NULL DEFAULT now()
      );
    `);
    console.log("Created live_classes table");

    // Add foreign keys
    await client.query(`
      ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE no action;
    `).catch(e => console.log("FK course_id exists or error:", e.message));

    await client.query(`
      ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE no action;
    `).catch(e => console.log("FK student_id exists or error:", e.message));

    console.log("Database schema successfully updated for live_classes!");
    await client.end();
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

main();
