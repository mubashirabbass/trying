import { Router, type IRouter } from "express";
import { db, assignmentsTable, assignmentSubmissionsTable, usersTable, coursesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { notificationTriggers } from "../lib/notifications";
import {
  ListAssignmentsQueryParams,
  CreateAssignmentBody,
  SubmitAssignmentParams,
  SubmitAssignmentBody,
  GradeAssignmentParams,
  GradeAssignmentBody,
} from "@workspace/api-zod";
import { AuthRequest, authorize } from "../middleware/auth";

const router: IRouter = Router();

router.get("/assignments", async (req, res): Promise<void> => {
  const params = ListAssignmentsQueryParams.safeParse(req.query);
  let assignments;
  if (params.success && params.data.courseId) {
    assignments = await db.select().from(assignmentsTable).where(eq(assignmentsTable.courseId, Number(params.data.courseId)));
  } else {
    assignments = await db.select().from(assignmentsTable);
  }
  res.json(assignments);
});

router.post("/assignments", authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateAssignmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  if (!parsed.data.fileUrl?.trim()) {
    res.status(400).json({ error: "Assignment PDF is required" });
    return;
  }
  
  const courseId = Number(parsed.data.courseId);
  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) { res.status(404).json({ error: "Course not found" }); return; }

  if (req.user.role === "teacher" && course.teacherId !== req.user.id) {
    res.status(403).json({ error: "You do not have permission to manage assignments for this course" });
    return;
  }

  const values: any = {
    ...parsed.data,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    fileUrl: parsed.data.fileUrl || null,
  };
  const [assignment] = await db.insert(assignmentsTable).values(values).returning();
  res.status(201).json(assignment);
});

router.post("/assignments/:id/submit", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const assignmentId = parseInt(raw, 10);
  if (isNaN(assignmentId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = SubmitAssignmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  if (!parsed.data.fileUrl?.trim()) {
    res.status(400).json({ error: "Solved assignment PDF is required" });
    return;
  }

  const [assignment] = await db.select().from(assignmentsTable).where(eq(assignmentsTable.id, assignmentId));
  if (!assignment) { res.status(404).json({ error: "Assignment not found" }); return; }
  if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
    res.status(403).json({ error: "Assignment deadline has passed. Ask your teacher to extend the deadline." });
    return;
  }

  const [submission] = await db.insert(assignmentSubmissionsTable)
    .values({ assignmentId, userId: userId, fileUrl: parsed.data.fileUrl, notes: parsed.data.notes, status: "submitted" })
    .returning();
  res.json(submission);
});

router.get("/assignments/submissions/me", async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const submissions = await db
    .select({
      id: assignmentSubmissionsTable.id,
      assignmentId: assignmentSubmissionsTable.assignmentId,
      fileUrl: assignmentSubmissionsTable.fileUrl,
      marks: assignmentSubmissionsTable.marks,
      feedback: assignmentSubmissionsTable.feedback,
      status: assignmentSubmissionsTable.status,
      submittedAt: assignmentSubmissionsTable.submittedAt,
      assignmentTitle: assignmentsTable.title,
      dueDate: assignmentsTable.dueDate,
    })
    .from(assignmentSubmissionsTable)
    .innerJoin(assignmentsTable, eq(assignmentSubmissionsTable.assignmentId, assignmentsTable.id))
    .where(eq(assignmentSubmissionsTable.userId, userId));

  res.json(submissions);
});

