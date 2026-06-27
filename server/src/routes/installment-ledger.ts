import { Router, type IRouter } from "express";
import { db, installmentLedgerTable, paymentsTable, coursesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { catchAsync } from "../middleware/error";
import { AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

// ─── Helper: parse duration months from course duration string ────────────────
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

// ─── GET /installment-ledger — list all ledger entries (filterable) ───────────
router.get("/installment-ledger", catchAsync(async (req, res) => {
  const { userId, courseId } = req.query as Record<string, string>;
  const conditions = [];
  if (userId) conditions.push(eq(installmentLedgerTable.userId, Number(userId)));
  if (courseId) conditions.push(eq(installmentLedgerTable.courseId, Number(courseId)));

  const query = db
    .select({
      id: installmentLedgerTable.id,
      userId: installmentLedgerTable.userId,
      courseId: installmentLedgerTable.courseId,
      monthNumber: installmentLedgerTable.monthNumber,
      installmentAmount: installmentLedgerTable.installmentAmount,
      totalFee: installmentLedgerTable.totalFee,
      totalPaid: installmentLedgerTable.totalPaid,
      remainingBalance: installmentLedgerTable.remainingBalance,
      status: installmentLedgerTable.status,
      paymentHistory: installmentLedgerTable.paymentHistory,
      receiptNumber: installmentLedgerTable.receiptNumber,
      updatedAt: installmentLedgerTable.updatedAt,
      userName: usersTable.name,
      courseName: coursesTable.title,
    })
    .from(installmentLedgerTable)
    .leftJoin(usersTable, eq(installmentLedgerTable.userId, usersTable.id))
    .leftJoin(coursesTable, eq(installmentLedgerTable.courseId, coursesTable.id));

  const rows = await (conditions.length > 0 ? query.where(and(...conditions)) : query);
  res.json(rows);
}));

// ─── POST /installment-ledger/generate — auto-generate monthly ledger rows ────
// Called internally after first verified payment for a monthly plan.
router.post("/installment-ledger/generate", catchAsync(async (req: AuthRequest, res) => {
  const { userId, courseId, totalFee, durationMonths } = req.body;

  if (!userId || !courseId || !totalFee || !durationMonths) {
    res.status(400).json({ error: "userId, courseId, totalFee, durationMonths required" });
    return;
  }

  const months = Number(durationMonths);
  const fee    = Number(totalFee);
  const monthlyAmount = Math.ceil(fee / months);

  const created: any[] = [];
  for (let m = 1; m <= months; m++) {
    // Use upsert — don't overwrite existing rows
    const existing = await db.select()
      .from(installmentLedgerTable)
      .where(and(
        eq(installmentLedgerTable.userId, Number(userId)),
        eq(installmentLedgerTable.courseId, Number(courseId)),
        eq(installmentLedgerTable.monthNumber, m),
      ));

    if (existing.length === 0) {
      const [row] = await db.insert(installmentLedgerTable).values({
        userId: Number(userId),
        courseId: Number(courseId),
        monthNumber: m,
        installmentAmount: monthlyAmount,
        totalFee: fee,
        totalPaid: 0,
        remainingBalance: monthlyAmount,
        status: "unpaid",
        paymentHistory: [] as any,
        receiptNumber: makeReceiptNumber(Number(userId), Number(courseId), m),
      }).returning();
      created.push(row);
    }
  }

  res.status(201).json({ generated: created.length, months });
}));

// ─── POST /installment-ledger/:id/collect — collect payment for a ledger entry ─
router.post("/installment-ledger/:id/collect", catchAsync(async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ledger id" }); return; }

  const { amount, method = "cash", notes = "" } = req.body;
  const amountNum = Number(amount);

  if (!amount || isNaN(amountNum) || amountNum <= 0) {
    res.status(400).json({ error: "A valid positive amount is required" });
    return;
  }

  // Fetch the ledger entry
  const [ledger] = await db.select().from(installmentLedgerTable).where(eq(installmentLedgerTable.id, id));
  if (!ledger) { res.status(404).json({ error: "Ledger entry not found" }); return; }

  if (ledger.status === "paid") {
    res.status(400).json({ error: "This installment is already fully paid" });
    return;
  }

  if (amountNum > ledger.remainingBalance + 0.01) {  // +0.01 for float rounding tolerance
    res.status(400).json({
      error: `Amount Rs. ${amountNum.toLocaleString()} exceeds remaining balance Rs. ${ledger.remainingBalance.toLocaleString()}`
    });
    return;
  }

  // Record individual payment transaction in paymentsTable
  const [payment] = await db.insert(paymentsTable).values({
    userId: ledger.userId,
    courseId: ledger.courseId,
    amount: amountNum,
    totalFee: ledger.totalFee,
    remainingFee: Math.max(0, ledger.remainingBalance - amountNum),
    paymentPlan: "monthly",
    installmentMonths: null,
    installmentNumber: ledger.monthNumber,
    method: method || "cash",
    status: "verified",   // Admin is recording directly → auto-verified
    notes: notes || `Month ${ledger.monthNumber} installment — collected by admin`,
  }).returning();

  // Update ledger aggregates
  const newTotalPaid      = ledger.totalPaid + amountNum;
  const newRemaining      = Math.max(0, ledger.installmentAmount - newTotalPaid);
  const newStatus         = newRemaining <= 0 ? "paid" : newTotalPaid > 0 ? "partial" : "unpaid";

  // Append to payment history
  const history: any[] = Array.isArray(ledger.paymentHistory) ? ledger.paymentHistory : [];
  history.push({
    paymentId: payment.id,
    amount: amountNum,
    paidAt: new Date().toISOString(),
    method: method || "cash",
    notes: notes || "",
  });

  const [updated] = await db.update(installmentLedgerTable)
    .set({
      totalPaid: newTotalPaid,
      remainingBalance: newRemaining,
      status: newStatus,
      paymentHistory: history as any,
    })
    .where(eq(installmentLedgerTable.id, id))
    .returning();

  res.json({ ledger: updated, payment });
}));

export default router;
