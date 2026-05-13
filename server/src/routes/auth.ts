import crypto from "crypto";
import { Request, Response, Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody, RegisterBody, GetMeResponse } from "@workspace/api-zod";
import { hashPassword, verifyPassword, createToken, verifyToken, AppError } from "../lib/auth";
import { logger } from "../lib/logger";

import { catchAsync } from "../middleware/error";
import { authRateLimiter } from "../middleware/rate-limit";

const router: IRouter = Router();

router.post("/auth/login", authRateLimiter, catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email, password, rememberMe } = req.body;
  
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  let isPasswordValid = await verifyPassword(password, user.passwordHash);
  
  // Migration logic: Check if it's an old SHA-256 hash
  if (!isPasswordValid && user.passwordHash.includes(":")) {
    try {
      const [salt, hash] = user.passwordHash.split(":");
      const testHash = crypto.createHash("sha256").update(password + salt).digest("hex");
      
      if (testHash === hash) {
        const newHash = await hashPassword(password);
        await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, user.id));
        isPasswordValid = true;
        logger.info(`Migrated user password to bcrypt for userId=${user.id}`);
      }
    } catch (err) {
      logger.error(`Migration error: ${err}`);
    }
  }
  
  if (!isPasswordValid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  
  if (!user.isActive) {
    res.status(403).json({ error: "Account is disabled" });
    return;
  }
  const token = createToken(user.id, user.role, !!rememberMe);
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser, token });
}));

router.post("/auth/register", authRateLimiter, catchAsync(async (req: Request, res: Response): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password, name, role, phone, cnic, branchId } = parsed.data;
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({ email, passwordHash, name, role, phone, cnic, branchId }).returning();
  const token = createToken(user.id, user.role);
  const { passwordHash: _, ...safeUser } = user;
  res.status(201).json({ user: safeUser, token });
}));

router.post("/auth/logout", catchAsync(async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true });
}));

router.get("/auth/me", catchAsync(async (req: Request, res: Response): Promise<void> => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  
  const decoded = verifyToken(auth.slice(7));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.sub));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const { passwordHash: _, ...safeUser } = user;
  res.json(GetMeResponse.parse(safeUser));
}));

export default router;
