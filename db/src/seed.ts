import { db, usersTable, coursesTable, branchesTable, successStoryCategoriesTable } from "./index";
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

  console.log("🏫 Seeding courses...");
  for (const c of courses) {
    await db.insert(coursesTable).values({
      title: c.title,
      slug: c.slug,
      description: c.description,
      category: c.category,
      duration: c.duration,
      fee: c.fee,
      isFeatured: c.isFeatured,
      isFree: c.fee === 0,
      status: "live", // Seeded courses should be 'live' for exploration
      teacherId: c.teacherId,
    }).onConflictDoNothing();
  }

  // 5. Success Story Categories
  console.log("🏆 Seeding success story categories...");
  const storyCategories = [
    { name: "eBay Business",    slug: "ebay-business",    description: "Students who built successful eBay stores" },
    { name: "Graphic Design",   slug: "graphic-design",   description: "Students excelling in graphic design careers" },
    { name: "Freelancing",      slug: "freelancing",      description: "Students earning as top-rated freelancers" },
    { name: "Web Development",  slug: "web-development",  description: "Students building web applications" },
    { name: "AI & Python",      slug: "ai-python",        description: "Students working with AI and Python" },
    { name: "MS Office",        slug: "ms-office",        description: "Students with MS Office expertise" },
  ];
  for (const cat of storyCategories) {
    await db.insert(successStoryCategoriesTable).values(cat).onConflictDoNothing();
  }

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
