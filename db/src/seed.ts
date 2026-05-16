import { db, usersTable } from "./index";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  // 1. Admin
  await db.insert(usersTable).values({
    name: "Admin User",
    email: "admin@globalcollege.com",
    passwordHash,
    role: "admin",
    isActive: true,
  }).onConflictDoNothing();

  // 2. Teacher
  await db.insert(usersTable).values({
    name: "John Teacher",
    email: "teacher@globalcollege.com",
    passwordHash,
    role: "teacher",
    isActive: true,
  }).onConflictDoNothing();

  // 3. Student
  await db.insert(usersTable).values({
    name: "Jane Student",
    email: "student@globalcollege.com",
    passwordHash,
    role: "student",
    isActive: true,
  }).onConflictDoNothing();

  console.log("✅ Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
