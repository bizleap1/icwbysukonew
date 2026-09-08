const express = require("express");
const path = require("path");
const fs = require("fs");
let multer;
try {
  multer = require("multer");
} catch (e) {
  console.warn("[Products] multer not available, falling back to passthrough middleware");
  multer = null;
}
const { requireAdmin } = require("../auth");
const productService = require("../services/productService");

const router = express.Router();

// Setup Multer for product photography
const uploadDir = path.join(__dirname, "..", "..", "uploads", "products");
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    // ignore
  }
}

let upload;
if (multer) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, `garment-${uniqueSuffix}${ext}`);
    }
  });

  upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per image
  });
} else {
  upload = {
    fields: () => (req, res, next) => next(),
    single: () => (req, res, next) => next(),
    array: () => (req, res, next) => next()
  };
}

// GET /api/products -- list all products
router.get("/", async (req, res) => {
  try {
    const { status, category, includeArchived } = req.query;
    let products = await productService.getAllProducts({
      status,
      category,
      includeArchived: includeArchived === "true" || status === "all"
    });

    // If database has 0 products, auto-initialize and seed
    if (products.length === 0 && !status && !category) {
      try {
        const { initDatabase } = require("../db");
        await initDatabase();
        products = await productService.getAllProducts({
          status,
          category,
          includeArchived: includeArchived === "true" || status === "all"
        });
      } catch (seedErr) {
        console.warn("[Products] Auto-seed fallback error:", seedErr.message);
      }
    }

    res.json(products);
  } catch (err) {
    console.error("Fetch products error:", err);
    res.status(500).json({ error: "Failed to load products" });
  }
});

// POST /api/products/seed -- trigger catalog verification and seeding
router.post("/seed", async (req, res) => {
  try {
    const { initDatabase } = require("../db");
    await initDatabase();
    const seedResult = await productService.seedCatalog(req.query.force === "true");
    const products = await productService.getAllProducts({ includeArchived: true });
    res.json({ success: true, count: products.length, seedResult, products });
  } catch (err) {
    console.error("Seed error:", err);
    res.status(500).json({ error: err.message || "Failed to seed products" });
  }
});

// GET /api/products/activity-logs -- recent catalog activity logs (Admin)
router.get("/activity-logs", requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const logs = await productService.getActivityLogs(limit);
    res.json(logs);
  } catch (err) {
    console.error("Fetch activity logs error:", err);
    res.status(500).json({ error: "Failed to load activity logs" });
  }
});

// GET /api/products/inventory-history -- inventory movements (Admin)
router.get("/inventory-history", requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const productId = req.query.productId;
    const history = await productService.getInventoryHistory(productId, limit);
    res.json(history);
  } catch (err) {
    console.error("Fetch inventory history error:", err);
    res.status(500).json({ error: "Failed to load inventory history" });
  }
});

// POST /api/products/bulk-update -- strict partial bulk update (Admin)
router.post("/bulk-update", requireAdmin, async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No garment IDs provided for bulk update" });
    }
    const result = await productService.bulkUpdateProducts(ids, updates, req.user?.email);
    res.json({
      success: true,
      message: `Successfully updated ${result.count} garments`,
      count: result.count,
      products: result.products
    });
  } catch (err) {
    console.error("Bulk update error:", err);
    res.status(500).json({ error: err.message || "Failed to bulk update garments" });
  }
});

// POST /api/products/bulk-inventory -- 3-mode inventory batch update (Admin)
router.post("/bulk-inventory", requireAdmin, async (req, res) => {
  try {
    const { ids, mode, size_stock, delta, commonQty, reason } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No garment IDs provided for inventory update" });
    }
    const result = await productService.bulkInventoryUpdate(ids, { mode, size_stock, delta, commonQty, reason }, req.user?.email);
    res.json({
      success: true,
      message: `Inventory updated across ${result.count} garments`,
      count: result.count,
      products: result.products
    });
  } catch (err) {
    console.error("Bulk inventory error:", err);
    res.status(500).json({ error: err.message || "Failed to update inventory" });
  }
});

