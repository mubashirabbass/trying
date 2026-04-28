import { Router, type IRouter } from "express";
import { db, quizzesTable, quizResultsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListQuizzesQueryParams,
  CreateQuizBody,
  SubmitQuizParams,
  SubmitQuizBody,
} from "@workspace/api-zod";
import { getSession } from "../lib/auth";

const router: IRouter = Router();

router.get("/quizzes", async (req, res): Promise<void> => {
  const params = ListQuizzesQueryParams.safeParse(req.query);
  let quizzes;
  if (params.success && params.data.courseId) {
    quizzes = await db.select().from(quizzesTable).where(eq(quizzesTable.courseId, Number(params.data.courseId)));
  } else {
    quizzes = await db.select().from(quizzesTable);
  }
  res.json(quizzes);
});

router.post("/quizzes", async (req, res): Promise<void> => {
  const parsed = CreateQuizBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [quiz] = await db.insert(quizzesTable).values({
    courseId: parsed.data.courseId,
    title: parsed.data.title,
    questions: parsed.data.questions,
    totalMarks: parsed.data.totalMarks,
    timeLimit: parsed.data.timeLimit,
  }).returning();
  res.status(201).json(quiz);
});

router.post("/quizzes/:id/submit", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const quizId = parseInt(raw, 10);
  if (isNaN(quizId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  const session = getSession(auth.slice(7));
  if (!session) { res.status(401).json({ error: "Invalid token" }); return; }

  const parsed = SubmitQuizBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, quizId));
  if (!quiz) { res.status(404).json({ error: "Quiz not found" }); return; }

  const questions = quiz.questions as Array<{ id: number; question: string; options: string[]; correctOption: number; marks: number }>;
  let score = 0;
  const answers = parsed.data.answers.map(answer => {
    const q = questions.find(q => q.id === answer.questionId);
    const correct = q ? q.correctOption === answer.selectedOption : false;
    if (correct && q) score += q.marks;
    return {
      questionId: answer.questionId,
      correct,
      selectedOption: answer.selectedOption,
      correctOption: q?.correctOption ?? 0,
    };
  });

  const percentage = quiz.totalMarks > 0 ? (score / quiz.totalMarks) * 100 : 0;
  const passed = percentage >= 50;

  const [result] = await db.insert(quizResultsTable).values({
    quizId,
    userId: session.userId,
    score,
    totalMarks: quiz.totalMarks,
    percentage: Math.round(percentage),
    passed,
    answers,
  }).returning();

  res.json({ ...result, answers });
});

export default router;
