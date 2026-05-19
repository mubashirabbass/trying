async function test() {
  try {
    const loginRes = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@globalcollege.com", password: "password123" })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    const listRes = await fetch("http://localhost:8080/api/users?role=teacher", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const teachers = await listRes.json();
    console.log("Teachers response:", teachers);
    
    let teacherArray = Array.isArray(teachers) ? teachers : teachers.data;
    if (!teacherArray || teacherArray.length === 0) {
      console.log("No teachers to delete.");
      return;
    }
    const teacherToDelete = teacherArray[0];
    console.log(`Attempting to delete teacher ID ${teacherToDelete.id}...`);

    const delRes = await fetch(`http://localhost:8080/api/users/${teacherToDelete.id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    
    if (delRes.status === 204) {
      console.log("Delete succeeded with 204 No Content");
    } else {
      const text = await delRes.text();
      console.log(`Failed with status ${delRes.status}: ${text}`);
    }
  } catch (err) {
    console.error(err);
  }
}
test();
