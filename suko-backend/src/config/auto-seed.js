import prisma from '../prisma/client.js';
import bcrypt from 'bcryptjs';
import { migrateProductVariants } from '../scripts/migrateVariants.js';

const catalogProducts = [
  // Indo-Western
  { name: "Pink Blush Lehenga", price: 16191, category: "Indo-Western", sub_category: "Lehenga", image_url: "/products/Lehenga-Pink Blush/1.JPG" },
  { name: "Light Purple Lehenga", price: 15831, category: "Indo-Western", sub_category: "Lehenga", image_url: "/products/Lehenga-Light Purple/1.JPG" },
  { name: "Golden Lehenga", price: 18891, category: "Indo-Western", sub_category: "Lehenga", image_url: "/products/Lehenga-Golden/1.JPG" },
  { name: "Red Indo Western Suit", price: 24831, category: "Indo-Western", sub_category: "Suit", image_url: "/products/Indo Western Suit -Red/1.JPG" },
  // Drape Sarees
  { name: "Grey Drape Saree", price: 22681, category: "Drape Sarees", sub_category: "Saree", image_url: "/products/Drape Saree-Grey Color/1.JPG" },
  { name: "Pink Blush Drape Saree", price: 17091, category: "Drape Sarees", sub_category: "Saree", image_url: "/products/Drape Saree-Pink Blush Color/1.JPG" },
  { name: "Black Drape Saree", price: 11511, category: "Drape Sarees", sub_category: "Saree", image_url: "/products/Drape Saree-Black Color/1.JPG" },
  // Designer Suits
  { name: "Red Suit", price: 17731, category: "Designer Suits", sub_category: "Suit", image_url: "/products/Suit- Red/1.JPG" },
  { name: "Purple Suit", price: 8991, category: "Designer Suits", sub_category: "Suit", image_url: "/products/Suit-Purple/1.JPG" },
  { name: "Mustard Suit", price: 13611, category: "Designer Suits", sub_category: "Suit", image_url: "/products/Suit -Mustard/1.JPG" },
  { name: "Mustard Suit 2", price: 15131, category: "Designer Suits", sub_category: "Suit", image_url: "/products/Suit-Mustard 2/1.JPG" },
  // Premium Suit Materials
  { name: "Rajastani Pink Material", price: 3951, category: "Premium Suit Materials", sub_category: "Material", image_url: "/products/Rajastani-pink/1.JPG" },
  { name: "Rajastani Green Material", price: 6999, category: "Premium Suit Materials", sub_category: "Material", image_url: "/products/Rajastani-Green/1.JPG" },
  // Co-ord Sets
  { name: "Grey Co-ord Set", price: 23131, category: "Co-ord Sets", sub_category: "Co-ord", image_url: "/products/grey co-order set/1.JPG" },
  { name: "Black Co-ord Set", price: 21591, category: "Co-ord Sets", sub_category: "Co-ord", image_url: "/products/Co-order Black/1.JPG" },
  { name: "Golden-Black Co-ord Set", price: 24831, category: "Co-ord Sets", sub_category: "Co-ord", image_url: "/products/Co-order Golden-Black/1.JPG" },
  { name: "Dark Green Co-ord Set", price: 21331, category: "Co-ord Sets", sub_category: "Co-ord", image_url: "/products/Co-order Dark Green/1.JPG" },
  { name: "White Co-ord Set", price: 23131, category: "Co-ord Sets", sub_category: "Co-ord", image_url: "/products/Co-order White/1.JPG" },
  { name: "Red Co-ord Set", price: 4999, category: "Co-ord Sets", sub_category: "Co-ord", image_url: "/products/Co-order Red/1.JPG", whatsapp_inquiry: true, stock: 0, size_stock: { "Free Size (M to XL)": 0 } },
  { name: "Orange Co-ord Set", price: 4999, category: "Co-ord Sets", sub_category: "Co-ord", image_url: "/products/Co-order Orange/1.JPG", whatsapp_inquiry: true, stock: 0, size_stock: { "Free Size (M to XL)": 0 } },
  { name: "Light Green Co-ord Set", price: 4999, category: "Co-ord Sets", sub_category: "Co-ord", image_url: "/products/Co-order Light Green/1.JPG", whatsapp_inquiry: true, stock: 0, size_stock: { "Free Size (M to XL)": 0 } },
  { name: "Mustard Co-ord Set", price: 4999, category: "Co-ord Sets", sub_category: "Co-ord", image_url: "/products/Co-order Mustard/1.JPG", whatsapp_inquiry: true, stock: 0, size_stock: { "Free Size (M to XL)": 0 } },
  // Dresses (Haute Couture)
  { name: "Rose Gold Fringe Crop Top & Draped Skirt Set", price: 9311, category: "Dresses", sub_category: "Co-ord Set", image_url: "/dresses/1.png" },
  { name: "Noir Black Embellished Halter Tunic & Palazzo Set", price: 10791, category: "Dresses", sub_category: "Tunic & Palazzo", image_url: "/dresses/2.png" },
  { name: "Obsidian Black Cut-Out Back Halter Evening Gown", price: 16191, category: "Dresses", sub_category: "Evening Gown", image_url: "/dresses/3.png" },
  { name: "Powder Blue Pre-Draped Saree Gown with Embroidered Belt", price: 17731, category: "Dresses", sub_category: "Drape Saree Gown", image_url: "/dresses/4.png" },
  { name: "Scarlet Red Embroidered Vest Jacket & Palazzo Set", price: 10791, category: "Dresses", sub_category: "Jacket Set", image_url: "/dresses/5.png" },
  { name: "Ivory Pearl Silk Paisley Tunic & Flared Sharara Set", price: 19531, category: "Dresses", sub_category: "Sharara Set", image_url: "/dresses/6.png" },
  { name: "Royal Plum Crinkle Chiffon Cape Kurta & Palazzo Set", price: 7561, category: "Dresses", sub_category: "Cape Kurta Set", image_url: "/dresses/7.png" },
  { name: "Noir Black Hand-Embroidered Halter Draped Column Gown", price: 11511, category: "Dresses", sub_category: "Evening Gown", image_url: "/dresses/8.png" },
  { name: "Onyx Black Hand-Embroidered Motif Blazer & Trouser Pantsuit", price: 16731, category: "Dresses", sub_category: "Pantsuit", image_url: "/dresses/9.png" },
  { name: "Wine Red Asymmetrical Embroidered Collar Kurta & Palazzo Set", price: 12591, category: "Dresses", sub_category: "Kurta Set", image_url: "/dresses/10.png" },
  { name: "Crimson Red Angrakha Pleated Anarkali Gown with Choker Dupatta", price: 23131, category: "Dresses", sub_category: "Anarkali Gown", image_url: "/dresses/11.png" },
  { name: "Rani Pink Zari Embroidered Peplum Sharara Set with Sheer Cape", price: 16551, category: "Dresses", sub_category: "Sharara Set", image_url: "/dresses/12.png" },
  { name: "Noir Black Pre-Draped Pleated Saree with Embroidered Sweetheart Blouse", price: 21591, category: "Dresses", sub_category: "Drape Saree", image_url: "/dresses/13.png" },
  { name: "Ruby Red Criss-Cross Neck Embroidered Tunic & Palazzo Set", price: 8991, category: "Dresses", sub_category: "Tunic & Palazzo", image_url: "/dresses/14.png" },
  { name: "Burgundy Draped Skirt & Crop Top Set with Embroidered Shrug", price: 16191, category: "Dresses", sub_category: "Skirt & Shrug Set", image_url: "/dresses/15.png" },
  { name: "Champagne Bronze Metallic Pleated Lehenga Set with Draped Pallu", price: 17991, category: "Dresses", sub_category: "Drape Lehenga", image_url: "/dresses/16.png" },
];

