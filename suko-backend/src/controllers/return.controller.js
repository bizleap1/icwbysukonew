/**
 * =========================================================================
 * SUKO ATELIER — RETURNS & EXCHANGES CONTROLLER
 * Online & POS return processing, atomic size exchange engine, restock condition
 * =========================================================================
 */

import prisma from '../prisma/client.js';
import { processReturnAtomic, processExchangeAtomic } from '../services/inventory.service.js';
import { logAdminAction } from '../services/audit.service.js';

/**
 * Submit a Return or Exchange request (Customer or Staff)
 */
export const createReturnRequest = async (req, res) => {
  try {
    const {
      order_id,
      sale_id,
      product_id,
      variant_id,
      quantity = 1,
      reason,
      type = 'RETURN', // 'RETURN' | 'EXCHANGE'
      exchange_variant_id,
      exchange_quantity = 1,
      customer_name,
      customer_phone,
      customer_email,
    } = req.body;

    if (!product_id || !reason) {
      return res.status(400).json({ success: false, message: 'Product ID and reason are required.' });
    }

    if (!order_id && !sale_id) {
      return res.status(400).json({ success: false, message: 'Return must reference an Order ID or POS Sale ID.' });
    }

    if (type === 'EXCHANGE' && !exchange_variant_id) {
      return res.status(400).json({ success: false, message: 'Replacement variant is required for an exchange.' });
    }

    const created = await prisma.returnRequest.create({
      data: {
        order_id: order_id ? parseInt(order_id, 10) : null,
        sale_id: sale_id ? parseInt(sale_id, 10) : null,
        product_id: parseInt(product_id, 10),
        variant_id: variant_id ? parseInt(variant_id, 10) : null,
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        reason: reason.trim(),
        type: type.toUpperCase() === 'EXCHANGE' ? 'EXCHANGE' : 'RETURN',
        exchange_variant_id: exchange_variant_id ? parseInt(exchange_variant_id, 10) : null,
        exchange_quantity: exchange_variant_id ? Math.max(1, parseInt(exchange_quantity, 10) || 1) : null,
        customer_name: customer_name ? customer_name.trim() : (req.user?.name || null),
        customer_phone: customer_phone ? String(customer_phone).trim() : (req.user?.phone || null),
        customer_email: customer_email ? customer_email.trim() : (req.user?.email || null),
        status: 'REQUESTED',
        created_by: req.user?.name || req.user?.email || 'Customer',
      },
      include: {
        product: { select: { id: true, name: true, image_url: true } },
        variant: { select: { id: true, sku: true, size: true, color: true } },
        exchange_variant: { select: { id: true, sku: true, size: true, color: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: `${created.type === 'EXCHANGE' ? 'Exchange' : 'Return'} request submitted successfully.`,
      returnRequest: created,
    });
  } catch (error) {
    console.error('Create return error:', error);
    res.status(500).json({ success: false, message: 'Error submitting return request', error: error.message });
  }
};

/**
 * Get all Returns & Exchanges with filters
 */
export const getAllReturns = async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    if (type && type !== 'ALL') {
      where.type = type.toUpperCase();
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { customer_name: { contains: q, mode: 'insensitive' } },
        { customer_phone: { contains: q, mode: 'insensitive' } },
        { customer_email: { contains: q, mode: 'insensitive' } },
        { reason: { contains: q, mode: 'insensitive' } },
        { product: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * take;

    const [total, returns] = await Promise.all([
      prisma.returnRequest.count({ where }),
      prisma.returnRequest.findMany({
        where,
        take,
        skip,
        orderBy: { created_at: 'desc' },
        include: {
          product: { select: { id: true, name: true, image_url: true } },
          variant: { select: { id: true, sku: true, size: true, color: true, price: true } },
          exchange_variant: { select: { id: true, sku: true, size: true, color: true, price: true } },
          order: { select: { id: true, total: true, created_at: true } },
          sale: { select: { id: true, invoice_number: true, total: true, created_at: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page, 10) || 1,
      limit: take,
      totalPages: Math.ceil(total / take),
      returns,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching returns', error: error.message });
  }
};

/**
 * Get return details by ID
 */
export const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    const returnReq = await prisma.returnRequest.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        product: true,
        variant: true,
        exchange_variant: true,
        order: { include: { items: true, payments: true } },
        sale: { include: { items: true, payments: true } },
      },
    });

    if (!returnReq) {
      return res.status(404).json({ success: false, message: 'Return/Exchange request not found' });
    }

    res.json({ success: true, returnRequest: returnReq });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving return request', error: error.message });
  }
};

/**
 * Update Return or Exchange status lifecycle (APPROVE, REJECT, RECEIVE & COMPLETE)
 */
export const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, condition = 'RESTOCKABLE', staff_notes, new_variant_id } = req.body;
    const returnId = parseInt(id, 10);

    const existing = await prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: { variant: true, exchange_variant: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Return request not found.' });
    }

    const targetStatus = (status || '').toUpperCase();
    const actorName = req.user?.name || req.user?.email || 'Store Staff';
    const actorId = req.user?.id || null;
    const actorEmail = req.user?.email || null;

    if (targetStatus === 'APPROVED') {
      const updated = await prisma.returnRequest.update({
        where: { id: returnId },
        data: { status: 'APPROVED', staff_notes: staff_notes || existing.staff_notes },
      });
      return res.json({ success: true, message: 'Return request approved.', returnRequest: updated });
    }

    if (targetStatus === 'REJECTED') {
      const updated = await prisma.returnRequest.update({
        where: { id: returnId },
        data: { status: 'REJECTED', staff_notes: staff_notes || existing.staff_notes },
      });
      return res.json({ success: true, message: 'Return request rejected.', returnRequest: updated });
    }

    // COMPLETE / RECEIVED LIFECYCLE
    if (targetStatus === 'COMPLETED' || targetStatus === 'RECEIVED') {
      if (existing.type === 'EXCHANGE') {
        const result = await processExchangeAtomic({
          return_id: returnId,
          old_variant_id: existing.variant_id,
          new_variant_id: new_variant_id || existing.exchange_variant_id,
          quantity: existing.quantity,
          condition: condition || 'RESTOCKABLE',
          staff_actor: actorName,
          actor_id: actorId,
          actor_email: actorEmail,
          staff_notes,
        });

        return res.json({
          success: true,
          message: 'Exchange processed atomically. Physical inventory synchronized.',
          ...result,
        });
      } else {
        // STANDARD RETURN
        const result = await processReturnAtomic({
          return_id: returnId,
          condition: condition || 'RESTOCKABLE',
          staff_actor: actorName,
          actor_id: actorId,
          actor_email: actorEmail,
          staff_notes,
        });

        return res.json({
          success: true,
          message: `Return completed (${condition === 'RESTOCKABLE' ? 'Restocked' : 'Quarantined as Damaged'}).`,
          ...result,
        });
      }
    }

    res.status(400).json({ success: false, message: `Unsupported status transition: ${targetStatus}` });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, code: error.code || 'RETURN_ERROR', message: error.message });
  }
};

