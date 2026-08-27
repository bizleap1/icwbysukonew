import prisma from '../prisma/client.js';
import { generateSafeInvoiceNumber, deductInventoryAtomic } from '../services/inventory.service.js';
import { DISCOUNT_LIMITS } from '../config/env.js';

/**
 * Create a new offline store / POS Sale with atomic stock deduction and safe invoice number.
 * - Server calculates all prices and totals
 * - Discount limits enforced per role
 * - Full transaction: invoice + stock + sale + payment + movement
 */
export const createSale = async (req, res) => {
  try {
    const {
      items,
      customer_name = 'Walk-in Customer',
      customer_phone = null,
      discount = 0,
      tax = 0,
      payment_method = 'cash',
      split_payments = null, // Optional [{ method: 'cash', amount: 2000 }, { method: 'upi', amount: 2999, reference: '...' }]
      amount_received = null,
      payment_reference = null,
      payment_ref = null,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required to complete a POS sale.' });
    }

    const staffId = req.user?.id || null;
    const staffName = req.user?.name || 'Store Staff';
    const staffRole = req.user?.role?.toLowerCase() || 'cashier';

    // Execute atomic transaction for safe invoice sequence, stock deduction, sale creation, and audit logging
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Generate concurrency-safe sequential invoice number (e.g. POS-2026-0001)
      const invoiceNumber = await generateSafeInvoiceNumber(tx);

      // 2. Atomically validate and deduct stock using centralized inventory engine
      const deductedItems = await deductInventoryAtomic({
        tx,
        items,
        reference_type: 'POS_SALE',
        reference_id: invoiceNumber,
        created_by: `${staffName} (Staff ID: ${staffId || 'Boutique'})`,
      });

      // 3. Server-side price and total calculations (Never trust client-supplied totals)
      const calculatedSubtotal = deductedItems.reduce((acc, it) => acc + it.total_price, 0);

      // 4. Enforce discount limits per role
      const requestedDiscount = Math.max(0, Number(discount) || 0);
      const maxDiscountPercent = DISCOUNT_LIMITS[staffRole] ?? 0;
      const maxDiscountAmount = (calculatedSubtotal * maxDiscountPercent) / 100;

      let discountAmount = Math.min(calculatedSubtotal, requestedDiscount);

      // Check if discount exceeds role limit
      if (discountAmount > maxDiscountAmount && !['admin', 'super_admin'].includes(staffRole)) {
        const err = new Error(
          `DISCOUNT_LIMIT_EXCEEDED: Your role (${staffRole}) allows max ${maxDiscountPercent}% discount (Rs. ${maxDiscountAmount.toFixed(0)}). Requested: Rs. ${discountAmount.toFixed(0)}`
        );
        err.statusCode = 403;
        throw err;
      }

      const taxAmount = Math.max(0, Number(tax) || 0);
      const grandTotal = Math.max(0, calculatedSubtotal - discountAmount + taxAmount);

      // 5. Handle Payment & Split Payment Logic
      let receivedAmount = null;
      let changeAmount = 0;
      let effectivePaymentMethod = (payment_method || 'cash').toLowerCase();

      const paymentEntries = [];

      if (split_payments && Array.isArray(split_payments) && split_payments.length > 0) {
        effectivePaymentMethod = 'split';
        let splitSum = 0;

        split_payments.forEach((sp, idx) => {
          const m = (sp.method || 'cash').toLowerCase();
          const amt = Math.max(0, Number(sp.amount) || 0);
          splitSum += amt;

          paymentEntries.push({
            gateway: m.toUpperCase(),
            gateway_payment_id: sp.reference || `${invoiceNumber}-SPLIT-${idx + 1}`,
            amount: amt,
            currency: 'INR',
            status: 'PAID',
            payment_reference: sp.reference || `SPLIT-${m.toUpperCase()}-${amt}`,
          });
        });

        if (Math.abs(splitSum - grandTotal) > 0.01) {
          const err = new Error(`INVALID_SPLIT_PAYMENT: Split payment total (Rs. ${splitSum}) must exactly equal Grand Total (Rs. ${grandTotal}).`);
          err.statusCode = 400;
          throw err;
        }
      } else {
        if (effectivePaymentMethod === 'cash') {
          receivedAmount = amount_received !== null && amount_received !== undefined
            ? Number(amount_received)
            : grandTotal;

          if (receivedAmount < grandTotal) {
            const err = new Error(`INVALID_CASH_AMOUNT: Received amount (Rs. ${receivedAmount}) cannot be less than Grand Total (Rs. ${grandTotal}).`);
            err.statusCode = 400;
            throw err;
          }
          changeAmount = Math.max(0, receivedAmount - grandTotal);
        }

        paymentEntries.push({
          gateway: effectivePaymentMethod.toUpperCase(),
          gateway_payment_id: payment_reference || payment_ref || `${invoiceNumber}-PAY`,
          amount: grandTotal,
          currency: 'INR',
          status: 'PAID',
          payment_reference: payment_reference || payment_ref || (effectivePaymentMethod === 'cash' ? `CASH-TENDER-${receivedAmount}` : `${effectivePaymentMethod.toUpperCase()}-DIRECT`),
        });
      }

      // 6. Create Sale with historical snapshot data
      const createdSale = await tx.sale.create({
        data: {
          invoice_number: invoiceNumber,
          staff_id: staffId,
          staff_name: staffName,
          customer_name: customer_name.trim() || 'Walk-in Customer',
          customer_phone: customer_phone ? String(customer_phone).trim() : null,
          subtotal: calculatedSubtotal,
          discount: discountAmount,
          tax: taxAmount,
          total: grandTotal,
          payment_method: effectivePaymentMethod,
          amount_received: receivedAmount,
          change_amount: changeAmount,
          payment_ref: payment_ref || payment_reference || null,
          payment_reference: payment_reference || payment_ref || null,
          status: 'COMPLETED',
          items: {
            create: deductedItems.map(it => ({
              product_id: it.product_id,
              variant_id: it.variant_id,
              product_name: it.product_name,
              product_name_snapshot: it.product_name,
              sku_snapshot: it.sku,
              size: it.size,
              size_snapshot: it.size,
              color_snapshot: it.color,
              quantity: it.quantity,
              price_at_sale: it.price,
              total_price: it.total_price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, image_url: true } },
              variant: { select: { id: true, sku: true, size: true, color: true } },
            },
          },
          staff: { select: { id: true, name: true, email: true } },
        },
      });

      // 7. Record Payment entries in unified payment ledger
      for (const pe of paymentEntries) {
        await tx.payment.create({
          data: {
            sale_id: createdSale.id,
            ...pe,
          },
        });
      }

      return createdSale;
    }, {
      maxWait: 10000,
      timeout: 30000
    });

    res.status(201).json({
      success: true,
      message: 'POS Sale recorded successfully! Real-time inventory synchronized.',
      sale,
    });
  } catch (error) {
    console.error('POS Sale Error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, code: error.code || 'POS_ERROR', message: error.message || 'Error processing POS sale' });
  }
};

