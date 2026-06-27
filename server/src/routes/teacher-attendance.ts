import { Router, type IRouter } from "express";
import { db, teacherAttendanceTable, usersTable } from "@workspace/db";
import { eq, and, desc, sql, gte, lte, inArray } from "drizzle-orm";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

const router: IRouter = Router();

const parseRouteNumber = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? parseInt(raw, 10) : NaN;
};

// Get teacher's own attendance records
router.get("/teacher-attendance/my", authenticate, authorize("teacher"), async (req: AuthRequest, res): Promise<void> => {
  const teacherId = req.user?.id;
  if (!teacherId) { 
    res.status(401).json({ error: "Unauthorized" }); 
    return; 
  }

  const { startDate, endDate, month, year } = req.query;
  
  let conditions = [eq(teacherAttendanceTable.teacherId, teacherId)];
  
  if (startDate && typeof startDate === "string") {
    conditions.push(gte(teacherAttendanceTable.date, startDate));
  }
  if (endDate && typeof endDate === "string") {
    conditions.push(lte(teacherAttendanceTable.date, endDate));
  }

  // If month and year provided, filter by that month
  if (month && year && typeof month === "string" && typeof year === "string") {
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const startOfMonth = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const endOfMonth = new Date(yearNum, monthNum, 0).getDate();
    const endOfMonthStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(endOfMonth).padStart(2, '0')}`;
    conditions.push(gte(teacherAttendanceTable.date, startOfMonth));
    conditions.push(lte(teacherAttendanceTable.date, endOfMonthStr));
  }

  const records = await db
    .select({
      id: teacherAttendanceTable.id,
      date: teacherAttendanceTable.date,
      status: teacherAttendanceTable.status,
      checkInTime: teacherAttendanceTable.checkInTime,
      checkOutTime: teacherAttendanceTable.checkOutTime,
      workingHours: teacherAttendanceTable.workingHours,
      notes: teacherAttendanceTable.notes,
      leaveType: teacherAttendanceTable.leaveType,
      isApproved: teacherAttendanceTable.isApproved,
      recordedByName: usersTable.name,
    })
    .from(teacherAttendanceTable)
    .leftJoin(usersTable, eq(teacherAttendanceTable.recordedById, usersTable.id))
    .where(and(...conditions))
    .orderBy(desc(teacherAttendanceTable.date));

  // Calculate summary statistics
  const summary = {
    totalDays: records.length,
    present: records.filter(r => r.status === "present").length,
    absent: records.filter(r => r.status === "absent").length,
    late: records.filter(r => r.status === "late").length,
    halfDay: records.filter(r => r.status === "half_day").length,
    leave: records.filter(r => r.status === "leave").length,
    percentage: records.length > 0 
      ? Math.round(((records.filter(r => r.status === "present" || r.status === "late").length) / records.length) * 100) 
      : 0
  };

  res.json({ records, summary });
});

// Mark teacher's own attendance (self check-in)
router.post("/teacher-attendance/check-in", authenticate, authorize("teacher"), async (req: AuthRequest, res): Promise<void> => {
  const teacherId = req.user?.id;
  if (!teacherId) { 
    res.status(401).json({ error: "Unauthorized" }); 
    return; 
  }

  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  // Check if already checked in today
  const existing = await db
    .select()
    .from(teacherAttendanceTable)
    .where(and(
      eq(teacherAttendanceTable.teacherId, teacherId),
      eq(teacherAttendanceTable.date, today)
    ));

  if (existing.length > 0) {
    res.status(400).json({ error: "Already checked in today" });
    return;
  }

  // Determine status based on time (example: late if after 9:00 AM)
  const [hours] = currentTime.split(':').map(Number);
  const status = hours >= 9 ? "late" : "present";

  await db.insert(teacherAttendanceTable).values({
    teacherId,
    date: today,
    status,
    checkInTime: currentTime,
    recordedById: null, // Self-marked
    notes: "Self check-in"
  });

  res.json({ 
    success: true, 
    message: "Checked in successfully",
    status,
    time: currentTime
  });
});

// Mark teacher's check-out
router.post("/teacher-attendance/check-out", authenticate, authorize("teacher"), async (req: AuthRequest, res): Promise<void> => {
  const teacherId = req.user?.id;
  if (!teacherId) { 
    res.status(401).json({ error: "Unauthorized" }); 
    return; 
  }

  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  // Find today's record
  const [existing] = await db
    .select()
    .from(teacherAttendanceTable)
    .where(and(
      eq(teacherAttendanceTable.teacherId, teacherId),
      eq(teacherAttendanceTable.date, today)
    ));

  if (!existing) {
    res.status(400).json({ error: "No check-in record found for today" });
    return;
  }

  if (existing.checkOutTime) {
    res.status(400).json({ error: "Already checked out today" });
    return;
  }

  // Calculate working hours
  let workingHours = "0:00";
  if (existing.checkInTime) {
    const [inHours, inMinutes] = existing.checkInTime.split(':').map(Number);
    const [outHours, outMinutes] = currentTime.split(':').map(Number);
    const totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    workingHours = `${hours}:${String(minutes).padStart(2, '0')}`;
  }

  await db
    .update(teacherAttendanceTable)
    .set({ 
      checkOutTime: currentTime,
      workingHours,
      updatedAt: new Date()
    })
    .where(eq(teacherAttendanceTable.id, existing.id));

  res.json({ 
    success: true, 
    message: "Checked out successfully",
    checkInTime: existing.checkInTime,
    checkOutTime: currentTime,
    workingHours
  });
});

// Admin: Get all teachers' attendance (with filters)
router.get("/teacher-attendance/all", authenticate, authorize("admin"), async (req: AuthRequest, res): Promise<void> => {
  const { teacherId, startDate, endDate, status, month, year } = req.query;
  
  let conditions: any[] = [];
  
  if (teacherId && !isNaN(Number(teacherId))) {
    conditions.push(eq(teacherAttendanceTable.teacherId, Number(teacherId)));
  }
  
  if (startDate && typeof startDate === "string") {
    conditions.push(gte(teacherAttendanceTable.date, startDate));
  }
  if (endDate && typeof endDate === "string") {
    conditions.push(lte(teacherAttendanceTable.date, endDate));
  }

  if (status && typeof status === "string") {
    conditions.push(eq(teacherAttendanceTable.status, status));
  }

  // If month and year provided, filter by that month
  if (month && year && typeof month === "string" && typeof year === "string") {
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const startOfMonth = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const endOfMonth = new Date(yearNum, monthNum, 0).getDate();
    const endOfMonthStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(endOfMonth).padStart(2, '0')}`;
    conditions.push(gte(teacherAttendanceTable.date, startOfMonth));
    conditions.push(lte(teacherAttendanceTable.date, endOfMonthStr));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const records = await db
    .select({
      id: teacherAttendanceTable.id,
      teacherId: teacherAttendanceTable.teacherId,
      teacherName: usersTable.name,
      teacherEmail: usersTable.email,
      date: teacherAttendanceTable.date,
      status: teacherAttendanceTable.status,
      checkInTime: teacherAttendanceTable.checkInTime,
      checkOutTime: teacherAttendanceTable.checkOutTime,
      workingHours: teacherAttendanceTable.workingHours,
      notes: teacherAttendanceTable.notes,
      leaveType: teacherAttendanceTable.leaveType,
      isApproved: teacherAttendanceTable.isApproved,
    })
    .from(teacherAttendanceTable)
    .leftJoin(usersTable, eq(teacherAttendanceTable.teacherId, usersTable.id))
    .where(whereClause)
    .orderBy(desc(teacherAttendanceTable.date));

  res.json(records);
});

