/**
 * =========================================================================
 * SUKO ATELIER — PURCHASES & STOCK INWARD CONTROLLER
 * Real stock inward workflow with atomic receiving and audit logging
 * =========================================================================
 */

import prisma from '../prisma/client.js';
import { receivePurchaseAtomic } from '../services/inventory.service.js';
import { logAdminAction } from '../services/audit.service.js';

/**
 * Generate sequential purchase order number (e.g. PO-2026-0001)
 */
async function generatePurchaseNumber(tx) {
  const currentYear = new Date().getFullYear();
  const prefix = `PO-${currentYear}`;

  const counter = await tx.invoiceCounter.upsert({
    where: { prefix },
    update: { current_count: { increment: 1 } },
    create: { prefix, current_count: 1 },
  });

  return `${prefix}-${String(counter.current_count).padStart(4, '0')}`;
}

/**
 * Create a new Purchase in DRAFT status (DOES NOT alter inventory)
 */
export const createPurchase = async (req, res) => {
  try {
    const {
      supplier_id,
      invoice_number,
      purchase_date,
      items,
      tax = 0,
      notes,
      status = 'DRAFT',
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one variant item is required for a purchase.' });
    }

    const creatorName = req.user?.name || req.user?.email || 'Store Staff';
    const actorId = req.user?.id || null;
    const actorEmail = req.user?.email || null;

    const purchase = await prisma.$transaction(async (tx) => {
      const purchaseNumber = await generatePurchaseNumber(tx);

      // Validate all variants and calculate totals
      let calculatedSubtotal = 0;
      const validatedItems = [];

      for (const it of items) {
        const variantId = parseInt(it.variant_id, 10);
        const qty = parseInt(it.quantity, 10);
        const costPrice = Math.max(0, Number(it.cost_price) || 0);

        if (isNaN(variantId) || qty <= 0) {
          throw new Error('Each item must specify a valid variant_id and positive quantity.');
        }

        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          include: { product: true },
        });

        if (!variant) {
          throw new Error(`Variant ID ${variantId} not found.`);
        }

        const lineTotal = costPrice * qty;
        calculatedSubtotal += lineTotal;

        validatedItems.push({
          variant_id: variant.id,
          quantity: qty,
          cost_price: costPrice,
          total: lineTotal,
        });
      }

      const taxAmount = Math.max(0, Number(tax) || 0);
      const grandTotal = calculatedSubtotal + taxAmount;

      const created = await tx.purchase.create({
        data: {
          purchase_number: purchaseNumber,
          supplier_id: supplier_id ? parseInt(supplier_id, 10) : null,
          invoice_number: invoice_number ? invoice_number.trim() : null,
          purchase_date: purchase_date ? new Date(purchase_date) : new Date(),
          subtotal: calculatedSubtotal,
          tax: taxAmount,
          total: grandTotal,
          status: status === 'ORDERED' ? 'ORDERED' : 'DRAFT', // DRAFT by default
          notes: notes ? notes.trim() : null,
          created_by: creatorName,
          items: {
            create: validatedItems,
          },
        },
        include: {
          items: {
            include: {
              variant: {
                include: { product: { select: { name: true, image_url: true } } },
              },
            },
          },
          supplier: true,
        },
      });

      await logAdminAction({
        tx,
        actor_id: actorId,
        actor_email: actorEmail,
        action: 'purchase.created',
        entity: 'Purchase',
        entity_id: created.id,
        metadata: {
          purchase_number: created.purchase_number,
          total: grandTotal,
          itemsCount: validatedItems.length,
        },
      });

      return created;
    });

    res.status(201).json({
      success: true,
      message: `Purchase ${purchase.purchase_number} created successfully in ${purchase.status} status. (Inventory untouched until received)`,
      purchase,
    });
  } catch (error) {
    console.error('Purchase creation error:', error);
    res.status(400).json({ success: false, message: error.message || 'Error creating purchase order' });
  }
};

/**
 * Get all purchases with filters and pagination
 */
