import { Router, type IRouter } from "express";
import { db, coursesTable, usersTable, enrollmentsTable, lessonsTable, lessonCompletionsTable, sectionsTable, attendanceTable } from "@workspace/db";
import { eq, sql, count, desc, or, and, ilike, isNotNull, inArray } from "drizzle-orm";
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

const makeSlug = (title: string) => {
  const slug = title.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
  return slug || `course-${Date.now()}`;
};

const makeUniqueSlug = async (title: string) => {
  const baseSlug = makeSlug(title);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const [existing] = await db.select({ id: coursesTable.id }).from(coursesTable).where(eq(coursesTable.slug, slug)).limit(1);
    if (!existing) return slug;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

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

  // Set cache headers for better performance
  res.set('Cache-Control', 'public, max-age=60'); // Cache for 60 seconds

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

  // Optimize: Fetch all counts in parallel instead of N+1 queries
  const courseIds = courses.map(c => c.id);
  
  if (courseIds.length === 0) {
    res.json([]);
    return;
  }

  const [enrollCounts, lessonCounts] = await Promise.all([
    db.select({ 
      courseId: enrollmentsTable.courseId, 
      count: count() 
    })
      .from(enrollmentsTable)
      .where(inArray(enrollmentsTable.courseId, courseIds))
      .groupBy(enrollmentsTable.courseId),
    
    db.select({ 
      courseId: lessonsTable.courseId, 
      count: count() 
    })
      .from(lessonsTable)
      .where(inArray(lessonsTable.courseId, courseIds))
      .groupBy(lessonsTable.courseId)
  ]);

  // Create lookup maps for O(1) access
  const enrollMap = new Map(enrollCounts.map(e => [e.courseId, Number(e.count)]));
  const lessonMap = new Map(lessonCounts.map(l => [l.courseId, Number(l.count)]));

  const enriched = courses.map(course => ({
    ...course,
    enrollmentCount: enrollMap.get(course.id) ?? 0,
    lessonCount: lessonMap.get(course.id) ?? 0,
  }));

  res.json(enriched);
});

router.post("/courses", authenticate, authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  // Sanitize the request body to prevent strict Zod validation from failing on database null outputs
  const bodyCopy = { ...req.body };
  if (bodyCopy.teacherId === null || bodyCopy.teacherId === 0 || bodyCopy.teacherId === "0" || bodyCopy.teacherId === "") {
    delete bodyCopy.teacherId;
  }
  if (bodyCopy.thumbnail === null) {
    delete bodyCopy.thumbnail;
  }
  if (bodyCopy.syllabus === null) {
    delete bodyCopy.syllabus;
  }

  const parsed = CreateCourseBody.safeParse(bodyCopy);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const slug = await makeUniqueSlug(parsed.data.title);
  
  let insertData: any = {
    ...parsed.data,
    slug,
    status: req.user.role === "admin" ? "live" : "draft"
  };

  if (req.body.minAttendancePercentage !== undefined) {
    insertData.minAttendancePercentage = Number(req.body.minAttendancePercentage);
  }

  if (req.user.role === "teacher") {
    insertData.teacherId = req.user.id;
  } else if (req.body.teacherId === null || req.body.teacherId === 0 || req.body.teacherId === "0" || req.body.teacherId === "") {
    insertData.teacherId = null;
  }

  try {
    const [course] = await db.insert(coursesTable).values(insertData).returning();
    res.status(201).json({ ...course, enrollmentCount: 0, lessonCount: 0, teacherName: req.user.role === "admin" ? null : req.user.name });
  } catch (err: any) {
    console.error("[CREATE COURSE ERROR]", err);
    res.status(500).json({ error: err?.message || "Failed to create course" });
  }
});

