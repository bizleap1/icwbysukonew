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
    const products = await productService.getAllProducts({
      status,
      category,
      includeArchived: includeArchived === "true" || status === "all"
    });
    res.json(products);
  } catch (err) {
    console.error("Fetch products error:", err);
    res.status(500).json({ error: "Failed to load products" });
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
        fabric 
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
        fabric: fabric || ""
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
      existing_images
    } = req.body;

    let parsedSizeStock = undefined;
    if (size_stock) {
      try {
        parsedSizeStock = typeof size_stock === "string" ? JSON.parse(size_stock) : size_stock;
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

    const updated = await productService.updateProduct(req.params.id, updateData);
    if (!updated) return res.status(404).json({ error: "Product not found" });

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
    const updated = await productService.updateProduct(req.params.id, { status: "active" });
    if (!updated) return res.status(404).json({ error: "Product not found" });

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

// DELETE /api/products/:id -- safe delete/archive or permanently purge garment (Admin)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const permanent = req.query.permanent === "true";
    const force = req.query.force === "true";
    const result = await productService.deleteProduct(req.params.id, { permanent, force });
    if (!result) return res.status(404).json({ error: "Product not found" });

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
