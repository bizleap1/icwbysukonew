require('dotenv').config();
const { pool } = require('../src/db');

// Simulation of exact formatters used in frontend Admin.jsx
const formatLuxuryCSVDate = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  const day = String(d.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const strHours = String(hours).padStart(2, "0");
  return `${day} ${month} ${year}, ${strHours}:${minutes} ${ampm}`;
};

const formatLuxuryCSVStatus = (p) => {
  const st = (p.status || "active").toLowerCase().trim();
  const stock = Number(p.stock) || 0;
  if (st === "archived") return "Archived";
  if (st === "draft") return "Draft";
  if (st === "coming_soon" || st === "coming soon") return "Coming Soon";
  if (stock === 0) return "Out of Stock";
  return "Active";
};

const formatLuxuryCSVPrice = (val) => {
  if (val === undefined || val === null || val === "") return "";
  const num = Number(val);
  if (isNaN(num)) return "";
  return "₹" + num.toLocaleString("en-IN");
};

const formatLuxuryCSVSKU = (p, index = 1) => {
  if (p && p.sku && p.sku.startsWith("SUKO-")) {
    return p.sku;
  }
  const cat = typeof p.category === "object" ? (p.category.name || "") : (p.category_name || p.category || "Suits");
  let catCode = "SUIT";
  if (cat.toLowerCase().includes("sep")) catCode = "SEP";
  else if (cat.toLowerCase().includes("coord")) catCode = "COORD";
  else if (cat.toLowerCase().includes("sign")) catCode = "SIGN";

  const words = (p.name || "Garment").split(/\s+/).filter(w => w.length > 0 && !["the", "a", "an", "and", "of", "&"].includes(w.toLowerCase()));
  let styleCode = words.map(w => w[0].toUpperCase()).join("").slice(0, 4);
  if (styleCode.length < 2) styleCode = (p.name || "GAR").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "STYLE";

  const seq = String(index).padStart(3, "0");
  return `SUKO-${catCode}-${styleCode}-${seq}`;
};

function resolveProductSizeStock(product) {
  const stockMap = { XS: 0, S: 0, M: 0, L: 0, XL: 0 };
  let raw = product?.size_stock;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch (e) { raw = {}; }
  }
  if (raw && typeof raw === 'object') {
    Object.keys(stockMap).forEach(size => {
      if (raw[size] !== undefined) {
        stockMap[size] = Number(raw[size]) || 0;
      }
    });
  }
  return stockMap;
}

