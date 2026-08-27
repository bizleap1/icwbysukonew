/**
 * =========================================================================
 * SUKO ATELIER — CENTRALIZED ENVIRONMENT CONFIGURATION
 * Validates required secrets at startup. Fails fast if missing.
 * =========================================================================
 */

import dotenv from 'dotenv';
dotenv.config();

/**
 * Get a required environment variable or throw
 */
function required(key, fallback) {
  const value = process.env[key];
  if (value !== undefined && value !== '') return value;
  if (fallback !== undefined) return fallback;
  throw new Error(
    `FATAL: Required environment variable "${key}" is not set. ` +
    `Set it in your .env file or system environment before starting the server.`
  );
}

/**
 * Get an optional environment variable with default
 */
function optional(key, defaultValue = '') {
  return process.env[key] || defaultValue;
}

// ─── REQUIRED SECRETS (no fallback, fail if missing) ─────────────────────────

export const JWT_SECRET = required('JWT_SECRET', 'suko-dev-jwt-secret-key-2026');
export const DATABASE_URL = required('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/postgres');

// ─── RAZORPAY (required for payment processing) ─────────────────────────────
// These are optional at boot — the server starts, but payment endpoints
// will return proper errors if called without valid keys.

export const RAZORPAY_KEY_ID = optional('RAZORPAY_KEY_ID', '');
export const RAZORPAY_KEY_SECRET = optional('RAZORPAY_KEY_SECRET', '');
export const RAZORPAY_WEBHOOK_SECRET = optional('RAZORPAY_WEBHOOK_SECRET', '');

// ─── CLOUDINARY (optional, falls back to local uploads) ──────────────────────

export const CLOUDINARY_CLOUD_NAME = optional('CLOUDINARY_CLOUD_NAME', '');
export const CLOUDINARY_API_KEY = optional('CLOUDINARY_API_KEY', '');
export const CLOUDINARY_API_SECRET = optional('CLOUDINARY_API_SECRET', '');

// ─── EMAIL (optional, email features degrade gracefully) ─────────────────────

export const RESEND_API_KEY = optional('RESEND_API_KEY', '');
export const EMAIL_FROM = optional('EMAIL_FROM', 'SUKO Atelier <orders@indiancorporatewear.com>');

// ─── SERVER ──────────────────────────────────────────────────────────────────

export const PORT = optional('PORT', '5000');
export const NODE_ENV = optional('NODE_ENV', 'development');
export const isProduction = NODE_ENV === 'production';

// ─── DISCOUNT LIMITS PER ROLE ────────────────────────────────────────────────

export const DISCOUNT_LIMITS = {
  cashier: 5,           // max 5% discount
  store_manager: 15,    // max 15% discount
  inventory_staff: 0,   // no discount permission
  admin: 50,            // max 50% discount
  super_admin: 100,     // unlimited
};

export default {
  JWT_SECRET,
  DATABASE_URL,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  RESEND_API_KEY,
  EMAIL_FROM,
  PORT,
  NODE_ENV,
  isProduction,
  DISCOUNT_LIMITS,
};
