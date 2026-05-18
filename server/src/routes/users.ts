import * as zod from "zod";
import { Request, Response, Router, type IRouter } from "express";
import { db, usersTable, branchesTable } from "@workspace/db";
import { eq, and, ilike, or, desc } from "drizzle-orm";
import {
  ListUsersQueryParams,
  CreateUserBody,
  UpdateUserBody,
  ResetPasswordBody,
} from "@workspace/api-zod";
import { hashPassword, AppError } from "../lib/auth";
import { catchAsync } from "../middleware/error";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validate";


const router: IRouter = Router();

/**
 * @route GET /api/v1/users
 * @desc List users with filters (Admin only)
 */
router.get(
  "/users",
  authenticate,
  authorize("admin"),
  validate(zod.object({ query: ListUsersQueryParams })),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { role, branchId, search } = req.query as any;

    let conditions = [];
    if (role) conditions.push(eq(usersTable.role, role));
    if (branchId) conditions.push(eq(usersTable.branchId, Number(branchId)));
    if (search) {
      conditions.push(
        or(
          ilike(usersTable.name, `%${search}%`),
          ilike(usersTable.email, `%${search}%`),
          ilike(usersTable.phone, `%${search}%`)
        )
      );
    }

    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        phone: usersTable.phone,
        cnic: usersTable.cnic,
        avatar: usersTable.avatar,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
        branchId: usersTable.branchId,
        branchName: branchesTable.name,
      })
      .from(usersTable)
      .leftJoin(branchesTable, eq(usersTable.branchId, branchesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(usersTable.createdAt));

    return res.json(users);
  })
);

/**
 * @route POST /api/v1/users
 * @desc Create user (Admin only)
 */
router.post(
  "/users",
  authenticate,
  authorize("admin"),
  validate(zod.object({ body: CreateUserBody })),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { name, email, password, role, phone, cnic, branchId } = req.body;

    // Check if email already exists
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (existing) {
      throw new AppError("Email already registered", 400);
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(usersTable)
      .values({
        name,
        email,
        passwordHash,
        role,
        phone: phone || null,
        cnic: cnic || null,
        branchId: branchId ? Number(branchId) : null,
        isActive: true,
        isEmailVerified: true,
      })
      .returning();

    const { passwordHash: _, ...safeUser } = user;
    return res.status(201).json(safeUser);
  })
);

/**
 * @route GET /api/v1/users/:id
 * @desc Get user details
 */
router.get(
  "/users/:id",
  authenticate,
  catchAsync(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) throw new AppError("Invalid user ID", 400);

    // Only admin or the user themselves can view details
    if (req.user.role !== "admin" && req.user.id !== id) {
      throw new AppError("Not authorized to view this profile", 403);
    }

    const [user] = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        phone: usersTable.phone,
        cnic: usersTable.cnic,
        avatar: usersTable.avatar,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
        branchId: usersTable.branchId,
        branchName: branchesTable.name,
      })
      .from(usersTable)
      .leftJoin(branchesTable, eq(usersTable.branchId, branchesTable.id))
      .where(eq(usersTable.id, id));

    if (!user) throw new AppError("User not found", 404);

    return res.json(user);
  })
);

/**
 * @route PUT /api/v1/users/:id
 * @desc Update user
 */
router.put(
  "/users/:id",
  authenticate,
  validate(zod.object({ body: UpdateUserBody })),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) throw new AppError("Invalid user ID", 400);

    // Only admin or the user themselves can update
    if (req.user.role !== "admin" && req.user.id !== id) {
      throw new AppError("Not authorized to update this profile", 403);
    }

    const [updatedUser] = await db
      .update(usersTable)
      .set(req.body)
      .where(eq(usersTable.id, id))
      .returning();

    if (!updatedUser) throw new AppError("User not found", 404);

    const { passwordHash: _, ...safeUser } = updatedUser;
    return res.json(safeUser);
  })
);

/**
 * @route POST /api/v1/users/:id/reset-password
 * @desc Reset password (Admin only)
 */
router.post(
  "/users/:id/reset-password",
  authenticate,
  authorize("admin"),
  validate(zod.object({ body: ResetPasswordBody })),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) throw new AppError("Invalid user ID", 400);

    const passwordHash = await hashPassword(req.body.password);
    const [updated] = await db
      .update(usersTable)
      .set({ passwordHash })
      .where(eq(usersTable.id, id))
      .returning();

    if (!updated) throw new AppError("User not found", 404);

    return res.sendStatus(204);
  })
);

/**
 * @route DELETE /api/v1/users/:id
 * @desc Delete user (Admin only)
 */
router.delete(
  "/users/:id",
  authenticate,
  authorize("admin"),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) throw new AppError("Invalid user ID", 400);

    const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
    if (!deleted) throw new AppError("User not found", 404);

    return res.sendStatus(204);
  })
);

export default router;
