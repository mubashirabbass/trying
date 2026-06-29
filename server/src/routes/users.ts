import * as zod from "zod";
import { Request, Response, Router, type IRouter } from "express";
import { db, usersTable, branchesTable, coursesTable, paymentsTable, identityVerificationsTable, lessonCompletionsTable, quizResultsTable, videoAccessLogsTable, notificationsTable, messagesTable, messageThreadsTable, forumPostsTable, forumRepliesTable, enrollmentsTable, certificatesTable, assignmentSubmissionsTable, attendanceTable } from "@workspace/db";
import { eq, and, ilike, or, desc } from "drizzle-orm";
import {
  ListUsersQueryParams,
  CreateUserBody,
  UpdateUserBody,
  ResetPasswordBody,
} from "@workspace/api-zod";
import { hashPassword, createToken, AppError } from "../lib/auth";
import { sendEmail, emailTemplates } from "../lib/email";
import { logger } from "../lib/logger";
import { catchAsync } from "../middleware/error";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { upload } from "../middleware/upload";
import { uploadToCloudinary } from "../lib/cloudinary";


const router: IRouter = Router();

/**
 * @route POST /api/v1/users/upload-avatar
 * @desc Upload an avatar image
 * @access Private
 */
router.post(
  "/users/upload-avatar",
  authenticate,
  upload.single("avatar"),
  catchAsync(async (req: any, res) => {
    if (!req.file) {
      throw new AppError("Avatar image is required", 400);
    }

    if (!req.file.mimetype.startsWith("image/")) {
      throw new AppError("Only image files are allowed", 400);
    }

    const result = await uploadToCloudinary(req.file.buffer, "avatars", "image");
    res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  })
);


/**
 * @route GET /api/v1/users/students/test
 * @desc Test endpoint to check if students exist
 */
router.get(
  "/users/students/test",
  authenticate,
  authorize("admin", "teacher"),
  catchAsync(async (req: AuthRequest, res: Response) => {
    // Get all active students
    const students = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        rollNo: usersTable.rollNo,
        regNo: usersTable.regNo,
        role: usersTable.role,
        isActive: usersTable.isActive,
      })
      .from(usersTable)
      .where(eq(usersTable.role, "student"))
      .limit(5);

    const activeStudents = students.filter(s => s.isActive);
    
    return res.json({
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      sampleStudents: students,
      message: students.length === 0 ? "No students found in database" : "Students found"
    });
  })
);

/**
 * @route GET /api/v1/users/students/search
 * @desc Search students for forms auto-fill
 */
router.get(
  "/users/students/search",
  authenticate,
  authorize("admin", "teacher"),
  catchAsync(async (req: AuthRequest, res: Response) => {
    console.log("=== SEARCH REQUEST ===");
    console.log("Query params:", req.query);
    console.log("User role:", req.user?.role);
    console.log("User ID:", req.user?.id);
    
    const { q } = req.query as any;
    
    if (!q || q.trim().length < 2) {
      console.log("Search query too short:", q);
      throw new AppError("Search query must be at least 2 characters", 400);
    }

    const searchTerm = q.trim();
    console.log("Search term:", searchTerm);

    // First, let's check if there are any students at all
    const totalStudents = await db
      .select({ count: usersTable.id })
      .from(usersTable)
      .where(and(
        eq(usersTable.role, "student"),
        eq(usersTable.isActive, true)
      ));
    
    console.log("Total active students in database:", totalStudents.length);

    const students = await db
      .select({
        id: usersTable.id,
        fullName: usersTable.name,
        rollNumber: usersTable.rollNo,
        registrationNumber: usersTable.regNo,
        fatherName: usersTable.fatherName,
      })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.role, "student"),
          eq(usersTable.isActive, true),
          or(
            ilike(usersTable.name, `%${searchTerm}%`),
            ilike(usersTable.rollNo, `%${searchTerm}%`),
            ilike(usersTable.regNo, `%${searchTerm}%`),
            ilike(usersTable.fatherName, `%${searchTerm}%`)
          )
        )
      )
      .limit(10)
      .orderBy(usersTable.name);

    console.log("Search results count:", students.length);
    console.log("Search results:", students);

    return res.json(students);
  })
);

