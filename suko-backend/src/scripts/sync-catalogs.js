const fs = require('fs');
const path = require('path');

const seedPath = path.resolve(__dirname, '../../data/seed-products.json');
const productsJsPath = path.resolve(__dirname, '../../../src/data/products.js');

const SIGNATURE_IDS = new Set(['w-02', 'w-07', 'w-10', 'w-01']);
const SUIT_IDS = new Set(['w-08', 'w-04', 'w-29', 'w-03', 'w-05']);

// 1. Update seed-products.json
if (fs.existsSync(seedPath)) {
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  seed.products.forEach(p => {
    if (SIGNATURE_IDS.has(p.id)) {
      p.category = 'signatures';
      p.categoryName = 'Signature Pieces';
      p.categoryLabel = 'SIGNATURE PIECES';
      p.badge = 'Signature Piece';
    } else if (SUIT_IDS.has(p.id)) {
      p.category = 'suits';
      p.categoryName = 'Power Suits & Sets';
      p.categoryLabel = 'POWER SUITS & SETS';
      p.badge = null;
    } else if (p.id === 'w-30') {
      p.status = 'archived';
      p.is_new_arrival = false;
    }
  });
  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf-8');
  console.log('[Sync] seed-products.json updated successfully.');
}

// 2. Update src/data/products.js
if (fs.existsSync(productsJsPath)) {
  let content = fs.readFileSync(productsJsPath, 'utf-8');

  // Update w-10 Plum Sculpted Set category
  content = content.replace(
    /("id":\s*"w-10"[\s\S]*?"category":\s*)"suits"/,
    '$1"signatures"'
  );
  content = content.replace(
    /("id":\s*"w-10"[\s\S]*?"categoryName":\s*)"Power Suits & Sets"/,
    '$1"Signature Pieces"'
  );
  content = content.replace(
    /("id":\s*"w-10"[\s\S]*?"categoryLabel":\s*)"POWER SUITS & SETS"/,
    '$1"SIGNATURE PIECES"'
  );

  // Update w-01 Midnight Peplum Set category
  content = content.replace(
    /("id":\s*"w-01"[\s\S]*?"category":\s*)"coords"/,
    '$1"signatures"'
  );
  content = content.replace(
    /("id":\s*"w-01"[\s\S]*?"categoryName":\s*)"[^"]+"/,
    '$1"Signature Pieces"'
  );
  content = content.replace(
    /("id":\s*"w-01"[\s\S]*?"categoryLabel":\s*)"[^"]+"/,
    '$1"SIGNATURE PIECES"'
  );

  // Update w-02 Midnight Sculpted Vest Set category
  content = content.replace(
    /("id":\s*"w-02"[\s\S]*?"category":\s*)"coords"/,
    '$1"signatures"'
  );
  content = content.replace(
    /("id":\s*"w-02"[\s\S]*?"categoryName":\s*)"[^"]+"/,
    '$1"Signature Pieces"'
  );
  content = content.replace(
    /("id":\s*"w-02"[\s\S]*?"categoryLabel":\s*)"[^"]+"/,
    '$1"SIGNATURE PIECES"'
  );

  // Update w-07 Dusty Rose Embroidered Farchi Set category
  content = content.replace(
    /("id":\s*"w-07"[\s\S]*?"category":\s*)"coords"/,
    '$1"signatures"'
  );
  content = content.replace(
    /("id":\s*"w-07"[\s\S]*?"categoryName":\s*)"[^"]+"/,
    '$1"Signature Pieces"'
  );
  content = content.replace(
    /("id":\s*"w-07"[\s\S]*?"categoryLabel":\s*)"[^"]+"/,
    '$1"SIGNATURE PIECES"'
  );

  fs.writeFileSync(productsJsPath, content, 'utf-8');
  console.log('[Sync] src/data/products.js updated successfully.');
}
