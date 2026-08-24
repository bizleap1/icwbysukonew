require('dotenv').config();
const nodemailer = require('nodemailer');

const login = (process.env.BREVO_SMTP_LOGIN || '').trim();
const pass = (process.env.BREVO_SMTP_KEY || '').trim();

async function testPort(port, secure = false) {
  console.log(`\nTesting smtp-relay.brevo.com on port ${port} (secure: ${secure})...`);
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port,
    secure,
    auth: { user: login, pass: pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
  });

  try {
    await transporter.verify();
    console.log(`✅ Port ${port} verified successfully!`);
    return true;
  } catch (err) {
    console.error(`❌ Port ${port} failed:`, err.message);
    return false;
  }
}

async function run() {
  await testPort(587, false);
  await testPort(2525, false);
  await testPort(465, true);
}

run();