/**
 * @route GET /api/v1/users/:id/details
 * @desc Get full student details for forms (enrollments, payments, etc.)
 */
router.get(
  "/users/:id/details",
  authenticate,
  authorize("admin", "teacher"),
  catchAsync(async (req: AuthRequest, res: Response) => {
    console.log("=== STUDENT DETAILS REQUEST ===");
    console.log("Student ID requested:", req.params.id);
    console.log("User making request:", req.user?.id, req.user?.role);
    
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      console.log("Invalid ID provided:", req.params.id);
      throw new AppError("Invalid user ID", 400);
    }

    console.log("Looking for student with ID:", id);

    try {
      const [user] = await db
        .select({
          id: usersTable.id,
          fullName: usersTable.name,
          fatherName: usersTable.fatherName,
          email: usersTable.email,
          phoneNumber: usersTable.phone,
          dateOfBirth: usersTable.dob,
          address: usersTable.address,
          rollNumber: usersTable.rollNo,
          registrationNumber: usersTable.regNo,
          profilePicture: usersTable.avatar,
          nameUrdu: usersTable.nameUrdu,
          gender: usersTable.gender,
          cnic: usersTable.cnic,
          session: usersTable.session,
          shift: usersTable.shift,
          department: usersTable.department,
        })
        .from(usersTable)
        .where(and(eq(usersTable.id, id), eq(usersTable.role, "student")));

      console.log("User found:", user ? "YES" : "NO");
      if (user) {
        console.log("User details:", { id: user.id, name: user.fullName, role: "student" });
      }

      if (!user) {
        console.log("Student not found for ID:", id);
        throw new AppError("Student not found", 404);
      }

      console.log("Fetching enrollments for student:", id);
      // Get enrollments - use raw approach to avoid complex joins
      let enrollments = [];
      try {
        const userEnrollments = await db
          .select({
            id: enrollmentsTable.id,
            courseId: enrollmentsTable.courseId,
            enrollmentDate: enrollmentsTable.enrolledAt,
          })
          .from(enrollmentsTable)
          .where(eq(enrollmentsTable.userId, id))
          .orderBy(desc(enrollmentsTable.enrolledAt));

        console.log("Raw enrollments found:", userEnrollments.length);
        
        // Get course details separately for each enrollment
        enrollments = await Promise.all(
          userEnrollments.map(async (enrollment) => {
            try {
              const [course] = await db
                .select({
                  title: coursesTable.title,
                  duration: coursesTable.duration,
                })
                .from(coursesTable)
                .where(eq(coursesTable.id, enrollment.courseId))
                .limit(1);
              
              return {
                id: enrollment.id,
                courseId: enrollment.courseId,
                enrollmentDate: enrollment.enrollmentDate,
                course: course ? {
                  title: course.title,
                  duration: course.duration,
                } : {
                  title: "Unknown Course",
                  duration: "N/A",
                },
              };
            } catch (courseError) {
              console.error("Error fetching course for enrollment:", enrollment.id, courseError);
              return {
                id: enrollment.id,
                courseId: enrollment.courseId,
                enrollmentDate: enrollment.enrollmentDate,
                course: {
                  title: "Unknown Course",
                  duration: "N/A",
                },
              };
            }
          })
        );
      } catch (enrollError: any) {
        console.error("Error fetching enrollments:", enrollError.message);
        enrollments = [];
      }

      console.log("Enrollments found:", enrollments.length);

      console.log("Fetching payments for student:", id);
      // Get payments - handle gracefully
      let payments = [];
      try {
        payments = await db
          .select({
            id: paymentsTable.id,
            amount: paymentsTable.amount,
            paymentDate: paymentsTable.createdAt,
            receiptUrl: paymentsTable.receiptUrl,
            method: paymentsTable.method,
            status: paymentsTable.status,
            notes: paymentsTable.notes,
          })
          .from(paymentsTable)
          .where(eq(paymentsTable.userId, id))
          .orderBy(desc(paymentsTable.createdAt));
      } catch (paymentError: any) {
        console.error("Error fetching payments:", paymentError.message);
        payments = [];
      }

      console.log("Payments found:", payments.length);

      // Ensure all fields have safe values (handle nulls)
      const safeUser = {
        id: user.id,
        fullName: user.fullName || "",
        fatherName: user.fatherName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        dateOfBirth: user.dateOfBirth || null,
        address: user.address || "",
        rollNumber: user.rollNumber || "",
        registrationNumber: user.registrationNumber || "",
        profilePicture: user.profilePicture || null,
        nameUrdu: user.nameUrdu || "",
        gender: user.gender || "",
        cnic: user.cnic || "",
        session: user.session || "",
        shift: user.shift || "",
        department: user.department || "",
      };

      const result = {
        ...safeUser,
        enrollments: enrollments || [],
        payments: payments || [],
      };

      console.log("Returning student details:", {
        id: result.id,
        name: result.fullName,
        enrollmentsCount: enrollments.length,
        paymentsCount: payments.length
      });

      return res.json(result);
      
    } catch (dbError: any) {
      console.error("❌ Database error:", dbError);
      console.error("❌ Error message:", dbError.message);
      console.error("❌ Error stack:", dbError.stack);
      
      // Return a proper error response
      throw new AppError(`Database error: ${dbError.message}`, 500);
    }
  })
);

