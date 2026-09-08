const express = require("express");
const { requireAdmin } = require("../auth");
const productService = require("../services/productService");

const router = express.Router();

// GET /api/categories -- list all collections (supports ?includeArchived=true)
router.get("/", async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === "true";
    const categories = await productService.getAllCategories({ includeArchived });
    res.json(categories);
  } catch (err) {
    console.error("Fetch categories error:", err);
    res.status(500).json({ error: "Failed to load categories" });
  }
});

// POST /api/categories -- create collection (Admin)
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, slug, tagline, description, cover_image_url, sort_order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Collection name is required" });
    }
    const cat = await productService.createCategory({
      name: name.trim(),
      slug: slug ? slug.trim() : undefined,
      tagline,
      description,
      cover_image_url,
      sort_order
    });

    await productService.recordActivityLog({
      admin_email: req.user?.email || "admin@indiancorporatewear.com",
      action: "collection_create",
      target_entity: "categories",
      affected_count: 1,
      details: {
        category_id: cat.id,
        category_name: cat.name,
        slug: cat.slug
      },
      summary: `Created new atelier collection "${cat.name}"`,
      status: "success"
    });

    res.status(201).json(cat);
  } catch (err) {
    console.error("Create category error:", err);
    res.status(500).json({ error: err.message || "Failed to create collection" });
  }
});

// PUT /api/categories/reorder -- reorder collections (Admin)
router.put("/reorder", requireAdmin, async (req, res) => {
  try {
    const { orderList } = req.body;
    if (!Array.isArray(orderList)) {
      return res.status(400).json({ error: "orderList must be an array of IDs or objects" });
    }
    await productService.reorderCategories(orderList);
    const updatedCategories = await productService.getAllCategories({ includeArchived: true });
    res.json({ success: true, message: "Collections successfully reordered", categories: updatedCategories });
  } catch (err) {
    console.error("Reorder categories error:", err);
    res.status(500).json({ error: err.message || "Failed to reorder collections" });
  }
});

// PUT /api/categories/:id -- update collection details (Admin)
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, tagline, description, cover_image_url, sort_order, is_archived } = req.body;

    const updated = await productService.updateCategory(id, {
      name,
      slug,
      tagline,
      description,
      cover_image_url,
      sort_order,
      is_archived
    });

    if (!updated) return res.status(404).json({ error: "Collection not found" });

    await productService.recordActivityLog({
      admin_email: req.user?.email || "admin@indiancorporatewear.com",
      action: "collection_edit",
      target_entity: "categories",
      affected_count: 1,
      details: {
        category_id: updated.id,
        category_name: updated.name,
        slug: updated.slug
      },
      summary: `Updated details for collection "${updated.name}"`,
      status: "success"
    });

    res.json({ success: true, message: "Collection updated successfully", category: updated });
  } catch (err) {
    console.error("Update category error:", err);
    res.status(500).json({ error: err.message || "Failed to update collection" });
  }
});

// PUT /api/categories/:id/archive -- archive / restore collection (Admin)
router.put("/:id/archive", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_archived = true } = req.body;

    const updated = await productService.archiveCategory(id, is_archived);
    if (!updated) return res.status(404).json({ error: "Collection not found" });

    await productService.recordActivityLog({
      admin_email: req.user?.email || "admin@indiancorporatewear.com",
      action: is_archived ? "collection_archive" : "collection_restore",
      target_entity: "categories",
      affected_count: 1,
      details: {
        category_id: updated.id,
        category_name: updated.name,
        is_archived
      },
      summary: is_archived ? `Moved collection "${updated.name}" to archive` : `Restored collection "${updated.name}" to active catalog`,
      status: "success"
    });

    res.json({
      success: true,
      message: is_archived ? "Collection moved to archive" : "Collection restored to active catalog",
      category: updated
    });
  } catch (err) {
    console.error("Archive category error:", err);
    res.status(500).json({ error: err.message || "Failed to toggle collection archive" });
  }
});

// GET /api/categories/:id/safety -- check if category has child garments before deletion (Admin)
router.get("/:id/safety", requireAdmin, async (req, res) => {
  try {
    const safety = await productService.checkCategoryDeletionSafety(req.params.id);
    res.json(safety);
  } catch (err) {
    console.error("Check category safety error:", err);
    res.status(500).json({ error: "Failed to verify collection safety" });
  }
});

// DELETE /api/categories/:id -- delete category with child protection (Admin)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { force, reassignTo, archiveGarments } = req.query;

    const safety = await productService.checkCategoryDeletionSafety(id);
    if (!safety.safe && force !== "true") {
      if (reassignTo) {
        // Reassign child garments to target collection
        const allProds = await productService.getAllProducts({ includeArchived: true });
        const childIds = allProds
          .filter(p => p.category_id === id || p.category?.slug === id || p.category?.id === id)
          .map(p => p.id);
        await productService.bulkMoveProducts(childIds, reassignTo, req.user?.email);
      } else if (archiveGarments === "true") {
        // Archive child garments
        const allProds = await productService.getAllProducts({ includeArchived: true });
        const childIds = allProds
          .filter(p => p.category_id === id || p.category?.slug === id || p.category?.id === id)
          .map(p => p.id);
        await productService.bulkArchiveProducts(childIds, req.user?.email);
      } else {
        return res.status(400).json({
          error: `Cannot delete collection containing ${safety.count} registered garments.`,
          count: safety.count,
          garmentNames: safety.garmentNames,
          requiresReassignment: true
        });
      }
    }

    const catInfo = (await productService.getAllCategories({ includeArchived: true })).find(c => c.id === id);
    const success = await productService.deleteCategory(id);
    if (!success) return res.status(404).json({ error: "Collection not found" });

    await productService.recordActivityLog({
      admin_email: req.user?.email || "admin@indiancorporatewear.com",
      action: "collection_delete",
      target_entity: "categories",
      affected_count: 1,
      details: {
        category_id: id,
        category_name: catInfo?.name || id
      },
      summary: `Deleted collection "${catInfo?.name || id}"`,
      status: "success"
    });

    res.json({ success: true, message: "Collection safely removed" });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

module.exports = router;
