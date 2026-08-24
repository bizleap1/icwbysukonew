const prisma = require('../prisma/client');
const { validateIntegerId, rejectForbiddenFields } = require('../utils/validator');

/**
 * Periodically clean up expired CartMergeRequest records (e.g. older than 24 hours)
 */
async function cleanupExpiredMergeRequests() {
  try {
    const count = await prisma.cartMergeRequest.deleteMany({
      where: { expires_at: { lt: new Date() } }
    });
    if (count.count > 0 && process.env.NODE_ENV !== 'test') {
      console.log(`🧹 Cleaned up ${count.count} expired cart merge idempotency records.`);
    }
  } catch (err) {
    // Non-fatal background cleanup log
    if (process.env.NODE_ENV !== 'test') {
      console.warn("Expired merge requests cleanup notice:", err.message);
    }
  }
}
setInterval(cleanupExpiredMergeRequests, 60 * 60 * 1000).unref();

/**
 * Get all cart items for authenticated user
 */
async function getCart(req, res) {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { user_id: req.user.userId },
      include: { product: true },
      orderBy: { id: 'asc' }
    });
    res.json(cartItems);
  } catch (err) {
    console.error("Get cart error:", err.message);
    res.status(500).json({ error: 'Failed to fetch cart items.' });
  }
}

/**
 * Add a single product to cart with exact size stock validation
 */
async function addToCart(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const { product_id, quantity, size } = req.body;

    const productId = validateIntegerId(product_id, 'product ID');
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ error: 'A valid positive quantity is required.' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    // Validate exact size stock
    let availStock = product.stock;
    if (size && product.size_stock && typeof product.size_stock === 'object' && product.size_stock[size] !== undefined) {
      availStock = product.size_stock[size];
    }

    if (availStock <= 0) {
      return res.status(400).json({ error: `Selected size '${size || 'Standard'}' is currently out of stock.` });
    }

    // Check existing cart item for exact product and size
    const existing = await prisma.cartItem.findFirst({
      where: { 
        user_id: req.user.userId, 
        product_id: productId,
        size: size || null
      }
    });

    let cartItem;
    if (existing) {
      const newQty = Math.min(availStock, existing.quantity + qty);
      cartItem = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
        include: { product: true }
      });
    } else {
      const initialQty = Math.min(availStock, qty);
      cartItem = await prisma.cartItem.create({
        data: { 
          user_id: req.user.userId, 
          product_id: productId, 
          quantity: initialQty,
          size: size || null
        },
        include: { product: true }
      });
    }

    res.status(201).json(cartItem);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Add to cart error:", err.message);
    res.status(500).json({ error: 'Failed to add item to cart.' });
  }
}

/**
 * Durable Idempotent Bulk Cart Merge on Login
 * Merges guest items into server cart with backend-authoritative size stock validation.
 * Uses durable PostgreSQL CartMergeRequest table to prevent double additions across
 * server restarts, multiple instances, and lost responses.
 */
