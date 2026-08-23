const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const prisma = require('../prisma/client');

// Step 1: create a Razorpay order linked to our own Order
async function createRazorpayOrder(req, res) {
  try {
    const { order_id } = req.body;

    const order = await prisma.order.findUnique({ where: { id: order_id } });
    if (!order || order.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(order.total) * 100), // Razorpay uses paise
      currency: 'INR',
      receipt: `order_${order.id}`
    });

    res.json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

// Step 2: verify payment signature after checkout completes
async function verifyPayment(req, res) {
  try {
    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const order = await prisma.order.update({
      where: { id: order_id },
      data: { status: 'paid' }
    });

    res.json({ message: 'Payment verified', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { createRazorpayOrder, verifyPayment };
