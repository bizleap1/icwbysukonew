#!/usr/bin/env node
/**
 * SEO pre-render step. Runs automatically after `npm run build` (via the "postbuild" npm script).
 *
 * For every indexable route it writes a static HTML file containing the correct <title>, meta description,
 * canonical, Open Graph / Twitter tags, JSON-LD and a crawlable content block (H1, text, links) so that
 * crawlers that do not run JavaScript still see real content. React replaces the static block on load.
 *
 * Also writes: build/sitemap.xml, build/404.html (noindex, real 404 via nginx) and build/app-shell.html
 * (generic noindex shell used for private/app-only routes such as /checkout and /admin).
 *
 * Product list source (first that works):
 *   1. PRERENDER_PRODUCTS_FILE  - path to a JSON array (used for local testing)
 *   2. PRERENDER_API            - e.g. https://www.indiancorporatewear.com/api/products (default: live site API)
 *
 * The build FAILS (and writes nothing) if the product list cannot be loaded or looks too small, so a
 * broken/stale catalogue can never silently ship and cause live products to 404.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE, STATIC_PAGE_PATHS,
  getStaticPageMeta, buildProductMeta, buildJsonLd, catalogueStats, absoluteUrl, productPath,
} from "../src/seo/seoMeta.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUILD = path.resolve(ROOT, process.env.PRERENDER_BUILD_DIR || "build");
const API = (process.env.PRERENDER_API || `${SITE_URL}/api/products`).trim();
const MIN_PRODUCTS = Number(process.env.PRERENDER_MIN_PRODUCTS || 20);

const fail = (msg) => {
  console.error(`\n[prerender] FAILED: ${msg}\n[prerender] The build folder was left as a plain app build. Do NOT deploy it with the new nginx config.\n`);
  process.exit(1);
};

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const jsonForHtml = (obj) => JSON.stringify(obj).replace(/</g, "\\u003c").replace(/\u2028|\u2029/g, "");

/* ------------------------------ Load products ------------------------------ */

async function loadProducts() {
  let raw;
  if (process.env.PRERENDER_PRODUCTS_FILE) {
    raw = JSON.parse(fs.readFileSync(path.resolve(ROOT, process.env.PRERENDER_PRODUCTS_FILE), "utf8"));
    console.log(`[prerender] Products from file: ${process.env.PRERENDER_PRODUCTS_FILE}`);
  } else {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(API, { signal: ctrl.signal, headers: { Accept: "application/json" } });
      if (!res.ok) fail(`Product API ${API} answered HTTP ${res.status}.`);
      raw = await res.json();
      console.log(`[prerender] Products from API: ${API}`);
    } catch (e) {
      fail(`Could not fetch products from ${API} (${e.message}). Set PRERENDER_API to a reachable URL.`);
    } finally {
      clearTimeout(timer);
    }
  }
  const list = Array.isArray(raw) ? raw : Array.isArray(raw && raw.products) ? raw.products : null;
  if (!list) fail("Product source did not return a JSON array.");
  const blocked = new Set(["archived", "draft", "inactive", "deleted"]);
  const seen = new Set();
  const products = list.filter((p) => {
    if (!p || !p.slug || !p.name) return false;
    if (p.is_archived) return false;
    if (blocked.has(String(p.status || "active").toLowerCase())) return false;
    if (seen.has(p.slug)) return false;
    seen.add(p.slug);
    return true;
  });
  if (products.length < MIN_PRODUCTS) {
    fail(`Only ${products.length} usable products found (minimum ${MIN_PRODUCTS}). Refusing to continue so live products don't get dropped.`);
  }
  return products;
}

/* ------------------------------ HTML helpers ------------------------------ */

const NAV = [
  ["New Arrivals", "/new-in"], ["Collection", "/collection"], ["Shop by Occasion", "/shop-by-moment"],
  ["Personal Styling", "/wardrobe-concierge"], ["About SUKO", "/about"],
];
const FOOT = [
  ["Size Guide", "/size-guide"], ["Shipping", "/shipping"], ["Returns & Exchanges", "/returns"],
  ["Contact", "/contact"], ["Privacy Policy", "/privacy-policy"], ["Terms & Conditions", "/terms-conditions"],
];
const linkList = (items) => items.map(([n, p]) => `<a href="${esc(p)}">${esc(n)}</a>`).join(" · ");

