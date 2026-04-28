import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListUsersQueryParams,
  CreateUserBody,
  GetUserParams,
  UpdateUserParams,
  UpdateUserBody,
  DeleteUserParams,
} from "@workspace/api-zod";
import { hashPassword } from "../lib/auth";

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  const users = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    role: usersTable.role,
    phone: usersTable.phone,
    cnic: usersTable.cnic,
    avatar: usersTable.avatar,
    isActive: usersTable.isActive,
    createdAt: usersTable.createdAt,
  }).from(usersTable);

  let filtered = users;
  if (params.success && params.data.role) {
    filtered = users.filter(u => u.role === params.data.role);
  }
  res.json(filtered);
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const passwordHash = hashPassword(parsed.data.password);
  const [user] = await db.insert(usersTable).values({ ...parsed.data, passwordHash }).returning({
    id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role,
    phone: usersTable.phone, cnic: usersTable.cnic, avatar: usersTable.avatar,
    isActive: usersTable.isActive, createdAt: usersTable.createdAt,
  });
  res.status(201).json(user);
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [user] = await db.select({
    id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role,
    phone: usersTable.phone, cnic: usersTable.cnic, avatar: usersTable.avatar,
    isActive: usersTable.isActive, createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(user);
});

router.put("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [user] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, id)).returning({
    id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role,
    phone: usersTable.phone, cnic: usersTable.cnic, avatar: usersTable.avatar,
    isActive: usersTable.isActive, createdAt: usersTable.createdAt,
  });
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(user);
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.sendStatus(204);
});

export default router;
