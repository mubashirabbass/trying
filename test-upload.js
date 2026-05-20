const http = require('http');
const req = http.request({
  hostname: '127.0.0.1',
  port: 8080,
  path: '/api/auth/upload-identity',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=--------------------------1234567890'
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(res.statusCode, body));
});
req.write('----------------------------1234567890\r\nContent-Disposition: form-data; name="document"; filename="test.jpg"\r\nContent-Type: image/jpeg\r\n\r\nHello World\r\n----------------------------1234567890--\r\n');
req.end();
