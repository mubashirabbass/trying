import { Router, type IRouter } from "express";
import { db, assignmentsTable, assignmentSubmissionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListAssignmentsQueryParams,
  CreateAssignmentBody,
  SubmitAssignmentParams,
  SubmitAssignmentBody,
  GradeAssignmentParams,
  GradeAssignmentBody,
} from "@workspace/api-zod";
import { AuthRequest } from "../middleware/auth";

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

router.post("/assignments", async (req, res): Promise<void> => {
  const parsed = CreateAssignmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const values = {
    ...parsed.data,
    dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
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

router.post("/assignments/:id/grade", async (req, res): Promise<void> => {
  const parsed = GradeAssignmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  
  const { submissionId, marks, feedback } = parsed.data;

  const [submission] = await db
    .update(assignmentSubmissionsTable)
    .set({ marks, feedback, status: "graded" })
    .where(eq(assignmentSubmissionsTable.id, submissionId))
    .returning();
    
  if (!submission) { res.status(404).json({ error: "Submission not found" }); return; }
  res.json(submission);
});

router.put("/assignments/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = CreateAssignmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [assignment] = await db
    .update(assignmentsTable)
    .set({
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    })
    .where(eq(assignmentsTable.id, id))
    .returning();

  if (!assignment) { res.status(404).json({ error: "Assignment not found" }); return; }
  res.json(assignment);
});

router.delete("/assignments/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(assignmentsTable).where(eq(assignmentsTable.id, id));
  res.sendStatus(204);
});

export default router;
