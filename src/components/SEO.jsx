import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE_URL = "https://indiancorporatewear.com";
const DEFAULT_TITLE = "SUKO — Crafted For Distinction";
const DEFAULT_DESC = "Precision executive tailoring, sculpted silhouettes, and power suits designed for the modern female leader.";
const DEFAULT_IMAGE = `${BASE_URL}/boardroom_banner.jpg`;

export const SEO = ({
  title,
  description,
  image,
  canonicalUrl,
  type = "website",
  productData = null
}) => {
  const location = useLocation();

  useEffect(() => {
    // 1. Set Title
    const fullTitle = title ? `${title} | SUKO` : DEFAULT_TITLE;
    document.title = fullTitle;

    // Helper to update or create meta tags
    const updateMetaTag = (selector, attribute, value) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        const [attrName, attrVal] = selector.replace(/[\[\]']/g, "").split("=");
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    const desc = description || DEFAULT_DESC;
    const ogImage = image ? (image.startsWith("http") ? image : `${BASE_URL}${image}`) : DEFAULT_IMAGE;
    const url = canonicalUrl || `${BASE_URL}${location.pathname}`;

    // 2. Standard Meta Tags
    updateMetaTag("meta[name='description']", "content", desc);

    // 3. Open Graph
    updateMetaTag("meta[property='og:title']", "content", fullTitle);
    updateMetaTag("meta[property='og:description']", "content", desc);
    updateMetaTag("meta[property='og:image']", "content", ogImage);
    updateMetaTag("meta[property='og:url']", "content", url);
    updateMetaTag("meta[property='og:type']", "content", type);
    updateMetaTag("meta[property='og:site_name']", "content", "SUKO");

    // 4. Twitter Card
    updateMetaTag("meta[name='twitter:card']", "content", "summary_large_image");
    updateMetaTag("meta[name='twitter:title']", "content", fullTitle);
    updateMetaTag("meta[name='twitter:description']", "content", desc);
    updateMetaTag("meta[name='twitter:image']", "content", ogImage);

    // 5. Canonical Link
    let canonicalTag = document.querySelector("link[rel='canonical']");
    if (!canonicalTag) {
      canonicalTag = document.createElement("link");
      canonicalTag.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute("href", url);

    // 6. JSON-LD Schema (Optional for PDP)
    const existingSchema = document.getElementById("structured-data-jsonld");
    if (existingSchema) {
      existingSchema.remove();
    }

    if (productData) {
      const scriptTag = document.createElement("script");
      scriptTag.id = "structured-data-jsonld";
      scriptTag.type = "application/ld+json";
      
      const schemaPayload = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": productData.name || title,
        "image": (productData.images && productData.images.length > 0)
          ? productData.images.map(img => img.startsWith("http") ? img : `${BASE_URL}${img}`)
          : [ogImage],
        "description": productData.description || desc,
        "brand": {
          "@type": "Brand",
          "name": "ICW by Suko"
        },
        "offers": {
          "@type": "Offer",
          "url": url,
          "priceCurrency": "INR",
          "price": productData.price || "0",
          "itemCondition": "https://schema.org/NewCondition",
          "availability": (productData.stock === 0) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          "seller": {
            "@type": "Organization",
            "name": "ICW by Suko"
          }
        }
      };

      scriptTag.textContent = JSON.stringify(schemaPayload);
      document.head.appendChild(scriptTag);
    }
  }, [title, description, image, canonicalUrl, type, productData, location.pathname]);

  return null;
};

export default SEO;
