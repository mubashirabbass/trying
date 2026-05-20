import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("Checking columns of table 'lessons'...");
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'lessons';
    `);
    console.log("Columns:");
    console.table(res.rows);
    await client.end();
  } catch (err) {
    console.error("Failed to query information_schema:", err);
    process.exit(1);
  }
}

main();
