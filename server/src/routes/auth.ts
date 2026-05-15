import crypto from "crypto";
import { Request, Response, Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody, RegisterBody, GetMeResponse } from "@workspace/api-zod";
import { hashPassword, verifyPassword, createToken, verifyToken, AppError } from "../lib/auth";
import { logger } from "../lib/logger";
import { sendEmail, emailTemplates } from "../lib/email";

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
    logger.error(`Registration validation failed for ${req.body.email}: ${JSON.stringify(parsed.error.format())}`);
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

  // Send verification email (async, don't block response)
  const origin = req.headers.origin || "http://localhost:5173";
  const verifyUrl = `${origin}/verify-email?token=${token}`; // Using the session token as a simple verification token for now
  sendEmail({
    to: user.email,
    ...emailTemplates.verification(user.name, verifyUrl)
  }).catch(err => logger.error(`Failed to send welcome email to ${user.email}:`, err));

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

router.post("/auth/forgot-password", authRateLimiter, catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: "Email is required" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  // Always return 200 to prevent email enumeration
  res.json({ message: "If that email is registered, a reset link has been sent." });

  if (!user) return; // Stop silently

  // Generate reset token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.update(usersTable)
    .set({ passwordResetToken: tokenHash, passwordResetExpiry: expiry } as any)
    .where(eq(usersTable.id, user.id));

  const resetUrl = `${req.headers.origin || "http://localhost:5173"}/reset-password/${rawToken}`;
  
  await sendEmail({
    to: user.email,
    ...emailTemplates.passwordReset(user.name, resetUrl)
  });
  
  logger.info(`[Password Reset] User ${user.email} | Reset URL: ${resetUrl}`);
}));

router.post("/auth/reset-password/:token", catchAsync(async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token || !newPassword) { res.status(400).json({ error: "Token and new password are required" }); return; }
  if (newPassword.length < 8) { res.status(400).json({ error: "Password must be at least 8 characters" }); return; }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const [user] = await db.select().from(usersTable).where(eq((usersTable as any).passwordResetToken, tokenHash));

  if (!user) { res.status(400).json({ error: "Invalid or expired reset token" }); return; }

  const expiry: Date | null = (user as any).passwordResetExpiry;
  if (!expiry || expiry < new Date()) { res.status(400).json({ error: "Reset token has expired. Please request a new one." }); return; }

  const passwordHash = await hashPassword(newPassword);
  await db.update(usersTable)
    .set({ passwordHash, passwordResetToken: null, passwordResetExpiry: null } as any)
    .where(eq(usersTable.id, user.id));

  logger.info(`[Password Reset] Password updated for user ${user.email}`);
  res.json({ message: "Password reset successful" });
}));

router.post("/auth/change-password", catchAsync(async (req: Request, res: Response): Promise<void> => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }

  const decoded = verifyToken(auth.slice(7));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.sub));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) { res.status(400).json({ error: "Both current and new password are required" }); return; }
  if (newPassword.length < 8) { res.status(400).json({ error: "New password must be at least 8 characters" }); return; }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) { res.status(401).json({ error: "Current password is incorrect" }); return; }

  const passwordHash = await hashPassword(newPassword);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));

  logger.info(`[Change Password] Password updated for user ${user.email}`);
  res.json({ message: "Password changed successfully" });
}));

export default router;
