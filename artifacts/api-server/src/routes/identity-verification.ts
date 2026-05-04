import { Router, type IRouter } from "express";
import { db, identityVerificationsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/identity-verification", async (req, res): Promise<void> => {
  const userId = Number(req.query.userId);
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }
  const [row] = await db.select().from(identityVerificationsTable)
    .where(eq(identityVerificationsTable.userId, userId))
    .orderBy(desc(identityVerificationsTable.submittedAt))
    .limit(1);
  res.json(row ?? null);
});

router.post("/identity-verification", async (req, res): Promise<void> => {
  const { userId, documentType, cnicNumber, documentUrl } = req.body;
  if (!userId || !documentUrl) { res.status(400).json({ error: "Missing fields" }); return; }
  const [row] = await db.insert(identityVerificationsTable)
    .values({ userId: Number(userId), documentType: documentType || "CNIC", cnicNumber, documentUrl })
    .returning();
  res.status(201).json(row);
});

router.get("/admin/identity-verifications", async (req, res): Promise<void> => {
  const verifications = await db.select({
    id: identityVerificationsTable.id,
    userId: identityVerificationsTable.userId,
    documentType: identityVerificationsTable.documentType,
    cnicNumber: identityVerificationsTable.cnicNumber,
    documentUrl: identityVerificationsTable.documentUrl,
    status: identityVerificationsTable.status,
    rejectionReason: identityVerificationsTable.rejectionReason,
    submittedAt: identityVerificationsTable.submittedAt,
    reviewedAt: identityVerificationsTable.reviewedAt,
    userName: usersTable.name,
    userEmail: usersTable.email,
  }).from(identityVerificationsTable)
    .leftJoin(usersTable, eq(identityVerificationsTable.userId, usersTable.id))
    .orderBy(desc(identityVerificationsTable.submittedAt));
  res.json(verifications);
});

router.patch("/admin/identity-verifications/:id/approve", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [row] = await db.update(identityVerificationsTable)
    .set({ status: "approved", reviewedAt: new Date() })
    .where(eq(identityVerificationsTable.id, id))
    .returning();
  res.json(row);
});

router.patch("/admin/identity-verifications/:id/reject", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { rejectionReason } = req.body;
  const [row] = await db.update(identityVerificationsTable)
    .set({ status: "rejected", rejectionReason, reviewedAt: new Date() })
    .where(eq(identityVerificationsTable.id, id))
    .returning();
  res.json(row);
});

export default router;
