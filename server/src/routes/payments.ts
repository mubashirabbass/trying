import { Router, type IRouter } from "express";
import { db, paymentsTable, coursesTable, usersTable, enrollmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListPaymentsQueryParams,
  CreatePaymentBody,
  VerifyPaymentParams,
  VerifyPaymentBody,
} from "@workspace/api-zod";
import { AuthRequest } from "../middleware/auth";

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

router.post("/payments", async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [payment] = await db.insert(paymentsTable)
    .values({ userId, courseId: parsed.data.courseId, amount: parsed.data.amount, method: parsed.data.method, receiptUrl: parsed.data.receiptUrl })
    .returning();

  // Automatically insert/update enrollment to pending state for admin review
  const [existing] = await db.select().from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, parsed.data.courseId)));
  if (!existing) {
    await db.insert(enrollmentsTable).values({
      userId,
      courseId: parsed.data.courseId,
      status: "pending"
    });
  } else if (existing.status !== "active") {
    await db.update(enrollmentsTable)
      .set({ status: "pending" })
      .where(eq(enrollmentsTable.id, existing.id));
  }

  res.status(201).json({ ...payment, userName: null, courseName: null });
});

router.post("/payments/:id/verify", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = VerifyPaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { status, notes } = parsed.data;

  const [payment] = await db.update(paymentsTable)
    .set({ status, notes })
    .where(eq(paymentsTable.id, id))
    .returning();

  if (!payment) { res.status(404).json({ error: "Not found" }); return; }

  // If verified, auto-enroll the user
  if (status === "verified") {
    const [existing] = await db.select().from(enrollmentsTable)
      .where(and(eq(enrollmentsTable.userId, payment.userId), eq(enrollmentsTable.courseId, payment.courseId)));
    
    if (!existing) {
      await db.insert(enrollmentsTable).values({
        userId: payment.userId,
        courseId: payment.courseId,
        status: "active"
      });
    } else if (existing.status !== "active") {
      await db.update(enrollmentsTable)
        .set({ status: "active" })
        .where(eq(enrollmentsTable.id, existing.id));
    }

    // Trigger notification
    try {
      const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, payment.courseId));
      if (course) {
        const { notificationTriggers } = await import("../lib/notifications");
        notificationTriggers.paymentVerified(payment.userId, course.title)
          .catch(err => console.error("Failed to trigger payment notification:", err));
      }
    } catch (err) {
      console.error("Error fetching course for notification:", err);
    }
  }

  res.json({ ...payment, userName: null, courseName: null });
});

export default router;
