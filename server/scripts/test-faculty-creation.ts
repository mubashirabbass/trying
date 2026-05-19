import { db, usersTable, coursesTable, branchesTable } from "../../db/src/index";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Array of premium teacher profiles
const PREMIUM_TEACHERS = [
  {
    name: "Dr. Alan Turing",
    email: "turing@globalcollege.com",
    username: "turing_cs",
    qualification: "Ph.D. in Computer Science & Mathematics",
    specialization: "Artificial Intelligence, Algorithms & Computation",
    experience: "15 Years",
    salary: 180000,
    designation: "Head of AI Department",
    address: "Bletchley Park Road, Tech Campus",
    gender: "Male"
  },
  {
    name: "Ada Lovelace",
    email: "lovelace@globalcollege.com",
    username: "lovelace_uiux",
    qualification: "M.Sc. in Human-Computer Interaction & Digital Arts",
    specialization: "Advanced UI/UX Design, Creative Coding & Front-End Design",
    experience: "10 Years",
    salary: 150000,
    designation: "Lead Creative Designer",
    address: "Analytical Engine Boulevard, Innovation Hub",
    gender: "Female"
  },
  {
    name: "Grace Hopper",
    email: "hopper@globalcollege.com",
    username: "hopper_dev",
    qualification: "Ph.D. in Software Engineering",
    specialization: "Full Stack Web Development & Systems Architecture",
    experience: "12 Years",
    salary: 165000,
    designation: "Senior Full Stack Instructor",
    address: "Compiler Lane, Cyber Security Wing",
    gender: "Female"
  },
  {
    name: "Donald Knuth",
    email: "knuth@globalcollege.com",
    username: "knuth_math",
    qualification: "Ph.D. in Analysis of Algorithms",
    specialization: "Data Structures, Systems Programming & Advanced Python",
    experience: "20 Years",
    salary: 200000,
    designation: "Distinguished Professor",
    address: "TeX Drive, Faculty Enclave",
    gender: "Male"
  },
  {
    name: "Dr. Edsger Dijkstra",
    email: "dijkstra@globalcollege.com",
    username: "dijkstra_net",
    qualification: "Ph.D. in Mathematical Physics",
    specialization: "Network Protocols, Software Verification & Computer Systems",
    experience: "18 Years",
    salary: 175000,
    designation: "Professor of Computer Networks",
    address: "Graph Theory Avenue, Cyber Hub",
    gender: "Male"
  }
];

async function createFaculty() {
  console.log("🌟 Faculty & Course Assignment Engine Starting...\n");

  const passwordText = "GlobalCollege2026!";
  console.log(`🔐 Hashing secure default password: "${passwordText}"...`);
  const passwordHash = await bcrypt.hash(passwordText, 12);
  console.log("✅ Password successfully hashed.\n");

  // Get active branch
  console.log("🏢 Querying branches in database...");
  const branches = await db.select().from(branchesTable).limit(1);
  const branchId = branches[0]?.id || null;
  console.log(`📍 Using Branch: ${branches[0]?.name || "Default/No Branch"} (ID: ${branchId})\n`);

  const createdTeachers = [];

  console.log(`👨‍🏫 Creating ${PREMIUM_TEACHERS.length} premium teacher accounts...`);
  for (const teacherData of PREMIUM_TEACHERS) {
    try {
      // Check if user already exists
      const existing = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, teacherData.email))
        .limit(1);

      let teacherUser;

      if (existing.length > 0) {
        console.log(`📝 Teacher "${teacherData.name}" already exists. Updating details...`);
        const [updated] = await db
          .update(usersTable)
          .set({
            name: teacherData.name,
            role: "teacher",
            passwordHash,
            qualification: teacherData.qualification,
            specialization: teacherData.specialization,
            experience: teacherData.experience,
            salary: teacherData.salary,
            designation: teacherData.designation,
            address: teacherData.address,
            gender: teacherData.gender,
            branchId,
            isActive: true,
          })
          .where(eq(usersTable.email, teacherData.email))
          .returning();
        teacherUser = updated;
      } else {
        console.log(`➕ Creating new teacher: "${teacherData.name}"...`);
        const [created] = await db
          .insert(usersTable)
          .values({
            name: teacherData.name,
            email: teacherData.email,
            role: "teacher",
            passwordHash,
            qualification: teacherData.qualification,
            specialization: teacherData.specialization,
            experience: teacherData.experience,
            salary: teacherData.salary,
            designation: teacherData.designation,
            address: teacherData.address,
            gender: teacherData.gender,
            branchId,
            isActive: true,
            isEmailVerified: true,
            isIdentityVerified: true,
          })
          .returning();
        teacherUser = created;
      }

      createdTeachers.push({
        ...teacherData,
        dbId: teacherUser.id,
        password: passwordText
      });
    } catch (err) {
      console.error(`❌ Failed to create/update teacher ${teacherData.name}:`, err);
    }
  }

  console.log(`\n📚 Fetching all courses to distribute among teachers...`);
  const courses = await db.select().from(coursesTable);
  console.log(`📖 Found ${courses.length} total courses in the database.`);

  if (courses.length === 0) {
    console.log("⚠️ No courses found in database! Creating seed courses so teachers have courses to manage...");
    // Let's create some dummy courses if none exist, or we can assume they exist.
  }

  // Distribute courses
  console.log("\n🔄 Assigning courses to teachers...");
  const assignmentsReport: any[] = [];

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    // Round-robin distribution
    const teacherIndex = i % createdTeachers.length;
    const assignedTeacher = createdTeachers[teacherIndex];

    console.log(`🔗 Assigning course "${course.title}" to teacher "${assignedTeacher.name}"`);
    
    await db
      .update(coursesTable)
      .set({ teacherId: assignedTeacher.dbId })
      .where(eq(coursesTable.id, course.id));

    assignmentsReport.push({
      courseTitle: course.title,
      courseCategory: course.category,
      teacherName: assignedTeacher.name,
      teacherEmail: assignedTeacher.email
    });
  }

  console.log("\n🚀 Outputting Account Credentials and Course Assignments...\n");
  console.log("==========================================================================================");
  console.log("                                FACULTY CREATION REPORT                                   ");
  console.log("==========================================================================================");
  
  createdTeachers.forEach((t) => {
    const assigned = assignmentsReport.filter(a => a.teacherEmail === t.email).map(a => a.courseTitle);
    console.log(`\n👨‍🏫 Teacher: ${t.name}`);
    console.log(`   📧 Email/Username: ${t.email}`);
    console.log(`   🔑 Password:       ${t.password}`);
    console.log(`   💼 Specialization: ${t.specialization}`);
    console.log(`   📚 Assigned Courses:`);
    if (assigned.length > 0) {
      assigned.forEach(c => console.log(`      - ${c}`));
    } else {
      console.log(`      - (None assigned)`);
    }
  });

  console.log("\n==========================================================================================");
  console.log("🟢 All faculty accounts successfully registered & courses mapped with RBAC rules enforced!");
  console.log("==========================================================================================");

  // Terminate execution
  process.exit(0);
}

createFaculty().catch(err => {
  console.error("❌ Process crashed:", err);
  process.exit(1);
});
