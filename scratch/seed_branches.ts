import { db, branchesTable } from "@workspace/db";

async function seedBranches() {
  console.log("Seeding branches...");
  
  const branches = [
    { name: "Main Campus", city: "Lahore", address: "Ferozepur Road", phone: "042-111-222-333" },
    { name: "Johar Town Campus", city: "Lahore", address: "Johar Town", phone: "042-444-555-666" },
    { name: "Islamabad Campus", city: "Islamabad", address: "Blue Area", phone: "051-111-222-333" },
    { name: "Karachi Campus", city: "Karachi", address: "DHA Phase 6", phone: "021-111-222-333" },
  ];

  for (const branchData of branches) {
    try {
      await db.insert(branchesTable).values(branchData).onConflictDoNothing();
      console.log(`Ensured branch exists: ${branchData.name}`);
    } catch (err) {
      console.error(`Error seeding branch ${branchData.name}:`, err);
    }
  }
  
  console.log("Seeding complete.");
}

seedBranches().catch(console.error);
