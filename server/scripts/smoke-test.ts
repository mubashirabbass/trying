import axios from "axios";

const API_URL = process.env.API_URL || "http://localhost:8080/api";

async function runSmokeTest() {
  console.log("🚀 Starting LMS API Smoke Test...");
  
  try {
    // 1. Health Check
    console.log("🔍 Checking Health Endpoint...");
    const health = await axios.get(`${API_URL}/health`);
    console.log("✅ Health Status:", health.data.status);

    // 2. Public Courses
    console.log("🔍 Checking Course Catalog...");
    const courses = await axios.get(`${API_URL}/courses`);
    console.log(`✅ Retrieved ${courses.data.length} courses.`);

    // 3. Success Stories & Testimonials
    console.log("🔍 Checking Content APIs...");
    const stories = await axios.get(`${API_URL}/success-stories`);
    const testimonials = await axios.get(`${API_URL}/testimonials`);
    console.log(`✅ Retrieved ${stories.data.length} stories and ${testimonials.data.length} testimonials.`);

    console.log("\n✨ Smoke Test Passed Successfully!");
  } catch (error: any) {
    console.error("\n❌ Smoke Test Failed!");
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
    process.exit(1);
  }
}

runSmokeTest();
