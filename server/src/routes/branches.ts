import { Router, type IRouter } from "express";
import { db, branchesTable, usersTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import { CreateBranchBody, UpdateBranchBody } from "@workspace/api-zod";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { catchAsync } from "../middleware/error";
import { sendSuccess, sendError } from "../utils/response";
import { AppError } from "../lib/auth";

const router: IRouter = Router();

/**
 * @route GET /api/v1/branches
 * @desc Get all branches with student counts
 * @access Public
 */
router.get("/branches", catchAsync(async (req, res) => {
  const branches = await db.select().from(branchesTable);
  
  // Enrich with student count
  const enrichedBranches = await Promise.all(branches.map(async (branch) => {
    const studentCount = await db
      .select({ c: count() })
      .from(usersTable)
      .where(sql`${usersTable.branchId} = ${branch.id} AND ${usersTable.isActive} = true`);
    
    const actualCount = Number(studentCount[0]?.c ?? 0);
    const manualCount = branch.manualStudentCount || 0;

    return {
      ...branch,
      studentCount: actualCount + manualCount,
      actualStudentCount: actualCount,
    };
  }));

  res.json(enrichedBranches);
}));

/**
 * @route POST /api/v1/branches
 * @desc Create a new branch
 * @access Private (Admin Only)
 */
router.post(
  "/branches",
  authenticate,
  authorize("admin"),
  validate(CreateBranchBody),
  catchAsync(async (req, res) => {
    const [branch] = await db.insert(branchesTable).values(req.body).returning();
    res.status(201).json(branch);
  })
);

/**
 * @route GET /api/v1/branches/:id
 * @desc Get branch details
 * @access Public
 */
router.get("/branches/:id", catchAsync(async (req: any, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) throw new AppError("Invalid branch ID", 400);

  const [branch] = await db.select().from(branchesTable).where(eq(branchesTable.id, id));
  if (!branch) throw new AppError("Branch not found", 404);

  const studentCount = await db
    .select({ c: count() })
    .from(usersTable)
    .where(sql`${usersTable.branchId} = ${branch.id} AND ${usersTable.isActive} = true`);
  
  const actualCount = Number(studentCount[0]?.c ?? 0);
  const manualCount = branch.manualStudentCount || 0;

  res.json({ 
    ...branch, 
    studentCount: actualCount + manualCount,
    actualStudentCount: actualCount,
  });
}));

/**
 * @route PUT /api/v1/branches/:id
 * @desc Update branch details
 * @access Private (Admin Only)
 */
router.put(
  "/branches/:id",
  authenticate,
  authorize("admin"),
  validate(UpdateBranchBody),
  catchAsync(async (req: any, res) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) throw new AppError("Invalid branch ID", 400);

    const [updatedBranch] = await db
      .update(branchesTable)
      .set(req.body)
      .where(eq(branchesTable.id, id))
      .returning();

    if (!updatedBranch) {
      throw new AppError("Branch not found", 404);
    }

    res.json(updatedBranch);
  })
);

/**
 * @route DELETE /api/v1/branches/:id
 * @desc Delete a branch
 * @access Private (Admin Only)
 */
router.delete(
  "/branches/:id",
  authenticate,
  authorize("admin"),
  catchAsync(async (req: any, res) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) throw new AppError("Invalid branch ID", 400);

    const [deletedBranch] = await db.delete(branchesTable).where(eq(branchesTable.id, id)).returning();
    if (!deletedBranch) { res.status(404).json({ error: "Branch not found" }); return; }

    res.sendStatus(204);
  })
);

export default router;