/**
 * @route GET /api/v1/users
 * @desc List users with filters (Admin only)
 */
router.get(
  "/users",
  authenticate,
  authorize("admin", "teacher"),
  validate(zod.object({ query: ListUsersQueryParams })),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { role, branchId, search } = req.query as any;

    let conditions = [];
    if (role) conditions.push(eq(usersTable.role, role));
    if (branchId) conditions.push(eq(usersTable.branchId, Number(branchId)));
    if (search) {
      conditions.push(
        or(
          ilike(usersTable.name, `%${search}%`),
          ilike(usersTable.email, `%${search}%`),
          ilike(usersTable.phone, `%${search}%`)
        )
      );
    }

    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    const users = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        phone: usersTable.phone,
        cnic: usersTable.cnic,
        dob: usersTable.dob,
        avatar: usersTable.avatar,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
        branchId: usersTable.branchId,
        branchName: branchesTable.name,
        qualification: usersTable.qualification,
        specialization: usersTable.specialization,
        experience: usersTable.experience,
        salary: usersTable.salary,
        address: usersTable.address,
        designation: usersTable.designation,
        gender: usersTable.gender,
        joiningDate: usersTable.joiningDate,
        nameUrdu: usersTable.nameUrdu,
        fatherName: usersTable.fatherName,
        session: usersTable.session,
        semesterTerm: usersTable.semesterTerm,
        shift: usersTable.shift,
        rollNo: usersTable.rollNo,
        regNo: usersTable.regNo,
        department: usersTable.department,
      })
      .from(usersTable)
      .leftJoin(branchesTable, eq(usersTable.branchId, branchesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(usersTable.createdAt));

    return res.json(users);
  })
);

/**
 * @route POST /api/v1/users
 * @desc Create user (Admin only)
 */
router.post(
  "/users",
  authenticate,
  authorize("admin"),
  validate(zod.object({ body: CreateUserBody })),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const {
      name,
      email,
      password,
      role,
      phone,
      cnic,
      avatar,
      branchId,
      qualification,
      specialization,
      experience,
      salary,
      address,
      designation,
      gender,
      joiningDate
    } = req.body;

    // Check if email already exists
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (existing) {
      throw new AppError("Email already registered", 400);
    }

    const passwordHash = await hashPassword(password);

    // Roll no and reg no will be auto-generated when student is approved
    // They are not assigned during initial creation
    const [user] = await db
      .insert(usersTable)
      .values({
        name,
        email,
        passwordHash,
        role,
        phone: phone || null,
        cnic: cnic || null,
        avatar: avatar || null,
        branchId: branchId ? Number(branchId) : null,
        qualification: qualification || null,
        specialization: specialization || null,
        experience: experience || null,
        salary: salary ? Number(salary) : null,
        address: address || null,
        designation: designation || null,
        gender: gender || null,
        joiningDate: joiningDate ? new Date(joiningDate) : null,
        rollNo: null,  // Will be auto-generated on approval for students
        regNo: null,   // Will be auto-generated on approval for students
        isActive: role === "student" ? false : true, // Students need approval, others are active by default
        isEmailVerified: true,
      })
      .returning();

    const { passwordHash: _, ...safeUser } = user;
    return res.status(201).json(safeUser);
  })
);