/**
 * Get all offline POS store sales with date range, method, and staff filters
 */
export const getAllSales = async (req, res) => {
  try {
    const { filter, payment_method, staff_id, search, start_date, end_date } = req.query;
    const where = {};

    if (payment_method) {
      where.payment_method = payment_method.toLowerCase();
    }
    if (staff_id) {
      where.staff_id = parseInt(staff_id, 10);
    }
    if (search) {
      where.OR = [
        { invoice_number: { contains: search, mode: 'insensitive' } },
        { customer_name: { contains: search, mode: 'insensitive' } },
        { customer_phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Date range filters (today, yesterday, this_week, this_month, custom)
    const now = new Date();
    if (filter === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.created_at = { gte: start };
    } else if (filter === 'yesterday') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.created_at = { gte: start, lt: end };
    } else if (filter === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
      weekStart.setHours(0, 0, 0, 0);
      where.created_at = { gte: weekStart };
    } else if (filter === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      where.created_at = { gte: start };
    } else if (start_date && end_date) {
      where.created_at = {
        gte: new Date(start_date),
        lte: new Date(end_date),
      };
    }

    const sales = await prisma.sale.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, image_url: true } },
            variant: { select: { id: true, sku: true, size: true } },
          },
        },
        staff: { select: { id: true, name: true, email: true } },
        payments: true,
      },
    });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching POS sales', error: error.message });
  }
};