export async function autoSeedIfEmpty() {
  try {
    // 1. Check Product Catalog - ONLY seed if database has 0 products
    const productCount = await prisma.product.count();
    if (productCount === 0) {
      console.log(`🌱 [AutoSeed] Database is empty. Seeding initial catalog products...`);
      for (const item of catalogProducts) {
        let cat = await prisma.category.findFirst({ where: { name: item.category } });
        if (!cat) {
          cat = await prisma.category.create({ data: { name: item.category } });
        }

        await prisma.product.create({
          data: {
            name: item.name,
            price: item.price,
            stock: 1,
            sizes: ["Free Size (M to XL)"],
            size_stock: { "Free Size (M to XL)": 1 },
            whatsapp_inquiry: item.whatsapp_inquiry || false,
            image_url: item.image_url,
            images: [item.image_url],
            category_id: cat.id,
            sub_category: item.sub_category,
          },
        });
      }
      console.log('✅ [AutoSeed] Catalog products seeded successfully.');
    } else {
      console.log(`📦 [AutoSeed] Database already contains ${productCount} products. Preserving all live customizations.`);
    }

    // Always audit & ensure product variants exist for all catalog items
    try {
      await migrateProductVariants();
    } catch (_) {}

    // 2. Check Admin Account
    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (!adminUser) {
      console.log('🌱 [AutoSeed] Admin account missing. Creating default admin...');
      const hash = await bcrypt.hash('adminpassword', 10);
      await prisma.user.upsert({
        where: { email: 'admin@suko.com' },
        update: { password_hash: hash, role: 'admin', name: 'Garima (Admin)' },
        create: {
          name: 'Garima (Admin)',
          email: 'admin@suko.com',
          password_hash: hash,
          phone: '9999999999',
          role: 'admin',
        },
      });
      console.log('✅ [AutoSeed] Admin user admin@suko.com ready.');
    }

    // 3. No dummy coupons or dummy customers are auto-seeded.
    // Coupons and customers will only be created when actual admin or users add them.
  } catch (err) {
    console.warn('⚠️ [AutoSeed] Auto-seeding check failed:', err.message);
  }
}
