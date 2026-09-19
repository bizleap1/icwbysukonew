const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { pool } = require("../db");
const { requireAuth, requireAdmin } = require("../auth");
const { validateCreateOrder } = require("../middleware/validate");
const {
  sendOrderInvoiceEmail,
  sendOrderConfirmationEmail,
  sendPaymentReceiptEmail,
  sendShippingUpdateEmail,
  sendBroadcastEmail
} = require("../services/emailService");
const {
  renderDocumentHtml,
  generateDocumentPdf
} = require("../services/documentService");
const {
  getOrderDocuments,
  allocateInvoiceNumber
} = require("../services/brandSettingsService");
const {
  uploadImageBuffer,
  isCloudinaryConfigured
} = require("../services/cloudinaryService");
const productService = require("../services/productService");

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
function formatOrder(orderRow, itemRows = [], userRow) {
  const calculatedItemsTotal = (itemRows || []).reduce(
    (sum, it) => sum + (Number(it.price_at_purchase) || Number(it.price) || 0) * (Number(it.quantity) || 1),
    0
  );
  let resolvedTotal = Number(orderRow.total);
  if (!resolvedTotal || isNaN(resolvedTotal) || resolvedTotal <= 0) {
    resolvedTotal = calculatedItemsTotal > 0 ? Math.max(0, calculatedItemsTotal - (Number(orderRow.discount) || 0)) : 4800;
  }

  const resolvedPaymentStatus = orderRow.payment_status || (
    orderRow.status === "paid" || orderRow.status === "completed"
      ? "verified"
      : (orderRow.status === "payment_verification_failed"
          ? "rejected"
          : "pending_verification")
  );

  return {
    id: orderRow.id,
    status: orderRow.status,
    payment_status: resolvedPaymentStatus,
    total: resolvedTotal,
    payment_method: orderRow.payment_method || "manual_upi",
    transaction_id: orderRow.transaction_id || null,
    utr: orderRow.transaction_id || null,
    payment_screenshot_url: orderRow.payment_screenshot_url || null,
    is_duplicate_utr: Boolean(orderRow.is_duplicate_utr),
    duplicate_utr_order_id: orderRow.duplicate_utr_order_id || null,
    invoice_number: orderRow.invoice_number || null,
    created_at: orderRow.created_at,
    updated_at: orderRow.updated_at,
    cancel_reason: orderRow.cancel_reason,
    admin_rejection_note: orderRow.admin_rejection_note || null,
    coupon_code: orderRow.coupon_code || null,
    discount: Number(orderRow.discount) || 0,
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
    tracking_number: orderRow.tracking_number || null,
    courier_partner: orderRow.courier_partner || (orderRow.status === "completed" || orderRow.status === "processing" ? "BlueDart Express" : null),
    dispatch_date: orderRow.dispatch_date || null,
    delivery_date: orderRow.delivery_date || null,
    shipping_status: orderRow.shipping_status || (orderRow.status === "completed" ? "Delivered" : (orderRow.status === "processing" ? "Handcrafted & Dispatched" : (orderRow.status === "paid" ? "Awaiting Dispatch" : "Processing Order"))),
    items: itemRows.map((it) => {
      const resolvedSku = it.product_sku || it.sku || (it.product_id ? `SUKO-${it.product_id}` : "SUKO-GARMENT");
      const resolvedColor = it.color || it.product_color || "Obsidian Black";
      return {
        id: it.id,
        quantity: it.quantity,
        size: it.size,
        sku: resolvedSku,
        color: resolvedColor,
        price_at_purchase: Number(it.price_at_purchase),
        product: {
          id: it.product_id,
          name: it.product_name,
          sku: resolvedSku,
          color: resolvedColor,
          image_url: it.product_image_url,
          price: Number(it.price_at_purchase),
          category: { name: it.category_name || "Atelier" },
        },
      };
    }),
  };
}

