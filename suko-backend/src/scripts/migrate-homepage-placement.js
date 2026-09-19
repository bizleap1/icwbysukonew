require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const { pool } = require("../db");
const fs = require("fs");
const path = require("path");

async function migrate() {
  console.log("Starting homepage new arrivals placement migration...");

  try {
    if (!pool.isMock) {
      console.log("Applying columns to Neon PostgreSQL database...");
      await pool.query(`
        ALTER TABLE products ADD COLUMN IF NOT EXISTS show_on_homepage_new_arrivals BOOLEAN DEFAULT false;
        ALTER TABLE products ADD COLUMN IF NOT EXISTS homepage_new_arrival_position INTEGER;
        CREATE INDEX IF NOT EXISTS idx_products_show_on_homepage_new_arrivals ON products(show_on_homepage_new_arrivals);
        CREATE INDEX IF NOT EXISTS idx_products_homepage_new_arrival_position ON products(homepage_new_arrival_position);
      `);
      console.log("Columns and indexes applied to PostgreSQL.");

      // Check current products and seed positions 1-4
      const initialPlacements = [
        { slug: "the-plum-sculpted-suit", id: "w-10", pos: 1 },
        { slug: "the-aubergine-tailored-suit", id: "w-04", pos: 2 },
        { slug: "the-lilac-flare-suit", id: "w-05", pos: 3 },
        { slug: "noir-sculpted-vest-set", id: "w-29", pos: 4 }
      ];

      for (const item of initialPlacements) {
        await pool.query(
          `UPDATE products 
           SET show_on_homepage_new_arrivals = true, 
               homepage_new_arrival_position = $1
           WHERE slug = $2 OR id = $3`,
          [item.pos, item.slug, item.id]
        );
      }
      console.log("Seeded positions 1-4 in PostgreSQL database.");

      const check = await pool.query(
        `SELECT id, name, slug, show_on_homepage_new_arrivals, homepage_new_arrival_position 
         FROM products 
         WHERE show_on_homepage_new_arrivals = true 
         ORDER BY homepage_new_arrival_position ASC`
      );
      console.log("Current homepage new arrivals in DB:", check.rows);
    }

    // Also update dev-store.json & seed-products.json
    const dataDir = path.join(__dirname, "..", "..", "data");
    const devStorePath = path.join(dataDir, "dev-store.json");
    const seedPath = path.join(dataDir, "seed-products.json");

    const placementMap = {
      "the-plum-sculpted-suit": 1,
      "w-10": 1,
      "the-aubergine-tailored-suit": 2,
      "w-04": 2,
      "the-lilac-flare-suit": 3,
      "w-05": 3,
      "noir-sculpted-vest-set": 4,
      "w-29": 4
    };

    if (fs.existsSync(devStorePath)) {
      const devStore = JSON.parse(fs.readFileSync(devStorePath, "utf-8"));
      if (Array.isArray(devStore.products)) {
        devStore.products.forEach(p => {
          const pos = placementMap[p.slug] || placementMap[p.id];
          if (pos) {
            p.show_on_homepage_new_arrivals = true;
            p.homepage_new_arrival_position = pos;
          } else {
            p.show_on_homepage_new_arrivals = Boolean(p.show_on_homepage_new_arrivals || false);
            p.homepage_new_arrival_position = p.homepage_new_arrival_position || null;
          }
        });
        fs.writeFileSync(devStorePath, JSON.stringify(devStore, null, 2), "utf-8");
        console.log("Updated dev-store.json products with homepage placement attributes.");
      }
    }

    if (fs.existsSync(seedPath)) {
      const seedData = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
      if (Array.isArray(seedData.products)) {
        seedData.products.forEach(p => {
          const pos = placementMap[p.slug] || placementMap[p.id];
          if (pos) {
            p.show_on_homepage_new_arrivals = true;
            p.homepage_new_arrival_position = pos;
          } else {
            p.show_on_homepage_new_arrivals = Boolean(p.show_on_homepage_new_arrivals || false);
            p.homepage_new_arrival_position = p.homepage_new_arrival_position || null;
          }
        });
        fs.writeFileSync(seedPath, JSON.stringify(seedData, null, 2), "utf-8");
        console.log("Updated seed-products.json products with homepage placement attributes.");
      }
    }

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    if (pool && !pool.isMock) {
      await pool.end();
    }
  }
}

migrate();
