require('dotenv').config();
const razorpay = require('../config/razorpay');

async function testRazorpayConnectivity() {
  console.log("💳 Testing Razorpay TEST API connectivity...");
  console.log("Razorpay Key ID configured:", Boolean(process.env.RAZORPAY_KEY_ID));
  console.log("Razorpay Key Secret configured:", Boolean(process.env.RAZORPAY_KEY_SECRET));
  console.log("Razorpay Webhook Secret configured:", Boolean(process.env.RAZORPAY_WEBHOOK_SECRET));

  try {
    const order = await razorpay.orders.create({
      amount: 100,
      currency: "INR",
      receipt: `test_rcpt_${Date.now()}`
    });
    console.log("✅ Razorpay TEST API Connection Successful! (Order ID created in test mode):", order.id);
  } catch (err) {
    const description = err?.error?.description || err?.message || JSON.stringify(err);
    console.error("❌ Razorpay TEST API Result:", description);
  }
}

testRazorpayConnectivity();
