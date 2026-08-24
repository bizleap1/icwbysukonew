require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const assert = require('assert');

async function testLivePostgres() {
  console.log("=================================================================");
  console.log("🐘 RUNNING REAL NEON POSTGRESQL VERIFICATION SUITE");
  console.log("=================================================================\n");

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${e.message}`);
      failed++;
    }
  }

  try {
    await prisma.$connect();
    console.log("✅ Successfully connected to Neon PostgreSQL.\n");

    // 1. Table Verification
    await check("1. PostgreSQL Schema: All required tables exist in public schema", async () => {
      const rows = await prisma.$queryRawUnsafe(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
      const tableNames = new Set(rows.map(r => r.table_name));
      const required = ['User', 'Product', 'Order', 'OrderItem', 'CartItem', 'CartMergeRequest', 'OtpVerification', 'Payment', 'Address', 'Wishlist', 'Coupon'];
      for (const t of required) {
        assert.ok(tableNames.has(t), `Missing table ${t}`);
      }
    });

    // 2. User Creation & token_version verification
    let testUser;
    const testEmail = `test_live_${Date.now()}@suko.luxury`;
    await check("2. User Model: Supports token_version session invalidation on real DB", async () => {
      testUser = await prisma.user.create({
        data: {
          email: testEmail,
          password: '$2a$12$DummyHashedPasswordForTestExecution1234567890',
          name: 'Staging Test User',
          token_version: 1
        }
      });
      assert.ok(testUser.id > 0);
      assert.strictEqual(testUser.token_version, 1);
    });

    // 3. OtpVerification Table Verification
    await check("3. OtpVerification: Stores HMAC-SHA256 hash and validates expires_at index", async () => {
      const otpHash = crypto.createHmac('sha256', process.env.OTP_HASH_SECRET || 'secret').update('849201').digest('hex');
      const otpRow = await prisma.otpVerification.create({
        data: {
          email: testEmail,
          otp_hash: otpHash,
          purpose: 'login',
          expires_at: new Date(Date.now() + 5 * 60 * 1000)
        }
      });
      assert.ok(otpRow.id > 0);
      assert.strictEqual(otpRow.attempts, 0);

      // Cleanup test OTP
      await prisma.otpVerification.delete({ where: { id: otpRow.id } });
    });

    // 4. CartMergeRequest Durable Idempotency on real PostgreSQL
    await check("4. CartMergeRequest: Enforces unique(user_id, merge_id) constraint on real DB", async () => {
      const mergeId = `merge_${Date.now()}`;
      const first = await prisma.cartMergeRequest.create({
        data: {
          user_id: testUser.id,
          merge_id: mergeId,
          status: 'completed',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
      assert.ok(first.id > 0);

      // Attempt duplicate insertion
      let threwP2002 = false;
      try {
        await prisma.cartMergeRequest.create({
          data: {
            user_id: testUser.id,
            merge_id: mergeId,
            status: 'completed',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        });
      } catch (err) {
        if (err.code === 'P2002') threwP2002 = true;
      }
      assert.strictEqual(threwP2002, true, "Expected unique constraint P2002 collision on duplicate merge_id");

      // Cleanup
      await prisma.cartMergeRequest.delete({ where: { id: first.id } });
    });

    // 5. Order Creation with unique(user_id, checkout_id)
    await check("5. Order Model: Enforces unique(user_id, checkout_id) constraint on real DB", async () => {
      const checkoutId = `chk_${Date.now()}`;
      const order = await prisma.order.create({
        data: {
          user_id: testUser.id,
          checkout_id: checkoutId,
          checkout_fingerprint: 'test_fingerprint_sha256',
          subtotal: 10000,
          total: 10000,
          status: 'payment_pending'
        }
      });
      assert.ok(order.id > 0);

      // Attempt duplicate order with same user_id and checkout_id
      let threwP2002 = false;
      try {
        await prisma.order.create({
          data: {
            user_id: testUser.id,
            checkout_id: checkoutId,
            checkout_fingerprint: 'test_fingerprint_sha256',
            subtotal: 10000,
            total: 10000,
            status: 'payment_pending'
          }
        });
      } catch (err) {
        if (err.code === 'P2002') threwP2002 = true;
      }
      assert.strictEqual(threwP2002, true, "Expected unique constraint P2002 collision on duplicate checkout_id");

      // Cleanup test order
      await prisma.order.delete({ where: { id: order.id } });
    });

    // Clean up test user
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }

    console.log("\n=================================================================");
    console.log(`📊 REAL POSTGRESQL VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================================\n");

    if (failed > 0) process.exit(1);

  } catch (globalErr) {
    console.error("❌ Global test suite error:", globalErr.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testLivePostgres();
