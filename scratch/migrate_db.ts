import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("Running manual migration to add notes and resources to lessons table...");
  try {
    await client.connect();
    
    // Add notes column
    console.log("Adding column 'notes' if it does not exist...");
    await client.query(`
      ALTER TABLE lessons ADD COLUMN IF NOT EXISTS notes TEXT;
    `);
    
    // Add resources column
    console.log("Adding column 'resources' if it does not exist...");
    await client.query(`
      ALTER TABLE lessons ADD COLUMN IF NOT EXISTS resources TEXT;
    `);
    
    console.log("Migration executed successfully!");
    
    // Double check column schema
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'lessons';
    `);
    console.log("Updated columns of table 'lessons':");
    console.table(res.rows);
    
    await client.end();
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

main();
