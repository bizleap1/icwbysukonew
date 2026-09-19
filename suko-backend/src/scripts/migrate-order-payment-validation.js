const { pool } = require("../db");

async function migrate() {
  console.log("Applying manual UPI payment validation columns to orders table...");
  try {
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending_verification';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_duplicate_utr BOOLEAN DEFAULT false;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS duplicate_utr_order_id INTEGER;
      CREATE INDEX IF NOT EXISTS idx_orders_is_duplicate_utr ON orders(is_duplicate_utr);
      CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
    `);
    console.log("Migration successful: payment_status, is_duplicate_utr, duplicate_utr_order_id added.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