// POST /api/products/bulk-archive -- soft delete to archive (Admin)
router.post("/bulk-archive", requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No garment IDs provided for archival" });
    }
    const result = await productService.bulkArchiveProducts(ids, req.user?.email);
    res.json({
      success: true,
      message: `${result.count} garments moved to Private Archive`,
      count: result.count,
      archivedIds: result.archivedIds
    });
  } catch (err) {
    console.error("Bulk archive error:", err);
    res.status(500).json({ error: err.message || "Failed to archive garments" });
  }
});

// POST /api/products/bulk-restore -- restore from archive to showroom (Admin)
router.post("/bulk-restore", requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No garment IDs provided for restoration" });
    }
    const result = await productService.bulkRestoreProducts(ids, req.user?.email);
    res.json({
      success: true,
      message: `${result.count} garments restored to showroom`,
      count: result.count,
      restoredIds: result.restoredIds
    });
  } catch (err) {
    console.error("Bulk restore error:", err);
    res.status(500).json({ error: err.message || "Failed to restore garments" });
  }
});

// POST /api/products/bulk-move -- move to collection (Admin)
router.post("/bulk-move", requireAdmin, async (req, res) => {
  try {
    const { ids, category_id } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !category_id) {
      return res.status(400).json({ error: "Garment IDs and target collection are required" });
    }
    const result = await productService.bulkMoveProducts(ids, category_id, req.user?.email);
    res.json({
      success: true,
      message: `${result.count} garments moved to collection`,
      count: result.count,
      movedIds: result.movedIds
    });
  } catch (err) {
    console.error("Bulk move error:", err);
    res.status(500).json({ error: err.message || "Failed to move garments" });
  }
});

// POST /api/products/bulk-delete -- permanent purge with bcrypt re-authentication (Admin)
router.post("/bulk-delete", requireAdmin, async (req, res) => {
  try {
    const { ids, adminPassword, permanent, force } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No garment IDs provided for deletion" });
    }
    const result = await productService.bulkDeleteProducts(ids, { adminPassword, permanent, force }, req.user);
    res.json({
      success: true,
      message: permanent 
        ? `${result.deletedCount} garments permanently purged, ${result.archivedCount} safeguarded in archive`
        : `${result.archivedCount} garments archived`,
      archivedCount: result.archivedCount,
      deletedCount: result.deletedCount,
      details: result.details
    });
  } catch (err) {
    console.error("Bulk delete error:", err);
    const status = err.message && err.message.includes("re-authentication") ? 401 : 500;
    res.status(status).json({ error: err.message || "Failed to process bulk deletion" });
  }
});

// GET /api/products/:id -- single product
router.get("/:id", async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: "Garment not found" });
    res.json(product);
  } catch (err) {
    console.error("Fetch single product error:", err);
    res.status(500).json({ error: "Failed to load product" });
  }
});

// POST /api/products -- create garment via JSON payload (Admin)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || typeof price === "undefined") {
      return res.status(400).json({ error: "Garment name and price are required." });
    }

    const newProduct = await productService.createProduct(req.body);
    await productService.recordActivityLog({
      admin_email: req.user?.email || "admin@indiancorporatewear.com",
      action: "product_create",
      target_entity: "products",
      affected_count: 1,
      details: {
        product_id: newProduct.id,
        product_name: newProduct.name,
        sku: newProduct.sku,
        price: newProduct.price,
        stock: newProduct.stock,
        collection: newProduct.category?.name || "Suits"
      },
      summary: `Created new atelier silhouette "${newProduct.name}" (SKU: ${newProduct.sku})`,
      status: "success"
    });

    res.status(201).json({
      success: true,
      message: "Garment successfully registered in atelier archive",
      product: newProduct
    });
  } catch (err) {
    console.error("Create product JSON error:", err);
    res.status(500).json({ error: err.message || "Failed to create garment" });
  }
});

