// Single source of truth for SEO metadata and structured data.
// Used by scripts/prerender.mjs (build time, Node) AND src/components/SEO.jsx (browser),
// so the HTML crawlers see first always matches what the page sets after JavaScript runs.
// Pure functions only: no DOM, no Node APIs.

export const SITE_URL = "https://www.indiancorporatewear.com";
export const SITE_NAME = "SUKO";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og/suko-default-1200x630.jpg`;
export const LOGO_URL = `${SITE_URL}/logo.png`;
export const INSTAGRAM_URL = "https://www.instagram.com/icwbysuko";
export const TELEPHONE = "+91-93703-50885";
export const BRAND_DESCRIPTION =
  "SUKO designs premium corporate wear for Indian women, including tailored power suits, blazers, co-ords and separates.";

// TODO(business): confirm preferred public brand name + alternate names before relying on these.
export const ALTERNATE_NAMES = ["SUKO Atelier", "Indian Corporate Wear by SUKO", "ICW by SUKO"];

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

// Routes that must never be indexed (account / transactional / admin surfaces).
export const NOINDEX_PREFIXES = ["/admin", "/auth", "/account", "/checkout", "/orders", "/wishlist"];

export const isNoindexPath = (pathname = "") =>
  NOINDEX_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export const normalizePath = (pathname = "/") => {
  let p = String(pathname || "/").split("?")[0].split("#")[0];
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
};

export const absoluteUrl = (pathOrUrl = "/") =>
  /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const stripHtml = (s = "") => String(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

// Shorten text to fit `max` characters without ending mid-phrase: prefer the last comma/semicolon,
// otherwise the last word, and never end on a dangling connector like "and" / "with" / "a".
const DANGLING = /\s+(?:and|or|with|a|an|the|of|in|for|to|on|at|by|from|that|which|its|is|are)$/i;
export const fitText = (text, max) => {
  const t = stripHtml(text);
  if (t.length <= max) return t;
  let cut = t.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(" ");
  cut = cut.slice(0, lastSpace > 0 ? lastSpace : max);
  const lastBreak = Math.max(cut.lastIndexOf(","), cut.lastIndexOf(";"));
  if (lastBreak > max * 0.55) cut = cut.slice(0, lastBreak);
  cut = cut.replace(/[\s,;:\-–—]+$/, "");
  while (DANGLING.test(cut)) cut = cut.replace(DANGLING, "").replace(/[\s,;:\-–—]+$/, "");
  return cut;
};

/* ----------------------------- Catalogue stats ---------------------------- */

export const catalogueStats = (products = []) => {
  const prices = products.map((p) => Number(p.price)).filter((n) => Number.isFinite(n) && n > 0);
  return {
    count: products.length,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
  };
};

/* ------------------------------ Static pages ------------------------------ */

const collectionDescription = (stats) => {
  if (stats && stats.count && stats.minPrice) {
    return fitText(
      `Shop ${stats.count} tailored pieces: power suits, blazers, vests, trousers and skirts for office and boardroom. Prices from ${inr(stats.minPrice)}. Delivery across India.`,
      155
    );
  }
  return "Shop tailored power suits, blazers, vests, trousers and skirts for office and boardroom. Delivery across India.";
};

const collectionIntro = (stats) => {
  if (stats && stats.count && stats.minPrice && stats.maxPrice) {
    return `SUKO makes tailored corporate wear for Indian women: ${stats.count} pieces across power suits, blazers, co-ords, trousers and skirts, priced ${inr(stats.minPrice)}–${inr(stats.maxPrice)} and delivered across India.`;
  }
  return "SUKO makes tailored corporate wear for Indian women: power suits, blazers, co-ords, trousers and skirts, delivered across India.";
};

// Title / description / H1 follow the SEO audit (13 Oct 2026). `schemaType` drives JSON-LD.
export const getStaticPageMeta = (rawPath, stats = null) => {
  const path = normalizePath(rawPath);
  switch (path) {
    case "/":
      return {
        path,
        title: "Corporate Wear for Women in India | SUKO",
        description:
          "Tailored power suits, blazers, co-ords and trousers for Indian women leaders. Sizes XS–XL, delivery across India, WhatsApp styling.",
        h1: "Corporate wear for women, tailored in India",
        intro: BRAND_DESCRIPTION,
        schemaType: "WebPage",
      };
    case "/collection":
      return {
        path,
        title: "Women's Formal Suits, Blazers & Co-ords | SUKO",
        description: collectionDescription(stats),
        h1: "Women's corporate wear collection",
        intro: collectionIntro(stats),
        schemaType: "CollectionPage",
        breadcrumb: [["Home", "/"], ["Collection", "/collection"]],
      };
    case "/new-in":
      return {
        path,
        title: "New In: Women's Office Wear | SUKO",
        description:
          "The latest power suits, sculpted blazers and executive co-ords from SUKO. Tailored for Indian workplaces, sizes XS–XL.",
        h1: "New arrivals in women's office wear",
        intro: "The newest tailored pieces from SUKO, made for Indian women in leadership roles.",
        schemaType: "CollectionPage",
        breadcrumb: [["Home", "/"], ["New In", "/new-in"]],
      };
    case "/shop-by-moment":
      return {
        path,
        title: "Shop by Occasion: Boardroom to After-Hours | SUKO",
        description:
          "Outfits picked for presentations, boardroom days, founder meetings and after-hours events. Five edits, styled by SUKO.",
        h1: "Office outfits by occasion",
        intro: "Five SUKO edits, each styled for a different moment in a working woman's week.",
        schemaType: "CollectionPage",
        breadcrumb: [["Home", "/"], ["Shop by Occasion", "/shop-by-moment"]],
      };
    case "/wardrobe-concierge":
      return {
        path,
        title: "Personal Styling for Workwear on WhatsApp | SUKO",
        description:
          "Talk to a SUKO stylist on WhatsApp for sizing, fit and a work wardrobe planned around your role and meetings.",
        h1: "Personal workwear styling",
        intro: "Chat with a SUKO stylist on WhatsApp for help with sizing, fit and building a work wardrobe.",
        schemaType: "WebPage",
        breadcrumb: [["Home", "/"], ["Personal Styling", "/wardrobe-concierge"]],
      };
    case "/about":
      return {
        path,
        title: "About SUKO: Indian Corporate Wear for Women",
        description:
          "Why SUKO exists, who designs it and how each suit is tailored for Indian women in leadership roles.",
        h1: "About SUKO",
        intro: BRAND_DESCRIPTION,
        schemaType: "AboutPage",
        breadcrumb: [["Home", "/"], ["About", "/about"]],
      };
    case "/contact":
      return {
        path,
        title: "Contact SUKO | Corporate Wear for Women in India",
        description:
          "Contact SUKO for sizing help, order questions and styling advice. Chat with us on WhatsApp for the quickest reply.",
        h1: "Customer care & concierge",
        intro: "Reach the SUKO team on WhatsApp for sizing help, order questions and styling advice.",
        schemaType: "ContactPage",
        breadcrumb: [["Home", "/"], ["Contact", "/contact"]],
      };
    case "/size-guide":
      return {
        path,
        title: "Size Guide: Women's Suits, Blazers & Trousers | SUKO",
        description:
          "Find your SUKO size with our measurement guide for women's suits, blazers, trousers and skirts. Need help? Ask on WhatsApp.",
        h1: "Size guide & fit",
        intro: "Use these measurements to choose your SUKO size, or message us on WhatsApp for fit advice.",
        schemaType: "WebPage",
        breadcrumb: [["Home", "/"], ["Size Guide", "/size-guide"]],
      };
    case "/shipping":
      return {
        path,
        title: "Shipping & Delivery Across India | SUKO",
        description:
          "Shipping and delivery information for SUKO women's corporate wear orders across India.",
        h1: "Shipping & delivery",
        intro: "How SUKO delivers your order across India.",
        schemaType: "WebPage",
        breadcrumb: [["Home", "/"], ["Shipping", "/shipping"]],
      };
    case "/returns":
      return {
        path,
        title: "Returns & Size Exchanges | SUKO",
        description:
          "Return and size exchange information for SUKO women's corporate wear orders.",
        h1: "Returns & exchanges",
        intro: "How returns and size exchanges work at SUKO.",
        schemaType: "WebPage",
        breadcrumb: [["Home", "/"], ["Returns", "/returns"]],
      };
    case "/privacy-policy":
      return {
        path,
        title: "Privacy Policy | SUKO",
        description: "How SUKO collects, uses and protects your personal information.",
        h1: "Privacy policy",
        intro: "How SUKO collects, uses and protects your personal information.",
        schemaType: "WebPage",
      };
    case "/terms-conditions":
      return {
        path,
        title: "Terms & Conditions | SUKO",
        description: "The terms and conditions for shopping with SUKO.",
        h1: "Terms & conditions",
        intro: "The terms and conditions for shopping with SUKO.",
        schemaType: "WebPage",
      };
    default:
      return null;
  }
};

export const STATIC_PAGE_PATHS = [
  "/", "/collection", "/new-in", "/shop-by-moment", "/wardrobe-concierge", "/about",
  "/contact", "/size-guide", "/shipping", "/returns", "/privacy-policy", "/terms-conditions",
];

/* -------------------------------- Products -------------------------------- */

const num = (v) => (v === undefined || v === null || v === "" ? NaN : Number(v));

// Sizes the shopper can actually buy (size_stock > 0), else the declared size list.
export const productSizes = (p) => {
  const stock = p.size_stock && typeof p.size_stock === "object" ? p.size_stock : null;
  if (stock && Object.keys(stock).length) {
    const inStock = Object.entries(stock).filter(([, v]) => Number(v) > 0).map(([k]) => k);
    if (inStock.length) return inStock;
  }
  return Array.isArray(p.sizes) ? p.sizes : [];
};

export const productInStock = (p) => {
  const stock = p.size_stock && typeof p.size_stock === "object" ? p.size_stock : null;
  if (stock && Object.keys(stock).length) return Object.values(stock).some((v) => Number(v) > 0);
  if (p.stock !== undefined && p.stock !== null && p.stock !== "") return Number(p.stock) > 0;
  return true;
};

// Short, accurate garment type for titles. Only claims "Suit" when a blazer/jacket/suit is part of the piece.
export const productTypeWord = (p) => {
  const t = `${p.shortType || ""} ${p.setType || ""} ${p.name || ""}`.toLowerCase();
  const hasJacket = /(blazer|jacket|suit)/.test(t);
  const hasBottom = /(trouser|skirt)/.test(t);
  const isSet = /\bset\b|&|piece|co-?ord/.test(t);
  if (/co-?ord/.test(t)) return "Co-ord Set";
  if (hasJacket && (hasBottom || isSet)) return "Suit";
  if (hasJacket) return "Blazer";
  if (/skirt/.test(t) && !isSet) return "Skirt";
  if (/trouser/.test(t) && !isSet) return "Trousers";
  if (/vest/.test(t)) return "Vest Set";
  return "Set";
};

export const productImages = (p) => {
  const list = [];
  const push = (u) => { if (u && typeof u === "string" && u !== "/placeholder.png" && !list.includes(u)) list.push(u); };
  if (Array.isArray(p.gallery)) p.gallery.forEach((g) => push(typeof g === "string" ? g : g && g.url));
  if (Array.isArray(p.images)) p.images.forEach(push);
  push(p.image_url);
  return list;
};

export const productPath = (p) => `/product/${p.slug}`;

export const buildProductMeta = (p) => {
  const name = stripHtml(p.name || "SUKO piece");
  const typeWord = productTypeWord(p);
  let title = new RegExp(typeWord.split(" ")[0], "i").test(name)
    ? `${name} for Women | SUKO`
    : `${name} – Women's ${typeWord} | SUKO`;
  if (title.length > 60) title = `${name} | SUKO`;

  const price = num(p.price);
  const sizes = productSizes(p);
  const sizeText = sizes.length > 1 ? `Sizes ${sizes[0]}–${sizes[sizes.length - 1]}.` : sizes.length === 1 ? `Size ${sizes[0]}.` : "";
  const tail = [Number.isFinite(price) && price > 0 ? `${inr(price)}.` : "", sizeText, "Delivery across India."]
    .filter(Boolean)
    .join(" ");
  const sentences = stripHtml(p.description || "").split(/(?<=[.!?])\s/).filter(Boolean);
  if (!sentences.length) sentences.push(`${name} by SUKO.`);
  const room = 155 - tail.length - 1;
  // Add whole sentences while they fit; if the first one is short, top up with a trimmed second phrase.
  let lead = "";
  for (const sent of sentences) {
    const next = lead ? `${lead} ${sent}` : sent;
    if (next.length <= room) lead = next;
    else {
      if (!lead || room - lead.length > 45) {
        const room2 = lead ? room - lead.length - 1 : room;
        const part = fitText(sent, Math.max(room2, 40));
        if (part && part.length >= 25) lead = lead ? `${lead} ${part}` : part;
      }
      break;
    }
  }
  if (!/[.!?]$/.test(lead)) lead += ".";
  const description = `${lead} ${tail}`.trim();

  const images = productImages(p);
  return {
    path: productPath(p),
    title,
    description,
    h1: name,
    image: images[0] || DEFAULT_OG_IMAGE,
    images,
    sizes,
    price: Number.isFinite(price) ? price : null,
    inStock: productInStock(p),
    typeWord,
  };
};