async function getOrderWithItems(orderId) {
  const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
  const order = orderRes.rows[0];
  if (!order) return null;

  let itemsRes;
  try {
    itemsRes = await pool.query(
      `SELECT oi.*, p.sku AS product_sku, p.color AS product_color 
       FROM order_items oi 
       LEFT JOIN products p ON p.id::text = oi.product_id::text 
       WHERE oi.order_id = $1 
       ORDER BY oi.id ASC`,
      [orderId]
    );
  } catch (err) {
    itemsRes = await pool.query(
      "SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC",
      [orderId]
    );
  }

  let isDup = Boolean(order.is_duplicate_utr);
  let dupOrderId = order.duplicate_utr_order_id || null;
  if (order.transaction_id && String(order.transaction_id).trim()) {
    try {
      const dupCheck = await pool.query(
        "SELECT id FROM orders WHERE LOWER(TRIM(transaction_id)) = LOWER($1) AND id != $2 AND status != 'cancelled' LIMIT 1",
        [String(order.transaction_id).trim(), order.id]
      );
      if (dupCheck.rows.length > 0) {
        isDup = true;
        dupOrderId = dupCheck.rows[0].id;
      }
    } catch (e) {}
  }

  let user = null;
  if (order.user_id) {
    try {
      const userRes = await pool.query(
        "SELECT id, name, email, phone FROM users WHERE id = $1",
        [order.user_id]
      );
      user = userRes.rows[0] || null;
    } catch (uErr) {}
  }

  const formatted = formatOrder(order, itemsRes.rows, user);
  return {
    ...formatted,
    is_duplicate_utr: isDup,
    duplicate_utr_order_id: dupOrderId,
  };
}

