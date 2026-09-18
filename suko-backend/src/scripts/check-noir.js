require('dotenv').config();
const { pool } = require('../db');

async function check() {
  try {
    const res = await pool.query("SELECT * FROM products WHERE id = 'w-29' OR slug = 'noir-sculpted-vest-set'");
    console.log('Full product row in Neon DB:');
    console.log(JSON.stringify(res.rows[0], null, 2));

    // Also check what categories exist in DB
    const catRes = await pool.query("SELECT id, name, slug FROM categories");
    console.log('Categories in DB:');
    console.log(JSON.stringify(catRes.rows, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error querying DB:', err);
    process.exit(1);
  }
}

check();
