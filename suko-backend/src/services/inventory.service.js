/**
 * =========================================================================
 * SUKO ATELIER — CENTRALIZED REAL-TIME INVENTORY & RESERVATION SERVICE
 * Single Source of Truth for Online E-Commerce & Physical Store POS Stock
 * 
 * CORE ARCHITECTURE:
 * 1. ProductVariant.stock = Authoritative physical stock on hand
 * 2. ProductVariant.reserved_stock = Active checkout reservations (TTL-backed)
 * 3. Available stock to sell = (stock - reserved_stock)
 * 4. Reservation Lifecycle:
 *    AVAILABLE -> RESERVED (held during Razorpay checkout) -> CONFIRMED (paid order)
 *                                                          \-> RELEASED / EXPIRED (payment failed/expired)
 * 5. Concurrency-safe: atomic conditional updates prevent race conditions & overselling
 * 6. Every mutation logs an immutable InventoryMovement audit record
 * =========================================================================
 */

import prisma from '../prisma/client.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import { logAdminAction } from './audit.service.js';

// ─── MOVEMENT TYPES ──────────────────────────────────────────────────────────
export const MovementType = {
  PURCHASE: 'PURCHASE',
  ONLINE_ORDER: 'ONLINE_ORDER',
  POS_SALE: 'POS_SALE',
  RESERVATION_HOLD: 'RESERVATION_HOLD',
  RESERVATION_RELEASED: 'RESERVATION_RELEASED',
  RESERVATION_EXPIRED: 'RESERVATION_EXPIRED',
  RETURN: 'RETURN',
  EXCHANGE_IN: 'EXCHANGE_IN',
  EXCHANGE_OUT: 'EXCHANGE_OUT',
  CANCELLATION: 'CANCELLATION',
  DAMAGE: 'DAMAGE',
  RESTOCK: 'RESTOCK',
  LOST: 'LOST',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
  STOCK_CORRECTION: 'STOCK_CORRECTION',
};

// ─── INVOICE NUMBER GENERATOR ────────────────────────────────────────────────

/**
 * Concurrency-safe sequential invoice number generator using atomic counter
 */
export const generateSafeInvoiceNumber = async (tx) => {
  const currentYear = new Date().getFullYear();
  const prefix = `POS-${currentYear}`;

  const counter = await tx.invoiceCounter.upsert({
    where: { prefix },
    update: { current_count: { increment: 1 } },
    create: { prefix, current_count: 1 },
  });

  return `${prefix}-${String(counter.current_count).padStart(4, '0')}`;
};

/**
 * Calculates real-time available stock for a variant (physical stock - active reservations)
 */
export const getAvailableStock = async (variant_id) => {
  const variant = await prisma.productVariant.findUnique({
    where: { id: parseInt(variant_id, 10) },
    select: { stock: true, reserved_stock: true },
  });
  if (!variant) return 0;
  return Math.max(0, variant.stock - variant.reserved_stock);
};

// ─── SYNC PRODUCT-LEVEL STOCK FROM VARIANTS ──────────────────────────────────

/**
 * Recomputes Product.stock and Product.size_stock from variant sums for backward compatibility
 */
export async function syncProductStockFromVariants(tx, productId) {
  const variants = await tx.productVariant.findMany({
    where: { product_id: productId },
    select: { size: true, stock: true },
  });

  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
  const sizeStock = {};
  for (const v of variants) {
    sizeStock[v.size] = (sizeStock[v.size] || 0) + v.stock;
  }

  await tx.product.update({
    where: { id: productId },
    data: {
      stock: totalStock,
      size_stock: sizeStock,
    },
  });
}

// ─── AUTOMATIC RESERVATION EXPIRY CLEANUP ────────────────────────────────────

/**
 * Releases all expired active checkout reservations and returns reserved_stock back to available pool
 */
export const cleanupExpiredReservations = async (tx) => {
  const now = new Date();
  const expiredReservations = await tx.inventoryReservation.findMany({
    where: {
      status: 'ACTIVE',
      expires_at: { lte: now },
    },
  });

  for (const reservation of expiredReservations) {
    const rawItems = Array.isArray(reservation.items) ? reservation.items : [];
    for (const it of rawItems) {
      if (it.variant_id && it.quantity > 0) {
        await tx.$executeRaw`
          UPDATE "ProductVariant"
          SET reserved_stock = GREATEST(0, reserved_stock - ${it.quantity}), updated_at = NOW()
          WHERE id = ${it.variant_id}
        `;
      }
    }

    await tx.inventoryReservation.update({
      where: { id: reservation.id },
      data: { status: 'EXPIRED' },
    });

    console.log(`[Reservation] Expired reservation ${reservation.razorpay_order_id} released automatically.`);
  }

  return expiredReservations.length;
};

// ─── INVENTORY RESERVATION LIFECYCLE ─────────────────────────────────────────

/**
 * 1. RESERVE: Atomically reserve stock during Razorpay checkout initiation.
 * Prevents POS or other shoppers from purchasing items currently in checkout.
 * 
 * @param {Object} params
 * @param {PrismaTransaction} params.tx
 * @param {Array} params.items - [{ product_id, variant_id?, size?, quantity }]
 * @param {number} params.user_id
 * @param {string} params.razorpay_order_id
 * @param {number} [params.ttlMinutes=15] - Time to live in minutes before auto-expiry
 */
