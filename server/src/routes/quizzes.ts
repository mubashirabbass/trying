import { Router, type IRouter } from "express";
import { db, quizzesTable, quizResultsTable, questionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListQuizzesQueryParams,
  CreateQuizBody,
  SubmitQuizParams,
  SubmitQuizBody,
} from "@workspace/api-zod";
import { AuthRequest } from "../middleware/auth";
import { notificationTriggers } from "../lib/notifications";

const router: IRouter = Router();

router.get("/quizzes", async (req, res): Promise<void> => {
  const params = ListQuizzesQueryParams.safeParse(req.query);
  let quizzes;
  if (params.success && params.data.courseId) {
    quizzes = await db.select().from(quizzesTable).where(eq(quizzesTable.courseId, Number(params.data.courseId)));
  } else {
    quizzes = await db.select().from(quizzesTable);
  }

  // Fetch questions for each quiz
  const quizzesWithQuestions = await Promise.all(quizzes.map(async (quiz) => {
    const dbQuestions = await db.select().from(questionsTable).where(eq(questionsTable.quizId, quiz.id)).orderBy(questionsTable.orderIndex);
    const questions = dbQuestions.map(q => ({
      id: q.id,
      question: q.questionText,
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      correctOption: q.correctOption.charCodeAt(0) - 65,
      marks: q.marks,
    }));
    return { ...quiz, questions };
  }));

  res.json(quizzesWithQuestions);
});

router.post("/quizzes", async (req, res): Promise<void> => {
  const parsed = CreateQuizBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  
  const { questions, ...quizData } = parsed.data;

  // Use a transaction to ensure both quiz and questions are inserted
  const result = await db.transaction(async (tx) => {
    const [quiz] = await tx.insert(quizzesTable).values({
      courseId: quizData.courseId,
      title: quizData.title,
      totalMarks: quizData.totalMarks,
      timeLimit: quizData.timeLimit,
    }).returning();

    const insertedQuestions = await Promise.all(questions.map(async (q, index) => {
      const options = q.options || [];
      const [question] = await tx.insert(questionsTable).values({
        quizId: quiz.id,
        questionText: q.question,
        optionA: options[0] || "",
        optionB: options[1] || "",
        optionC: options[2] || "",
        optionD: options[3] || "",
        correctOption: String.fromCharCode(65 + q.correctOption), // 0 -> A, 1 -> B, etc.
        marks: q.marks,
        orderIndex: index,
      }).returning();
      return question;
    }));

    return { ...quiz, questions: insertedQuestions };
  });

  res.status(201).json(result);
});

router.post("/quizzes/:id/submit", async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const quizId = parseInt(raw, 10);
  if (isNaN(quizId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = SubmitQuizBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, quizId));
  if (!quiz) { res.status(404).json({ error: "Quiz not found" }); return; }

  const questions = await db.select().from(questionsTable).where(eq(questionsTable.quizId, quizId));
  
  let score = 0;
  const answers = parsed.data.answers.map(answer => {
    const q = questions.find(q => q.id === answer.questionId);
    const selectedChar = String.fromCharCode(65 + answer.selectedOption); // 0 -> A, 1 -> B, etc.
    const correct = q ? q.correctOption === selectedChar : false;
    if (correct && q) score += q.marks;
    return {
      questionId: answer.questionId,
      correct,
      selectedOption: answer.selectedOption,
      correctOption: q ? (q.correctOption.charCodeAt(0) - 65) : 0,
    };
  });

  const percentage = quiz.totalMarks > 0 ? (score / quiz.totalMarks) * 100 : 0;
  const passed = percentage >= 50;

  const [result] = await db.insert(quizResultsTable).values({
    quizId,
    userId: userId,
    score,
    totalMarks: quiz.totalMarks,
    percentage: Math.round(percentage),
    passed,
    answers,
  }).returning();

  // Trigger notification
  notificationTriggers.quizCompleted(userId, quiz.title, score, passed)
    .catch(err => console.error("Failed to trigger quiz notification:", err));

  res.json({ ...result, answers });
});

router.get("/quizzes/results", async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const results = await db.select({
    id: quizResultsTable.id,
    quizId: quizResultsTable.quizId,
    score: quizResultsTable.score,
    totalMarks: quizResultsTable.totalMarks,
    percentage: quizResultsTable.percentage,
    passed: quizResultsTable.passed,
    createdAt: quizResultsTable.createdAt,
    quizTitle: quizzesTable.title,
  })
  .from(quizResultsTable)
  .leftJoin(quizzesTable, eq(quizResultsTable.quizId, quizzesTable.id))
  .where(eq(quizResultsTable.userId, userId))
  .orderBy(quizResultsTable.createdAt);

  res.json(results);
});

router.get("/quizzes/results/:id", async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const resultId = parseInt(req.params.id, 10);
  if (isNaN(resultId)) { res.status(400).json({ error: "Invalid result id" }); return; }

  const [result] = await db.select().from(quizResultsTable).where(eq(quizResultsTable.id, resultId));
  if (!result) { res.status(404).json({ error: "Result not found" }); return; }
  
  if (result.userId !== userId && req.user?.role !== 'admin') {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, result.quizId));
  const questions = await db.select().from(questionsTable).where(eq(questionsTable.quizId, result.quizId)).orderBy(questionsTable.orderIndex);

  const formattedQuestions = questions.map(q => ({
    id: q.id,
    question: q.questionText,
    options: [q.optionA, q.optionB, q.optionC, q.optionD],
    correctOption: q.correctOption.charCodeAt(0) - 65,
    marks: q.marks,
  }));

  res.json({
    ...result,
    quiz: {
      ...quiz,
      questions: formattedQuestions
    }
  });
});

export default router;
