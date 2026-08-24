require('dotenv').config();
const nodemailer = require('nodemailer');

async function testBrevoConnectivity() {
  console.log("📧 Testing Brevo SMTP transport connectivity...");
  const login = (process.env.BREVO_SMTP_LOGIN || '').trim();
  const pass = (process.env.BREVO_SMTP_KEY || '').trim();

  console.log("Brevo Login configured:", Boolean(login));
  console.log("Brevo Key configured:", Boolean(pass));

  if (!login || !pass) {
    console.log("⚠️ Brevo credentials not set in environment.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: login,
      pass: pass,
    },
    connectionTimeout: 10000,
  });

  try {
    await transporter.verify();
    console.log("✅ Brevo SMTP Transport Verified Successfully!");
  } catch (err) {
    console.error("❌ Brevo SMTP Verification Error:", err.message);
  }
}

testBrevoConnectivity();