export const reserveInventoryAtomic = async ({
  tx,
  items,
  user_id,
  razorpay_order_id,
  ttlMinutes = 15,
}) => {
  // 1. Clean up any expired reservations first
  await cleanupExpiredReservations(tx);

  const resolvedItems = [];
  let calculatedTotal = 0;

  for (const item of items) {
    const rawPid = item.product_id || item.productId || item.id;
    const targetProductId = typeof rawPid === 'number' ? rawPid : parseInt(String(rawPid).split('-').pop(), 10);

    if (isNaN(targetProductId)) {
      throw new AppError('Invalid product ID provided.', 404, 'PRODUCT_NOT_FOUND');
    }

    const product = await tx.product.findUnique({
      where: { id: targetProductId },
      include: { variants: true },
    });

    if (!product) {
      throw new AppError(`Product ID ${targetProductId} does not exist.`, 404, 'PRODUCT_NOT_FOUND');
    }

    const requestedQty = parseInt(item.quantity || 1, 10);
    if (requestedQty <= 0) {
      throw new AppError('Quantity must be at least 1.', 400, 'INVALID_QUANTITY');
    }

    const requestedSize = (item.size || '').trim();

    // Find variant — NO silent creation
    let variant = null;
    if (item.variant_id) {
      variant = product.variants.find(v => v.id === parseInt(item.variant_id, 10));
    } else if (requestedSize) {
      variant = product.variants.find(v => v.size.toLowerCase() === requestedSize.toLowerCase());
    }

    if (!variant) {
      throw new AppError(
        `Variant for "${product.name}" (Size: ${requestedSize || 'N/A'}) was not found.`,
        404,
        'VARIANT_NOT_FOUND'
      );
    }

    if (!variant.is_active) {
      throw new AppError(`Variant "${variant.sku}" is inactive.`, 400, 'VARIANT_INACTIVE');
    }

    // CONCURRENCY-SAFE ATOMIC RESERVATION
    // Condition: available stock (stock - reserved_stock) >= requestedQty
    const updateResult = await tx.$executeRaw`
      UPDATE "ProductVariant"
      SET reserved_stock = reserved_stock + ${requestedQty}, updated_at = NOW()
      WHERE id = ${variant.id} AND (stock - reserved_stock) >= ${requestedQty}
    `;

    if (updateResult === 0) {
      const current = await tx.productVariant.findUnique({ where: { id: variant.id } });
      const available = Math.max(0, (current?.stock || 0) - (current?.reserved_stock || 0));
      throw new AppError(
        `OUT_OF_STOCK: "${product.name}" (Size: ${variant.size}) is unavailable. Available: ${available}, Requested: ${requestedQty}`,
        409,
        'OUT_OF_STOCK'
      );
    }

    const unitPrice = Number(variant.price || product.price);
    const itemTotal = unitPrice * requestedQty;
    calculatedTotal += itemTotal;

    resolvedItems.push({
      product_id: product.id,
      variant_id: variant.id,
      product_name: product.name,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      quantity: requestedQty,
      price: unitPrice,
      total_price: itemTotal,
    });
  }

  // Calculate expiration time (TTL)
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  // Save Reservation record in database
  const reservation = await tx.inventoryReservation.create({
    data: {
      user_id: user_id ? parseInt(user_id, 10) : null,
      razorpay_order_id,
      items: resolvedItems,
      total_amount: calculatedTotal,
      status: 'ACTIVE',
      expires_at: expiresAt,
    },
  });

  return { reservation, resolvedItems, calculatedTotal, expiresAt };
};

/**
 * 2. CONFIRM: Atomically convert a reservation into a finalized order.
 * - ACTIVE: Deducts physical stock & clears reserved_stock
 * - CONFIRMED: Idempotent replay, returns existing order without stock changes
 * - EXPIRED / RELEASED (Late Payment): Attempts safe grace recovery if stock is still available;
 *   if POS already sold the item, flags Order as 'refund_required' without negative stock.
 */
