import { db, usersTable } from "../db/src/index";

async function checkAllHashes() {
  try {
    const users = await db.select().from(usersTable);
    users.forEach(u => {
      console.log(`${u.email}: ${u.passwordHash}`);
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

checkAllHashes();
