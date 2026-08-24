require('dotenv').config();
const https = require('https');

async function testBrevoHttpApi() {
  const apiKey = (process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY || '').trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_EMAIL || 'bizleap1@gmail.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'SUKO Atelier';

  console.log("Testing Brevo HTTPS REST API (Port 443)...");
  console.log("Sender:", `"${senderName}" <${senderEmail}>`);
  console.log("API Key configured:", Boolean(apiKey));

  if (!apiKey) {
    console.error("Missing Brevo API Key");
    return;
  }

  const payload = JSON.stringify({
    sender: { name: senderName, email: senderEmail },
    to: [{ email: 'bizleap1@gmail.com', name: 'Bizleap Admin' }],
    subject: 'SUKO Atelier Brevo HTTPS API Test',
    htmlContent: '<p>This is a test verification email sent via Brevo HTTPS API over port 443.</p>'
  });

  const options = {
    hostname: 'api.brevo.com',
    port: 443,
    path: '/v3/smtp/email',
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      console.log('Brevo HTTPS API HTTP Status:', res.statusCode);
      console.log('Response Body:', data);
    });
  });

  req.on('error', (err) => {
    console.error('Request error:', err.message);
  });

  req.write(payload);
  req.end();
}

testBrevoHttpApi();
