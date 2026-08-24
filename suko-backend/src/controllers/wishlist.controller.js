const prisma = require('../prisma/client');
const { validateIntegerId, rejectForbiddenFields } = require('../utils/validator');

/**
 * Get all wishlist products for authenticated user
 */
async function getWishlist(req, res) {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { user_id: req.user.userId },
      include: { product: { include: { category: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json(wishlist.map(item => item.product));
  } catch (err) {
    console.error("Get wishlist error:", err.message);
    res.status(500).json({ error: 'Failed to fetch wishlist.' });
  }
}

/**
 * Toggle product in wishlist (Used on product cards / PDP)
 */
async function toggleWishlist(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const { product_id } = req.body;
    const userId = req.user.userId;

    const productId = validateIntegerId(product_id, 'product ID');

    const existing = await prisma.wishlist.findUnique({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: productId
        }
      }
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: { id: existing.id }
      });
      return res.json({ message: 'Removed from wishlist', inWishlist: false });
    } else {
      await prisma.wishlist.create({
        data: {
          user_id: userId,
          product_id: productId
        }
      });
      return res.status(201).json({ message: 'Added to wishlist', inWishlist: true });
    }
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Toggle wishlist error:", err.message);
    res.status(500).json({ error: 'Failed to update wishlist.' });
  }
}

/**
 * Idempotent Bulk Wishlist Merge on Login (Ensures existence, NEVER toggles off)
 */
async function mergeWishlist(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const { product_ids } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(product_ids)) {
      return res.status(400).json({ error: 'product_ids must be an array of integers.' });
    }

    const warnings = [];

    await prisma.$transaction(async (tx) => {
      for (const rawId of product_ids) {
        const productId = parseInt(rawId, 10);
        if (isNaN(productId) || productId <= 0) continue;

        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) {
          warnings.push({ product_id: productId, reason: 'Product is no longer available.' });
          continue;
        }

        const existing = await tx.wishlist.findUnique({
          where: {
            user_id_product_id: {
              user_id: userId,
              product_id: productId
            }
          }
        });

        if (!existing) {
          await tx.wishlist.create({
            data: {
              user_id: userId,
              product_id: productId
            }
          });
        }
      }
    });

    // Return authoritative updated wishlist
    const finalWishlist = await prisma.wishlist.findMany({
      where: { user_id: userId },
      include: { product: { include: { category: true } } },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      wishlist: finalWishlist.map(item => item.product),
      warnings
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Wishlist merge error:", err.message);
    res.status(500).json({ error: 'Failed to synchronize wishlist.' });
  }
}

/**
 * Remove an item from wishlist
 */
async function removeFromWishlist(req, res) {
  try {
    const productId = validateIntegerId(req.params.productId, 'product ID');
    const userId = req.user.userId;

    const existing = await prisma.wishlist.findUnique({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: productId
        }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Wishlist item not found.' });
    }

    await prisma.wishlist.delete({ where: { id: existing.id } });
    res.json({ message: 'Item removed from wishlist.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Remove from wishlist error:", err.message);
    res.status(500).json({ error: 'Failed to remove from wishlist.' });
  }
}

module.exports = {
  getWishlist,
  toggleWishlist,
  mergeWishlist,
  removeFromWishlist
};
