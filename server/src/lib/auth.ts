import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-change-me";
const JWT_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRY || "7d";

export class AppError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
    this.name = "AppError";
  }
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  return await bcrypt.compare(password, stored);
}

export function createToken(userId: number, role: string, rememberMe: boolean = false): string {
  const expiresIn = rememberMe ? "30d" : (process.env.JWT_ACCESS_EXPIRY || "7d");
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyToken(token: string): { sub: number; role: string } {
  try {
    return jwt.verify(token, JWT_SECRET) as unknown as { sub: number; role: string };
  } catch (err) {
    throw new AppError("Invalid or expired token", 401);
  }
}
