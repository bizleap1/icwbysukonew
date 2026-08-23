const prisma = require('../prisma/client');

async function getWishlist(req, res) {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { user_id: req.user.userId },
      include: { product: { include: { category: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json(wishlist.map(item => item.product));
  } catch (err) {
    console.error("Get wishlist error:", err);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
}

async function toggleWishlist(req, res) {
  try {
    const { product_id } = req.body;
    const userId = req.user.userId;

    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required' });
    }

    const existing = await prisma.wishlist.findUnique({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: parseInt(product_id)
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
          product_id: parseInt(product_id)
        }
      });
      return res.status(201).json({ message: 'Added to wishlist', inWishlist: true });
    }
  } catch (err) {
    console.error("Toggle wishlist error:", err);
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
}

async function removeFromWishlist(req, res) {
  try {
    const productId = parseInt(req.params.productId);
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
      return res.status(404).json({ error: 'Wishlist item not found' });
    }

    await prisma.wishlist.delete({ where: { id: existing.id } });
    res.json({ message: 'Item removed from wishlist' });
  } catch (err) {
    console.error("Remove from wishlist error:", err);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
}

module.exports = { getWishlist, toggleWishlist, removeFromWishlist };
