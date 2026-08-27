import prisma from '../prisma/client.js';

export const getWishlist = async (req, res) => {
  try {
    const items = await prisma.wishlist.findMany({
      where: { user_id: req.user.id },
      include: { product: true },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wishlist', error: error.message });
  }
};

export const toggleWishlist = async (req, res) => {
  try {
    const { product_id } = req.body;
    const pid = parseInt(product_id);

    const existing = await prisma.wishlist.findUnique({
      where: {
        user_id_product_id: {
          user_id: req.user.id,
          product_id: pid,
        },
      },
    });

    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
      return res.json({ message: 'Removed from wishlist', isWishlisted: false });
    }

    const item = await prisma.wishlist.create({
      data: {
        user_id: req.user.id,
        product_id: pid,
      },
      include: { product: true },
    });

    res.status(201).json({ message: 'Added to wishlist', isWishlisted: true, item });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling wishlist', error: error.message });
  }
};

export const removeWishlistItem = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.wishlist.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing wishlist item', error: error.message });
  }
};