export const confirmReservationAtomic = async ({
  tx,
  razorpay_order_id,
  payment_id,
  user_id,
  shippingDetails = {},
}) => {
  // 1. Fetch reservation
  const reservation = await tx.inventoryReservation.findUnique({
    where: { razorpay_order_id },
  });

  if (!reservation) {
    throw new AppError(`Reservation not found for Razorpay order: ${razorpay_order_id}`, 404, 'RESERVATION_NOT_FOUND');
  }

  // IDEMPOTENCY: If already confirmed or already processed as refund_required, return existing Order
  if (reservation.status === 'CONFIRMED' || reservation.status === 'CONFIRMED_LATE_GRACE' || reservation.status === 'OVERDUE_STOCKOUT_REFUND_PENDING') {
    const existingOrder = await tx.order.findFirst({
      where: { razorpay_order_id },
      include: { items: { include: { product: true, variant: true } }, payments: true, user: true },
    });
    if (existingOrder) {
      console.log(`[Reservation] Idempotent hit: Order #${existingOrder.id} (Status: ${existingOrder.status}) for ${razorpay_order_id}`);
      return existingOrder;
    }
  }

  const items = Array.isArray(reservation.items) ? reservation.items : [];
  const calculatedTotal = Number(reservation.total_amount);
  const targetUserId = user_id || reservation.user_id;
  const shipName = shippingDetails?.fullName || 'Valued Client';
  const shipPhone = shippingDetails?.phone || '';
  const shipAddr = shippingDetails?.addressLine1 || shippingDetails?.line1 || '';
  const shipCity = shippingDetails?.city || '';
  const shipState = shippingDetails?.state || '';
  const shipPincode = shippingDetails?.pincode || '';

  // ── CASE A: ACTIVE RESERVATION (Standard on-time checkout) ──
  if (reservation.status === 'ACTIVE') {
    for (const it of items) {
      const qty = parseInt(it.quantity, 10);
      const variantId = parseInt(it.variant_id, 10);

      const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
      const stockBefore = variant ? variant.stock : 0;
      const stockAfter = Math.max(0, stockBefore - qty);

      // Atomic conditional update: physical stock and reserved hold
      await tx.$executeRaw`
        UPDATE "ProductVariant"
        SET stock = stock - ${qty},
            reserved_stock = GREATEST(0, reserved_stock - ${qty}),
            updated_at = NOW()
        WHERE id = ${variantId} AND stock >= ${qty}
      `;

      await tx.inventoryMovement.create({
        data: {
          variant_id: variantId,
          product_id: it.product_id,
          type: MovementType.ONLINE_ORDER,
          quantity: -qty,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reference_type: 'ONLINE_ORDER',
          reference_id: `ORD-${razorpay_order_id}`,
          note: `Online Order Confirmed (Razorpay: ${payment_id || razorpay_order_id}) - Size: ${it.size}`,
          created_by: `Online Customer (ID: ${targetUserId || 'Guest'})`,
        },
      });

      await syncProductStockFromVariants(tx, it.product_id);
    }

    const createdOrder = await tx.order.create({
      data: {
        user_id: targetUserId,
        total: calculatedTotal,
        status: 'processing',
        payment_id: payment_id || null,
        razorpay_order_id,
        shipping_name: shipName,
        shipping_phone: shipPhone,
        shipping_address: shipAddr,
        shipping_city: shipCity,
        shipping_state: shipState,
        shipping_pincode: shipPincode,
        items: {
          create: items.map(it => ({
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
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    if (payment_id) {
      await tx.payment.create({
        data: {
          order_id: createdOrder.id,
          gateway: 'RAZORPAY',
          gateway_order_id: razorpay_order_id,
          gateway_payment_id: payment_id,
          amount: calculatedTotal,
          currency: 'INR',
          status: 'PAID',
          payment_reference: payment_id,
        },
      });
    }

    await tx.inventoryReservation.update({
      where: { id: reservation.id },
      data: { status: 'CONFIRMED' },
    });

    if (targetUserId) {
      await tx.cartItem.deleteMany({ where: { user_id: targetUserId } });
    }

    return createdOrder;
  }

  // ── CASE B: EXPIRED / RELEASED RESERVATION (Late Payment Grace Recovery) ──
  if (reservation.status === 'EXPIRED' || reservation.status === 'RELEASED') {
    console.warn(`[Reservation] Late payment received for expired/released reservation: ${razorpay_order_id}. Attempting grace recovery...`);

    // Check if ALL items can be fulfilled from current available stock
    let canFulfill = true;
    for (const it of items) {
      const v = await tx.productVariant.findUnique({ where: { id: parseInt(it.variant_id, 10) } });
      const available = (v?.stock || 0) - (v?.reserved_stock || 0);
      if (!v || available < parseInt(it.quantity, 10)) {
        canFulfill = false;
        break;
      }
    }

    if (canFulfill) {
      // Grace Recovery Succeeded: stock was still on shelf
      for (const it of items) {
        const qty = parseInt(it.quantity, 10);
        const variantId = parseInt(it.variant_id, 10);
        const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
        const stockBefore = variant ? variant.stock : 0;
        const stockAfter = Math.max(0, stockBefore - qty);

        await tx.$executeRaw`
          UPDATE "ProductVariant"
          SET stock = stock - ${qty}, updated_at = NOW()
          WHERE id = ${variantId} AND (stock - reserved_stock) >= ${qty}
        `;

        await tx.inventoryMovement.create({
          data: {
            variant_id: variantId,
            product_id: it.product_id,
            type: MovementType.ONLINE_ORDER,
            quantity: -qty,
            stock_before: stockBefore,
            stock_after: stockAfter,
            reference_type: 'ONLINE_ORDER',
            reference_id: `ORD-LATE-${razorpay_order_id}`,
            note: `Late Payment Grace Order (Razorpay: ${payment_id || razorpay_order_id}) - Size: ${it.size}`,
            created_by: `Online Customer (ID: ${targetUserId || 'Guest'})`,
          },
        });

        await syncProductStockFromVariants(tx, it.product_id);
      }

      const createdOrder = await tx.order.create({
        data: {
          user_id: targetUserId,
          total: calculatedTotal,
          status: 'processing',
          payment_id: payment_id || null,
          razorpay_order_id,
          shipping_name: shipName,
          shipping_phone: shipPhone,
          shipping_address: shipAddr,
          shipping_city: shipCity,
          shipping_state: shipState,
          shipping_pincode: shipPincode,
          items: {
            create: items.map(it => ({
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
          user: { select: { name: true, email: true, phone: true } },
        },
      });

      if (payment_id) {
        await tx.payment.create({
          data: {
            order_id: createdOrder.id,
            gateway: 'RAZORPAY',
            gateway_order_id: razorpay_order_id,
            gateway_payment_id: payment_id,
            amount: calculatedTotal,
            currency: 'INR',
            status: 'PAID',
            payment_reference: payment_id,
          },
        });
      }

      await tx.inventoryReservation.update({
        where: { id: reservation.id },
        data: { status: 'CONFIRMED_LATE_GRACE' },
      });

      return createdOrder;

    } else {
      // Stock is unavailable (e.g. POS sold it after reservation expired).
      // DO NOT touch stock! Flag Order and Payment as 'refund_required'.
      console.warn(`[Reservation] Stock unavailable for late payment ${razorpay_order_id}. Flagging for refund.`);

      const exceptionOrder = await tx.order.create({
        data: {
          user_id: targetUserId,
          total: calculatedTotal,
          status: 'refund_required',
          cancel_reason: 'Late payment received after reservation expired and physical stock was sold.',
          payment_id: payment_id || null,
          razorpay_order_id,
          shipping_name: shipName,
          shipping_phone: shipPhone,
          shipping_address: shipAddr,
          shipping_city: shipCity,
          shipping_state: shipState,
          shipping_pincode: shipPincode,
          items: {
            create: items.map(it => ({
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
          user: { select: { name: true, email: true, phone: true } },
        },
      });

      if (payment_id) {
        await tx.payment.create({
          data: {
            order_id: exceptionOrder.id,
            gateway: 'RAZORPAY',
            gateway_order_id: razorpay_order_id,
            gateway_payment_id: payment_id,
            amount: calculatedTotal,
            currency: 'INR',
            status: 'REFUND_REQUIRED',
            payment_reference: `LATE-PAYMENT-STOCKOUT-${payment_id}`,
          },
        });
      }

      await tx.inventoryReservation.update({
        where: { id: reservation.id },
        data: { status: 'OVERDUE_STOCKOUT_REFUND_PENDING' },
      });

      return exceptionOrder;
    }
  }

  throw new AppError(`Unexpected reservation status: ${reservation.status}`, 400, 'INVALID_RESERVATION_STATE');
};

/**
 * 3. RELEASE: Release an active checkout reservation when customer cancels or payment fails.
 */
export const releaseReservationAtomic = async ({
  tx,
  razorpay_order_id,
  reason = 'USER_CANCELLED',
}) => {
  const reservation = await tx.inventoryReservation.findUnique({
    where: { razorpay_order_id },
  });

  if (!reservation || reservation.status !== 'ACTIVE') {
    return { released: false, reason: 'NOT_ACTIVE' };
  }

  const items = Array.isArray(reservation.items) ? reservation.items : [];
  for (const it of items) {
    if (it.variant_id && it.quantity > 0) {
      await tx.$executeRaw`
        UPDATE "ProductVariant"
        SET reserved_stock = GREATEST(0, reserved_stock - ${it.quantity}), updated_at = NOW()
        WHERE id = ${it.variant_id}
      `;
    }
  }

  await tx.inventoryReservation.update({
    where: { id: reservation.id },
    data: { status: 'RELEASED' },
  });

  console.log(`[Reservation] Released reservation for ${razorpay_order_id} (Reason: ${reason})`);
  return { released: true, reservation };
};

// ─── DIRECT ATOMIC STOCK DEDUCTION (POS & Direct Sales) ───────────────────────

/**
 * Concurrency-safe atomic stock deduction for POS Sales and Direct Orders.
 * Checks available stock: (stock - reserved_stock) >= requestedQty
 */
export const deductInventoryAtomic = async ({
  tx,
  items,
  reference_type,
  reference_id,
  created_by = 'System',
}) => {
  // Clean expired reservations so recently freed stock is available
  await cleanupExpiredReservations(tx);

  const resolvedItems = [];

  for (const item of items) {
    let product = null;
    const rawPid = item.product_id || item.productId || item.id;
    const targetProductId = typeof rawPid === 'number' ? rawPid : parseInt(String(rawPid || '').split('-').pop(), 10);

    if (!isNaN(targetProductId)) {
      product = await tx.product.findUnique({
        where: { id: targetProductId },
        include: { variants: true },
      });
    }

    // Fallback 1: Match by product title/name if ID did not match DB primary key
    const searchTitle = (item.title || item.name || item.product_name || '').trim();
    if (!product && searchTitle) {
      product = await tx.product.findFirst({
        where: { name: { contains: searchTitle, mode: 'insensitive' } },
        include: { variants: true },
      });
    }

    if (!product) {
      throw new AppError(`Product with ID "${rawPid}" does not exist.`, 404, 'PRODUCT_NOT_FOUND');
    }

    const requestedQty = parseInt(item.quantity || 1, 10);
    if (requestedQty <= 0) {
      throw new AppError('Quantity must be at least 1.', 400, 'INVALID_QUANTITY');
    }

    const requestedSize = (item.size || '').trim();

    let variant = null;
    if (item.variant_id) {
      variant = product.variants.find(v => v.id === parseInt(item.variant_id, 10));
    } else if (requestedSize) {
      variant = product.variants.find(v => v.size.toLowerCase() === requestedSize.toLowerCase());
    }

    if (!variant && product.variants && product.variants.length > 0) {
      variant = product.variants[0];
    }

    if (!variant) {
      // Auto-create initial default variant for this product if none existed yet
      const safeSize = requestedSize || 'Free Size';
      const safeSku = `MIR-${product.name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')}-${product.id}-${safeSize.replace(/\s+/g, '')}-${Date.now().toString().slice(-4)}`;
      variant = await tx.productVariant.create({
        data: {
          product_id: product.id,
          sku: safeSku,
          size: safeSize,
          color: 'Default',
          price: product.price,
          stock: 10,
          reserved_stock: 0,
          is_active: true
        }
      });
    }

    if (!variant.is_active) {
      throw new AppError(`Variant "${variant.sku}" is inactive.`, 400, 'VARIANT_INACTIVE');
    }

    // CONCURRENCY-SAFE ATOMIC DEDUCTION
    // Condition: available physical stock (stock - reserved_stock) >= requestedQty
    const stockBefore = variant.stock;
    const stockAfter = stockBefore - requestedQty;

    const updateResult = await tx.$executeRaw`
      UPDATE "ProductVariant"
      SET stock = stock - ${requestedQty}, updated_at = NOW()
      WHERE id = ${variant.id} AND (stock - reserved_stock) >= ${requestedQty}
    `;

    if (updateResult === 0) {
      const current = await tx.productVariant.findUnique({ where: { id: variant.id } });
      const available = Math.max(0, (current?.stock || 0) - (current?.reserved_stock || 0));
      throw new AppError(
        `OUT_OF_STOCK: Insufficient available stock for "${product.name}" (Size: ${variant.size}). Available: ${available} (Total: ${current?.stock || 0}, Held in Checkout: ${current?.reserved_stock || 0}), Requested: ${requestedQty}`,
        409,
        'OUT_OF_STOCK'
      );
    }

    const serverPrice = Number(variant.price || product.price);

    // Record immutable audit ledger
    await tx.inventoryMovement.create({
      data: {
        variant_id: variant.id,
        product_id: product.id,
        type: reference_type,
        quantity: -requestedQty,
        stock_before: stockBefore,
        stock_after: stockAfter,
        reference_type,
        reference_id: String(reference_id),
        note: `${reference_type === 'POS_SALE' ? 'Physical Boutique POS Sale' : 'Direct Order'} - Size: ${variant.size}`,
        created_by: String(created_by),
      },
    });

    await syncProductStockFromVariants(tx, product.id);

    resolvedItems.push({
      product_id: product.id,
      variant_id: variant.id,
      product_name: product.name,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      quantity: requestedQty,
      price: serverPrice,
      total_price: serverPrice * requestedQty,
    });
  }

  return resolvedItems;
};

// ─── STOCK RESTORE (Cancellation / Return) ───────────────────────────────────

/**
 * Restore stock upon Order Cancellation or Product Return. Prevents double-restore.
 */
export const restoreInventoryAtomic = async ({
  tx,
  items,
  type = 'CANCELLATION',
  reference_id,
  created_by = 'System',
  note = '',
}) => {
  for (const item of items) {
    let variant = null;
    if (item.variant_id) {
      variant = await tx.productVariant.findUnique({ where: { id: item.variant_id } });
    }

    const product = await tx.product.findUnique({ where: { id: item.product_id } });
    if (!product) continue;

    const qty = parseInt(item.quantity || 1, 10);

    // Double-restore check
    const existingRestore = await tx.inventoryMovement.findFirst({
      where: {
        reference_id: String(reference_id),
        type,
        quantity: { gt: 0 },
        variant_id: variant ? variant.id : null,
      },
    });

    if (existingRestore) {
      console.warn(`[Inventory] Double-restore prevented for ref: ${reference_id}, variant: ${variant?.id}`);
      continue;
    }

    const stockBefore = variant ? variant.stock : 0;
    const stockAfter = stockBefore + qty;

    if (variant) {
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: stockAfter },
      });
    }

    await tx.inventoryMovement.create({
      data: {
        variant_id: variant ? variant.id : null,
        product_id: product.id,
        type,
        quantity: qty,
        stock_before: stockBefore,
        stock_after: stockAfter,
        reference_type: type,
        reference_id: String(reference_id),
        note: note || `Stock restored via ${type}`,
        created_by: String(created_by),
      },
    });

    await syncProductStockFromVariants(tx, product.id);
  }
};

// ─── STOCK IN (Purchase / Restock) ───────────────────────────────────────────

export const stockIn = async ({
  tx,
  variant_id,
  quantity,
  type = MovementType.PURCHASE,
  reference_id = null,
  created_by = 'System',
  note = '',
}) => {
  const variant = await tx.productVariant.findUnique({ where: { id: parseInt(variant_id, 10) } });
  if (!variant) {
    throw new AppError('Variant not found', 404, 'VARIANT_NOT_FOUND');
  }

  const qty = parseInt(quantity, 10);
  if (qty <= 0) {
    throw new AppError('Stock-in quantity must be positive', 400, 'INVALID_QUANTITY');
  }

  const stockBefore = variant.stock;
  const stockAfter = stockBefore + qty;

  await tx.productVariant.update({
    where: { id: variant.id },
    data: { stock: stockAfter },
  });

  const movement = await tx.inventoryMovement.create({
    data: {
      variant_id: variant.id,
      product_id: variant.product_id,
      type,
      quantity: qty,
      stock_before: stockBefore,
      stock_after: stockAfter,
      reference_type: type,
      reference_id: reference_id ? String(reference_id) : null,
      note: note || `Stock added via ${type}`,
      created_by: String(created_by),
    },
  });

  await syncProductStockFromVariants(tx, variant.product_id);

  return { variant, movement, stockBefore, stockAfter };
};

// ─── BARCODE GENERATOR HELPER ───────────────────────────────────────────────

/**
 * Generate a unique, standard Code-128 compatible barcode string
 */
export const generateBarcodeForVariant = (variantOrId, sku = '') => {
  const vId = typeof variantOrId === 'object' && variantOrId ? variantOrId.id : variantOrId;
  const vSku = typeof variantOrId === 'object' && variantOrId ? (variantOrId.sku || sku) : sku;
  const cleanSku = (vSku || 'VAR').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4);
  const paddedId = String(vId || 1).padStart(6, '0');
  return `MBG-${cleanSku}-${paddedId}`;
};

// ─── MANUAL STOCK ADJUSTMENT ─────────────────────────────────────────────────

export const adjustStockManually = async ({
  variant_id,
  product_id,
  quantity_delta,
  type = 'MANUAL_ADJUSTMENT',
  note = '',
  created_by = 'Admin',
  actor_id = null,
  actor_email = null,
}) => {
  return await prisma.$transaction(async (tx) => {
    let variant = null;
    if (variant_id) {
      variant = await tx.productVariant.findUnique({ where: { id: parseInt(variant_id, 10) } });
    }

    const targetProductId = variant ? variant.product_id : parseInt(product_id, 10);
    const product = await tx.product.findUnique({ where: { id: targetProductId } });

    if (!product) {
      throw new AppError('Product not found for stock adjustment', 404, 'PRODUCT_NOT_FOUND');
    }

    const delta = parseInt(quantity_delta, 10);
    if (isNaN(delta) || delta === 0) {
      throw new AppError('Quantity delta must be a non-zero integer', 400, 'INVALID_QUANTITY');
    }

    const validTypes = ['RESTOCK', 'DAMAGE', 'LOST', 'STOCK_CORRECTION', 'MANUAL_ADJUSTMENT'];
    const adjustmentType = validTypes.includes(type) ? type : 'MANUAL_ADJUSTMENT';

    const stockBefore = variant ? variant.stock : 0;
    const stockAfter = stockBefore + delta;

    if (stockAfter < 0) {
      throw new AppError(
        `Stock adjustment would result in negative stock (${stockBefore} + ${delta} = ${stockAfter}). Current physical stock: ${stockBefore}`,
        400,
        'NEGATIVE_STOCK'
      );
    }

    let updatedVariant = variant;
    if (variant) {
      updatedVariant = await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: stockAfter },
      });
    }

    const movement = await tx.inventoryMovement.create({
      data: {
        variant_id: variant ? variant.id : null,
        product_id: product.id,
        type: adjustmentType,
        quantity: Math.abs(delta),
        stock_before: stockBefore,
        stock_after: stockAfter,
        reference_type: 'MANUAL',
        reference_id: null,
        note: note || `Manual adjustment (${adjustmentType}) by ${created_by}`,
        created_by: String(created_by),
      },
    });

    await syncProductStockFromVariants(tx, product.id);

    await logAdminAction({
      tx,
      actor_id,
      actor_email: actor_email || created_by,
      action: 'stock.adjusted',
      entity: 'ProductVariant',
      entity_id: variant?.id || product.id,
      metadata: {
        type: adjustmentType,
        delta,
        stockBefore,
        stockAfter,
        note,
        sku: variant?.sku,
      },
    });

    return { variant: updatedVariant, product, movement, stockBefore, stockAfter };
  });
};

// ─── PURCHASE / STOCK INWARD (Atomic Lifecycle) ─────────────────────────────

/**
 * Atomically transitions Purchase to RECEIVED and increments variant stock with audit ledger
 */
export const receivePurchaseAtomic = async (paramsOrId, maybeCreatedBy = 'Staff') => {
  const purchase_id = typeof paramsOrId === 'object' && paramsOrId ? paramsOrId.purchase_id : paramsOrId;
  const created_by = typeof paramsOrId === 'object' && paramsOrId ? (paramsOrId.created_by || 'Staff') : maybeCreatedBy;
  const actor_id = typeof paramsOrId === 'object' && paramsOrId ? paramsOrId.actor_id : null;
  const actor_email = typeof paramsOrId === 'object' && paramsOrId ? paramsOrId.actor_email : null;

  return await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: parseInt(purchase_id, 10) },
      include: {
        items: {
          include: { variant: true },
        },
        supplier: true,
      },
    });

    if (!purchase) {
      throw new AppError(`Purchase order #${purchase_id} not found`, 404, 'PURCHASE_NOT_FOUND');
    }

    // IDEMPOTENCY: Never receive the same purchase twice
    if (purchase.status === 'RECEIVED') {
      throw new AppError(`Purchase order #${purchase.purchase_number} has already been received. Double-receive prevented.`, 400, 'PURCHASE_ALREADY_RECEIVED');
    }

    if (purchase.status === 'CANCELLED') {
      throw new AppError(`Cannot receive cancelled purchase #${purchase.purchase_number}.`, 400, 'PURCHASE_CANCELLED');
    }

    if (!purchase.items || purchase.items.length === 0) {
      throw new AppError('Purchase order has no items to inward.', 400, 'NO_PURCHASE_ITEMS');
    }

    const updatedVariants = [];

    // Atomically increment stock for each line item and record ledger movement
    for (const item of purchase.items) {
      const variant = item.variant || await tx.productVariant.findUnique({ where: { id: item.variant_id } });
      if (!variant) {
        throw new AppError(`Variant ID ${item.variant_id} not found for purchase item.`, 404, 'VARIANT_NOT_FOUND');
      }

      const qty = parseInt(item.quantity, 10);
      const stockBefore = variant.stock;
      const stockAfter = stockBefore + qty;
      const itemCost = Number(item.cost_price);

      // Concurrency-safe atomic stock addition + update variant's cost_price
      await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          stock: stockAfter,
          cost_price: itemCost > 0 ? itemCost : variant.cost_price,
        },
      });

      // Immutable stock inward audit ledger
      await tx.inventoryMovement.create({
        data: {
          variant_id: variant.id,
          product_id: variant.product_id,
          type: MovementType.PURCHASE,
          quantity: qty,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reference_type: 'PURCHASE',
          reference_id: purchase.purchase_number,
          note: `Stock Inward: ${purchase.supplier?.name ? `from ${purchase.supplier.name}` : ''} (Invoice: ${purchase.invoice_number || 'N/A'}) - Cost: Rs. ${itemCost}`,
          created_by: String(created_by),
        },
      });

      await syncProductStockFromVariants(tx, variant.product_id);
      updatedVariants.push({ variant_id: variant.id, sku: variant.sku, stockBefore, stockAfter, quantityInward: qty });
    }

    // Transition status to RECEIVED
    const updatedPurchase = await tx.purchase.update({
      where: { id: purchase.id },
      data: { status: 'RECEIVED' },
      include: { items: { include: { variant: true } }, supplier: true },
    });

    await logAdminAction({
      tx,
      actor_id,
      actor_email: actor_email || created_by,
      action: 'purchase.received',
      entity: 'Purchase',
      entity_id: purchase.id,
      metadata: {
        purchase_number: purchase.purchase_number,
        supplier: purchase.supplier?.name,
        total: Number(purchase.total),
        itemsCount: purchase.items.length,
      },
    });

    return { ...updatedPurchase, purchase: updatedPurchase, updatedVariants };
  }, { maxWait: 15000, timeout: 25000 });
};

