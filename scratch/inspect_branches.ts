import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function inspectBranches() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`SELECT * FROM branches`);
    console.log("Branches full info:");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("Error inspecting branches:", err);
  } finally {
    await pool.end();
  }
}

inspectBranches();
