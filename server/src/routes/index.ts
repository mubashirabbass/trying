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
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
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
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  
  try {
    const [category] = await db
      .update(successStoryCategoriesTable)
      .set(parsed.data)
      .where(eq(successStoryCategoriesTable.id, id))
      .returning();
      
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
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
      
    if (!deleted) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
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
import teacherAttendanceRouter from "./teacher-attendance";
import liveClassesRouter from "./live-classes";
import installmentLedgerRouter from "./installment-ledger";
import entryRecordsRouter from "./entry-records";
import cashbookRouter from "./cashbook";

console.log("✓ Teacher attendance router imported successfully");

import uploadRouter from "./upload";
import courseCategoriesRouter from "./course-categories";
import franchiseApplicationsRouter from "./franchise-applications";

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
router.use(teacherAttendanceRouter);
console.log("✓ Teacher attendance routes registered");
router.use(settingsRouter);
router.use(uploadRouter); // File uploads (images & PDFs) — requires auth internally
router.use(courseCategoriesRouter);
router.use(franchiseApplicationsRouter);

// TEMPORARY: Add test data creation route BEFORE authentication
router.post("/entry-records/create-test-data", async (req, res) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "This endpoint is only available in development" });
  }

  try {
    const { db, entryRecordsTable } = await import("@workspace/db");
    const { sql } = await import("drizzle-orm");

    // Check if data already exists
    const existingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(entryRecordsTable);

    if (existingCount[0].count > 0) {
      return res.json({ 
        message: `Test data already exists (${existingCount[0].count} records)`,
        count: existingCount[0].count 
      });
    }

    const testData = [
      {
        studentName: 'Ahmed Khan',
        histNo: 'REG-001',
        course: 'Computer Science Diploma',
        admissionDate: '2026-01-15',
        duration: '6 Months',
        receiptNo: 'RCP-001',
        amount: 15000,
        month: 'June 2026',
        isAutoGenerated: true,
      },
      {
        studentName: 'Fatima Ali',
        histNo: 'REG-002',
        course: 'Web Development Course',
        admissionDate: '2026-02-01',
        duration: '4 Months',
        receiptNo: 'RCP-002',
        amount: 12000,
        month: 'June 2026',
        isAutoGenerated: true,
      },
      {
        studentName: 'Muhammad Hassan',
        histNo: 'REG-003',
        course: 'Data Entry Course',
        admissionDate: '2026-01-20',
        duration: '3 Months',
        receiptNo: 'RCP-003',
        amount: 8000,
        month: 'June 2026',
        isAutoGenerated: true,
      },
      {
        studentName: 'Ayesha Malik',
        histNo: 'REG-004',
        course: 'Graphic Design Course',
        admissionDate: '2026-02-10',
        duration: '5 Months',
        receiptNo: 'RCP-004',
        amount: 18000,
        month: 'June 2026',
        isAutoGenerated: false,
      },
      {
        studentName: 'Ali Ahmed',
        histNo: 'REG-005',
        course: 'Office Management',
        admissionDate: '2026-01-25',
        duration: '4 Months',
        receiptNo: 'RCP-005',
        amount: 10000,
        month: 'June 2026',
        isAutoGenerated: true,
      },
      {
        studentName: 'Zara Sheikh',
        histNo: 'REG-006',
        course: 'Digital Marketing',
        admissionDate: '2026-02-15',
        duration: '6 Months',
        receiptNo: 'RCP-006',
        amount: 20000,
        month: 'June 2026',
        isAutoGenerated: false,
      },
      {
        studentName: 'Hamza Khan',
        histNo: 'REG-007',
        course: 'Programming Fundamentals',
        admissionDate: '2026-01-30',
        duration: '8 Months',
        receiptNo: 'RCP-007',
        amount: 25000,
        month: 'June 2026',
        isAutoGenerated: true,
      }
    ];

    const insertedRecords = await db
      .insert(entryRecordsTable)
      .values(testData)
      .returning();

    console.log(`Created ${insertedRecords.length} test entry records`);

    res.status(201).json({
      message: `Successfully created ${insertedRecords.length} test entry records`,
      records: insertedRecords,
    });
  } catch (error) {
    console.error("Test data creation error:", error);
    res.status(500).json({ error: "Failed to create test data", details: error.message });
  }
});

router.use(entryRecordsRouter); // Move entry records BEFORE authenticate middleware
router.use(cashbookRouter); // Add cashbook routes BEFORE authenticate middleware

router.use(authenticate);
router.use(lessonsRouter);
router.use(enrollmentsRouter);
router.use(assignmentsRouter);
router.use(quizzesRouter);
router.use(paymentsRouter);
router.use(installmentLedgerRouter);
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
