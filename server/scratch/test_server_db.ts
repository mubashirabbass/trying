
import { db, branchesTable } from "@workspace/db";

async function test() {
  const branches = await db.select().from(branchesTable);
  console.log("SERVER DB Select:", JSON.stringify(branches[0], null, 2));
  process.exit();
}

test();
