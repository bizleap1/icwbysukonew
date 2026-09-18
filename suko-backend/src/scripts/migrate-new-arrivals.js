require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const { pool } = require("../db");
const fs = require("fs");
const path = require("path");

async function migrate() {
  console.log("Applying is_new_arrival schema changes...");
  if (!pool.isMock) {
    await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN DEFAULT false;");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_products_is_new_arrival ON products(is_new_arrival);");
    console.log("Postgres column & index added/verified.");

    const flagshipSlugs = [
      "the-noir-tailored-suit",
      "the-plum-sculpted-suit",
      "the-aubergine-tailored-suit",
      "the-lilac-flare-suit",
      "noir-sculpted-vest-set",
      "the-midnight-peplum-set"
    ];

    const result = await pool.query(
      `UPDATE products 
       SET is_new_arrival = true 
       WHERE slug = ANY($1) OR id = 'w-29'
       RETURNING id, name, slug, is_new_arrival`,
      [flagshipSlugs]
    );
    console.log(`Updated ${result.rows.length} flagship products in Postgres:`, result.rows.map(r => `${r.name} (${r.slug})`));
  }

  const devStorePath = path.join(__dirname, "..", "..", "data", "dev-store.json");
  if (fs.existsSync(devStorePath)) {
    const store = JSON.parse(fs.readFileSync(devStorePath, "utf-8"));
    if (Array.isArray(store.products)) {
      const flagshipSlugs = [
        "the-noir-tailored-suit",
        "the-plum-sculpted-suit",
        "the-aubergine-tailored-suit",
        "the-lilac-flare-suit",
        "noir-sculpted-vest-set",
        "the-midnight-peplum-set"
      ];
      store.products.forEach(p => {
        p.is_new_arrival = flagshipSlugs.includes(p.slug) || p.id === "w-29" || Boolean(p.is_new_arrival);
      });
      fs.writeFileSync(devStorePath, JSON.stringify(store, null, 2), "utf-8");
      console.log("Updated dev-store.json products with is_new_arrival");
    }
  }

  const seedPath = path.join(__dirname, "..", "..", "data", "seed-products.json");
  if (fs.existsSync(seedPath)) {
    const seed = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
    if (Array.isArray(seed.products)) {
      const flagshipSlugs = [
        "the-noir-tailored-suit",
        "the-plum-sculpted-suit",
        "the-aubergine-tailored-suit",
        "the-lilac-flare-suit",
        "noir-sculpted-vest-set",
        "the-midnight-peplum-set"
      ];
      seed.products.forEach(p => {
        p.is_new_arrival = flagshipSlugs.includes(p.slug) || p.id === "w-29" || Boolean(p.is_new_arrival);
      });
      fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), "utf-8");
      console.log("Updated seed-products.json products with is_new_arrival");
    }
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