/**
 * Get single POS sale details
 */
export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    const where = isNaN(parsedId) ? { invoice_number: id } : { id: parsedId };

    const sale = await prisma.sale.findUnique({
      where,
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, image_url: true } },
            variant: { select: { id: true, sku: true, size: true, color: true } },
          },
        },
        staff: { select: { id: true, name: true, email: true } },
        payments: true,
      },
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'POS Sale not found' });
    }

    res.json(sale);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving POS sale', error: error.message });
  }
};

/**
 * POS Overview Statistics & Daily Register Analytics
 */
export const getPosStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaySales = await prisma.sale.findMany({
      where: { created_at: { gte: startOfToday }, status: 'COMPLETED' },
      include: { items: true },
    });

    let todayRevenue = 0;
    let todayCash = 0;
    let todayUpi = 0;
    let todayCard = 0;
    let totalItemsSold = 0;

    todaySales.forEach((s) => {
      const tot = Number(s.total);
      todayRevenue += tot;
      if (s.payment_method === 'cash') todayCash += tot;
      else if (s.payment_method === 'upi') todayUpi += tot;
      else if (s.payment_method === 'card') todayCard += tot;

      s.items.forEach(it => { totalItemsSold += it.quantity; });
    });

    const averageOrderValue = todaySales.length > 0 ? Math.round(todayRevenue / todaySales.length) : 0;
    const allSalesCount = await prisma.sale.count({ where: { status: 'COMPLETED' } });
    const allSalesAgg = await prisma.sale.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { total: true },
    });

    res.json({
      todaySalesCount: todaySales.length,
      todayRevenue,
      todayCash,
      todayUpi,
      todayCard,
      todayItemsSold: totalItemsSold,
      averageOrderValue,
      lifetimeSalesCount: allSalesCount,
      lifetimeRevenue: allSalesAgg._sum.total ? Number(allSalesAgg._sum.total) : 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching POS statistics', error: error.message });
  }
};

/**
 * Get live product catalog with variants and low-stock alerts
 */
export const getPosProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: {
          where: { is_active: true },
          orderBy: { size: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching POS products', error: error.message });
  }
};

/**
 * Rapid Barcode / SKU Scanner Lookup for POS Counter
 */
