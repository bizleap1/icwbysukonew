import { Router } from 'express';
import {
  createSale,
  getAllSales,
  getSaleById,
  getPosStats,
  getPosProducts,
  lookupBarcode,
  getPosInvoiceReceiptPdf,
} from '../controllers/pos.controller.js';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware.js';
import { getInventoryMovements, adjustStockManually } from '../services/inventory.service.js';

const router = Router();

// ─── ALL POS ROUTES REQUIRE AUTHENTICATION ───────────────────────────────────
router.use(authMiddleware);

// ─── POS CASHIER ROUTES ──────────────────────────────────────────────────────
// Roles: cashier, store_manager, admin, super_admin
const posRoles = authorizeRoles('cashier', 'store_manager', 'admin', 'super_admin');

router.post('/sales', posRoles, createSale);
router.get('/sales', posRoles, getAllSales);
router.get('/sales/:id', posRoles, getSaleById);
router.get('/sales/:id/receipt-pdf', posRoles, getPosInvoiceReceiptPdf);
router.get('/scan/:code', posRoles, lookupBarcode);
router.get('/barcode/:code', posRoles, lookupBarcode);
router.get('/stats', posRoles, getPosStats);
router.get('/products', posRoles, getPosProducts);

// ─── INVENTORY MANAGEMENT ROUTES ─────────────────────────────────────────────
// Roles: inventory_staff, store_manager, admin, super_admin
const inventoryRoles = authorizeRoles('inventory_staff', 'store_manager', 'admin');

router.get('/inventory-movements', inventoryRoles, async (req, res) => {
  try {
    const data = await getInventoryMovements(req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching inventory movements', error: error.message });
  }
});

router.post('/inventory-adjust', inventoryRoles, async (req, res) => {
  try {
    const { variant_id, product_id, quantity_delta, type, note } = req.body;

    if (!quantity_delta || isNaN(parseInt(quantity_delta))) {
      return res.status(400).json({ success: false, message: 'quantity_delta is required and must be a number' });
    }

    if (!note || note.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'A reason/note is required for stock adjustments' });
    }

    const result = await adjustStockManually({
      variant_id,
      product_id,
      quantity_delta,
      type,
      note,
      created_by: req.user?.name || req.user?.email || 'Admin',
    });
    res.json({ success: true, message: 'Stock adjusted successfully', result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Error adjusting stock' });
  }
});

export default router;
