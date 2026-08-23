const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PRODUCTS = [
  // --- FEMALE SHIRTS ---
  { name: "Noir Oxford Shirt", categoryName: "Executive Shirts", price: 28500, stock: 20, description: "A foundational shirt in deep onyx, woven from rare Sea Island cotton.", image_url: "/images/female_clean_3_1781334672765.png", sizes: ["38", "40", "42"] },
  { name: "Ivory Poplin Classic", categoryName: "Executive Shirts", price: 31000, stock: 15, description: "The quintessential boardroom shirt. Crisp poplin, single-needle stitching.", image_url: "/images/female_formal_3_1781334441333.png", sizes: ["38", "40", "42"] },
  { name: "Midnight Twill Shirt", categoryName: "Executive Shirts", price: 34500, stock: 4, description: "A subtle sheen in deepest navy. Cut for movement, finished by hand.", image_url: "/images/female_clean_4_1781334684185.png", sizes: ["38", "40", "42"] },
  { name: "Silk Crepe Blouse", categoryName: "Executive Shirts", price: 42000, stock: 12, description: "Fluid silk crepe with a concealed placket for a minimalist finish.", image_url: "/images/female_formal_4_1781334454191.png", sizes: ["38", "40", "42"] },
  { name: "Windswept Poplin Shirt", categoryName: "Executive Shirts", price: 29000, stock: 18, description: "An executive white shirt cut for an elegant feminine silhouette and crisp drape.", image_url: "/images/female_corp_shirt_1.png", sizes: ["38", "40", "42"] },
  { name: "Powder Blue Executive Shirt", categoryName: "Executive Shirts", price: 27500, stock: 3, description: "A structured shirt in powder blue, tailored for modern boardrooms.", image_url: "/images/female_clean_4_1781334684185.png", sizes: ["38", "40", "42"] },
  { name: "Midnight Silk Executive Shirt", categoryName: "Executive Shirts", price: 38000, stock: 8, description: "A dark, brooding silk shirt with a subtle luster for formal events.", image_url: "/images/female_formal_4_1781334454191.png", sizes: ["38", "40", "42"] },

  // --- FEMALE SUITS ---
  { name: "Obsidian Two-Piece", categoryName: "Luxury Suits", price: 87000, stock: 10, description: "Hand-canvassed two-piece in obsidian wool. Notch lapel, structured shoulders.", image_url: "/images/female_clean_1_1781334564171.png", sizes: ["40", "42", "44"] },
  { name: "Graphite Power Suit", categoryName: "Luxury Suits", price: 114000, stock: 5, description: "A full suite in graphite glen check. Impeccable tailoring.", image_url: "/images/female_formal_1_1781334416775.png", sizes: ["40", "42", "44"] },
  { name: "Ivory Tuxedo Suit", categoryName: "Luxury Suits", price: 105000, stock: 2, description: "Striking ivory tuxedo for evening wear with satin lapels.", image_url: "/images/hero_focus_2_1781336678836.png", sizes: ["40", "42", "44"] },
  { name: "Midnight Dinner Suit", categoryName: "Luxury Suits", price: 98500, stock: 7, description: "An evening suit in deepest midnight. Peak satin lapel.", image_url: "/images/female_clean_2_1781334574968.png", sizes: ["40", "42", "44"] },
  { name: "Charcoal Worsted Power Suit", categoryName: "Luxury Suits", price: 95000, stock: 14, description: "Impeccably tailored women's power suit. Double-breasted closure, sharp shoulders.", image_url: "/images/female_corp_suit_1.png", sizes: ["40", "42", "44"] },
  { name: "Navy Pinstripe Executive Suit", categoryName: "Luxury Suits", price: 110000, stock: 9, description: "The ultimate power suit in deep navy with subtle pinstripes, contoured cut.", image_url: "/images/female_corp_suit_2.png", sizes: ["40", "42", "44"] },
  { name: "Classic Black Tuxedo Suit", categoryName: "Evening & Tuxedos", price: 125000, stock: 4, description: "A timeless black dinner tuxedo with satin peak lapels for evening affairs.", image_url: "/images/female_formal_2_1781334428103.png", sizes: ["40", "42", "44"] },
  { name: "Dove Grey Tailored Suit", categoryName: "Luxury Suits", price: 89000, stock: 11, description: "A crisp, lightweight suit perfect for daytime formal events or summer corporate conferences.", image_url: "/images/female_clean_1_1781334564171.png", sizes: ["40", "42", "44"] },

  // --- BLAZERS ---
  { name: "Onyx Velvet Blazer", categoryName: "Tailored Blazers", price: 62000, stock: 6, description: "An evening blazer in deep onyx velvet. Shawl collar.", image_url: "/images/female_clean_5_1781334697190.png", sizes: ["38", "40", "42", "44"] },
  { name: "Smoked Grey Blazer", categoryName: "Tailored Blazers", price: 54500, stock: 16, description: "Unstructured silhouette, hand-stitched lapel roll.", image_url: "/images/female_formal_5_1781334467683.png", sizes: ["38", "40", "42", "44"] },
  { name: "Camel Hair Blazer", categoryName: "Tailored Blazers", price: 71000, stock: 3, description: "A luxurious and warm blazer with an oversized masculine fit.", image_url: "/images/hero_focus_3_1781336690961.png", sizes: ["38", "40", "42", "44"] },
  { name: "Heritage Navy Tailored Blazer", categoryName: "Tailored Blazers", price: 65000, stock: 12, description: "The iconic structured navy blazer with gold-tone buttons and peak lapels.", image_url: "/images/female_corp_blazer_1.png", sizes: ["38", "40", "42", "44"] },
  { name: "Houndstooth Tailored Blazer", categoryName: "Tailored Blazers", price: 72000, stock: 8, description: "A textured houndstooth blazer for cooler climates and casual Fridays.", image_url: "/images/female_corp_blazer_1.png", sizes: ["38", "40", "42", "44"] },

  // --- TROUSERS ---
  { name: "Charcoal Pleated Trouser", categoryName: "Premium Trousers", price: 26500, stock: 22, description: "Double-pleated, high-rise. Side adjusters, no belt loops.", image_url: "/images/female_formal_2_1781334428103.png", sizes: ["38", "40", "42"] },
  { name: "Midnight Flat-Front Trouser", categoryName: "Premium Trousers", price: 28000, stock: 18, description: "A flat-front cut for sharp silhouettes.", image_url: "/images/female_clean_2_1781334574968.png", sizes: ["38", "40", "42"] },
  { name: "Ivory Wide-Leg Trouser", categoryName: "Premium Trousers", price: 32000, stock: 7, description: "Flowing wide-leg trousers that pool elegantly at the shoe.", image_url: "/images/female_formal_3_1781334441333.png", sizes: ["38", "40", "42"] },
  { name: "Grey Flannel Tailored Trouser", categoryName: "Premium Trousers", price: 29000, stock: 13, description: "The definitive winter corporate trouser. High-rise with a subtle taper.", image_url: "/images/female_corp_trouser_1.png", sizes: ["38", "40", "42"] },
  { name: "Navy Twill Tailored Trouser", categoryName: "Premium Trousers", price: 24000, stock: 25, description: "A formal high-rise trouser with extended tab closure and sharp front creases.", image_url: "/images/female_corp_trouser_1.png", sizes: ["38", "40", "42"] },

  // --- MENS COLLECTION ---
  { name: "Midnight Pinstripe Suit", categoryName: "Men's Collection", price: 92000, stock: 10, description: "A tailored midnight blue pinstripe corporate suit. Impeccable drape with soft canvassing.", image_url: "/images/mens_item1_front_1782649409337.png", sizes: ["40", "42", "44", "46"] },
  { name: "Navy Executive Tailored Suit", categoryName: "Men's Collection", price: 88000, stock: 8, description: "An executive navy suit featuring sharp lapels and a structured silhouette.", image_url: "/images/mens_item1_back_1782649420927.png", sizes: ["40", "42", "44", "46"] },
  { name: "Charcoal Grey Wool Jacket", categoryName: "Men's Collection", price: 64000, stock: 12, description: "A luxurious charcoal grey wool tailored corporate jacket. Classic boardroom presence.", image_url: "/images/mens_item2_front_1782649430719.png", sizes: ["40", "42", "44", "46"] },
  { name: "Graphite Structured Blazer", categoryName: "Men's Collection", price: 58000, stock: 15, description: "A structured graphite blazer with a minimalist profile. Unlined for natural shoulder expression.", image_url: "/images/mens_item2_back_1782649442548.png", sizes: ["40", "42", "44", "46"] },
  { name: "Crisp White Executive Shirt", categoryName: "Men's Collection", price: 28000, stock: 20, description: "The essential boardroom white shirt. Razor-sharp collar and French cuffs.", image_url: "/images/mens_item3_front_1782649454163.png", sizes: ["38", "40", "42", "44"] },
  { name: "Ivory Poplin Boardroom Shirt", categoryName: "Men's Collection", price: 32000, stock: 9, description: "A subtly textured ivory poplin shirt. Fluid drape and unparalleled softness.", image_url: "/images/mens_item3_back_1782649466148.png", sizes: ["38", "40", "42", "44"] },
  { name: "Black Tuxedo Corporate Suit", categoryName: "Men's Collection", price: 115000, stock: 3, description: "A striking black tuxedo suit tailored for the modern executive's evening gala.", image_url: "/images/mens_item4_front_1782649480951.png", sizes: ["40", "42", "44", "46"] },
  { name: "Obsidian Dinner Suit", categoryName: "Men's Collection", price: 99000, stock: 6, description: "An obsidian dinner suit featuring subtle satin peak lapels. Impeccably cut.", image_url: "/images/mens_item4_back_1782649492354.png", sizes: ["40", "42", "44", "46"] },
  { name: "Navy Twill Tailored Trousers", categoryName: "Men's Collection", price: 26000, stock: 18, description: "Flat-front navy twill trousers with side adjusters. A corporate staple.", image_url: "/images/mens_item5_front_1782649505331.png", sizes: ["38", "40", "42", "44"] },
  { name: "Midnight Pleated Trousers", categoryName: "Men's Collection", price: 27500, stock: 14, description: "Single-pleated trousers in deepest midnight. High-rise, classic tailored fit.", image_url: "/images/mens_item5_back_1782649516789.png", sizes: ["38", "40", "42", "44"] }
];

async function seedProducts() {
  console.log("Seeding catalog products into Neon DB...");
  const categories = await prisma.category.findMany();
  const categoryMap = {};
  categories.forEach(c => { categoryMap[c.name] = c.id; });

  for (const item of PRODUCTS) {
    const category_id = categoryMap[item.categoryName] || null;

    const exists = await prisma.product.findFirst({ where: { name: item.name } });
    if (!exists) {
      await prisma.product.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          stock: item.stock,
          image_url: item.image_url,
          sizes: item.sizes,
          category_id
        }
      });
      console.log(`+ Added: ${item.name} (${item.categoryName})`);
    } else {
      // Update image or category if missing
      await prisma.product.update({
        where: { id: exists.id },
        data: {
          price: item.price,
          stock: item.stock,
          image_url: item.image_url,
          category_id: category_id || exists.category_id,
          sizes: item.sizes
        }
      });
      console.log(`~ Updated: ${item.name}`);
    }
  }

  console.log("All products seeded successfully!");
}

seedProducts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
