import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function checkBranchesColumns() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'branches'
    `);
    console.log("Columns in 'branches' table:");
    res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
    
    const data = await pool.query(`SELECT count(*) FROM branches`);
    console.log(`Total branches in DB: ${data.rows[0].count}`);
  } catch (err) {
    console.error("Error checking columns:", err);
  } finally {
    await pool.end();
  }
}

checkBranchesColumns();
