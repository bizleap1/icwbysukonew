/**
 * =========================================================================
 * SUKO ATELIER — VARIANT-LEVEL INVENTORY ADMIN CONTROLLER
 * Authoritative variant stock visibility, filters, adjustments, barcode handling
 * =========================================================================
 */

import prisma from '../prisma/client.js';
import { adjustStockManually, generateBarcodeForVariant, getInventoryMovements } from '../services/inventory.service.js';
import { logAdminAction } from '../services/audit.service.js';

/**
 * Get paginated variant-level inventory with comprehensive filtering and sorting
 */
export const getVariantInventory = async (req, res) => {
  try {
    const {
      search,
      category_id,
      size,
      color,
      stock_status,
      sort = 'recently_updated',
      page = 1,
      limit = 20,
    } = req.query;

    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * take;

    const where = {
      is_active: true,
    };

    // Filters
    if (size) {
      where.size = { equals: size, mode: 'insensitive' };
    }

    if (color) {
      where.color = { contains: color, mode: 'insensitive' };
    }

    if (category_id) {
      where.product = { category_id: parseInt(category_id, 10) };
    }

    // Search by product name, SKU, or barcode
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { sku: { contains: q, mode: 'insensitive' } },
        { barcode: { contains: q, mode: 'insensitive' } },
        { product: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Sorting
    let orderBy = { updated_at: 'desc' };
    if (sort === 'lowest_stock') {
      orderBy = { stock: 'asc' };
    } else if (sort === 'highest_stock') {
      orderBy = { stock: 'desc' };
    } else if (sort === 'recently_updated') {
      orderBy = { updated_at: 'desc' };
    } else if (sort === 'name') {
      orderBy = { product: { name: 'asc' } };
    }

    // Fetch all matching variants (with relations)
    const [rawTotal, variants] = await Promise.all([
      prisma.productVariant.count({ where }),
      prisma.productVariant.findMany({
        where,
        take,
        skip,
        orderBy,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image_url: true,
              images: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    // Compute live operational inventory statuses
    const formattedVariants = variants.map((v) => {
      const physicalStock = v.stock;
      const reservedStock = v.reserved_stock;
      const availableStock = Math.max(0, physicalStock - reservedStock);
      const lowStockThreshold = v.low_stock_alert ?? 2;

      let status = 'IN STOCK';
      if (physicalStock <= 0) {
        status = 'OUT OF STOCK';
      } else if (availableStock <= 0) {
        status = 'RESERVED / LIMITED AVAILABILITY';
      } else if (availableStock <= lowStockThreshold) {
        status = 'LOW STOCK';
      }

      const imgUrl = v.product?.image_url || (Array.isArray(v.product?.images) && v.product.images[0]) || null;

      return {
        id: v.id,
        product_id: v.product_id,
        product_name: v.product?.name || 'Unknown',
        product_image: imgUrl,
        category_name: v.product?.category?.name || 'Uncategorized',
        sku: v.sku,
        barcode: v.barcode,
        size: v.size,
        color: v.color || 'Default',
        price: Number(v.price),
        cost_price: Number(v.cost_price || 0),
        physical_stock: physicalStock,
        reserved_stock: reservedStock,
        available_stock: availableStock,
        low_stock_threshold: lowStockThreshold,
        status,
        last_updated: v.updated_at,
      };
    });

    // Optional post-filter by computed status if requested
    let finalItems = formattedVariants;
    if (stock_status) {
      const s = stock_status.toUpperCase();
      if (s === 'IN_STOCK' || s === 'IN STOCK') {
        finalItems = formattedVariants.filter(v => v.status === 'IN STOCK');
      } else if (s === 'LOW_STOCK' || s === 'LOW STOCK') {
        finalItems = formattedVariants.filter(v => v.status === 'LOW STOCK');
      } else if (s === 'OUT_OF_STOCK' || s === 'OUT OF STOCK') {
        finalItems = formattedVariants.filter(v => v.status === 'OUT OF STOCK' || v.status === 'RESERVED / LIMITED AVAILABILITY');
      }
    }

    res.json({
      success: true,
      total: rawTotal,
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: take,
      totalPages: Math.ceil(rawTotal / take),
      variants: finalItems,
    });
  } catch (error) {
    console.error('Inventory list error:', error);
    res.status(500).json({ success: false, message: 'Error fetching variant inventory', error: error.message });
  }
};

/**
 * Manual stock adjustment endpoint (RESTOCK, DAMAGE, LOST, STOCK_CORRECTION, MANUAL_ADJUSTMENT)
 */
export const adjustVariantStock = async (req, res) => {
  try {
    const { variant_id, product_id, quantity_delta, type, note } = req.body;

    if (!quantity_delta || isNaN(parseInt(quantity_delta, 10))) {
      return res.status(400).json({ success: false, message: 'Quantity delta is required and must be a non-zero integer.' });
    }

    if (!note || note.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'A specific reason/note is required for stock adjustments.' });
    }

    const actorName = req.user?.name || req.user?.email || 'Admin Staff';
    const actorEmail = req.user?.email || null;
    const actorId = req.user?.id || null;

    const result = await adjustStockManually({
      variant_id,
      product_id,
      quantity_delta,
      type: type || 'MANUAL_ADJUSTMENT',
      note: note.trim(),
      created_by: actorName,
      actor_id: actorId,
      actor_email: actorEmail,
    });

    res.json({
      success: true,
      message: `Stock adjusted successfully (${result.stockBefore} -> ${result.stockAfter})`,
      result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, code: error.code || 'ADJUST_ERROR', message: error.message });
  }
};

/**
 * Auto-generate barcodes for all active sellable variants missing a barcode
 */
export const autoGenerateMissingBarcodes = async (req, res) => {
  try {
    const variantsWithoutBarcode = await prisma.productVariant.findMany({
      where: {
        is_active: true,
        OR: [{ barcode: null }, { barcode: '' }],
      },
      select: { id: true, sku: true },
    });

    let generatedCount = 0;
    for (const v of variantsWithoutBarcode) {
      const code = generateBarcodeForVariant(v.id, v.sku);
      await prisma.productVariant.update({
        where: { id: v.id },
        data: { barcode: code },
      });
      generatedCount++;
    }

    await logAdminAction({
      actor_id: req.user?.id,
      actor_email: req.user?.email,
      action: 'barcodes.bulk_generated',
      entity: 'ProductVariant',
      metadata: { generatedCount },
    });

    res.json({
      success: true,
      message: `Generated unique barcodes for ${generatedCount} variants.`,
      generatedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating barcodes', error: error.message });
  }
};

/**
 * Manually update barcode or low stock threshold for a variant
 */
export const updateVariantBarcodeAndThreshold = async (req, res) => {
  try {
    const { id } = req.params;
    const { barcode, low_stock_alert, cost_price } = req.body;
    const variantId = parseInt(id, 10);

    const data = {};
    if (barcode !== undefined) {
      const cleanBarcode = barcode ? barcode.trim() : null;
      // Check uniqueness if not null
      if (cleanBarcode) {
        const existing = await prisma.productVariant.findFirst({
          where: { barcode: cleanBarcode, NOT: { id: variantId } },
        });
        if (existing) {
          return res.status(409).json({ success: false, message: `Barcode "${cleanBarcode}" is already assigned to SKU ${existing.sku}.` });
        }
      }
      data.barcode = cleanBarcode;
    }

    if (low_stock_alert !== undefined) {
      data.low_stock_alert = Math.max(0, parseInt(low_stock_alert, 10) || 2);
    }

    if (cost_price !== undefined) {
      data.cost_price = Math.max(0, Number(cost_price) || 0);
    }

    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data,
    });

    await logAdminAction({
      actor_id: req.user?.id,
      actor_email: req.user?.email,
      action: 'variant.updated',
      entity: 'ProductVariant',
      entity_id: updated.id,
      metadata: { sku: updated.sku, barcode: updated.barcode, low_stock_alert: updated.low_stock_alert },
    });

    res.json({ success: true, message: 'Variant inventory parameters updated', variant: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating variant', error: error.message });
  }
};

/**
 * Get inventory overview statistics (Low Stock, Out of Stock, Physical, Reserved)
 */
export const getInventorySummaryStats = async (req, res) => {
  try {
    const variants = await prisma.productVariant.findMany({
      where: { is_active: true },
      select: { stock: true, reserved_stock: true, low_stock_alert: true },
    });

    let totalPhysicalStock = 0;
    let totalReservedStock = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;
    let inStockCount = 0;

    for (const v of variants) {
      totalPhysicalStock += v.stock;
      totalReservedStock += v.reserved_stock;
      const available = Math.max(0, v.stock - v.reserved_stock);
      const threshold = v.low_stock_alert ?? 2;

      if (v.stock <= 0) {
        outOfStockCount++;
      } else if (available <= threshold) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    }

    res.json({
      success: true,
      totalVariants: variants.length,
      totalPhysicalStock,
      totalReservedStock,
      totalAvailableStock: Math.max(0, totalPhysicalStock - totalReservedStock),
      outOfStockCount,
      lowStockCount,
      inStockCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching inventory stats', error: error.message });
  }
};
