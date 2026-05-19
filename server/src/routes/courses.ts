import { Router, type IRouter } from "express";
import { db, coursesTable, usersTable, enrollmentsTable, lessonsTable } from "@workspace/db";
import { eq, sql, count, desc, or, and, ilike } from "drizzle-orm";
import {
  ListCoursesQueryParams,
  CreateCourseBody,
  GetCourseParams,
  UpdateCourseParams,
  UpdateCourseBody,
  DeleteCourseParams,
} from "@workspace/api-zod";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { verifyToken } from "../lib/auth";

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
  const limit = Number(req.query.limit) || 24;
  const offset = Number(req.query.offset) || 0;

  let isStaff = false;
  try {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      const token = auth.slice(7);
      const decoded = verifyToken(token);
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, decoded.sub));
      if (user && (user.role === "admin" || user.role === "teacher")) {
        isStaff = true;
      }
    }
  } catch (e) {}

  let conditions = [];
  if (!isStaff) {
    conditions.push(eq(coursesTable.status, "live"));
  }

  if (params.success) {
    if (params.data.category) conditions.push(eq(coursesTable.category, params.data.category));
    if (params.data.featured !== undefined) conditions.push(eq(coursesTable.isFeatured, params.data.featured));
    if (params.data.search) {
      conditions.push(or(
        ilike(coursesTable.title, `%${params.data.search}%`),
        ilike(coursesTable.description, `%${params.data.search}%`)
      ));
    }
    if (params.data.teacherId !== undefined) {
      conditions.push(eq(coursesTable.teacherId, params.data.teacherId));
    }
  }

  const courses = await db
    .select({
      id: coursesTable.id,
      title: coursesTable.title,
      slug: coursesTable.slug,
      status: coursesTable.status,
      description: coursesTable.description,
      category: coursesTable.category,
      duration: coursesTable.duration,
      totalDurationHours: coursesTable.totalDurationHours,
      fee: coursesTable.fee,
      thumbnail: coursesTable.thumbnail,
      teacherId: coursesTable.teacherId,
      isFeatured: coursesTable.isFeatured,
      isFree: coursesTable.isFree,
      createdAt: coursesTable.createdAt,
      teacherName: usersTable.name,
    })
    .from(coursesTable)
    .leftJoin(usersTable, eq(coursesTable.teacherId, usersTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(coursesTable.createdAt));

  const enriched = await Promise.all(courses.map(async (course) => {
    const enrollCount = await db.select({ c: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, course.id));
    const lessonCount = await db.select({ c: count() }).from(lessonsTable).where(eq(lessonsTable.courseId, course.id));
    return {
      ...course,
      enrollmentCount: Number(enrollCount[0]?.c ?? 0),
      lessonCount: Number(lessonCount[0]?.c ?? 0),
    };
  }));

  res.json(enriched);
});

router.post("/courses", authenticate, authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const slug = parsed.data.title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
  
  let insertData: any = {
    ...parsed.data,
    slug,
    status: req.user.role === "admin" ? "live" : "draft"
  };

  if (req.user.role === "teacher") {
    insertData.teacherId = req.user.id;
  }

  const [course] = await db.insert(coursesTable).values(insertData).returning();
  res.status(201).json({ ...course, enrollmentCount: 0, lessonCount: 0, teacherName: req.user.role === "admin" ? null : req.user.name });
});

router.get("/courses/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  
  let query;
  if (isNaN(id)) {
    // If not a number, try searching by slug
    query = eq(coursesTable.slug, req.params.id as string);
  } else {
    query = eq(coursesTable.id, id);
  }

  const [course] = await db
    .select({ 
      id: coursesTable.id, 
      title: coursesTable.title, 
      slug: coursesTable.slug,
      status: coursesTable.status,
      description: coursesTable.description, 
      category: coursesTable.category, 
      duration: coursesTable.duration, 
      totalDurationHours: coursesTable.totalDurationHours,
      fee: coursesTable.fee, 
      thumbnail: coursesTable.thumbnail, 
      teacherId: coursesTable.teacherId, 
      isFeatured: coursesTable.isFeatured, 
      isFree: coursesTable.isFree, 
      createdAt: coursesTable.createdAt, 
      syllabus: coursesTable.syllabus, 
      teacherName: usersTable.name,
      rejectionNote: coursesTable.rejectionNote
    })
    .from(coursesTable)
    .leftJoin(usersTable, eq(coursesTable.teacherId, usersTable.id))
    .where(query);

  if (!course) { res.status(404).json({ error: "Course not found" }); return; }

  const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, course.id)).orderBy(lessonsTable.orderIndex);
  const enrollCount = await db.select({ c: count() }).from(enrollmentsTable).where(eq(enrollmentsTable.courseId, course.id));
  res.json({ ...course, enrollmentCount: Number(enrollCount[0]?.c ?? 0), lessonCount: lessons.length, lessons });
});

router.put("/courses/:id", authenticate, authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  
  const parsed = UpdateCourseBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [existingCourse] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
  if (!existingCourse) { res.status(404).json({ error: "Not found" }); return; }

  if (req.user.role === "teacher" && existingCourse.teacherId !== req.user.id) {
    res.status(403).json({ error: "You do not have permission to modify this course" });
    return;
  }

  const [course] = await db.update(coursesTable).set(parsed.data).where(eq(coursesTable.id, id)).returning();
  res.json({ ...course, enrollmentCount: 0, lessonCount: 0, teacherName: null });
});

router.delete("/courses/:id", authenticate, authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existingCourse] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
  if (!existingCourse) { res.status(404).json({ error: "Not found" }); return; }

  if (req.user.role === "teacher" && existingCourse.teacherId !== req.user.id) {
    res.status(403).json({ error: "You do not have permission to delete this course" });
    return;
  }

  await db.delete(coursesTable).where(eq(coursesTable.id, id));
  res.sendStatus(204);
});

export default router;
