import { Router, type IRouter } from "express";
import { db, sectionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListSectionsQueryParams,
  CreateSectionBody,
} from "@workspace/api-zod";
import { AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

router.get("/sections", async (req: AuthRequest, res): Promise<void> => {
  const params = ListSectionsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  
  const courseId = Number(params.data.courseId);
  const sections = await db
    .select()
    .from(sectionsTable)
    .where(eq(sectionsTable.courseId, courseId))
    .orderBy(sectionsTable.order);

  res.json(sections);
});

router.post("/sections", async (req, res): Promise<void> => {
  const parsed = CreateSectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  const [section] = await db
    .insert(sectionsTable)
    .values({
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      order: parsed.data.order ?? 0,
    })
    .returning();

  res.status(201).json(section);
});

router.get("/sections/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid section id" });
    return;
  }
  
  const [section] = await db
    .select()
    .from(sectionsTable)
    .where(eq(sectionsTable.id, id));
    
  if (!section) {
    res.status(404).json({ error: "Section not found" });
    return;
  }
  
  res.json(section);
});

router.put("/sections/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid section id" });
    return;
  }
  
  const parsed = CreateSectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  const [section] = await db
    .update(sectionsTable)
    .set({
      title: parsed.data.title,
      order: parsed.data.order ?? 0,
    })
    .where(eq(sectionsTable.id, id))
    .returning();
    
  if (!section) {
    res.status(404).json({ error: "Section not found" });
    return;
  }
  
  res.json(section);
});

router.delete("/sections/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid section id" });
    return;
  }
  
  await db.delete(sectionsTable).where(eq(sectionsTable.id, id));
  res.sendStatus(204);
});

export default router;
