const express = require("express");
const { requireAdmin } = require("../auth");
const productService = require("../services/productService");

const router = express.Router();

// GET /api/categories -- list all silhouette categories
router.get("/", async (req, res) => {
  try {
    const categories = await productService.getAllCategories();
    res.json(categories);
  } catch (err) {
    console.error("Fetch categories error:", err);
    res.status(500).json({ error: "Failed to load categories" });
  }
});

// POST /api/categories -- create category (Admin)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }
    const cat = await productService.createCategory(name.trim());
    res.status(201).json(cat);
  } catch (err) {
    console.error("Create category error:", err);
    res.status(500).json({ error: err.message || "Failed to create category" });
  }
});

// DELETE /api/categories/:id -- delete category (Admin)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const success = await productService.deleteCategory(req.params.id);
    if (!success) return res.status(404).json({ error: "Category not found" });
    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

module.exports = router;
