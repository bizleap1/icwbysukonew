const crypto = require('crypto');
const prisma = require('../prisma/client');
const { 
  ORDER_STATUS, 
  RESERVATION_STATUS, 
  PAYMENT_STATUS 
} = require('../utils/orderStateMachine');
const { sendOrderConfirmationEmail } = require('../utils/email.service');

/**
 * Secure, route-safe handler for Razorpay server-to-server Webhooks.
 * Validates HMAC SHA256 signature using raw request buffer,
 * requires captured state, handles duplicate payments, and performs exact cart cleanup.
 */
async function handleRazorpayWebhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn("⚠️ [Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured in environment.");
      return res.status(500).json({ error: 'Webhook secret not configured on server.' });
    }

    if (!signature) {
      return res.status(400).json({ error: 'Missing X-Razorpay-Signature header.' });
    }

    // 1. Verify Signature using exact raw request body buffer
    const rawBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBuffer)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error("❌ [Razorpay Webhook] Signature verification failed.");
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }

    // 2. Parse Event JSON
    let eventPayload;
    try {
      eventPayload = JSON.parse(rawBuffer.toString('utf8'));
    } catch (parseErr) {
      return res.status(400).json({ error: 'Malformed webhook JSON payload.' });
    }

    const { event, payload } = eventPayload;
    console.log(`🔔 [Razorpay Webhook] Event received: ${event}`);

    // 3. Process Captured/Paid Payment Event
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      if (!paymentEntity) {
        return res.status(200).json({ status: 'ignored_missing_entity' });
      }

      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      if (!razorpayOrderId) {
        return res.status(200).json({ status: 'ignored_no_order_id' });
      }

      // Confirm payment status is actually captured
      if (paymentEntity.status !== 'captured') {
        console.warn(`⚠️ [Razorpay Webhook] Payment ${razorpayPaymentId} status is '${paymentEntity.status}', not captured. Skipping.`);
        return res.status(200).json({ status: 'ignored_not_captured' });
      }

      // Find internal payment record
      const storedPayment = await prisma.payment.findUnique({
        where: { razorpay_order_id: razorpayOrderId },
        include: { order: { include: { items: true, user: true, payments: true } } }
      });

      if (!storedPayment || !storedPayment.order) {
        console.warn(`⚠️ [Razorpay Webhook] No matching internal payment record for Razorpay order ID: ${razorpayOrderId}`);
        return res.status(200).json({ status: 'order_not_found' });
      }

      const order = storedPayment.order;

      // Handle duplicate capture on already-paid order
      if (order.status === ORDER_STATUS.PAID) {
        if (storedPayment.razorpay_payment_id === razorpayPaymentId) {
          return res.status(200).json({ status: 'already_processed' });
        }

        // Duplicate payment for same order
        console.error(`🚨 [Razorpay Webhook DUPLICATE_PAYMENT] Duplicate payment ${razorpayPaymentId} for Order #${order.id}.`);
        await prisma.payment.create({
          data: {
            order_id: order.id,
            provider: 'razorpay',
            razorpay_order_id: `dup_${razorpayOrderId}_${Date.now()}`,
            razorpay_payment_id: razorpayPaymentId,
            amount_in_paise: paymentEntity.amount,
            currency: paymentEntity.currency || 'INR',
            status: 'duplicate_captured',
            error_reason: 'CRITICAL: Duplicate payment captured on Razorpay for already finalized order.'
          }
        });
        return res.status(200).json({ status: 'duplicate_logged' });
      }

      // Execute atomic transition
      let emailToSend = null;
      await prisma.$transaction(async (tx) => {
        // Atomic conditional update on order
        await tx.order.updateMany({
          where: {
            id: order.id,
            status: ORDER_STATUS.PAYMENT_PENDING,
            reservation_status: RESERVATION_STATUS.RESERVED
          },
          data: {
            status: ORDER_STATUS.PAID,
            reservation_status: RESERVATION_STATUS.FINALIZED
          }
        });

        // Update payment record
        await tx.payment.update({
          where: { id: storedPayment.id },
          data: {
            status: PAYMENT_STATUS.PAID,
            razorpay_payment_id: razorpayPaymentId
          }
        });

        // Exact Cart Cleanup: Delete only source cart item IDs that comprised this checkout
        if (Array.isArray(order.cart_item_ids) && order.cart_item_ids.length > 0) {
          await tx.cartItem.deleteMany({
            where: {
              id: { in: order.cart_item_ids },
              user_id: order.user_id
            }
          });
        } else {
          // Fallback: Delete matching purchased product/size items
          for (const item of order.items) {
            await tx.cartItem.deleteMany({
              where: {
                user_id: order.user_id,
                product_id: item.product_id,
                size: item.size || null
              }
            });
          }
        }

        emailToSend = order.user?.email || null;
      });

      if (emailToSend) {
        sendOrderConfirmationEmail(emailToSend, order).catch(err => {
          console.error("Webhook order confirmation email error (non-fatal):", err.message);
        });
      }

      return res.status(200).json({ status: 'success', orderId: order.id });
    }

    // 4. Process Payment Failure Event
    if (event === 'payment.failed') {
      const paymentEntity = payload?.payment?.entity;
      if (paymentEntity && paymentEntity.order_id) {
        await prisma.payment.updateMany({
          where: {
            razorpay_order_id: paymentEntity.order_id,
            status: PAYMENT_STATUS.PENDING
          },
          data: {
            status: PAYMENT_STATUS.FAILED,
            error_reason: (paymentEntity.error_description || 'Payment failed').substring(0, 255)
          }
        });
      }
      return res.status(200).json({ status: 'failure_recorded' });
    }

    // Other unhandled events: return 200 OK to acknowledge receipt
    res.status(200).json({ status: 'acknowledged' });
  } catch (err) {
    console.error("❌ Razorpay Webhook Handler Error:", err);
    res.status(500).json({ error: 'Webhook processing error.' });
  }
}

module.exports = {
  handleRazorpayWebhook
};