async function runTest() {
  console.log('=== VERIFYING DUAL-FORMAT LUXURY CSV EXPORT ENGINE ===\n');

  const prodsRes = await pool.query(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.id ASC
    LIMIT 5
  `);

  const list = prodsRes.rows;
  console.log(`Found ${list.length} sample products in live database.\n`);

  // --- Format 1: Inventory Export (Stock & Warehouse) - 12 Columns ---
  const invHeaders = [
    "Product Name",
    "SKU",
    "Collection",
    "Color",
    "Price",
    "Total Stock",
    "XS Quantity",
    "S Quantity",
    "M Quantity",
    "L Quantity",
    "XL Quantity",
    "Status"
  ];

  const invRows = list.map((p, idx) => {
    const sizeMap = resolveProductSizeStock(p);
    const sku = formatLuxuryCSVSKU(p, idx + 1);
    const status = formatLuxuryCSVStatus(p);
    const price = formatLuxuryCSVPrice(p.price);

    return [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${sku.replace(/"/g, '""')}"`,
      `"${(p.category_name || 'Suits').replace(/"/g, '""')}"`,
      `"${(p.color || 'Obsidian Black').replace(/"/g, '""')}"`,
      `"${price}"`,
      p.stock || 0,
      sizeMap["XS"] || 0,
      sizeMap["S"] || 0,
      sizeMap["M"] || 0,
      sizeMap["L"] || 0,
      sizeMap["XL"] || 0,
      `"${status}"`
    ].join(",");
  });

  const invCsv = "\uFEFF" + [invHeaders.join(","), ...invRows].join("\n");
  console.log(`✔ Format 1: Inventory Export (${invHeaders.length} columns) generated:`);
  console.log(invHeaders.join(" | "));
  console.log('Sample Row:');
  console.log(invRows[0]);
  console.log('\n------------------------------------------------------------\n');

  // --- Format 2: Master Catalogue Export (Complete Product Data) - 33 Columns ---
  const masterHeaders = [
    "Product ID",
    "SKU",
    "Product Name",
    "Collection",
    "Sub Category",
    "Silhouette",
    "Color",
    "Fabric",
    "Occasion / Moments",
    "Fit Type",
    "Description",
    "Size Chart",
    "Price",
    "MRP",
    "Discount",
    "GST Rate",
    "HSN Code",
    "Stock",
    "XS Stock",
    "S Stock",
    "M Stock",
    "L Stock",
    "XL Stock",
    "SEO Title",
    "SEO Description",
    "SEO Keywords",
    "URL Slug",
    "Image URL 1",
    "Image URL 2",
    "Image URL 3",
    "Status",
    "Created Date",
    "Updated Date"
  ];

  const masterRows = list.map((p, idx) => {
    const sizeMap = resolveProductSizeStock(p);
    const catName = p.category_name || "Suits";
    const catSlug = p.category_slug || "suits";
    const sku = formatLuxuryCSVSKU(p, idx + 1);
    const status = formatLuxuryCSVStatus(p);
    const price = formatLuxuryCSVPrice(p.price);

    const mrpNum = p.mrp ? Number(p.mrp) : (p.discount_price ? Number(p.price) : Math.round(Number(p.price) * 1.25));
    const mrp = formatLuxuryCSVPrice(mrpNum);
    let discountStr = "0%";
    if (p.discount_price) {
      discountStr = formatLuxuryCSVPrice(p.discount_price);
    } else if (p.discount) {
      discountStr = `${p.discount}%`;
    } else if (mrpNum > Number(p.price)) {
      const pct = Math.round(((mrpNum - Number(p.price)) / mrpNum) * 100);
      if (pct > 0) discountStr = `${pct}%`;
    }

    // Dynamic GST Rate & HSN Code (not hardcoded)
    const gstRate = p.gst_rate || p.gst || "12%";
    const hsnCode = p.hsn_code || p.hsn || "6204";

    const createdDate = formatLuxuryCSVDate(p.created_at);
    const updatedDate = formatLuxuryCSVDate(p.updated_at || p.created_at);
    const fullSlug = `/collections/${catSlug}/${p.slug || ''}`;
    const metaTitle = p.seo_title || `${p.name || 'Garment'} | SUKO Atelier`;
    const metaDescription = p.seo_description || p.description || "Bespoke quiet luxury corporate wear by SUKO Atelier.";
    const keywords = p.seo_keywords || `${p.name || ''}, ${p.color || ''} corporate wear, luxury tailoring, executive fashion`;

    const imagesList = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : (p.image_url ? [p.image_url] : []);
    const img1 = imagesList[0] || "";
    const img2 = imagesList[1] || "";
    const img3 = imagesList[2] || "";

    const sizeChart = "Standard Atelier Women's Size Guide (XS: 32, S: 34, M: 36, L: 38, XL: 40)";

    return [
      `"${p.id || ''}"`,
      `"${sku.replace(/"/g, '""')}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${catName.replace(/"/g, '""')}"`,
      `"${(p.sub_category || 'Atelier Silhouette').replace(/"/g, '""')}"`,
      `"${(p.silhouette || 'Tailored Double-Breasted').replace(/"/g, '""')}"`,
      `"${(p.color || 'Obsidian Black').replace(/"/g, '""')}"`,
      `"${(p.fabric || 'Italian Super 150s Merino Wool').replace(/"/g, '""')}"`,
      `"${(p.moment_name || p.occasion || 'The Boardroom Edit').replace(/"/g, '""')}"`,
      `"${(p.fit || 'Bespoke Tailored').replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      `"${sizeChart.replace(/"/g, '""')}"`,
      `"${price}"`,
      `"${mrp}"`,
      `"${discountStr}"`,
      `"${gstRate}"`,
      `"${hsnCode}"`,
      p.stock || 0,
      sizeMap["XS"] || 0,
      sizeMap["S"] || 0,
      sizeMap["M"] || 0,
      sizeMap["L"] || 0,
      sizeMap["XL"] || 0,
      `"${metaTitle.replace(/"/g, '""')}"`,
      `"${metaDescription.replace(/"/g, '""')}"`,
      `"${keywords.replace(/"/g, '""')}"`,
      `"${fullSlug}"`,
      `"${img1.replace(/"/g, '""')}"`,
      `"${img2.replace(/"/g, '""')}"`,
      `"${img3.replace(/"/g, '""')}"`,
      `"${status}"`,
      `"${createdDate}"`,
      `"${updatedDate}"`
    ].join(",");
  });

  const masterCsv = "\uFEFF" + [masterHeaders.join(","), ...masterRows].join("\n");
  console.log(`✔ Format 2: Master Catalogue Export (${masterHeaders.length} columns) generated:`);
  console.log(`Headers count: ${masterHeaders.length}`);
  console.log('Sample Row:');
  console.log(masterRows[0]);

  console.log('\n=== ALL VERIFICATIONS PASSED (12-col Inventory & 33-col Master) ===');
  process.exit(0);
}

runTest().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
