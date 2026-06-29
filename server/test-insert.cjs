// Simple insert to test entry records
const https = require('https');

const data = JSON.stringify({
  studentName: "Test Student",
  histNo: "REG-001", 
  course: "Test Course",
  admissionDate: "2026-06-29",
  duration: "6 Months",
  receiptNo: "RCP-001",
  amount: 15000,
  month: "June 2026"
});

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/entry-records',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-token' // This will fail but shows if route is found
  }
};

const req = require('http').request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(data);
req.end();