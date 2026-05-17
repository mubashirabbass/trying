import { Router, type IRouter } from "express";
import { db, faqsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { authenticate, authorize } from "../middleware/auth";
import { catchAsync } from "../middleware/error";

const router: IRouter = Router();

router.get("/faqs", catchAsync(async (req, res): Promise<void> => {
  const faqs = await db.select().from(faqsTable).orderBy(asc(faqsTable.orderIndex));
  res.json(faqs);
}));

router.post("/faqs", authenticate, authorize("admin"), catchAsync(async (req, res): Promise<void> => {
  let { question, answer, category, orderIndex } = req.body;
  if (!question || !answer) { res.status(400).json({ error: "Question and answer required" }); return; }
  
  const parsedOrderIndex = Number(orderIndex) || 0;
  const [faq] = await db.insert(faqsTable).values({ 
    question, 
    answer, 
    category, 
    orderIndex: parsedOrderIndex 
  }).returning();
  
  res.status(201).json(faq);
}));

router.put("/faqs/:id", authenticate, authorize("admin"), catchAsync(async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  let { question, answer, category, orderIndex } = req.body;
  
  // 1. Fetch the existing FAQ to get its current order index
  const [existingFaq] = await db.select().from(faqsTable).where(eq(faqsTable.id, id));
  if (!existingFaq) { res.status(404).json({ error: "Not found" }); return; }

  const currentOrderIndex = existingFaq.orderIndex ?? 0;
  const parsedOrderIndex = orderIndex !== undefined ? Number(orderIndex) : currentOrderIndex;

  // 2. If the order index is changing, check for swapping
  if (orderIndex !== undefined && parsedOrderIndex !== currentOrderIndex) {
    const [swappedFaq] = await db
      .select()
      .from(faqsTable)
      .where(eq(faqsTable.orderIndex, parsedOrderIndex));

    if (swappedFaq && swappedFaq.id !== id) {
      // Swap the other FAQ's order index to this FAQ's previous order index
      await db
        .update(faqsTable)
        .set({ orderIndex: currentOrderIndex, updatedAt: new Date() })
        .where(eq(faqsTable.id, swappedFaq.id));
    }
  }

  // 3. Update the targeted FAQ
  const [faq] = await db
    .update(faqsTable)
    .set({ 
      question, 
      answer, 
      category, 
      orderIndex: parsedOrderIndex, 
      updatedAt: new Date() 
    })
    .where(eq(faqsTable.id, id))
    .returning();

  res.json(faq);
}));

router.delete("/faqs/:id", authenticate, authorize("admin"), catchAsync(async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  await db.delete(faqsTable).where(eq(faqsTable.id, id));
  res.sendStatus(204);
}));

export default router;
