const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pool } = require("../db");
const { requireAuth, requireAdmin } = require("../auth");
const { validateCreateOrder } = require("../middleware/validate");
const { sendOrderInvoiceEmail } = require("../services/emailService");

const router = express.Router();

const UPLOAD_PROOF_DIR = path.join(__dirname, "../../uploads/payment-proofs");
if (!fs.existsSync(UPLOAD_PROOF_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_PROOF_DIR, { recursive: true });
  } catch (dirErr) {
    console.warn("Failed to create UPLOAD_PROOF_DIR:", dirErr.message);
  }
}

// Shape a raw order + item rows into the JSON shape the frontend expects
function formatOrder(orderRow, itemRows, userRow) {
  return {
    id: orderRow.id,
    status: orderRow.status,
    payment_status: orderRow.status,
    total: Number(orderRow.total),
    payment_method: orderRow.payment_method || "upi_qr",
    transaction_id: orderRow.transaction_id || null,
    utr: orderRow.transaction_id || null,
    payment_screenshot_url: orderRow.payment_screenshot_url || null,
    created_at: orderRow.created_at,
    updated_at: orderRow.updated_at,
    cancel_reason: orderRow.cancel_reason,
    address: {
      name: orderRow.name,
      phone: orderRow.phone,
      line1: orderRow.line1,
      city: orderRow.city,
      state: orderRow.state,
      pincode: orderRow.pincode,
    },
    // Flat aliases used by the checkout confirmation screen
    shipping_name: orderRow.name,
    shipping_phone: orderRow.phone,
    shipping_line1: orderRow.line1,
    shipping_city: orderRow.city,
    shipping_state: orderRow.state,
    shipping_pincode: orderRow.pincode,
    user: userRow
      ? {
          id: userRow.id,
          name: userRow.name,
          email: userRow.email,
          phone: userRow.phone,
          addresses: [{ phone: orderRow.phone }],
        }
      : {
          id: null,
          name: orderRow.name,
          email: orderRow.email,
          phone: orderRow.phone,
          addresses: [{ phone: orderRow.phone }],
        },
    items: itemRows.map((it) => ({
      id: it.id,
      quantity: it.quantity,
      size: it.size,
      price_at_purchase: Number(it.price_at_purchase),
      product: {
        id: it.product_id,
        name: it.product_name,
        image_url: it.product_image_url,
        price: Number(it.price_at_purchase),
        category: { name: it.category_name || "Atelier" },
      },
    })),
  };
}

async function getOrderWithItems(orderId) {
  const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
  const order = orderRes.rows[0];
  if (!order) return null;

  const itemsRes = await pool.query(
    "SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC",
    [orderId]
  );

  let user = null;
  if (order.user_id) {
    const userRes = await pool.query(
      "SELECT id, name, email, phone FROM users WHERE id = $1",
      [order.user_id]
    );
    user = userRes.rows[0] || null;
  }

  return formatOrder(order, itemsRes.rows, user);
}

