const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCategories() {
  const categories = [
    "Men's Collection",
    "Women's Collection",
    "Executive Shirts",
    "Luxury Suits",
    "Tailored Blazers",
    "Premium Trousers",
    "Evening & Tuxedos",
    "Casual & Streetwear",
    "Accessories"
  ];

  for (const name of categories) {
    const exists = await prisma.category.findFirst({ where: { name } });
    if (!exists) {
      await prisma.category.create({ data: { name } });
      console.log(`Created category: ${name}`);
    }
  }
  console.log("All website categories seeded successfully!");
}

seedCategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
