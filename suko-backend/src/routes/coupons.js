const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { requireAdmin } = require("../auth");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DEV_STORE_FILE = path.join(DATA_DIR, "dev-store.json");

const SEED_COUPONS = [
  {
    id: 201,
    code: "SUKO10",
    discount_type: "percentage",
    discount_value: 10,
    discount_percent: 10,
    discount_flat: null,
    min_order_value: 2000,
    max_discount: 2000,
    usage_limit: 100,
    used_count: 24,
    expiry_date: "2026-10-31T23:59:59.000Z",
    is_active: true,
    status: "active",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: 202,
    code: "FESTIVE500",
    discount_type: "flat",
    discount_value: 500,
    discount_percent: null,
    discount_flat: 500,
    min_order_value: 3500,
    max_discount: null,
    usage_limit: 50,
    used_count: 18,
    expiry_date: "2026-11-15T23:59:59.000Z",
    is_active: true,
    status: "active",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 203,
    code: "WELCOME15",
    discount_type: "percentage",
    discount_value: 15,
    discount_percent: 15,
    discount_flat: null,
    min_order_value: 1500,
    max_discount: 1500,
    usage_limit: 200,
    used_count: 200,
    expiry_date: "2026-08-31T23:59:59.000Z",
    is_active: true,
    status: "expired",
    created_at: new Date(Date.now() - 86400000 * 30).toISOString()
  }
];

function computeCouponStatus(c) {
  if (c.is_active === false) return "inactive";
  if (c.expiry_date && new Date(c.expiry_date).getTime() < Date.now()) return "expired";
  if (c.usage_limit && Number(c.used_count || 0) >= Number(c.usage_limit)) return "expired";
  return "active";
}

function normalizeCoupon(c) {
  const type = c.discount_type || (c.discount_flat ? "flat" : "percentage");
  const value = Number(c.discount_value || (type === "percentage" ? c.discount_percent : c.discount_flat) || 0);
  const status = computeCouponStatus(c);

  return {
    ...c,
    discount_type: type,
    discount_value: value,
    discount_percent: type === "percentage" ? value : null,
    discount_flat: type === "flat" ? value : null,
    min_order_value: Number(c.min_order_value) || 0,
    max_discount: c.max_discount ? Number(c.max_discount) : null,
    usage_limit: c.usage_limit ? Number(c.usage_limit) : null,
    used_count: Number(c.used_count) || 0,
    expiry_date: c.expiry_date || null,
    is_active: c.is_active !== false,
    status
  };
}

function getDevStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DEV_STORE_FILE)) {
    try {
      const store = JSON.parse(fs.readFileSync(DEV_STORE_FILE, "utf-8"));
      if (!Array.isArray(store.coupons) || store.coupons.length === 0) {
        store.coupons = [...SEED_COUPONS];
        saveDevStore(store);
      }
      return store;
    } catch (e) {}
  }
  const initialStore = { coupons: [...SEED_COUPONS] };
  saveDevStore(initialStore);
  return initialStore;
}

function saveDevStore(store) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

