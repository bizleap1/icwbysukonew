const prisma = require('./src/prisma/client');

async function seedCoupons() {
  const coupons = [
    { code: 'SUKO10', discount_percent: 10, min_order_value: 0 },
    { code: 'WELCOME20', discount_percent: 20, min_order_value: 1000 },
    { code: 'ATELIER500', discount_flat: 500, min_order_value: 2000 },
    { code: 'VIP15', discount_percent: 15, min_order_value: 0 }
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: { is_active: true, ...c },
      create: { is_active: true, ...c }
    });
    console.log(`Coupon ${c.code} synced successfully!`);
  }

  console.log('All promo coupons seeded in Neon DB!');
  process.exit(0);
}

seedCoupons().catch((err) => {
  console.error(err);
  process.exit(1);
});
