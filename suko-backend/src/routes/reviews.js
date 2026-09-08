const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { requireAdmin } = require("../auth");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DEV_STORE_FILE = path.join(DATA_DIR, "dev-store.json");

const SEED_REVIEWS = [
  {
    id: 101,
    product_id: "prod-1",
    product_name: "Bespoke Sovereign Tuxedo Suit",
    user_name: "Shreya Meshram",
    rating: 5,
    comment: "Beautiful fit and the bespoke Italian wool drape feels exceptionally luxurious. Wore it to an executive summit and received endless compliments.",
    status: "pending",
    images: [],
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 102,
    product_id: "prod-2",
    product_name: "Opulence Double-Breasted Blazer",
    user_name: "Priya Sen",
    rating: 5,
    comment: "The precision tailoring and champagne gold lining make this stand out in any boardroom. Immaculate finish.",
    status: "published",
    images: [],
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 103,
    product_id: "prod-3",
    product_name: "Silk Satin Executive Trench",
    user_name: "Aanya Verma",
    rating: 4,
    comment: "Sublime fabric quality. Would love to see additional colorways in ivory or charcoal.",
    status: "published",
    images: [],
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

function getDevStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DEV_STORE_FILE)) {
    try {
      const store = JSON.parse(fs.readFileSync(DEV_STORE_FILE, "utf-8"));
      if (!Array.isArray(store.reviews) || store.reviews.length === 0) {
        store.reviews = [...SEED_REVIEWS];
        saveDevStore(store);
      }
      return store;
    } catch (e) {}
  }
  const initialStore = { reviews: [...SEED_REVIEWS] };
  saveDevStore(initialStore);
  return initialStore;
}

function saveDevStore(store) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

// GET /api/reviews/all -- list all reviews for Admin with status
router.get("/all", requireAdmin, async (req, res) => {
  try {
    if (pool.isMock) {
      const store = getDevStore();
      const list = (store.reviews || []).map(r => ({
        ...r,
        status: r.status || "published"
      }));
      return res.json(list);
    }

    const { rows } = await pool.query("SELECT * FROM reviews ORDER BY created_at DESC");
    const list = rows.map(r => ({
      ...r,
      status: r.status || "published"
    }));
    res.json(list);
  } catch (err) {
    console.error("[Reviews] List all error:", err.message);
    const store = getDevStore();
    res.json(store.reviews || []);
  }
});

// GET /api/reviews -- list published reviews (storefront / PDP)
router.get("/", async (req, res) => {
  try {
    const { product_id } = req.query;

    if (pool.isMock) {
      const store = getDevStore();
      let list = (store.reviews || []).filter(
        r => r.status === "published" || r.status === "approved" || !r.status
      );
      if (product_id) {
        list = list.filter(r => String(r.product_id) === String(product_id));
      }
      return res.json(list);
    }

    let query = "SELECT * FROM reviews WHERE (status = 'published' OR status = 'approved' OR status IS NULL)";
    const params = [];
    if (product_id) {
      params.push(String(product_id));
      query += ` AND product_id = $${params.length}`;
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

// POST /api/reviews -- submit customer review (enters moderation queue as 'pending')
router.post("/", async (req, res) => {
  try {
    const { product_id, product_name, user_name, rating, comment, images } = req.body;
    if (!product_id || !comment) {
      return res.status(400).json({ error: "Product ID and feedback comment are required." });
    }

    const newReview = {
      product_id: String(product_id),
      product_name: product_name || "Atelier Garment",
      user_name: user_name || (req.user && req.user.name) || "Customer",
      rating: Number(rating) || 5,
      comment: comment.trim(),
      status: "pending",
      images: Array.isArray(images) ? images : [],
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
      `INSERT INTO reviews (product_id, product_name, user_name, rating, comment, status, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [newReview.product_id, newReview.product_name, newReview.user_name, newReview.rating, newReview.comment, newReview.status, JSON.stringify(newReview.images)]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("[Reviews] Submit error:", err.message);
    res.status(500).json({ error: "Failed to submit review." });
  }
});

// PATCH /api/reviews/:id/status -- moderate review status (Admin)
router.patch("/:id/status", requireAdmin, async (req, res) => {
  try {
    const reviewId = req.params.id;
    let { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status is required." });
    }

    const validStatuses = ["pending", "published", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    const normalizedStatus = status === "approved" ? "published" : status;

    if (pool.isMock) {
      const store = getDevStore();
      const review = (store.reviews || []).find(r => String(r.id) === String(reviewId));
      if (!review) return res.status(404).json({ error: "Review not found" });
      review.status = normalizedStatus;
      review.updated_at = new Date().toISOString();
      saveDevStore(store);
      return res.json({ success: true, review });
    }

    const { rows } = await pool.query(
      `UPDATE reviews SET status = $1 WHERE id = $2 RETURNING *`,
      [normalizedStatus, reviewId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }
    res.json({ success: true, review: rows[0] });
  } catch (err) {
    console.error("[Reviews] Status update error:", err.message);
    res.status(500).json({ error: "Failed to update review status." });
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
