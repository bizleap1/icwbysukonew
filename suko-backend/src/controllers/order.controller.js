const crypto = require('crypto');
const prisma = require('../prisma/client');
const { 
  ORDER_STATUS, 
  RESERVATION_STATUS, 
  isValidOrderTransition,
  isValidAdminTransition
} = require('../utils/orderStateMachine');
const { releaseOrderReservation } = require('../utils/inventory.service');
const { sendOrderCancellationEmail } = require('../utils/email.service');
const { rejectForbiddenFields } = require('../utils/validator');

/**
 * Creates an order with strict server-side pricing, size stock validation, 
 * atomic PostgreSQL row-level reservation, and an immutable delivery address snapshot.
 * Implements user-scoped, status-aware idempotency with request fingerprinting.
 */
async function createOrder(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const userId = req.user.userId;
    const { 
      checkout_id,
      cart_item_ids,
      items: bodyItems, 
      coupon_code, 
      address_id,
      name: bodyName, 
      phone: bodyPhone,
      line1: bodyLine1,
      city: bodyCity,
      state: bodyState,
      pincode: bodyPincode
    } = req.body || {};

    const cleanCheckoutId = checkout_id ? String(checkout_id).trim() : null;

    // 1. Resolve Delivery Address Snapshot
    let shippingName = (bodyName || '').trim() || null;
    let shippingPhone = (bodyPhone || '').trim() || null;
    let shippingLine1 = (bodyLine1 || '').trim() || null;
    let shippingCity = (bodyCity || '').trim() || null;
    let shippingState = (bodyState || '').trim() || null;
    let shippingPincode = (bodyPincode || '').trim() || null;

    if (address_id) {
      const savedAddress = await prisma.address.findFirst({
        where: { id: parseInt(address_id, 10), user_id: userId }
      });
      if (savedAddress) {
        shippingPhone = savedAddress.phone || shippingPhone;
        shippingLine1 = savedAddress.line1;
        shippingCity = savedAddress.city;
        shippingState = savedAddress.state;
        shippingPincode = savedAddress.pincode;
      }
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!shippingName && currentUser) shippingName = currentUser.name || null;
    if (!shippingPhone && currentUser) shippingPhone = currentUser.phone || null;

    // 2. Resolve Items (from exact owned CartItem IDs or database cart)
    let checkoutItems = [];
    let sourceCartItemIds = [];

    if (Array.isArray(cart_item_ids) && cart_item_ids.length > 0) {
      const parsedIds = cart_item_ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id) && id > 0);
      const ownedCartItems = await prisma.cartItem.findMany({
        where: { id: { in: parsedIds }, user_id: userId },
        include: { product: true }
      });

      if (ownedCartItems.length === 0) {
        return res.status(400).json({ error: 'Selected cart items were not found.' });
      }

      checkoutItems = ownedCartItems.map(item => ({
        product_id: item.product_id,
        quantity: Math.max(1, item.quantity),
        size: item.size ? String(item.size).trim() : null
      }));
      sourceCartItemIds = ownedCartItems.map(item => item.id);
    } else if (Array.isArray(bodyItems) && bodyItems.length > 0) {
      checkoutItems = bodyItems.map(item => ({
        product_id: parseInt(item.product_id || item.id, 10),
        quantity: Math.max(1, parseInt(item.quantity || item.qty, 10) || 1),
        size: item.size ? String(item.size).trim() : null
      }));

      // Match corresponding cart item IDs if they existed in user's cart
      const dbCartItems = await prisma.cartItem.findMany({
        where: { user_id: userId },
        include: { product: true }
      });

      for (const bItem of checkoutItems) {
        const matchingCartItem = dbCartItems.find(c => 
          c.product_id === bItem.product_id && (c.size || null) === (bItem.size || null)
        );
        if (matchingCartItem && !sourceCartItemIds.includes(matchingCartItem.id)) {
          sourceCartItemIds.push(matchingCartItem.id);
        }
      }
    } else {
      const dbCartItems = await prisma.cartItem.findMany({
        where: { user_id: userId },
        include: { product: true }
      });

      if (dbCartItems.length > 0) {
        checkoutItems = dbCartItems.map(item => ({
          product_id: item.product_id,
          quantity: Math.max(1, item.quantity),
          size: item.size ? String(item.size).trim() : null
        }));
        sourceCartItemIds = dbCartItems.map(item => item.id);
      }
    }

    if (checkoutItems.length === 0) {
      return res.status(400).json({ error: 'Checkout failed. Your cart or item list is empty.' });
    }

    // 3. Compute Canonical Checkout Fingerprint
    const canonicalPayload = {
      items: checkoutItems.map(i => `${i.product_id}:${i.size || 'std'}:${i.quantity}`).sort().join('|'),
      coupon: coupon_code ? String(coupon_code).trim().toUpperCase() : '',
      address: `${shippingLine1 || ''}_${shippingCity || ''}_${shippingPincode || ''}`
    };
    const currentFingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify(canonicalPayload))
      .digest('hex');

    // 4. Status-Aware Durable Idempotent Order Lookup
    if (cleanCheckoutId) {
      const existingOrder = await prisma.order.findUnique({
        where: {
          user_id_checkout_id: {
            user_id: userId,
            checkout_id: cleanCheckoutId
          }
        },
        include: {
          items: { include: { product: true } },
          payments: { orderBy: { created_at: 'desc' } }
        }
      });

      if (existingOrder) {
        // Fingerprint check: prevent reusing same checkout_id with conflicting payload
        if (existingOrder.checkout_fingerprint && existingOrder.checkout_fingerprint !== currentFingerprint) {
          return res.status(409).json({ 
            error: 'Checkout ID cannot be reused with a different cart, coupon, or delivery address.' 
          });
        }

        // Paid: return existing paid order
        if (existingOrder.status === ORDER_STATUS.PAID) {
          return res.json({ ...existingOrder, alreadyPaid: true, idempotent_reuse: true });
        }

        // Active payment_pending: reuse existing order and reservation
        if (
          existingOrder.status === ORDER_STATUS.PAYMENT_PENDING && 
          existingOrder.reservation_status === RESERVATION_STATUS.RESERVED && 
          existingOrder.expires_at && 
          existingOrder.expires_at > new Date()
        ) {
          return res.json({ ...existingOrder, idempotent_reuse: true });
        }

        // Terminal / expired / cancelled order
        return res.status(400).json({ 
          error: 'This checkout session has expired or was cancelled. Please start a fresh checkout.' 
        });
      }
    }

    // 5. Begin Atomic Transaction with Row Locking
    const productIds = [...new Set(checkoutItems.map(i => i.product_id))].sort((a, b) => a - b);

    const orderResult = await prisma.$transaction(async (tx) => {
      // Explicit PostgreSQL row-level lock in deterministic ascending order to prevent deadlocks and race conditions
      const products = await tx.$queryRaw`
        SELECT id, name, price, stock, sizes, size_stock 
        FROM "Product" 
        WHERE id = ANY(${productIds}::int[]) 
        ORDER BY id ASC 
        FOR UPDATE
      `;

      const productMap = new Map();
      for (const p of products) {
        if (!p) {
          throw new Error('One or more selected items no longer exist in our catalog.');
        }
        productMap.set(p.id, p);
      }

      if (productMap.size !== productIds.length) {
        throw new Error('One or more selected items could not be found or locked.');
      }

      // Validate Stock, Sizes, and Calculate Server-Side Subtotal
      let serverSubtotal = 0;

      for (const item of checkoutItems) {
        const product = productMap.get(item.product_id);
        const qty = item.quantity;

        // Size-specific inventory checks
        let parsedSizeStock = {};
        if (product.size_stock) {
          try {
            parsedSizeStock = typeof product.size_stock === 'string'
              ? JSON.parse(product.size_stock)
              : { ...product.size_stock };
          } catch (e) {
            parsedSizeStock = {};
          }
        }

        const hasConfiguredSizes = (Array.isArray(product.sizes) && product.sizes.length > 0) || Object.keys(parsedSizeStock).length > 0;

        if (hasConfiguredSizes) {
          if (!item.size) {
            throw new Error(`A valid size selection is required for ${product.name}.`);
          }

          const availableForSize = parseInt(parsedSizeStock[item.size] || 0, 10);
          if (availableForSize < qty) {
            throw new Error(`Insufficient stock for ${product.name} (Size: ${item.size}). Available: ${availableForSize}, requested: ${qty}.`);
          }
        } else {
          if (product.stock < qty) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${qty}.`);
          }
        }

        const unitPrice = parseFloat(product.price);
        serverSubtotal += unitPrice * qty;
      }

      // 6. Validate Coupon strictly against DB
      let discountAmount = 0;
      let appliedCouponCode = null;

      if (coupon_code && String(coupon_code).trim()) {
        const cleanCode = String(coupon_code).trim().toUpperCase();
        const coupon = await tx.coupon.findUnique({ where: { code: cleanCode } });

        if (coupon && coupon.is_active) {
          const minVal = parseFloat(coupon.min_order_value || 0);
          if (serverSubtotal >= minVal) {
            if (coupon.discount_percent) {
              discountAmount = (serverSubtotal * coupon.discount_percent) / 100;
            } else if (coupon.discount_flat) {
              discountAmount = parseFloat(coupon.discount_flat);
            }
            discountAmount = Math.min(discountAmount, serverSubtotal);
            appliedCouponCode = coupon.code;
          }
        }
      }

      const finalServerTotal = Math.max(0, serverSubtotal - discountAmount);

      // 7. Create Order with 15-Minute Reservation Expiry and exact cart_item_ids
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const newOrder = await tx.order.create({
        data: {
          user_id: userId,
          checkout_id: cleanCheckoutId,
          checkout_fingerprint: currentFingerprint,
          subtotal: serverSubtotal.toFixed(2),
          discount: discountAmount.toFixed(2),
          coupon_code: appliedCouponCode,
          total: finalServerTotal.toFixed(2),
          status: ORDER_STATUS.PAYMENT_PENDING,
          reservation_status: RESERVATION_STATUS.RESERVED,
          expires_at: expiresAt,
          cart_item_ids: sourceCartItemIds,
          shipping_name: shippingName,
          shipping_phone: shippingPhone,
          shipping_line1: shippingLine1,
          shipping_city: shippingCity,
          shipping_state: shippingState,
          shipping_pincode: shippingPincode,
          items: {
            create: checkoutItems.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              size: item.size || null,
              price_at_purchase: productMap.get(item.product_id).price
            }))
          }
        },
        include: {
          items: { include: { product: true } }
        }
      });

      // 8. Atomically Decrement Exact Size Stock & Overall Stock
      for (const pId of productIds) {
        const product = productMap.get(pId);
        const itemsForProd = checkoutItems.filter(i => i.product_id === pId);
        
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

        let totalDeductQty = 0;
        for (const it of itemsForProd) {
          totalDeductQty += it.quantity;
          if (it.size && (product.sizes?.length > 0 || Object.keys(updatedSizeStock).length > 0)) {
            const currentSizeVal = parseInt(updatedSizeStock[it.size] || 0, 10);
            if (currentSizeVal < it.quantity) {
              throw new Error(`Insufficient stock for ${product.name} (Size: ${it.size}). Available: ${currentSizeVal}, requested: ${it.quantity}.`);
            }
            updatedSizeStock[it.size] = currentSizeVal - it.quantity;
          }
        }

        const hasSizeStock = Object.keys(updatedSizeStock).length > 0;
        const newOverallStock = hasSizeStock
          ? Object.values(updatedSizeStock).reduce((acc, val) => acc + (parseInt(val, 10) || 0), 0)
          : (product.stock - totalDeductQty);

        if (newOverallStock < 0) {
          throw new Error(`Insufficient stock for ${product.name}. Stock cannot be negative.`);
        }

        await tx.product.update({
          where: { id: pId },
          data: {
            stock: newOverallStock,
            ...(hasSizeStock && { size_stock: updatedSizeStock })
          }
        });
      }

      return newOrder;
    });

    res.status(201).json(orderResult);
  } catch (err) {
    // Graceful resolution for concurrent race condition on (user_id, checkout_id)
    if (err.code === 'P2002' && req.body?.checkout_id) {
      try {
        const racedOrder = await prisma.order.findUnique({
          where: {
            user_id_checkout_id: {
              user_id: req.user.userId,
              checkout_id: String(req.body.checkout_id).trim()
            }
          },
          include: {
            items: { include: { product: true } },
            payments: { orderBy: { created_at: 'desc' } }
          }
        });
        if (racedOrder) {
          return res.json({ ...racedOrder, idempotent_reuse: true });
        }
      } catch (raceErr) {
        console.error("Order race resolution error:", raceErr.message);
      }
    }

    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Create order error:", err.message);
    res.status(400).json({ error: err.message || 'Unable to initialize order checkout.' });
  }
}

async function getMyOrders(req, res) {
  try {
    const orders = await prisma.order.findMany({
      where: { user_id: req.user.userId },
      include: { 
        items: { include: { product: true } },
        payments: { orderBy: { created_at: 'desc' } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    console.error("getMyOrders error:", err);
    res.status(500).json({ error: 'Failed to fetch your orders.' });
  }
}

async function getOrderById(req, res) {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order ID.' });

    let order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        items: { include: { product: true } },
        payments: { orderBy: { created_at: 'desc' } }
      }
    });

    if (!order || (req.user.role !== 'admin' && order.user_id !== req.user.userId)) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Opportunistic expiry release check
    if (
      order.status === ORDER_STATUS.PAYMENT_PENDING && 
      order.reservation_status === RESERVATION_STATUS.RESERVED && 
      order.expires_at && 
      order.expires_at < new Date()
    ) {
      await releaseOrderReservation(order.id, ORDER_STATUS.EXPIRED);
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { 
          items: { include: { product: true } },
          payments: { orderBy: { created_at: 'desc' } }
        }
      });
    }

    res.json(order);
  } catch (err) {
    console.error("getOrderById error:", err);
    res.status(500).json({ error: 'Failed to fetch order details.' });
  }
}

async function requestOrderCancellation(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const orderId = parseInt(req.params.id, 10);
    const { reason } = req.body;

    if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order ID.' });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const { valid, error, requiresManualReview } = isValidOrderTransition(
      order.status, 
      ORDER_STATUS.CANCEL_REQUESTED
    );

    if (!valid) {
      return res.status(400).json({ error: error || 'Cancellation is not permitted for this order.' });
    }

    const statusBefore = order.status;

    // Atomic conditional claim to prevent double-cancellation race condition
    const claim = await prisma.order.updateMany({
      where: {
        id: orderId,
        user_id: req.user.userId,
        status: { in: [ORDER_STATUS.PAID, ORDER_STATUS.PROCESSING] }
      },
      data: {
        status: ORDER_STATUS.CANCEL_REQUESTED,
        cancel_reason: reason || 'Customer requested cancellation via portal',
        status_before_cancel_request: statusBefore
      }
    });

    if (claim.count === 0) {
      return res.status(400).json({
        error: 'Order is no longer in a cancellable state or cancellation was already requested.'
      });
    }

    const updated = await prisma.order.findUnique({ where: { id: orderId } });
    res.json({ message: 'Cancellation request submitted for admin review.', order: updated });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("requestOrderCancellation error:", err);
    res.status(500).json({ error: 'Failed to submit cancellation request.' });
  }
}

async function getAllOrdersAdmin(req, res) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: true } },
        payments: { orderBy: { created_at: 'desc' } }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    console.error("getAllOrdersAdmin error:", err);
    res.status(500).json({ error: 'Failed to fetch admin orders.' });
  }
}

async function updateOrderStatusAdmin(req, res) {
  try {
    rejectForbiddenFields(req.body);
    const orderId = parseInt(req.params.id, 10);
    const { status, action } = req.body;

    if (isNaN(orderId) || !status) {
      return res.status(400).json({ error: 'order ID and target status are required.' });
    }

    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } }
      }
    });

    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Handle cancellation rejection
    if (currentOrder.status === ORDER_STATUS.CANCEL_REQUESTED && action === 'reject_cancellation') {
      const restoreStatus = currentOrder.status_before_cancel_request || ORDER_STATUS.PROCESSING;

      const restoredOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: restoreStatus,
          cancel_reason: null,
          status_before_cancel_request: null
        }
      });

      return res.json({
        message: `Cancellation rejected. Order restored to ${restoreStatus}.`,
        order: restoredOrder
      });
    }

    const { valid, error } = isValidAdminTransition(currentOrder.status, status);
    if (!valid) {
      return res.status(400).json({ error });
    }

    if (status === ORDER_STATUS.CANCELLED) {
      await releaseOrderReservation(orderId, ORDER_STATUS.CANCELLED).catch(err => {
        console.warn(`Could not release stock on order #${orderId} cancellation:`, err.message);
      });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });

    res.json({ message: `Order status updated to ${status}`, order: updated });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("updateOrderStatusAdmin error:", err);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
}

