const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { requireAuth } = require("../auth");
const productService = require("../services/productService");

// Helper to format a cart item row with embedded product details
async function formatCartItem(row) {
  const product = await productService.getProductById(row.product_id);
  return {
    id: row.id,
    product_id: row.product_id,
    size: row.size || "default",
    quantity: Number(row.quantity) || 1,
    created_at: row.created_at,
    product: product ? {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price) || Number(row.price) || 0,
      image_url: product.image_url || row.image_url || "/placeholder.png",
      images: Array.isArray(product.images) ? product.images : [product.image_url || "/placeholder.png"],
      stock: typeof product.stock !== "undefined" ? Number(product.stock) : 10
    } : {
      id: row.product_id,
      name: row.product_name || "Atelier Silhouette",
      slug: row.product_id,
      price: Number(row.price) || 0,
      image_url: row.image_url || "/placeholder.png",
      images: [row.image_url || "/placeholder.png"],
      stock: 10
    }
  };
}

// GET /api/cart -- get user's active bag items
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    if (pool.isMock) {
      return res.json([]);
    }

    const { rows } = await pool.query(
      "SELECT * FROM cart_items WHERE user_id = $1 ORDER BY created_at ASC",
      [userId]
    );

    const formatted = await Promise.all(rows.map(formatCartItem));
    res.json(formatted);
  } catch (err) {
    console.error("[Cart] Fetch error:", err.message);
    res.json([]);
  }
});

// POST /api/cart -- add item to bag
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { product_id, size, quantity } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: "Product ID required." });
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const itemSize = size || "default";

    if (pool.isMock) {
      return res.status(201).json({ success: true, message: "Added to cart" });
    }

    // Check if item variant already in cart
    const existing = await pool.query(
      "SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2 AND size = $3",
      [userId, String(product_id), itemSize]
    );

    let savedRow;
    if (existing.rows.length > 0) {
      const newQty = existing.rows[0].quantity + qty;
      const upd = await pool.query(
        "UPDATE cart_items SET quantity = $1, updated_at = now() WHERE id = $2 RETURNING *",
        [newQty, existing.rows[0].id]
      );
      savedRow = upd.rows[0];
    } else {
      const product = await productService.getProductById(product_id);
      const ins = await pool.query(
        `INSERT INTO cart_items (user_id, product_id, product_name, price, size, quantity, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          userId,
          String(product_id),
          product?.name || "Atelier Garment",
          product?.price || 0,
          itemSize,
          qty,
          product?.image_url || null
        ]
      );
      savedRow = ins.rows[0];
    }

    const formatted = await formatCartItem(savedRow);
    res.status(201).json(formatted);
  } catch (err) {
    console.error("[Cart] Add error:", err.message);
    res.status(500).json({ error: "Failed to add to bag." });
  }
});

// PUT /api/cart/:id -- update quantity
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartItemId = req.params.id;
    const { quantity } = req.body;
    const safeQty = Math.max(1, Number(quantity) || 1);

    if (pool.isMock) {
      return res.json({ success: true });
    }

    const { rows } = await pool.query(
      "UPDATE cart_items SET quantity = $1, updated_at = now() WHERE id = $2 AND user_id = $3 RETURNING *",
      [safeQty, cartItemId, userId]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Cart item not found." });

    const formatted = await formatCartItem(rows[0]);
    res.json(formatted);
  } catch (err) {
    console.error("[Cart] Update error:", err.message);
    res.status(500).json({ error: "Failed to update bag item." });
  }
});

// DELETE /api/cart/:id -- remove item from bag
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartItemId = req.params.id;

    if (pool.isMock) {
      return res.json({ success: true, message: "Item removed from bag." });
    }

    await pool.query("DELETE FROM cart_items WHERE id = $1 AND user_id = $2", [cartItemId, userId]);
    res.json({ success: true, message: "Item removed from bag." });
  } catch (err) {
    console.error("[Cart] Delete error:", err.message);
    res.status(500).json({ error: "Failed to remove bag item." });
  }
});

// POST /api/cart/merge -- merge guest cart on customer login
router.post("/merge", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { items = [] } = req.body;

    if (!pool.isMock && Array.isArray(items)) {
      for (const it of items) {
        if (!it.product_id) continue;
        const size = it.size || "default";
        const qty = Math.max(1, Number(it.quantity) || 1);

        const existing = await pool.query(
          "SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2 AND size = $3",
          [userId, String(it.product_id), size]
        );

        if (existing.rows.length > 0) {
          await pool.query(
            "UPDATE cart_items SET quantity = quantity + $1, updated_at = now() WHERE id = $2",
            [qty, existing.rows[0].id]
          );
        } else {
          const product = await productService.getProductById(it.product_id);
          await pool.query(
            `INSERT INTO cart_items (user_id, product_id, product_name, price, size, quantity, image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              userId,
              String(it.product_id),
              product?.name || "Atelier Silhouette",
              product?.price || 0,
              size,
              qty,
              product?.image_url || null
            ]
          );
        }
      }
    }

    // Return the updated server cart
    let fullCart = [];
    if (!pool.isMock) {
      const { rows } = await pool.query(
        "SELECT * FROM cart_items WHERE user_id = $1 ORDER BY created_at ASC",
        [userId]
      );
      fullCart = await Promise.all(rows.map(formatCartItem));
    }

    res.json({
      success: true,
      cart: fullCart,
      warnings: []
    });
  } catch (err) {
    console.error("[Cart] Merge error:", err.message);
    res.json({ success: true, cart: [], warnings: [] });
  }
});

module.exports = router;
