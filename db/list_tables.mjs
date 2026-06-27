import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5ueXkUdMx1Aj@ep-morning-mud-an6hqm9i.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require'
});
await client.connect();
const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
console.log("All tables:", res.rows.map(r => r.table_name));
await client.end();