/**
 * Direct POS Boutique Counter Return or Exchange
 */
export const createPosDirectReturnOrExchange = async (req, res) => {
  try {
    const {
      sale_id,
      invoice_number,
      product_id,
      variant_id,
      quantity = 1,
      reason = 'Counter Return / Exchange',
      type = 'RETURN', // 'RETURN' | 'EXCHANGE'
      exchange_variant_id,
      condition = 'RESTOCKABLE',
      customer_name = 'Walk-in Customer',
      customer_phone,
      staff_notes,
    } = req.body;

    let targetSaleId = sale_id ? parseInt(sale_id, 10) : null;
    if (!targetSaleId && invoice_number) {
      const sale = await prisma.sale.findUnique({ where: { invoice_number: invoice_number.trim() } });
      if (sale) targetSaleId = sale.id;
    }

    const actorName = req.user?.name || req.user?.email || 'Boutique Cashier';
    const actorId = req.user?.id || null;
    const actorEmail = req.user?.email || null;

    // Create record in database
    const returnReq = await prisma.returnRequest.create({
      data: {
        sale_id: targetSaleId,
        product_id: parseInt(product_id, 10),
        variant_id: parseInt(variant_id, 10),
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        reason: reason.trim(),
        type: type.toUpperCase() === 'EXCHANGE' ? 'EXCHANGE' : 'RETURN',
        exchange_variant_id: exchange_variant_id ? parseInt(exchange_variant_id, 10) : null,
        exchange_quantity: exchange_variant_id ? Math.max(1, parseInt(quantity, 10) || 1) : null,
        condition: condition.toUpperCase() === 'DAMAGED' ? 'DAMAGED' : 'RESTOCKABLE',
        customer_name: customer_name ? customer_name.trim() : 'Walk-in Customer',
        customer_phone: customer_phone ? String(customer_phone).trim() : null,
        status: 'REQUESTED',
        created_by: actorName,
      },
    });

    if (returnReq.type === 'EXCHANGE') {
      const result = await processExchangeAtomic({
        return_id: returnReq.id,
        old_variant_id: returnReq.variant_id,
        new_variant_id: returnReq.exchange_variant_id,
        quantity: returnReq.quantity,
        condition,
        staff_actor: actorName,
        actor_id: actorId,
        actor_email: actorEmail,
        staff_notes: staff_notes || 'Direct POS size exchange',
      });

      return res.status(201).json({
        success: true,
        message: 'POS Counter Exchange completed successfully.',
        ...result,
      });
    } else {
      const result = await processReturnAtomic({
        return_id: returnReq.id,
        condition,
        staff_actor: actorName,
        actor_id: actorId,
        actor_email: actorEmail,
        staff_notes: staff_notes || 'Direct POS return',
      });

      return res.status(201).json({
        success: true,
        message: 'POS Counter Return completed successfully.',
        ...result,
      });
    }
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, code: error.code || 'POS_RETURN_ERROR', message: error.message });
  }
};