/* -------------------------------- JSON-LD --------------------------------- */

export const buildSiteGraphNodes = () => [
  {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    alternateName: ALTERNATE_NAMES,
    url: `${SITE_URL}/`,
    logo: { "@type": "ImageObject", url: LOGO_URL },
    description: BRAND_DESCRIPTION,
    contactPoint: { "@type": "ContactPoint", contactType: "customer service", telephone: TELEPHONE, areaServed: "IN" },
    sameAs: [INSTAGRAM_URL],
  },
  {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    inLanguage: "en-IN",
    publisher: { "@id": ORG_ID },
  },
];

const breadcrumbNode = (crumbs, pageUrl) =>
  crumbs && crumbs.length
    ? {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: crumbs.map(([n, p], i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: n,
          item: absoluteUrl(p),
        })),
      }
    : null;

// `imageResolver` lets the build step swap in verified WebP URLs; the browser passes the identity function.
export const buildProductNode = (p, meta, imageResolver = (u) => absoluteUrl(u)) => {
  const url = absoluteUrl(meta.path);
  const node = {
    "@type": "Product",
    "@id": `${url}#product`,
    name: meta.h1,
    description: stripHtml(p.description || "") || meta.description,
    image: meta.images.map(imageResolver),
    sku: p.sku || `SUKO-${String(p.id || p.slug).toUpperCase()}`,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: p.categoryName || "Women's corporate wear",
    offers: {
      "@type": "Offer",
      url,
      price: meta.price,
      priceCurrency: "INR",
      availability: meta.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORG_ID },
    },
  };
  // Only emit fields we actually have. (shippingDetails / hasMerchantReturnPolicy / color are intentionally
  // omitted until the real policies and a consistent colour vocabulary are confirmed by the business.)
  const material = p.fabricCare && p.fabricCare.fabric ? stripHtml(p.fabricCare.fabric) : p.material ? stripHtml(p.material) : "";
  if (material) node.material = material;
  if (meta.sizes && meta.sizes.length) node.size = meta.sizes;
  if (!node.image.length) delete node.image;
  return node;
};

