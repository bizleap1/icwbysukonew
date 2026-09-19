const { pool } = require("../db");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "suko-super-secret-jwt-key-change-in-production";

function makeToken(userId, role = "customer", email = "test@indiancorporatewear.com") {
  return jwt.sign({ userId, role, email, name: "Test Patron" }, JWT_SECRET, { expiresIn: "1h" });
}

const sampleBase64Png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function runTests() {
  console.log("=== Testing Manual UPI Payment Strict Validation & Duplicate UTR Detection ===");

  // Find or create test user
  const userRes = await pool.query("SELECT id, email FROM users ORDER BY id ASC LIMIT 1");
  const testUserId = userRes.rows.length > 0 ? userRes.rows[0].id : 1;
  const testUserEmail = userRes.rows.length > 0 ? userRes.rows[0].email : "test@indiancorporatewear.com";

  const customerToken = makeToken(testUserId, "customer", testUserEmail);
  const adminToken = makeToken(testUserId, "admin", testUserEmail);

  let order1Id = null;
  let order2Id = null;

  try {
    // 1. Create two test orders
    const res1 = await pool.query(
      `INSERT INTO orders (user_id, status, payment_status, total, payment_method, name, email, line1, city, state, pincode)
       VALUES ($1, 'pending_payment', 'pending_verification', 8500, 'manual_upi', 'Test Patron 1', $2, '12 Luxury Way', 'Mumbai', 'Maharashtra', '400001')
       RETURNING id, status, payment_status, payment_method`,
      [testUserId, testUserEmail]
    );
    order1Id = res1.rows[0].id;
    console.log(`✓ Created test Order 1 (#SUKO-${1000 + order1Id}) with status: ${res1.rows[0].status}, payment_method: ${res1.rows[0].payment_method}`);

    const res2 = await pool.query(
      `INSERT INTO orders (user_id, status, payment_status, total, payment_method, name, email, line1, city, state, pincode)
       VALUES ($1, 'pending_payment', 'pending_verification', 12000, 'manual_upi', 'Test Patron 2', $2, '15 Royal Crescent', 'Mumbai', 'Maharashtra', '400001')
       RETURNING id, status, payment_status, payment_method`,
      [testUserId, testUserEmail]
    );
    order2Id = res2.rows[0].id;
    console.log(`✓ Created test Order 2 (#SUKO-${1000 + order2Id}) with status: ${res2.rows[0].status}, payment_method: ${res2.rows[0].payment_method}`);

    // Helper to simulate request to Express app
    const express = require("express");
    const app = express();
    app.use(express.json({ limit: "10mb" }));
    const ordersRouter = require("../routes/orders");
    app.use("/api/orders", ordersRouter);

    const http = require("http");
    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    async function apiPost(path, body, token) {
      const res = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, ok: res.ok, data };
    }

    async function apiGet(path, token) {
      const res = await fetch(`${baseUrl}${path}`, {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, ok: res.ok, data };
    }

    // 2. Test Empty UTR Validation
    console.log("\n--- Testing Edge Case 1: Empty UTR ---");
    const emptyUtrRes = await apiPost(`/api/orders/${order1Id}/submit-payment-proof`, {
      transaction_id: "   ",
      screenshot: sampleBase64Png
    }, customerToken);
    console.log(`Empty UTR response status: ${emptyUtrRes.status}, error: "${emptyUtrRes.data.error}"`);
    if (emptyUtrRes.status === 400 && emptyUtrRes.data.error === "Please enter your transaction ID.") {
      console.log("✓ Empty UTR properly blocked with required message: 'Please enter your transaction ID.'");
    } else {
      throw new Error(`Empty UTR validation failed: ${JSON.stringify(emptyUtrRes)}`);
    }

    // 3. Test Short UTR Validation
    console.log("\n--- Testing Edge Case 2: Short UTR (<6 chars) ---");
    const shortUtrRes = await apiPost(`/api/orders/${order1Id}/submit-payment-proof`, {
      transaction_id: "123",
      screenshot: sampleBase64Png
    }, customerToken);
    console.log(`Short UTR response status: ${shortUtrRes.status}, error: "${shortUtrRes.data.error}"`);
    if (shortUtrRes.status === 400 && shortUtrRes.data.error.includes("at least 6 characters")) {
      console.log("✓ Short UTR properly blocked with length message");
    } else {
      throw new Error(`Short UTR validation failed: ${JSON.stringify(shortUtrRes)}`);
    }

    // 4. Test Missing Screenshot Validation
    console.log("\n--- Testing Edge Case 3: Missing Screenshot ---");
    const noPicRes = await apiPost(`/api/orders/${order1Id}/submit-payment-proof`, {
      transaction_id: "UTR9876543210",
      screenshot: ""
    }, customerToken);
    console.log(`Missing Screenshot response status: ${noPicRes.status}, error: "${noPicRes.data.error}"`);
    if (noPicRes.status === 400 && noPicRes.data.error === "Please upload payment screenshot.") {
      console.log("✓ Missing screenshot properly blocked with required message: 'Please upload payment screenshot.'");
    } else {
      throw new Error(`Missing screenshot validation failed: ${JSON.stringify(noPicRes)}`);
    }

    // 5. Test Invalid Screenshot format
    console.log("\n--- Testing Edge Case 4: Invalid format (non-image) ---");
    const badFormatRes = await apiPost(`/api/orders/${order1Id}/submit-payment-proof`, {
      transaction_id: "UTR9876543210",
      screenshot: "data:application/pdf;base64,JVBERi0xLjQKJ..."
    }, customerToken);
    console.log(`Invalid format response status: ${badFormatRes.status}, error: "${badFormatRes.data.error}"`);
    if (badFormatRes.status === 400 && badFormatRes.data.error.includes("Allowed formats: JPG, JPEG, PNG, WebP")) {
      console.log("✓ Invalid file format properly blocked with format message");
    } else {
      throw new Error(`Invalid format validation failed: ${JSON.stringify(badFormatRes)}`);
    }

    // 6. Submit Valid Proof for Order 1
    const testUtr = `UTR${Date.now()}`;
    console.log(`\n--- Testing Valid Proof Submission for Order 1 with UTR: ${testUtr} ---`);
    const validRes1 = await apiPost(`/api/orders/${order1Id}/submit-payment-proof`, {
      transaction_id: testUtr,
      screenshot: sampleBase64Png
    }, customerToken);
    console.log(`Valid submission response status: ${validRes1.status}, success: ${validRes1.data.success}`);
    if (validRes1.status === 200 && validRes1.data.success) {
      console.log(`✓ Order 1 successfully submitted. Status: ${validRes1.data.order.status}, payment_status: ${validRes1.data.order.payment_status}, is_duplicate_utr: ${validRes1.data.order.is_duplicate_utr}`);
    } else {
      throw new Error(`Valid submission failed: ${JSON.stringify(validRes1)}`);
    }

    // 7. Check UTR endpoint for duplicate detection
    console.log("\n--- Testing GET /api/orders/check-utr endpoint ---");
    const checkDup = await apiGet(`/api/orders/check-utr?utr=${testUtr}&order_id=${order2Id}`, customerToken);
    console.log(`check-utr result for existing UTR: is_duplicate = ${checkDup.data.is_duplicate}, matched = ${checkDup.data.matched_order_number}`);
    if (checkDup.data.is_duplicate === true) {
      console.log("✓ check-utr correctly flagged duplicate UTR in real-time");
    } else {
      throw new Error(`check-utr failed to flag duplicate: ${JSON.stringify(checkDup)}`);
    }

    const checkUnique = await apiGet(`/api/orders/check-utr?utr=NEW_UNIQUE_UTR_12345&order_id=${order2Id}`, customerToken);
    console.log(`check-utr result for new UTR: is_duplicate = ${checkUnique.data.is_duplicate}`);
    if (checkUnique.data.is_duplicate === false) {
      console.log("✓ check-utr correctly passed unique UTR");
    } else {
      throw new Error(`check-utr falsely flagged unique UTR: ${JSON.stringify(checkUnique)}`);
    }

    // 8. Submit Proof for Order 2 with the SAME UTR -> Should be accepted into verification queue but flagged as DUPLICATE for Admin
    console.log("\n--- Testing Duplicate UTR Submission for Order 2 ---");
    const dupSubmitRes = await apiPost(`/api/orders/${order2Id}/submit-payment-proof`, {
      transaction_id: testUtr,
      screenshot: sampleBase64Png
    }, customerToken);
    console.log(`Duplicate submission response status: ${dupSubmitRes.status}, is_duplicate_utr: ${dupSubmitRes.data.is_duplicate_utr}, duplicate_utr_order_id: ${dupSubmitRes.data.duplicate_utr_order_id}`);
    if (dupSubmitRes.status === 200 && dupSubmitRes.data.is_duplicate_utr === true && dupSubmitRes.data.duplicate_utr_order_id === order1Id) {
      console.log(`✓ Order 2 safely submitted to verification queue with is_duplicate_utr = TRUE (Matches Order #SUKO-${1000 + order1Id})! Admin will see security alert badge.`);
    } else {
      throw new Error(`Duplicate UTR detection failed: ${JSON.stringify(dupSubmitRes)}`);
    }

    // 9. Admin Verifies Order 1
    console.log("\n--- Testing Admin Payment Approval ---");
    const verifyRes = await apiPost(`/api/orders/${order1Id}/verify-payment`, {}, adminToken);
    console.log(`Verify response status: ${verifyRes.status}, status: ${verifyRes.data.order?.status}, payment_status: ${verifyRes.data.order?.payment_status}`);
    if (verifyRes.status === 200 && verifyRes.data.order?.status === "paid" && verifyRes.data.order?.payment_status === "verified") {
      console.log("✓ Admin successfully approved payment: Payment Verified → Order Confirmed (paid, verified)");
    } else {
      throw new Error(`Payment verification failed: ${JSON.stringify(verifyRes)}`);
    }

    // 10. Admin Rejects Order 2
    console.log("\n--- Testing Admin Payment Rejection ---");
    const rejectRes = await apiPost(`/api/orders/${order2Id}/reject-payment`, {
      reason: "Duplicate UTR detected. Same transaction proof submitted on another order.",
      admin_note: "Flagged by security duplicate check"
    }, adminToken);
    console.log(`Reject response status: ${rejectRes.status}, status: ${rejectRes.data.order?.status}, payment_status: ${rejectRes.data.order?.payment_status}`);
    if (rejectRes.status === 200 && rejectRes.data.order?.status === "payment_verification_failed" && rejectRes.data.order?.payment_status === "rejected") {
      console.log("✓ Admin successfully rejected payment: Payment Rejected → Customer notified (payment_verification_failed, rejected)");
    } else {
      throw new Error(`Payment rejection failed: ${JSON.stringify(rejectRes)}`);
    }

    server.close();
    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! Cleaned up test server.");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Test execution failed:", err);
    process.exit(1);
  } finally {
    // Clean up created test orders
    if (order1Id || order2Id) {
      await pool.query("DELETE FROM orders WHERE id IN ($1, $2)", [order1Id || 0, order2Id || 0]).catch(() => {});
    }
  }
}

runTests();
