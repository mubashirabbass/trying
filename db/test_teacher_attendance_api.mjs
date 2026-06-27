// Using native fetch


async function test() {
  console.log("Starting API verification...");
  try {
    // 1. Log in as Admin
    console.log("Logging in as admin...");
    const adminLoginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@globalcollege.com', password: 'password123' })
    });
    
    if (!adminLoginRes.ok) {
      const errText = await adminLoginRes.text();
      throw new Error(`Admin login failed: ${adminLoginRes.status} - ${errText}`);
    }
    
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.token || adminLoginRes.headers.get('set-cookie');
    console.log("Admin logged in successfully! Token received.");

    // Extract cookie token if set-cookie was used
    const cookieHeader = adminLoginRes.headers.get('set-cookie');
    console.log("Cookie header:", cookieHeader);

    // Let's perform GET /api/teacher-attendance/teachers
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminData.token}`
    };
    
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader.split(';')[0];
    }

    console.log("Fetching /api/teacher-attendance/teachers...");
    const teachersRes = await fetch('http://localhost:8080/api/teacher-attendance/teachers', { headers });
    console.log("Response status:", teachersRes.status);
    const teachersData = await teachersRes.json();
    console.log("Teachers response data:", teachersData);

    console.log("Fetching /api/teacher-attendance/all...");
    const allRes = await fetch('http://localhost:8080/api/teacher-attendance/all?month=6&year=2026', { headers });
    console.log("Response status:", allRes.status);
    const allData = await allRes.json();
    console.log("All records response data:", allData);

    // 2. Log in as Teacher
    console.log("Logging in as teacher...");
    const teacherLoginRes = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher@globalcollege.com', password: 'password123' })
    });
    
    if (!teacherLoginRes.ok) {
      throw new Error(`Teacher login failed: ${teacherLoginRes.status}`);
    }
    
    const teacherData = await teacherLoginRes.json();
    const teacherHeaders = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherData.token}`
    };
    const teacherCookie = teacherLoginRes.headers.get('set-cookie');
    if (teacherCookie) {
      teacherHeaders['Cookie'] = teacherCookie.split(';')[0];
    }

    console.log("Fetching /api/teacher-attendance/my...");
    const myRes = await fetch('http://localhost:8080/api/teacher-attendance/my?month=6&year=2026', { headers: teacherHeaders });
    console.log("Response status:", myRes.status);
    const myData = await myRes.json();
    console.log("My records response data:", myData);

  } catch (err) {
    console.error("Verification failed:", err);
  }
}

test();
