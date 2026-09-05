const express = require("express");
const { pool } = require("../db");
const { requireAuth, requireAdmin } = require("../auth");
const { validateCreateOrder } = require("../middleware/validate");

const router = express.Router();

// Shape a raw order + item rows into the JSON shape the frontend expects
function formatOrder(orderRow, itemRows, userRow) {
  return {
    id: orderRow.id,
    status: orderRow.status,
    total: Number(orderRow.total),
    payment_method: orderRow.payment_method,
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
       VALUES ($1, 'payment_pending', $2, 'upi_qr', $3, $4, $5, $6, $7, $8, $9)
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

// PATCH /api/orders/:id/status -- admin updates status
router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const allowed = ["payment_pending", "paid", "processing", "cancel_requested", "completed", "cancelled"];
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