// Returns a full JSON-LD document ({ "@context", "@graph": [...] }) for a route.
export const buildJsonLd = ({ path, pageMeta, product = null, productMeta = null, products = [], imageResolver }) => {
  const graph = buildSiteGraphNodes();
  const url = absoluteUrl(path === "/" ? "/" : path);

  if (product && productMeta) {
    graph.push({
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: productMeta.title,
      isPartOf: { "@id": WEBSITE_ID },
      inLanguage: "en-IN",
      primaryImageOfPage: undefined,
    });
    graph.push(buildProductNode(product, productMeta, imageResolver));
    graph.push(
      breadcrumbNode(
        [["Home", "/"], ["Collection", "/collection"], [productMeta.h1, productMeta.path]],
        url
      )
    );
  } else if (pageMeta) {
    const page = {
      "@type": pageMeta.schemaType || "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: pageMeta.title,
      description: pageMeta.description,
      isPartOf: { "@id": WEBSITE_ID },
      inLanguage: "en-IN",
    };
    if (pageMeta.schemaType === "AboutPage" || pageMeta.schemaType === "ContactPage") {
      page.mainEntity = { "@id": ORG_ID };
    }
    graph.push(page);
    const bc = breadcrumbNode(pageMeta.breadcrumb, url);
    if (bc) graph.push(bc);
    if (pageMeta.path === "/collection" && products.length) {
      graph.push({
        "@type": "ItemList",
        "@id": `${url}#itemlist`,
        name: pageMeta.h1,
        numberOfItems: products.length,
        itemListElement: products.map((pr, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: absoluteUrl(productPath(pr)),
          name: stripHtml(pr.name || ""),
        })),
      });
    }
  }

  const clean = JSON.parse(JSON.stringify(graph.filter(Boolean)));
  return { "@context": "https://schema.org", "@graph": clean };
};
