import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function checkBranchesData() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`SELECT id, name, is_active FROM branches`);
    console.log("Branches Data:");
    res.rows.forEach(row => console.log(`- ID: ${row.id}, Name: ${row.name}, Active: ${row.is_active}`));
  } catch (err) {
    console.error("Error checking data:", err);
  } finally {
    await pool.end();
  }
}

checkBranchesData();
