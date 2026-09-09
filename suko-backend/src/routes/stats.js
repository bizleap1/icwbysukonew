const express = require("express");
const { pool } = require("../db");
const { requireAdmin } = require("../auth");

const router = express.Router();

// GET /api/stats -- admin dashboard summary
router.get("/", requireAdmin, async (req, res) => {
  try {
    const [usersRes, productsRes, ordersRes, revenueRes] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'customer'"),
      pool.query("SELECT COUNT(*) FROM products WHERE status != 'archived'"),
      pool.query("SELECT COUNT(*) FROM orders"),
      pool.query("SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE status IN ('paid', 'processing', 'completed', 'delivered')")
    ]);

    res.json({
      totalUsers: parseInt(usersRes.rows[0].count, 10),
      totalProducts: parseInt(productsRes.rows[0].count, 10),
      totalOrders: parseInt(ordersRes.rows[0].count, 10),
      totalRevenue: Number(revenueRes.rows[0].revenue),
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to load stats." });
  }
});

module.exports = router;