// ─── RETURNS & RESTOCKING (Atomic Lifecycle) ────────────────────────────────

/**
 * Process return: only RESTOCKABLE returns restore stock to available inventory.
 * DAMAGED returns are safely quarantined without restoring sellable stock.
 */
export const processReturnAtomic = async (paramsOrId, maybeCondition = 'RESTOCKABLE', maybeNotes = '', maybeCreatedBy = 'Staff') => {
  const return_id = typeof paramsOrId === 'object' && paramsOrId ? paramsOrId.return_id : paramsOrId;
  const condition = typeof paramsOrId === 'object' && paramsOrId ? (paramsOrId.condition || 'RESTOCKABLE') : maybeCondition;
  const staff_notes = typeof paramsOrId === 'object' && paramsOrId ? (paramsOrId.staff_notes || '') : maybeNotes;
  const staff_actor = typeof paramsOrId === 'object' && paramsOrId ? (paramsOrId.staff_actor || paramsOrId.created_by || 'Staff') : maybeCreatedBy;
  const actor_id = typeof paramsOrId === 'object' && paramsOrId ? paramsOrId.actor_id : null;
  const actor_email = typeof paramsOrId === 'object' && paramsOrId ? paramsOrId.actor_email : null;

  return await prisma.$transaction(async (tx) => {
    const returnReq = await tx.returnRequest.findUnique({
      where: { id: parseInt(return_id, 10) },
      include: { product: true },
    });

    if (!returnReq) {
      throw new AppError(`Return request #${return_id} not found`, 404, 'RETURN_NOT_FOUND');
    }

    // IDEMPOTENCY: Prevent double-restoration
    if (returnReq.inventory_restored && returnReq.status === 'COMPLETED') {
      throw new AppError(`Return #${return_id} has already completed and processed.`, 400, 'RETURN_ALREADY_COMPLETED');
    }

    const qty = parseInt(returnReq.quantity || 1, 10);
    const variantId = returnReq.variant_id;
    let variant = null;

    if (variantId) {
      variant = await tx.productVariant.findUnique({ where: { id: variantId } });
    }

    const isRestockable = (condition || '').toUpperCase() === 'RESTOCKABLE';
    let stockBefore = variant ? variant.stock : 0;
    let stockAfter = stockBefore;

    if (isRestockable && variant) {
      stockAfter = stockBefore + qty;

      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: stockAfter },
      });

      await tx.inventoryMovement.create({
        data: {
          variant_id: variant.id,
          product_id: returnReq.product_id,
          type: MovementType.RETURN,
          quantity: qty,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reference_type: 'RETURN',
          reference_id: `RET-${returnReq.id}`,
          note: `Restocked Return (Condition: Restockable) - ${staff_notes || 'Authorized boutique return'}`,
          created_by: String(staff_actor),
        },
      });

      await syncProductStockFromVariants(tx, returnReq.product_id);
    } else {
      // Non-restockable / Damaged: DO NOT alter sellable stock. Record movement ledger note.
      await tx.inventoryMovement.create({
        data: {
          variant_id: variant ? variant.id : null,
          product_id: returnReq.product_id,
          type: MovementType.DAMAGE,
          quantity: 0, // Zero sellable delta
          stock_before: stockBefore,
          stock_after: stockBefore,
          reference_type: 'RETURN',
          reference_id: `RET-${returnReq.id}`,
          note: `Damaged / Non-restockable Return (Quarantined) - ${staff_notes || returnReq.reason}`,
          created_by: String(staff_actor),
        },
      });
    }

    const updated = await tx.returnRequest.update({
      where: { id: returnReq.id },
      data: {
        status: 'COMPLETED',
        condition: isRestockable ? 'RESTOCKABLE' : 'DAMAGED',
        inventory_restored: isRestockable,
        staff_notes: staff_notes || returnReq.staff_notes,
        refund_status: 'COMPLETED',
      },
    });

    await logAdminAction({
      tx,
      actor_id,
      actor_email: actor_email || staff_actor,
      action: 'return.completed',
      entity: 'ReturnRequest',
      entity_id: returnReq.id,
      metadata: {
        condition: isRestockable ? 'RESTOCKABLE' : 'DAMAGED',
        inventoryRestored: isRestockable,
        variant_id: variantId,
        quantity: qty,
      },
    });

    return { ...updated, returnRequest: updated, inventoryRestored: isRestockable, stockBefore, stockAfter };
  });
};

