import { Router, type IRouter } from "express";
import { db, coursesTable, usersTable, enrollmentsTable, lessonsTable } from "@workspace/db";
import { eq, sql, count, desc } from "drizzle-orm";
import {
  ListCoursesQueryParams,
  CreateCourseBody,
  GetCourseParams,
  UpdateCourseParams,
  UpdateCourseBody,
  DeleteCourseParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/courses/stats", async (req, res): Promise<void> => {
  const coursesCount = await db.select({ count: count() }).from(coursesTable);
  const enrollmentsCount = await db.select({ count: count() }).from(enrollmentsTable);
  const popularCourses = await db
    .select({
      id: coursesTable.id,
      title: coursesTable.title,
      enrollmentCount: count(enrollmentsTable.id),
    })
    .from(coursesTable)
    .leftJoin(enrollmentsTable, eq(coursesTable.id, enrollmentsTable.courseId))
    .groupBy(coursesTable.id, coursesTable.title)
    .orderBy(desc(count(enrollmentsTable.id)))
    .limit(5);

  const categoryBreakdown = await db
    .select({ category: coursesTable.category, count: count() })
    .from(coursesTable)
    .groupBy(coursesTable.category);

  res.json({
    totalCourses: coursesCount[0]?.count ?? 0,
    totalEnrollments: enrollmentsCount[0]?.count ?? 0,
    popularCourses: popularCourses.map(c => ({ id: c.id, title: c.title, enrollmentCount: Number(c.enrollmentCount) })),
    categoryBreakdown: categoryBreakdown.map(c => ({ category: c.category, count: Number(c.count) })),
  });
});

router.get("/courses", async (req, res): Promise<void> => {
  const params = ListCoursesQueryParams.safeParse(req.query);
  const courses = await db
    .select({
      id: coursesTable.id,
      title: coursesTable.title,
      description: coursesTable.description,
      category: coursesTable.category,
      duration: coursesTable.duration,
      fee: coursesTable.fee,
      thumbnail: coursesTable.thumbnail,
      teacherId: coursesTable.teacherId,
      isFeatured: coursesTable.isFeatured,
      isFree: coursesTable.isFree,
      createdAt: coursesTable.createdAt,
      teacherName: usersTable.name,
    })
    .from(coursesTable)
    .leftJoin(usersTable, eq(coursesTable.teacherId, usersTable.id));

  const enriched = await Promise.all(courses.map(async (course) => {
    const enrollCount = await db.select({ c: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, course.id));
    const lessonCount = await db.select({ c: count() }).from(lessonsTable).where(eq(lessonsTable.courseId, course.id));
    return {
      ...course,
      enrollmentCount: Number(enrollCount[0]?.c ?? 0),
      lessonCount: Number(lessonCount[0]?.c ?? 0),
    };
  }));

  let filtered = enriched;
  if (params.success) {
    if (params.data.category) filtered = filtered.filter(c => c.category === params.data.category);
    if (params.data.featured !== undefined) filtered = filtered.filter(c => c.isFeatured === params.data.featured);
    if (params.data.search) {
      const q = params.data.search.toLowerCase();
      filtered = filtered.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
  }
  res.json(filtered);
});

router.post("/courses", async (req, res): Promise<void> => {
  const parsed = CreateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [course] = await db.insert(coursesTable).values(parsed.data).returning();
  res.status(201).json({ ...course, enrollmentCount: 0, lessonCount: 0, teacherName: null });
});

router.get("/courses/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [course] = await db
    .select({ id: coursesTable.id, title: coursesTable.title, description: coursesTable.description, category: coursesTable.category, duration: coursesTable.duration, fee: coursesTable.fee, thumbnail: coursesTable.thumbnail, teacherId: coursesTable.teacherId, isFeatured: coursesTable.isFeatured, isFree: coursesTable.isFree, createdAt: coursesTable.createdAt, syllabus: coursesTable.syllabus, teacherName: usersTable.name })
    .from(coursesTable)
    .leftJoin(usersTable, eq(coursesTable.teacherId, usersTable.id))
    .where(eq(coursesTable.id, id));

  if (!course) { res.status(404).json({ error: "Course not found" }); return; }

  const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, id)).orderBy(lessonsTable.orderIndex);
  const enrollCount = await db.select({ c: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, id));
  res.json({ ...course, enrollmentCount: Number(enrollCount[0]?.c ?? 0), lessonCount: lessons.length, lessons });
});

router.put("/courses/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateCourseBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [course] = await db.update(coursesTable).set(parsed.data).where(eq(coursesTable.id, id)).returning();
  if (!course) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...course, enrollmentCount: 0, lessonCount: 0, teacherName: null });
});

router.delete("/courses/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(coursesTable).where(eq(coursesTable.id, id));
  res.sendStatus(204);
});

export default router;
