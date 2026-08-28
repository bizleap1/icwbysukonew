const prisma = require('../prisma/client');

// The authoritative 9 Luxury ICW by SUKO products with full galleries, sizes, descriptions & pricing
const CURATED_9_PRODUCTS = [
  {
    name: "Midnight Peplum Set",
    categoryName: "Power Suits & Sets",
    sub_category: "Executive Co-ord Sets",
    price: 72000,
    stock: 40,
    sizes: ["XS", "S", "M", "L", "XL"],
    size_stock: { "XS": 5, "S": 10, "M": 15, "L": 5, "XL": 5 },
    description: "A coordinated two-piece set featuring a fitted peplum jacket with gold-tone buttons and a matching fishtail skirt. Designed with a defined waist and softly flared silhouette.",
    image_url: "/products/midnight-peplum-fishtail-set/1.png",
    images: [
      "/products/midnight-peplum-fishtail-set/1.png",
      "/products/midnight-peplum-fishtail-set/2.png",
      "/products/midnight-peplum-fishtail-set/3.png",
      "/products/midnight-peplum-fishtail-set/4.png",
      "/products/midnight-peplum-fishtail-set/5.png",
      "/products/midnight-peplum-fishtail-set/6.png",
      "/products/midnight-peplum-fishtail-set/7.png"
    ]
  },
  {
    name: "Midnight Sculpted Vest Set",
    categoryName: "Waistcoats & Vests",
    sub_category: "Executive Co-ord Sets",
    price: 68000,
    stock: 35,
    sizes: ["XS", "S", "M", "L", "XL"],
    size_stock: { "XS": 5, "S": 10, "M": 10, "L": 5, "XL": 5 },
    description: "A tailored two-piece set featuring a sculpted sleeveless vest with ivory cowl contrast neckline and a coordinating column skirt in deep midnight navy.",
    image_url: "/products/midnight-sculpted-vest-set/1.png",
    images: [
      "/products/midnight-sculpted-vest-set/1.png",
      "/products/midnight-sculpted-vest-set/2.png",
      "/products/midnight-sculpted-vest-set/3.png",
      "/products/midnight-sculpted-vest-set/4.png",
      "/products/midnight-sculpted-vest-set/5.png",
      "/products/midnight-sculpted-vest-set/6.png",
      "/products/midnight-sculpted-vest-set/7.png"
    ]
  },
  {
    name: "Aubergine Draped Set",
    categoryName: "Power Suits & Sets",
    sub_category: "Executive Co-ord Sets",
    price: 68000,
    stock: 35,
    sizes: ["XS", "S", "M", "L", "XL"],
    size_stock: { "XS": 5, "S": 10, "M": 10, "L": 5, "XL": 5 },
    description: "A coordinated two-piece set featuring a sleeveless structured vest with layered draped lapels, an asymmetric front panel and a single gold-tone button detail, paired with a matching tailored mini skirt.",
    image_url: "/products/aubergine-draped-vest-mini-set/1.png",
    images: [
      "/products/aubergine-draped-vest-mini-set/1.png",
      "/products/aubergine-draped-vest-mini-set/2.png",
      "/products/aubergine-draped-vest-mini-set/3.png",
      "/products/aubergine-draped-vest-mini-set/4.png",
      "/products/aubergine-draped-vest-mini-set/5.png",
      "/products/aubergine-draped-vest-mini-set/6.png",
      "/products/aubergine-draped-vest-mini-set/7.png"
    ]
  },
  {
    name: "Aubergine Tailored Suit",
    categoryName: "Power Suits & Sets",
    sub_category: "Power Suits & Sets",
    price: 78000,
    stock: 45,
    sizes: ["XS", "S", "M", "L", "XL"],
    size_stock: { "XS": 5, "S": 15, "M": 15, "L": 5, "XL": 5 },
    description: "A coordinated two-piece suit featuring a tailored single-button blazer with a soft shawl-style lapel, structured shoulders, front pockets and buttoned cuffs, paired with matching wide-leg trousers.",
    image_url: "/products/aubergine-tailored-power-suit/1.png",
    images: [
      "/products/aubergine-tailored-power-suit/1.png",
      "/products/aubergine-tailored-power-suit/2.png",
      "/products/aubergine-tailored-power-suit/3.png",
      "/products/aubergine-tailored-power-suit/4.png",
      "/products/aubergine-tailored-power-suit/5.png",
      "/products/aubergine-tailored-power-suit/6.png",
      "/products/aubergine-tailored-power-suit/7.png"
    ]
  },
  {
    name: "Dusty Rose Flare Suit",
    categoryName: "Power Suits & Sets",
    sub_category: "Power Suits & Sets",
    price: 76000,
    stock: 40,
    sizes: ["XS", "S", "M", "L", "XL"],
    size_stock: { "XS": 5, "S": 10, "M": 15, "L": 5, "XL": 5 },
    description: "A coordinated two-piece suit featuring a longline single-breasted blazer with a defined notch lapel, tailored waist and single-button closure, paired with matching high-rise trousers finished with an exaggerated sculptural flare.",
    image_url: "/products/dusty-rose-sculpted-flare-suit/1.png",
    images: [
      "/products/dusty-rose-sculpted-flare-suit/1.png",
      "/products/dusty-rose-sculpted-flare-suit/2.png",
      "/products/dusty-rose-sculpted-flare-suit/3.png",
      "/products/dusty-rose-sculpted-flare-suit/4.png",
      "/products/dusty-rose-sculpted-flare-suit/5.png",
      "/products/dusty-rose-sculpted-flare-suit/6.png",
      "/products/dusty-rose-sculpted-flare-suit/7.png"
    ]
  },
  {
    name: "Plum Sculpted Suit",
    categoryName: "Power Suits & Sets",
    sub_category: "Power Suits & Sets",
    price: 78000,
    stock: 40,
    sizes: ["XS", "S", "M", "L", "XL"],
    size_stock: { "XS": 5, "S": 10, "M": 15, "L": 5, "XL": 5 },
    description: "A coordinated two-piece suit featuring a sculpted double-breasted blazer with a defined lapel, fitted waist and softly flared hem, paired with matching tailored trousers finished in a clean flared silhouette.",
    image_url: "/products/the-plum-sculpted-suit/1.JPG",
    images: [
      "/products/the-plum-sculpted-suit/1.JPG",
      "/products/the-plum-sculpted-suit/2.png",
      "/products/the-plum-sculpted-suit/3.png",
      "/products/the-plum-sculpted-suit/4.png",
      "/products/the-plum-sculpted-suit/5.JPG",
      "/products/the-plum-sculpted-suit/6.JPG",
      "/products/the-plum-sculpted-suit/7.JPG"
    ]
  },
  {
    name: "Dusty Rose Embroidered Set",
    categoryName: "Signature Co-ord Sets",
    sub_category: "Signature Co-ord Sets",
    price: 72000,
    stock: 35,
    sizes: ["XS", "S", "M", "L", "XL"],
    size_stock: { "XS": 5, "S": 10, "M": 10, "L": 5, "XL": 5 },
    description: "A refined two-piece set pairing a fluid longline tunic with coordinated wide-leg trousers. Deep burgundy embroidery frames the neckline and shoulders, introducing sculptural contrast against the muted dusty-rose base.",
    image_url: "/products/the-dusty-rose-embroidered-set/1.png",
    images: [
      "/products/the-dusty-rose-embroidered-set/1.png",
      "/products/the-dusty-rose-embroidered-set/2.png",
      "/products/the-dusty-rose-embroidered-set/3.png",
      "/products/the-dusty-rose-embroidered-set/4.png",
      "/products/the-dusty-rose-embroidered-set/5.png",
      "/products/the-dusty-rose-embroidered-set/6.png",
      "/products/the-dusty-rose-embroidered-set/7.png"
    ]
  },
  {
    name: "Noir Tailored Suit",
    categoryName: "Power Suits & Sets",
    sub_category: "Power Suits & Sets",
    price: 78000,
    stock: 50,
    sizes: ["XS", "S", "M", "L", "XL"],
    size_stock: { "XS": 10, "S": 15, "M": 15, "L": 5, "XL": 5 },
    description: "A refined black tailoring set built around a clean, elongated silhouette. The single-breasted blazer is defined by sharp notch lapels, a sculpted waist and a statement metallic button, paired with fluid wide-leg trousers.",
    image_url: "/products/the-noir-tailored-suit/1.JPG",
    images: [
      "/products/the-noir-tailored-suit/1.JPG",
      "/products/the-noir-tailored-suit/2.png",
      "/products/the-noir-tailored-suit/3.png",
      "/products/the-noir-tailored-suit/4.JPG",
      "/products/the-noir-tailored-suit/5.JPG",
      "/products/the-noir-tailored-suit/6.JPG",
      "/products/the-noir-tailored-suit/7.JPG"
    ]
  },
  {
    name: "Noir Layered Suit",
    categoryName: "Power Suits & Sets",
    sub_category: "Power Suits & Sets",
    price: 82000,
    stock: 45,
    sizes: ["XS", "S", "M", "L", "XL"],
    size_stock: { "XS": 5, "S": 15, "M": 15, "L": 5, "XL": 5 },
    description: "A modern three-piece interpretation of black tailoring, designed around layered sleeveless structure and fluid proportions. Two sharply tailored vest layers create depth through the neckline, while coordinated wide-leg trousers complete the silhouette.",
    image_url: "/products/the-noir-layered-suit/1.png",
    images: [
      "/products/the-noir-layered-suit/1.png",
      "/products/the-noir-layered-suit/2.png",
      "/products/the-noir-layered-suit/3.png",
      "/products/the-noir-layered-suit/4.png",
      "/products/the-noir-layered-suit/5.png",
      "/products/the-noir-layered-suit/6.png",
      "/products/the-noir-layered-suit/7.png"
    ]
  }
];

