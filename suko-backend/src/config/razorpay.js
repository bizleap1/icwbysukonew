/**
 * =========================================================================
 * SUKO ATELIER — RAZORPAY CONFIGURATION
 * No dummy fallback keys. Payment features disabled if keys not set.
 * =========================================================================
 */

import Razorpay from 'razorpay';
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from './env.js';

let razorpay = null;

if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('[Razorpay] API keys not configured. Payment endpoints will return errors.');
}

export default razorpay;
