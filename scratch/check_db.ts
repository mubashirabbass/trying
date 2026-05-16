
import { db } from "../db/src/index";
import { usersTable } from "../db/src/schema/users";
import { branchesTable } from "../db/src/schema/branches";
import { sql } from "drizzle-orm";

async function check() {
  console.log("Checking database connection...");
  try {
    const result = await db.execute(sql`SELECT current_database(), current_user`);
    console.log("Connection successful:", result.rows);

    console.log("Checking users table...");
    const users = await db.select().from(usersTable).limit(1);
    console.log("Users found:", users.length);
    if (users.length > 0) {
      console.log("User 0:", { id: users[0].id, role: users[0].role });
    }

    console.log("Checking branches table...");
    const branches = await db.select().from(branchesTable);
    console.log(`Branches found: ${branches.length}`);
    branches.forEach((b, i) => console.log(`Branch ${i}:`, b));
  } catch (err: any) {
    console.error("DATABASE ERROR DETAILS:");
    console.error("Message:", err.message);
    console.error("Detail:", err.detail);
    console.error("Code:", err.code);
    console.error("Stack:", err.stack);
  } finally {
    process.exit();
  }
}

check();
