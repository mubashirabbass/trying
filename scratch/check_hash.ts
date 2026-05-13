import { db, usersTable } from "../db/src/index";
import { eq } from "drizzle-orm";

async function checkAdminHash() {
  try {
    const [admin] = await db.select().from(usersTable).where(eq(usersTable.email, "admin@gmail.com"));
    if (admin) {
      console.log(`Admin hash: ${admin.passwordHash}`);
    } else {
      console.log("Admin not found");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

checkAdminHash();
