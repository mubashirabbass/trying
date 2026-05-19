import { Router, type IRouter } from "express";
import { db, enrollmentsTable, coursesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListEnrollmentsQueryParams,
  CreateEnrollmentBody,
  DeleteEnrollmentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/enrollments", async (req, res): Promise<void> => {
  const params = ListEnrollmentsQueryParams.safeParse(req.query);

  const enrollments = await db
    .select({
      id: enrollmentsTable.id,
      userId: enrollmentsTable.userId,
      courseId: enrollmentsTable.courseId,
      progress: enrollmentsTable.progress,
      status: enrollmentsTable.status,
      enrolledAt: enrollmentsTable.enrolledAt,
      courseName: coursesTable.title,
      userName: usersTable.name,
    })
    .from(enrollmentsTable)
    .leftJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
    .leftJoin(usersTable, eq(enrollmentsTable.userId, usersTable.id));

  let filtered = enrollments;
  if (params.success) {
    if (params.data.userId) filtered = filtered.filter(e => e.userId === Number(params.data.userId));
    if (params.data.courseId) filtered = filtered.filter(e => e.courseId === Number(params.data.courseId));
  }
  res.json(filtered);
});

router.post("/enrollments", async (req: any, res): Promise<void> => {
  const parsed = CreateEnrollmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { userId, courseId } = parsed.data;

  const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId));
  if (!course) { res.status(404).json({ error: "Course not found" }); return; }

  const [existing] = await db.select().from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, courseId)));
  if (existing) { res.status(409).json({ error: "Already enrolled" }); return; }

  // If requester is Admin, enroll as "active" immediately. Otherwise, enroll as "pending" for admin approval.
  const isAdmin = req.user?.role === "admin";
  const status = isAdmin ? "active" : "pending";

  const [enrollment] = await db.insert(enrollmentsTable).values({ userId, courseId, status }).returning();
  res.status(201).json({ ...enrollment, courseName: course.title, userName: null });
});

router.patch("/enrollments/:id", async (req: any, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { status } = req.body;
  if (!status) { res.status(400).json({ error: "Status is required" }); return; }

  const [updated] = await db.update(enrollmentsTable)
    .set({ status })
    .where(eq(enrollmentsTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "Enrollment not found" }); return; }
  res.json(updated);
});

router.delete("/enrollments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(enrollmentsTable).where(eq(enrollmentsTable.id, id));
  res.sendStatus(204);
});

export default router;
