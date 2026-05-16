
import { db } from "../db/src/index";
import { sql } from "drizzle-orm";

async function inspect() {
  console.log("Inspecting branches table columns...");
  try {
    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'branches'
    `);
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

inspect();
