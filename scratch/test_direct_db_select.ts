
import { db, branchesTable } from "../db/src/index";

async function test() {
  const branches = await db.select().from(branchesTable);
  console.log("Direct DB Select:", JSON.stringify(branches[0], null, 2));
  process.exit();
}

test();