/**
 * @route GET /api/v1/users/:id
 * @desc Get user details
 */
router.get(
  "/users/:id",
  authenticate,
  catchAsync(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) throw new AppError("Invalid user ID", 400);

    // Only admin or the user themselves can view details
    if (req.user.role !== "admin" && req.user.id !== id) {
      throw new AppError("Not authorized to view this profile", 403);
    }

    const [user] = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        phone: usersTable.phone,
        cnic: usersTable.cnic,
        dob: usersTable.dob,
        avatar: usersTable.avatar,
        isActive: usersTable.isActive,
        createdAt: usersTable.createdAt,
        branchId: usersTable.branchId,
        branchName: branchesTable.name,
        qualification: usersTable.qualification,
        specialization: usersTable.specialization,
        experience: usersTable.experience,
        salary: usersTable.salary,
        address: usersTable.address,
        designation: usersTable.designation,
        gender: usersTable.gender,
        joiningDate: usersTable.joiningDate,
        obtainedMarks: usersTable.obtainedMarks,
        totalMarks: usersTable.totalMarks,
        educationDocumentUrl: usersTable.educationDocumentUrl,
        isIdentityVerified: usersTable.isIdentityVerified,
        identityDocumentUrl: identityVerificationsTable.documentUrl,
        identityVerificationStatus: identityVerificationsTable.status,
        nameUrdu: usersTable.nameUrdu,
        fatherName: usersTable.fatherName,
        session: usersTable.session,
        semesterTerm: usersTable.semesterTerm,
        shift: usersTable.shift,
        rollNo: usersTable.rollNo,
        regNo: usersTable.regNo,
        department: usersTable.department,
      })
      .from(usersTable)
      .leftJoin(branchesTable, eq(usersTable.branchId, branchesTable.id))
      .leftJoin(identityVerificationsTable, eq(usersTable.id, identityVerificationsTable.userId))
      .where(eq(usersTable.id, id));

    if (!user) throw new AppError("User not found", 404);

    return res.json(user);
  })
);

/**
 * @route PUT /api/v1/users/:id
 * @desc Update user
 */
router.put(
  "/users/:id",
  authenticate,
  validate(zod.object({ body: UpdateUserBody })),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) throw new AppError("Invalid user ID", 400);

    // Only admin or the user themselves can update
    if (req.user.role !== "admin" && req.user.id !== id) {
      throw new AppError("Not authorized to update this profile", 403);
    }

    const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!existingUser) throw new AppError("User not found", 404);

    const updateData: any = { ...req.body };
    
    // Handle date conversions
    if (updateData.dob) {
      updateData.dob = new Date(updateData.dob);
    }
    if (updateData.joiningDate) {
      updateData.joiningDate = new Date(updateData.joiningDate);
    }
    
    // Handle numeric conversions
    if (updateData.salary) {
      updateData.salary = Number(updateData.salary);
    }
    if (updateData.branchId) {
      updateData.branchId = Number(updateData.branchId);
    }
    if (updateData.obtainedMarks !== undefined) {
      updateData.obtainedMarks = updateData.obtainedMarks !== null ? Number(updateData.obtainedMarks) : null;
    }
    if (updateData.totalMarks !== undefined) {
      updateData.totalMarks = updateData.totalMarks !== null ? Number(updateData.totalMarks) : null;
    }

    // Auto-generate roll no and registration no when student is being approved
    if (existingUser.role === "student" && 
        !existingUser.isActive && 
        updateData.isActive === true &&
        (!existingUser.rollNo || !existingUser.regNo)) {
      
      // Get count of approved students to generate sequential numbers
      const approvedStudents = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(and(
          eq(usersTable.role, "student"),
          eq(usersTable.isActive, true)
        ));
      
      const sequenceNumber = approvedStudents.length + 1;
      const paddedNumber = String(sequenceNumber).padStart(2, '0');
      const currentYear = new Date().getFullYear();
      
      updateData.rollNo = `GSC-${paddedNumber}`;
      updateData.regNo = `${currentYear}-GSC-${paddedNumber}`;
      
      logger.info(`Auto-generated numbers for student ${existingUser.email}: Roll No: ${updateData.rollNo}, Reg No: ${updateData.regNo}`);
    }

    const [updatedUser] = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, id))
      .returning();

    if (!updatedUser) throw new AppError("User not found", 404);

    // Send verification email if the user is being activated
    if (!existingUser.isActive && updatedUser.isActive) {
      const origin = req.headers.origin || "http://localhost:5173";
      const token = createToken(updatedUser.id, updatedUser.role);
      const verifyUrl = `${origin}/verify-email?token=${token}`;
      sendEmail({
        to: updatedUser.email,
        ...emailTemplates.verification(updatedUser.name, verifyUrl)
      }).catch(err => logger.error(`Failed to send approval/verification email:`, err));
    }

    const { passwordHash: _, ...safeUser } = updatedUser;
    return res.json(safeUser);
  })
);

