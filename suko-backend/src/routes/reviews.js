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
      if (!Array.isArray(store.reviews)) store.reviews = [];
      return store;
    } catch (e) {}
  }
  return { reviews: [] };
}

function saveDevStore(store) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

// GET /api/reviews/all -- list all reviews for Admin
router.get("/all", requireAdmin, async (req, res) => {
  try {
    if (pool.isMock) {
      const store = getDevStore();
      return res.json(store.reviews || []);
    }

    const { rows } = await pool.query("SELECT * FROM reviews ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("[Reviews] List all error:", err.message);
    const store = getDevStore();
    res.json(store.reviews || []);
  }
});

// GET /api/reviews -- list reviews (filtered by product_id if provided)
router.get("/", async (req, res) => {
  try {
    const { product_id } = req.query;

    if (pool.isMock) {
      const store = getDevStore();
      let list = store.reviews || [];
      if (product_id) {
        list = list.filter(r => String(r.product_id) === String(product_id));
      }
      return res.json(list);
    }

    let query = "SELECT * FROM reviews";
    const params = [];
    if (product_id) {
      params.push(String(product_id));
      query += ` WHERE product_id = $${params.length}`;
    }
    query += " ORDER BY created_at DESC";

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("[Reviews] Query error:", err.message);
    const store = getDevStore();
    res.json(store.reviews || []);
  }
});

// POST /api/reviews -- submit review
router.post("/", async (req, res) => {
  try {
    const { product_id, product_name, user_name, rating, comment } = req.body;
    if (!product_id || !comment) {
      return res.status(400).json({ error: "Product ID and feedback comment are required." });
    }

    const newReview = {
      product_id: String(product_id),
      product_name: product_name || "Atelier Garment",
      user_name: user_name || "Valued Client",
      rating: Number(rating) || 5,
      comment: comment.trim(),
      created_at: new Date().toISOString()
    };

    if (pool.isMock) {
      const store = getDevStore();
      newReview.id = Date.now();
      store.reviews.unshift(newReview);
      saveDevStore(store);
      return res.status(201).json(newReview);
    }

    const { rows } = await pool.query(
      `INSERT INTO reviews (product_id, product_name, user_name, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [newReview.product_id, newReview.product_name, newReview.user_name, newReview.rating, newReview.comment]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("[Reviews] Submit error:", err.message);
    res.status(500).json({ error: "Failed to submit review." });
  }
});

// DELETE /api/reviews/:id -- delete review (Admin)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const reviewId = req.params.id;

    if (pool.isMock) {
      const store = getDevStore();
      store.reviews = (store.reviews || []).filter(r => String(r.id) !== String(reviewId));
      saveDevStore(store);
      return res.json({ success: true, message: "Review deleted." });
    }

    await pool.query("DELETE FROM reviews WHERE id = $1", [reviewId]);
    res.json({ success: true, message: "Review deleted." });
  } catch (err) {
    console.error("[Reviews] Delete error:", err.message);
    res.status(500).json({ error: "Failed to delete review." });
  }
});

module.exports = router;
