import { Router, type IRouter } from "express";
import { db, faqsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { authenticate, authorize } from "../middleware/auth";

const router: IRouter = Router();

router.get("/faqs", async (req, res): Promise<void> => {
  const faqs = await db.select().from(faqsTable).orderBy(asc(faqsTable.orderIndex));
  res.json(faqs);
});

router.post("/faqs", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const { question, answer, category, orderIndex } = req.body;
  if (!question || !answer) { res.status(400).json({ error: "Question and answer required" }); return; }
  const [faq] = await db.insert(faqsTable).values({ question, answer, category, orderIndex }).returning();
  res.status(201).json(faq);
});

router.put("/faqs/:id", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { question, answer, category, orderIndex } = req.body;
  const [faq] = await db.update(faqsTable).set({ question, answer, category, orderIndex, updatedAt: new Date() }).where(eq(faqsTable.id, id)).returning();
  if (!faq) { res.status(404).json({ error: "Not found" }); return; }
  res.json(faq);
});

router.delete("/faqs/:id", authenticate, authorize("admin"), async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(faqsTable).where(eq(faqsTable.id, id));
  res.sendStatus(204);
});

export default router;
