/**
 * =========================================================================
 * SUKO ATELIER — SUPPLIER MANAGEMENT CONTROLLER
 * Full supplier CRUD and purchase history aggregation
 * =========================================================================
 */

import prisma from '../prisma/client.js';
import { logAdminAction } from '../services/audit.service.js';

export const getAllSuppliers = async (req, res) => {
  try {
    const { search, is_active } = req.query;
    const where = {};

    if (is_active !== undefined) {
      where.is_active = is_active === 'true' || is_active === true;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { contact_person: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { gstin: { contains: q, mode: 'insensitive' } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        purchases: {
          select: { id: true, total: true, status: true, purchase_date: true },
        },
      },
    });

    const formatted = suppliers.map(s => {
      const receivedPurchases = s.purchases.filter(p => p.status === 'RECEIVED');
      const totalPurchasesAmount = receivedPurchases.reduce((sum, p) => sum + Number(p.total), 0);
      const sortedDates = s.purchases
        .map(p => new Date(p.purchase_date).getTime())
        .sort((a, b) => b - a);
      const lastPurchaseDate = sortedDates.length > 0 ? new Date(sortedDates[0]) : null;

      return {
        id: s.id,
        name: s.name,
        contact_person: s.contact_person,
        phone: s.phone,
        email: s.email,
        gstin: s.gstin,
        address: s.address,
        notes: s.notes,
        is_active: s.is_active,
        total_purchases_count: s.purchases.length,
        received_purchases_count: receivedPurchases.length,
        total_purchases_amount: totalPurchasesAmount,
        last_purchase_date: lastPurchaseDate,
        created_at: s.created_at,
        updated_at: s.updated_at,
      };
    });

    res.json({ success: true, suppliers: formatted });
  } catch (error) {
    console.error('Supplier list error:', error);
    res.status(500).json({ success: false, message: 'Error fetching suppliers', error: error.message });
  }
};

export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        purchases: {
          orderBy: { purchase_date: 'desc' },
          include: {
            items: {
              include: {
                variant: {
                  include: { product: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const receivedPurchases = supplier.purchases.filter(p => p.status === 'RECEIVED');
    const totalAmount = receivedPurchases.reduce((sum, p) => sum + Number(p.total), 0);

    res.json({
      success: true,
      supplier: {
        ...supplier,
        totalPurchasesAmount: totalAmount,
        totalPurchasesCount: supplier.purchases.length,
        receivedCount: receivedPurchases.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving supplier', error: error.message });
  }
};

export const createSupplier = async (req, res) => {
  try {
    const { name, contact_person, phone, email, gstin, address, notes, is_active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Supplier name is required.' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        contact_person: contact_person ? contact_person.trim() : null,
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        gstin: gstin ? gstin.trim().toUpperCase() : null,
        address: address ? address.trim() : null,
        notes: notes ? notes.trim() : null,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      },
    });

    await logAdminAction({
      actor_id: req.user?.id,
      actor_email: req.user?.email,
      action: 'supplier.created',
      entity: 'Supplier',
      entity_id: supplier.id,
      metadata: { name: supplier.name, gstin: supplier.gstin },
    });

    res.status(201).json({ success: true, message: 'Supplier created successfully', supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating supplier', error: error.message });
  }
};

export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, gstin, address, notes, is_active } = req.body;

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (contact_person !== undefined) data.contact_person = contact_person ? contact_person.trim() : null;
    if (phone !== undefined) data.phone = phone ? phone.trim() : null;
    if (email !== undefined) data.email = email ? email.trim() : null;
    if (gstin !== undefined) data.gstin = gstin ? gstin.trim().toUpperCase() : null;
    if (address !== undefined) data.address = address ? address.trim() : null;
    if (notes !== undefined) data.notes = notes ? notes.trim() : null;
    if (is_active !== undefined) data.is_active = Boolean(is_active);

    const supplier = await prisma.supplier.update({
      where: { id: parseInt(id, 10) },
      data,
    });

    await logAdminAction({
      actor_id: req.user?.id,
      actor_email: req.user?.email,
      action: 'supplier.updated',
      entity: 'Supplier',
      entity_id: supplier.id,
      metadata: { name: supplier.name },
    });

    res.json({ success: true, message: 'Supplier updated successfully', supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating supplier', error: error.message });
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplierId = parseInt(id, 10);

    // Soft delete if purchases exist, hard delete otherwise
    const purchasesCount = await prisma.purchase.count({ where: { supplier_id: supplierId } });

    if (purchasesCount > 0) {
      await prisma.supplier.update({
        where: { id: supplierId },
        data: { is_active: false },
      });
    } else {
      await prisma.supplier.delete({ where: { id: supplierId } });
    }

    await logAdminAction({
      actor_id: req.user?.id,
      actor_email: req.user?.email,
      action: 'supplier.deleted',
      entity: 'Supplier',
      entity_id: supplierId,
    });

    res.json({ success: true, message: 'Supplier removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting supplier', error: error.message });
  }
};
