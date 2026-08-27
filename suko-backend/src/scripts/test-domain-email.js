require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('=== Resend Email Test (Verified Domain) ===');
  console.log('API Key:', process.env.RESEND_API_KEY ? 'SET' : 'NOT SET');
  console.log('From:', process.env.RESEND_FROM_EMAIL);
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: 'meshramshreya641@gmail.com',
      subject: 'ICW by Suko - Domain Verification Test ' + new Date().toLocaleTimeString(),
      html: '<h2>Domain Verified!</h2><p>This email was sent from <strong>noreply@indiancorporatewearbysuko.com</strong> via Resend API.</p><p>If you received this, email delivery is working correctly.</p>'
    });

    if (error) {
      console.error('ERROR:', error);
    } else {
      console.log('SUCCESS! Email ID:', data.id);
      console.log('Email sent to meshramshreya641@gmail.com');
    }
  } catch (err) {
    console.error('EXCEPTION:', err.message);
  }
}

testEmail();
