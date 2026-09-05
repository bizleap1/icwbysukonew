const { Pool } = require("pg");
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

module.exports = { pool };
