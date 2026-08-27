/**
 * =========================================================================
 * SUKO ATELIER — UNIFIED CUSTOMER INTELLIGENCE CONTROLLER
 * Unified views combining online accounts and walk-in boutique POS activity
 * =========================================================================
 */

import prisma from '../prisma/client.js';

/**
 * Get unified customer list combining registered users & offline POS shoppers
 */
export const getUnifiedCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 100 } = req.query;
    const q = (search || '').trim().toLowerCase();

    // 1. Fetch ALL registered users
    const registeredUsers = await prisma.user.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        orders: {
          select: { id: true, total: true, status: true, created_at: true },
        },
        addresses: {
          select: { id: true, line1: true, city: true, state: true, pincode: true, phone: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // 2. Fetch POS Sales
    const posSales = await prisma.sale.findMany({
      select: {
        id: true,
        customer_name: true,
        customer_phone: true,
        total: true,
        status: true,
        created_at: true,
      },
    });

    const registeredPhoneMap = new Map();
    const registeredEmailMap = new Map();
    const customerProfiles = [];

    const activeThresholdMs = 5 * 60 * 1000; // 5 minutes
    const nowMs = Date.now();

    // Map Registered Users
    for (const u of registeredUsers) {
      const validOrders = u.orders.filter(o => o.status !== 'cancelled');
      const onlineSpend = validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const sortedDates = validOrders.map(o => new Date(o.created_at).getTime()).sort((a, b) => b - a);
      const isOnline = Boolean(
        u.is_online || (u.last_active_at && (nowMs - new Date(u.last_active_at).getTime()) <= activeThresholdMs)
      );

      const profile = {
        id: `USR-${u.id}`,
        user_id: u.id,
        name: u.name || (u.email ? u.email.split('@')[0] : 'Registered User'),
        email: u.email || 'N/A',
        phone: u.phone || 'N/A',
        role: u.role || 'customer',
        type: ['admin', 'super_admin'].includes(u.role) ? 'ADMIN' : 'REGISTERED',
        addresses: u.addresses || [],
        online_orders_count: validOrders.length,
        online_spend: onlineSpend,
        pos_sales_count: 0,
        pos_spend: 0,
        total_orders: validOrders.length,
        total_spend: onlineSpend,
        last_purchase_date: sortedDates.length > 0 ? new Date(sortedDates[0]) : null,
        last_login: u.last_login || null,
        last_active_at: u.last_active_at || null,
        is_online: isOnline,
        created_at: u.created_at,
      };

      customerProfiles.push(profile);
      if (u.phone) registeredPhoneMap.set(u.phone.trim(), profile);
      if (u.email) registeredEmailMap.set(u.email.trim().toLowerCase(), profile);
    }

    // Process POS Sales
    const walkinMap = new Map();
    for (const sale of posSales) {
      if (sale.status === 'CANCELLED') continue;
      const sPhone = sale.customer_phone ? sale.customer_phone.trim() : null;
      const sAmount = Number(sale.total || 0);
      const sDate = new Date(sale.created_at);

      if (sPhone && registeredPhoneMap.has(sPhone)) {
        const profile = registeredPhoneMap.get(sPhone);
        profile.pos_sales_count += 1;
        profile.pos_spend += sAmount;
        profile.total_orders += 1;
        profile.total_spend += sAmount;
        if (!profile.last_purchase_date || sDate > new Date(profile.last_purchase_date)) {
          profile.last_purchase_date = sDate;
        }
      } else if (sPhone) {
        if (!walkinMap.has(sPhone)) {
          const wProfile = {
            id: `WALK-${sPhone}`,
            user_id: null,
            name: sale.customer_name || 'Walk-in VIP Client',
            email: 'N/A',
            phone: sPhone,
            type: 'WALK_IN',
            online_orders_count: 0,
            online_spend: 0,
            pos_sales_count: 1,
            pos_spend: sAmount,
            total_orders: 1,
            total_spend: sAmount,
            last_purchase_date: sDate,
            created_at: sDate,
          };
          walkinMap.set(sPhone, wProfile);
          customerProfiles.push(wProfile);
        } else {
          const wProfile = walkinMap.get(sPhone);
          wProfile.pos_sales_count += 1;
          wProfile.pos_spend += sAmount;
          wProfile.total_orders += 1;
          wProfile.total_spend += sAmount;
          if (sDate > new Date(wProfile.last_purchase_date)) {
            wProfile.last_purchase_date = sDate;
          }
        }
      }
    }

    // Filter search
    let filtered = customerProfiles;
    if (q) {
      filtered = customerProfiles.filter(
        c =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
      );
    }

    // Sort by created_at descending
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      success: true,
      total: filtered.length,
      customers: filtered,
    });
  } catch (error) {
    console.error('Customer list error:', error);
    res.status(500).json({ success: false, message: 'Error fetching customers', error: error.message });
  }
};

/**
 * Get unified customer 360 profile with complete Online + POS + Returns ledger
 */
export const getCustomerDetails = async (req, res) => {
  try {
    const { identifier } = req.params; // Can be user_id (number) or phone string

    let user = null;
    let targetPhone = null;
    let targetEmail = null;

    const parsedUserId = parseInt(identifier, 10);
    if (!isNaN(parsedUserId) && !identifier.startsWith('WALK-')) {
      user = await prisma.user.findUnique({
        where: { id: parsedUserId },
      });
      if (user) {
        targetPhone = user.phone;
        targetEmail = user.email;
      }
    }

    if (!user) {
      // Treat identifier as phone or clean walk-in identifier
      targetPhone = identifier.replace(/^WALK-/, '').trim();
    }

    // Fetch all online orders
    let onlineOrders = [];
    if (user?.id || targetEmail) {
      onlineOrders = await prisma.order.findMany({
        where: {
          OR: [
            ...(user?.id ? [{ user_id: user.id }] : []),
            ...(targetEmail ? [{ user: { email: targetEmail } }] : []),
          ],
        },
        orderBy: { created_at: 'desc' },
        include: {
          items: { include: { product: true, variant: true } },
          payments: true,
        },
      });
    }

    // Fetch all POS sales by phone
    let posSales = [];
    if (targetPhone) {
      posSales = await prisma.sale.findMany({
        where: {
          customer_phone: targetPhone,
        },
        orderBy: { created_at: 'desc' },
        include: {
          items: { include: { product: true, variant: true } },
          payments: true,
        },
      });
    }

    // Fetch returns & exchanges
    const orderIds = onlineOrders.map(o => o.id);
    const saleIds = posSales.map(s => s.id);

    const returnRequests = await prisma.returnRequest.findMany({
      where: {
        OR: [
          ...(orderIds.length > 0 ? [{ order_id: { in: orderIds } }] : []),
          ...(saleIds.length > 0 ? [{ sale_id: { in: saleIds } }] : []),
          ...(targetPhone ? [{ customer_phone: targetPhone }] : []),
        ],
      },
      include: {
        product: true,
        variant: true,
        exchange_variant: true,
      },
    });

    const onlineSpend = onlineOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total), 0);
    const posSpend = posSales
      .filter(s => s.status === 'COMPLETED')
      .reduce((sum, s) => sum + Number(s.total), 0);

    res.json({
      success: true,
      profile: {
        user_id: user?.id || null,
        name: user?.name || posSales[0]?.customer_name || 'Walk-in Client',
        email: user?.email || null,
        phone: targetPhone || user?.phone || null,
        type: user ? 'REGISTERED' : 'WALK_IN',
        online_spend: onlineSpend,
        pos_spend: posSpend,
        total_spend: onlineSpend + posSpend,
        online_orders_count: onlineOrders.length,
        pos_sales_count: posSales.length,
        returns_count: returnRequests.length,
      },
      onlineOrders,
      posSales,
      returnRequests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching customer profile', error: error.message });
  }
};
