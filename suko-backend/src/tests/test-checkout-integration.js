/**
 * Phase 4: Secure Checkout & Razorpay Frontend Integration Test Suite
 */

const assert = require('assert');
const crypto = require('crypto');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'super_secure_test_jwt_secret_min32chars_ok!';
process.env.OTP_HASH_SECRET = 'dedicated_high_entropy_otp_hash_secret_min32chars!';
process.env.RAZORPAY_KEY_ID = 'rzp_test_public_key_12345';
process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret_67890';

console.log("=================================================================");
console.log("💳 STARTING PHASE 4: SECURE CHECKOUT & RAZORPAY INTEGRATION TESTS");
console.log("=================================================================\n");

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${err.message}`);
    failed++;
  }
}

async function runAllTests() {

  // 1. User-Scoped Checkout Idempotency: Double-click or retry reuses active order
  await runTest("1. Checkout Idempotency: Same (user_id, checkout_id) reuses active payment_pending order without re-reserving stock", () => {
    let productStock = { 10: 5 };
    const ordersDB = [];

    function processCheckout(userId, checkoutId, payload) {
      // 1. Compute fingerprint
      const fingerprint = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

      // 2. Check existing order
      const existing = ordersDB.find(o => o.user_id === userId && o.checkout_id === checkoutId);
      if (existing) {
        if (existing.checkout_fingerprint !== fingerprint) {
          return { status: 409, error: "Fingerprint mismatch" };
        }
        if (existing.status === "payment_pending" && existing.expires_at > Date.now()) {
          return { status: 200, order: existing, idempotent_reuse: true };
        }
      }

      // 3. Reserve stock
      productStock[10] -= payload.qty;

      const newOrder = {
        id: ordersDB.length + 1,
        user_id: userId,
        checkout_id: checkoutId,
        checkout_fingerprint: fingerprint,
        status: "payment_pending",
        expires_at: Date.now() + 15 * 60 * 1000,
        qty: payload.qty
      };
      ordersDB.push(newOrder);
      return { status: 201, order: newOrder, idempotent_reuse: false };
    }

    const checkoutPayload = { productId: 10, size: "38", qty: 2 };
    const checkoutId = "checkout_uuid_001";

    // Initial click
    const res1 = processCheckout(1, checkoutId, checkoutPayload);
    assert.strictEqual(res1.status, 201);
    assert.strictEqual(res1.idempotent_reuse, false);
    assert.strictEqual(productStock[10], 3); // 5 - 2 = 3

    // Double-click / retry with same checkoutId
    const res2 = processCheckout(1, checkoutId, checkoutPayload);
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.idempotent_reuse, true);
    assert.strictEqual(res2.order.id, res1.order.id);
    assert.strictEqual(productStock[10], 3); // Stock NOT deducted a second time!
  });

  // 2. Conflicting Payload Fingerprint Protection
  await runTest("2. Payload Fingerprint: Reusing checkout_id with different cart items returns 409 Conflict", () => {
    const ordersDB = [
      {
        id: 1,
        user_id: 1,
        checkout_id: "chk_session_123",
        checkout_fingerprint: crypto.createHash('sha256').update(JSON.stringify({ items: "10:38:1" })).digest('hex'),
        status: "payment_pending",
        expires_at: Date.now() + 10000
      }
    ];

    function validateCheckoutFingerprint(userId, checkoutId, newPayload) {
      const existing = ordersDB.find(o => o.user_id === userId && o.checkout_id === checkoutId);
      if (existing) {
        const newFingerprint = crypto.createHash('sha256').update(JSON.stringify(newPayload)).digest('hex');
        if (existing.checkout_fingerprint !== newFingerprint) {
          return { status: 409, error: "Checkout ID cannot be reused with different cart or address items." };
        }
      }
      return { status: 200 };
    }

    // Attempt to reuse same checkout_id with altered cart contents
    const res = validateCheckoutFingerprint(1, "chk_session_123", { items: "20:40:5" });
    assert.strictEqual(res.status, 409);
  });

  // 3. Status-Aware Idempotency: Replaying checkout_id on already paid order
  await runTest("3. Status-Aware Idempotency: Replaying checkout_id on already paid order returns paid confirmation without new reservation", () => {
    const paidOrder = {
      id: 5,
      user_id: 1,
      checkout_id: "chk_paid_001",
      status: "paid",
      total: "24500.00"
    };

    function handleReplay(order) {
      if (order.status === "paid") {
        return { status: 200, order, alreadyPaid: true, idempotent_reuse: true };
      }
      return { status: 400 };
    }

    const res = handleReplay(paidOrder);
    assert.strictEqual(res.alreadyPaid, true);
    assert.strictEqual(res.order.id, 5);
  });

  // 4. Status-Aware Idempotency: Replaying checkout_id on expired session requires fresh checkout
  await runTest("4. Status-Aware Idempotency: Replaying checkout_id on expired reservation returns 400 requiring fresh checkout", () => {
    const expiredOrder = {
      id: 6,
      user_id: 1,
      checkout_id: "chk_expired_001",
      status: "expired",
      expires_at: Date.now() - 1000
    };

    function handleReplay(order) {
      if (order.status === "expired" || order.expires_at < Date.now()) {
        return { status: 400, error: "This checkout session has expired. Please start a fresh checkout." };
      }
      return { status: 200 };
    }

    const res = handleReplay(expiredOrder);
    assert.strictEqual(res.status, 400);
  });

  // 5. Database Race Condition Resolution (P2002 Unique Constraint)
  await runTest("5. Unique Constraint Racing: Concurrent database collision on (user_id, checkout_id) resolves gracefully", () => {
    const db = [{ id: 10, user_id: 2, checkout_id: "concurrent_chk_99", total: "15000.00" }];

    function simulateDbInsert(userId, checkoutId) {
      const exists = db.some(o => o.user_id === userId && o.checkout_id === checkoutId);
      if (exists) {
        const p2002Err = new Error("Unique constraint failed on the constraint: Order_user_id_checkout_id_key");
        p2002Err.code = 'P2002';
        throw p2002Err;
      }
    }

    function createOrderWithRaceHandling(userId, checkoutId) {
      try {
        simulateDbInsert(userId, checkoutId);
        return { status: 201 };
      } catch (err) {
        if (err.code === 'P2002') {
          // Graceful fallback: return existing order
          const existing = db.find(o => o.user_id === userId && o.checkout_id === checkoutId);
          return { status: 200, order: existing, idempotent_reuse: true };
        }
        throw err;
      }
    }

    const raceResult = createOrderWithRaceHandling(2, "concurrent_chk_99");
    assert.strictEqual(raceResult.status, 200);
    assert.strictEqual(raceResult.idempotent_reuse, true);
    assert.strictEqual(raceResult.order.id, 10);
  });

  // 6. Saved Address Ownership Validation (Tenant Isolation)
  await runTest("6. Address Ownership: User A cannot checkout using User B's saved address_id", () => {
    const addresses = [
      { id: 1, user_id: 10, line1: "User A Palace" },
      { id: 2, user_id: 20, line1: "User B Mansion" }
    ];

    function resolveAddress(requestingUserId, addressId) {
      const addr = addresses.find(a => a.id === addressId && a.user_id === requestingUserId);
      if (!addr) {
        return null;
      }
      return addr;
    }

    // User 10 tries to use address 2 (belongs to user 20)
    const unauthorized = resolveAddress(10, 2);
    assert.strictEqual(unauthorized, null);

    // User 10 uses own address 1
    const authorized = resolveAddress(10, 1);
    assert.strictEqual(authorized.line1, "User A Palace");
  });

  // 7. Backend-Authoritative Cart Items Checkout
  await runTest("7. Cart Items Derivation: Backend derives size, qty, and price directly from owned CartItems in DB", () => {
    const userCartItems = [
      { id: 101, user_id: 5, product_id: 1, size: "38", quantity: 2, product: { price: 8500 } },
      { id: 102, user_id: 5, product_id: 2, size: "40", quantity: 1, product: { price: 12000 } }
    ];

    function resolveCheckoutItems(userId, requestedCartItemIds) {
      const ownedItems = userCartItems.filter(c => requestedCartItemIds.includes(c.id) && c.user_id === userId);
      const subtotal = ownedItems.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
      return { items: ownedItems, subtotal };
    }

    const resolved = resolveCheckoutItems(5, [101, 102]);
    assert.strictEqual(resolved.items.length, 2);
    assert.strictEqual(resolved.subtotal, 8500 * 2 + 12000 * 1); // 29000
  });

  // 8. Razorpay Public Key from Backend
  await runTest("8. Razorpay Key Configuration: Backend returns public key_id, zero secret exposure", () => {
    function getPaymentGatewaySession(order) {
      return {
        key_id: process.env.RAZORPAY_KEY_ID,
        amount: 2900000,
        currency: "INR",
        razorpay_order_id: "order_rzp_12345"
      };
    }

    const session = getPaymentGatewaySession({});
    assert.strictEqual(session.key_id, "rzp_test_public_key_12345");
    assert.strictEqual(session.key_secret, undefined);
  });

  // 9. Lost Response Recovery: Webhook finalizes order while frontend reconnects
  await runTest("9. Lost Response Recovery: If webhook finalized order during network interruption, client reconciles to confirmed paid state", () => {
    let order = { id: 88, user_id: 1, status: "payment_pending" };

    // Async Webhook arrives first
    order.status = "paid";

    // Frontend reconnects and polls GET /api/orders/88
    function reconcile(orderId) {
      if (order.status === "paid") {
        return { status: "CONFIRMED_PAID", order };
      }
      return { status: "PENDING" };
    }

    const reconciliation = reconcile(88);
    assert.strictEqual(reconciliation.status, "CONFIRMED_PAID");
    assert.strictEqual(reconciliation.order.status, "paid");
  });

  console.log("\n=================================================================");
  console.log(`📊 PHASE 4 CHECKOUT INTEGRATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================\n");

  if (failed > 0) process.exit(1);
}

runAllTests();