export const lookupBarcode = async (req, res) => {
  try {
    const { code } = req.params;
    const cleanCode = (code || '').trim();

    if (!cleanCode) {
      return res.status(400).json({ success: false, message: 'Barcode or SKU code is required.' });
    }

    const variant = await prisma.productVariant.findFirst({
      where: {
        is_active: true,
        OR: [
          { barcode: cleanCode },
          { sku: { equals: cleanCode, mode: 'insensitive' } },
        ],
      },
      include: {
        product: {
          select: { id: true, name: true, image_url: true, category_id: true },
        },
      },
    });

    if (!variant) {
      return res.status(404).json({ success: false, code: 'BARCODE_NOT_FOUND', message: `No active variant found for barcode "${cleanCode}".` });
    }

    const available = Math.max(0, variant.stock - variant.reserved_stock);

    res.json({
      success: true,
      variant: {
        id: variant.id,
        product_id: variant.product_id,
        product_name: variant.product?.name,
        product_image: variant.product?.image_url,
        sku: variant.sku,
        barcode: variant.barcode,
        size: variant.size,
        color: variant.color,
        price: Number(variant.price),
        stock: variant.stock,
        reserved_stock: variant.reserved_stock,
        available_stock: available,
        low_stock_threshold: variant.low_stock_alert,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error scanning barcode', error: error.message });
  }
};

/**
 * Generate & Stream POS Receipt PDF
 */
export const getPosInvoiceReceiptPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    const where = isNaN(parsedId) ? { invoice_number: id } : { id: parsedId };

    const sale = await prisma.sale.findUnique({
      where,
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        staff: true,
        payments: true,
      },
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'POS Sale not found.' });
    }

    // Dynamic import PDFDocument to generate clean thermal/A4 invoice
    const { default: PDFDocument } = await import('pdfkit');
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receipt-${sale.invoice_number}.pdf"`);

    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('SUKO ATELIER', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('HAUTE COUTURE & LUXURY APPAREL BOUTIQUE', { align: 'center' });
    doc.text('Store Receipt & Tax Invoice', { align: 'center' });
    doc.moveDown(1);

    // Metadata Row
    doc.fontSize(10).font('Helvetica-Bold').text(`Invoice #: ${sale.invoice_number}`, 40, doc.y);
    doc.font('Helvetica').text(`Date: ${new Date(sale.created_at).toLocaleString()}`);
    doc.text(`Cashier / Staff: ${sale.staff_name || 'Counter Staff'}`);
    doc.text(`Customer: ${sale.customer_name || 'Walk-in Customer'} ${sale.customer_phone ? `(${sale.customer_phone})` : ''}`);
    doc.moveDown(1);

    // Divider
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#c6a46a');
    doc.moveDown(0.5);

    // Table Header
    const tableTop = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Item / Description', 40, tableTop, { width: 220 });
    doc.text('Size', 260, tableTop, { width: 40 });
    doc.text('Qty', 305, tableTop, { width: 35 });
    doc.text('Rate (Rs)', 345, tableTop, { width: 65, align: 'right' });
    doc.text('Total (Rs)', 420, tableTop, { width: 75, align: 'right' });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e0e0e0');
    doc.moveDown(0.5);

    // Line items
    doc.font('Helvetica').fontSize(9);
    for (const it of sale.items) {
      const pName = it.product_name_snapshot || it.product?.name || 'Item';
      const itemY = doc.y;
      doc.text(`${pName} (${it.sku_snapshot || 'SKU'})`, 40, itemY, { width: 220 });
      doc.text(it.size || 'M', 260, itemY, { width: 40 });
      doc.text(String(it.quantity), 305, itemY, { width: 35 });
      doc.text(Number(it.price_at_sale).toFixed(2), 345, itemY, { width: 65, align: 'right' });
      doc.text(Number(it.total_price).toFixed(2), 420, itemY, { width: 75, align: 'right' });
      doc.moveDown(0.5);
    }

    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#c6a46a');
    doc.moveDown(0.8);

    // Summary Totals
    const summaryX = 320;
    doc.font('Helvetica').fontSize(10);
    doc.text(`Subtotal:`, summaryX, doc.y, { width: 100, align: 'right' });
    doc.text(`Rs. ${Number(sale.subtotal).toFixed(2)}`, 430, doc.y - 12, { width: 100, align: 'right' });

    if (Number(sale.discount) > 0) {
      doc.text(`Discount:`, summaryX, doc.y, { width: 100, align: 'right' });
      doc.text(`- Rs. ${Number(sale.discount).toFixed(2)}`, 430, doc.y - 12, { width: 100, align: 'right' });
    }

    if (Number(sale.tax) > 0) {
      doc.text(`Tax / GST:`, summaryX, doc.y, { width: 100, align: 'right' });
      doc.text(`Rs. ${Number(sale.tax).toFixed(2)}`, 430, doc.y - 12, { width: 100, align: 'right' });
    }

    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`Grand Total:`, summaryX, doc.y, { width: 100, align: 'right' });
    doc.text(`Rs. ${Number(sale.total).toFixed(2)}`, 430, doc.y - 14, { width: 100, align: 'right' });

    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(9);
    doc.text(`Payment Method: ${sale.payment_method.toUpperCase()}`, summaryX, doc.y, { width: 210, align: 'right' });

    if (sale.change_amount && Number(sale.change_amount) > 0) {
      doc.text(`Cash Tendered: Rs. ${Number(sale.amount_received).toFixed(2)} | Change: Rs. ${Number(sale.change_amount).toFixed(2)}`, summaryX, doc.y, { width: 210, align: 'right' });
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica-Oblique').text('Thank you for shopping at SUKO Atelier. For returns/exchanges, please bring this invoice within 7 days in original condition.', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('POS Invoice PDF Error:', error);
    res.status(500).json({ success: false, message: 'Error generating PDF invoice', error: error.message });
  }
};
