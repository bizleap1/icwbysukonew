const prisma = require('./src/prisma/client');

async function seedCoupons() {
  try {
    console.log("Seeding demo coupons...");

    const coupons = [
      { code: 'SUKO10', discount_percent: 10, min_order_value: 1000 },
      { code: 'WELCOME20', discount_percent: 20, min_order_value: 2000 },
      { code: 'LUXE500', discount_flat: 500, min_order_value: 3000 }
    ];

    for (const c of coupons) {
      await prisma.coupon.upsert({
        where: { code: c.code },
        update: c,
        create: c
      });
    }

    console.log("Demo coupons seeded successfully!");
  } catch (err) {
    console.error("Seed coupons error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

seedCoupons();