const STATIC_CSS =
  "#seo-static{font-family:Georgia,'Times New Roman',serif;max-width:920px;margin:0 auto;padding:28px 20px;color:#111113;background:#FAF8F5;line-height:1.6}" +
  "#seo-static a{color:#111113}#seo-static nav,#seo-static footer{font-size:14px;margin:12px 0}#seo-static h1{font-weight:400;font-size:32px;line-height:1.2}" +
  "#seo-static ul{padding-left:18px}";

function cleanHead(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+name=["']robots["'][^>]*>\s*/gi, "")
    .replace(/<meta\s+(?:property|name)=["'](?:og|twitter):[^"']*["'][^>]*>\s*/gi, "")
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<link\s+rel=["']preload["'][^>]*as=["']video["'][^>]*>\s*/gi, "")
    .replace(/<script[^>]*id=["']suko-schema["'][\s\S]*?<\/script>\s*/gi, "")
    .replace(/<style[^>]*id=["']seo-static-css["'][\s\S]*?<\/style>\s*/gi, "");
}

function renderPage(template, { routePath, title, description, canonical, robots, ogType, image, jsonLd, body }) {
  let html = cleanHead(template).replace(/<html[^>]*>/i, '<html lang="en-IN">');
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="${esc(robots)}" />`,
    canonical ? `<link rel="canonical" href="${esc(canonical)}" />` : "",
    `<meta property="og:locale" content="en_IN" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="${esc(ogType || "website")}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    canonical ? `<meta property="og:url" content="${esc(canonical)}" />` : "",
    `<meta property="og:image" content="${esc(image)}" />`,
    image === DEFAULT_OG_IMAGE ? `<meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />` : "",
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<style id="seo-static-css">${STATIC_CSS}</style>`,
    jsonLd ? `<script type="application/ld+json" id="suko-schema" data-route="${esc(routePath)}">${jsonForHtml(jsonLd)}</script>` : "",
  ].filter(Boolean).join("\n    ");
  html = html.replace(/<\/head>/i, `    ${tags}\n    </head>`);
  html = html.replace(/<div id="root">\s*<\/div>/i, `<div id="root">${body}</div>`);
  if (!html.includes("seo-static")) fail(`Could not inject content into #root for ${routePath} (unexpected index.html layout).`);
  return html;
}

const shell = (inner) =>
  `<div id="seo-static" data-seo-static="1"><header><nav aria-label="Primary">${linkList(NAV)}</nav></header><main>${inner}</main>` +
  `<footer><nav aria-label="Footer">${linkList(FOOT)}</nav></footer></div>`;

const crumbs = (list) =>
  list && list.length
    ? `<nav aria-label="Breadcrumb">${list.map(([n, p], i) => (i === list.length - 1 ? `<span>${esc(n)}</span>` : `<a href="${esc(p)}">${esc(n)}</a>`)).join(" › ")}</nav>`
    : "";

const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

function productList(products) {
  return `<ul>${products.map((p) => `<li><a href="${esc(productPath(p))}">${esc(p.name)}</a>${p.price ? ` — ${esc(money(p.price))}` : ""}</li>`).join("")}</ul>`;
}

/* ---------------------------------- Main ---------------------------------- */

async function main() {
  if (!fs.existsSync(path.join(BUILD, "index.html"))) fail(`No ${BUILD}/index.html. Run the React build first.`);

  // Keep a pristine copy of the app shell so re-running never double-injects.
  const pristinePath = path.join(BUILD, ".app-shell.pristine.html");
  let template = fs.readFileSync(path.join(BUILD, "index.html"), "utf8");
  if (template.includes('data-seo-static="1"')) {
    if (!fs.existsSync(pristinePath)) fail("build/index.html is already pre-rendered and no pristine copy exists. Re-run `npm run build`.");
    template = fs.readFileSync(pristinePath, "utf8");
  } else {
    fs.writeFileSync(pristinePath, template);
  }

  const products = await loadProducts();
  const stats = catalogueStats(products);
  console.log(`[prerender] ${products.length} products, price range ${stats.minPrice}–${stats.maxPrice}`);

  // Prefer verified WebP derivatives that exist in the build folder.
  const exists = (rel) => fs.existsSync(path.join(BUILD, rel.replace(/^\//, "")));
  const webpFor = (url, preferred) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    const m = url.match(/^(\/products\/.+?)\.(png|jpe?g|webp)$/i);
    if (m) {
      for (const suffix of preferred) {
        const cand = `${m[1]}${suffix}.webp`;
        if (exists(cand)) return absoluteUrl(cand);
      }
    }
    return absoluteUrl(url);
  };
  const schemaImage = (u) => webpFor(u, ["-800w", ""]);
  const shareImage = (u) => webpFor(u, ["-1200w", "-800w", ""]);

  const written = [];
  const writeRoute = (routePath, html) => {
    const file = routePath === "/" ? path.join(BUILD, "index.html") : path.join(BUILD, routePath.replace(/^\//, ""), "index.html");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
    written.push(routePath);
  };

  // 1) Static pages
  for (const p of STATIC_PAGE_PATHS) {
    const meta = getStaticPageMeta(p, stats);
    const canonical = absoluteUrl(p === "/" ? "/" : p);
    const withProducts = p === "/" || p === "/collection" || p === "/new-in";
    const body = shell(
      `${crumbs(meta.breadcrumb)}<h1>${esc(meta.h1)}</h1><p>${esc(meta.intro)}</p>` +
        (withProducts ? `<h2>${p === "/" ? "Shop the collection" : "Pieces"}</h2>${productList(products)}` : "")
    );
    writeRoute(p, renderPage(template, {
      routePath: p, title: meta.title, description: meta.description, canonical,
      robots: "index,follow,max-image-preview:large", ogType: "website", image: DEFAULT_OG_IMAGE,
      jsonLd: buildJsonLd({ path: p, pageMeta: meta, products: p === "/collection" ? products : [] }), body,
    }));
  }

  // 2) Product pages
  for (const prod of products) {
    const meta = buildProductMeta(prod);
    const canonical = absoluteUrl(meta.path);
    const fc = prod.fabricCare || prod.fabric_care || {};
    const details = [
      meta.price ? `<p><strong>${esc(money(meta.price))}</strong>${meta.inStock ? "" : " — currently sold out"}</p>` : "",
      meta.sizes.length ? `<p>Available sizes: ${esc(meta.sizes.join(", "))}</p>` : "",
      fc.fabric ? `<p>Fabric: ${esc(fc.fabric)}</p>` : "",
      fc.care ? `<p>Care: ${esc(fc.care)}</p>` : "",
    ].join("");
    const body = shell(
      `${crumbs([["Home", "/"], ["Collection", "/collection"], [meta.h1, meta.path]])}<h1>${esc(meta.h1)}</h1>` +
        `<p>${esc(String(prod.description || meta.description).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim())}</p>${details}`
    );
    writeRoute(meta.path, renderPage(template, {
      routePath: meta.path, title: meta.title, description: meta.description, canonical,
      robots: "index,follow,max-image-preview:large", ogType: "product", image: shareImage(meta.images[0]) || DEFAULT_OG_IMAGE,
      jsonLd: buildJsonLd({ path: meta.path, product: prod, productMeta: meta, imageResolver: schemaImage }), body,
    }));
  }

  // 3) 404 page (served by nginx with a real 404 status) - noindex, no canonical
  fs.writeFileSync(
    path.join(BUILD, "404.html"),
    renderPage(template, {
      routePath: "/404", title: "Page Not Found | SUKO",
      description: "The page you are looking for could not be found. Explore SUKO corporate wear for women.",
      canonical: null, robots: "noindex,follow", ogType: "website", image: DEFAULT_OG_IMAGE, jsonLd: null,
      body: shell(`<h1>Page not found</h1><p>The page or piece you are looking for does not exist or has moved.</p><p><a href="/collection">Browse the collection</a> or <a href="/">return home</a>.</p>`),
    })
  );

  // 4) Generic noindex shell for private / app-only routes (/checkout, /auth, /account, /orders, /wishlist, /admin)
  fs.writeFileSync(
    path.join(BUILD, "app-shell.html"),
    cleanHead(template).replace(/<html[^>]*>/i, '<html lang="en-IN">').replace(
      /<\/head>/i,
      `    <title>SUKO</title>\n    <meta name="robots" content="noindex,nofollow" />\n    </head>`
    )
  );

  // 5) sitemap.xml - only indexable canonical URLs; lastmod only where a real date exists
  const urls = [
    ...STATIC_PAGE_PATHS.map((p) => ({ loc: absoluteUrl(p === "/" ? "/" : p) })),
    ...products.map((p) => {
      const d = p.updated_at ? new Date(p.updated_at) : null;
      return { loc: absoluteUrl(productPath(p)), lastmod: d && !isNaN(d) ? d.toISOString() : null };
    }),
  ];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n") +
    `\n</urlset>\n`;
  fs.writeFileSync(path.join(BUILD, "sitemap.xml"), xml);

  console.log(`[prerender] Wrote ${written.length} pages, 404.html, app-shell.html and sitemap.xml (${urls.length} URLs).`);
}

main().catch((e) => fail(e.stack || e.message));
