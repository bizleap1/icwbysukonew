require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log("Checking and sanitizing product sizes in PostgreSQL...");

  // Also ensure size_guide column exists
  await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS size_guide JSONB DEFAULT NULL;");
  console.log("Verified size_guide column exists.");

  const targets = [
    "the-noir-tailored-suit",
    "the-lilac-flare-suit",
    "the-plum-sculpted-suit",
    "the-aubergine-tailored-suit"
  ];

  for (const slug of targets) {
    const res = await pool.query("SELECT id, name, size_stock, sizes FROM products WHERE slug = $1", [slug]);
    if (res.rows.length > 0) {
      const row = res.rows[0];
      const s = typeof row.size_stock === "string" ? JSON.parse(row.size_stock) : (row.size_stock || {});
      const cleaned = {
        XS: Number(s.XS) || 3,
        S: Number(s.S) || 3,
        M: Number(s.M) || 3,
        L: Number(s.L) || 3,
        XL: Number(s.XL) || 3
      };
      const cleanSizes = ["XS", "S", "M", "L", "XL"];
      const totalUnits = Object.values(cleaned).reduce((a, b) => a + b, 0);

      await pool.query(
        "UPDATE products SET size_stock = $1, sizes = $2, stock = $3 WHERE slug = $4",
        [JSON.stringify(cleaned), JSON.stringify(cleanSizes), totalUnits, slug]
      );
      console.log(`✅ Cleaned ${slug}:`, cleaned, `(Total: ${totalUnits} units)`);
    }
  }

  // Also sanitize dev-store.json if it exists locally
  const fs = require("fs");
  const path = require("path");
  const devStorePath = path.join(__dirname, "..", "..", "..", "data", "dev-store.json");
  if (fs.existsSync(devStorePath)) {
    try {
      const store = JSON.parse(fs.readFileSync(devStorePath, "utf-8"));
      if (Array.isArray(store.products)) {
        store.products.forEach(p => {
          if (targets.includes(p.slug)) {
            p.size_stock = { XS: 3, S: 3, M: 3, L: 3, XL: 3 };
            p.sizes = ["XS", "S", "M", "L", "XL"];
            p.stock = 15;
          }
        });
        fs.writeFileSync(devStorePath, JSON.stringify(store, null, 2), "utf-8");
        console.log("✅ Cleaned dev-store.json products");
      }
    } catch (e) {
      console.warn("dev-store update skipped:", e.message);
    }
  }

  await pool.end();
  console.log("✨ Size sanitization complete!");
}

run().catch(err => {
  console.error("Migration error:", err);
  pool.end();
  process.exit(1);
});
