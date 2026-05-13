import { db, usersTable } from "../db/src/index";

async function checkUsers() {
  try {
    const users = await db.select().from(usersTable);
    console.log("Found users:", users.length);
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) [Role: ${u.role}]`);
    });
  } catch (err) {
    console.error("Error checking users:", err);
  } finally {
    process.exit(0);
  }
}

checkUsers();
