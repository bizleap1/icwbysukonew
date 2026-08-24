const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../.env');
if (!fs.existsSync(envPath)) {
  console.error("❌ .env file not found at", envPath);
  process.exit(1);
}

let content = fs.readFileSync(envPath, 'utf8');

const jwtSecret = crypto.randomBytes(32).toString('hex');
const otpSecret = crypto.randomBytes(32).toString('hex');
const webhookSecret = crypto.randomBytes(32).toString('hex');

content = content.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET="${jwtSecret}"`);

if (content.includes('OTP_HASH_SECRET=')) {
  content = content.replace(/^OTP_HASH_SECRET=.*$/m, `OTP_HASH_SECRET="${otpSecret}"`);
} else {
  content += `\nOTP_HASH_SECRET="${otpSecret}"`;
}

if (content.includes('RAZORPAY_WEBHOOK_SECRET=')) {
  content = content.replace(/^RAZORPAY_WEBHOOK_SECRET=.*$/m, `RAZORPAY_WEBHOOK_SECRET="${webhookSecret}"`);
} else {
  content += `\nRAZORPAY_WEBHOOK_SECRET="${webhookSecret}"`;
}

fs.writeFileSync(envPath, content);
console.log('✅ Independent cryptographic secrets (JWT, OTP, Webhook) rotated and persisted safely.');
