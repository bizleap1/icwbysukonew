const prisma = require('../prisma/client');
const { ORDER_STATUS } = require('../utils/orderStateMachine');

/**
 * Calculates authoritative dashboard metrics directly from the live database using SQL aggregates.
 * Revenue is strictly computed from paid/captured/delivered orders only via DB _sum.
 */
async function getStats(req, res) {
  try {
    const PAID_STATUSES = [
      ORDER_STATUS.PAID,
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.SHIPPED,
      ORDER_STATUS.DELIVERED
    ];

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      revenueAggregate,
      statusBreakdown
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: PAID_STATUSES } }
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ]);

    const totalRevenue = Number(revenueAggregate._sum.total || 0);

    const countsByStatus = {};
    for (const item of statusBreakdown) {
      countsByStatus[item.status] = item._count.id;
    }

    const paidCount = PAID_STATUSES.reduce((acc, st) => acc + (countsByStatus[st] || 0), 0);
    const pendingOrdersCount = countsByStatus[ORDER_STATUS.PAYMENT_PENDING] || 0;
    const cancelRequestedCount = countsByStatus[ORDER_STATUS.CANCEL_REQUESTED] || 0;
    const cancelledOrdersCount = countsByStatus[ORDER_STATUS.CANCELLED] || 0;

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      breakdown: {
        paid: paidCount,
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
