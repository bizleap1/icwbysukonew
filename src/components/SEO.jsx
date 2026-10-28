import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useProducts } from "../context/ProductContext";
import {
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  BRAND_DESCRIPTION,
  absoluteUrl,
  normalizePath,
  isNoindexPath,
  getStaticPageMeta,
  buildProductMeta,
  buildJsonLd,
  catalogueStats,
} from "../seo/seoMeta.mjs";

/*
  Runtime SEO. Titles, descriptions, canonicals and structured data come from src/seo/seoMeta.mjs,
  the same module scripts/prerender.mjs uses at build time, so what crawlers see in the raw HTML
  and what this component sets after JavaScript runs are identical.
*/

const DEFAULT_TITLE = "Corporate Wear for Women in India | SUKO";

const setMeta = (selector, attr, value) => {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    const m = selector.match(/\[(.*?)=['"](.*?)['"]\]/);
    if (m) el.setAttribute(m[1], m[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

export const SEO = ({
  title,
  description,
  image,
  canonicalUrl,
  type = "website",
  productData = null,
  noindex = false,
}) => {
  const location = useLocation();
  const productsCtx = useProducts();
  const products = productsCtx && Array.isArray(productsCtx.products) ? productsCtx.products : null;

  useEffect(() => {
    const pathname = normalizePath(location.pathname);
    const isPrivate = noindex || isNoindexPath(pathname);
    const active = (products || []).filter(
      (p) => p && p.slug && !p.is_archived && String(p.status || "active").toLowerCase() !== "archived"
    );
    const stats = catalogueStats(active);

    const productMeta = productData && pathname.startsWith("/product/") ? buildProductMeta(productData) : null;
    const staticMeta = productMeta ? null : getStaticPageMeta(pathname, stats);

    let fullTitle;
    let desc;
    let ogImage = DEFAULT_OG_IMAGE;
    let ogType = type;

    if (productMeta) {
      fullTitle = productMeta.title;
      desc = productMeta.description;
      ogImage = absoluteUrl(productMeta.image);
      ogType = "product";
    } else if (staticMeta) {
      fullTitle = staticMeta.title;
      desc = staticMeta.description;
    } else {
      const t = (title || "").trim();
      fullTitle = !t ? DEFAULT_TITLE : /suko/i.test(t) ? t : `${t} | ${SITE_NAME}`;
      desc = (description || BRAND_DESCRIPTION).trim();
      if (image) ogImage = absoluteUrl(image);
    }

    document.title = fullTitle;
    setMeta("meta[name='description']", "content", desc);
    setMeta(
      "meta[name='robots']",
      "content",
      isPrivate ? "noindex,nofollow" : "index,follow,max-image-preview:large"
    );

    const canonicalHref = canonicalUrl || absoluteUrl(pathname === "/" ? "/" : pathname);

    setMeta("meta[property='og:locale']", "content", "en_IN");
    setMeta("meta[property='og:site_name']", "content", SITE_NAME);
    setMeta("meta[property='og:type']", "content", ogType);
    setMeta("meta[property='og:title']", "content", fullTitle);
    setMeta("meta[property='og:description']", "content", desc);
    setMeta("meta[property='og:image']", "content", ogImage);
    setMeta("meta[name='twitter:card']", "content", "summary_large_image");
    setMeta("meta[name='twitter:title']", "content", fullTitle);
    setMeta("meta[name='twitter:description']", "content", desc);
    setMeta("meta[name='twitter:image']", "content", ogImage);

    let canonical = document.querySelector("link[rel='canonical']");
    if (isPrivate) {
      if (canonical) canonical.remove();
      const og = document.querySelector("meta[property='og:url']");
      if (og) og.remove();
    } else {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalHref;
      setMeta("meta[property='og:url']", "content", canonicalHref);
    }

    // Structured data. On first load of a pre-rendered page the correct JSON-LD is already in the HTML
    // (data-route matches), so keep it. Otherwise (client-side navigation) rebuild it.
    const existing = document.getElementById("suko-schema");
    if (existing && existing.getAttribute("data-route") === (pathname === "/" ? "/" : pathname)) return;
    if (existing) existing.remove();
    if (isPrivate) return;

    const ld = buildJsonLd({
      path: pathname,
      pageMeta: staticMeta,
      product: productMeta ? productData : null,
      productMeta,
      products: pathname === "/collection" ? active : [],
    });
    const script = document.createElement("script");
    script.id = "suko-schema";
    script.type = "application/ld+json";
    script.setAttribute("data-route", pathname === "/" ? "/" : pathname);
    script.textContent = JSON.stringify(ld);
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, image, canonicalUrl, type, productData, noindex, location.pathname, products && products.length]);

  return null;
};

export default SEO;
