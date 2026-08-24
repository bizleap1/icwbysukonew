const prisma = require('../prisma/client');

async function removeLegacyProducts() {
  console.log("=================================================================");
  console.log("🧹 REMOVING 3 LEGACY PRODUCTS FROM NEON DATABASE");
  console.log("=================================================================");

  const targetNames = [
    "Amara Pleated Peplum Set",
    "Rosewood Wrap Tunic Set",
    "Navy Power Blazer Suit"
  ];

  const productsToRemove = await prisma.product.findMany({
    where: {
      name: { in: targetNames }
    }
  });

  console.log(`Found ${productsToRemove.length} legacy products to remove:`);
  productsToRemove.forEach(p => console.log(`- ID: ${p.id} • "${p.name}"`));

  for (const prod of productsToRemove) {
    // 1. Delete associated cart items
    const deletedCart = await prisma.cartItem.deleteMany({ where: { product_id: prod.id } });
    console.log(`  - Deleted ${deletedCart.count} cart items referencing product #${prod.id}`);

    // 2. Delete associated wishlist items
    const deletedWish = await prisma.wishlist.deleteMany({ where: { product_id: prod.id } });
    console.log(`  - Deleted ${deletedWish.count} wishlist items referencing product #${prod.id}`);

    // 3. Delete associated reviews
    const deletedReviews = await prisma.review.deleteMany({ where: { product_id: prod.id } });
    console.log(`  - Deleted ${deletedReviews.count} reviews referencing product #${prod.id}`);

    // 4. Delete associated stock notifications
    const deletedNotif = await prisma.stockNotification.deleteMany({ where: { product_id: prod.id } });
    console.log(`  - Deleted ${deletedNotif.count} stock notifications referencing product #${prod.id}`);

    // 5. Delete associated order items
    const deletedOrderItems = await prisma.orderItem.deleteMany({ where: { product_id: prod.id } });
    console.log(`  - Deleted ${deletedOrderItems.count} historical order items referencing product #${prod.id}`);

    // 6. Delete product record
    await prisma.product.delete({ where: { id: prod.id } });
    console.log(`✅ Permanently deleted product #${prod.id} "${prod.name}".`);
  }

  // Final count check
  const remaining = await prisma.product.findMany({
    select: { id: true, name: true, price: true, images: true }
  });

  console.log(`\n--- FINAL REMAINING DATABASE PRODUCTS (${remaining.length} total) ---`);
  remaining.forEach((p, i) => console.log(`${i + 1}. [ID: ${p.id}] "${p.name}" - ₹${p.price} (${p.images?.length || 0} images)`));

  console.log("=================================================================");
  console.log("🎉 EXACT 9 CURATED PRODUCTS REMAIN IN NEON DB!");
  console.log("=================================================================");

  await prisma.$disconnect();
}

removeLegacyProducts().catch(err => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
