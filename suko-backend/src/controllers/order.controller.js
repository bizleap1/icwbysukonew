import prisma from '../prisma/client.js';
import {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendCancellationRequestEmail,
  sendCancellationStatusEmail
} from '../utils/email.service.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { deductInventoryAtomic, restoreInventoryAtomic } from '../services/inventory.service.js';
import crypto from 'crypto';

/**
 * Create order with server-side price calculation and atomic inventory deduction.
 * - NEVER trusts client-supplied prices or totals
 * - Uses unique temp ref per order to prevent ORD-TEMP collision
 * - Server-side prices come from ProductVariant.price
 */
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      payment_id,
      paymentId,
      razorpay_order_id,
      razorpayOrderId,
      shippingDetails,
      paymentMethod,
      payment_method
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required to place an order' });
    }

    const actualPaymentId = payment_id || paymentId || (paymentMethod === 'razorpay' ? `pay_${crypto.randomBytes(8).toString('hex')}` : null);
    const actualRazorpayOrderId = razorpay_order_id || razorpayOrderId || null;
    const method = (paymentMethod || payment_method || (actualPaymentId ? 'razorpay' : 'cod')).toLowerCase();

    // Generate unique temp reference to avoid collision with concurrent orders
    const tempRef = `ORD-TEMP-${crypto.randomBytes(8).toString('hex')}`;

    // Execute atomic transaction for order creation, inventory deduction, and payment record
    const order = await prisma.$transaction(async (tx) => {
      // 1. Calculate and deduct inventory atomically through the unified service
      const deductedItems = await deductInventoryAtomic({
        tx,
        items,
        reference_type: 'ONLINE_ORDER',
        reference_id: tempRef,
        created_by: req.user?.email || 'Online Customer',
      });

      // Server calculates total — NEVER trust client total
      const calculatedTotal = deductedItems.reduce((acc, it) => acc + it.total_price, 0);

      // 2. Shipping Address Snapshot
      const shipName = shippingDetails?.fullName || req.user?.name || 'Valued Client';
      const shipPhone = shippingDetails?.phone || req.user?.phone || '';
      const shipAddr = shippingDetails?.addressLine1 || shippingDetails?.line1 || '';
      const shipCity = shippingDetails?.city || '';
      const shipState = shippingDetails?.state || '';
      const shipPincode = shippingDetails?.pincode || '';

      // 3. Create Order with snapshot details
      const createdOrder = await tx.order.create({
        data: {
          user_id: req.user.id,
          total: calculatedTotal,
          status: 'processing',
          payment_id: actualPaymentId || (method === 'cod' ? 'COD' : null),
          razorpay_order_id: actualRazorpayOrderId || null,
          shipping_name: shipName,
          shipping_phone: shipPhone,
          shipping_address: shipAddr,
          shipping_city: shipCity,
          shipping_state: shipState,
          shipping_pincode: shipPincode,
          items: {
            create: deductedItems.map(it => ({
              product_id: it.product_id,
              variant_id: it.variant_id,
              sku_snapshot: it.sku,
              quantity: it.quantity,
              size: it.size,
              price_at_purchase: it.price,
            })),
          },
        },
        include: {
          items: { include: { product: true, variant: true } },
          payments: true,
          user: { select: { name: true, email: true, phone: true } },
        },
      });

      // 4. Update InventoryMovement reference with real order ID
      await tx.inventoryMovement.updateMany({
        where: { reference_id: tempRef, type: 'ONLINE_ORDER' },
        data: { reference_id: `ORD-${createdOrder.id}` },
      });

      // 5. Create Payment record
      if (actualPaymentId && method === 'razorpay') {
        const existingPayment = await tx.payment.findFirst({
          where: { gateway_payment_id: actualPaymentId },
        });

        if (!existingPayment) {
          await tx.payment.create({
            data: {
              order_id: createdOrder.id,
              gateway: 'RAZORPAY',
              gateway_payment_id: actualPaymentId,
              gateway_order_id: actualRazorpayOrderId || null,
              amount: calculatedTotal,
              currency: 'INR',
              status: 'PAID',
              payment_reference: actualPaymentId,
            },
          });
        }
      } else if (method === 'cod') {
        await tx.payment.create({
          data: {
            order_id: createdOrder.id,
            gateway: 'COD',
            gateway_payment_id: `COD-${createdOrder.id}`,
            gateway_order_id: null,
            amount: calculatedTotal,
            currency: 'INR',
            status: 'PENDING_COD',
            payment_reference: 'CASH_ON_DELIVERY',
          },
        });
      }

      // 6. Clear user cart
      await tx.cartItem.deleteMany({ where: { user_id: req.user.id } });

      return createdOrder;
    }, {
      maxWait: 10000,
      timeout: 30000
    });

    // Send Order Confirmation Email to the user-provided checkout email or user account email
    const recipientEmail = shippingDetails?.email?.trim() || req.user?.email?.trim() || req.body?.email?.trim();
    if (recipientEmail) {
      sendOrderConfirmationEmail(recipientEmail, order)
        .then(() => console.log(`[Order Confirmation Email Sent] to ${recipientEmail}`))
        .catch(err => console.error(`[Order Email Failed]`, err));
    }

    const formattedOrder = enrichOrderData(order);

    res.status(201).json({ success: true, message: 'Order created successfully', order: formattedOrder });
  } catch (error) {
    console.error('Order creation error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, code: error.code || 'ORDER_ERROR', message: error.message || 'Error creating order' });
  }
};