// Admin: Mark attendance for a teacher
router.post("/teacher-attendance/mark", authenticate, authorize("admin"), async (req: AuthRequest, res): Promise<void> => {
  const { teacherId, date, status, checkInTime, checkOutTime, notes, leaveType } = req.body;

  if (!teacherId || !date || !status) {
    res.status(400).json({ error: "teacherId, date, and status are required" });
    return;
  }

  try {
    // Check if record already exists
    const existing = await db
      .select()
      .from(teacherAttendanceTable)
      .where(and(
        eq(teacherAttendanceTable.teacherId, teacherId),
        eq(teacherAttendanceTable.date, date)
      ));

    let workingHours = null;
    if (checkInTime && checkOutTime) {
      const [inHours, inMinutes] = checkInTime.split(':').map(Number);
      const [outHours, outMinutes] = checkOutTime.split(':').map(Number);
      const totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
      if (totalMinutes > 0) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        workingHours = `${hours}:${String(minutes).padStart(2, '0')}`;
      }
    }

    if (existing.length > 0) {
      // Update existing record
      await db
        .update(teacherAttendanceTable)
        .set({
          status,
          checkInTime: checkInTime || existing[0].checkInTime,
          checkOutTime: checkOutTime || existing[0].checkOutTime,
          workingHours: workingHours || existing[0].workingHours,
          notes: notes || existing[0].notes,
          leaveType: leaveType || existing[0].leaveType,
          recordedById: req.user?.id,
          updatedAt: new Date()
        })
        .where(eq(teacherAttendanceTable.id, existing[0].id));
    } else {
      // Insert new record
      await db.insert(teacherAttendanceTable).values({
        teacherId,
        date,
        status,
        checkInTime: checkInTime || null,
        checkOutTime: checkOutTime || null,
        workingHours,
        notes: notes || null,
        leaveType: leaveType || null,
        recordedById: req.user?.id,
        isApproved: true
      });
    }

    res.json({ success: true, message: "Attendance marked successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Bulk mark attendance for multiple teachers
router.post("/teacher-attendance/bulk", authenticate, authorize("admin"), async (req: AuthRequest, res): Promise<void> => {
  const { date, records } = req.body;
  
  if (!date || !Array.isArray(records)) {
    res.status(400).json({ error: "date and records array are required" });
    return;
  }

  try {
    // Delete existing records for this date
    const teacherIds = records.map(r => r.teacherId);
    if (teacherIds.length > 0) {
      await db
        .delete(teacherAttendanceTable)
        .where(and(
          eq(teacherAttendanceTable.date, date),
          inArray(teacherAttendanceTable.teacherId, teacherIds)
        ));
    }

    // Insert new records
    if (records.length > 0) {
      const toInsert = records.map((r: any) => ({
        teacherId: r.teacherId,
        date,
        status: r.status,
        checkInTime: r.checkInTime || null,
        checkOutTime: r.checkOutTime || null,
        workingHours: r.workingHours || null,
        notes: r.notes || null,
        leaveType: r.leaveType || null,
        recordedById: req.user?.id,
        isApproved: true
      }));

      await db.insert(teacherAttendanceTable).values(toInsert);
    }

    res.json({ success: true, message: "Bulk attendance saved successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Save an entire month of attendance for one teacher
router.post("/teacher-attendance/monthly-bulk", authenticate, authorize("admin"), async (req: AuthRequest, res): Promise<void> => {
  const { teacherId, month, year, records } = req.body;

  if (!teacherId || !month || !year || !Array.isArray(records)) {
    res.status(400).json({ error: "teacherId, month, year, and records array are required" });
    return;
  }

  try {
    const monthNum = Number(month);
    const yearNum = Number(year);
    const startOfMonth = `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
    const endOfMonthDay = new Date(yearNum, monthNum, 0).getDate();
    const endOfMonthStr = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(endOfMonthDay).padStart(2, "0")}`;

    // Remove all existing records for this teacher/month
    await db
      .delete(teacherAttendanceTable)
      .where(and(
        eq(teacherAttendanceTable.teacherId, Number(teacherId)),
        gte(teacherAttendanceTable.date, startOfMonth),
        lte(teacherAttendanceTable.date, endOfMonthStr)
      ));

    // Only insert working-day records (skip weekend/holiday)
    const workingRecords = records.filter((r: any) =>
      r.status && r.status !== "weekend" && r.status !== "holiday"
    );

    if (workingRecords.length > 0) {
      const toInsert = workingRecords.map((r: any) => {
        let workingHours: string | null = null;
        if (r.checkInTime && r.checkOutTime) {
          const [inH, inM] = r.checkInTime.split(":").map(Number);
          const [outH, outM] = r.checkOutTime.split(":").map(Number);
          const mins = (outH * 60 + outM) - (inH * 60 + inM);
          if (mins > 0) workingHours = `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`;
        }
        return {
          teacherId: Number(teacherId),
          date: r.date,
          status: r.status,
          checkInTime: r.checkInTime || null,
          checkOutTime: r.checkOutTime || null,
          workingHours,
          notes: r.notes || null,
          leaveType: r.leaveType || null,
          recordedById: req.user?.id,
          isApproved: true,
        };
      });
      await db.insert(teacherAttendanceTable).values(toInsert);
    }

    res.json({
      success: true,
      message: "Monthly attendance saved successfully",
      totalDays: records.length,
      savedRecords: workingRecords.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get list of all teachers for attendance marking
router.get("/teacher-attendance/teachers", authenticate, authorize("admin"), async (req: AuthRequest, res): Promise<void> => {
  const teachers = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      branchId: usersTable.branchId,
    })
    .from(usersTable)
    .where(eq(usersTable.role, "teacher"));

  res.json(teachers);
});

// Get monthly summary for a specific teacher
router.get("/teacher-attendance/summary/:teacherId", authenticate, authorize("admin", "teacher"), async (req: AuthRequest, res): Promise<void> => {
  const teacherId = parseRouteNumber(req.params.teacherId);
  if (isNaN(teacherId)) { 
    res.status(400).json({ error: "Invalid teacherId" }); 
    return; 
  }

  // Authorization check
  if (req.user?.role === "teacher" && req.user?.id !== teacherId) {
    res.status(403).json({ error: "Unauthorized access" });
    return;
  }

  const { month, year } = req.query;
  
  let conditions = [eq(teacherAttendanceTable.teacherId, teacherId)];
  
  if (month && year && typeof month === "string" && typeof year === "string") {
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    const startOfMonth = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const endOfMonth = new Date(yearNum, monthNum, 0).getDate();
    const endOfMonthStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(endOfMonth).padStart(2, '0')}`;
    conditions.push(gte(teacherAttendanceTable.date, startOfMonth));
    conditions.push(lte(teacherAttendanceTable.date, endOfMonthStr));
  }

  const records = await db
    .select()
    .from(teacherAttendanceTable)
    .where(and(...conditions));

  const summary = {
    totalDays: records.length,
    present: records.filter(r => r.status === "present").length,
    absent: records.filter(r => r.status === "absent").length,
    late: records.filter(r => r.status === "late").length,
    halfDay: records.filter(r => r.status === "half_day").length,
    leave: records.filter(r => r.status === "leave").length,
    percentage: records.length > 0 
      ? Math.round(((records.filter(r => r.status === "present" || r.status === "late").length) / records.length) * 100) 
      : 0
  };

  res.json(summary);
});

export default router;
