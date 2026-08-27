import prisma from '../prisma/client.js';
import { syncProductStockFromVariants } from '../services/inventory.service.js';

export async function migrateProductVariants() {
  console.log('🔄 Checking all products for variants...');

  const products = await prisma.product.findMany({
    include: { variants: true }
  });

  console.log(`Found ${products.length} products in database.`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const p of products) {
    if (p.variants && p.variants.length > 0) {
      skippedCount++;
      continue;
    }

    const sizes = Array.isArray(p.sizes) && p.sizes.length > 0
      ? p.sizes
      : (p.size_stock && typeof p.size_stock === 'object' && Object.keys(p.size_stock).length > 0
          ? Object.keys(p.size_stock)
          : ['Free Size']);

    const sizeStock = p.size_stock && typeof p.size_stock === 'object' ? p.size_stock : {};
    const skuPrefix = p.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'SUK';
    const totalStock = p.stock > 0 ? p.stock : 10;
    const unitPrice = parseFloat(p.price) || 4999;

    await prisma.$transaction(async (tx) => {
      for (const sz of sizes) {
        const vStock = sizeStock[sz] !== undefined
          ? parseInt(sizeStock[sz], 10)
          : Math.max(1, Math.floor(totalStock / sizes.length));
        const cleanSz = sz.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const vSku = `SUK-${skuPrefix}-${p.id}-${cleanSz}`;
        const vBarcode = `BAR-${p.id}-${cleanSz}`;

        await tx.productVariant.create({
          data: {
            product_id: p.id,
            sku: vSku,
            barcode: vBarcode,
            size: sz,
            color: 'Default',
            price: unitPrice,
            mrp_price: p.mrp_price ? parseFloat(p.mrp_price) : unitPrice * 1.25,
            cost_price: unitPrice * 0.5,
            stock: vStock,
            reserved_stock: 0,
            low_stock_alert: 2,
            is_active: true
          }
        });
      }

      await syncProductStockFromVariants(tx, p.id);
    });

    createdCount++;
    console.log(`✅ Generated variants for product [${p.id}] ${p.name} (Sizes: ${sizes.join(', ')})`);
  }

  console.log(`\n🎉 Migration Complete: Generated variants for ${createdCount} products (${skippedCount} already had variants).`);
}

migrateVariants()
  .catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
