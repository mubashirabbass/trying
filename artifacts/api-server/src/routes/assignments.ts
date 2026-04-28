import { Router, type IRouter } from "express";
import { db, assignmentsTable, assignmentSubmissionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListAssignmentsQueryParams,
  CreateAssignmentBody,
  SubmitAssignmentParams,
  SubmitAssignmentBody,
  GradeAssignmentParams,
  GradeAssignmentBody,
} from "@workspace/api-zod";
import { getSession } from "../lib/auth";

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
  const [assignment] = await db.insert(assignmentsTable).values(parsed.data).returning();
  res.status(201).json(assignment);
});

router.post("/assignments/:id/submit", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const assignmentId = parseInt(raw, 10);
  if (isNaN(assignmentId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  const session = getSession(auth.slice(7));
  if (!session) { res.status(401).json({ error: "Invalid token" }); return; }

  const parsed = SubmitAssignmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [submission] = await db.insert(assignmentSubmissionsTable)
    .values({ assignmentId, userId: session.userId, fileUrl: parsed.data.fileUrl, notes: parsed.data.notes, status: "submitted" })
    .returning();
  res.json(submission);
});

router.post("/assignments/:id/grade", async (req, res): Promise<void> => {
  const parsed = GradeAssignmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [submission] = await db
    .update(assignmentSubmissionsTable)
    .set({ marks: parsed.data.marks, feedback: parsed.data.feedback, status: "graded" })
    .where(eq(assignmentSubmissionsTable.id, parsed.data.submissionId))
    .returning();
  if (!submission) { res.status(404).json({ error: "Submission not found" }); return; }
  res.json(submission);
});

export default router;
