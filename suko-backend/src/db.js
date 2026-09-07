const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { devPool } = require("./dev-db");

let pool;

if (!process.env.DATABASE_URL) {
  console.warn("\n=======================================================");
  console.warn("ℹ️  NOTICE: DATABASE_URL not set in environment.");
  console.warn("⚡ Running SUKO Backend in Local Dev Mock Database Mode.");
  console.warn("👤 Admin Account Ready:");
  console.warn("   Email:    admin@indiancorporatewear.com");
  console.warn("   Password: Suko@vnpZUO6tE4");
  console.warn("=======================================================\n");
  pool = devPool;
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
  });

  pool.on("error", (err) => {
    console.error("Unexpected error on idle Postgres client", err);
  });
}

let initPromise = null;

async function initDatabase() {
  if (pool.isMock) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log("[Database] Checking and applying schema migrations to Postgres...");
      const schemaPath = path.join(__dirname, "schema.sql");
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, "utf-8");
        await pool.query(schemaSql);
        console.log("[Database] Schema verified / executed successfully.");
      }

      // Check if products need auto-seeding
      const { rows } = await pool.query("SELECT COUNT(*) FROM products");
      const count = parseInt(rows[0]?.count, 10) || 0;
      if (count === 0) {
        console.log("[Database] Products table empty in Postgres. Seeding initial atelier catalog...");
        const productService = require("./services/productService");
        const seed = productService.getSeedData();
        
        // Seed categories first
        for (const c of seed.categories) {
          await pool.query(
            `INSERT INTO categories (id, name, slug, tagline)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO NOTHING`,
            [c.slug, c.name, c.slug, c.tagline || `${c.name} Collection`]
          );
        }

        // Seed products
        for (const p of seed.products) {
          const catId = p.category || p.category_id || "suits";
          await pool.query(
            `INSERT INTO products (id, name, slug, price, discount_price, stock, category_id, sub_category, description, image_url, images, sizes, size_stock, status, sku, gender, fabric)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
        console.log(`[Database] Seeded ${seed.products.length} garments and ${seed.categories.length} categories.`);
      }
    } catch (err) {
      console.error("[Database] Migration initialization error:", err);
    }
  })();

  return initPromise;
}

// Auto-run if connected to Postgres
if (!pool.isMock) {
  initDatabase().catch(err => console.error("[Database] Background init failed:", err));
}

module.exports = { pool, initDatabase };
