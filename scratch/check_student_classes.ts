import { db, liveClassesTable, enrollmentsTable, usersTable, coursesTable } from "../db/src";
import { eq } from "drizzle-orm";

async function main() {
  console.log("=== DB QUERY START ===");
  // 1. Get all students
  const students = await db.select().from(usersTable).where(eq(usersTable.role, "student"));
  console.log("Students:", students.map(s => ({ id: s.id, name: s.name, email: s.email })));

  // 2. Get enrollments
  const enrollments = await db.select().from(enrollmentsTable);
  console.log("Enrollments:", enrollments.map(e => ({ id: e.id, userId: e.userId, courseId: e.courseId, status: e.status })));

  // 3. Get live classes
  const liveClasses = await db.select().from(liveClassesTable);
  console.log("Live Classes:", liveClasses.map(c => ({ id: c.id, title: c.title, targetType: c.targetType, courseId: c.courseId, studentId: c.studentId, isCompleted: c.isCompleted })));
  
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