router.get("/assignments/submissions", async (req, res): Promise<void> => {
  const { assignmentId, courseId } = req.query;

  let query = db
    .select({
      id: assignmentSubmissionsTable.id,
      assignmentId: assignmentSubmissionsTable.assignmentId,
      userId: assignmentSubmissionsTable.userId,
      fileUrl: assignmentSubmissionsTable.fileUrl,
      notes: assignmentSubmissionsTable.notes,
      marks: assignmentSubmissionsTable.marks,
      feedback: assignmentSubmissionsTable.feedback,
      status: assignmentSubmissionsTable.status,
      submittedAt: assignmentSubmissionsTable.submittedAt,
      userName: usersTable.name,
      assignmentTitle: assignmentsTable.title,
      dueDate: assignmentsTable.dueDate,
    })
    .from(assignmentSubmissionsTable)
    .innerJoin(usersTable, eq(assignmentSubmissionsTable.userId, usersTable.id))
    .innerJoin(assignmentsTable, eq(assignmentSubmissionsTable.assignmentId, assignmentsTable.id))
    .$dynamic();

  if (assignmentId) {
    query = query.where(eq(assignmentSubmissionsTable.assignmentId, Number(assignmentId)));
  } else if (courseId) {
    query = query.where(eq(assignmentsTable.courseId, Number(courseId)));
  }

  const submissions = await query;
  res.json(submissions);
});

router.post("/assignments/:id/grade", authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = GradeAssignmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  
  const { submissionId, marks, feedback } = parsed.data;

  const [submission] = await db.select().from(assignmentSubmissionsTable).where(eq(assignmentSubmissionsTable.id, submissionId));
  if (!submission) { res.status(404).json({ error: "Submission not found" }); return; }

  const [assignment] = await db.select().from(assignmentsTable).where(eq(assignmentsTable.id, submission.assignmentId));
  if (!assignment) { res.status(404).json({ error: "Assignment not found" }); return; }

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, assignment.courseId));
  if (!course) { res.status(404).json({ error: "Course not found" }); return; }

  if (req.user.role === "teacher" && course.teacherId !== req.user.id) {
    res.status(403).json({ error: "You do not have permission to grade this assignment" });
    return;
  }

  const [updatedSubmission] = await db
    .update(assignmentSubmissionsTable)
    .set({ marks, feedback, status: "graded" })
    .where(eq(assignmentSubmissionsTable.id, submissionId))
    .returning();

  // Trigger notification
  try {
    notificationTriggers.assignmentGraded(submission.userId, assignment.title, marks, assignment.totalMarks || 100)
      .catch(err => console.error("Failed to trigger assignment notification:", err));
  } catch (err) {
    console.error("Error triggering assignment notification:", err);
  }

  res.json(updatedSubmission);
});

router.put("/assignments/:id", authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existingAssignment] = await db.select().from(assignmentsTable).where(eq(assignmentsTable.id, id));
  if (!existingAssignment) { res.status(404).json({ error: "Assignment not found" }); return; }

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, existingAssignment.courseId));
  if (!course) { res.status(404).json({ error: "Associated course not found" }); return; }

  if (req.user.role === "teacher" && course.teacherId !== req.user.id) {
    res.status(403).json({ error: "You do not have permission to modify this assignment" });
    return;
  }

  const parsed = CreateAssignmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  if (!parsed.data.fileUrl?.trim()) {
    res.status(400).json({ error: "Assignment PDF is required" });
    return;
  }

  const values: any = {
    ...parsed.data,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    fileUrl: parsed.data.fileUrl || null,
  };

  const [assignment] = await db
    .update(assignmentsTable)
    .set(values)
    .where(eq(assignmentsTable.id, id))
    .returning();

  res.json(assignment);
});

router.delete("/assignments/:id", authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existingAssignment] = await db.select().from(assignmentsTable).where(eq(assignmentsTable.id, id));
  if (!existingAssignment) { res.status(404).json({ error: "Assignment not found" }); return; }

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, existingAssignment.courseId));
  if (!course) { res.status(404).json({ error: "Associated course not found" }); return; }

  if (req.user.role === "teacher" && course.teacherId !== req.user.id) {
    res.status(403).json({ error: "You do not have permission to delete this assignment" });
    return;
  }

  await db.delete(assignmentsTable).where(eq(assignmentsTable.id, id));
  res.sendStatus(204);
});

export default router;
