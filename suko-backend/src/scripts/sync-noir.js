require('dotenv').config();
const { pool } = require('../db');
const fs = require('fs');
const path = require('path');

async function syncNoir() {
  console.log("=== Syncing Noir Sculpted Vest Set (w-29) in Database ===");

  const canonicalSizes = ["38", "40", "42", "44", "46"];
  const canonicalSizeStock = { "38": 5, "40": 5, "42": 5, "44": 5, "46": 5 };
  const totalStock = 25;

  const gallery = [
    { url: "/products/noir-sculpted-vest-set/1.png", type: "model_front" },
    { url: "/products/noir-sculpted-vest-set/2.png", type: "garment_front" },
    { url: "/products/noir-sculpted-vest-set/3.png", type: "garment_front" },
    { url: "/products/noir-sculpted-vest-set/4.png", type: "model_three_quarter" },
    { url: "/products/noir-sculpted-vest-set/5.png", type: "model_side" },
    { url: "/products/noir-sculpted-vest-set/6.png", type: "model_back" },
    { url: "/products/noir-sculpted-vest-set/7.png", type: "detail" }
  ];

  const images = [
    "/products/noir-sculpted-vest-set/1.png",
    "/products/noir-sculpted-vest-set/2.png",
    "/products/noir-sculpted-vest-set/3.png",
    "/products/noir-sculpted-vest-set/4.png",
    "/products/noir-sculpted-vest-set/5.png",
    "/products/noir-sculpted-vest-set/6.png",
    "/products/noir-sculpted-vest-set/7.png"
  ];

  const query = `
    INSERT INTO products (
      id, name, slug, category_id, sub_category, description, price, stock,
      status, sku, gender, fabric, image_url, images, sizes, size_stock,
      color, moment, moments, moment_name, gallery, updated_at
    ) VALUES (
      'w-29',
      'Noir Sculpted Vest Set',
      'noir-sculpted-vest-set',
      'suits',
      'Sculpted Vest & Tailored Trouser Set',
      'An architectural two-piece ensemble combining a precision-sculpted tailored vest with coordinated high-waist trousers in deep obsidian black. Designed with sculpted waistlines and structural seam detailing for commanding boardroom authority.',
      5945.00,
      $1,
      'active',
      'SKU-w-29',
      'female',
      'Premium Italian Suiting Crepe',
      '/products/noir-sculpted-vest-set/1.png',
      $2,
      $3,
      $4,
      'Obsidian Black',
      'essentials',
      '["essentials", "presentation", "founder"]',
      'Executive Essentials',
      $5,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      category_id = EXCLUDED.category_id,
      sub_category = EXCLUDED.sub_category,
      description = EXCLUDED.description,
      price = EXCLUDED.price,
      stock = EXCLUDED.stock,
      status = 'active',
      sizes = EXCLUDED.sizes,
      size_stock = EXCLUDED.size_stock,
      gallery = EXCLUDED.gallery,
      images = EXCLUDED.images,
      image_url = EXCLUDED.image_url,
      updated_at = NOW()
    RETURNING id, name, slug, status, stock, sizes, size_stock;
  `;

  const res = await pool.query(query, [
    totalStock,
    JSON.stringify(images),
    JSON.stringify(canonicalSizes),
    JSON.stringify(canonicalSizeStock),
    JSON.stringify(gallery)
  ]);

  console.log("Neon DB Result:", JSON.stringify(res.rows[0], null, 2));

  // Sync dev-store.json if exists
  const devStorePath = path.join(__dirname, "..", "..", "data", "dev-store.json");
  if (fs.existsSync(devStorePath)) {
    const store = JSON.parse(fs.readFileSync(devStorePath, "utf8"));
    if (Array.isArray(store.products)) {
      const idx = store.products.findIndex(p => p.id === 'w-29' || p.slug === 'noir-sculpted-vest-set');
      const pEntry = {
        id: 'w-29',
        name: 'Noir Sculpted Vest Set',
        slug: 'noir-sculpted-vest-set',
        category_id: 'suits',
        sub_category: 'Sculpted Vest & Tailored Trouser Set',
        price: 5945,
        stock: totalStock,
        sizes: canonicalSizes,
        size_stock: canonicalSizeStock,
        status: 'active',
        image_url: '/products/noir-sculpted-vest-set/1.png',
        images: images,
        gallery: gallery,
        color: 'Obsidian Black'
      };
      if (idx >= 0) {
        store.products[idx] = { ...store.products[idx], ...pEntry };
      } else {
        store.products.push(pEntry);
      }
      fs.writeFileSync(devStorePath, JSON.stringify(store, null, 2), "utf8");
      console.log("dev-store.json updated successfully.");
    }
  }

  console.log("✓ Done syncing Noir Sculpted Vest Set.");
  process.exit(0);
}

syncNoir().catch(err => {
  console.error("Error syncing:", err);
  process.exit(1);
});
