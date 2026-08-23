const prisma = require('../prisma/client');

async function getCart(req, res) {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { user_id: req.user.userId },
      include: { product: true }
    });
    res.json(cartItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

async function addToCart(req, res) {
  try {
    const { product_id, quantity, size } = req.body;

    if (!product_id || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'product_id and a valid quantity are required' });
    }

    const product = await prisma.product.findUnique({ where: { id: parseInt(product_id) } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Check if this product with the specified size is already in the user's cart
    const existing = await prisma.cartItem.findFirst({
      where: { 
        user_id: req.user.userId, 
        product_id: parseInt(product_id),
        size: size || null
      }
    });

    let cartItem;
    if (existing) {
      cartItem = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + parseInt(quantity) }
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: { 
          user_id: req.user.userId, 
          product_id: parseInt(product_id), 
          quantity: parseInt(quantity),
          size: size || null
        }
      });
    }

    res.status(201).json(cartItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

async function updateCartItem(req, res) {
  try {
    const { quantity } = req.body;
    const cartItemId = parseInt(req.params.id);

    const existing = await prisma.cartItem.findUnique({ where: { id: cartItemId } });
    if (!existing || existing.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const cartItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity }
    });

    res.json(cartItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

async function removeCartItem(req, res) {
  try {
    const cartItemId = parseInt(req.params.id);

    const existing = await prisma.cartItem.findUnique({ where: { id: cartItemId } });
    if (!existing || existing.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };
