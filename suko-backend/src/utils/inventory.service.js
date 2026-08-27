const prisma = require('../prisma/client');
const { ORDER_STATUS, RESERVATION_STATUS } = require('./orderStateMachine');

/**
 * Idempotently and atomically releases inventory for an order whose reservation is active.
 * Only the transaction that successfully changes reservation_status from 'reserved' to 'released'
 * will execute the inventory restoration.
 * 
 * @param {number} orderId 
 * @param {string} reason - 'expired' | 'payment_failed' | 'cancelled'
 * @param {object} [callerTx] - Optional existing transaction client
 * @returns {Promise<{ success: boolean, alreadyReleased: boolean, message: string }>}
 */
async function releaseOrderReservation(orderId, reason = ORDER_STATUS.EXPIRED, callerTx = null) {
  const executeInTx = async (tx) => {
    // 1. Atomically attempt to claim the release
    const claimResult = await tx.order.updateMany({
      where: {
        id: parseInt(orderId),
        reservation_status: { in: [RESERVATION_STATUS.RESERVED, RESERVATION_STATUS.FINALIZED] },
        inventory_released_at: null
      },
      data: {
        reservation_status: RESERVATION_STATUS.RELEASED,
        inventory_released_at: new Date(),
        status: reason
      }
    });

    // If 0 rows updated, it means another process or request already released or finalized this reservation
    if (claimResult.count === 0) {
      return { success: true, alreadyReleased: true, message: 'Reservation was already released or finalized' };
    }

    // 2. Fetch the order items to restore exact size stock and overall product stock
    const order = await tx.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { items: true }
    });

    if (!order || !order.items || order.items.length === 0) {
      return { success: true, alreadyReleased: false, message: 'Reservation claimed, no items to restore' };
    }

    // 3. Sort product IDs to prevent deadlocks during concurrent multi-item updates
    const productIds = [...new Set(order.items.map(item => item.product_id))].sort((a, b) => a - b);

    for (const pId of productIds) {
      const product = await tx.product.findUnique({ where: { id: pId } });
      if (!product) continue;

      const itemsForProduct = order.items.filter(item => item.product_id === pId);
      let updatedSizeStock = {};
      
      if (product.size_stock) {
        try {
          updatedSizeStock = typeof product.size_stock === 'string'
            ? JSON.parse(product.size_stock)
            : { ...product.size_stock };
        } catch (e) {
          updatedSizeStock = {};
        }
      }

      let totalQtyToRestore = 0;

      for (const item of itemsForProduct) {
        const qty = parseInt(item.quantity) || 1;
        totalQtyToRestore += qty;

        if (item.size && (product.sizes?.length > 0 || Object.keys(updatedSizeStock).length > 0)) {
          const currentSizeQty = parseInt(updatedSizeStock[item.size] || 0);
          updatedSizeStock[item.size] = currentSizeQty + qty;
        }
      }

      const hasSizeStock = Object.keys(updatedSizeStock).length > 0;
      const finalStock = hasSizeStock
        ? Object.values(updatedSizeStock).reduce((acc, val) => acc + (parseInt(val) || 0), 0)
        : (product.stock + totalQtyToRestore);

      await tx.product.update({
        where: { id: pId },
        data: {
          stock: finalStock,
          ...(hasSizeStock && { size_stock: updatedSizeStock })
        }
      });
    }

    return { success: true, alreadyReleased: false, message: `Reservation released and stock restored for order #${orderId}` };
  };

  if (callerTx) {
    return await executeInTx(callerTx);
  } else {
    return await prisma.$transaction(executeInTx);
  }
}

/**
 * Sweeper function that finds all expired, unpaid orders and releases their inventory.
 * Designed to be called either by a scheduled background worker, external cron, or on server startup.
 * 
 * @returns {Promise<{ sweptCount: number, errors: Array }>}
 */
async function sweepExpiredReservations() {
  try {
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: ORDER_STATUS.PAYMENT_PENDING,
        reservation_status: RESERVATION_STATUS.RESERVED,
        expires_at: {
          lt: new Date()
        }
      },
      select: { id: true, expires_at: true }
    });

    if (expiredOrders.length === 0) {
      return { sweptCount: 0, errors: [] };
    }

    console.log(`🧹 [Inventory Sweeper] Found ${expiredOrders.length} expired unpaid order reservations to sweep.`);
    let sweptCount = 0;
    const errors = [];

    for (const ord of expiredOrders) {
      try {
        const res = await releaseOrderReservation(ord.id, ORDER_STATUS.EXPIRED);
        if (res.success && !res.alreadyReleased) {
          sweptCount++;
        }
      } catch (err) {
        console.error(`❌ Error sweeping expired reservation for order #${ord.id}:`, err.message);
        errors.push({ orderId: ord.id, error: err.message });
      }
    }

    console.log(`✅ [Inventory Sweeper] Successfully swept ${sweptCount} expired reservations.`);
    return { sweptCount, errors };
  } catch (err) {
    console.error("❌ Failed to run sweepExpiredReservations:", err);
    return { sweptCount: 0, errors: [err.message] };
  }
}

module.exports = {
  releaseOrderReservation,
  sweepExpiredReservations
};
