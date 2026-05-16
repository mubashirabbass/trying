import { Router, type IRouter } from "express";
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

import { authenticate } from "../middleware/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(coursesRouter); // courses/list and detail are public
router.use(testimonialsRouter); // testimonials list is public
router.use(successStoriesRouter); // success stories are public
router.use(branchesRouter); // branches list is public
router.use(faqsRouter); // faqs list is public
router.use(certificatesRouter);

// Private routes below this line
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

export default router;
