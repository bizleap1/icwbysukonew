const prisma = require('../prisma/client');

async function subscribeStockAlert(req, res) {
  try {
    const { email, product_id, size } = req.body;
    const userId = req.user?.userId || null;

    if (!email || !product_id) {
      return res.status(400).json({ error: 'Email and product_id are required' });
    }

    const alert = await prisma.stockNotification.create({
      data: {
        user_id: userId,
        email: email.trim().toLowerCase(),
        product_id: parseInt(product_id),
        size: size || null
      }
    });

    res.status(201).json({ message: 'Stock notification registered', alert });
  } catch (err) {
    console.error("Subscribe stock alert error:", err);
    res.status(500).json({ error: 'Failed to subscribe for stock notification' });
  }
}

module.exports = { subscribeStockAlert };
