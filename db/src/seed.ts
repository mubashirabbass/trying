import { db, usersTable, coursesTable, branchesTable } from "./index";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  // 1. Admin
  const [admin] = await db.insert(usersTable).values({
    name: "Admin User",
    email: "admin@globalcollege.com",
    passwordHash,
    role: "admin",
    isActive: true,
  }).onConflictDoUpdate({
    target: [usersTable.email],
    set: { name: "Admin User", role: "admin", passwordHash, isActive: true }
  }).returning();

  // 2. Teacher
  const [teacher] = await db.insert(usersTable).values({
    name: "John Teacher",
    email: "teacher@globalcollege.com",
    passwordHash,
    role: "teacher",
    isActive: true,
  }).onConflictDoUpdate({
    target: [usersTable.email],
    set: { name: "John Teacher", role: "teacher", passwordHash, isActive: true }
  }).returning();

  // 3. Student
  await db.insert(usersTable).values({
    name: "Jane Student",
    email: "student@globalcollege.com",
    passwordHash,
    role: "student",
    isActive: true,
  }).onConflictDoNothing();

  // 4. Courses
  const courses = [
    {
      title: "Full Stack Web Development",
      slug: "full-stack-web-development",
      description: "Master the MERN stack (MongoDB, Express, React, Node.js) and build industry-level web applications.",
      category: "Web",
      duration: "6 Months",
      fee: 25000,
      isFeatured: true,
      teacherId: teacher.id,
    },
    {
      title: "Advanced UI/UX Design Masterclass",
      slug: "ui-ux-design-masterclass",
      description: "Learn professional design thinking, wireframing in Figma, and creating high-fidelity prototypes.",
      category: "Graphics",
      duration: "4 Months",
      fee: 15000,
      isFeatured: true,
      teacherId: teacher.id,
    },
    {
      title: "E-commerce Business (EBC) Mastery",
      slug: "ebc-mastery",
      description: "Launch your international selling career on eBay and Etsy. Learn product sourcing and store optimization.",
      category: "Freelancing",
      duration: "3 Months",
      fee: 12000,
      isFeatured: true,
      teacherId: teacher.id,
    },
    {
      title: "Artificial Intelligence & Python",
      slug: "ai-python-course",
      description: "From basic Python to advanced AI models. Start your journey into the world of Machine Learning.",
      category: "AI",
      duration: "6 Months",
      fee: 35000,
      isFeatured: false,
      teacherId: teacher.id,
    },
    {
      title: "Digital Marketing Strategy",
      slug: "digital-marketing-strategy",
      description: "Master SEO, Social Media Marketing, and Google Ads to scale businesses in the digital era.",
      category: "IT",
      duration: "3 Months",
      fee: 10000,
      isFeatured: false,
      teacherId: teacher.id,
    },
    {
      title: "MS Office Professional Suite",
      slug: "ms-office-professional",
      description: "Complete mastery of Word, Excel, and PowerPoint for corporate and administrative roles.",
      category: "MS Office",
      duration: "2 Months",
      fee: 5000,
      isFeatured: false,
      teacherId: teacher.id,
    },
  ];

  console.log("🏫 Seeding branches...");
  const [mainBranch] = await db.insert(branchesTable).values({
    name: "Global College of Computer Science, 18 Hazari",
    city: "18 Hazari",
    address: "18 Hazari, Jhang District, Punjab, Pakistan.",
    phone: "+92 301 989 0076",
    email: "info@globalcollege.edu.pk",
    officeHours: "Monday - Saturday: 08:00 AM - 04:00 PM \nSunday: Closed",
    isMain: true,
    isActive: true,
    manualStudentCount: 2500,
  }).onConflictDoNothing().returning();

  console.log("✅ Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
