import { db, branchesTable } from "@workspace/db";
import { count } from "drizzle-orm";

async function checkBranches() {
  const result = await db.select({ c: count() }).from(branchesTable);
  console.log(`Total branches: ${result[0].c}`);
}

checkBranches().catch(console.error);
