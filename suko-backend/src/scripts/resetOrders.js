/**
 * =========================================================================
 * SUKO ATELIER — COMPLETE ORDERS & SALES RESET SCRIPT
 * Cleans all test orders, POS sales, payments, returns, reservations,
 * and resets all revenue and order counters to 0 for production launch.
 * Preserves products, categories, coupons, store settings, and admin accounts.
 * =========================================================================
 */

import prisma from '../prisma/client.js';
import { ensureDatabaseRunning } from '../config/db-bootstrap.js';

export async function resetAllOrdersAndSales(options = { resetCustomers: false }) {
  console.log('🔄 [Reset] Starting Complete Orders & Sales Reset...');
  await ensureDatabaseRunning();

  const results = await prisma.$transaction(async (tx) => {
    // 1. Delete Return Requests
    const deletedReturns = await tx.returnRequest.deleteMany({});

    // 2. Delete Order Items & Orders
    const deletedOrderItems = await tx.orderItem.deleteMany({});
    const deletedOrders = await tx.order.deleteMany({});

    // 3. Delete Sale Items & Sales (POS)
    const deletedSaleItems = await tx.saleItem.deleteMany({});
    const deletedSales = await tx.sale.deleteMany({});

    // 4. Delete Payments
    const deletedPayments = await tx.payment.deleteMany({});

    // 5. Delete Inventory Movements (order/sale logs)
    const deletedMovements = await tx.inventoryMovement.deleteMany({});

    // 6. Delete Checkout Reservations
    const deletedReservations = await tx.inventoryReservation.deleteMany({});

    // 7. Delete Cart Items
    const deletedCartItems = await tx.cartItem.deleteMany({});

    // 8. Delete Stock Notifications (test requests)
    const deletedNotifications = await tx.stockNotification.deleteMany({});

    // 9. Reset POS Invoice Sequence Counter
    const resetInvoices = await tx.invoiceCounter.deleteMany({});

    // 10. Reset Variant reserved_stock to 0
    const updatedVariants = await tx.productVariant.updateMany({
      data: {
        reserved_stock: 0,
      },
    });

    // 11. Optionally delete test customers (keeps admins and staff safe)
    let deletedCustomers = { count: 0 };
    if (options.resetCustomers) {
      // First delete addresses of customers
      await tx.address.deleteMany({
        where: { user: { role: 'customer' } }
      });
      // Delete wishlists
      await tx.wishlist.deleteMany({
        where: { user: { role: 'customer' } }
      });
      deletedCustomers = await tx.user.deleteMany({
        where: { role: 'customer' },
      });
    }

    // 12. Delete Admin Audit Logs for Order/Sale actions
    const deletedAuditLogs = await tx.adminAuditLog.deleteMany({
      where: {
        OR: [
          { entity: 'Order' },
          { entity: 'Sale' },
          { entity: 'Payment' },
          { entity: 'ReturnRequest' },
        ],
      },
    });

    return {
      deletedOrders: deletedOrders.count,
      deletedOrderItems: deletedOrderItems.count,
      deletedSales: deletedSales.count,
      deletedSaleItems: deletedSaleItems.count,
      deletedPayments: deletedPayments.count,
      deletedReturns: deletedReturns.count,
      deletedMovements: deletedMovements.count,
      deletedReservations: deletedReservations.count,
      deletedCartItems: deletedCartItems.count,
      deletedNotifications: deletedNotifications.count,
      resetInvoices: resetInvoices.count,
      updatedVariants: updatedVariants.count,
      deletedCustomers: deletedCustomers.count,
      deletedAuditLogs: deletedAuditLogs.count,
    };
  });

  console.log('✅ [Reset] Successfully reset all test orders and revenue metrics!');
  console.log('Summary of cleared records:', results);
  return results;
}

// Allow direct CLI execution: node src/scripts/resetOrders.js
if (process.argv[1] && (process.argv[1].endsWith('resetOrders.js') || process.argv[1].endsWith('resetOrders.mjs'))) {
  resetAllOrdersAndSales({ resetCustomers: false })
    .then(() => {
      console.log('🎉 Reset complete! All orders and revenue are now 0.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Reset failed:', err);
      process.exit(1);
    });
}
