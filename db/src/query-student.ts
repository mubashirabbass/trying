import { db } from "./index";
import { usersTable } from "./schema/users";
import { identityVerificationsTable } from "./schema/identity-verification";
import { eq } from "drizzle-orm";

async function main() {
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, 53));
  console.log("USER fields:", JSON.stringify({
    educationDocumentUrl: u?.educationDocumentUrl,
    obtainedMarks: u?.obtainedMarks,
    totalMarks: u?.totalMarks,
    qualification: u?.qualification,
    specialization: u?.specialization,
    cnic: u?.cnic,
    isIdentityVerified: u?.isIdentityVerified,
  }, null, 2));

  const iv = await db.select().from(identityVerificationsTable).where(eq(identityVerificationsTable.userId, 53));
  console.log("IDENTITY_VERIFICATIONS:", JSON.stringify(iv, null, 2));

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
