// Order Status Constants and Transition Enforcement

const ORDER_STATUS = Object.freeze({
  PAYMENT_PENDING: 'payment_pending',
  PAID: 'paid',
  PAYMENT_FAILED: 'payment_failed',
  EXPIRED: 'expired',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCEL_REQUESTED: 'cancel_requested',
  CANCELLED: 'cancelled'
});

const RESERVATION_STATUS = Object.freeze({
  RESERVED: 'reserved',
  FINALIZED: 'finalized',
  RELEASED: 'released'
});

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  DUPLICATE_CAPTURED: 'duplicate_captured'
});

// System-wide allowed state transitions for Order.status
// (Paid/Processing orders MUST route through cancel_requested before cancelled to ensure manual financial accounting)
const ALLOWED_ORDER_TRANSITIONS = {
  [ORDER_STATUS.PAYMENT_PENDING]: [
    ORDER_STATUS.PAID,
    ORDER_STATUS.PAYMENT_FAILED,
    ORDER_STATUS.EXPIRED,
    ORDER_STATUS.CANCELLED
  ],
  [ORDER_STATUS.PAID]: [
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.CANCEL_REQUESTED
  ],
  [ORDER_STATUS.PROCESSING]: [
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.CANCEL_REQUESTED
  ],
  [ORDER_STATUS.SHIPPED]: [
    ORDER_STATUS.DELIVERED
  ],
  [ORDER_STATUS.CANCEL_REQUESTED]: [
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.PAID,        // Rejection returns to paid if requested from paid
    ORDER_STATUS.PROCESSING  // Rejection returns to processing if requested from processing
  ],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.PAYMENT_FAILED]: [],
  [ORDER_STATUS.EXPIRED]: []
};

// Admin fulfillment transitions
// (Admin cannot manually set paid or revert to payment_pending; cancellations on paid orders must go through cancel_requested review)
const ALLOWED_ADMIN_FULFILLMENT_TRANSITIONS = {
  [ORDER_STATUS.PAYMENT_PENDING]: [
    ORDER_STATUS.CANCELLED // Admin can cancel an abandoned unpaid checkout
  ],
  [ORDER_STATUS.PAID]: [
    ORDER_STATUS.PROCESSING
  ],
  [ORDER_STATUS.PROCESSING]: [
    ORDER_STATUS.SHIPPED
  ],
  [ORDER_STATUS.SHIPPED]: [
    ORDER_STATUS.DELIVERED
  ],
  [ORDER_STATUS.CANCEL_REQUESTED]: [
    ORDER_STATUS.CANCELLED,   // Admin approves cancellation (manual accounting review acknowledged)
    ORDER_STATUS.PAID,        // Admin rejects cancellation for order originally paid
    ORDER_STATUS.PROCESSING  // Admin rejects cancellation for order originally in processing
  ],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
  [ORDER_STATUS.PAYMENT_FAILED]: [],
  [ORDER_STATUS.EXPIRED]: []
};

/**
 * Validates if an order status transition is permitted generally
 * @param {string} currentStatus 
 * @param {string} targetStatus 
 * @returns {boolean}
 */
function isValidOrderTransition(currentStatus, targetStatus) {
  if (!currentStatus || !targetStatus) return false;
  if (currentStatus === targetStatus) return true; // Idempotent same-state check
  const allowed = ALLOWED_ORDER_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Validates if an admin fulfillment status transition is permitted
 * (Prevents admin from manually marking unpaid orders as paid, reverting to payment_pending,
 * or bypassing the cancel_requested review workflow for paid orders)
 * @param {string} currentStatus 
 * @param {string} targetStatus 
 * @returns {boolean}
 */
function isValidAdminTransition(currentStatus, targetStatus) {
  if (!currentStatus || !targetStatus) return false;
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_ADMIN_FULFILLMENT_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Converts a decimal or number string into exact integer paise (minor units)
 * avoiding JavaScript floating-point representation quirks.
 * @param {number|string|Decimal} amount 
 * @returns {number} Integer amount in paise
 */
function toPaise(amount) {
  if (amount == null) return 0;
  const num = Number(amount);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

module.exports = {
  ORDER_STATUS,
  RESERVATION_STATUS,
  PAYMENT_STATUS,
  ALLOWED_ORDER_TRANSITIONS,
  ALLOWED_ADMIN_FULFILLMENT_TRANSITIONS,
  isValidOrderTransition,
  isValidAdminTransition,
  toPaise
};
