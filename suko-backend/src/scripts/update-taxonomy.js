require('dotenv').config({ path: './suko-backend/.env' });
const { pool } = require('../db');

async function run() {
  console.log('[Taxonomy Update] Updating Signature Pieces (4) and Power Suits & Sets (5)...');

  // 1. Signature Pieces (4)
  // 1. Midnight Sculpted Vest Set (w-02)
  // 2. Dusty Rose Embroidered Farchi Set (w-07)
  // 3. Plum Sculpted Set (w-10)
  // 4. Midnight Peplum Set (w-01)
  await pool.query(`
    UPDATE products 
    SET category_id = 'signatures', badge = 'Signature Piece' 
    WHERE id IN ('w-02', 'w-07', 'w-10', 'w-01')
  `);

  // 2. Power Suits & Sets (5)
  // 1. Noir Tailored Set (w-08)
  // 2. Aubergine Tailored Set (w-04)
  // 3. Noir Sculpted Vest Set (w-29)
  // 4. Aubergine Draped Set (w-03)
  // 5. Lilac Flare Set (w-05)
  await pool.query(`
    UPDATE products 
    SET category_id = 'suits', badge = NULL 
    WHERE id IN ('w-08', 'w-04', 'w-29', 'w-03', 'w-05')
  `);

  // 3. Archive w-30 (Noir Layered Vest Set) to avoid inflating suits / duplicate Noir vest
  await pool.query(`
    UPDATE products 
    SET status = 'archived', is_new_arrival = false 
    WHERE id = 'w-30'
  `);

  const sigs = await pool.query(`
    SELECT id, name, category_id, badge, status, is_new_arrival 
    FROM products 
    WHERE category_id = 'signatures' AND status = 'active'
    ORDER BY id ASC
  `);
  console.log(`\n✦ Signature Pieces (${sigs.rows.length})`);
  console.table(sigs.rows);

  const suits = await pool.query(`
    SELECT id, name, category_id, badge, status, is_new_arrival 
    FROM products 
    WHERE category_id = 'suits' AND status = 'active'
    ORDER BY id ASC
  `);
  console.log(`\n✦ Power Suits & Sets (${suits.rows.length})`);
  console.table(suits.rows);

  const newIns = await pool.query(`
    SELECT id, name, category_id, badge, status, is_new_arrival 
    FROM products 
    WHERE is_new_arrival = true AND status = 'active'
    ORDER BY id ASC
  `);
  console.log(`\n✦ Active New Arrivals (${newIns.rows.length})`);
  console.table(newIns.rows);

  process.exit(0);
}

run().catch(err => {
  console.error('Taxonomy update failed:', err);
  process.exit(1);
});