/**
 * Permanently deletes an order and its associated records (Admin only).
 * Restricted to unpaid, cancelled, or expired draft orders.
 * Historical paid/fulfilled orders are strictly protected from permanent deletion.
 */
async function deleteOrderAdmin(req, res) {
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID.' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Historical Orders Protection: Never permanently delete paid or fulfilled financial records
    const PROTECTED_STATUSES = [
      ORDER_STATUS.PAID,
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.SHIPPED,
      ORDER_STATUS.DELIVERED
    ];

    if (PROTECTED_STATUSES.includes(order.status)) {
      return res.status(400).json({ 
        error: `Order #SUKO-${1000 + orderId} is in "${order.status}" status with confirmed financial/payment records. Historical paid orders cannot be permanently deleted.` 
      });
    }

    // Release stock reservation if order was pending payment
    if (order.status === ORDER_STATUS.PAYMENT_PENDING && order.reservation_status === RESERVATION_STATUS.RESERVED) {
      await releaseOrderReservation(order.id, ORDER_STATUS.EXPIRED).catch(err => {
        console.warn(`Could not release stock before deleting order #${order.id}:`, err.message);
      });
    }

    // Delete related payment, order items, and order record in transaction
    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { order_id: orderId } });
      await tx.orderItem.deleteMany({ where: { order_id: orderId } });
      await tx.order.delete({ where: { id: orderId } });
    });

    res.json({ message: `Order #SUKO-${1000 + orderId} deleted successfully.` });
  } catch (err) {
    console.error("deleteOrderAdmin error:", err.message);
    res.status(500).json({ error: 'Failed to delete order.' });
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  requestOrderCancellation,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  deleteOrderAdmin
};
