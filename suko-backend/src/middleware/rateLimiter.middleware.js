/**
 * =========================================================================
 * SUKO ATELIER — RATE LIMITING MIDDLEWARE
 * Protects auth, OTP, and payment endpoints from brute-force attacks
 * =========================================================================
 */

import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Auth rate limiter — login, register
 * 20 requests per 15 minutes per IP (Skipped in dev)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  skip: () => isDev,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * OTP rate limiter — send-login-otp, send-register-otp, forgot-password
 * 5 requests per 10 minutes per IP (Skipped in dev)
 */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  skip: () => isDev,
  message: {
    success: false,
    code: 'OTP_RATE_LIMIT',
    message: 'Too many OTP requests. Please wait 10 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Payment rate limiter — create-order, verify
 * 10 requests per 5 minutes per IP (Skipped in dev)
 */
export const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  skip: () => isDev,
  message: {
    success: false,
    code: 'PAYMENT_RATE_LIMIT',
    message: 'Too many payment requests. Please try again shortly.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter
 * 600 requests per 15 minutes per IP (Skipped in dev)
 * Higher limit to accommodate admin dashboard live polling (8s intervals across multiple sections)
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  skip: () => isDev,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
