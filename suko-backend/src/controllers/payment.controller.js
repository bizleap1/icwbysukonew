const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const prisma = require('../prisma/client');
const { 
  ORDER_STATUS, 
  RESERVATION_STATUS, 
  PAYMENT_STATUS, 
  toPaise 
} = require('../utils/orderStateMachine');
const { releaseOrderReservation } = require('../utils/inventory.service');
const { sendOrderConfirmationEmail } = require('../utils/email.service');

/**
 * Initiates or reuses a Razorpay payment order for an existing internal order.
 * Reuses existing active pending Razorpay order to prevent duplicate customer charges.
 */
async function createRazorpayOrder(req, res) {
  try {
    const { order_id } = req.body;
    const orderId = parseInt(order_id);

    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Valid order_id is required.' });
    }

    const order = await prisma.order.findUnique({ 
      where: { id: orderId },
      include: { payments: true }
    });

    if (!order || order.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Check if order is in a valid payable state
    if (order.status !== ORDER_STATUS.PAYMENT_PENDING || order.reservation_status !== RESERVATION_STATUS.RESERVED) {
      return res.status(400).json({ 
        error: `Order is not eligible for payment. Current status: ${order.status}.` 
      });
    }

    // Check reservation expiration
    if (order.expires_at && order.expires_at < new Date()) {
      await releaseOrderReservation(order.id, ORDER_STATUS.EXPIRED);
      return res.status(400).json({ 
        error: 'Order payment window has expired. Please initiate checkout again.' 
      });
    }

    const amountInPaise = toPaise(order.total);
    if (amountInPaise <= 0) {
      return res.status(400).json({ error: 'Invalid order amount.' });
    }

    // Reuse existing active pending payment attempt if valid
    const existingPendingPayment = order.payments.find(p => p.status === PAYMENT_STATUS.PENDING && p.razorpay_order_id);
    if (existingPendingPayment) {
      return res.json({
        razorpay_order_id: existingPendingPayment.razorpay_order_id,
        amount: existingPendingPayment.amount_in_paise,
        currency: existingPendingPayment.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
        reused: true
      });
    }

    // Create fresh Razorpay order only if no active pending attempt exists
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${order.id}_${Date.now()}`
    });

    // Create a new Payment attempt record
    await prisma.payment.create({
      data: {
        order_id: order.id,
        provider: 'razorpay',
        razorpay_order_id: razorpayOrder.id,
        amount_in_paise: amountInPaise,
        currency: razorpayOrder.currency,
        status: PAYMENT_STATUS.PENDING
      }
    });

    res.json({
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      reused: false
    });
  } catch (err) {
    console.error("createRazorpayOrder error:", err);
    res.status(500).json({ error: 'Failed to initialize payment gateway.' });
  }
}

/**
 * Verifies Razorpay payment signature, confirms captured state server-side,
 * detects duplicate charges, and atomically marks order as paid with exact cart cleanup.
 */
async function verifyPayment(req, res) {
  try {
    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const orderId = parseInt(order_id);

    if (isNaN(orderId) || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment verification parameters.' });
    }

    // 1. Fetch Order and Payment records
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true }
    });

    if (!order || order.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // 2. Validate HMAC SHA256 Signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    // 3. Match Payment Attempt Record
    let paymentRecord = order.payments.find(p => p.razorpay_order_id === razorpay_order_id);
    if (!paymentRecord) {
      return res.status(400).json({ error: 'No matching payment session found for this order.' });
    }

    // 4. Server-Side Reconciliation with Razorpay API
    let razorpayPayment;
    try {
      razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (rErr) {
      console.error("Razorpay server-side fetch failed:", rErr.message);
      return res.status(400).json({ error: 'Unable to verify payment details with gateway.' });
    }

    if (!razorpayPayment) {
      return res.status(400).json({ error: 'Payment details could not be retrieved from gateway.' });
    }

    // If payment is authorized but not captured, attempt explicit server-side capture
    if (razorpayPayment.status === 'authorized') {
      try {
        console.log(`⚡ [Razorpay Capture] Explicitly capturing authorized payment ${razorpay_payment_id}...`);
        razorpayPayment = await razorpay.payments.capture(
          razorpay_payment_id,
          paymentRecord.amount_in_paise,
          'INR'
        );
      } catch (capErr) {
        console.error("Server-side capture failed:", capErr.message);
        return res.status(400).json({ error: 'Failed to capture authorized payment on gateway.' });
      }
    }

    if (
      razorpayPayment.order_id !== razorpay_order_id ||
      razorpayPayment.amount !== paymentRecord.amount_in_paise ||
      razorpayPayment.currency !== 'INR' ||
      razorpayPayment.status !== 'captured'
    ) {
      console.error("Payment reconciliation mismatch:", {
        gatewayOrderId: razorpayPayment.order_id,
        expectedOrderId: razorpay_order_id,
        gatewayAmount: razorpayPayment.amount,
        expectedAmount: paymentRecord.amount_in_paise,
        gatewayStatus: razorpayPayment.status
      });
      return res.status(400).json({ error: 'Payment gateway verification mismatch or uncaptured payment.' });
    }

    // 5. Handle Duplicate Charge Detection
    if (order.status === ORDER_STATUS.PAID) {
      // Check if this is the identical payment already recorded
      const existingPaidPayment = order.payments.find(p => p.status === PAYMENT_STATUS.PAID && p.razorpay_payment_id === razorpay_payment_id);
      if (existingPaidPayment) {
        return res.json({ message: 'Payment already verified.', order, alreadyVerified: true });
      }

      // CRITICAL: A SECOND, DIFFERENT payment was captured for this order!
      console.error(`🚨 [CRITICAL_DUPLICATE_PAYMENT_CAPTURED] Order #${order.id} received a second captured payment: ${razorpay_payment_id}. Logging for manual reconciliation.`);
      
      await prisma.payment.upsert({
        where: { razorpay_order_id: razorpay_order_id },
        update: {
          status: 'duplicate_captured',
          razorpay_payment_id: razorpay_payment_id,
          error_reason: 'CRITICAL: Duplicate payment captured for already finalized order. Requires manual review/refund.'
        },
        create: {
          order_id: order.id,
          provider: 'razorpay',
          razorpay_order_id: razorpay_order_id,
          razorpay_payment_id: razorpay_payment_id,
          amount_in_paise: paymentRecord.amount_in_paise,
          currency: 'INR',
          status: 'duplicate_captured',
          error_reason: 'CRITICAL: Duplicate payment captured for already finalized order. Requires manual review/refund.'
        }
      });

      return res.json({ 
        message: 'Duplicate payment detected. Logged for manual reconciliation.', 
        order, 
        duplicate: true 
      });
    }

    // 6. Concurrency-Safe Atomic Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Atomic conditional update on Order: only succeeds if still payment_pending and reserved
      const orderUpdate = await tx.order.updateMany({
        where: {
          id: orderId,
          user_id: req.user.userId,
          status: ORDER_STATUS.PAYMENT_PENDING,
          reservation_status: RESERVATION_STATUS.RESERVED
        },
        data: {
          status: ORDER_STATUS.PAID,
          reservation_status: RESERVATION_STATUS.FINALIZED
        }
      });

      if (orderUpdate.count === 0) {
        // Check if concurrent request already completed payment
        const currentOrder = await tx.order.findUnique({ where: { id: orderId } });
        if (currentOrder && currentOrder.status === ORDER_STATUS.PAID) {
          return { order: currentOrder, alreadyVerified: true };
        }
        throw new Error('Order is no longer in an active payment reservation state.');
      }

      // Update specific Payment record
      await tx.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: PAYMENT_STATUS.PAID,
          razorpay_payment_id: razorpay_payment_id
        }
      });

      // Exact Cart Cleanup: Delete only source cart item IDs that comprised this checkout
      if (Array.isArray(order.cart_item_ids) && order.cart_item_ids.length > 0) {
        await tx.cartItem.deleteMany({
          where: {
            id: { in: order.cart_item_ids },
            user_id: req.user.userId
          }
        });
      } else {
        // Fallback: Delete matching purchased product/size items
        for (const item of order.items) {
          await tx.cartItem.deleteMany({
            where: {
              user_id: req.user.userId,
              product_id: item.product_id,
              size: item.size || null
            }
          });
        }
      }

      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: true } }, payments: true }
      });

      return { order: updatedOrder, alreadyVerified: false };
    });

    // 7. Asynchronously Dispatch Confirmation Email (Post-Transaction)
    if (!result.alreadyVerified) {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      const recipientEmail = (user && user.email) || null;
      if (recipientEmail) {
        sendOrderConfirmationEmail(recipientEmail, result.order).catch(err => {
          console.error("Order confirmation email delivery failed (non-fatal):", err.message);
        });
      }
    }

    res.json({ message: 'Payment verified successfully.', order: result.order });
  } catch (err) {
    console.error("verifyPayment error:", err);
    res.status(500).json({ error: err.message || 'Payment verification failed.' });
  }
}

module.exports = { 
  createRazorpayOrder, 
  verifyPayment
};
