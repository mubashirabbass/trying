const API_URL = process.env.API_URL || "http://localhost:8080/api";

async function runSmokeTest() {
  console.log("🚀 Starting LMS API Smoke Test...");
  
  try {
    // 1. Health Check
    console.log("🔍 Checking Health Endpoint...");
    const healthRes = await fetch(`${API_URL}/healthz`);
    const healthData = await healthRes.json() as any;
    console.log("✅ Health Status:", healthData.status || healthData.data?.status || "OK");

    // 2. Public Courses
    console.log("🔍 Checking Course Catalog...");
    const coursesRes = await fetch(`${API_URL}/courses`);
    const coursesData = await coursesRes.json() as any;
    const courseList = Array.isArray(coursesData) ? coursesData : (coursesData.data || []);
    console.log(`✅ Retrieved ${courseList.length} courses.`);

    // 3. Success Stories & Testimonials
    console.log("🔍 Checking Content APIs...");
    const storiesRes = await fetch(`${API_URL}/success-stories`);
    const storiesData = await storiesRes.json() as any;
    const storyList = Array.isArray(storiesData) ? storiesData : (storiesData.data || []);

    const testimonialsRes = await fetch(`${API_URL}/testimonials`);
    const testimonialsData = await testimonialsRes.json() as any;
    const testimonialList = Array.isArray(testimonialsData) ? testimonialsData : (testimonialsData.data || []);

    console.log(`✅ Retrieved ${storyList.length} stories and ${testimonialList.length} testimonials.`);

    console.log("\n✨ Smoke Test Passed Successfully!");
  } catch (error: any) {
    console.error("\n❌ Smoke Test Failed!");
    console.error("Error:", error.message);
    process.exit(1);
  }
}

runSmokeTest();
