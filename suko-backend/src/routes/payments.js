const express = require("express");
const crypto = require("crypto");
const { pool } = require("../db");
const { requireAuth } = require("../auth");
const { sendOrderInvoiceEmail } = require("../services/emailService");

const router = express.Router();

// Helper to get formatted order (matches orders.js)
async function getOrderDetails(orderId) {
  const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
  const order = orderRes.rows[0];
  if (!order) return null;

  const itemsRes = await pool.query(
    "SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC",
    [orderId]
  );

  return {
    id: order.id,
    status: order.status,
    total: Number(order.total),
    payment_method: order.payment_method,
    created_at: order.created_at,
    updated_at: order.updated_at,
    cancel_reason: order.cancel_reason,
    shipping_name: order.name,
    shipping_phone: order.phone,
    shipping_line1: order.line1,
    shipping_city: order.city,
    shipping_state: order.state,
    shipping_pincode: order.pincode,
    items: itemsRes.rows.map((it) => ({
      id: it.id,
      quantity: it.quantity,
      size: it.size,
      price_at_purchase: Number(it.price_at_purchase),
      product: {
        id: it.product_id,
        name: it.product_name,
        image_url: it.product_image_url,
        price: Number(it.price_at_purchase),
      },
    })),
  };
}

// POST /api/payments/create-order
router.post("/create-order", requireAuth, async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({ error: "Order ID is required." });
    }

    const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [order_id]);
    const order = orderRes.rows[0];
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const amountInPaise = Math.round(Number(order.total) * 100);

    // If live/test Razorpay credentials exist, call Razorpay API
    if (keyId && keySecret) {
      try {
        const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: "INR",
            receipt: `rcpt_${order.id}`,
            notes: { order_id: String(order.id) },
          }),
        });

        if (rzpRes.ok) {
          const rzpOrder = await rzpRes.json();
          return res.json({
            razorpay_order_id: rzpOrder.id,
            key_id: keyId,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency || "INR",
          });
        }
      } catch (rzpErr) {
        console.warn("Razorpay API call failed, falling back to simulated order session:", rzpErr.message);
      }
    }

    // Development / fallback order session
    return res.json({
      razorpay_order_id: `order_dev_${order.id}_${Date.now()}`,
      key_id: keyId || "rzp_test_dev",
      amount: amountInPaise,
      currency: "INR",
    });
  } catch (err) {
    console.error("Create payment order error:", err);
    res.status(500).json({ error: "Failed to initialize payment gateway." });
  }
});

// POST /api/payments/verify
router.post("/verify", requireAuth, async (req, res) => {
  return res.status(403).json({
    error: "Automated payment verification is disabled. All orders require manual UPI verification by SUKO Atelier admin concierge.",
  });
});

module.exports = router;
