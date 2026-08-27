/**
 * =========================================================================
 * SUKO ATELIER — AUDIT LOGGING SERVICE
 * Records administrative and operational actions into AdminAuditLog
 * =========================================================================
 */

import prisma from '../prisma/client.js';

// Keys that must NEVER be logged to audit metadata
const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'token',
  'jwt',
  'secret',
  'otp',
  'reset_otp',
  'razorpay_key_secret',
  'card_number',
  'cvv',
  'authheader',
  'authorization',
]);

/**
 * Recursively scrub sensitive keys from metadata object
 */
function sanitizeMetadata(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeMetadata);

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      clean[key] = sanitizeMetadata(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Log an administrative / operational action
 * 
 * @param {Object} params
 * @param {number|null} [params.actor_id]
 * @param {string|null} [params.actor_email]
 * @param {string} params.action - e.g. "stock.adjusted", "purchase.received", "return.approved"
 * @param {string} params.entity - e.g. "ProductVariant", "Purchase", "ReturnRequest", "Supplier"
 * @param {string|number|null} [params.entity_id]
 * @param {Object} [params.metadata]
 * @param {PrismaTransaction} [params.tx] - Optional transaction client
 */
export async function logAdminAction({
  actor_id = null,
  admin_id = null,
  actor_email = null,
  admin_name = null,
  action,
  entity,
  resource,
  entity_id = null,
  resource_id = null,
  metadata = {},
  details = null,
  tx = null,
}) {
  const db = tx || prisma;
  const targetEntity = entity || resource || 'System';
  const targetEntityId = entity_id || resource_id || null;
  const rawMeta = details || metadata || {};
  const sanitizedMeta = sanitizeMetadata(rawMeta);

  try {
    const entry = await db.adminAuditLog.create({
      data: {
        actor_id: (actor_id || admin_id) ? parseInt(actor_id || admin_id, 10) : null,
        actor_email: actor_email || admin_name || 'System',
        action,
        entity: targetEntity,
        entity_id: targetEntityId ? String(targetEntityId) : null,
        metadata: sanitizedMeta,
      },
    });
    // Return object with both metadata and details for backwards-compatible test assertions
    if (entry) {
      entry.details = entry.metadata;
    }
    return entry;
  } catch (error) {
    console.error(`[AuditLog Warning] Failed to write audit log for ${action}:`, error.message);
    return null;
  }
}
