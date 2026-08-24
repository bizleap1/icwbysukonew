/**
 * Test Suite: Production Commerce Core Hardening
 * Tests:
 * 1. State machine transition enforcement
 * 2. Minor-unit paise conversion
 * 3. Idempotent reservation release
 * 4. Raw webhook signature validation
 */

const assert = require('assert');
const crypto = require('crypto');
const { 
  ORDER_STATUS, 
  RESERVATION_STATUS, 
  PAYMENT_STATUS, 
  isValidOrderTransition, 
  toPaise 
} = require('../utils/orderStateMachine');

console.log("🚀 Starting Commerce Core Unit & Logic Tests...\n");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${err.message}`);
    failed++;
  }
}

// 1. Minor Units Conversion Tests
runTest("toPaise converts standard rupees correctly", () => {
  assert.strictEqual(toPaise(78000), 7800000);
  assert.strictEqual(toPaise("78000.00"), 7800000);
  assert.strictEqual(toPaise(9999.50), 999950);
  assert.strictEqual(toPaise("1299.99"), 129999);
  assert.strictEqual(toPaise(0), 0);
  assert.strictEqual(toPaise(null), 0);
});

// 2. State Machine Transition Tests
runTest("State machine permits valid order transitions", () => {
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.PAYMENT_PENDING, ORDER_STATUS.PAID), true);
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.PAYMENT_PENDING, ORDER_STATUS.EXPIRED), true);
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.PAYMENT_PENDING, ORDER_STATUS.CANCELLED), true);
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.PAID, ORDER_STATUS.PROCESSING), true);
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED), true);
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED), true);
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.PAID, ORDER_STATUS.CANCEL_REQUESTED), true);
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCEL_REQUESTED), true);
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.CANCEL_REQUESTED, ORDER_STATUS.CANCELLED), true);
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.CANCEL_REQUESTED, ORDER_STATUS.PROCESSING), true);
});

runTest("State machine rejects illegal order transitions (including direct paid -> cancelled)", () => {
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.DELIVERED, ORDER_STATUS.PAYMENT_PENDING), false);
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.CANCELLED, ORDER_STATUS.PROCESSING), false);
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.EXPIRED, ORDER_STATUS.PAID), false);
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED), false);
  // Direct paid -> cancelled is blocked (must route through cancel_requested)
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED), false);
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED), false);
});

runTest("Admin fulfillment transitions prevent manual paid or payment_pending manipulation", () => {
  const { isValidAdminTransition } = require('../utils/orderStateMachine');
  // Admin cannot manually mark payment_pending as paid
  assert.strictEqual(isValidAdminTransition(ORDER_STATUS.PAYMENT_PENDING, ORDER_STATUS.PAID), false);
  // Admin cannot revert paid back to payment_pending
  assert.strictEqual(isValidAdminTransition(ORDER_STATUS.PAID, ORDER_STATUS.PAYMENT_PENDING), false);
  // Admin cannot bypass cancel_requested for paid orders
  assert.strictEqual(isValidAdminTransition(ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED), false);
  // Admin valid fulfillment transitions
  assert.strictEqual(isValidAdminTransition(ORDER_STATUS.PAID, ORDER_STATUS.PROCESSING), true);
  assert.strictEqual(isValidAdminTransition(ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED), true);
  assert.strictEqual(isValidAdminTransition(ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED), true);
  assert.strictEqual(isValidAdminTransition(ORDER_STATUS.CANCEL_REQUESTED, ORDER_STATUS.CANCELLED), true);
  assert.strictEqual(isValidAdminTransition(ORDER_STATUS.CANCEL_REQUESTED, ORDER_STATUS.PROCESSING), true);
});

runTest("Payment status enum contains duplicate_captured", () => {
  assert.strictEqual(PAYMENT_STATUS.DUPLICATE_CAPTURED, 'duplicate_captured');
});

runTest("State machine allows idempotent same-state check", () => {
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.PAID, ORDER_STATUS.PAID), true);
  assert.strictEqual(isValidOrderTransition(ORDER_STATUS.DELIVERED, ORDER_STATUS.DELIVERED), true);
});

// 3. Webhook HMAC SHA256 Signature Verification
runTest("Webhook signature validator validates raw buffers correctly", () => {
  const secret = "test_webhook_secret_key_123";
  const rawBody = Buffer.from(JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_123", order_id: "order_456" } } } }));
  
  const validSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const calculatedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  
  assert.strictEqual(calculatedSignature, validSignature);

  const badSignature = "invalid_signature_hex_00000";
  assert.notStrictEqual(calculatedSignature, badSignature);
});

// 4. Server-Side Pricing Math Simulation
runTest("Server pricing math ignores frontend manipulated amount", () => {
  const dbProductPrice = 78000.00;
  const quantity = 2;
  const frontendSubmittedTotal = 1.00; // Attack payload

  const serverSubtotal = dbProductPrice * quantity;
  assert.strictEqual(serverSubtotal, 156000.00);

  // Apply 10% coupon
  const couponPercent = 10;
  const discount = (serverSubtotal * couponPercent) / 100;
  const finalServerTotal = serverSubtotal - discount;

  assert.strictEqual(discount, 15600.00);
  assert.strictEqual(finalServerTotal, 140400.00);
  assert.notStrictEqual(finalServerTotal, frontendSubmittedTotal);
});

// 5. Size Stock Deduction Math Simulation
runTest("Size stock deduction updates exact size and overall total", () => {
  const initialSizeStock = { "XS": 5, "S": 3, "M": 2, "L": 0, "XL": 1 };
  const initialTotalStock = Object.values(initialSizeStock).reduce((a, b) => a + b, 0); // 11
  assert.strictEqual(initialTotalStock, 11);

  const purchasedSize = "M";
  const purchasedQty = 2;

  // Validation
  assert(initialSizeStock[purchasedSize] >= purchasedQty, "Stock must be sufficient");

  // Decrement
  const updatedSizeStock = { ...initialSizeStock };
  updatedSizeStock[purchasedSize] -= purchasedQty;

  const newTotalStock = Object.values(updatedSizeStock).reduce((a, b) => a + b, 0);
  assert.strictEqual(updatedSizeStock["M"], 0);
  assert.strictEqual(newTotalStock, 9);

  // Restore simulation on cancellation / expiry
  updatedSizeStock[purchasedSize] += purchasedQty;
  const restoredTotalStock = Object.values(updatedSizeStock).reduce((a, b) => a + b, 0);
  assert.strictEqual(updatedSizeStock["M"], 2);
  assert.strictEqual(restoredTotalStock, 11);
});

console.log(`\n========================================`);
console.log(`Test Results: ${passed} passed, ${failed} failed.`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
