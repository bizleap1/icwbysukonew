const fs = require("fs");
const path = require("path");
const { pool } = require("../db");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DEV_STORE_FILE = path.join(DATA_DIR, "dev-store.json");
const SEED_FILE = path.join(DATA_DIR, "seed-products.json");

// Helper to load seed products & categories
function getSeedData() {
  const candidatePaths = [
    SEED_FILE,
    path.join(__dirname, "..", "..", "data", "seed-products.json"),
    path.join(__dirname, "..", "data", "seed-products.json"),
    path.join(process.cwd(), "data", "seed-products.json"),
    path.join(process.cwd(), "suko-backend", "data", "seed-products.json")
  ];
  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        const data = JSON.parse(fs.readFileSync(candidate, "utf-8"));
        if (data && Array.isArray(data.products) && data.products.length > 0) {
          return data;
        }
      }
    } catch (err) {
      console.warn("[ProductService] Error reading candidate seed file:", candidate, err.message);
    }
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
      await seedCatalog(false);
      const seeded = await pool.query("SELECT * FROM products WHERE status != 'archived' ORDER BY created_at DESC");
      return seeded.rows;
    }
    return res.rows;
  } catch (err) {
    console.error("[ProductService] Postgres query error:", err.message);
    if (err.code === "42P01") {
      try {
        console.log("[ProductService] Missing relation detected. Running auto-initialization...");
        const { initDatabase } = require("../db");
        await initDatabase();
        const retryRes = await pool.query(query, params);
        return retryRes.rows;
      } catch (retryErr) {
        console.error("[ProductService] Auto-initialization retry failed:", retryErr.message);
      }
    }
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
      color: productData.color || "",
      secondary_color: productData.secondary_color || "",
      pattern: productData.pattern || "",
      finish: productData.finish || "",
      silhouette: productData.silhouette || "",
      fit: productData.fit || "",
      occasion: productData.occasion || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    store.products.unshift(newProduct);
    fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
    return newProduct;
  }

  // Real Postgres mode
  const res = await pool.query(
    `INSERT INTO products (id, name, slug, price, discount_price, stock, category_id, sub_category, description, image_url, images, sizes, size_stock, status, sku, gender, fabric, color, secondary_color, pattern, finish, silhouette, fit, occasion)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
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
      productData.fabric || "",
      productData.color || "",
      productData.secondary_color || "",
      productData.pattern || "",
      productData.finish || "",
      productData.silhouette || "",
      productData.fit || "",
      productData.occasion || ""
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
      fabric: updateData.fabric !== undefined ? updateData.fabric : current.fabric,
      color: updateData.color !== undefined ? updateData.color : current.color,
      secondary_color: updateData.secondary_color !== undefined ? updateData.secondary_color : current.secondary_color,
      pattern: updateData.pattern !== undefined ? updateData.pattern : current.pattern,
      finish: updateData.finish !== undefined ? updateData.finish : current.finish,
      silhouette: updateData.silhouette !== undefined ? updateData.silhouette : current.silhouette,
      fit: updateData.fit !== undefined ? updateData.fit : current.fit,
      occasion: updateData.occasion !== undefined ? updateData.occasion : current.occasion,
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
         fabric = COALESCE($10, fabric),
         color = COALESCE($11, color),
         secondary_color = COALESCE($12, secondary_color),
         pattern = COALESCE($13, pattern),
         finish = COALESCE($14, finish),
         silhouette = COALESCE($15, silhouette),
         fit = COALESCE($16, fit),
         occasion = COALESCE($17, occasion),
         image_url = COALESCE($18, image_url),
         images = COALESCE($19, images),
         sizes = COALESCE($20, sizes),
         updated_at = now()
     WHERE id = $21 OR slug = $21
     RETURNING *`,
    [
      updateData.name !== undefined ? updateData.name : null,
      updateData.price !== undefined && updateData.price !== null ? Number(updateData.price) : null,
      updateData.stock !== undefined && updateData.stock !== null ? Number(updateData.stock) : null,
      updateData.category_id !== undefined ? updateData.category_id : null,
      updateData.sub_category !== undefined ? updateData.sub_category : null,
      updateData.description !== undefined ? updateData.description : null,
      updateData.size_stock ? JSON.stringify(updateData.size_stock) : null,
      updateData.status !== undefined ? updateData.status : null,
      updateData.discount_price !== undefined && updateData.discount_price !== null ? Number(updateData.discount_price) : null,
      updateData.fabric !== undefined ? updateData.fabric : null,
      updateData.color !== undefined ? updateData.color : null,
      updateData.secondary_color !== undefined ? updateData.secondary_color : null,
      updateData.pattern !== undefined ? updateData.pattern : null,
      updateData.finish !== undefined ? updateData.finish : null,
      updateData.silhouette !== undefined ? updateData.silhouette : null,
      updateData.fit !== undefined ? updateData.fit : null,
      updateData.occasion !== undefined ? updateData.occasion : null,
      updateData.image_url !== undefined ? updateData.image_url : null,
      updateData.images ? JSON.stringify(updateData.images) : null,
      updateData.sizes ? JSON.stringify(updateData.sizes) : null,
      String(id)
    ]
  );
  return res.rows[0];
}

