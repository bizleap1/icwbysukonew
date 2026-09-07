const fs = require("fs");
const path = require("path");
const { pool } = require("../db");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DEV_STORE_FILE = path.join(DATA_DIR, "dev-store.json");
const SEED_FILE = path.join(DATA_DIR, "seed-products.json");

// Helper to load seed products & categories
function getSeedData() {
  try {
    if (fs.existsSync(SEED_FILE)) {
      return JSON.parse(fs.readFileSync(SEED_FILE, "utf-8"));
    }
  } catch (err) {
    console.warn("[ProductService] Could not read seed file:", err.message);
  }
  return { products: [], categories: [] };
}

// Ensure dev store has products and categories initialized
function ensureDevStoreProducts() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let store = {};
    if (fs.existsSync(DEV_STORE_FILE)) {
      store = JSON.parse(fs.readFileSync(DEV_STORE_FILE, "utf-8"));
    }
    
    let modified = false;
    const seed = getSeedData();

    if (!Array.isArray(store.categories) || store.categories.length === 0) {
      store.categories = seed.categories.map((c, i) => ({
        id: c.slug || String(i + 1),
        name: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        tagline: c.tagline || `${c.name} Collection`
      }));
      modified = true;
    }

    if (!Array.isArray(store.products) || store.products.length === 0) {
      store.products = seed.products.map(p => {
        const catId = p.category || p.category_id || (p.categoryName ? p.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : "suits");
        const catObj = {
          id: catId,
          name: p.categoryName || (p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : "Collection"),
          slug: catId
        };
        const defaultSizes = p.sizes || ["38", "40", "42", "44", "46"];
        const initialSizeStock = p.size_stock || {};
        if (Object.keys(initialSizeStock).length === 0) {
          defaultSizes.forEach(sz => {
            initialSizeStock[sz] = Math.max(2, Math.floor((p.stock || 15) / defaultSizes.length));
          });
        }
        const totalStock = Object.values(initialSizeStock).reduce((a, b) => a + Number(b), 0) || p.stock || 15;

        return {
          id: String(p.id),
          name: p.name,
          slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          price: Number(p.price) || 0,
          stock: totalStock,
          category_id: catId,
          category: catObj,
          sub_category: p.sub_category || p.shortType || p.setType || p.subCategory || "Atelier Silhouette",
          description: p.description || "",
          image_url: p.images?.[0] || p.image || p.image_url || "/placeholder.png",
          images: p.images || (p.image_url ? [p.image_url] : []),
          sizes: defaultSizes,
          size_stock: initialSizeStock,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
      console.log(`[ProductService] Initialized dev store with ${store.products.length} products and ${store.categories.length} categories.`);
    }

    return store;
  } catch (err) {
    console.error("[ProductService] Error in ensureDevStoreProducts:", err);
    return { products: [], categories: [] };
  }
}

async function getAllProducts(options = {}) {
  const { status, category, includeArchived = false } = options;

  if (pool.isMock) {
    const store = ensureDevStoreProducts();
    let list = [...(store.products || [])];

    // Status filtering
    if (status && status !== "all") {
      list = list.filter(p => (p.status || "active") === status);
    } else if (!includeArchived && status !== "all") {
      // By default, exclude archived items from storefront
      list = list.filter(p => (p.status || "active") !== "archived");
    }

    // Category filtering
    if (category && category !== "all") {
      const catClean = category.toLowerCase().trim();
      list = list.filter(p => 
        (p.category_id && p.category_id.toLowerCase() === catClean) ||
        (p.category?.slug && p.category.slug.toLowerCase() === catClean) ||
        (p.category?.id && p.category.id.toLowerCase() === catClean)
      );
    }

    return list;
  }

  // Real Postgres mode
  try {
    let query = "SELECT * FROM products";
    const conditions = [];
    const params = [];

    if (status && status !== "all") {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    } else if (!includeArchived && status !== "all") {
      conditions.push(`status != 'archived'`);
    }

    if (category && category !== "all") {
      params.push(category);
      conditions.push(`(category_id = $${params.length} OR slug = $${params.length})`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC";

    const res = await pool.query(query, params);
    if (res.rows.length === 0 && !status && !category) {
      // Auto-seed Postgres if empty
      const seed = getSeedData();
      for (const p of seed.products) {
        const catId = p.category || p.category_id || "suits";
        await pool.query(
          `INSERT INTO products (id, name, slug, price, discount_price, stock, category_id, sub_category, description, image_url, images, sizes, size_stock, status, sku, gender, fabric)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           ON CONFLICT (id) DO NOTHING`,
          [
            String(p.id),
            p.name,
            p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            p.price || 0,
            p.discount_price || null,
            p.stock || 15,
            catId,
            p.sub_category || p.shortType || "Atelier Silhouette",
            p.description || "",
            p.images?.[0] || "/placeholder.png",
            JSON.stringify(p.images || []),
            JSON.stringify(p.sizes || []),
            JSON.stringify(p.size_stock || {}),
            p.status || "active",
            p.sku || `SKU-${p.id}`,
            p.gender || "female",
            p.fabric || ""
          ]
        );
      }
      const seeded = await pool.query("SELECT * FROM products WHERE status != 'archived' ORDER BY created_at DESC");
      return seeded.rows;
    }
    return res.rows;
  } catch (err) {
    console.error("[ProductService] Postgres query error:", err);
    const store = ensureDevStoreProducts();
    return store.products || [];
  }
}

async function getProductById(id) {
  if (!id) return null;
  const cleanId = String(id).trim();
  const products = await getAllProducts({ includeArchived: true });
  return products.find(p => String(p.id) === cleanId || p.slug === cleanId || p.slug === cleanId.toLowerCase());
}

async function createProduct(productData) {
  const newId = productData.id || `suko-${Date.now().toString(36)}`;
  const slug = productData.slug || (
    productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${newId.slice(-4)}`
  );

  const price = Number(productData.price) || 0;
  const discountPrice = productData.discount_price ? Number(productData.discount_price) : null;
  const stock = typeof productData.stock !== "undefined" ? Number(productData.stock) : 10;
  const status = productData.status || "active";
  const sizes = Array.isArray(productData.sizes) && productData.sizes.length > 0 
    ? productData.sizes 
    : ["XS", "S", "M", "L", "XL"];
  const sizeStock = productData.size_stock || {};
  const images = Array.isArray(productData.images) && productData.images.length > 0 
    ? productData.images 
    : (productData.image_url ? [productData.image_url] : ["/placeholder.png"]);
  const imageUrl = productData.image_url || images[0] || "/placeholder.png";

  if (pool.isMock) {
    const store = ensureDevStoreProducts();
    const cat = (store.categories || []).find(c => c.id === productData.category_id || c.slug === productData.category_id) || {
      id: productData.category_id || "suits",
      name: productData.category_id || "Collection",
      slug: productData.category_id || "suits"
    };

    const newProduct = {
      id: newId,
      name: productData.name,
      slug,
      price,
      discount_price: discountPrice,
      stock,
      category_id: productData.category_id || cat.id,
      category: cat,
      sub_category: productData.sub_category || "Atelier Silhouette",
      description: productData.description || "",
      image_url: imageUrl,
      images,
      sizes,
      size_stock: sizeStock,
      status,
      sku: productData.sku || `SUKO-${newId.toUpperCase()}`,
      gender: productData.gender || "female",
      fabric: productData.fabric || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    store.products.unshift(newProduct);
    fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
    return newProduct;
  }

  // Real Postgres mode
  const res = await pool.query(
    `INSERT INTO products (id, name, slug, price, discount_price, stock, category_id, sub_category, description, image_url, images, sizes, size_stock, status, sku, gender, fabric)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     RETURNING *`,
    [
      newId,
      productData.name,
      slug,
      price,
      discountPrice,
      stock,
      productData.category_id || "suits",
      productData.sub_category || "Atelier Silhouette",
      productData.description || "",
      imageUrl,
      JSON.stringify(images),
      JSON.stringify(sizes),
      JSON.stringify(sizeStock),
      status,
      productData.sku || `SUKO-${newId.toUpperCase()}`,
      productData.gender || "female",
      productData.fabric || ""
    ]
  );
  return res.rows[0];
}

async function updateProduct(id, updateData) {
  if (pool.isMock) {
    const store = ensureDevStoreProducts();
    const idx = store.products.findIndex(p => String(p.id) === String(id) || p.slug === String(id));
    if (idx === -1) return null;

    const current = store.products[idx];
    const cat = updateData.category_id 
      ? (store.categories || []).find(c => c.id === updateData.category_id || c.slug === updateData.category_id) || current.category
      : current.category;

    const updated = {
      ...current,
      ...updateData,
      id: current.id,
      category: cat,
      price: typeof updateData.price !== "undefined" ? Number(updateData.price) : current.price,
      discount_price: typeof updateData.discount_price !== "undefined" ? Number(updateData.discount_price) : current.discount_price,
      stock: typeof updateData.stock !== "undefined" ? Number(updateData.stock) : current.stock,
      status: updateData.status || current.status || "active",
      updated_at: new Date().toISOString()
    };

    store.products[idx] = updated;
    fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
    return updated;
  }

  // Real Postgres mode
  const res = await pool.query(
    `UPDATE products
     SET name = COALESCE($1, name),
         price = COALESCE($2, price),
         stock = COALESCE($3, stock),
         category_id = COALESCE($4, category_id),
         sub_category = COALESCE($5, sub_category),
         description = COALESCE($6, description),
         size_stock = COALESCE($7, size_stock),
         status = COALESCE($8, status),
         discount_price = COALESCE($9, discount_price),
         updated_at = now()
     WHERE id = $10 OR slug = $10
     RETURNING *`,
    [
      updateData.name,
      updateData.price ? Number(updateData.price) : null,
      updateData.stock ? Number(updateData.stock) : null,
      updateData.category_id,
      updateData.sub_category,
      updateData.description,
      updateData.size_stock ? JSON.stringify(updateData.size_stock) : null,
      updateData.status,
      updateData.discount_price ? Number(updateData.discount_price) : null,
      String(id)
    ]
  );
  return res.rows[0];
}

async function deleteProduct(id, options = {}) {
  const { permanent = false } = options;
  const cleanId = String(id).trim();

  if (pool.isMock) {
    const store = ensureDevStoreProducts();
    const product = store.products.find(p => String(p.id) === cleanId || p.slug === cleanId);
    if (!product) return null;

    // Check if garment has historical orders
    const hasOrders = (store.order_items || []).some(
      it => String(it.product_id) === String(product.id) || it.product_name === product.name
    );

    // If product has been purchased or permanent deletion is not explicitly requested: SAFE ARCHIVE
    if (hasOrders || !permanent) {
      product.status = "archived";
      product.updated_at = new Date().toISOString();
      fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
      return { 
        success: true, 
        archived: true, 
        message: hasOrders 
          ? "Garment safely archived (hidden from showroom, order history preserved)" 
          : "Garment moved to archive" 
      };
    }

    // Permanent hard delete only when unreferenced and explicitly requested
    store.products = store.products.filter(p => String(p.id) !== String(product.id));
    fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
    return { success: true, archived: false, message: "Garment permanently removed from database" };
  }

  // Real Postgres mode
  const checkOrders = await pool.query("SELECT 1 FROM order_items WHERE product_id = $1 LIMIT 1", [cleanId]);
  const hasOrders = checkOrders.rows.length > 0;

  if (hasOrders || !permanent) {
    await pool.query("UPDATE products SET status = 'archived', updated_at = now() WHERE id = $1 OR slug = $1", [cleanId]);
    return { 
      success: true, 
      archived: true, 
      message: hasOrders 
        ? "Garment safely archived (hidden from showroom, order history preserved)" 
        : "Garment moved to archive" 
    };
  }

  const res = await pool.query("DELETE FROM products WHERE id = $1 OR slug = $1 RETURNING id", [cleanId]);
  return { success: res.rowCount > 0, archived: false, message: "Garment permanently removed from database" };
}

async function getAllCategories() {
  if (pool.isMock) {
    const store = ensureDevStoreProducts();
    return store.categories || [];
  }

  try {
    const res = await pool.query("SELECT * FROM categories ORDER BY name ASC");
    if (res.rows.length === 0) {
      const seed = getSeedData();
      for (const c of seed.categories) {
        await pool.query(
          `INSERT INTO categories (id, name, slug, tagline)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [c.slug, c.name, c.slug, c.tagline || `${c.name} Collection`]
        );
      }
      const seeded = await pool.query("SELECT * FROM categories ORDER BY name ASC");
      return seeded.rows;
    }
    return res.rows;
  } catch (err) {
    const store = ensureDevStoreProducts();
    return store.categories || [];
  }
}

