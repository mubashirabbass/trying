// Using native fetch


async function run() {
  console.log("End-to-end Verification starting...");
  try {
    // 1. Login as Admin
    console.log("Logging in as Admin...");
    const adminLogin = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@globalcollege.com', password: 'password123' })
    });
    const adminData = await adminLogin.json();
    const adminToken = adminData.token;
    
    // 2. Mark attendance for Teacher (John Teacher - ID 37)
    console.log("Admin marking attendance for teacher 37...");
    const todayStr = new Date().toISOString().split('T')[0];
    const markRes = await fetch('http://localhost:8080/api/teacher-attendance/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        date: todayStr,
        records: [
          {
            teacherId: 37,
            status: 'present',
            checkInTime: '08:55',
            checkOutTime: '17:05',
            workingHours: '8:10',
            notes: 'Marked via end-to-end test'
          }
        ]
      })
    });
    
    const markResult = await markRes.json();
    console.log("Mark attendance response:", markResult);

    // 3. Login as Teacher (John Teacher)
    console.log("Logging in as Teacher...");
    const teacherLogin = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teacher@globalcollege.com', password: 'password123' })
    });
    const teacherData = await teacherLogin.json();
    const teacherToken = teacherData.token;

    // 4. Retrieve teacher's own attendance
    console.log("Fetching teacher's attendance...");
    const myRes = await fetch('http://localhost:8080/api/teacher-attendance/my', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      }
    });
    const myResult = await myRes.json();
    console.log("Teacher's records:", JSON.stringify(myResult, null, 2));

  } catch (err) {
    console.error("Error during E2E verification:", err);
  }
}

run();