function cleanupOrphanedProductImages(imagePaths, excludedProductId, allProducts, orderItems = []) {
  try {
    const uploadDir = path.join(__dirname, "..", "..", "uploads", "products");
    if (!fs.existsSync(uploadDir)) return;

    const referencedImages = new Set();
    (allProducts || []).forEach(p => {
      if (String(p.id) !== String(excludedProductId)) {
        if (p.image_url) referencedImages.add(p.image_url);
        if (Array.isArray(p.images)) {
          p.images.forEach(img => referencedImages.add(img));
        }
      }
    });

    // Safeguard customer invoice receipts & order snapshots
    (orderItems || []).forEach(item => {
      if (item.product_image_url) {
        referencedImages.add(item.product_image_url);
      }
    });

    (imagePaths || []).forEach(img => {
      if (typeof img === "string" && img.includes("/uploads/products/") && !referencedImages.has(img)) {
        const filename = path.basename(img);
        const fullPath = path.join(uploadDir, filename);
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
            console.log(`[ProductService] Cleaned up orphaned product image: ${filename}`);
          } catch (e) {
            // ignore
          }
        }
      }
    });
  } catch (err) {
    console.warn("[ProductService] Image cleanup error:", err.message);
  }
}

async function checkProductDeletionEligibility(id) {
  const cleanId = String(id).trim();

  if (pool.isMock) {
    const store = ensureDevStoreProducts();
    const product = store.products.find(p => String(p.id) === cleanId || p.slug === cleanId);
    if (!product) return { exists: false };

    const matchingOrderItems = (store.order_items || []).filter(
      it => String(it.product_id) === String(product.id) || it.product_name === product.name
    );
    const orderCount = matchingOrderItems.length;
    const isArchived = (product.status || "").toLowerCase() === "archived";

    return {
      exists: true,
      product,
      hasOrders: orderCount > 0,
      orderCount,
      canPermanentlyDelete: true,
      isArchived,
      currentStatus: product.status || "active"
    };
  }

  // Real Postgres
  const pRes = await pool.query("SELECT * FROM products WHERE id = $1 OR slug = $1", [cleanId]);
  if (pRes.rows.length === 0) return { exists: false };
  const product = pRes.rows[0];

  const ordRes = await pool.query(
    "SELECT COUNT(*) FROM order_items WHERE product_id = $1 OR product_name = $2",
    [String(product.id), product.name]
  );
  const orderCount = parseInt(ordRes.rows[0].count, 10) || 0;
  const isArchived = (product.status || "").toLowerCase() === "archived";

  return {
    exists: true,
    product,
    hasOrders: orderCount > 0,
    orderCount,
    canPermanentlyDelete: true,
    isArchived,
    currentStatus: product.status || "active"
  };
}

