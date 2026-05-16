import { Request, Response, NextFunction } from "express";
import { verifyToken, AppError } from "../lib/auth";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      throw new AppError("You are not logged in. Please log in to get access.", 401);
    }

    const token = auth.slice(7);
    const decoded = verifyToken(token);

    let user;
    try {
      const results = await db.select().from(usersTable).where(eq(usersTable.id, decoded.sub));
      user = results[0];
    } catch (dbErr: any) {
      console.error("CRITICAL AUTH DB ERROR:", dbErr);
      throw new AppError("Internal server error during authentication", 500);
    }

    if (!user) {
      throw new AppError("The user belonging to this token no longer exists.", 401);
    }

    if (!user.isActive) {
      throw new AppError("Your account has been deactivated.", 403);
    }

    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    next(err);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }
    next();
  };
};