function enrichOrderData(order) {
  if (!order) return order;

  const payments = Array.isArray(order.payments) ? order.payments : [];
  const hasPaidPayment = payments.some(p => p.status === 'PAID' || p.gateway === 'RAZORPAY');
  const isOnlinePaymentId = Boolean(order.payment_id && order.payment_id !== 'COD' && order.payment_id !== 'CASH_ON_DELIVERY') || Boolean(order.razorpay_order_id);
  const isPaid = hasPaidPayment || isOnlinePaymentId;

  const paymentMethod = isOnlinePaymentId || hasPaidPayment ? 'Razorpay Online' : 'COD';
  const paymentStatus = isPaid ? 'PAID' : (order.status === 'cancelled' ? 'CANCELLED' : 'PENDING');
  const transactionId = order.payment_id || (payments[0]?.gateway_payment_id) || (paymentMethod === 'COD' ? `COD-${order.id}` : 'N/A');

  return {
    ...order,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    transaction_id: transactionId,
  };
}

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    const whereConditions = [];
    if (userId) whereConditions.push({ user_id: userId });
    if (userEmail) whereConditions.push({ user: { email: userEmail } });

    const orders = await prisma.order.findMany({
      where: whereConditions.length > 0 ? { OR: whereConditions } : { user_id: -1 },
      orderBy: { created_at: 'desc' },
      include: {
        items: { include: { product: true, variant: true } },
        payments: true,
      },
    });
    res.json(orders.map(enrichOrderData));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const orders = await prisma.order.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: true, variant: true } },
        payments: true,
      },
    });
    res.json(orders.map(enrichOrderData));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existingOrder = await prisma.order.findUnique({
      where: { id: parseInt(id, 10) },
      include: { items: true, user: true },
    });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: existingOrder.id },
        data: { status },
        include: { user: true },
      });

      // If order was cancelled, restore inventory atomically and log movement
      // Prevent double-restore: only restore if not already cancelled
      if (status === 'cancelled' && existingOrder.status !== 'cancelled') {
        await restoreInventoryAtomic({
          tx,
          items: existingOrder.items,
          type: 'CANCELLATION',
          reference_id: `ORD-${existingOrder.id}`,
          created_by: req.user?.email || 'Admin',
          note: `Order #${existingOrder.id} cancelled by admin`,
        });
      }

      return updated;
    });

    if (existingOrder.user?.email) {
      if (status === 'cancelled' || status === 'refunded') {
        sendCancellationStatusEmail(existingOrder.user.email, existingOrder.id, true, `Order status updated to ${status}`);
      } else {
        sendOrderStatusUpdateEmail(existingOrder.user.email, existingOrder.id, status);
      }
    }

    res.json({ success: true, message: 'Order status updated and inventory synced', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating order status', error: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancel_reason } = req.body;

    const order = await prisma.order.findFirst({
      where: { id: parseInt(id, 10), user_id: req.user.id },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({ success: false, message: 'Cannot cancel an order that is already shipped or delivered' });
    }

    if (order.status === 'cancelled' || order.status === 'cancellation_requested') {
      return res.status(400).json({ success: false, message: 'This order has already been cancelled or cancellation is pending' });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'cancellation_requested', cancel_reason },
    });

    sendCancellationRequestEmail(req.user.email, order.id, cancel_reason || 'Customer requested cancellation');

    res.json({ success: true, message: 'Cancellation request submitted to Admin', order: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error submitting cancellation request', error: error.message });
  }
};

/**
 * Invoice download — requires authentication.
 * Order owner or admin/store_manager can access.
 */
export const getInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;

    const parsedId = parseInt(id, 10);
    if (!isNaN(parsedId)) {
      order = await prisma.order.findUnique({
        where: { id: parsedId },
        include: {
          user: true,
          items: { include: { product: true, variant: true } },
        },
      });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Invoice not found for the requested order ID.' });
    }

    // Authorization check: must be order owner (by ID or email) or admin/store_manager
    const userRole = req.user?.role?.toLowerCase();
    const isOwner = (req.user?.id && req.user?.id === order.user_id) ||
                    (req.user?.email && req.user?.email === order.user?.email);
    const isStaff = ['admin', 'super_admin', 'store_manager'].includes(userRole);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this invoice.',
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.id}.pdf`);

    generateInvoicePDF(order, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating invoice', error: error.message });
  }
};

/**
 * Super Admin / Admin endpoint to wipe all test orders, sales, payments and reset metrics to 0
 */
export const resetAllOrdersController = async (req, res) => {
  try {
    const { resetCustomers = false } = req.body || {};
    const { resetAllOrdersAndSales } = await import('../scripts/resetOrders.js');
    const result = await resetAllOrdersAndSales({ resetCustomers });

    res.json({
      success: true,
      message: 'All test orders, sales, payments, and revenue metrics successfully reset to 0.',
      data: result,
    });
  } catch (error) {
    console.error('Reset orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset test orders and revenue metrics',
      error: error.message,
    });
  }
};

