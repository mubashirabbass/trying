
import { db } from "../db/src/index";
import { branchesTable } from "../db/src/schema/branches";
import { eq } from "drizzle-orm";

async function test() {
  const allBranches = await db.select().from(branchesTable);
  if (allBranches.length === 0) {
    console.log("No branches found");
    process.exit();
  }

  const target = allBranches[0];
  console.log("Testing branch:", target.name, "ID:", target.id);
  console.log("Current Head:", target.headName);

  const newHead = "Test Head " + Date.now();
  console.log("Updating to:", newHead);

  await db.update(branchesTable)
    .set({ headName: newHead })
    .where(eq(branchesTable.id, target.id));

  const [updated] = await db.select().from(branchesTable).where(eq(branchesTable.id, target.id));
  console.log("Updated Head:", updated.headName);

  if (updated.headName === newHead) {
    console.log("DB Update Works!");
  } else {
    console.log("DB Update FAILED!");
  }
  process.exit();
}

test();
