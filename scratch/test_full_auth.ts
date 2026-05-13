
async function testRegister() {
  try {
    const email = `test_${Date.now()}@example.com`;
    const response = await fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: "Test User", 
        email: email, 
        password: "password123",
        role: "student"
      })
    });
    
    console.log("Register Status:", response.status);
    const data = await response.json();
    console.log("Register Response:", JSON.stringify(data, null, 2));
    
    if (response.status === 201) {
       // Now try login
       const loginResponse = await fetch("http://localhost:8080/api/auth/login", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email: email, password: "password123" })
       });
       console.log("Login Status:", loginResponse.status);
       const loginData = await loginResponse.json();
       console.log("Login Response:", JSON.stringify(loginData, null, 2));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testRegister();
