const pg = require('pg');
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5ueXkUdMx1Aj@ep-morning-mud-an6hqm9i.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function main() {
  console.log("Connecting...");
  try {
    await client.connect();
    console.log("Connected successfully!");
    const res = await client.query('SELECT 1 + 1 AS result');
    console.log("Result:", res.rows);
    await client.end();
  } catch (err) {
    console.error("Connection failed:", err);
    process.exit(1);
  }
}

main();
