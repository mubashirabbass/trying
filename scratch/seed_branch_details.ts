
import { db } from "../db/src/index";
import { branchesTable } from "../db/src/schema/branches";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Updating branches with missing details...");
  try {
    const branches = await db.select().from(branchesTable);
    for (const b of branches) {
      await db.update(branchesTable)
        .set({
          description: b.description || `Empowering people of ${b.city} with world-class eCommerce training.`,
          manager: b.manager || "Campus Director"
        })
        .where(eq(branchesTable.id, b.id));
      console.log(`Updated branch ${b.id}: ${b.name}`);
    }
    console.log("Done!");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

seed();
