const prisma = require('../prisma/client');

async function getStats(req, res) {
  try {
    const totalUsers = await prisma.user.count();
    const totalProducts = await prisma.product.count();
    const totalOrders = await prisma.order.count();
    
    const orders = await prisma.order.findMany({
      select: { total: true }
    });
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

module.exports = { getStats };