// POST /api/orders  -- create a new order (checkout)
router.post("/", requireAuth, validateCreateOrder, async (req, res) => {
  const client = await pool.connect();
  try {
    const { items, name, phone, line1, city, state, pincode, coupon_code } = req.body;

    const subtotal = items.reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );

    let discount = 0;
    let appliedCode = null;

    if (coupon_code && typeof coupon_code === "string") {
      const cleanCode = coupon_code.trim().toUpperCase();
      if (pool.isMock) {
        const storePath = path.join(__dirname, "..", "data", "dev-store.json");
        if (fs.existsSync(storePath)) {
          try {
            const store = JSON.parse(fs.readFileSync(storePath, "utf-8"));
            const coup = (store.coupons || []).find(c => c.code.toUpperCase() === cleanCode && c.is_active !== false);
            if (coup) {
              const minVal = Number(coup.min_order_value) || 0;
              const isNotExpired = !coup.expiry_date || new Date(coup.expiry_date).getTime() >= Date.now();
              const limitNotReached = !coup.usage_limit || (Number(coup.used_count) || 0) < Number(coup.usage_limit);
              if (subtotal >= minVal && isNotExpired && limitNotReached) {
                const type = coup.discount_type || (coup.discount_flat ? "flat" : "percentage");
                const val = Number(coup.discount_value || coup.discount_percent || coup.discount_flat || 0);
                if (type === "percentage") {
                  discount = Math.round((subtotal * val) / 100);
                  if (coup.max_discount && discount > Number(coup.max_discount)) {
                    discount = Number(coup.max_discount);
                  }
                } else {
                  discount = Math.min(subtotal, val);
                }
                coup.used_count = (Number(coup.used_count) || 0) + 1;
                fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
                appliedCode = cleanCode;
              }
            }
          } catch (e) {}
        }
      } else {
        const coupRes = await client.query(
          "SELECT * FROM coupons WHERE UPPER(code) = $1 AND is_active = true",
          [cleanCode]
        );
        const coup = coupRes.rows[0];
        if (coup) {
          const minVal = Number(coup.min_order_value) || 0;
          const isNotExpired = !coup.expiry_date || new Date(coup.expiry_date).getTime() >= Date.now();
          const limitNotReached = !coup.usage_limit || (Number(coup.used_count) || 0) < Number(coup.usage_limit);
          if (subtotal >= minVal && isNotExpired && limitNotReached) {
            const type = coup.discount_type || (coup.discount_flat ? "flat" : "percentage");
            const val = Number(coup.discount_value || coup.discount_percent || coup.discount_flat || 0);
            if (type === "percentage") {
              discount = Math.round((subtotal * val) / 100);
              if (coup.max_discount && discount > Number(coup.max_discount)) {
                discount = Number(coup.max_discount);
              }
            } else {
              discount = Math.min(subtotal, val);
            }
            await client.query(
              "UPDATE coupons SET used_count = COALESCE(used_count, 0) + 1 WHERE id = $1",
              [coup.id]
            );
            appliedCode = cleanCode;
          }
        }
      }
    }

    const total = Math.max(0, subtotal - discount);

    await client.query("BEGIN");

    const orderRes = await client.query(
      `INSERT INTO orders (user_id, status, payment_status, total, payment_method, name, phone, email, line1, city, state, pincode, coupon_code, discount)
       VALUES ($1, 'pending_payment', 'pending_verification', $2, 'manual_upi', $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
        appliedCode,
        discount
      ]
    );
    const order = orderRes.rows[0];

    for (const it of items) {
      const itemQty = Math.max(1, Number(it.quantity) || 1);
      const itemSize = it.size || "";
      const productId = String(it.product_id || "");

      // Enforce size inventory deduction and recalculate total product stock
      if (productId) {
        if (pool.isMock) {
          const storePath = path.join(__dirname, "..", "data", "dev-store.json");
          if (fs.existsSync(storePath)) {
            try {
              const store = JSON.parse(fs.readFileSync(storePath, "utf-8"));
              const prod = (store.products || []).find(p => String(p.id) === productId || p.slug === productId);
              if (prod) {
                if (prod.size_stock && typeof prod.size_stock === "object" && itemSize && prod.size_stock[itemSize] !== undefined) {
                  const avail = Number(prod.size_stock[itemSize]) || 0;
                  if (avail < itemQty) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({
                      error: `Insufficient stock for "${prod.name}" (Size ${itemSize}). Available: ${avail}, Requested: ${itemQty}`
                    });
                  }
                  prod.size_stock[itemSize] = Math.max(0, avail - itemQty);
                  prod.stock = Object.values(prod.size_stock).reduce((acc, q) => acc + (Number(q) || 0), 0);
                } else {
                  const avail = Number(prod.stock) || 0;
                  if (avail < itemQty) {
                    await client.query("ROLLBACK");
                    return res.status(400).json({
                      error: `Insufficient stock for "${prod.name}". Available: ${avail}, Requested: ${itemQty}`
                    });
                  }
                  prod.stock = Math.max(0, avail - itemQty);
                }
                fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
              }
            } catch (e) {}
          }
        } else {
          // Real PostgreSQL mode with row-level lock
          const prodCheck = await client.query(
            "SELECT id, name, stock, size_stock FROM products WHERE id = $1 FOR UPDATE",
            [productId]
          );
          if (prodCheck.rows.length > 0) {
            const prodRow = prodCheck.rows[0];
            let sStock = prodRow.size_stock;
            if (typeof sStock === "string") {
              try { sStock = JSON.parse(sStock); } catch (e) { sStock = null; }
            }

            if (sStock && typeof sStock === "object" && itemSize && sStock[itemSize] !== undefined) {
              const avail = Number(sStock[itemSize]) || 0;
              if (avail < itemQty) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                  error: `Insufficient stock for "${prodRow.name}" (Size ${itemSize}). Available: ${avail}, Requested: ${itemQty}`
                });
              }
              sStock[itemSize] = Math.max(0, avail - itemQty);
              const newTotalStock = Object.values(sStock).reduce((acc, q) => acc + (Number(q) || 0), 0);
              await client.query(
                "UPDATE products SET size_stock = $1, stock = $2 WHERE id = $3",
                [JSON.stringify(sStock), newTotalStock, prodRow.id]
              );
            } else {
              const avail = Number(prodRow.stock) || 0;
              if (avail < itemQty) {
                await client.query("ROLLBACK");
                return res.status(400).json({
                  error: `Insufficient stock for "${prodRow.name}". Available: ${avail}, Requested: ${itemQty}`
                });
              }
              await client.query(
                "UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2",
                [itemQty, prodRow.id]
              );
            }
          }
        }
      }

      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image_url, category_name, size, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          order.id,
          productId,
          it.name || "Atelier Garment",
          it.image_url || it.image || null,
          it.category_name || null,
          itemSize,
          itemQty,
          Number(it.price) || 0,
        ]
      );
    }

    await client.query("COMMIT");

    const fullOrder = await getOrderWithItems(order.id);

    // Dispatch instant luxury order confirmation email only if already verified/paid
    if (fullOrder && (fullOrder.status === "paid" || fullOrder.status === "completed")) {
      sendOrderConfirmationEmail(fullOrder).catch((e) => {
        console.warn("⚠️  [EmailService] Order confirmation email dispatch failed:", e.message);
      });
    }

    res.status(201).json(fullOrder);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create order error:", err);
    res.status(500).json({ error: "Failed to create order. Please try again." });
  } finally {
    client.release();
  }
});

async function getOrdersWithItemsBatch(orderRows) {
  if (!orderRows || orderRows.length === 0) return [];

  const orderIds = orderRows.map((o) => o.id);
  const userIds = [...new Set(orderRows.map((o) => o.user_id).filter(Boolean))];

  let itemsRes;
  try {
    itemsRes = await pool.query(
      `SELECT oi.*, p.sku AS product_sku, p.color AS product_color 
       FROM order_items oi 
       LEFT JOIN products p ON p.id::text = oi.product_id::text 
       WHERE oi.order_id = ANY($1::int[]) 
       ORDER BY oi.id ASC`,
      [orderIds]
    );
  } catch (err) {
    itemsRes = await pool.query(
      "SELECT * FROM order_items WHERE order_id = ANY($1::int[]) ORDER BY id ASC",
      [orderIds]
    );
  }

  let usersMap = {};
  if (userIds.length > 0) {
    try {
      const userRes = await pool.query(
        "SELECT id, name, email, phone FROM users WHERE id = ANY($1::int[])",
        [userIds]
      );
      userRes.rows.forEach((u) => {
        usersMap[u.id] = u;
      });
    } catch (err) {
      console.warn("Batch users fetch error:", err.message);
    }
  }

  const itemsByOrderId = {};
  itemsRes.rows.forEach((it) => {
    if (!itemsByOrderId[it.order_id]) itemsByOrderId[it.order_id] = [];
    itemsByOrderId[it.order_id].push(it);
  });

  // Batch duplicate UTR detection
  const utrCounts = {};
  const firstOrderByUtr = {};
  orderRows.forEach((o) => {
    const rawTx = (o.transaction_id || "").trim().toLowerCase();
    if (rawTx && rawTx.length >= 4) {
      if (!utrCounts[rawTx]) {
        utrCounts[rawTx] = 0;
        firstOrderByUtr[rawTx] = o.id;
      }
      utrCounts[rawTx]++;
    }
  });

  return orderRows.map((order) => {
    const rawTx = (order.transaction_id || "").trim().toLowerCase();
    const isDup = Boolean(order.is_duplicate_utr || (rawTx && utrCounts[rawTx] > 1));
    const dupOrderId = order.duplicate_utr_order_id || (isDup && firstOrderByUtr[rawTx] !== order.id ? firstOrderByUtr[rawTx] : null);

    const formatted = formatOrder(order, itemsByOrderId[order.id] || [], usersMap[order.user_id] || null);
    return {
      ...formatted,
      is_duplicate_utr: isDup,
      duplicate_utr_order_id: dupOrderId,
    };
  });
}

// GET /api/orders -- current customer's own orders
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.userId]
    );
    const orders = await getOrdersWithItemsBatch(result.rows);
    res.json(orders);
  } catch (err) {
    console.error("List my orders error:", err);
    res.status(500).json({ error: "Failed to load your orders." });
  }
});

// GET /api/orders/all -- admin: every order (Optimized single-batch query)
router.get("/all", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    const orders = await getOrdersWithItemsBatch(result.rows);
    res.json(orders);
  } catch (err) {
    console.error("List all orders error:", err);
    res.status(500).json({ error: "Failed to load orders." });
  }
});

// GET /api/orders/check-utr?utr=...&order_id=... -- check if UTR is already in use by another order
router.get("/check-utr", requireAuth, async (req, res) => {
  try {
    const rawUtr = String(req.query.utr || "").trim();
    const excludeOrderId = parseInt(req.query.order_id, 10) || 0;

    if (!rawUtr || rawUtr.length < 4) {
      return res.json({ is_duplicate: false, matched_order_id: null });
    }

    const check = await pool.query(
      `SELECT id, status, created_at FROM orders 
       WHERE LOWER(TRIM(transaction_id)) = LOWER($1) 
         AND id != $2 
         AND status != 'cancelled' 
       ORDER BY id DESC LIMIT 1`,
      [rawUtr, excludeOrderId]
    );

    if (check.rows.length > 0) {
      const match = check.rows[0];
      return res.json({
        is_duplicate: true,
        matched_order_id: match.id,
        matched_order_number: `SUKO-${1000 + match.id}`,
        message: `This Transaction ID / UTR was already submitted for Order #SUKO-${1000 + match.id}.`,
      });
    }

    return res.json({ is_duplicate: false, matched_order_id: null });
  } catch (err) {
    console.error("Check UTR error:", err);
    res.status(500).json({ error: "Failed to check UTR status." });
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

    const { transaction_id, utr, transactionId, screenshot, screenshotBase64 } = req.body;
    const finalTxId = String(transaction_id || utr || transactionId || "").trim();
    const finalScreenshot = screenshot || screenshotBase64;

    // Strict Validation: Transaction ID / UTR
    if (!finalTxId) {
      return res.status(400).json({ error: "Please enter your transaction ID." });
    }

    if (finalTxId.length < 6) {
      return res.status(400).json({ error: "Transaction ID / UTR must be at least 6 characters." });
    }

    // Strict Validation: Payment Screenshot
    if (!finalScreenshot || typeof finalScreenshot !== "string") {
      return res.status(400).json({ error: "Please upload payment screenshot." });
    }

    // Validate screenshot format: JPG, JPEG, PNG, WebP
    const match = finalScreenshot.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/i);
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

    // Check for duplicate UTR across existing orders
    let isDuplicateUtr = false;
    let duplicateOrderId = null;
    const dupCheck = await pool.query(
      `SELECT id, status, name, created_at FROM orders 
       WHERE LOWER(TRIM(transaction_id)) = LOWER($1) 
         AND id != $2 
         AND status != 'cancelled' 
       ORDER BY id DESC LIMIT 1`,
      [finalTxId, order.id]
    );
    if (dupCheck.rows.length > 0) {
      isDuplicateUtr = true;
      duplicateOrderId = dupCheck.rows[0].id;
    }

    // Upload to Cloudinary for permanent storage, with graceful local disk fallback
    let permanentProofUrl = null;

    if (isCloudinaryConfigured()) {
      try {
        const cloudRes = await uploadImageBuffer(fileBuffer, {
          folder: "suko/payment_proofs",
          public_id: `proof-order-${order.id}-${Date.now()}`,
          tags: ["payment_proof", `order_${order.id}`]
        });
        if (cloudRes && cloudRes.url) {
          permanentProofUrl = cloudRes.url;
        }
      } catch (cloudErr) {
        console.warn("[Orders] Cloudinary proof upload failed, falling back to local disk:", cloudErr.message);
      }
    }

    if (!permanentProofUrl) {
      const filename = `proof_order_${order.id}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${ext}`;
      const filePath = path.join(UPLOAD_PROOF_DIR, filename);
      fs.writeFileSync(filePath, fileBuffer);
      permanentProofUrl = filename;
    }

    // Save reference in DB with strict status: payment_verification_pending
    await pool.query(
      `UPDATE orders
       SET status = 'payment_verification_pending',
           payment_status = 'pending_verification',
           payment_method = 'manual_upi',
           transaction_id = $1,
           payment_screenshot_url = $2,
           is_duplicate_utr = $3,
           duplicate_utr_order_id = $4,
           updated_at = now()
       WHERE id = $5`,
      [finalTxId, permanentProofUrl, isDuplicateUtr, duplicateOrderId, order.id]
    );

    const updatedOrder = await getOrderWithItems(order.id);

    // Notify Atelier Admin Concierge via verified email
    const orderNumberStr = `#SUKO-${1000 + order.id}`;
    const dupFlagText = isDuplicateUtr ? ` ⚠️ [DUPLICATE UTR DETECTED - Used in #SUKO-${1000 + duplicateOrderId}]` : "";
    const adminAlertSubject = `🔔 [PAYMENT PROOF SUBMITTED] ${orderNumberStr}${dupFlagText} (₹${order.total})`;
    const adminAlertMsg = `Payment proof received for Order ${orderNumberStr}.\n\nPatron: ${order.name || "Patron"}\nAmount: ₹${order.total}\nUTR / Transaction ID: ${finalTxId}${isDuplicateUtr ? `\n\n⚠️ SECURITY NOTICE: This UTR matches Order #SUKO-${1000 + duplicateOrderId}! Flagged for manual audit.` : ""}\n\nPlease review the attached receipt in the SUKO Admin Dashboard before confirming.`;
    
    sendBroadcastEmail({
      to: "indiancorporatewearbysuko@gmail.com",
      subject: adminAlertSubject,
      message: adminAlertMsg,
      recipientName: "Atelier Operations",
      ctaText: "Open Admin Dashboard",
      ctaUrl: "https://indiancorporatewear.com/admin"
    }).catch((e) => {
      console.warn("[Orders] Admin payment proof alert dispatch failed:", e.message);
    });

    return res.json({
      success: true,
      message: isDuplicateUtr
        ? `Payment details received for verification. Note: UTR ${finalTxId} was flagged for administrative review.`
        : "Payment details received for verification.",
      order: updatedOrder,
      is_duplicate_utr: isDuplicateUtr,
      duplicate_utr_order_id: duplicateOrderId,
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

    // If permanent Cloudinary / remote URL, safely redirect authenticated requests
    if (order.payment_screenshot_url.startsWith("http://") || order.payment_screenshot_url.startsWith("https://")) {
      return res.redirect(order.payment_screenshot_url);
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

    const currentOrder = raw.rows[0];

    await pool.query(
      "UPDATE orders SET status = 'paid', payment_status = 'verified', cancel_reason = NULL, admin_rejection_note = NULL, updated_at = now() WHERE id = $1",
      [orderId]
    );

    const fullOrder = await getOrderWithItems(orderId);

    // Asynchronously dispatch luxury order confirmation & paid tax invoice emails
    if (fullOrder) {
      sendOrderConfirmationEmail(fullOrder).catch((mailErr) => {
        console.warn("⚠️  [EmailService] Order confirmation email dispatch failed:", mailErr.message);
      });
      sendOrderInvoiceEmail(fullOrder).catch((mailErr) => {
        console.warn("⚠️  [EmailService] Paid invoice email dispatch failed:", mailErr.message);
      });
    }

    // Record administrative audit activity
    try {
      await productService.recordActivityLog({
        admin_email: req.user?.email || "admin@indiancorporatewear.com",
        action: "payment_verify",
        target_entity: "orders",
        affected_count: 1,
        summary: `Payment verified and order confirmed for Order #SUKO-${1000 + orderId}`,
        details: {
          order_id: orderId,
          order_number: `SUKO-${1000 + orderId}`,
          amount: fullOrder?.total || currentOrder.total,
          transaction_id: fullOrder?.transaction_id || currentOrder.transaction_id,
          payment_method: fullOrder?.payment_method || currentOrder.payment_method || "manual_upi",
        },
        ip_address: req.ip || req.connection?.remoteAddress
      });
    } catch (logErr) {
      console.warn("[Orders] Failed to record payment_verify activity log:", logErr.message);
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
    const { reason, admin_note, adminNote } = req.body;
    const raw = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (raw.rows.length === 0) return res.status(404).json({ error: "Order not found." });

    const currentOrder = raw.rows[0];

    // Customer-facing clean reason (no internal operational jargon)
    const customerReason = (reason && String(reason).trim()) || "We couldn't verify this payment. Please review your payment details and submit them again.";
    const internalNote = (admin_note || adminNote || "").trim() || null;

    await pool.query(
      "UPDATE orders SET status = 'payment_verification_failed', payment_status = 'rejected', cancel_reason = $1, admin_rejection_note = $2, updated_at = now() WHERE id = $3",
      [customerReason, internalNote, orderId]
    );

    const fullOrder = await getOrderWithItems(orderId);

    // Notify customer of payment rejection with clear instructions to re-submit proof
    const targetEmail = fullOrder?.user?.email || fullOrder?.email || currentOrder.email;
    if (targetEmail) {
      const orderNumber = `#SUKO-${1000 + orderId}`;
      sendBroadcastEmail({
        to: targetEmail,
        subject: `Payment Verification Notice: ${orderNumber} | SUKO Atelier`,
        message: `Dear ${fullOrder?.user?.name || fullOrder?.name || "Patron"},\n\nWe could not verify the payment proof submitted for Order ${orderNumber}.\n\nReason: ${customerReason}\n\nPlease visit your SUKO account orders page to review and re-submit your payment details so our atelier can verify your order.\n\nWarm regards,\nSUKO Atelier Concierge`,
        recipientName: fullOrder?.user?.name || fullOrder?.name || "Patron",
        ctaText: "Re-submit Payment Details",
        ctaUrl: "https://indiancorporatewear.com/orders"
      }).catch((mailErr) => {
        console.warn("⚠️  [EmailService] Rejection notice email failed:", mailErr.message);
      });
    }

    // Record administrative audit activity
    try {
      await productService.recordActivityLog({
        admin_email: req.user?.email || "admin@indiancorporatewear.com",
        action: "payment_reject",
        target_entity: "orders",
        affected_count: 1,
        summary: `Payment proof rejected for Order #SUKO-${1000 + orderId}`,
        details: {
          order_id: orderId,
          order_number: `SUKO-${1000 + orderId}`,
          customer_reason: customerReason,
          admin_rejection_note: internalNote,
          transaction_id: fullOrder?.transaction_id || currentOrder.transaction_id,
        },
        ip_address: req.ip || req.connection?.remoteAddress
      });
    } catch (logErr) {
      console.warn("[Orders] Failed to record payment_reject activity log:", logErr.message);
    }

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

    // Asynchronously dispatch branded shipping/status email
    if (status === "processing" || status === "completed") {
      getOrderWithItems(orderId).then((fullOrder) => {
        if (fullOrder) {
          const label = status === "processing" ? "In Atelier Handcrafting" : "Dispatched & In Transit";
          sendShippingUpdateEmail(fullOrder, label).catch((mErr) => {
            console.warn("⚠️  [EmailService] Shipping update email failed:", mErr.message);
          });
        }
      }).catch(console.error);
    }

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
// GET /api/orders/:id/document -- render printable HTML document (invoice, receipt, packing_slip)
router.get("/:id/document", requireAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const raw = await pool.query("SELECT user_id FROM orders WHERE id = $1", [orderId]);
    if (raw.rows.length === 0) return res.status(404).json({ error: "Order not found." });

    const isOwner = raw.rows[0].user_id === req.user.userId;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to view this document." });
    }

    const order = await getOrderWithItems(orderId);
    if (!order) return res.status(404).json({ error: "Order not found." });

    // Allocate sequential invoice number if not yet assigned
    if (!order.invoice_number) {
      order.invoice_number = await allocateInvoiceNumber(orderId);
    }

    const docType = (req.query.type || "invoice").toLowerCase();
    const html = await renderDocumentHtml({ order, type: docType });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    console.error("Render document error:", err);
    res.status(500).json({ error: "Failed to generate document." });
  }
});

// GET /api/orders/:id/pdf -- download binary vector PDF document
router.get("/:id/pdf", requireAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const raw = await pool.query("SELECT user_id FROM orders WHERE id = $1", [orderId]);
    if (raw.rows.length === 0) return res.status(404).json({ error: "Order not found." });

    const isOwner = raw.rows[0].user_id === req.user.userId;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to download this document." });
    }

    const order = await getOrderWithItems(orderId);
    if (!order) return res.status(404).json({ error: "Order not found." });

    if (!order.invoice_number) {
      order.invoice_number = await allocateInvoiceNumber(orderId);
    }

    const docType = (req.query.type || "invoice").toLowerCase();
    const pdfBuffer = await generateDocumentPdf({ order, type: docType });

    const docLabel = docType === "packing_slip" ? "PackingSlip" : (docType === "receipt" ? "Receipt" : "Invoice");
    const filename = `SUKO-${docLabel}-${order.invoice_number || orderId}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Generate PDF error:", err);
    res.status(500).json({ error: "Failed to generate PDF document." });
  }
});

// POST /api/orders/:id/send-invoice -- admin triggers sending luxury invoice email with PDF attachment
router.post("/:id/send-invoice", requireAdmin, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const order = await getOrderWithItems(orderId);
    if (!order) return res.status(404).json({ error: "Order not found." });

    const recipientOverride = {
      email: req.body.email || undefined,
      name: req.body.name || undefined
    };

    const result = await sendOrderInvoiceEmail(order, recipientOverride);
    if (!result.success && !result.devMode) {
      return res.status(500).json({ error: result.error || "Failed to dispatch invoice email." });
    }

    res.json({
      success: true,
      message: `Invoice email successfully sent${result.invoiceNumber ? ` (#${result.invoiceNumber})` : ""}.`,
      invoiceNumber: result.invoiceNumber
    });
  } catch (err) {
    console.error("Send invoice email error:", err);
    res.status(500).json({ error: "Failed to send invoice email." });
  }
});

// GET /api/orders/:id/documents -- retrieve document history (invoices, receipts, PDFs)
router.get("/:id/documents", requireAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const raw = await pool.query("SELECT user_id FROM orders WHERE id = $1", [orderId]);
    if (raw.rows.length === 0) return res.status(404).json({ error: "Order not found." });

    const isOwner = raw.rows[0].user_id === req.user.userId;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to view document history." });
    }

    const docs = await getOrderDocuments(orderId);
    res.json(docs);
  } catch (err) {
    console.error("Fetch order documents error:", err);
    res.status(500).json({ error: "Failed to load document history." });
  }
});

module.exports = router;
