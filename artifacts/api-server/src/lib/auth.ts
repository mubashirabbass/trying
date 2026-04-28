import { createHash, randomBytes } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(password + salt).digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const testHash = createHash("sha256").update(password + salt).digest("hex");
  return testHash === hash;
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

const sessions = new Map<string, { userId: number; role: string; expires: Date }>();

export function createSession(userId: number, role: string): string {
  const token = generateToken();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  sessions.set(token, { userId, role, expires });
  return token;
}

export function getSession(token: string): { userId: number; role: string } | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expires < new Date()) {
    sessions.delete(token);
    return null;
  }
  return { userId: session.userId, role: session.role };
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}
