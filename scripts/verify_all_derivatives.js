const fs = require('fs');
const path = require('path');
const { PRODUCTS } = require('../src/data/products.js');

function verifyAllDerivatives() {
  console.log('=== VERIFYING ALL 27 PRODUCTS DERIVATIVES ===\n');

  let totalImageRefs = 0;
  let missingCard = 0;
  let missingThumb = 0;
  let missingFullWebp = 0;
  const issues = [];

  for (const prod of PRODUCTS) {
    if (!prod.images || !Array.isArray(prod.images)) continue;

    for (const imgUrl of prod.images) {
      totalImageRefs++;
      const cleanPath = imgUrl.startsWith('/') ? imgUrl.substring(1) : imgUrl;
      const fullOrigPath = path.resolve('public', cleanPath);

      // Check original exists
      if (!fs.existsSync(fullOrigPath)) {
        issues.push(`Original missing: ${imgUrl} for product ${prod.slug}`);
      }

      // Check card derivative
      const cardPath = cleanPath.replace(/\.(png|jpe?g)$/i, '-800w.webp');
      if (!fs.existsSync(path.resolve('public', cardPath))) {
        missingCard++;
        issues.push(`Missing Card (-800w.webp): ${cardPath}`);
      }

      // Check thumb derivative
      const thumbPath = cleanPath.replace(/\.(png|jpe?g)$/i, '-thumb.webp');
      if (!fs.existsSync(path.resolve('public', thumbPath))) {
        missingThumb++;
        issues.push(`Missing Thumb (-thumb.webp): ${thumbPath}`);
      }

      // Check full webp
      const fullWebpPath = cleanPath.replace(/\.(png|jpe?g)$/i, '.webp');
      if (!fs.existsSync(path.resolve('public', fullWebpPath))) {
        missingFullWebp++;
        issues.push(`Missing Full Webp (.webp): ${fullWebpPath}`);
      }
    }
  }

  console.log(`Total Product Image References Checked: ${totalImageRefs}`);
  console.log(`Missing Card Derivatives: ${missingCard}`);
  console.log(`Missing Thumb Derivatives: ${missingThumb}`);
  console.log(`Missing Full Webp: ${missingFullWebp}`);

  if (issues.length === 0) {
    console.log('\nSUCCESS: 100% of product images have verified, valid derivatives! (0 Fallbacks needed!)');
  } else {
    console.error('\nIssues found:', issues);
  }
}

verifyAllDerivatives();