router.get("/courses/reviews", authenticate, authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  try {
    const isTeacher = req.user.role === "teacher";
    const teacherId = req.user.id;

    let conditions = [isNotNull(lessonCompletionsTable.feedbackRating)];
    if (isTeacher) {
      conditions.push(eq(coursesTable.teacherId, teacherId));
    }

    const reviews = await db
      .select({
        reviewId: lessonCompletionsTable.id,
        rating: lessonCompletionsTable.feedbackRating,
        comment: lessonCompletionsTable.feedbackComment,
        completedAt: lessonCompletionsTable.completedAt,
        studentName: usersTable.name,
        lessonTitle: lessonsTable.title,
        courseTitle: coursesTable.title,
        courseId: coursesTable.id,
        teacherId: coursesTable.teacherId,
      })
      .from(lessonCompletionsTable)
      .innerJoin(lessonsTable, eq(lessonCompletionsTable.lessonId, lessonsTable.id))
      .innerJoin(coursesTable, eq(lessonsTable.courseId, coursesTable.id))
      .innerJoin(usersTable, eq(lessonCompletionsTable.userId, usersTable.id))
      .where(and(...conditions))
      .orderBy(desc(lessonCompletionsTable.completedAt));

    // Fetch all teachers in the system
    let allTeachersList: { id: number; name: string }[] = [];
    if (isTeacher) {
      allTeachersList = [{ id: teacherId, name: req.user.name }];
    } else {
      allTeachersList = await db
        .select({ id: usersTable.id, name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.role, "teacher"));
    }

    const teacherMap = new Map<number, string>();
    for (const t of allTeachersList) {
      teacherMap.set(t.id, t.name);
    }

    // Enrich with teacherName using O(1) memory lookup map
    const enriched = reviews.map((review) => {
      const teacherName = review.teacherId ? (teacherMap.get(review.teacherId) || "Unassigned") : "Unassigned";
      return {
        ...review,
        teacherName,
      };
    });

    // Fetch all courses in the system (or assigned to this teacher)
    let coursesQuery = db.select({ id: coursesTable.id, title: coursesTable.title }).from(coursesTable);
    if (isTeacher) {
      coursesQuery = coursesQuery.where(eq(coursesTable.teacherId, teacherId)) as any;
    }
    const allCoursesList = await coursesQuery;

    // Fetch all students enrolled in any course (or this teacher's courses)
    let studentsQuery;
    if (isTeacher) {
      studentsQuery = db
        .select({ id: usersTable.id, name: usersTable.name })
        .from(usersTable)
        .innerJoin(enrollmentsTable, eq(usersTable.id, enrollmentsTable.userId))
        .innerJoin(coursesTable, eq(enrollmentsTable.courseId, coursesTable.id))
        .where(and(eq(usersTable.role, "student"), eq(coursesTable.teacherId, teacherId)));
    } else {
      studentsQuery = db
        .select({ id: usersTable.id, name: usersTable.name })
        .from(usersTable)
        .innerJoin(enrollmentsTable, eq(usersTable.id, enrollmentsTable.userId))
        .where(eq(usersTable.role, "student"));
    }

    const rawStudents = await studentsQuery;
    const studentMap = new Map();
    for (const s of rawStudents) {
      studentMap.set(s.id, s.name);
    }
    const allStudentsList = Array.from(studentMap.entries()).map(([id, name]) => ({ id, name }));

    res.json({
      reviews: enriched,
      courses: allCoursesList,
      teachers: allTeachersList,
      students: allStudentsList
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch reviews" });
  }
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
      outlinePdfUrl: coursesTable.outlinePdfUrl,
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
  
  const [existingCourse] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
  if (!existingCourse) { res.status(404).json({ error: "Not found" }); return; }

  if (req.user.role === "teacher" && existingCourse.teacherId !== req.user.id) {
    res.status(403).json({ error: "You do not have permission to modify this course" });
    return;
  }

  // Sanitize the request body and merge existing fields to enable robust partial updates
  const bodyCopy = {
    title: existingCourse.title,
    description: existingCourse.description,
    category: existingCourse.category,
    duration: existingCourse.duration,
    fee: existingCourse.fee,
    thumbnail: existingCourse.thumbnail,
    syllabus: existingCourse.syllabus,
    outlinePdfUrl: existingCourse.outlinePdfUrl,
    teacherId: existingCourse.teacherId,
    isFeatured: existingCourse.isFeatured,
    isFree: existingCourse.isFree,
    ...req.body
  };

  if (bodyCopy.teacherId === null || bodyCopy.teacherId === 0 || bodyCopy.teacherId === "0" || bodyCopy.teacherId === "") {
    delete bodyCopy.teacherId;
  }
  if (bodyCopy.thumbnail === null) {
    delete bodyCopy.thumbnail;
  }
  if (bodyCopy.syllabus === null) {
    delete bodyCopy.syllabus;
  }

  const parsed = UpdateCourseBody.safeParse(bodyCopy);
  if (!parsed.success) { 
    console.error("[DEBUG UPDATE COURSE ERROR]", JSON.stringify(parsed.error.format(), null, 2));
    res.status(400).json({ error: parsed.error.message }); 
    return; 
  }

  const updateData: any = { ...parsed.data };
  if (req.body.status) {
    if (req.user.role === "admin") {
      updateData.status = req.body.status;
      console.log(`[DEBUG] Admin updating course ${id} status to: ${req.body.status}`);
    } else {
      if (req.body.status === "draft" || req.body.status === "pending") {
        updateData.status = req.body.status;
        console.log(`[DEBUG] Teacher updating course ${id} status to: ${req.body.status}`);
      }
    }
  }
  if (req.body.rejectionNote !== undefined) {
    updateData.rejectionNote = req.body.rejectionNote;
    console.log(`[DEBUG] Setting rejection note for course ${id}: ${req.body.rejectionNote}`);
  }

  // Explicitly apply null overrides for fields cleared or unassigned by admin/teacher
  if (req.body.teacherId === null || req.body.teacherId === 0 || req.body.teacherId === "0" || req.body.teacherId === "") {
    updateData.teacherId = null;
  }
  if (req.body.thumbnail === null || req.body.thumbnail === "") {
    updateData.thumbnail = null;
  }
  if (req.body.syllabus === null || req.body.syllabus === "") {
    updateData.syllabus = null;
  }
  if (req.body.outlinePdfUrl !== undefined) {
    updateData.outlinePdfUrl = req.body.outlinePdfUrl || null;
  }

  if (req.body.minAttendancePercentage !== undefined) {
    updateData.minAttendancePercentage = Number(req.body.minAttendancePercentage);
  }

  const [course] = await db.update(coursesTable).set(updateData).where(eq(coursesTable.id, id)).returning();
  console.log(`[DEBUG] Course ${id} updated successfully. New status: ${course.status}`);
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

  await db.delete(attendanceTable).where(eq(attendanceTable.courseId, id));
  await db.delete(sectionsTable).where(eq(sectionsTable.courseId, id));
  await db.delete(coursesTable).where(eq(coursesTable.id, id));
  res.sendStatus(204);
});

export default router;