async function createCategory(name) {
  const cleanName = (name || "").trim();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const id = slug || `cat-${Date.now()}`;

  if (pool.isMock) {
    const store = ensureDevStoreProducts();
    const existing = store.categories.find(c => c.name.toLowerCase() === cleanName.toLowerCase() || c.slug === slug);
    if (existing) return existing;

    const newCat = {
      id,
      name: cleanName,
      slug,
      tagline: `${cleanName} Collection`
    };
    store.categories.push(newCat);
    fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
    return newCat;
  }

  // Real Postgres mode
  const res = await pool.query(
    `INSERT INTO categories (id, name, slug, tagline)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    [id, cleanName, slug, `${cleanName} Collection`]
  );
  return res.rows[0];
}

async function deleteCategory(id) {
  if (pool.isMock) {
    const store = ensureDevStoreProducts();
    const prevCount = store.categories.length;
    store.categories = store.categories.filter(c => String(c.id) !== String(id) && c.slug !== String(id));
    fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
    return store.categories.length < prevCount;
  }

  const res = await pool.query("DELETE FROM categories WHERE id = $1 OR slug = $1 RETURNING id", [String(id)]);
  return res.rowCount > 0;
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllCategories,
  createCategory,
  deleteCategory,
  ensureDevStoreProducts
};
