// api/sitemap.js -- Vercel Serverless Function for dynamic sitemap generation
const DOMAIN = "https://www.indiancorporatewear.com";
const BACKEND_BASE = (process.env.API_BASE_URL || process.env.REACT_APP_API_URL || "https://icwbysukonew.onrender.com").replace(/\/$/, "");

// XML escape helper
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

// In-memory cache for fast edge container reuse
let cachedSitemapXml = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory

function buildXmlFromData(products = [], categories = []) {
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

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.map(e => `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join("\n")}
</urlset>`;
}

module.exports = async function handler(req, res) {
  // Return cached version if fresh
  const now = Date.now();
  if (cachedSitemapXml && now - lastFetchTime < CACHE_TTL_MS) {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(cachedSitemapXml);
  }

  try {
    // Primary: Fetch live active products & categories from backend API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const [prodsRes, catsRes] = await Promise.all([
      fetch(`${BACKEND_BASE}/api/products`, { signal: controller.signal })
        .then(r => r.ok ? r.json() : [])
        .catch(() => []),
      fetch(`${BACKEND_BASE}/api/categories`, { signal: controller.signal })
        .then(r => r.ok ? r.json() : [])
        .catch(() => [])
    ]);
    clearTimeout(timeoutId);

    const xml = buildXmlFromData(prodsRes, catsRes);
    cachedSitemapXml = xml;
    lastFetchTime = now;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(xml);
  } catch (err) {
    console.error("[Vercel Sitemap Function] Error:", err.message);
    // Strategy 3: Graceful fallback with static catalogue structure if network fails completely
    const fallbackXml = cachedSitemapXml || buildXmlFromData([], []);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
    return res.status(200).send(fallbackXml);
  }
};
