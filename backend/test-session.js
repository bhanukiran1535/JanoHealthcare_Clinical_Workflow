const http = require('http');

const data = JSON.stringify({
  patientId: "65f0abcdef1234567890abcd",
  unit: "Center A",
  machineId: "M-1",
  startTime: new Date().toISOString(),
  preWeightKg: 70,
  preBP: { systolic: 120, diastolic: 80 }
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/sessions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Status', res.statusCode, 'Body:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