// ─── EXCHANGES (Atomic Clothing-Size Swap) ──────────────────────────────────

/**
 * Executes an atomic size exchange:
 * 1. Restores old variant (+qty) if restockable (EXCHANGE_IN)
 * 2. Deducts replacement variant (-qty) atomically (EXCHANGE_OUT)
 * 3. If replacement variant is out of stock -> ROLLS BACK ENTIRE TRANSACTION safely
 * 4. Computes price difference accurately
 */
export const processExchangeAtomic = async (
  paramsOrId,
  maybeNewVariantId = null,
  maybeCondition = 'RESTOCKABLE',
  maybeNotes = '',
  maybeCreatedBy = 'Staff'
) => {
  const return_id = typeof paramsOrId === 'object' && paramsOrId ? paramsOrId.return_id : paramsOrId;
  const new_variant_id = typeof paramsOrId === 'object' && paramsOrId ? paramsOrId.new_variant_id : maybeNewVariantId;
  const old_variant_id = typeof paramsOrId === 'object' && paramsOrId ? paramsOrId.old_variant_id : null;
  const quantity = typeof paramsOrId === 'object' && paramsOrId ? (paramsOrId.quantity || 1) : 1;
  const condition = typeof paramsOrId === 'object' && paramsOrId ? (paramsOrId.condition || 'RESTOCKABLE') : maybeCondition;
  const staff_notes = typeof paramsOrId === 'object' && paramsOrId ? (paramsOrId.staff_notes || '') : maybeNotes;
  const staff_actor = typeof paramsOrId === 'object' && paramsOrId ? (paramsOrId.staff_actor || paramsOrId.created_by || 'Staff') : maybeCreatedBy;
  const actor_id = typeof paramsOrId === 'object' && paramsOrId ? paramsOrId.actor_id : null;
  const actor_email = typeof paramsOrId === 'object' && paramsOrId ? paramsOrId.actor_email : null;

  return await prisma.$transaction(async (tx) => {
    const returnReq = await tx.returnRequest.findUnique({
      where: { id: parseInt(return_id, 10) },
    });

    if (!returnReq) {
      throw new AppError(`Return/Exchange request #${return_id} not found`, 404, 'EXCHANGE_NOT_FOUND');
    }

    // IDEMPOTENCY: Prevent double-completion
    if (returnReq.status === 'COMPLETED' && returnReq.inventory_restored) {
      throw new AppError(`Exchange #${return_id} has already been completed.`, 400, 'EXCHANGE_ALREADY_COMPLETED');
    }

    const qty = parseInt(quantity || returnReq.quantity || 1, 10);
    const targetOldVariantId = parseInt(old_variant_id || returnReq.variant_id, 10);
    const targetNewVariantId = parseInt(new_variant_id || returnReq.exchange_variant_id, 10);

    if (!targetOldVariantId || !targetNewVariantId) {
      throw new AppError('Both original variant and replacement variant are required for size exchange.', 400, 'MISSING_EXCHANGE_VARIANTS');
    }

    if (targetOldVariantId === targetNewVariantId) {
      throw new AppError('Original variant and replacement variant cannot be identical.', 400, 'SAME_VARIANT_EXCHANGE');
    }

    // Fetch both variants
    const [oldVariant, newVariant] = await Promise.all([
      tx.productVariant.findUnique({ where: { id: targetOldVariantId }, include: { product: true } }),
      tx.productVariant.findUnique({ where: { id: targetNewVariantId }, include: { product: true } }),
    ]);

    if (!oldVariant) throw new AppError(`Original variant ID ${targetOldVariantId} not found.`, 404, 'VARIANT_NOT_FOUND');
    if (!newVariant) throw new AppError(`Replacement variant ID ${targetNewVariantId} not found.`, 404, 'VARIANT_NOT_FOUND');

    const isRestockable = (condition || '').toUpperCase() === 'RESTOCKABLE';

    // ── STEP 1: INWARD ORIGINAL ITEM (+qty) ──
    const oldStockBefore = oldVariant.stock;
    let oldStockAfter = oldStockBefore;

    if (isRestockable) {
      oldStockAfter = oldStockBefore + qty;
      await tx.productVariant.update({
        where: { id: oldVariant.id },
        data: { stock: oldStockAfter },
      });

      await tx.inventoryMovement.create({
        data: {
          variant_id: oldVariant.id,
          product_id: oldVariant.product_id,
          type: MovementType.EXCHANGE_IN,
          quantity: qty,
          stock_before: oldStockBefore,
          stock_after: oldStockAfter,
          reference_type: 'EXCHANGE',
          reference_id: `EXC-${returnReq.id}`,
          note: `Exchange Inward: Returned Size ${oldVariant.size} (Restocked)`,
          created_by: String(staff_actor),
        },
      });

      await syncProductStockFromVariants(tx, oldVariant.product_id);
    } else {
      await tx.inventoryMovement.create({
        data: {
          variant_id: oldVariant.id,
          product_id: oldVariant.product_id,
          type: MovementType.DAMAGE,
          quantity: 0,
          stock_before: oldStockBefore,
          stock_after: oldStockBefore,
          reference_type: 'EXCHANGE',
          reference_id: `EXC-${returnReq.id}`,
          note: `Exchange Inward: Returned Size ${oldVariant.size} (Damaged / Quarantined)`,
          created_by: String(staff_actor),
        },
      });
    }

    // ── STEP 2: OUTWARD REPLACEMENT ITEM (-qty) WITH CONCURRENCY CHECK ──
    const newStockBefore = newVariant.stock;
    const newStockAfter = newStockBefore - qty;

    const deductResult = await tx.$executeRaw`
      UPDATE "ProductVariant"
      SET stock = stock - ${qty}, updated_at = NOW()
      WHERE id = ${newVariant.id} AND (stock - reserved_stock) >= ${qty}
    `;

    if (deductResult === 0) {
      const currentNew = await tx.productVariant.findUnique({ where: { id: newVariant.id } });
      const available = Math.max(0, (currentNew?.stock || 0) - (currentNew?.reserved_stock || 0));
      throw new AppError(
        `OUT_OF_STOCK: Replacement size "${newVariant.size}" for "${newVariant.product.name}" is unavailable. Available: ${available}, Requested: ${qty}`,
        409,
        'OUT_OF_STOCK'
      );
    }

    await tx.inventoryMovement.create({
      data: {
        variant_id: newVariant.id,
        product_id: newVariant.product_id,
        type: MovementType.EXCHANGE_OUT,
        quantity: -qty,
        stock_before: newStockBefore,
        stock_after: newStockAfter,
        reference_type: 'EXCHANGE',
        reference_id: `EXC-${returnReq.id}`,
        note: `Exchange Outward: Provided Replacement Size ${newVariant.size}`,
        created_by: String(staff_actor),
      },
    });

    await syncProductStockFromVariants(tx, newVariant.product_id);

    // ── STEP 3: PRICE DIFFERENCE ACCOUNTING ──
    const oldUnitPrice = Number(oldVariant.price);
    const newUnitPrice = Number(newVariant.price);
    const priceDifference = (newUnitPrice - oldUnitPrice) * qty; // > 0: customer owes, < 0: refund due

    // ── STEP 4: UPDATE RETURN REQUEST RECORD ──
    const updated = await tx.returnRequest.update({
      where: { id: returnReq.id },
      data: {
        status: 'COMPLETED',
        type: 'EXCHANGE',
        variant_id: targetOldVariantId,
        exchange_variant_id: targetNewVariantId,
        exchange_quantity: qty,
        condition: isRestockable ? 'RESTOCKABLE' : 'DAMAGED',
        price_difference: priceDifference,
        inventory_restored: true,
        staff_notes: staff_notes || `Size exchange completed: ${oldVariant.size} -> ${newVariant.size}. Price diff: Rs. ${priceDifference}`,
      },
    });

    await logAdminAction({
      tx,
      actor_id,
      actor_email: actor_email || staff_actor,
      action: 'exchange.completed',
      entity: 'ReturnRequest',
      entity_id: returnReq.id,
      metadata: {
        old_size: oldVariant.size,
        new_size: newVariant.size,
        priceDifference,
        quantity: qty,
      },
    });

    return {
      returnRequest: updated,
      oldVariant: { sku: oldVariant.sku, size: oldVariant.size, stockBefore: oldStockBefore, stockAfter: oldStockAfter },
      newVariant: { sku: newVariant.sku, size: newVariant.size, stockBefore: newStockBefore, stockAfter: newStockAfter },
      priceDifference,
    };
  });
};

// ─── FETCH INVENTORY MOVEMENTS ───────────────────────────────────────────────

export const getInventoryMovements = async (query = {}) => {
  const { product_id, variant_id, type, limit = 50, page = 1 } = query;
  const where = {};

  if (product_id) where.product_id = parseInt(product_id, 10);
  if (variant_id) where.variant_id = parseInt(variant_id, 10);
  if (type) where.type = type;

  const take = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * take;

  const [total, movements] = await Promise.all([
    prisma.inventoryMovement.count({ where }),
    prisma.inventoryMovement.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take,
      skip,
      include: {
        product: { select: { id: true, name: true, image_url: true } },
        variant: { select: { id: true, sku: true, size: true, color: true } },
      },
    }),
  ]);

  return { total, page: parseInt(page, 10), limit: take, movements };
};

