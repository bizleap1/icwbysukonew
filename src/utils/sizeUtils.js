// src/utils/sizeUtils.js -- Canonical size ordering, resolution, and size guide definitions

export const CANONICAL_SIZE_ORDER = [
  "XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL",
  "32", "34", "36", "38", "40", "42", "44", "46", "48", "50",
  "Free Size", "Free", "One Size"
];

/**
 * Sorts sizes in standard luxury garment order:
 * Alpha: XXS -> XS -> S -> M -> L -> XL -> XXL -> 3XL
 * Numeric: 34 -> 36 -> 38 -> 40 -> 42 -> 44 -> 46
 * Free Size: at the end
 */
export function sortGarmentSizes(sizesList = []) {
  if (!Array.isArray(sizesList)) return [];
  return [...sizesList].sort((a, b) => {
    const sA = String(a).trim();
    const sB = String(b).trim();
    const idxA = CANONICAL_SIZE_ORDER.findIndex(o => o.toLowerCase() === sA.toLowerCase());
    const idxB = CANONICAL_SIZE_ORDER.findIndex(o => o.toLowerCase() === sB.toLowerCase());

    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;

    const numA = parseInt(sA, 10);
    const numB = parseInt(sB, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;

    return sA.localeCompare(sB);
  });
}

/**
 * Resolves the genuine applicable sizes for a product:
 * - Drops phantom 0-stock numeric keys on products that are legitimately alpha-sized
 * - Returns canonically ordered sizes
 */
export function resolveCleanProductSizes(product) {
  if (!product) return [];

  let rawSizes = [];

  if (product.size_stock && typeof product.size_stock === "object" && Object.keys(product.size_stock).length > 0) {
    const entries = Object.entries(product.size_stock);
    const hasAlpha = entries.some(([k, v]) => 
      ["XS", "S", "M", "L", "XL", "XXL", "3XL"].includes(String(k).toUpperCase()) && Number(v) > 0
    );

    if (hasAlpha) {
      // Filter out phantom 0-stock numeric keys & 0-stock Free
      rawSizes = entries
        .filter(([k, v]) => !(/^\d+$/.test(k) && Number(v) === 0) && !(String(k).toLowerCase().includes("free") && Number(v) === 0))
        .map(([k]) => k);
    } else {
      rawSizes = Object.keys(product.size_stock);
    }
  } else if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    rawSizes = product.sizes;
  } else if (typeof product.sizes === "string") {
    try {
      const parsed = JSON.parse(product.sizes);
      if (Array.isArray(parsed) && parsed.length > 0) rawSizes = parsed;
    } catch {}
    if (rawSizes.length === 0 && product.sizes.trim()) {
      rawSizes = product.sizes.split(",").map(s => s.trim()).filter(Boolean);
    }
  }

  if (rawSizes.length === 0) {
    rawSizes = ["XS", "S", "M", "L", "XL"];
  }

  return sortGarmentSizes(rawSizes);
}

export const DEFAULT_SIZE_GUIDE = [
  { size: "XS", bust: "32–33", waist: "25–26", hip: "35–36" },
  { size: "S", bust: "34–35", waist: "27–28", hip: "37–38" },
  { size: "M", bust: "36–37", waist: "29–30", hip: "39–40" },
  { size: "L", bust: "38–39", waist: "31–32", hip: "41–42" },
  { size: "XL", bust: "40–42", waist: "33–35", hip: "43–45" }
];

export const NUMERIC_SIZE_GUIDE = [
  { size: "36", bust: "32–33", waist: "25–26", hip: "35–36" },
  { size: "38", bust: "34–35", waist: "27–28", hip: "37–38" },
  { size: "40", bust: "36–37", waist: "29–30", hip: "39–40" },
  { size: "42", bust: "38–39", waist: "31–32", hip: "41–42" },
  { size: "44", bust: "40–41", waist: "33–34", hip: "43–44" },
  { size: "46", bust: "42–43", waist: "35–36", hip: "45–46" }
];
