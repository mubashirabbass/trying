import { Router, type IRouter } from "express";
import { db, paymentsTable, coursesTable, usersTable, enrollmentsTable, installmentLedgerTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListPaymentsQueryParams,
  CreatePaymentBody,
  VerifyPaymentParams,
  VerifyPaymentBody,
} from "@workspace/api-zod";
import { AuthRequest } from "../middleware/auth";
import { assignRollAndRegNo } from "../lib/studentNumbers";

const router: IRouter = Router();

// ─── Helper: parse duration months ───────────────────────────────────────────
function parseDurationMonths(duration?: string | null): number {
  if (!duration) return 1;
  const m = duration.match(/(\d+)\s*month/i);
  if (m) return parseInt(m[1], 10);
  const y = duration.match(/(\d+)\s*year/i);
  if (y) return parseInt(y[1], 10) * 12;
  return 1;
}

// ─── Helper: generate receipt number ─────────────────────────────────────────
function makeReceiptNumber(userId: number, courseId: number, monthNumber: number): string {
  const year = new Date().getFullYear();
  const uid = String(userId).padStart(4, "0");
  const cid = String(courseId).padStart(3, "0");
  const mn  = String(monthNumber).padStart(2, "0");
  return `RCP-${year}-U${uid}-C${cid}-M${mn}`;
}

router.get("/payments", async (req, res): Promise<void> => {
  const params = ListPaymentsQueryParams.safeParse(req.query);
  const conditions = [];
  if (params.success) {
    if (params.data.userId) {
      conditions.push(eq(paymentsTable.userId, Number(params.data.userId)));
    }
    if (params.data.status) {
      conditions.push(eq(paymentsTable.status, params.data.status));
    }
  }

  const query = db
    .select({
      id: paymentsTable.id,
      userId: paymentsTable.userId,
      courseId: paymentsTable.courseId,
      amount: paymentsTable.amount,
      totalFee: paymentsTable.totalFee,
      remainingFee: paymentsTable.remainingFee,
      paymentPlan: paymentsTable.paymentPlan,
      installmentMonths: paymentsTable.installmentMonths,
      installmentNumber: paymentsTable.installmentNumber,
      method: paymentsTable.method,
      status: paymentsTable.status,
      receiptUrl: paymentsTable.receiptUrl,
      notes: paymentsTable.notes,
      rejectionReason: paymentsTable.rejectionReason,
      createdAt: paymentsTable.createdAt,
      userName: usersTable.name,
      userFatherName: usersTable.fatherName,
      courseName: coursesTable.title,
    })
    .from(paymentsTable)
    .leftJoin(usersTable, eq(paymentsTable.userId, usersTable.id))
    .leftJoin(coursesTable, eq(paymentsTable.courseId, coursesTable.id))
    .orderBy(paymentsTable.createdAt);

  const payments = await (conditions.length > 0 ? query.where(and(...conditions)) : query);

  // no-store: always fetch fresh data so enrollment status reflects immediately
  res.set("Cache-Control", "no-store");
  res.json(payments);
});


