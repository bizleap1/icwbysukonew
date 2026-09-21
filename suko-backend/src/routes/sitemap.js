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

// Build standard XML sitemap
async function buildSitemapXml() {
  const [products, categories] = await Promise.all([
    productService.getAllProducts({ includeArchived: false }).catch(err => {
      console.error("[Sitemap] Failed to load products:", err.message);
      return [];
    }),
    productService.getAllCategories({ includeArchived: false }).catch(err => {
      console.error("[Sitemap] Failed to load categories:", err.message);
      return [];
    })
  ]);

  const now = new Date().toISOString();
  const urlEntries = [];

  // 1. Core High-Priority Public Pages
  const staticRoutes = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/collection", priority: "0.9", changefreq: "daily" },
    { path: "/shop", priority: "0.9", changefreq: "daily" },
    { path: "/new-in", priority: "0.9", changefreq: "daily" },
    { path: "/women", priority: "0.8", changefreq: "daily" },
    { path: "/shop-by-moment", priority: "0.8", changefreq: "weekly" },

    // Curated Moments
    { path: "/moment/the-boardroom-edit", priority: "0.7", changefreq: "weekly" },
    { path: "/moment/the-executive-essentials", priority: "0.7", changefreq: "weekly" },
    { path: "/moment/the-founder-edit", priority: "0.7", changefreq: "weekly" },
    { path: "/moment/the-presentation-edit", priority: "0.7", changefreq: "weekly" },
    { path: "/moment/the-after-hours-executive", priority: "0.7", changefreq: "weekly" },

    // Brand, Concierge & Customer Trust Pages
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

  // 2. Active Collections / Categories
  const categorySlugs = new Set(["suits", "separates", "coords", "signatures"]);
  if (Array.isArray(categories)) {
    for (const cat of categories) {
      if (cat && !cat.is_archived && cat.slug) {
        categorySlugs.add(cat.slug.toLowerCase().trim());
      }
    }
  }

  for (const slug of categorySlugs) {
    urlEntries.push({
      loc: `${DOMAIN}/collection/${encodeURIComponent(slug)}`,
      lastmod: now,
      changefreq: "weekly",
      priority: "0.8"
    });
  }

  // 3. Active Products from Database
  if (Array.isArray(products)) {
    for (const prod of products) {
      if (!prod || prod.status === "archived" || prod.is_archived) continue;
      const slug = prod.slug || prod.id;
      if (!slug) continue;

      urlEntries.push({
        loc: `${DOMAIN}/product/${encodeURIComponent(slug)}`,
        lastmod: formatDate(prod.updated_at || prod.created_at),
        changefreq: "weekly",
        priority: "0.8"
      });
    }
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
