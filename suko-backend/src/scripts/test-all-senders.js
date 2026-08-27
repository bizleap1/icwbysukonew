require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testVariousSenders() {
  const senders = [
    'ICW by Suko <noreply@indiancorporatewearbysuko.com>',
    'ICW by Suko <noreply@indiancorporatewear.com>',
    'ICW by Suko <contact@indiancorporatewear.com>',
    'ICW by Suko <info@indiancorporatewear.com>',
    'ICW by Suko <contact@indiancorporatewearbysuko.com>',
    'ICW by Suko <onboarding@resend.dev>'
  ];

  for (const sender of senders) {
    console.log(`\nTesting sender: ${sender}`);
    try {
      const { data, error } = await resend.emails.send({
        from: sender,
        to: 'meshramshreya641@gmail.com',
        subject: 'ICW Domain Test ' + Date.now(),
        html: '<p>Testing sender verification</p>'
      });
      if (error) {
        console.log(`❌ Failed: [${error.name}] ${error.message}`);
      } else {
        console.log(`✅ SUCCESS! Email ID: ${data.id}`);
      }
    } catch (e) {
      console.log(`❌ Exception: ${e.message}`);
    }
  }
}

testVariousSenders();