export const getAllPurchases = async (req, res) => {
  try {
    const { supplier_id, status, search, start_date, end_date, page = 1, limit = 20 } = req.query;
    const where = {};

    if (supplier_id) where.supplier_id = parseInt(supplier_id, 10);
    if (status) where.status = status.toUpperCase();

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { purchase_number: { contains: q, mode: 'insensitive' } },
        { invoice_number: { contains: q, mode: 'insensitive' } },
        { supplier: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (start_date && end_date) {
      where.purchase_date = {
        gte: new Date(start_date),
        lte: new Date(end_date),
      };
    }

    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * take;

    const [total, purchases] = await Promise.all([
      prisma.purchase.count({ where }),
      prisma.purchase.findMany({
        where,
        take,
        skip,
        orderBy: { created_at: 'desc' },
        include: {
          supplier: true,
          items: {
            include: {
              variant: {
                include: { product: { select: { name: true, image_url: true } } },
              },
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page, 10) || 1,
      limit: take,
      totalPages: Math.ceil(total / take),
      purchases,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching purchases', error: error.message });
  }
};

/**
 * Get single purchase details
 */
export const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseId = parseInt(id, 10);
    const where = isNaN(purchaseId) ? { purchase_number: id } : { id: purchaseId };

    const purchase = await prisma.purchase.findUnique({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    res.json({ success: true, purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving purchase order', error: error.message });
  }
};

/**
 * Update a draft purchase
 */
export const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseId = parseInt(id, 10);
    const { supplier_id, invoice_number, purchase_date, items, tax, notes } = req.body;

    const existing = await prisma.purchase.findUnique({ where: { id: purchaseId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    if (existing.status === 'RECEIVED') {
      return res.status(400).json({ success: false, message: 'Cannot edit an already RECEIVED purchase.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      let calculatedSubtotal = Number(existing.subtotal);

      if (items && Array.isArray(items) && items.length > 0) {
        // Delete old items and insert updated items
        await tx.purchaseItem.deleteMany({ where: { purchase_id: purchaseId } });

        calculatedSubtotal = 0;
        const newItems = [];
        for (const it of items) {
          const qty = parseInt(it.quantity, 10);
          const cost = Math.max(0, Number(it.cost_price) || 0);
          const lineTotal = cost * qty;
          calculatedSubtotal += lineTotal;
          newItems.push({
            variant_id: parseInt(it.variant_id, 10),
            quantity: qty,
            cost_price: cost,
            total: lineTotal,
          });
        }

        await tx.purchaseItem.createMany({
          data: newItems.map(it => ({ ...it, purchase_id: purchaseId })),
        });
      }

      const taxAmount = tax !== undefined ? Math.max(0, Number(tax)) : Number(existing.tax);
      const grandTotal = calculatedSubtotal + taxAmount;

      return await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          supplier_id: supplier_id !== undefined ? (supplier_id ? parseInt(supplier_id, 10) : null) : existing.supplier_id,
          invoice_number: invoice_number !== undefined ? (invoice_number ? invoice_number.trim() : null) : existing.invoice_number,
          purchase_date: purchase_date ? new Date(purchase_date) : existing.purchase_date,
          subtotal: calculatedSubtotal,
          tax: taxAmount,
          total: grandTotal,
          notes: notes !== undefined ? (notes ? notes.trim() : null) : existing.notes,
        },
        include: { items: { include: { variant: true } }, supplier: true },
      });
    });

    res.json({ success: true, message: 'Purchase updated successfully', purchase: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Error updating purchase' });
  }
};

/**
 * Atomically receive purchase order and inward stock to sellable inventory
 */
export const receivePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseId = parseInt(id, 10);

    const actorName = req.user?.name || req.user?.email || 'Store Manager';
    const actorId = req.user?.id || null;
    const actorEmail = req.user?.email || null;

    const result = await receivePurchaseAtomic({
      purchase_id: purchaseId,
      created_by: actorName,
      actor_id: actorId,
      actor_email: actorEmail,
    });

    res.json({
      success: true,
      message: `Purchase ${result.purchase.purchase_number} successfully received. Stock inwarded to physical inventory.`,
      purchase: result.purchase,
      updatedVariants: result.updatedVariants,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, code: error.code || 'RECEIVE_ERROR', message: error.message });
  }
};

/**
 * Cancel a draft/ordered purchase
 */
export const cancelPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseId = parseInt(id, 10);

    const existing = await prisma.purchase.findUnique({ where: { id: purchaseId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Purchase not found' });

    if (existing.status === 'RECEIVED') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a purchase that has already been received.' });
    }

    const updated = await prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: 'CANCELLED' },
    });

    await logAdminAction({
      actor_id: req.user?.id,
      actor_email: req.user?.email,
      action: 'purchase.cancelled',
      entity: 'Purchase',
      entity_id: purchaseId,
      metadata: { purchase_number: existing.purchase_number },
    });

    res.json({ success: true, message: 'Purchase cancelled', purchase: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cancelling purchase', error: error.message });
  }
};
