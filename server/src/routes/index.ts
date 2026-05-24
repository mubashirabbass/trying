import { Router, type IRouter } from "express";
import { db, successStoryCategoriesTable, pool, usersTable } from "@workspace/db";
import { CreateSuccessStoryCategoryBody } from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";
import { authenticate, authorize } from "../middleware/auth";

const router: IRouter = Router();

// --- CRITICAL: CATEGORY ROUTES MOVED TO TOP ---
router.get("/success-story-categories", async (req, res) => {
  const categories = await db.select().from(successStoryCategoriesTable);
  res.json(categories);
});

router.get("/teachers/public", async (req, res) => {
  try {
    const teachers = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      avatar: usersTable.avatar,
      designation: usersTable.designation,
      experience: usersTable.experience,
      specialization: usersTable.specialization,
      qualification: usersTable.qualification,
      email: usersTable.email
    })
    .from(usersTable)
    .where(and(eq(usersTable.role, "teacher"), eq(usersTable.isActive, true)));

    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/success-story-categories", authenticate, authorize("admin"), async (req, res) => {
  const parsed = CreateSuccessStoryCategoryBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  try {
    const [category] = await db.insert(successStoryCategoriesTable).values(parsed.data).returning();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.put("/success-story-categories/:id", authenticate, authorize("admin"), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = CreateSuccessStoryCategoryBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  
  try {
    const [category] = await db
      .update(successStoryCategoriesTable)
      .set(parsed.data)
      .where(eq(successStoryCategoriesTable.id, id))
      .returning();
      
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/success-story-categories/:id", authenticate, authorize("admin"), async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [deleted] = await db
      .delete(successStoryCategoriesTable)
      .where(eq(successStoryCategoriesTable.id, id))
      .returning();
      
    if (!deleted) return res.status(404).json({ error: "Category not found" });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});
// ----------------------------------------------

import healthRouter from "./health";
import authRouter from "./auth";
import coursesRouter from "./courses";
import lessonsRouter from "./lessons";
import enrollmentsRouter from "./enrollments";
import assignmentsRouter from "./assignments";
import quizzesRouter from "./quizzes";
import paymentsRouter from "./payments";
import testimonialsRouter from "./testimonials";
import successStoriesRouter from "./success-stories";
import certificatesRouter from "./certificates";
import dashboardRouter from "./dashboard";
import notificationsRouter from "./notifications";
import forumRouter from "./forum";
import messagesRouter from "./messages";
import identityVerificationRouter from "./identity-verification";
import settingsRouter from "./settings";
import leaderboardRouter from "./leaderboard";
import sectionsRouter from "./sections";
import branchesRouter from "./branches";
import reportsRouter from "./reports";
import faqsRouter from "./faqs";
import articlesRouter from "./articles";
import usersRouter from "./users";
import attendanceRouter from "./attendance";
import liveClassesRouter from "./live-classes";
import uploadRouter from "./upload";

router.use(healthRouter);
router.use(authRouter);
router.use(coursesRouter);
router.use(testimonialsRouter);
router.use(successStoriesRouter);
router.use(branchesRouter);
router.use(faqsRouter);
router.use(articlesRouter);
router.use(certificatesRouter);
router.use(usersRouter);
router.use(attendanceRouter);
router.use(settingsRouter);
router.use(uploadRouter); // File uploads (images & PDFs) — requires auth internally

router.use(authenticate);
router.use(lessonsRouter);
router.use(enrollmentsRouter);
router.use(assignmentsRouter);
router.use(quizzesRouter);
router.use(paymentsRouter);
router.use(dashboardRouter);
router.use(notificationsRouter);
router.use(forumRouter);
router.use(messagesRouter);
router.use(identityVerificationRouter);
router.use(leaderboardRouter);
router.use(sectionsRouter);
router.use(reportsRouter);
router.use(liveClassesRouter);

export default router;