router.post("/payments", async (req: AuthRequest, res): Promise<void> => {
  const authenticatedUserId = req.user?.id;
  if (!authenticatedUserId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const {
    courseId, amount, method, receiptUrl,
    paymentPlan, installmentMonths, installmentNumber,
    totalFee, remainingFee, notes, userId: requestUserId,
  } = req.body;

  if (!courseId || !amount || !method) {
    res.status(400).json({ error: "courseId, amount and method are required" }); return;
  }

  // Use userId from request body if provided (admin recording for student), otherwise use authenticated user
  const userId = requestUserId ? Number(requestUserId) : authenticatedUserId;

  const [payment] = await db.insert(paymentsTable)
    .values({
      userId,
      courseId: Number(courseId),
      amount: Number(amount),
      totalFee: totalFee ? Number(totalFee) : null,
      remainingFee: remainingFee ? Number(remainingFee) : null,
      paymentPlan: paymentPlan || "full",
      installmentMonths: installmentMonths ? Number(installmentMonths) : null,
      installmentNumber: installmentNumber ? Number(installmentNumber) : 1,
      method,
      receiptUrl: receiptUrl || null,
      notes: notes || null,
    })
    .returning();

  // Insert/update enrollment to pending state for admin review
  const [existing] = await db.select().from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, Number(courseId))));
  if (!existing) {
    await db.insert(enrollmentsTable).values({
      userId,
      courseId: Number(courseId),
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

  // If verified, auto-enroll the user AND activate their account
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

    // Activate the student's user account so they can log in, and assign roll/reg numbers
    await db.update(usersTable)
      .set({ isActive: true })
      .where(eq(usersTable.id, payment.userId));
    await assignRollAndRegNo(payment.userId);

    // ── Auto-generate installment ledger rows for monthly plans ──────────────
    if (payment.paymentPlan === "monthly" && payment.totalFee) {
      const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, payment.courseId));
      const durationMonths = parseDurationMonths(course?.duration);
      const monthlyAmount = Math.ceil(payment.totalFee / durationMonths);

      for (let m = 1; m <= durationMonths; m++) {
        const exists = await db.select({ id: installmentLedgerTable.id })
          .from(installmentLedgerTable)
          .where(and(
            eq(installmentLedgerTable.userId, payment.userId),
            eq(installmentLedgerTable.courseId, payment.courseId),
            eq(installmentLedgerTable.monthNumber, m),
          ));
        if (exists.length === 0) {
          await db.insert(installmentLedgerTable).values({
            userId: payment.userId,
            courseId: payment.courseId,
            monthNumber: m,
            installmentAmount: monthlyAmount,
            totalFee: payment.totalFee,
            totalPaid: 0,
            remainingBalance: monthlyAmount,
            status: "unpaid",
            paymentHistory: [] as any,
            receiptNumber: makeReceiptNumber(payment.userId, payment.courseId, m),
          });
        }
      }
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

// ─── Admin Collect: create + verify in one shot ───────────────────────────────
router.post("/payments/admin-collect", async (req: AuthRequest, res): Promise<void> => {
  const authenticatedUserId = req.user?.id;
  if (!authenticatedUserId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const {
    userId: requestUserId, courseId, amount, method,
    paymentPlan, installmentMonths, installmentNumber,
    totalFee, notes,
  } = req.body;

  // Enhanced validation with specific error messages
  if (!courseId) {
    res.status(400).json({ error: "courseId is required" }); return;
  }
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({ error: "Valid amount greater than 0 is required" }); return;
  }
  if (!method || typeof method !== 'string') {
    res.status(400).json({ error: "Payment method is required" }); return;
  }
  if (requestUserId && (isNaN(Number(requestUserId)) || Number(requestUserId) <= 0)) {
    res.status(400).json({ error: "Invalid userId provided" }); return;
  }
  if (isNaN(Number(courseId)) || Number(courseId) <= 0) {
    res.status(400).json({ error: "Invalid courseId provided" }); return;
  }

  try {
    const userId = requestUserId ? Number(requestUserId) : authenticatedUserId;

    // Verify user and course exist (fast lookups)
    const [userExists, courseExists] = await Promise.all([
      db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId)),
      db.select({ id: coursesTable.id }).from(coursesTable).where(eq(coursesTable.id, Number(courseId)))
    ]);

    if (!userExists.length) {
      res.status(404).json({ error: `User with ID ${userId} not found` }); return;
    }
    if (!courseExists.length) {
      res.status(404).json({ error: `Course with ID ${courseId} not found` }); return;
    }

    // 1. Insert payment - FAST CORE OPERATION
    const [payment] = await db.insert(paymentsTable)
      .values({
        userId,
        courseId: Number(courseId),
        amount: Number(amount),
        totalFee: totalFee ? Number(totalFee) : null,
        remainingFee: null,
        paymentPlan: paymentPlan || "monthly",
        installmentMonths: installmentMonths ? Number(installmentMonths) : null,
        installmentNumber: installmentNumber ? Number(installmentNumber) : 1,
        method,
        receiptUrl: null,
        notes: notes || null,
        status: "verified",
      })
      .returning();

    // 2. Handle enrollment - FAST OPERATION
    const [existing] = await db.select().from(enrollmentsTable)
      .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, Number(courseId))));

    if (!existing) {
      await db.insert(enrollmentsTable).values({ userId, courseId: Number(courseId), status: "active" });
    } else {
      await db.update(enrollmentsTable).set({ status: "active" }).where(eq(enrollmentsTable.id, existing.id));
    }

    // 3. Activate user - FAST OPERATION  
    await db.update(usersTable).set({ isActive: true }).where(eq(usersTable.id, userId));

    // Return immediately - don't wait for slow operations
    res.status(201).json({ ...payment, userName: null, courseName: null });

    // 4. ASYNC OPERATIONS - Run in background after response sent
    setImmediate(async () => {
      try {
        // Roll/reg number assignment (can be slow)
        await assignRollAndRegNo(userId);
      } catch (rollErr: any) {
        console.error("Background roll/reg assignment failed:", rollErr?.message);
      }

      // Ledger generation (can be slow with multiple inserts)
      if (payment.paymentPlan === "monthly" && payment.totalFee) {
        try {
          const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, payment.courseId));
          if (course) {
            const durationMonths = parseDurationMonths(course.duration);
            const monthlyAmount = Math.ceil(payment.totalFee / durationMonths);

            for (let m = 1; m <= durationMonths; m++) {
              const exists = await db.select({ id: installmentLedgerTable.id })
                .from(installmentLedgerTable)
                .where(and(
                  eq(installmentLedgerTable.userId, userId),
                  eq(installmentLedgerTable.courseId, payment.courseId),
                  eq(installmentLedgerTable.monthNumber, m),
                ));
              
              if (exists.length === 0) {
                await db.insert(installmentLedgerTable).values({
                  userId,
                  courseId: payment.courseId,
                  monthNumber: m,
                  installmentAmount: monthlyAmount,
                  totalFee: payment.totalFee,
                  totalPaid: 0,
                  remainingBalance: monthlyAmount,
                  status: "unpaid",
                  paymentHistory: [] as any,
                  receiptNumber: makeReceiptNumber(userId, payment.courseId, m),
                });
              }
            }
          }
        } catch (ledgerErr: any) {
          console.error("Background ledger generation failed:", ledgerErr?.message);
        }
      }

      // Notification (can be slow)
      try {
        const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, payment.courseId));
        if (course) {
          const { notificationTriggers } = await import("../lib/notifications");
          await notificationTriggers.paymentVerified(userId, course.title);
        }
      } catch (notifErr: any) {
        console.error("Background notification failed:", notifErr?.message);
      }
    });

  } catch (err: any) {
    console.error("admin-collect error:", err?.message || err);
    
    // Provide specific error messages
    let errorMessage = "Failed to record payment";
    if (err.message) {
      errorMessage = err.message;
    } else if (err.code) {
      switch (err.code) {
        case '23505': errorMessage = "Payment record already exists for this month"; break;
        case '23503': errorMessage = "Invalid student or course reference"; break;
        case '23502': errorMessage = "Missing required payment information"; break;
        default: errorMessage = `Database error: ${err.code}`;
      }
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

export default router;

