const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { requireAdmin } = require("../auth");
const productService = require("../services/productService");

const router = express.Router();

// Setup Multer for product photography
const uploadDir = path.join(__dirname, "..", "..", "uploads", "products");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per image
});

// GET /api/products -- list all products
router.get("/", async (req, res) => {
  try {
    const products = await productService.getAllProducts();
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

// POST /api/products/upload -- add new garment (Admin)
router.post(
  "/upload",
  requireAdmin,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      const { name, price, stock, description, category_id, sub_category, size_stock } = req.body;

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
        stock: Number(stock) || 10,
        description,
        category_id,
        sub_category,
        size_stock: parsedSizeStock,
        sizes: Object.keys(parsedSizeStock).length > 0 ? Object.keys(parsedSizeStock) : ["38", "40", "42", "44", "46"],
        image_url: imageUrl,
        images: images.length > 0 ? images : [imageUrl]
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

// PUT /api/products/:id -- update garment specs (Admin)
router.put(
  "/:id",
  requireAdmin,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      const { name, price, stock, description, category_id, sub_category, size_stock } = req.body;

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
      if (typeof stock !== "undefined") updateData.stock = Number(stock);
      if (description) updateData.description = description;
      if (category_id) updateData.category_id = category_id;
      if (sub_category) updateData.sub_category = sub_category;
      if (parsedSizeStock) {
        updateData.size_stock = parsedSizeStock;
        updateData.sizes = Object.keys(parsedSizeStock);
      }

      // Check if new images were uploaded
      const newImages = [];
      if (req.files?.image && req.files.image.length > 0) {
        newImages.push(`/uploads/products/${req.files.image[0].filename}`);
      }
      if (req.files?.images && req.files.images.length > 0) {
        req.files.images.forEach(f => newImages.push(`/uploads/products/${f.filename}`));
      }

      if (newImages.length > 0) {
        updateData.image_url = newImages[0];
        updateData.images = newImages;
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
  }
);

// DELETE /api/products/:id -- delete garment (Admin)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const success = await productService.deleteProduct(req.params.id);
    if (!success) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true, message: "Garment removed from atelier archive" });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
