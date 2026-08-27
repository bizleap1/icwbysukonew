/**
 * =========================================================================
 * SUKO ATELIER — BOUTIQUE OPERATIONS & DASHBOARD ANALYTICS
 * 100% Real Live Metrics — Online Orders, POS Counters, 7-Day Trends, Top Sellers
 * =========================================================================
 */

import prisma from '../prisma/client.js';

export const getAdminStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Parallel fetch for speed
    const [
      onlineOrdersToday,
      posSalesToday,
      lifetimeOrders,
      lifetimePosSales,
      allVariants,
      pendingReturnsCount,
      totalCustomers,
      recentOnlineOrders,
      recentPosSales,
      sevenDaysOrders,
      sevenDaysSales,
      topSaleItems,
      topOrderItems,
      liveOnlineUsers,
      recentUserLogins,
    ] = await Promise.all([
      // Today's online orders
      prisma.order.findMany({
        where: { created_at: { gte: startOfToday }, status: { not: 'cancelled' } },
        include: { items: true },
      }),
      // Today's POS sales
      prisma.sale.findMany({
        where: { created_at: { gte: startOfToday }, status: 'COMPLETED' },
        include: { items: true },
      }),
      // Lifetime online orders aggregate
      prisma.order.aggregate({
        where: { status: { not: 'cancelled' } },
        _sum: { total: true },
        _count: { id: true },
      }),
      // Lifetime POS sales aggregate
      prisma.sale.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { total: true },
        _count: { id: true },
      }),
      // Variant stock for low/out-of-stock counts
      prisma.productVariant.findMany({
        where: { is_active: true },
        select: { stock: true, reserved_stock: true, low_stock_alert: true },
      }),
      // Pending return requests
      prisma.returnRequest.count({
        where: { status: 'REQUESTED' },
      }),
      // Customer count
      prisma.user.count({ where: { role: 'customer' } }),
      // Recent online orders
      prisma.order.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: { user: { select: { name: true, email: true } }, items: true },
      }),
      // Recent POS sales
      prisma.sale.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: { items: true },
      }),
      // Last 7 days orders
      prisma.order.findMany({
        where: { created_at: { gte: sevenDaysAgo }, status: { not: 'cancelled' } },
        select: { total: true, created_at: true },
      }),
      // Last 7 days POS sales
      prisma.sale.findMany({
        where: { created_at: { gte: sevenDaysAgo }, status: 'COMPLETED' },
        select: { total: true, created_at: true },
      }),
      // Top POS items
      prisma.saleItem.groupBy({
        by: ['product_id'],
        _sum: { quantity: true, total_price: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      // Top Order items
      prisma.orderItem.groupBy({
        by: ['product_id'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      // Live Online Users (Active in last 5 minutes)
      prisma.user.findMany({
        where: {
          OR: [
            { is_online: true },
            { last_active_at: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
          ],
        },
        select: { id: true, name: true, email: true, role: true, last_login: true, last_active_at: true, is_online: true },
      }),
      // Recent User Logins & Registrations
      prisma.user.findMany({
        where: { last_login: { not: null } },
        orderBy: { last_login: 'desc' },
        take: 8,
        select: { id: true, name: true, email: true, role: true, last_login: true, last_active_at: true, is_online: true },
      }),
    ]);

    // 1. Today Calculations
    const todayOnlineRevenue = onlineOrdersToday.reduce((sum, o) => sum + Number(o.total), 0);
    const todayPosRevenue = posSalesToday.reduce((sum, s) => sum + Number(s.total), 0);
    const todayRevenue = todayOnlineRevenue + todayPosRevenue;

    let itemsSoldToday = 0;
    onlineOrdersToday.forEach(o => o.items.forEach(it => { itemsSoldToday += it.quantity; }));
    posSalesToday.forEach(s => s.items.forEach(it => { itemsSoldToday += it.quantity; }));

    // 2. Lifetime Revenue
    const lifetimeOnlineRevenue = Number(lifetimeOrders._sum.total || 0);
    const lifetimePosRevenue = Number(lifetimePosSales._sum.total || 0);
    const totalRevenue = lifetimeOnlineRevenue + lifetimePosRevenue;
    const totalOrders = (lifetimeOrders._count.id || 0) + (lifetimePosSales._count.id || 0);

    // 3. Variant Stock Statuses
    let lowStockVariants = 0;
    let outOfStockVariants = 0;
    allVariants.forEach(v => {
      const available = Math.max(0, v.stock - v.reserved_stock);
      const threshold = v.low_stock_alert ?? 2;
      if (v.stock <= 0) outOfStockVariants++;
      else if (available <= threshold) lowStockVariants++;
    });

    // 4. Last 7 Days Daily Breakdown
    const last7DaysMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      last7DaysMap.set(key, { date: key, label: dayName, onlineSales: 0, posSales: 0, totalSales: 0 });
    }

    sevenDaysOrders.forEach(o => {
      const key = new Date(o.created_at).toISOString().slice(0, 10);
      if (last7DaysMap.has(key)) {
        const entry = last7DaysMap.get(key);
        entry.onlineSales += Number(o.total);
        entry.totalSales += Number(o.total);
      }
    });

    sevenDaysSales.forEach(s => {
      const key = new Date(s.created_at).toISOString().slice(0, 10);
      if (last7DaysMap.has(key)) {
        const entry = last7DaysMap.get(key);
        entry.posSales += Number(s.total);
        entry.totalSales += Number(s.total);
      }
    });

    const last7DaysSalesArray = Array.from(last7DaysMap.values());

    // 5. Top Products Lookup
    const topProductIds = Array.from(new Set([
      ...topSaleItems.map(t => t.product_id),
      ...topOrderItems.map(t => t.product_id),
    ])).slice(0, 5);

    let topProducts = [];
    if (topProductIds.length > 0) {
      const prods = await prisma.product.findMany({
        where: { id: { in: topProductIds } },
        select: { id: true, name: true, price: true, image_url: true },
      });

      topProducts = prods.map(p => {
        const posSold = topSaleItems.find(it => it.product_id === p.id)?._sum?.quantity || 0;
        const onlineSold = topOrderItems.find(it => it.product_id === p.id)?._sum?.quantity || 0;
        return {
          id: p.id,
          name: p.name,
          price: Number(p.price),
          image_url: p.image_url,
          unitsSold: posSold + onlineSold,
        };
      }).sort((a, b) => b.unitsSold - a.unitsSold);
    }

    // 6. Category breakdown
    const categoryBreakdown = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
    });

    res.json({
      success: true,
      todayRevenue,
      todayOnlineRevenue,
      todayPosRevenue,
      ordersToday: onlineOrdersToday.length,
      posSalesToday: posSalesToday.length,
      itemsSoldToday,
      totalRevenue,
      totalOnlineRevenue: lifetimeOnlineRevenue,
      totalPosRevenue: lifetimePosRevenue,
      totalOrders,
      totalCustomers,
      lowStockVariants,
      outOfStockVariants,
      pendingReturns: pendingReturnsCount,
      last7DaysSales: last7DaysSalesArray,
      topProducts,
      categoryBreakdown,
      recentOrders: recentOnlineOrders,
      recentPosSales,
      onlineUsersCount: liveOnlineUsers.length,
      onlineUsers: liveOnlineUsers,
      recentLogins: recentUserLogins,
    });
  } catch (error) {
    console.error('Stats controller error:', error);
    res.status(500).json({ success: false, message: 'Error fetching operations statistics', error: error.message });
  }
};