// POST /api/products/upload -- add new garment with multipart photos (Admin)
router.post(
  "/upload",
  requireAdmin,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      const { 
        name, 
        price, 
        discount_price, 
        stock, 
        description, 
        category_id, 
        sub_category, 
        size_stock, 
        status, 
        sku, 
        gender, 
        fabric,
        color,
        secondary_color,
        pattern,
        finish,
        silhouette,
        fit,
        occasion,
        seo_title,
        seo_description,
        seo_keywords,
        seo_schema
      } = req.body;

      if (!name || !price) {
        return res.status(400).json({ error: "Garment name and price are required." });
      }

      let parsedSizeStock = {};
      if (size_stock) {
        try {
          parsedSizeStock = typeof size_stock === "string" ? JSON.parse(size_stock) : size_stock;
        } catch (e) {
          parsedSizeStock = {};
        }
      }

      let parsedSeoSchema = undefined;
      if (seo_schema) {
        try {
          parsedSeoSchema = typeof seo_schema === "string" ? JSON.parse(seo_schema) : seo_schema;
        } catch (e) {
          parsedSeoSchema = {};
        }
      }

      // Collect uploaded files
      const images = [];
      if (req.files?.image && req.files.image.length > 0) {
        images.push(`/uploads/products/${req.files.image[0].filename}`);
      }
      if (req.files?.images && req.files.images.length > 0) {
        req.files.images.forEach(f => images.push(`/uploads/products/${f.filename}`));
      }

      const imageUrl = images[0] || req.body.image_url || "/placeholder.png";

      const newProduct = await productService.createProduct({
        name,
        price: Number(price),
        discount_price: discount_price ? Number(discount_price) : null,
        stock: typeof stock !== "undefined" ? Number(stock) : 10,
        description,
        category_id,
        sub_category,
        size_stock: parsedSizeStock,
        sizes: Object.keys(parsedSizeStock).length > 0 ? Object.keys(parsedSizeStock) : ["38", "40", "42", "44", "46"],
        image_url: imageUrl,
        images: images.length > 0 ? images : [imageUrl],
        status: status || "active",
        sku: sku || undefined,
        gender: gender || "female",
        fabric: fabric || "",
        color: color || "",
        secondary_color: secondary_color || "",
        pattern: pattern || "",
        finish: finish || "",
        silhouette: silhouette || "",
        fit: fit || "",
        occasion: occasion || "",
        seo_title: seo_title || undefined,
        seo_description: seo_description || undefined,
        seo_keywords: seo_keywords || undefined,
        seo_schema: parsedSeoSchema || undefined
      });

      res.status(201).json({
        success: true,
        message: "Garment successfully registered in atelier archive",
        product: newProduct
      });
    } catch (err) {
      console.error("Upload product error:", err);
      res.status(500).json({ error: err.message || "Failed to upload garment" });
    }
  }
);

// Flexible middleware to handle both multipart and JSON for PUT
const handleOptionalMultipart = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    return upload.fields([
      { name: "image", maxCount: 1 },
      { name: "images", maxCount: 10 }
    ])(req, res, next);
  }
  next();
};

