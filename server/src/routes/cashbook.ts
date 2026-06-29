import * as zod from "zod";
import { Request, Response, Router, type IRouter } from "express";
import { db, cashbookEntriesTable } from "@workspace/db";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { AppError } from "../lib/auth";
import { logger } from "../lib/logger";
import { catchAsync } from "../middleware/error";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

// Validation schemas
const CreateCashbookEntrySchema = zod.object({
  entryDate: zod.string().transform((str) => new Date(str)),
  pageNo: zod.string().default(""),
  description: zod.string().min(1, "Description is required"),
  category: zod.string().default(""),
  entryType: zod.enum(["income", "expense"]),
  rupees: zod.number().int().min(0).default(0),
  paisa: zod.number().int().min(0).max(99).default(0),
  month: zod.string().min(1, "Month is required"),
  year: zod.string().min(1, "Year is required"),
});

const UpdateCashbookEntrySchema = CreateCashbookEntrySchema.partial();

/**
 * @route GET /api/cashbook/entries
 * @desc Get cashbook entries with optional filtering by month/year
 * @access Private (Admin)
 */
router.get(
  "/cashbook/entries",
  authenticate,
  authorize("admin"),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { month, year, type } = req.query as any;
    
    let conditions = [];
    
    // Filter by month
    if (month) {
      conditions.push(eq(cashbookEntriesTable.month, month));
    }
    
    // Filter by year
    if (year) {
      conditions.push(eq(cashbookEntriesTable.year, year));
    }
    
    // Filter by entry type (income/expense)
    if (type && (type === "income" || type === "expense")) {
      conditions.push(eq(cashbookEntriesTable.entryType, type));
    }

    const entries = await db
      .select()
      .from(cashbookEntriesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(cashbookEntriesTable.entryDate), asc(cashbookEntriesTable.id));

    return res.json(entries);
  })
);

/**
 * @route GET /api/cashbook/summary
 * @desc Get cashbook summary (totals) for a specific month/year
 * @access Private (Admin)
 */
router.get(
  "/cashbook/summary",
  authenticate,
  authorize("admin"),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { month, year } = req.query as any;
    
    let conditions = [];
    if (month) conditions.push(eq(cashbookEntriesTable.month, month));
    if (year) conditions.push(eq(cashbookEntriesTable.year, year));

    // Get income totals
    const incomeResult = await db
      .select({
        totalRupees: sql<number>`sum(${cashbookEntriesTable.rupees})`,
        totalPaisa: sql<number>`sum(${cashbookEntriesTable.paisa})`,
        count: sql<number>`count(*)`,
      })
      .from(cashbookEntriesTable)
      .where(and(
        eq(cashbookEntriesTable.entryType, "income"),
        ...(conditions.length > 0 ? conditions : [])
      ));

    // Get expense totals
    const expenseResult = await db
      .select({
        totalRupees: sql<number>`sum(${cashbookEntriesTable.rupees})`,
        totalPaisa: sql<number>`sum(${cashbookEntriesTable.paisa})`,
        count: sql<number>`count(*)`,
      })
      .from(cashbookEntriesTable)
      .where(and(
        eq(cashbookEntriesTable.entryType, "expense"),
        ...(conditions.length > 0 ? conditions : [])
      ));

    const income = incomeResult[0] || { totalRupees: 0, totalPaisa: 0, count: 0 };
    const expense = expenseResult[0] || { totalRupees: 0, totalPaisa: 0, count: 0 };

    // Calculate balance
    const balanceRupees = (income.totalRupees || 0) - (expense.totalRupees || 0);
    const balancePaisa = (income.totalPaisa || 0) - (expense.totalPaisa || 0);

    return res.json({
      income: {
        rupees: income.totalRupees || 0,
        paisa: income.totalPaisa || 0,
        count: income.count || 0,
      },
      expense: {
        rupees: expense.totalRupees || 0,
        paisa: expense.totalPaisa || 0,
        count: expense.count || 0,
      },
      balance: {
        rupees: balanceRupees,
        paisa: balancePaisa,
      },
    });
  })
);

/**
 * @route POST /api/cashbook/entries
 * @desc Create a new cashbook entry
 * @access Private (Admin)
 */
router.post(
  "/cashbook/entries",
  authenticate,
  authorize("admin"),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const validation = CreateCashbookEntrySchema.safeParse(req.body);
    
    if (!validation.success) {
      throw new AppError("Validation failed: " + validation.error.issues.map(i => i.message).join(", "), 400);
    }

    const data = validation.data;
    
    const [entry] = await db
      .insert(cashbookEntriesTable)
      .values(data)
      .returning();

    logger.info(`Cashbook entry created: ${entry.id} - ${entry.entryType} - Rs.${entry.rupees}.${entry.paisa} - ${entry.description}`);
    
    return res.status(201).json(entry);
  })
);

/**
 * @route PUT /api/cashbook/entries/:id
 * @desc Update a cashbook entry
 * @access Private (Admin)
 */
router.put(
  "/cashbook/entries/:id",
  authenticate,
  authorize("admin"),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      throw new AppError("Invalid entry ID", 400);
    }

    const validation = UpdateCashbookEntrySchema.safeParse(req.body);
    
    if (!validation.success) {
      throw new AppError("Validation failed: " + validation.error.issues.map(i => i.message).join(", "), 400);
    }

    const data = validation.data;
    
    const [entry] = await db
      .update(cashbookEntriesTable)
      .set(data)
      .where(eq(cashbookEntriesTable.id, id))
      .returning();

    if (!entry) {
      throw new AppError("Cashbook entry not found", 404);
    }

    logger.info(`Cashbook entry updated: ${entry.id} - ${entry.entryType} - Rs.${entry.rupees}.${entry.paisa}`);
    
    return res.json(entry);
  })
);

/**
 * @route DELETE /api/cashbook/entries/:id
 * @desc Delete a cashbook entry
 * @access Private (Admin)
 */
router.delete(
  "/cashbook/entries/:id",
  authenticate,
  authorize("admin"),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      throw new AppError("Invalid entry ID", 400);
    }

    const [deletedEntry] = await db
      .delete(cashbookEntriesTable)
      .where(eq(cashbookEntriesTable.id, id))
      .returning();

    if (!deletedEntry) {
      throw new AppError("Cashbook entry not found", 404);
    }

    logger.info(`Cashbook entry deleted: ${deletedEntry.id} - ${deletedEntry.description}`);
    
    return res.status(204).send();
  })
);

export default router;