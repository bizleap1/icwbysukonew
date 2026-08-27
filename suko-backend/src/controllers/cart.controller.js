import prisma from '../prisma/client.js';

export const getCart = async (req, res) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { user_id: req.user.id },
      include: {
        product: true,
        variant: true,
      },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching cart', error: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const rawProductId = req.body.product_id || req.body.productId;
    const { quantity = 1, size, variant_id } = req.body;

    const pid = parseInt(rawProductId, 10);
    const qty = parseInt(quantity, 10) || 1;

    let targetVariantId = variant_id ? parseInt(variant_id, 10) : null;

    // Resolve variant if not explicitly provided
    if (!targetVariantId && size) {
      const variant = await prisma.productVariant.findFirst({
        where: {
          product_id: pid,
          size: { equals: size, mode: 'insensitive' },
        },
      });
      if (variant) targetVariantId = variant.id;
    }

    const existing = await prisma.cartItem.findFirst({
      where: {
        user_id: req.user.id,
        product_id: pid,
        size: size || null,
      },
    });

    if (existing) {
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + qty,
          ...(targetVariantId ? { variant_id: targetVariantId } : {}),
        },
        include: { product: true, variant: true },
      });
      return res.json({ success: true, message: 'Cart updated', cartItem: updated });
    }

    const item = await prisma.cartItem.create({
      data: {
        user_id: req.user.id,
        product_id: pid,
        variant_id: targetVariantId,
        quantity: qty,
        size: size || null,
      },
      include: { product: true, variant: true },
    });

    res.status(201).json({ success: true, message: 'Item added to cart', cartItem: item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding to cart', error: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, size } = req.body;

    const existing = await prisma.cartItem.findFirst({
      where: { id: parseInt(id, 10), user_id: req.user.id },
    });

    if (!existing) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to modify this cart item.' });
    }

    let targetVariantId = existing.variant_id;
    if (size && size !== existing.size) {
      const v = await prisma.productVariant.findFirst({
        where: {
          product_id: existing.product_id,
          size: { equals: size, mode: 'insensitive' },
        },
      });
      if (v) targetVariantId = v.id;
    }

    const updated = await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        ...(quantity !== undefined && { quantity: Math.max(1, parseInt(quantity, 10)) }),
        ...(size !== undefined && { size, variant_id: targetVariantId }),
      },
      include: { product: true, variant: true },
    });

    res.json({ success: true, message: 'Cart item updated', cartItem: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating cart item', error: error.message });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.cartItem.findFirst({
      where: { id: parseInt(id, 10), user_id: req.user.id },
    });

    if (!existing) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to delete this cart item.' });
    }

    await prisma.cartItem.delete({ where: { id: existing.id } });
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error removing item from cart', error: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({ where: { user_id: req.user.id } });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error clearing cart', error: error.message });
  }
};
