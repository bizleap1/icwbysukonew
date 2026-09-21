const express = require("express");
const router = express.Router();
const productService = require("../services/productService");

const DOMAIN = "https://www.indiancorporatewear.com";

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(dateInput) {
  if (!dateInput) return new Date().toISOString();
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// Baseline verified active catalog (ensures minimum 44 URLs are always served)
const BASELINE_PRODUCTS = [
  { slug: "midnight-longline-tailored-set-miba", updated_at: "2026-09-19T11:09:20.403Z" },
  { slug: "lilac-vest-suit-3vrn", updated_at: "2026-09-19T09:29:24.118Z" },
  { slug: "plum-long-blazer-y2nz", updated_at: "2026-09-19T11:01:41.825Z" },
  { slug: "pink-pleated-suit-f8n2", updated_at: "2026-09-19T11:05:47.421Z" },
  { slug: "lavender-embroidered-suit-891o", updated_at: "2026-09-19T11:05:27.792Z" },
  { slug: "crimson-double-breasted-suit-1gin", updated_at: "2026-09-19T11:10:28.918Z" },
  { slug: "lavender-contrast-power-suit-ve5e", updated_at: "2026-09-19T11:06:01.118Z" },
  { slug: "aubergine-pleated-flare-set-l6zp", updated_at: "2026-09-19T11:06:22.477Z" },
  { slug: "plum-pleated-vest-co-ord-63r7", updated_at: "2026-09-19T11:06:51.559Z" },
  { slug: "pleated-wrap-co-ord-set-wkn1", updated_at: "2026-09-19T11:07:12.627Z" },
  { slug: "fuchsia-tailored-vest-set-gl5l", updated_at: "2026-09-19T11:07:29.612Z" },
  { slug: "noir-bloom-co-ord-set-4m32", updated_at: "2026-09-19T11:08:02.409Z" },
  { slug: "navy-bloom-co-ord-set-dryu", updated_at: "2026-09-19T11:08:23.077Z" },
  { slug: "satin-sleeve-power-suit-qv9j", updated_at: "2026-09-19T09:23:32.785Z" },
  { slug: "ivory-contrast-tailored-suit-04cn", updated_at: "2026-09-19T11:08:37.039Z" },
  { slug: "noir-sculpted-vest-set", updated_at: "2026-09-18T21:00:32.948Z" },
  { slug: "the-dusty-rose-embroidered-farchi-set", updated_at: "2026-09-18T06:42:05.208Z" },
  { slug: "the-aubergine-draped-set", updated_at: "2026-09-18T20:51:05.736Z" },
  { slug: "the-midnight-sculpted-vest-set", updated_at: "2026-09-18T17:57:04.808Z" },
  { slug: "the-aubergine-tailored-suit", updated_at: "2026-09-18T20:59:42.989Z" },
  { slug: "the-lilac-flare-suit", updated_at: "2026-09-18T20:59:56.778Z" },
  { slug: "the-aubergine-tailored-wide-leg-trousers", updated_at: "2026-09-19T10:49:12.079Z" },
  { slug: "the-noir-tailored-trousers", updated_at: "2026-09-19T10:51:12.670Z" },
  { slug: "the-noir-tailored-suit", updated_at: "2026-09-18T20:53:11.188Z" },
  { slug: "the-midnight-column-skirt", updated_at: "2026-09-19T10:50:26.642Z" },
  { slug: "the-midnight-flare-skirt", updated_at: "2026-09-19T10:51:33.436Z" },
  { slug: "the-midnight-peplum-set", updated_at: "2026-09-18T20:53:24.929Z" },
  { slug: "the-aubergine-tailored-mini-skirt", updated_at: "2026-09-19T10:51:45.234Z" },
  { slug: "the-plum-sculpted-trousers", updated_at: "2026-09-19T10:51:58.415Z" },
  { slug: "the-plum-sculpted-suit", updated_at: "2026-09-18T21:01:37.768Z" }
];

// Build standard XML sitemap
async function buildSitemapXml() {
  let products = [];
  try {
    products = await productService.getAllProducts({ includeArchived: false });
  } catch (err) {
    console.error("[Sitemap] Failed to load products from DB, using baseline:", err.message);
  }

  const now = new Date().toISOString();
  const urlEntries = [];

  // 1. Core High-Priority Public Canonical Pages
  const staticRoutes = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/collection", priority: "0.9", changefreq: "daily" },
    { path: "/new-in", priority: "0.9", changefreq: "daily" },
    { path: "/shop", priority: "0.8", changefreq: "daily" },
    { path: "/women", priority: "0.8", changefreq: "daily" },
    { path: "/shop-by-moment", priority: "0.8", changefreq: "weekly" },
    { path: "/wardrobe-concierge", priority: "0.7", changefreq: "monthly" },
    { path: "/about", priority: "0.7", changefreq: "monthly" },
    { path: "/contact", priority: "0.6", changefreq: "monthly" },
    { path: "/size-guide", priority: "0.6", changefreq: "monthly" },
    { path: "/shipping", priority: "0.5", changefreq: "monthly" },
    { path: "/returns", priority: "0.5", changefreq: "monthly" },
    { path: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
    { path: "/terms-conditions", priority: "0.3", changefreq: "yearly" }
  ];

  for (const r of staticRoutes) {
    urlEntries.push({
      loc: `${DOMAIN}${r.path}`,
      lastmod: now,
      changefreq: r.changefreq,
      priority: r.priority
    });
  }

  // 2. Active Products: Merge baseline with live fetched products (by slug)
  const productMap = new Map();

  for (const bp of BASELINE_PRODUCTS) {
    productMap.set(bp.slug, { slug: bp.slug, updated_at: bp.updated_at });
  }

  if (Array.isArray(products) && products.length > 0) {
    for (const prod of products) {
      if (!prod || prod.status === "archived" || prod.is_archived) continue;
      const slug = (prod.slug || prod.id || "").trim();
      if (!slug) continue;
      productMap.set(slug, {
        slug,
        updated_at: prod.updated_at || prod.created_at || now
      });
    }
  }

  for (const prod of productMap.values()) {
    urlEntries.push({
      loc: `${DOMAIN}/product/${encodeURIComponent(prod.slug)}`,
      lastmod: formatDate(prod.updated_at),
      changefreq: "weekly",
      priority: "0.8"
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.map(e => `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return { xml, count: urlEntries.length };
}

// GET /sitemap.xml
router.get("/sitemap.xml", async (req, res) => {
  try {
    const { xml } = await buildSitemapXml();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).send(xml);
  } catch (err) {
    console.error("[Sitemap Route] Generation error:", err);
    res.status(500).send("<!-- Failed to generate sitemap -->");
  }
});

// GET /robots.txt
router.get("/robots.txt", (req, res) => {
  const robots = `User-agent: *
Allow: /

# Private and administrative routes
Disallow: /admin
Disallow: /admin/*
Disallow: /auth
Disallow: /account
Disallow: /checkout
Disallow: /orders
Disallow: /wishlist

# Canonical XML Sitemap
Sitemap: ${DOMAIN}/sitemap.xml
`;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.status(200).send(robots);
});

module.exports = { router, buildSitemapXml };
