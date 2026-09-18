const express = require("express");
const router = express.Router();
const { pool } = require("../db");
const { requireAuth } = require("../auth");
const productService = require("../services/productService");

// Helper to safely determine available stock for a product & size
async function resolveMaxStock(productId, size) {
  try {
    const product = await productService.getProductById(productId);
    if (!product) return 10;
    if (product.size_stock && typeof product.size_stock === 'object' && size && product.size_stock[size] !== undefined) {
      const szStock = Number(product.size_stock[size]);
      if (!isNaN(szStock) && szStock >= 0) return Math.max(1, szStock);
    }
    if (product.stock !== undefined) {
      const totalStock = Number(product.stock);
      if (!isNaN(totalStock) && totalStock >= 0) return Math.max(1, totalStock);
    }
    return 10;
  } catch (e) {
    return 10;
  }
}

// Helper to sanitize quantity to a finite positive integer bounded by maxStock
function sanitizeQuantity(qty, maxStock = 10) {
  const parsed = parseInt(qty, 10);
  if (isNaN(parsed) || !Number.isFinite(parsed) || parsed < 1) return 1;
  const limit = Math.max(1, maxStock || 10);
  return Math.min(limit, parsed);
}

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

    // Self-healing: if any row has quantity exceeding maxStock or < 1, auto-repair it
    for (const r of rows) {
      const maxStock = await resolveMaxStock(r.product_id, r.size);
      const safeQty = sanitizeQuantity(r.quantity, maxStock);
      if (safeQty !== Number(r.quantity)) {
        await pool.query("UPDATE cart_items SET quantity = $1, updated_at = now() WHERE id = $2", [safeQty, r.id]);
        r.quantity = safeQty;
      }
    }

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

    const itemSize = size || "default";
    const maxStock = await resolveMaxStock(product_id, itemSize);
    const qty = sanitizeQuantity(quantity, maxStock);

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
      const currentQty = Number(existing.rows[0].quantity) || 1;
      const newQty = Math.min(maxStock, currentQty + qty);
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
          Math.min(maxStock, qty),
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

    if (pool.isMock) {
      return res.json({ success: true });
    }

    const cur = await pool.query("SELECT * FROM cart_items WHERE id = $1 AND user_id = $2", [cartItemId, userId]);
    if (cur.rows.length === 0) return res.status(404).json({ error: "Cart item not found." });

    const maxStock = await resolveMaxStock(cur.rows[0].product_id, cur.rows[0].size);
    const safeQty = sanitizeQuantity(quantity, maxStock);

    const { rows } = await pool.query(
      "UPDATE cart_items SET quantity = $1, updated_at = now() WHERE id = $2 AND user_id = $3 RETURNING *",
      [safeQty, cartItemId, userId]
    );

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

// POST /api/cart/merge -- merge guest cart on customer login (strictly bounded & idempotent)
router.post("/merge", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { items = [] } = req.body;

    if (!pool.isMock && Array.isArray(items)) {
      for (const it of items) {
        if (!it.product_id) continue;
        const size = it.size || "default";
        const maxStock = await resolveMaxStock(it.product_id, size);
        const incomingQty = sanitizeQuantity(it.quantity, maxStock);

        const existing = await pool.query(
          "SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2 AND size = $3",
          [userId, String(it.product_id), size]
        );

        if (existing.rows.length > 0) {
          // Idempotent merge: Take maximum of existing or incoming, never blind duplicate addition
          const currentQty = Number(existing.rows[0].quantity) || 1;
          const mergedQty = Math.min(maxStock, Math.max(currentQty, incomingQty));
          await pool.query(
            "UPDATE cart_items SET quantity = $1, updated_at = now() WHERE id = $2",
            [mergedQty, existing.rows[0].id]
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
              Math.min(maxStock, incomingQty),
              product?.image_url || null
            ]
          );
        }
      }
    }

    // Return the updated, clamped server cart
    let fullCart = [];
    if (!pool.isMock) {
      const { rows } = await pool.query(
        "SELECT * FROM cart_items WHERE user_id = $1 ORDER BY created_at ASC",
        [userId]
      );
      for (const r of rows) {
        const maxStock = await resolveMaxStock(r.product_id, r.size);
        const safeQty = sanitizeQuantity(r.quantity, maxStock);
        if (safeQty !== Number(r.quantity)) {
          await pool.query("UPDATE cart_items SET quantity = $1, updated_at = now() WHERE id = $2", [safeQty, r.id]);
          r.quantity = safeQty;
        }
      }
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

