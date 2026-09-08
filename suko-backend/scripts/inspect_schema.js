require('dotenv').config();
const { pool } = require('../src/db');

async function check() {
  try {
    const pCols = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' ORDER BY ordinal_position"
    );
    console.log('PRODUCTS COLUMNS:');
    pCols.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`));

    const cCols = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'categories' ORDER BY ordinal_position"
    );
    console.log('CATEGORIES COLUMNS:');
    cCols.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

check();
