import { Router, type IRouter } from "express";
import { db, usersTable, enrollmentsTable, certificatesTable, lessonCompletionsTable } from "@workspace/db";
import { eq, count, sum, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const students = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    avatar: usersTable.avatar,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.role, "student")).limit(100);

  const leaderboard = await Promise.all(students.map(async (s) => {
    const [enroll] = await db.select({ c: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.userId, s.id));
    const [certs] = await db.select({ c: count() }).from(certificatesTable).where(eq(certificatesTable.userId, s.id));
    const [progress] = await db.select({ total: sum(lessonCompletionsTable.watchedPercent) })
      .from(lessonCompletionsTable).where(eq(lessonCompletionsTable.userId, s.id));
    const [lessons] = await db.select({ c: count() }).from(lessonCompletionsTable)
      .where(eq(lessonCompletionsTable.userId, s.id));
    const [completedLessons] = await db.select({ c: count() }).from(lessonCompletionsTable)
      .where(eq(lessonCompletionsTable.userId, s.id));

    const score = (Number(enroll?.c ?? 0) * 10) + (Number(certs?.c ?? 0) * 50) + (Number(lessons?.c ?? 0) * 5);
    return {
      id: s.id,
      name: s.name,
      avatar: s.avatar,
      enrolledCourses: Number(enroll?.c ?? 0),
      certificates: Number(certs?.c ?? 0),
      completedLessons: Number(completedLessons?.c ?? 0),
      score,
    };
  }));

  leaderboard.sort((a, b) => b.score - a.score);
  const ranked = leaderboard.map((s, i) => ({ ...s, rank: i + 1 }));
  res.json(ranked);
});

export default router;