async function mergeCart(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const { items, merge_id } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array of cart lines.' });
    }

    const cleanMergeId = merge_id ? String(merge_id).trim() : null;

    // Check durable PostgreSQL idempotency record before transaction
    if (cleanMergeId) {
      const existingMerge = await prisma.cartMergeRequest.findUnique({
        where: {
          user_id_merge_id: {
            user_id: userId,
            merge_id: cleanMergeId
          }
        }
      });

      if (existingMerge && existingMerge.status === 'completed') {
        const finalCart = await prisma.cartItem.findMany({
          where: { user_id: userId },
          include: { product: true },
          orderBy: { id: 'asc' }
        });

        return res.json({
          cart: finalCart,
          warnings: existingMerge.warnings || [],
          idempotent_replay: true
        });
      }
    }

    const warnings = [];

    await prisma.$transaction(async (tx) => {
      // Create durable idempotency record inside transaction if merge_id provided
      if (cleanMergeId) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24-hour TTL
        await tx.cartMergeRequest.create({
          data: {
            user_id: userId,
            merge_id: cleanMergeId,
            status: 'completed',
            warnings: warnings,
            expires_at: expiresAt
          }
        });
      }

      for (const item of items) {
        if (!item || !item.id && !item.product_id) continue;
        const productId = parseInt(item.product_id || item.id, 10);
        if (isNaN(productId) || productId <= 0) continue;

        const guestQty = parseInt(item.quantity || item.qty || 1, 10);
        if (isNaN(guestQty) || guestQty <= 0) continue;

        const size = item.size ? String(item.size).trim() : null;

        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) {
          warnings.push({ product_id: productId, size, reason: 'Product is no longer available.' });
          continue;
        }

        // Determine available stock for the requested exact size
        let availStock = product.stock;
        if (size && product.size_stock && typeof product.size_stock === 'object' && product.size_stock[size] !== undefined) {
          availStock = product.size_stock[size];
        }

        if (availStock <= 0) {
          warnings.push({
            product_id: productId,
            name: product.name,
            size,
            reason: `'${product.name}' (${size || 'Standard'}) is out of stock.`
          });
          continue;
        }

        // Check if user already has this product + size in server cart
        const existing = await tx.cartItem.findFirst({
          where: {
            user_id: userId,
            product_id: productId,
            size: size || null
          }
        });

        const currentServerQty = existing ? existing.quantity : 0;
        const targetQty = currentServerQty + guestQty;
        const finalQty = Math.min(availStock, targetQty);

        if (finalQty < targetQty) {
          warnings.push({
            product_id: productId,
            name: product.name,
            size,
            requested: targetQty,
            adjusted: finalQty,
            reason: `Quantity for '${product.name}' was adjusted to available inventory (${finalQty} units).`
          });
        }

        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: finalQty }
          });
        } else if (finalQty > 0) {
          await tx.cartItem.create({
            data: {
              user_id: userId,
              product_id: productId,
              size: size || null,
              quantity: finalQty
            }
          });
        }
      }

      // Update warnings in durable idempotency record if warnings were generated
      if (cleanMergeId && warnings.length > 0) {
        await tx.cartMergeRequest.update({
          where: {
            user_id_merge_id: {
              user_id: userId,
              merge_id: cleanMergeId
            }
          },
          data: { warnings }
        });
      }
    });

    // Return the updated authoritative server cart
    const finalCart = await prisma.cartItem.findMany({
      where: { user_id: userId },
      include: { product: true },
      orderBy: { id: 'asc' }
    });

    res.json({
      cart: finalCart,
      warnings
    });
  } catch (err) {
    // Handle concurrent duplicate merge_id collision gracefully (P2002 unique constraint)
    if (err.code === 'P2002') {
      try {
        const finalCart = await prisma.cartItem.findMany({
          where: { user_id: req.user.userId },
          include: { product: true },
          orderBy: { id: 'asc' }
        });
        return res.json({
          cart: finalCart,
          warnings: [],
          idempotent_replay: true
        });
      } catch (innerErr) {
        console.error("Cart merge collision resolution error:", innerErr.message);
      }
    }

    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Cart merge error:", err.message);
    res.status(500).json({ error: 'Failed to synchronize cart with server.' });
  }
}

/**
 * Update quantity of an existing cart line item with exact size-stock bounds
 */
async function updateCartItem(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const { quantity } = req.body;
    const cartItemId = validateIntegerId(req.params.id, 'cart item ID');
    const newQty = parseInt(quantity, 10);

    if (isNaN(newQty) || newQty < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1.' });
    }

    const existing = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: true }
    });

    if (!existing || existing.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }

    // Validate exact size stock
    let availStock = existing.product.stock;
    if (existing.size && existing.product.size_stock && typeof existing.product.size_stock === 'object' && existing.product.size_stock[existing.size] !== undefined) {
      availStock = existing.product.size_stock[existing.size];
    }

    if (availStock <= 0) {
      return res.status(400).json({ error: `Selected size '${existing.size || 'Standard'}' is out of stock.` });
    }

    const finalQty = Math.min(availStock, newQty);

    const cartItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: finalQty },
      include: { product: true }
    });

    res.json(cartItem);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Update cart item error:", err.message);
    res.status(500).json({ error: 'Failed to update cart item.' });
  }
}

/**
 * Remove an item from cart
 */
async function removeCartItem(req, res) {
  try {
    const cartItemId = validateIntegerId(req.params.id, 'cart item ID');

    const existing = await prisma.cartItem.findUnique({ where: { id: cartItemId } });
    if (!existing || existing.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });
    res.json({ message: 'Item removed from cart.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Remove cart item error:", err.message);
    res.status(500).json({ error: 'Failed to remove cart item.' });
  }
}

module.exports = {
  getCart,
  addToCart,
  mergeCart,
  updateCartItem,
  removeCartItem,
  cleanupExpiredMergeRequests
};