// PUT /api/products/:id -- update garment specs (Admin)
router.put("/:id", requireAdmin, handleOptionalMultipart, async (req, res) => {
  try {
    const { 
      name, 
      price, 
      discount_price, 
      stock, 
      description, 
      category_id, 
      sub_category, 
      size_stock, 
      sizes,
      status,
      sku,
      gender,
      fabric,
      color,
      secondary_color,
      pattern,
      finish,
      silhouette,
      fit,
      occasion,
      existing_images,
      seo_title,
      seo_description,
      seo_keywords,
      seo_schema
    } = req.body;

    let parsedSizeStock = undefined;
    if (size_stock) {
      try {
        parsedSizeStock = typeof size_stock === "string" ? JSON.parse(size_stock) : size_stock;
      } catch (e) {
        // ignore
      }
    }

    let parsedSeoSchema = undefined;
    if (seo_schema) {
      try {
        parsedSeoSchema = typeof seo_schema === "string" ? JSON.parse(seo_schema) : seo_schema;
      } catch (e) {
        // ignore
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (typeof price !== "undefined") updateData.price = Number(price);
    if (typeof discount_price !== "undefined") updateData.discount_price = discount_price ? Number(discount_price) : null;
    if (typeof stock !== "undefined") updateData.stock = Number(stock);
    if (description !== undefined) updateData.description = description;
    if (category_id) updateData.category_id = category_id;
    if (sub_category) updateData.sub_category = sub_category;
    if (status) updateData.status = status;
    if (sku) updateData.sku = sku;
    if (gender) updateData.gender = gender;
    if (fabric !== undefined) updateData.fabric = fabric;
    if (color !== undefined) updateData.color = color;
    if (secondary_color !== undefined) updateData.secondary_color = secondary_color;
    if (pattern !== undefined) updateData.pattern = pattern;
    if (finish !== undefined) updateData.finish = finish;
    if (silhouette !== undefined) updateData.silhouette = silhouette;
    if (fit !== undefined) updateData.fit = fit;
    if (occasion !== undefined) updateData.occasion = occasion;
    if (seo_title !== undefined) updateData.seo_title = seo_title;
    if (seo_description !== undefined) updateData.seo_description = seo_description;
    if (seo_keywords !== undefined) updateData.seo_keywords = seo_keywords;
    if (parsedSeoSchema !== undefined) updateData.seo_schema = parsedSeoSchema;

    if (parsedSizeStock) {
      updateData.size_stock = parsedSizeStock;
      updateData.sizes = Object.keys(parsedSizeStock);
    } else if (Array.isArray(sizes)) {
      updateData.sizes = sizes;
    }

    // Check if new images were uploaded or existing images preserved
    let parsedExisting = [];
    if (existing_images) {
      try {
        parsedExisting = typeof existing_images === "string" ? JSON.parse(existing_images) : existing_images;
      } catch (e) {}
    }

    const newUploadedFiles = [];
    if (req.files?.image && req.files.image.length > 0) {
      newUploadedFiles.push(`/uploads/products/${req.files.image[0].filename}`);
    }
    if (req.files?.images && req.files.images.length > 0) {
      req.files.images.forEach(f => newUploadedFiles.push(`/uploads/products/${f.filename}`));
    }

    const combinedImages = [...parsedExisting, ...newUploadedFiles];
    if (combinedImages.length > 0) {
      updateData.images = combinedImages;
      updateData.image_url = combinedImages[0];
    } else if (req.body.image_url) {
      updateData.image_url = req.body.image_url;
    }

    const current = await productService.getProductById(req.params.id);
    const updated = await productService.updateProduct(req.params.id, updateData);
    if (!updated) return res.status(404).json({ error: "Product not found" });

    // Calculate diffs for audit trail
    if (current) {
      const changes = [];
      const before = {};
      const after = {};

      if (updateData.price !== undefined && Number(updateData.price) !== Number(current.price)) {
        changes.push({
          field: "price",
          label: "Price",
          before: `₹${Number(current.price).toLocaleString('en-IN')}`,
          after: `₹${Number(updateData.price).toLocaleString('en-IN')}`
        });
        before.price = current.price;
        after.price = updateData.price;
      }
      if (updateData.stock !== undefined && Number(updateData.stock) !== Number(current.stock)) {
        changes.push({
          field: "stock",
          label: "Stock",
          before: current.stock,
          after: updateData.stock
        });
        before.stock = current.stock;
        after.stock = updateData.stock;
      }
      if (updateData.status !== undefined && updateData.status !== current.status) {
        changes.push({
          field: "status",
          label: "Status",
          before: current.status,
          after: updateData.status
        });
        before.status = current.status;
        after.status = updateData.status;
      }
      if (updateData.name !== undefined && updateData.name !== current.name) {
        changes.push({
          field: "name",
          label: "Garment Name",
          before: current.name,
          after: updateData.name
        });
        before.name = current.name;
        after.name = updateData.name;
      }
      if (updateData.size_stock && typeof updateData.size_stock === 'object') {
        const curSizes = current.size_stock || {};
        const newSizes = updateData.size_stock || {};
        const sizeDiffs = [];
        ["XS", "S", "M", "L", "XL"].forEach(sz => {
          const b = Number(curSizes[sz]) || 0;
          const a = Number(newSizes[sz]) || 0;
          if (b !== a) sizeDiffs.push(`${sz}: ${b} → ${a}`);
        });
        if (sizeDiffs.length > 0) {
          changes.push({
            field: "size_stock",
            label: "Size-Wise Stock",
            before: curSizes,
            after: newSizes,
            diffText: sizeDiffs.join(", ")
          });
        }
      }

      let action = "product_edit";
      if (changes.some(c => c.field === "price") && changes.length === 1) {
        action = "price_update";
      } else if (changes.some(c => c.field === "stock" || c.field === "size_stock")) {
        action = "inventory_update";
      }

      const reason = req.body.reason || "Specification updated in Atelier CMS";
      await productService.recordActivityLog({
        admin_email: req.user?.email || "admin@indiancorporatewear.com",
        action,
        target_entity: "products",
        affected_count: 1,
        details: {
          product_id: updated.id,
          product_name: updated.name,
          sku: updated.sku,
          before,
          after,
          changes,
          reason
        },
        summary: changes.length > 0 
          ? `Updated "${updated.name}" (${changes.map(c => c.label).join(", ")}) · Reason: ${reason}` 
          : `Saved changes to "${updated.name}"`,
        status: "success"
      });
    }

    res.json({
      success: true,
      message: "Garment updated successfully",
      product: updated
    });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ error: err.message || "Failed to update product" });
  }
});

