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
    
    // Add min_attendance_percentage to courses
    await client.query(`
      ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "min_attendance_percentage" real DEFAULT 75 NOT NULL;
    `);
    console.log("Updated courses table");

    // Create attendance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "attendance" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "course_id" integer NOT NULL,
        "date" date NOT NULL,
        "status" text DEFAULT 'present' NOT NULL,
        "recorded_by_id" integer,
        "notes" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    console.log("Created attendance table");

    // Add foreign keys
    await client.query(`
      ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    `).catch(e => console.log("FK user_id exists"));

    await client.query(`
      ALTER TABLE "attendance" ADD CONSTRAINT "attendance_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;
    `).catch(e => console.log("FK course_id exists"));

    await client.query(`
      ALTER TABLE "attendance" ADD CONSTRAINT "attendance_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
    `).catch(e => console.log("FK recorded_by_id exists"));

    // Add indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS "attendance_user_id_idx" ON "attendance" USING btree ("user_id");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "attendance_course_id_idx" ON "attendance" USING btree ("course_id");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "attendance_date_idx" ON "attendance" USING btree ("date");
    `);
    console.log("Added indexes");

    await client.end();
  } catch (err) {
    console.error("Connection failed:", err);
    process.exit(1);
  }
}

main();