async function syncCuratedProducts() {
  console.log("=================================================================");
  console.log("💎 SYNCHRONIZING EXACT 9 CURATED LUXURY PRODUCTS INTO NEON DB");
  console.log("=================================================================");

  // 1. Ensure Categories Exist
  const categoryNames = [...new Set(CURATED_9_PRODUCTS.map(p => p.categoryName))];
  const categoryMap = {};

  for (const catName of categoryNames) {
    let cat = await prisma.category.findFirst({ where: { name: catName } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name: catName } });
      console.log(`+ Created Category: "${catName}" (ID: ${cat.id})`);
    }
    categoryMap[catName] = cat.id;
  }

  // 2. Exact Upsert for each of the 9 products
  const finalProducts = [];

  for (const item of CURATED_9_PRODUCTS) {
    const category_id = categoryMap[item.categoryName] || null;

    let existing = await prisma.product.findFirst({
      where: { name: item.name }
    });

    if (existing) {
      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: {
          description: item.description,
          price: item.price,
          stock: item.stock,
          image_url: item.image_url,
          images: item.images,
          sizes: item.sizes,
          size_stock: item.size_stock,
          category_id: category_id || existing.category_id,
          sub_category: item.sub_category
        }
      });
      finalProducts.push(updated);
      console.log(`✅ [Synced] Product ID: ${updated.id} • "${updated.name}" (₹${updated.price}) | ${item.images.length} images`);
    } else {
      const created = await prisma.product.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          stock: item.stock,
          image_url: item.image_url,
          images: item.images,
          sizes: item.sizes,
          size_stock: item.size_stock,
          category_id,
          sub_category: item.sub_category
        }
      });
      finalProducts.push(created);
      console.log(`✨ [Created] Product ID: ${created.id} • "${created.name}" (₹${created.price}) | ${item.images.length} images`);
    }
  }

  const finalIds = finalProducts.map(p => p.id);

  // 3. Inspect all products currently in DB
  const allProds = await prisma.product.findMany({
    select: { id: true, name: true, price: true, images: true, image_url: true }
  });

  console.log(`\n--- FINAL NEON DB PRODUCT AUDIT (${allProds.length} total) ---`);
  allProds.forEach((p, idx) => {
    console.log(`${idx + 1}. [ID: ${p.id}] "${p.name}" - ₹${p.price} (Images: ${p.images?.length || 0})`);
  });

  console.log("\n=================================================================");
  console.log("🎉 ALL 9 CURATED PRODUCTS ARE IN 100% PERFECT SYNC!");
  console.log("=================================================================\n");

  await prisma.$disconnect();
}

syncCuratedProducts().catch(err => {
  console.error("Sync error:", err);
  process.exit(1);
});
