import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5ueXkUdMx1Aj@ep-morning-mud-an6hqm9i.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function main() {
  console.log("Connecting to database...");
  try {
    await client.connect();
    console.log("Connected successfully!");

    // Create teacher_attendance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "teacher_attendance" (
        "id" serial PRIMARY KEY NOT NULL,
        "teacher_id" integer NOT NULL,
        "date" date NOT NULL,
        "status" text DEFAULT 'present' NOT NULL,
        "check_in_time" text,
        "check_out_time" text,
        "working_hours" text,
        "recorded_by_id" integer,
        "notes" text,
        "leave_type" text,
        "is_approved" boolean DEFAULT true,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    console.log("Created teacher_attendance table (if not exists)");

    // Add foreign key constraints
    try {
      await client.query(`
        ALTER TABLE "teacher_attendance" 
        ADD CONSTRAINT "teacher_attendance_teacher_id_users_id_fk" 
        FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
      `);
      console.log("Added foreign key constraint for teacher_id");
    } catch (e) {
      console.log("FK teacher_id constraint might already exist:", e.message);
    }

    try {
      await client.query(`
        ALTER TABLE "teacher_attendance" 
        ADD CONSTRAINT "teacher_attendance_recorded_by_id_users_id_fk" 
        FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
      `);
      console.log("Added foreign key constraint for recorded_by_id");
    } catch (e) {
      console.log("FK recorded_by_id constraint might already exist:", e.message);
    }

    // Add indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS "teacher_attendance_teacher_id_idx" ON "teacher_attendance" USING btree ("teacher_id");
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "teacher_attendance_date_idx" ON "teacher_attendance" USING btree ("date");
    `);
    console.log("Created indexes successfully");

    // Let's verify table exists now
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'teacher_attendance'
      );
    `);
    console.log("Verified: Does teacher_attendance table exist now?", tableCheck.rows[0].exists);

    await client.end();
  } catch (err) {
    console.error("Database table creation failed:", err);
    process.exit(1);
  }
}

main();
