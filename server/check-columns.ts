import { pool } from "@workspace/db";

async function main() {
  const res = await pool.query(`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'success_stories';
  `);
  console.log("COLUMNS:", res.rows);
}

main().catch(console.error).finally(() => pool.end());
