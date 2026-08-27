import { Router } from 'express';
import {
  getVariantInventory,
  adjustVariantStock,
  autoGenerateMissingBarcodes,
  updateVariantBarcodeAndThreshold,
  getInventorySummaryStats,
} from '../controllers/inventory.controller.js';
import { getInventoryMovements } from '../services/inventory.service.js';
import { authMiddleware, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// All inventory endpoints require authentication
router.use(authMiddleware);

// Roles allowed for inventory view and adjustments: inventory_staff, store_manager, admin, super_admin
const inventoryStaffRoles = authorizeRoles('inventory_staff', 'store_manager', 'admin', 'super_admin');
const inventoryManagerRoles = authorizeRoles('store_manager', 'admin', 'super_admin');

router.get('/', inventoryStaffRoles, getVariantInventory);
router.get('/stats', inventoryStaffRoles, getInventorySummaryStats);
router.get('/movements', inventoryStaffRoles, async (req, res) => {
  try {
    const data = await getInventoryMovements(req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching inventory movements', error: error.message });
  }
});
router.post('/adjust', inventoryStaffRoles, adjustVariantStock);
router.post('/barcodes/generate', inventoryManagerRoles, autoGenerateMissingBarcodes);
router.put('/variants/:id/barcode', inventoryManagerRoles, updateVariantBarcodeAndThreshold);

export default router;