async function ensureDbSeeded() {
  if (pool.isMock) return;
  try {
    const { rows } = await pool.query("SELECT COUNT(*) FROM coupons");
    if (parseInt(rows[0].count, 10) === 0) {
      for (const c of SEED_COUPONS) {
        const exists = await pool.query("SELECT id FROM coupons WHERE UPPER(code) = $1", [c.code.toUpperCase()]);
        if (exists.rows.length === 0) {
          await pool.query(
            `INSERT INTO coupons (
              code, discount_type, discount_value, discount_percent, discount_flat,
              min_order_value, max_discount, usage_limit, used_count, expiry_date, is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              c.code,
              c.discount_type,
              c.discount_value,
              c.discount_percent,
              c.discount_flat,
              c.min_order_value,
              c.max_discount,
              c.usage_limit,
              c.used_count,
              c.expiry_date,
              c.is_active
            ]
          );
        }
      }
    }
  } catch (err) {
    console.warn("[Coupons] Seed check note:", err.message);
  }
}

// GET /api/coupons -- list all coupons (Admin)
router.get("/", requireAdmin, async (req, res) => {
  try {
    if (pool.isMock) {
      const store = getDevStore();
      const list = (store.coupons || []).map(normalizeCoupon);
      return res.json(list);
    }

    await ensureDbSeeded();
    const { rows } = await pool.query("SELECT * FROM coupons ORDER BY created_at DESC");
    const list = rows.map(normalizeCoupon);
    res.json(list);
  } catch (err) {
    console.error("[Coupons] List error:", err.message);
    const store = getDevStore();
    res.json((store.coupons || []).map(normalizeCoupon));
  }
});

// POST /api/coupons -- create coupon (Admin)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const {
      code,
      discount_type = "percentage",
      discount_value,
      discount_percent,
      discount_flat,
      min_order_value = 0,
      max_discount,
      usage_limit,
      expiry_date,
      is_active = true
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: "Coupon code is required." });
    }

    const cleanCode = code.trim().toUpperCase();

    // Determine type and numerical value
    const type = discount_type === "flat" ? "flat" : "percentage";
    const rawVal = discount_value ?? (type === "percentage" ? discount_percent : discount_flat);
    const numValue = Number(rawVal);

    if (isNaN(numValue) || numValue <= 0) {
      return res.status(400).json({ error: "A valid discount value greater than 0 is required." });
    }

    if (type === "percentage" && numValue > 100) {
      return res.status(400).json({ error: "Percentage discount cannot exceed 100%." });
    }

    const minOrderVal = Number(min_order_value) || 0;
    const maxDiscountVal = max_discount ? Number(max_discount) : null;
    const usageLimitVal = usage_limit ? parseInt(usage_limit, 10) : null;
    const expiryIso = expiry_date ? new Date(expiry_date).toISOString() : null;

    if (pool.isMock) {
      const store = getDevStore();
      const existing = (store.coupons || []).find(c => c.code.toUpperCase() === cleanCode);
      if (existing) {
        return res.status(409).json({ error: `Coupon code "${cleanCode}" already exists.` });
      }

      const newCoupon = normalizeCoupon({
        id: Date.now(),
        code: cleanCode,
        discount_type: type,
        discount_value: numValue,
        discount_percent: type === "percentage" ? numValue : null,
        discount_flat: type === "flat" ? numValue : null,
        min_order_value: minOrderVal,
        max_discount: maxDiscountVal,
        usage_limit: usageLimitVal,
        used_count: 0,
        expiry_date: expiryIso,
        is_active: Boolean(is_active),
        created_at: new Date().toISOString()
      });

      store.coupons.unshift(newCoupon);
      saveDevStore(store);
      return res.status(201).json(newCoupon);
    }

    const existingRes = await pool.query("SELECT id FROM coupons WHERE code = $1", [cleanCode]);
    if (existingRes.rows.length > 0) {
      return res.status(409).json({ error: `Coupon code "${cleanCode}" already exists.` });
    }

    const { rows } = await pool.query(
      `INSERT INTO coupons (
        code, discount_type, discount_value, discount_percent, discount_flat,
        min_order_value, max_discount, usage_limit, used_count, expiry_date, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10)
      RETURNING *`,
      [
        cleanCode,
        type,
        numValue,
        type === "percentage" ? numValue : null,
        type === "flat" ? numValue : null,
        minOrderVal,
        maxDiscountVal,
        usageLimitVal,
        expiryIso,
        Boolean(is_active)
      ]
    );

    res.status(201).json(normalizeCoupon(rows[0]));
  } catch (err) {
    console.error("[Coupons] Create error:", err.message);
    res.status(500).json({ error: err.message || "Failed to create coupon." });
  }
});

// PATCH /api/coupons/:id/status -- toggle active / inactive or update status (Admin)
router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const couponId = req.params.id;
    const { is_active } = req.body;

    if (pool.isMock) {
      const store = getDevStore();
      const coupon = (store.coupons || []).find(c => String(c.id) === String(couponId));
      if (!coupon) return res.status(404).json({ error: "Coupon not found." });

      coupon.is_active = typeof is_active === "boolean" ? is_active : !coupon.is_active;
      coupon.status = computeCouponStatus(coupon);
      saveDevStore(store);
      return res.json({ success: true, coupon: normalizeCoupon(coupon) });
    }

    const getRes = await pool.query("SELECT is_active FROM coupons WHERE id = $1", [couponId]);
    if (getRes.rows.length === 0) return res.status(404).json({ error: "Coupon not found." });

    const newActive = typeof is_active === "boolean" ? is_active : !getRes.rows[0].is_active;
    const { rows } = await pool.query(
      "UPDATE coupons SET is_active = $1 WHERE id = $2 RETURNING *",
      [newActive, couponId]
    );

    res.json({ success: true, coupon: normalizeCoupon(rows[0]) });
  } catch (err) {
    console.error("[Coupons] Toggle status error:", err.message);
    res.status(500).json({ error: "Failed to update coupon status." });
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
    const { code, order_value, orderTotal, subtotal } = req.body;
    if (!code || !code.trim()) return res.status(400).json({ error: "Coupon code is required." });

    const cleanCode = code.trim().toUpperCase();
    const orderAmt = Number(orderTotal ?? order_value ?? subtotal ?? 0);

    let coupon = null;
    if (pool.isMock) {
      const store = getDevStore();
      coupon = (store.coupons || []).find(c => c.code.toUpperCase() === cleanCode);
    } else {
      await ensureDbSeeded();
      const { rows } = await pool.query(
        "SELECT * FROM coupons WHERE UPPER(code) = $1",
        [cleanCode]
      );
      coupon = rows[0] || null;
    }

    if (!coupon) {
      return res.status(404).json({ error: `Coupon "${cleanCode}" is invalid.` });
    }

    const norm = normalizeCoupon(coupon);

    if (!norm.is_active) {
      return res.status(400).json({ error: `Coupon "${cleanCode}" is currently inactive.` });
    }

    if (norm.expiry_date && new Date(norm.expiry_date).getTime() < Date.now()) {
      return res.status(400).json({ error: `Coupon "${cleanCode}" has expired.` });
    }

    if (norm.usage_limit && norm.used_count >= norm.usage_limit) {
      return res.status(400).json({ error: `Coupon "${cleanCode}" usage limit of ${norm.usage_limit} has been reached.` });
    }

    const minVal = norm.min_order_value;
    if (orderAmt < minVal) {
      return res.status(400).json({
        error: `Minimum order value of ₹${minVal.toLocaleString("en-IN")} required to use "${cleanCode}".`
      });
    }

    let discount = 0;
    if (norm.discount_type === "percentage" || norm.discount_percent) {
      const pct = Number(norm.discount_value || norm.discount_percent);
      discount = Math.round((orderAmt * pct) / 100);
      if (norm.max_discount && discount > norm.max_discount) {
        discount = norm.max_discount;
      }
    } else {
      discount = Math.min(orderAmt, Number(norm.discount_value || norm.discount_flat));
    }

    const finalTotal = Math.max(0, orderAmt - discount);

    res.json({
      valid: true,
      code: cleanCode,
      discount,
      discountAmount: discount, // Supports both client naming conventions
      final_total: finalTotal,
      discount_type: norm.discount_type,
      discount_value: norm.discount_value,
      max_discount: norm.max_discount,
      message: `Coupon "${cleanCode}" applied! You saved ₹${discount.toLocaleString("en-IN")}.`
    });
  } catch (err) {
    console.error("[Coupons] Apply error:", err.message);
    res.status(500).json({ error: "Failed to validate coupon." });
  }
});

module.exports = router;
