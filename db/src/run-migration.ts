import { pool } from "./index";

async function runMigration() {
  console.log("Starting column addition migrations...");
  const client = await pool.connect();
  try {
    const alterStatements = [
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "qualification" text;`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "specialization" text;`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "experience" text;`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "salary" integer;`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" text;`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "designation" text;`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" text;`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "joining_date" timestamp with time zone;`
    ];

    for (const sql of alterStatements) {
      console.log(`Executing: ${sql}`);
      await client.query(sql);
    }

    console.log("Migrations applied successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
