const https = require('https');

async function testOtpLive() {
  const postData = JSON.stringify({
    name: 'Shreya Test',
    phone: '9284631329',
    email: 'meshramshreya641@gmail.com',
    password: 'Password@123'
  });

  const options = {
    hostname: 'icwbysukonew.onrender.com',
    port: 443,
    path: '/api/auth/send-register-otp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Origin': 'https://icwbysukonew.vercel.app'
    }
  };

  console.log('Sending live OTP request to https://icwbysukonew.onrender.com/api/auth/send-register-otp ...');

  const req = https.request(options, (res) => {
    let data = '';
    console.log('Status Code:', res.statusCode);
    console.log('CORS Header:', res.headers['access-control-allow-origin']);
    
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response Body:', data);
    });
  });

  req.on('error', (e) => {
    console.error('Request Error:', e);
  });

  req.write(postData);
  req.end();
}

testOtpLive();
