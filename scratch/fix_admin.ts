import { db, usersTable } from "../db/src/index";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function fixAdminPassword() {
  try {
    const email = "admin@gmail.com";
    const newPassword = "12345678";
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const result = await db.update(usersTable)
      .set({ passwordHash: hashedPassword })
      .where(eq(usersTable.email, email))
      .returning();
    
    if (result.length > 0) {
      console.log(`Successfully updated password for ${email}`);
    } else {
      console.log(`User ${email} not found`);
    }
  } catch (err) {
    console.error("Error updating password:", err);
  } finally {
    process.exit(0);
  }
}

fixAdminPassword();
