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

    await client.query(`
      CREATE TABLE IF NOT EXISTS "franchise_applications" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "address" TEXT NOT NULL,
        "city" TEXT,
        "description" TEXT NOT NULL,
        "status" TEXT DEFAULT 'pending',
        "admin_notes" TEXT,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("franchise_applications table created successfully!");

    await client.end();
    console.log("Migration complete.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

main();
