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
      const productService = require("./services/productService");
      await productService.seedCatalog(false);
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
