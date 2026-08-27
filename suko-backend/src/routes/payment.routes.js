import { Router } from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  releasePaymentHold,
  razorpayWebhook
} from '../controllers/payment.controller.js';
import { optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { paymentLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Order creation endpoints
router.post('/create-order', optionalAuthMiddleware, paymentLimiter, createRazorpayOrder);

// Payment verification endpoints
router.post('/verify', optionalAuthMiddleware, paymentLimiter, verifyRazorpayPayment);
router.post('/verify-payment', optionalAuthMiddleware, paymentLimiter, verifyRazorpayPayment);

// Checkout hold release endpoint (user cancelled / abandoned)
router.post('/release-hold', optionalAuthMiddleware, releasePaymentHold);

// Razorpay webhook — server-to-server with cryptographic signature verification
router.post('/webhook', razorpayWebhook);

export default router;
