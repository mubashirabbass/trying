import { Router, type IRouter } from "express";
import { db, successStoryCategoriesTable, pool } from "@workspace/db";
import { CreateSuccessStoryCategoryBody } from "@workspace/api-zod";

const router: IRouter = Router();

// --- CRITICAL: CATEGORY ROUTES MOVED TO TOP ---
router.get("/success-story-categories", async (req, res) => {
  console.log("TOP LEVEL GET HIT");
  const categories = await db.select().from(successStoryCategoriesTable);
  res.json(categories);
});

router.post("/success-story-categories", async (req, res) => {
  console.log("TOP LEVEL POST HIT:", req.body);
  const parsed = CreateSuccessStoryCategoryBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  try {
    const [category] = await db.insert(successStoryCategoriesTable).values(parsed.data).returning();
    res.status(201).json(category);
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

import { authenticate, authorize } from "../middleware/auth";

router.use(healthRouter);
router.use(authRouter);
router.use(coursesRouter);
router.use(testimonialsRouter);
router.use("/success-stories", successStoriesRouter);
router.use(branchesRouter);
router.use(faqsRouter);
router.use(articlesRouter);
router.use(certificatesRouter);

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
router.use(settingsRouter);
router.use(leaderboardRouter);
router.use(sectionsRouter);
router.use(reportsRouter);
router.use(usersRouter);

export default router;
