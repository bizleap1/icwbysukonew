const prisma = require('../prisma/client');
const { ORDER_STATUS } = require('../utils/orderStateMachine');

/**
 * Calculates authoritative dashboard metrics directly from the live database.
 * Revenue is strictly computed from paid/captured/delivered orders only.
 */
async function getStats(req, res) {
  try {
    const totalUsers = await prisma.user.count();
    const totalProducts = await prisma.product.count();
    const totalOrders = await prisma.order.count();
    
    // Revenue is strictly computed from valid paid/captured orders, never from pending, expired or cancelled
    const paidOrders = await prisma.order.findMany({
      where: {
        status: {
          in: [
            ORDER_STATUS.PAID,
            ORDER_STATUS.PROCESSING,
            ORDER_STATUS.SHIPPED,
            ORDER_STATUS.DELIVERED
          ]
        }
      },
      select: { total: true }
    });

    const totalRevenue = paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    const paidOrdersCount = paidOrders.length;
    const pendingOrdersCount = await prisma.order.count({ where: { status: ORDER_STATUS.PAYMENT_PENDING } });
    const cancelRequestedCount = await prisma.order.count({ where: { status: ORDER_STATUS.CANCEL_REQUESTED } });
    const cancelledOrdersCount = await prisma.order.count({ where: { status: ORDER_STATUS.CANCELLED } });

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      breakdown: {
        paid: paidOrdersCount,
        pending: pendingOrdersCount,
        cancel_requested: cancelRequestedCount,
        cancelled: cancelledOrdersCount
      }
    });
  } catch (err) {
    console.error("getStats error:", err);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
}

module.exports = { getStats };