/**
 * @route POST /api/v1/users/:id/reset-password
 * @desc Reset password (Admin only)
 */
router.post(
  "/users/:id/reset-password",
  authenticate,
  authorize("admin"),
  validate(zod.object({ body: ResetPasswordBody })),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) throw new AppError("Invalid user ID", 400);

    const passwordHash = await hashPassword(req.body.password);
    const [updated] = await db
      .update(usersTable)
      .set({ passwordHash })
      .where(eq(usersTable.id, id))
      .returning();

    if (!updated) throw new AppError("User not found", 404);

    return res.sendStatus(204);
  })
);

/**
 * @route DELETE /api/v1/users/:id
 * @desc Delete user (Admin only)
 */
router.delete(
  "/users/:id",
  authenticate,
  authorize("admin"),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) throw new AppError("Invalid user ID", 400);

    // 1. Soft-unlink: set nullable FK references to null
    await db.update(coursesTable).set({ teacherId: null }).where(eq(coursesTable.teacherId, id));
    await db.update(paymentsTable).set({ reviewedBy: null }).where(eq(paymentsTable.reviewedBy, id));
    await db.update(identityVerificationsTable).set({ reviewedBy: null }).where(eq(identityVerificationsTable.reviewedBy, id));
    await db.update(attendanceTable).set({ recordedById: null }).where(eq(attendanceTable.recordedById, id));

    // 2. Hard-delete child records (messages sub-tables first, then threads)
    await db.delete(messagesTable).where(eq(messagesTable.senderId, id));
    await db.delete(messageThreadsTable).where(or(eq(messageThreadsTable.studentId, id), eq(messageThreadsTable.teacherId, id)));

    // 3. Delete remaining user-linked records
    await db.delete(videoAccessLogsTable).where(eq(videoAccessLogsTable.userId, id));
    await db.delete(quizResultsTable).where(eq(quizResultsTable.userId, id));
    await db.delete(lessonCompletionsTable).where(eq(lessonCompletionsTable.userId, id));
    await db.delete(assignmentSubmissionsTable).where(eq(assignmentSubmissionsTable.userId, id));
    await db.delete(paymentsTable).where(eq(paymentsTable.userId, id));
    await db.delete(notificationsTable).where(eq(notificationsTable.userId, id));
    await db.delete(forumRepliesTable).where(eq(forumRepliesTable.userId, id));
    await db.delete(forumPostsTable).where(eq(forumPostsTable.userId, id));
    await db.delete(enrollmentsTable).where(eq(enrollmentsTable.userId, id));
    await db.delete(certificatesTable).where(eq(certificatesTable.userId, id));
    await db.delete(identityVerificationsTable).where(eq(identityVerificationsTable.userId, id));
    await db.delete(attendanceTable).where(eq(attendanceTable.userId, id));

    // 4. Finally delete the user
    const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
    if (!deleted) throw new AppError("User not found", 404);

    return res.sendStatus(204);
  })
);

export default router;
