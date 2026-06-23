import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5ueXkUdMx1Aj@ep-morning-mud-an6hqm9i.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function main() {
  await client.connect();
  console.log("CONNECTED TO DATABASE.");

  // 1. List some students
  const studentsRes = await client.query(`
    SELECT id, name, email, role, "isActive" FROM users WHERE role = 'student' LIMIT 10;
  `);
  console.log("\n--- STUDENTS ---");
  console.table(studentsRes.rows);

  if (studentsRes.rows.length === 0) {
    console.log("No students found.");
    await client.end();
    return;
  }

  // Let's inspect the first student (or find one named "SAEED" since the print details was for Saeed)
  const saeed = studentsRes.rows.find(s => s.name.toUpperCase().includes("SAEED")) || studentsRes.rows[0];
  console.log(`\nDiagnosing student: ID=${saeed.id}, Name=${saeed.name}`);

  // 2. Fetch enrollments for this student
  const enrollmentsRes = await client.query(`
    SELECT * FROM enrollments WHERE "userId" = $1;
  `, [saeed.id]);
  console.log("\n--- ENROLLMENTS FOR THIS STUDENT ---");
  console.table(enrollmentsRes.rows);

  const courseIds = enrollmentsRes.rows.map(e => e.courseId);
  console.log("Enrolled Course IDs:", courseIds);

  if (courseIds.length > 0) {
    // 3. Fetch courses
    const coursesRes = await client.query(`
      SELECT id, title, "teacherId" FROM courses WHERE id = ANY($1);
    `, [courseIds]);
    console.log("\n--- ENROLLED COURSES ---");
    console.table(coursesRes.rows);

    const teacherIds = coursesRes.rows.map(c => c.teacherId).filter(Boolean);
    console.log("Teacher IDs associated with courses:", teacherIds);

    if (teacherIds.length > 0) {
      // 4. Fetch teachers
      const teachersRes = await client.query(`
        SELECT id, name, email, role, "isActive" FROM users WHERE id = ANY($1);
      `, [teacherIds]);
      console.log("\n--- TEACHERS FOUND IN USERS TABLE ---");
      console.table(teachersRes.rows);
    } else {
      console.log("No teacher IDs found on these courses.");
    }
  }

  // 5. Fetch admins (contacts endpoint also fetches active support admins)
  const adminsRes = await client.query(`
    SELECT id, name, role, "isActive" FROM users WHERE role = 'admin';
  `);
  console.log("\n--- ADMINS ---");
  console.table(adminsRes.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
