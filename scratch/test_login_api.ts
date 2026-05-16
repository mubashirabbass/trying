async function testLogin() {
  console.log("Attempting login...");
  try {
    const res = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "teacher@globalcollege.com",
        password: "password123"
      })
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      console.log("Data:", JSON.stringify(data, null, 2));
    } catch {
      console.log("Raw Response:", text);
    }
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

testLogin();
