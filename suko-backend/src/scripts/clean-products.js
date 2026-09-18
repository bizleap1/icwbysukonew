require("dotenv").config();
const { pool } = require("../db");
const fs = require("fs");
const path = require("path");

const FRONTEND_VALID_IDS = [
  "w-10",
  "w-27",
  "w-21",
  "w-01",
  "w-26",
  "w-25",
  "w-08",
  "w-28",
  "w-22",
  "w-05",
  "w-04",
  "w-02",
  "w-03",
  "w-07",
  "w-29"
];

async function cleanCatalog() {
  console.log("Cleaning catalog to strictly match the 15 frontend products...\n");

  // 1. Clean PostgreSQL Neon DB
  const allRes = await pool.query("SELECT id, name FROM products");
  const toDelete = allRes.rows.filter(p => !FRONTEND_VALID_IDS.includes(p.id));

  console.log(`Found ${toDelete.length} products to remove from PostgreSQL:`);
  for (const p of toDelete) {
    try {
      await pool.query("DELETE FROM cart_items WHERE product_id = $1", [p.id]);
    } catch (e) {}
    try {
      await pool.query("DELETE FROM order_items WHERE product_id = $1", [p.id]);
    } catch (e) {}
    try {
      await pool.query("DELETE FROM inventory_movements WHERE product_id = $1", [p.id]);
    } catch (e) {}
    try {
      await pool.query("DELETE FROM image_deletion_queue WHERE product_id = $1", [p.id]);
    } catch (e) {}
    await pool.query("DELETE FROM products WHERE id = $1", [p.id]);
    console.log(` - Purged: ${p.id} (${p.name})`);
  }

  const remainingDb = await pool.query("SELECT id, name, status FROM products ORDER BY id ASC");
  console.log(`\nRemaining products in Neon DB (${remainingDb.rows.length}):`);
  remainingDb.rows.forEach(r => console.log(`   ${r.id}: ${r.name}`));

  // 2. Clean dev-store.json if exists
  const devStorePath = path.join(__dirname, "..", "..", "data", "dev-store.json");
  if (fs.existsSync(devStorePath)) {
    const store = JSON.parse(fs.readFileSync(devStorePath, "utf8"));
    if (Array.isArray(store.products)) {
      store.products = store.products.filter(p => FRONTEND_VALID_IDS.includes(String(p.id)));
      fs.writeFileSync(devStorePath, JSON.stringify(store, null, 2), "utf8");
      console.log(`\nCleaned dev-store.json: now has ${store.products.length} products.`);
    }
  }

  console.log("\nCleanup completed successfully!");
}

cleanCatalog()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Cleanup error:", err);
    process.exit(1);
  });