// POST /api/orders  -- create a new order (checkout)
router.post("/", requireAuth, validateCreateOrder, async (req, res) => {
  const client = await pool.connect();
  try {
    const { items, name, phone, line1, city, state, pincode } = req.body;

    const total = items.reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );

    await client.query("BEGIN");

    const orderRes = await client.query(
      `INSERT INTO orders (user_id, status, total, payment_method, name, phone, email, line1, city, state, pincode)
       VALUES ($1, 'pending_payment', $2, 'upi_qr', $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.user.userId,
        total,
        name || req.user.name || "",
        phone || "",
        req.user.email || "",
        line1 || "",
        city || "",
        state || "",
        pincode || "",
      ]
    );
    const order = orderRes.rows[0];

    for (const it of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image_url, category_name, size, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          order.id,
          String(it.product_id || ""),
          it.name || "Atelier Garment",
          it.image_url || it.image || null,
          it.category_name || null,
          it.size || "",
          Number(it.quantity) || 1,
          Number(it.price) || 0,
        ]
      );
    }

    await client.query("COMMIT");

    const fullOrder = await getOrderWithItems(order.id);

    res.status(201).json(fullOrder);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create order error:", err);
    res.status(500).json({ error: "Failed to create order. Please try again." });
  } finally {
    client.release();
  }
});

// GET /api/orders -- current customer's own orders
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.userId]
    );
    const orders = await Promise.all(result.rows.map((r) => getOrderWithItems(r.id)));
    res.json(orders);
  } catch (err) {
    console.error("List my orders error:", err);
    res.status(500).json({ error: "Failed to load your orders." });
  }
});

// GET /api/orders/all -- admin: every order
router.get("/all", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT id FROM orders ORDER BY created_at DESC");
    const orders = await Promise.all(result.rows.map((r) => getOrderWithItems(r.id)));
    res.json(orders);
  } catch (err) {
    console.error("List all orders error:", err);
    res.status(500).json({ error: "Failed to load orders." });
  }
});

// GET /api/orders/:id -- single order (owner or admin)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const raw = await pool.query("SELECT user_id FROM orders WHERE id = $1", [orderId]);
    if (raw.rows.length === 0) return res.status(404).json({ error: "Order not found." });

    const isOwner = raw.rows[0].user_id === req.user.userId;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Not authorized to view this order." });

    const order = await getOrderWithItems(orderId);
    res.json(order);
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ error: "Failed to load order." });
  }
});

// POST /api/orders/:id/submit-payment-proof -- customer submits transaction ID and screenshot
router.post("/:id/submit-payment-proof", requireAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (!orderId) return res.status(400).json({ error: "Invalid order ID." });

    const raw = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (raw.rows.length === 0) return res.status(404).json({ error: "Order not found." });
    const order = raw.rows[0];

    // Verify ownership
    if (order.user_id !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to submit payment details for this order." });
    }

    if (order.status === "paid") {
      return res.status(400).json({ error: "Order has already been verified and paid." });
    }

    const { transaction_id, utr, screenshot } = req.body;
    const finalTxId = (transaction_id || utr || "").trim();

    if (!finalTxId) {
      return res.status(400).json({ error: "Transaction ID / UTR is required." });
    }

    if (!screenshot || typeof screenshot !== "string") {
      return res.status(400).json({ error: "Payment screenshot is required." });
    }

    // Validate screenshot format: JPG, JPEG, PNG, WebP
    const match = screenshot.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/i);
    if (!match) {
      return res.status(400).json({
        error: "Invalid screenshot format. Allowed formats: JPG, JPEG, PNG, WebP.",
      });
    }

    const mimeType = match[1].toLowerCase();
    const rawFormat = match[2].toLowerCase();
    const ext = rawFormat === "jpeg" ? "jpg" : rawFormat;
    const base64Data = match[3];

    // Validate maximum file size (5 MB)
    const fileBuffer = Buffer.from(base64Data, "base64");
    if (fileBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "Screenshot file size exceeds the 5 MB limit." });
    }

    // Save screenshot safely to protected proofs folder
    const filename = `proof_order_${order.id}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${ext}`;
    const filePath = path.join(UPLOAD_PROOF_DIR, filename);
    fs.writeFileSync(filePath, fileBuffer);

    // Save reference in DB
    await pool.query(
      `UPDATE orders
       SET status = 'payment_verification_pending',
           transaction_id = $1,
           payment_screenshot_url = $2,
           updated_at = now()
       WHERE id = $3`,
      [finalTxId, filename, order.id]
    );

    const updatedOrder = await getOrderWithItems(order.id);

    return res.json({
      success: true,
      message: "Payment details received for verification.",
      order: updatedOrder,
    });
  } catch (err) {
    console.error("Submit payment proof error:", err);
    res.status(500).json({ error: "Failed to submit payment details. Please try again." });
  }
});

// GET /api/orders/:id/payment-proof -- securely serve proof screenshot (protected view)
router.get("/:id/payment-proof", requireAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const raw = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (raw.rows.length === 0) return res.status(404).json({ error: "Order not found." });
    const order = raw.rows[0];

    const isOwner = order.user_id === req.user.userId;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Access denied. You cannot view this payment proof." });
    }

    if (!order.payment_screenshot_url) {
      return res.status(404).json({ error: "No payment screenshot found for this order." });
    }

    const safeFilename = path.basename(order.payment_screenshot_url);
    const filePath = path.join(UPLOAD_PROOF_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Payment screenshot file not found." });
    }

    const ext = path.extname(safeFilename).toLowerCase();
    const mimeMap = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };
    const mimeType = mimeMap[ext] || "application/octet-stream";

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "private, max-age=86400");
    res.setHeader("X-Content-Type-Options", "nosniff");
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error("Serve payment proof error:", err);
    res.status(500).json({ error: "Failed to retrieve payment screenshot." });
  }
});

// POST /api/orders/:id/verify-payment -- admin verifies payment and transitions to paid
router.post("/:id/verify-payment", requireAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const raw = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (raw.rows.length === 0) return res.status(404).json({ error: "Order not found." });

    await pool.query(
      "UPDATE orders SET status = 'paid', cancel_reason = NULL, updated_at = now() WHERE id = $1",
      [orderId]
    );

    const fullOrder = await getOrderWithItems(orderId);

    // Asynchronously dispatch luxury paid tax invoice email
    if (fullOrder) {
      sendOrderInvoiceEmail(fullOrder).catch((mailErr) => {
        console.warn("⚠️  [EmailService] Paid invoice email dispatch failed:", mailErr.message);
      });
    }

    res.json({
      success: true,
      message: "Payment verified successfully. Order confirmed as paid.",
      order: fullOrder,
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ error: "Failed to verify payment." });
  }
});

// POST /api/orders/:id/reject-payment -- admin rejects payment proof
router.post("/:id/reject-payment", requireAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { reason } = req.body;
    const raw = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (raw.rows.length === 0) return res.status(404).json({ error: "Order not found." });

    const rejectReason = reason || "Payment not found or transaction ID mismatch in merchant account.";

    await pool.query(
      "UPDATE orders SET status = 'payment_verification_failed', cancel_reason = $1, updated_at = now() WHERE id = $2",
      [rejectReason, orderId]
    );

    const fullOrder = await getOrderWithItems(orderId);

    res.json({
      success: true,
      message: "Payment verification marked as failed. Customer can re-submit.",
      order: fullOrder,
    });
  } catch (err) {
    console.error("Reject payment error:", err);
    res.status(500).json({ error: "Failed to reject payment." });
  }
});

// PATCH /api/orders/:id/status -- admin updates status
router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const allowed = [
      "pending_payment",
      "payment_pending",
      "payment_verification_pending",
      "paid",
      "payment_verification_failed",
      "processing",
      "cancel_requested",
      "completed",
      "cancelled",
    ];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const result = await pool.query(
      "UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *",
      [status, orderId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Order not found." });

    res.json({ order: result.rows[0] });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ error: "Failed to update order status." });
  }
});

// PATCH /api/orders/:id/cancel -- customer requests cancellation
router.patch("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { reason } = req.body;

    const raw = await pool.query("SELECT user_id FROM orders WHERE id = $1", [orderId]);
    if (raw.rows.length === 0) return res.status(404).json({ error: "Order not found." });
    if (raw.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized to cancel this order." });
    }

    const result = await pool.query(
      "UPDATE orders SET status = 'cancel_requested', cancel_reason = $1, updated_at = now() WHERE id = $2 RETURNING *",
      [reason || "Not specified", orderId]
    );
    res.json({ order: result.rows[0] });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({ error: "Failed to submit cancellation request." });
  }
});

// PUT /api/orders/:id -- admin edits order (total / status / cancel_reason)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { total, status, cancel_reason } = req.body;

    const result = await pool.query(
      `UPDATE orders SET
         total = COALESCE($1, total),
         status = COALESCE($2, status),
         cancel_reason = COALESCE($3, cancel_reason),
         updated_at = now()
       WHERE id = $4
       RETURNING *`,
      [total, status, cancel_reason, orderId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Order not found." });

    res.json({ order: result.rows[0] });
  } catch (err) {
    console.error("Edit order error:", err);
    res.status(500).json({ error: "Failed to update order." });
  }
});

// DELETE /api/orders/:id -- admin deletes order
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const result = await pool.query("DELETE FROM orders WHERE id = $1 RETURNING id", [orderId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Order not found." });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({ error: "Failed to delete order." });
  }
});

module.exports = router;
