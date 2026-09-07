const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { requireAdmin } = require("../auth");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DEV_STORE_FILE = path.join(DATA_DIR, "dev-store.json");

function getDevStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DEV_STORE_FILE)) {
    try {
      const store = JSON.parse(fs.readFileSync(DEV_STORE_FILE, "utf-8"));
      if (!Array.isArray(store.coupons)) store.coupons = [];
      return store;
    } catch (e) {}
  }
  return { coupons: [] };
}

function saveDevStore(store) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

// GET /api/coupons -- list all coupons (Admin)
router.get("/", requireAdmin, async (req, res) => {
  try {
    if (pool.isMock) {
      const store = getDevStore();
      return res.json(store.coupons || []);
    }

    const { rows } = await pool.query("SELECT * FROM coupons ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("[Coupons] List error:", err.message);
    const store = getDevStore();
    res.json(store.coupons || []);
  }
});

// POST /api/coupons -- create coupon (Admin)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { code, discount_percent, discount_flat, min_order_value } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ error: "Coupon code is required." });
    }

    const cleanCode = code.trim().toUpperCase();

    if (pool.isMock) {
      const store = getDevStore();
      const existing = (store.coupons || []).find(c => c.code.toUpperCase() === cleanCode);
      if (existing) return res.status(409).json({ error: "Coupon code already exists." });

      const newCoupon = {
        id: Date.now(),
        code: cleanCode,
        discount_percent: discount_percent ? Number(discount_percent) : null,
        discount_flat: discount_flat ? Number(discount_flat) : null,
        min_order_value: min_order_value ? Number(min_order_value) : 0,
        is_active: true,
        created_at: new Date().toISOString()
      };
      store.coupons.unshift(newCoupon);
      saveDevStore(store);
      return res.status(201).json(newCoupon);
    }

    const existingRes = await pool.query("SELECT id FROM coupons WHERE code = $1", [cleanCode]);
    if (existingRes.rows.length > 0) {
      return res.status(409).json({ error: "Coupon code already exists." });
    }

    const { rows } = await pool.query(
      `INSERT INTO coupons (code, discount_percent, discount_flat, min_order_value, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [
        cleanCode,
        discount_percent ? Number(discount_percent) : null,
        discount_flat ? Number(discount_flat) : null,
        min_order_value ? Number(min_order_value) : 0
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("[Coupons] Create error:", err.message);
    res.status(500).json({ error: "Failed to create coupon." });
  }
});

// DELETE /api/coupons/:id -- delete coupon (Admin)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const couponId = req.params.id;

    if (pool.isMock) {
      const store = getDevStore();
      store.coupons = (store.coupons || []).filter(c => String(c.id) !== String(couponId));
      saveDevStore(store);
      return res.json({ success: true, message: "Coupon deleted." });
    }

    await pool.query("DELETE FROM coupons WHERE id = $1", [couponId]);
    res.json({ success: true, message: "Coupon deleted." });
  } catch (err) {
    console.error("[Coupons] Delete error:", err.message);
    res.status(500).json({ error: "Failed to delete coupon." });
  }
});

// POST /api/coupons/apply -- apply coupon during checkout
router.post("/apply", async (req, res) => {
  try {
    const { code, order_value } = req.body;
    if (!code) return res.status(400).json({ error: "Coupon code required." });

    const cleanCode = code.trim().toUpperCase();
    const orderTotal = Number(order_value) || 0;

    let coupon = null;
    if (pool.isMock) {
      const store = getDevStore();
      coupon = (store.coupons || []).find(c => c.code.toUpperCase() === cleanCode && c.is_active !== false);
    } else {
      const { rows } = await pool.query(
        "SELECT * FROM coupons WHERE code = $1 AND is_active = true",
        [cleanCode]
      );
      coupon = rows[0] || null;
    }

    if (!coupon) {
      return res.status(404).json({ error: "Invalid or expired promo code." });
    }

    const minVal = Number(coupon.min_order_value) || 0;
    if (orderTotal < minVal) {
      return res.status(400).json({
        error: `Minimum order value of ₹${minVal.toLocaleString('en-IN')} required for this privilege code.`
      });
    }

    let discount = 0;
    if (coupon.discount_percent) {
      discount = Math.round((orderTotal * Number(coupon.discount_percent)) / 100);
    } else if (coupon.discount_flat) {
      discount = Math.min(orderTotal, Number(coupon.discount_flat));
    }

    const finalTotal = Math.max(0, orderTotal - discount);

    res.json({
      valid: true,
      code: cleanCode,
      discount,
      final_total: finalTotal,
      message: `Privilege code ${cleanCode} applied successfully!`
    });
  } catch (err) {
    console.error("[Coupons] Apply error:", err.message);
    res.status(500).json({ error: "Failed to validate coupon." });
  }
});

module.exports = router;
