async function test() {
  try {
    const loginRes = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@globalcollege.com", password: "password123" })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    console.log("Attempting to create teacher...");
    const createRes = await fetch("http://localhost:8080/api/users", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({
        name: "Test Teacher",
        email: "testteacher" + Math.random() + "@globalcollege.com",
        password: "password123",
        role: "teacher"
      })
    });
    
    if (createRes.status === 201) {
      console.log("Create succeeded!");
      console.log(await createRes.json());
    } else {
      const text = await createRes.text();
      console.log(`Failed with status ${createRes.status}: ${text}`);
    }
  } catch (err) {
    console.error(err);
  }
}
test();
