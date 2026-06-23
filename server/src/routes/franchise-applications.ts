import { Router, type IRouter } from "express";
import { db, franchiseApplicationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authenticate, authorize } from "../middleware/auth";
import { catchAsync } from "../middleware/error";

const router: IRouter = Router();

// ── Public: Submit franchise application ──────────────────────────────────────
router.post("/franchise-applications", catchAsync(async (req, res): Promise<void> => {
  const { name, email, phone, address, city, description } = req.body;

  if (!name || !email || !phone || !address || !description) {
    res.status(400).json({ error: "Name, email, phone, address and description are required." });
    return;
  }

  const [application] = await db
    .insert(franchiseApplicationsTable)
    .values({ name, email, phone, address, city: city || null, description, status: "pending" })
    .returning();

  res.status(201).json(application);
}));

// ── Admin: Get all applications ───────────────────────────────────────────────
router.get("/franchise-applications", authenticate, authorize("admin"), catchAsync(async (req, res): Promise<void> => {
  const applications = await db
    .select()
    .from(franchiseApplicationsTable)
    .orderBy(desc(franchiseApplicationsTable.createdAt));

  res.json(applications);
}));

// ── Admin: Update status / notes ──────────────────────────────────────────────
router.patch("/franchise-applications/:id", authenticate, authorize("admin"), catchAsync(async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { status, adminNotes } = req.body;

  const [updated] = await db
    .update(franchiseApplicationsTable)
    .set({ status, adminNotes, updatedAt: new Date() })
    .where(eq(franchiseApplicationsTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Application not found" }); return; }
  res.json(updated);
}));

// ── Admin: Delete ─────────────────────────────────────────────────────────────
router.delete("/franchise-applications/:id", authenticate, authorize("admin"), catchAsync(async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [deleted] = await db
    .delete(franchiseApplicationsTable)
    .where(eq(franchiseApplicationsTable.id, id))
    .returning();

  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
}));

export default router;
