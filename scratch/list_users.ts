import { db, usersTable } from "@workspace/db";
import { count } from "drizzle-orm";

async function main() {
  const users = await db.select().from(usersTable);
  console.log("Users in DB:");
  users.forEach(u => {
    console.log(`- ${u.name} (${u.email}): role=${u.role}, active=${u.isActive}`);
  });
}

main().catch(console.error);
