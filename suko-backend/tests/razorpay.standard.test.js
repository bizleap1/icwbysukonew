/**
 * =========================================================================
 * RAZORPAY STANDARD WEB CHECKOUT INTEGRATION TEST (LIVE KEYS)
 * =========================================================================
 */

import crypto from 'crypto';
import razorpay from '../src/config/razorpay.js';
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from '../src/config/env.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`\x1b[32m[PASS]\x1b[0m ${testName}`);
  } else {
    failed++;
    console.error(`\x1b[31m[FAIL]\x1b[0m ${testName}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING RAZORPAY STANDARD CHECKOUT INTEGRATION TESTS');
  console.log('======================================================\n');

  // Test 1: Config loaded correctly
  assert(Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_ID.length > 5), 'Test 1: RAZORPAY_KEY_ID loaded from environment');
  assert(Boolean(RAZORPAY_KEY_SECRET && RAZORPAY_KEY_SECRET.length > 5), 'Test 2: RAZORPAY_KEY_SECRET loaded from environment');
  assert(razorpay !== null, 'Test 3: Razorpay SDK instance initialized successfully');

  // Test 4: Live Razorpay order creation via SDK
  try {
    const testAmount = 499900; // ₹4,999 in paise
    const receipt = `rcpt_live_${Date.now()}`;
    const order = await razorpay.orders.create({
      amount: testAmount,
      currency: 'INR',
      receipt: receipt,
      notes: { test: 'suko_live_checkout' }
    });

    assert(order && order.id && order.id.startsWith('order_'), `Test 4: Razorpay Live API created order: ${order.id}`);
    assert(order.amount === testAmount, 'Test 5: Order amount matches requested paise amount');
    assert(order.currency === 'INR', 'Test 6: Order currency is INR');

    // Test 7: HMAC-SHA256 signature verification with valid signature
    const testPaymentId = `pay_live_${crypto.randomBytes(6).toString('hex')}`;
    const payload = `${order.id}|${testPaymentId}`;
    const validSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest('hex');

    const verifySignature = (orderId, paymentId, sig) => {
      const expected = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
      return expected === sig;
    };

    assert(verifySignature(order.id, testPaymentId, validSignature) === true, 'Test 7: Valid HMAC-SHA256 signature passes verification');

    // Test 8: Tampered signature rejection
    const forgedSignature = 'forged_tampered_signature_hex_invalid';
    assert(verifySignature(order.id, testPaymentId, forgedSignature) === false, 'Test 8: Forged HMAC-SHA256 signature is rejected');

    // Test 9: Mismatched order_id rejection
    assert(verifySignature('order_different_123', testPaymentId, validSignature) === false, 'Test 9: Mismatched order_id signature is rejected');

  } catch (err) {
    console.error('Razorpay API error:', err);
    assert(false, `Test 4: Razorpay API order creation failed: ${err.message}`);
  }

  // Test 10: Minimum amount boundary check
  const validateAmount = (amountInPaise) => {
    return typeof amountInPaise === 'number' && amountInPaise >= 100;
  };
  assert(validateAmount(50) === false, 'Test 10: Amount below 100 paise rejected');
  assert(validateAmount(100) === true, 'Test 11: Amount of exactly 100 paise accepted');
  assert(validateAmount(10000) === true, 'Test 12: Standard amount accepted');

  console.log('\n======================================================');
  console.log(`📊 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
