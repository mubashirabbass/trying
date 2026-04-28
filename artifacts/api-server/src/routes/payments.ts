import { Router, type IRouter } from "express";
import { db, paymentsTable, coursesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListPaymentsQueryParams,
  CreatePaymentBody,
  VerifyPaymentParams,
  VerifyPaymentBody,
} from "@workspace/api-zod";
import { getSession } from "../lib/auth";

const router: IRouter = Router();

router.get("/payments", async (req, res): Promise<void> => {
  const params = ListPaymentsQueryParams.safeParse(req.query);
  const payments = await db
    .select({
      id: paymentsTable.id,
      userId: paymentsTable.userId,
      courseId: paymentsTable.courseId,
      amount: paymentsTable.amount,
      method: paymentsTable.method,
      status: paymentsTable.status,
      receiptUrl: paymentsTable.receiptUrl,
      createdAt: paymentsTable.createdAt,
      userName: usersTable.name,
      courseName: coursesTable.title,
    })
    .from(paymentsTable)
    .leftJoin(usersTable, eq(paymentsTable.userId, usersTable.id))
    .leftJoin(coursesTable, eq(paymentsTable.courseId, coursesTable.id));

  let filtered = payments;
  if (params.success) {
    if (params.data.userId) filtered = filtered.filter(p => p.userId === Number(params.data.userId));
    if (params.data.status) filtered = filtered.filter(p => p.status === params.data.status);
  }
  res.json(filtered);
});

router.post("/payments", async (req, res): Promise<void> => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  const session = getSession(auth.slice(7));
  if (!session) { res.status(401).json({ error: "Invalid token" }); return; }

  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [payment] = await db.insert(paymentsTable)
    .values({ userId: session.userId, courseId: parsed.data.courseId, amount: parsed.data.amount, method: parsed.data.method, receiptUrl: parsed.data.receiptUrl })
    .returning();
  res.status(201).json({ ...payment, userName: null, courseName: null });
});

router.post("/payments/:id/verify", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = VerifyPaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [payment] = await db.update(paymentsTable)
    .set({ status: parsed.data.status, notes: parsed.data.notes })
    .where(eq(paymentsTable.id, id))
    .returning();
  if (!payment) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...payment, userName: null, courseName: null });
});

export default router;
