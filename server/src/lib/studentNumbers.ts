import { db, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

/**
 * Assigns sequential Roll Numbers (GC-XX) and Registration Numbers (2026-GCCSC-XX)
 * to a student when their enrollment is activated.
 */
export async function assignRollAndRegNo(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return;

  // If student already has both roll and reg numbers, do not overwrite
  if (user.rollNo && user.regNo) return;

  // Fetch all existing users with non-null roll numbers to determine the next serial number
  const existing = await db
    .select({ rollNo: usersTable.rollNo })
    .from(usersTable)
    .where(sql`${usersTable.rollNo} IS NOT NULL`);

  let maxNum = 0;
  existing.forEach(u => {
    if (u.rollNo) {
      // Matches formats like "GC-01", "GC-10", "GC-100", etc.
      const match = u.rollNo.match(/^GC-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  });

  const nextNum = maxNum + 1;

  // Formatting rules:
  // GC-01, GC-02, ...
  const nextRollNo = `GC-${String(nextNum).padStart(2, "0")}`;
  // 2026-GCCSC-01, 2026-GCCSC-02, ...
  const nextRegNo = `2026-GCCSC-${String(nextNum).padStart(2, "0")}`;

  await db.update(usersTable)
    .set({
      rollNo: user.rollNo || nextRollNo,
      regNo: user.regNo || nextRegNo
    })
    .where(eq(usersTable.id, userId));
}
