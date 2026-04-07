const http = require('http');

const data = JSON.stringify({
  question: "Test Question",
  options: ["Option A", "Option B"],
  adminId: "12345678-1234-1234-1234-123456789012"
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/rooms/6d3bdf54-fe97-48a7-be7d-353b64a17b9a/polls',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