async function deleteProduct(id, options = {}) {
  const { permanent = false, force = false } = options;
  const cleanId = String(id).trim();

  if (pool.isMock) {
    const store = ensureDevStoreProducts();
    const product = store.products.find(p => String(p.id) === cleanId || p.slug === cleanId);
    if (!product) return null;

    // Check if garment has historical orders
    const hasOrders = (store.order_items || []).some(
      it => String(it.product_id) === String(product.id) || it.product_name === product.name
    );
    const isArchived = (product.status || "").toLowerCase() === "archived";

    // 1. If permanent deletion is NOT requested: SAFE ARCHIVE
    if (!permanent) {
      product.status = "archived";
      product.updated_at = new Date().toISOString();
      fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
      return { 
        success: true, 
        archived: true, 
        hasOrders,
        message: hasOrders 
          ? "Garment safely archived (hidden from showroom, client order history & invoices preserved)" 
          : "Garment moved to atelier archive" 
      };
    }

    // 2. Permanent deletion requested:
    // If active/draft product has historical orders and neither force nor archived was specified, move to archive first
    if (hasOrders && !force && !isArchived) {
      product.status = "archived";
      product.updated_at = new Date().toISOString();
      fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");
      return { 
        success: true, 
        archived: true, 
        hasOrders,
        message: "Garment safely moved to archive because historical client orders exist. To permanently purge, confirm archive purge."
      };
    }

    // 3. Permanent hard delete from catalog:
    // Safe because order_items independently stores snapshot data (name, price_at_purchase, size, quantity, image)
    const allImages = [...(product.images || [])];
    if (product.image_url) allImages.push(product.image_url);

    store.products = store.products.filter(p => String(p.id) !== String(product.id));
    fs.writeFileSync(DEV_STORE_FILE, JSON.stringify(store, null, 2), "utf-8");

    // Clean up orphaned images from storage (preserving images used in remaining products or orders)
    cleanupOrphanedProductImages(allImages, product.id, store.products, store.order_items);

    return { 
      success: true, 
      archived: false, 
      hasOrders,
      message: hasOrders
        ? "Garment permanently purged from archive (client tax invoices and order histories safely preserved)"
        : "Garment and associated photo assets permanently removed from database"
    };
  }

  // Real Postgres mode
  const pRes = await pool.query("SELECT * FROM products WHERE id = $1 OR slug = $1", [cleanId]);
  if (pRes.rows.length === 0) return null;
  const product = pRes.rows[0];

  const checkOrders = await pool.query(
    "SELECT 1 FROM order_items WHERE product_id = $1 OR product_name = $2 LIMIT 1",
    [String(product.id), product.name]
  );
  const hasOrders = checkOrders.rows.length > 0;
  const isArchived = (product.status || "").toLowerCase() === "archived";

  if (!permanent) {
    await pool.query("UPDATE products SET status = 'archived', updated_at = now() WHERE id = $1", [product.id]);
    return { 
      success: true, 
      archived: true, 
      hasOrders,
      message: hasOrders 
        ? "Garment safely archived (hidden from showroom, client order history & invoices preserved)" 
        : "Garment moved to atelier archive" 
    };
  }

  if (hasOrders && !force && !isArchived) {
    await pool.query("UPDATE products SET status = 'archived', updated_at = now() WHERE id = $1", [product.id]);
    return { 
      success: true, 
      archived: true, 
      hasOrders,
      message: "Garment safely moved to archive because historical client orders exist. To permanently purge, confirm archive purge."
    };
  }

  const allImages = Array.isArray(product.images) ? [...product.images] : [];
  if (product.image_url) allImages.push(product.image_url);

  const res = await pool.query("DELETE FROM products WHERE id = $1 RETURNING id", [product.id]);

  // Clean up disk images, preserving any referenced in order_items
  const allProdsRes = await pool.query("SELECT id, image_url, images FROM products");
  const ordItemsRes = await pool.query("SELECT product_image_url FROM order_items WHERE product_image_url IS NOT NULL");
  cleanupOrphanedProductImages(allImages, product.id, allProdsRes.rows, ordItemsRes.rows);

  return { 
    success: res.rowCount > 0, 
    archived: false, 
    hasOrders,
    message: hasOrders
      ? "Garment permanently purged from archive (client tax invoices and order histories safely preserved)"
      : "Garment and associated photo assets permanently removed from database"
  };
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
    console.error("[ProductService] Categories query error:", err.message);
    if (err.code === "42P01") {
      try {
        const { initDatabase } = require("../db");
        await initDatabase();
        const retryRes = await pool.query("SELECT * FROM categories ORDER BY name ASC");
        return retryRes.rows;
      } catch (retryErr) {
        console.error("[ProductService] Auto-initialization retry for categories failed:", retryErr.message);
      }
    }
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

async function seedCatalog(force = false) {
  if (pool.isMock) {
    return ensureDevStoreProducts();
  }

  const { rows } = await pool.query("SELECT COUNT(*) FROM products");
  const count = parseInt(rows[0]?.count, 10) || 0;
  if (count > 0 && !force) {
    return { count, message: "Catalog already contains products" };
  }

  const seed = getSeedData();
  if (!seed.products || seed.products.length === 0) {
    console.warn("[ProductService] Seed catalog called but seed data contains 0 products!");
    return { count: 0, message: "No seed products found" };
  }

  // 1. Seed categories first to satisfy foreign key constraints
  if (Array.isArray(seed.categories)) {
    for (const c of seed.categories) {
      await pool.query(
        `INSERT INTO categories (id, name, slug, tagline)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, tagline = EXCLUDED.tagline`,
        [c.slug, c.name, c.slug, c.tagline || `${c.name} Collection`]
      );
    }
  }

  // 2. Seed products with all 17 column parameters
  let inserted = 0;
  for (const p of seed.products) {
    const catId = p.category || p.category_id || "suits";
    const res = await pool.query(
      `INSERT INTO products (id, name, slug, price, discount_price, stock, category_id, sub_category, description, image_url, images, sizes, size_stock, status, sku, gender, fabric)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
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
    if (res.rowCount > 0) inserted++;
  }

  console.log(`[ProductService] Seeded ${inserted} garments and ${seed.categories?.length || 0} categories.`);
  return { count: inserted, total: seed.products.length };
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  checkProductDeletionEligibility,
  getAllCategories,
  createCategory,
  deleteCategory,
  ensureDevStoreProducts,
  getSeedData,
  seedCatalog
};
