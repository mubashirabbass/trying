import { Router, type IRouter } from "express";
import { db, testimonialsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateTestimonialBody } from "@workspace/api-zod";

import { authenticate, authorize } from "../middleware/auth";

const router: IRouter = Router();

router.get("/testimonials", async (req, res): Promise<void> => {
  const testimonials = await db.select().from(testimonialsTable);
  res.json(testimonials);
});

router.post("/testimonials", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const parsed = CreateTestimonialBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [t] = await db.insert(testimonialsTable).values(parsed.data).returning();
  res.status(201).json(t);
});

router.put("/testimonials/:id", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = CreateTestimonialBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [t] = await db.update(testimonialsTable).set(parsed.data).where(eq(testimonialsTable.id, id)).returning();
  if (!t) { res.status(404).json({ error: "Not found" }); return; }
  res.json(t);
});

router.delete("/testimonials/:id", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id));
  res.sendStatus(204);
});

export default router;
