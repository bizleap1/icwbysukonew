const express = require("express");
const { pool } = require("../db");
const { requireAdmin } = require("../auth");

const router = express.Router();

// GET /api/stats -- admin dashboard summary
router.get("/", requireAdmin, async (req, res) => {
  try {
    const usersRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'customer'");
    const productsRes = await pool.query("SELECT COUNT(DISTINCT product_id) FROM order_items");
    const ordersRes = await pool.query("SELECT COUNT(*) FROM orders");
    const revenueRes = await pool.query(
      "SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE status IN ('paid', 'processing', 'completed')"
    );

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
