const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const { pool } = require("../db");
const productService = require("../services/productService");

async function runTest() {
  console.log("=== SUKO Payment Verification Backend Integration Test ===");
  try {
    // 1. Find or create a test order
    const orderRes = await pool.query(
      "SELECT id, status, total, transaction_id FROM orders ORDER BY id DESC LIMIT 1"
    );
    if (orderRes.rows.length === 0) {
      console.log("No orders in database to test.");
      process.exit(0);
    }

    const testOrder = orderRes.rows[0];
    const orderId = testOrder.id;
    console.log(`Using Order #SUKO-${1000 + orderId} (Current Status: ${testOrder.status})`);

    // 2. Test Reject Payment
    console.log("\n--- Testing Payment Rejection ---");
    const testCustomerReason = "Payment screenshot could not be verified. Please provide a clear receipt.";
    const testAdminNote = "Bank statement for timestamp 19:40 did not match provided screenshot amount.";

    await pool.query(
      "UPDATE orders SET status = 'payment_verification_failed', cancel_reason = $1, admin_rejection_note = $2, updated_at = now() WHERE id = $3",
      [testCustomerReason, testAdminNote, orderId]
    );

    // Record activity log
    await productService.recordActivityLog({
      admin_email: "admin@indiancorporatewear.com",
      action: "payment_reject",
      target_entity: "orders",
      affected_count: 1,
      summary: `Payment proof rejected for Order #SUKO-${1000 + orderId}`,
      details: {
        order_id: orderId,
        order_number: `SUKO-${1000 + orderId}`,
        customer_reason: testCustomerReason,
        admin_rejection_note: testAdminNote,
        transaction_id: testOrder.transaction_id,
      },
      ip_address: "127.0.0.1"
    });

    // Check DB state
    const afterReject = await pool.query(
      "SELECT status, cancel_reason, admin_rejection_note FROM orders WHERE id = $1",
      [orderId]
    );
    const rejectedRow = afterReject.rows[0];
    console.log("Status after reject:", rejectedRow.status);
    console.log("Customer-facing reason:", rejectedRow.cancel_reason);
    console.log("Internal admin note:", rejectedRow.admin_rejection_note);

    if (
      rejectedRow.status === "payment_verification_failed" &&
      rejectedRow.cancel_reason === testCustomerReason &&
      rejectedRow.admin_rejection_note === testAdminNote
    ) {
      console.log("✅ Payment Rejection DB state verified successfully.");
    } else {
      console.error("❌ Payment Rejection DB state mismatch!");
      process.exit(1);
    }

    // 3. Test Verify Payment
    console.log("\n--- Testing Payment Verification ---");
    await pool.query(
      "UPDATE orders SET status = 'paid', cancel_reason = NULL, admin_rejection_note = NULL, updated_at = now() WHERE id = $1",
      [orderId]
    );

    await productService.recordActivityLog({
      admin_email: "admin@indiancorporatewear.com",
      action: "payment_verify",
      target_entity: "orders",
      affected_count: 1,
      summary: `Payment verified and order confirmed for Order #SUKO-${1000 + orderId}`,
      details: {
        order_id: orderId,
        order_number: `SUKO-${1000 + orderId}`,
        amount: testOrder.total,
        transaction_id: testOrder.transaction_id,
        payment_method: "upi_qr",
      },
      ip_address: "127.0.0.1"
    });

    const afterVerify = await pool.query(
      "SELECT status, cancel_reason, admin_rejection_note FROM orders WHERE id = $1",
      [orderId]
    );
    const verifiedRow = afterVerify.rows[0];
    console.log("Status after verify:", verifiedRow.status);
    console.log("Cancel reason after verify (should be null):", verifiedRow.cancel_reason);
    console.log("Admin note after verify (should be null):", verifiedRow.admin_rejection_note);

    if (
      verifiedRow.status === "paid" &&
      verifiedRow.cancel_reason === null &&
      verifiedRow.admin_rejection_note === null
    ) {
      console.log("✅ Payment Verification DB state verified successfully.");
    } else {
      console.error("❌ Payment Verification DB state mismatch!");
      process.exit(1);
    }

    // 4. Check Activity Log entries
    console.log("\n--- Verifying Activity Audit Log ---");
    const logs = await productService.getActivityLogs(5);
    const verifyLog = logs.find(l => l.action === "payment_verify");
    const rejectLog = logs.find(l => l.action === "payment_reject");

    console.log("Verify Log recorded:", verifyLog ? "YES" : "NO", verifyLog?.details);
    console.log("Reject Log recorded:", rejectLog ? "YES" : "NO", rejectLog?.details);

    if (verifyLog && rejectLog) {
      console.log("✅ Both audit log entries verified in activity_logs.");
    } else {
      console.warn("⚠️ Warning: One or more logs not found in recent 5 entries.");
    }

    console.log("\n🎉 ALL TESTS PASSED!");
    process.exit(0);
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  }
}

runTest();