// GET /api/products/:id/delete-info -- inspect deletion eligibility & order dependencies (Admin)
router.get("/:id/delete-info", requireAdmin, async (req, res) => {
  try {
    const info = await productService.checkProductDeletionEligibility(req.params.id);
    if (!info.exists) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(info);
  } catch (err) {
    console.error("Check product deletion eligibility error:", err);
    res.status(500).json({ error: "Failed to inspect garment deletion status" });
  }
});

// POST /api/products/:id/restore -- restore archived garment back to active showroom (Admin)
router.post("/:id/restore", requireAdmin, async (req, res) => {
  try {
    const current = await productService.getProductById(req.params.id);
    const updated = await productService.updateProduct(req.params.id, { status: "active" });
    if (!updated) return res.status(404).json({ error: "Product not found" });

    await productService.recordActivityLog({
      admin_email: req.user?.email || "admin@indiancorporatewear.com",
      action: "product_restore",
      target_entity: "products",
      affected_count: 1,
      details: {
        product_id: updated.id,
        product_name: updated.name,
        sku: updated.sku,
        before: { status: current?.status || "archived" },
        after: { status: "active" }
      },
      summary: `Restored "${updated.name}" back to active public showroom`,
      status: "success"
    });

    res.json({
      success: true,
      message: "Garment restored to active showroom",
      product: updated
    });
  } catch (err) {
    console.error("Restore product error:", err);
    res.status(500).json({ error: "Failed to restore product" });
  }
});

// POST /api/products/:id/duplicate -- clone silhouette into new draft with unique SKU (Admin)
router.post("/:id/duplicate", requireAdmin, async (req, res) => {
  try {
    const duplicated = await productService.duplicateProduct(req.params.id, req.user?.email);
    res.status(201).json({
      success: true,
      message: `Garment duplicated as "${duplicated.name}" with SKU ${duplicated.sku}`,
      product: duplicated
    });
  } catch (err) {
    console.error("Duplicate product error:", err);
    res.status(500).json({ error: err.message || "Failed to duplicate garment" });
  }
});

// DELETE /api/products/:id -- safe delete/archive or permanently purge garment (Admin)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const permanent = req.query.permanent === "true";
    const force = req.query.force === "true";
    const current = await productService.getProductById(req.params.id);
    const result = await productService.deleteProduct(req.params.id, { permanent, force });
    if (!result) return res.status(404).json({ error: "Product not found" });

    await productService.recordActivityLog({
      admin_email: req.user?.email || "admin@indiancorporatewear.com",
      action: result.archived ? "product_archive" : "product_delete",
      target_entity: "products",
      affected_count: 1,
      details: {
        product_id: req.params.id,
        product_name: current?.name || "Garment",
        sku: current?.sku || "",
        status: result.archived ? "archived" : "deleted",
        reason: result.archived ? "Safeguarded to private archive due to order history" : "Permanently purged from catalogue"
      },
      summary: result.archived
        ? `Safely archived "${current?.name || req.params.id}" to Private Archive`
        : `Permanently purged "${current?.name || req.params.id}" from catalogue registry`,
      status: "success"
    });

    res.json({
      success: true,
      archived: result.archived,
      message: result.message || "Garment processed successfully"
    });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
