// Curated Luxury Catalog for ICW by SUKO
// Strict Corporate / Formal Tailoring (Women & Men)
// Pricing in INR: ₹16,000 to ₹95,000

export const CATEGORIES = [
  { slug: "blazers", name: "Blazers", tagline: "Sculpted silhouettes" },
  { slug: "suits", name: "Power Suits & Sets", tagline: "Bespoke architecture" },
  { slug: "trousers", name: "Formal Trousers", tagline: "High-rise precision" },
  { slug: "shirts", name: "Formal Shirts", tagline: "Crisp European cottons" },
  { slug: "waistcoats", name: "Waistcoats & Vests", tagline: "Considered layering" },
];

export const SIZES = ["XS", "S", "M", "L", "XL", "Custom Bespoke"];
export const COLOURS = [
  { id: "Navy", name: "Navy", label: "Navy", hex: "#16233B" },
  { id: "Aubergine", name: "Aubergine", label: "Aubergine", hex: "#2E1729" },
  { id: "Dusty Rose", name: "Dusty Rose", label: "Dusty Rose", hex: "#C59A9A" },
  { id: "Deep Plum", name: "Deep Plum", label: "Deep Plum", hex: "#4A1828" },
  { id: "Obsidian Black", name: "Obsidian Black", label: "Obsidian Black", hex: "#0E0E11" },
];

export const PRODUCTS = [
  // --- WOMEN'S EDIT (9 EXCLUSIVE LUXURY PIECES) ---
  {
    id: "w-01",
    name: "Midnight Peplum Set",
    slug: "the-midnight-peplum-set",
    gender: "female",
    category: "suits",
    categoryName: "Executive Co-ord Sets",
    setType: "Signature 2-Piece Set",
    price: 72000,
    color: "Navy",
    availableColors: ["Navy"],
    sizes: ["XS", "S", "M", "L", "XL"],
    pieces: "Includes Peplum Jacket + Coordinated Fishtail Skirt.",
    description: "A coordinated two-piece set featuring a fitted peplum jacket with gold-tone buttons and a matching fishtail skirt. Designed with a defined waist and softly flared silhouette.",
    sizeFit: "Tailored, close-to-body fit through the waist with a flared peplum and fishtail hem. Refer to the Size Guide for detailed top and bottom measurements.",
    fabricCare: {
      fabric: "Refer to product specification.",
      care: "Follow the garment care label instructions."
    },
    images: [
      "/products/midnight-peplum-fishtail-set/1.JPG",
      "/products/midnight-peplum-fishtail-set/2.png",
      "/products/midnight-peplum-fishtail-set/3.png",
      "/products/midnight-peplum-fishtail-set/4.JPG",
      "/products/midnight-peplum-fishtail-set/5.JPG",
      "/products/midnight-peplum-fishtail-set/6.JPG",
      "/products/midnight-peplum-fishtail-set/7.JPG"
    ],
    badge: "Signature",
    isNew: true
  },
  {
    id: "w-02",
    name: "Midnight Sculpted Vest Set",
    slug: "the-midnight-sculpted-vest-set",
    gender: "female",
    category: "waistcoats",
    categoryName: "Executive Co-ord Sets",
    setType: "Sculpted Vest & Skirt Set",
    price: 68000,
    color: "Navy",
    availableColors: ["Navy"],
    sizes: ["XS", "S", "M", "L", "XL"],
    pieces: "Includes Sculpted Vest + Coordinated Column Skirt.",
    description: "A tailored two-piece set featuring a sculpted sleeveless vest with ivory cowl contrast neckline and a coordinating column skirt in deep midnight navy.",
    sizeFit: "Structured, tailored fit with defined silhouette and floor-length column skirt. Refer to the Size Guide for detailed top and bottom measurements.",
    fabricCare: {
      fabric: "Refer to product specification.",
      care: "Follow the garment care label instructions."
    },
    images: [
      "/products/midnight-sculpted-vest-set/1.JPG",
      "/products/midnight-sculpted-vest-set/2.png",
      "/products/midnight-sculpted-vest-set/3.png",
      "/products/midnight-sculpted-vest-set/4.JPG",
      "/products/midnight-sculpted-vest-set/5.JPG",
      "/products/midnight-sculpted-vest-set/6.JPG",
      "/products/midnight-sculpted-vest-set/7.JPG"
    ],
    badge: "New Season",
    isNew: true
  },
  {
    id: "w-03",
    name: "Aubergine Draped Set",
    slug: "the-aubergine-draped-set",
    gender: "female",
    category: "suits",
    categoryName: "Executive Co-ord Sets",
    setType: "Draped Vest & Skirt Set",
    price: 68000,
    color: "Aubergine",
    availableColors: ["Aubergine"],
    sizes: ["XS", "S", "M", "L", "XL"],
    pieces: "Includes Draped Sleeveless Vest + Coordinated Mini Skirt.",
    description: "A coordinated two-piece set featuring a sleeveless structured vest with layered draped lapels, an asymmetric front panel and a single gold-tone button detail, paired with a matching tailored mini skirt.",
    sizeFit: "Tailored fit through the waist with a structured sleeveless silhouette and a clean, fitted mini skirt. Refer to the Size Guide for detailed measurements.",
    fabricCare: {
      fabric: "Refer to product specification.",
      care: "Follow the garment care label instructions."
    },
    images: [
      "/products/aubergine-draped-vest-mini-set/1.png",
      "/products/aubergine-draped-vest-mini-set/2.png",
      "/products/aubergine-draped-vest-mini-set/3.png",
      "/products/aubergine-draped-vest-mini-set/4.png",
      "/products/aubergine-draped-vest-mini-set/5.png",
      "/products/aubergine-draped-vest-mini-set/6.png"
    ],
    badge: "New Season",
    isNew: true
  },
  {
    id: "w-04",
    name: "Aubergine Tailored Suit",
    slug: "the-aubergine-tailored-suit",
    gender: "female",
    category: "suits",
    categoryName: "Power Suits & Sets",
    setType: "Tailored 2-Piece Suit",
    price: 78000,
    color: "Aubergine",
    availableColors: ["Aubergine"],
    sizes: ["XS", "S", "M", "L", "XL"],
    pieces: "Includes Tailored Blazer + Coordinated Wide-Leg Trousers.",
    description: "A coordinated two-piece suit featuring a tailored single-button blazer with a soft shawl-style lapel, structured shoulders, front pockets and buttoned cuffs, paired with matching wide-leg trousers.",
    sizeFit: "Tailored fit through the blazer with a defined shoulder line and a relaxed wide-leg trouser silhouette. Refer to the Size Guide for detailed blazer and trouser measurements.",
    fabricCare: {
      fabric: "Refer to product specification.",
      care: "Follow the garment care label instructions."
    },
    images: [
      "/products/aubergine-tailored-power-suit/1.JPG",
      "/products/aubergine-tailored-power-suit/2.png",
      "/products/aubergine-tailored-power-suit/3.png",
      "/products/aubergine-tailored-power-suit/4.JPG",
      "/products/aubergine-tailored-power-suit/5.JPG",
      "/products/aubergine-tailored-power-suit/6.JPG",
      "/products/aubergine-tailored-power-suit/7.JPG"
    ],
    badge: "Signature",
    isNew: true
  },
  {
    id: "w-05",
    name: "Dusty Rose Flare Suit",
    slug: "the-dusty-rose-flare-suit",
    gender: "female",
    category: "suits",
    categoryName: "Power Suits & Sets",
    setType: "Flared 2-Piece Suit",
    price: 76000,
    color: "Dusty Rose",
    availableColors: ["Dusty Rose"],
    sizes: ["XS", "S", "M", "L", "XL"],
    pieces: "Includes Tailored Blazer + Coordinated Sculptural Flared Trousers.",
    description: "A coordinated two-piece suit featuring a longline single-breasted blazer with a defined notch lapel, tailored waist and single-button closure, paired with matching high-rise trousers finished with an exaggerated sculptural flare.",
    sizeFit: "Tailored through the blazer with a clean, elongated silhouette. Trousers are fitted through the upper leg before opening into a dramatic floor-length flare. Refer to the Size Guide for detailed measurements.",
    fabricCare: {
      fabric: "Refer to product specification.",
      care: "Follow the garment care label instructions."
    },
    images: [
      "/products/dusty-rose-sculpted-flare-suit/1.JPG",
      "/products/dusty-rose-sculpted-flare-suit/2.png",
      "/products/dusty-rose-sculpted-flare-suit/3.png",
      "/products/dusty-rose-sculpted-flare-suit/4.JPG",
      "/products/dusty-rose-sculpted-flare-suit/5.JPG",
      "/products/dusty-rose-sculpted-flare-suit/6.JPG",
      "/products/dusty-rose-sculpted-flare-suit/7.JPG"
    ],
    badge: "New Season",
    isNew: true
  },
  {
    id: "w-06",
    name: "Plum Sculpted Suit",
    slug: "the-plum-sculpted-suit",
    gender: "female",
    category: "suits",
    categoryName: "Power Suits & Sets",
    setType: "Double-Breasted 2-Piece Suit",
    price: 78000,
    color: "Deep Plum",
    availableColors: ["Deep Plum"],
    sizes: ["XS", "S", "M", "L", "XL"],
    pieces: "Includes Double-Breasted Tailored Blazer + Coordinated Flared Trousers.",
    description: "A coordinated two-piece suit featuring a sculpted double-breasted blazer with a defined lapel, fitted waist and softly flared hem, paired with matching tailored trousers finished in a clean flared silhouette.",
    sizeFit: "Blazer is tailored through the shoulders and waist with a feminine structured shape. Trousers are fitted through the upper leg before opening into a subtle flare. Refer to the Size Guide for detailed measurements.",
    fabricCare: {
      fabric: "Refer to product specification.",
      care: "Follow the garment care label instructions."
    },
    images: [
      "/products/the-plum-sculpted-suit/1.JPG",
      "/products/the-plum-sculpted-suit/2.png",
      "/products/the-plum-sculpted-suit/3.png",
      "/products/the-plum-sculpted-suit/4.png",
      "/products/the-plum-sculpted-suit/5.JPG",
      "/products/the-plum-sculpted-suit/6.JPG",
      "/products/the-plum-sculpted-suit/7.JPG"
    ],
    badge: "Signature",
    isNew: true
  },
  {
    id: "w-07",
    name: "Dusty Rose Embroidered Set",
    slug: "the-dusty-rose-embroidered-set",
    gender: "female",
    category: "sets",
    categoryName: "Signature Co-ord Sets",
    setType: "Embroidered Tunic & Trouser Set",
    price: 72000,
    color: "Dusty Rose",
    availableColors: ["Dusty Rose"],
    sizes: ["XS", "S", "M", "L", "XL"],
    pieces: "Includes Embroidered Longline Tunic + Coordinated Wide-Leg Trousers.",
    description: "A refined two-piece set pairing a fluid longline tunic with coordinated wide-leg trousers. Deep burgundy embroidery frames the neckline and shoulders, introducing sculptural contrast against the muted dusty-rose base. Designed with a relaxed sense of structure, the silhouette moves effortlessly between polished daywear and elevated occasion dressing.",
    sizeFit: "Tunic is designed in a relaxed longline silhouette with ease through the body. Trousers fall in a fluid wide-leg shape for an elongated, comfortable fit. Refer to the Size Guide for detailed garment measurements.",
    fabricCare: {
      fabric: "Refer to product specification.",
      care: "Follow the garment care label instructions."
    },
    images: [
      "/products/the-dusty-rose-embroidered-set/1.JPG",
      "/products/the-dusty-rose-embroidered-set/2.png",
      "/products/the-dusty-rose-embroidered-set/3.png",
      "/products/the-dusty-rose-embroidered-set/4.JPG",
      "/products/the-dusty-rose-embroidered-set/5.JPG",
      "/products/the-dusty-rose-embroidered-set/6.JPG",
      "/products/the-dusty-rose-embroidered-set/7.JPG"
    ],
    badge: "Signature",
    isNew: true
  },
  {
    id: "w-08",
    name: "Noir Tailored Suit",
    slug: "the-noir-tailored-suit",
    gender: "female",
    category: "suits",
    categoryName: "Power Suits & Sets",
    setType: "Single-Breasted Blazer & Wide-Leg Trouser Set",
    price: 78000,
    color: "Obsidian Black",
    availableColors: ["Obsidian Black"],
    sizes: ["XS", "S", "M", "L", "XL"],
    pieces: "Includes Tailored Single-Breasted Blazer + Coordinated Wide-Leg Trousers.",
    description: "A refined black tailoring set built around a clean, elongated silhouette. The single-breasted blazer is defined by sharp notch lapels, a sculpted waist and a statement metallic button, paired with fluid wide-leg trousers for a modern expression of power dressing.",
    sizeFit: "Blazer is tailored through the shoulders and waist with an elongated silhouette. Trousers fall from the waist into a relaxed wide-leg shape. Refer to the Size Guide for detailed measurements.",
    fabricCare: {
      fabric: "Fabric Composition: Refer to product specification.",
      care: "Follow the garment care label instructions."
    },
    images: [
      "/products/the-noir-tailored-suit/1.JPG",
      "/products/the-noir-tailored-suit/2.png",
      "/products/the-noir-tailored-suit/3.png",
      "/products/the-noir-tailored-suit/4.JPG",
      "/products/the-noir-tailored-suit/5.JPG",
      "/products/the-noir-tailored-suit/6.JPG",
      "/products/the-noir-tailored-suit/7.JPG"
    ],
    badge: "Signature",
    isNew: true
  },
  {
    id: "w-09",
    name: "Noir Layered Suit",
    slug: "the-noir-layered-suit",
    gender: "female",
    category: "suits",
    categoryName: "Power Suits & Sets",
    setType: "3-Piece Layered Vest & Wide-Leg Trouser Set",
    price: 82000,
    color: "Obsidian Black",
    availableColors: ["Obsidian Black"],
    sizes: ["XS", "S", "M", "L", "XL"],
    pieces: "Includes Inner Tailored Vest + Layered Outer Vest + Coordinated Wide-Leg Trousers.",
    description: "A modern three-piece interpretation of black tailoring, designed around layered sleeveless structure and fluid proportions. Two sharply tailored vest layers create depth through the neckline and front, while coordinated wide-leg trousers complete the elongated silhouette.",
    sizeFit: "Upper layers are tailored through the shoulders and waist while retaining a clean sleeveless silhouette. Trousers fall from the waist into a relaxed wide-leg shape. Refer to the Size Guide for detailed measurements.",
    fabricCare: {
      fabric: "Fabric Composition: Refer to product specification.",
      care: "Follow the garment care label instructions."
    },
    images: [
      "/products/the-noir-layered-suit/1.JPG",
      "/products/the-noir-layered-suit/2.png",
      "/products/the-noir-layered-suit/3.png",
      "/products/the-noir-layered-suit/4.png",
      "/products/the-noir-layered-suit/5.JPG",
      "/products/the-noir-layered-suit/6.JPG",
      "/products/the-noir-layered-suit/7.JPG"
    ],
    badge: "Signature",
    isNew: true
  },
  {
    id: "w-10",
    name: "Plum Sculpted Suit",
    slug: "the-plum-sculpted-suit",
    gender: "female",
    category: "suits",
    categoryName: "Power Suits & Sets",
    setType: "Double-Breasted 2-Piece Suit",
    price: 78000,
    color: "Deep Plum",
    availableColors: ["Deep Plum"],
    sizes: ["XS", "S", "M", "L", "XL"],
    pieces: "Includes Double-Breasted Tailored Blazer + Coordinated Flared Trousers.",
    description: "A coordinated two-piece suit featuring a sculpted double-breasted blazer with a defined lapel, fitted waist and softly flared hem, paired with matching tailored trousers finished in a clean flared silhouette.",
    sizeFit: "Blazer is tailored through the shoulders and waist with a feminine structured shape. Trousers are fitted through the upper leg before opening into a subtle flare. Refer to the Size Guide for detailed measurements.",
    fabricCare: {
      fabric: "Refer to product specification.",
      care: "Follow the garment care label instructions."
    },
    images: [
      "/products/the-plum-sculpted-suit/1.JPG",
      "/products/the-plum-sculpted-suit/2.png",
      "/products/the-plum-sculpted-suit/3.png",
      "/products/the-plum-sculpted-suit/4.png",
      "/products/the-plum-sculpted-suit/5.JPG",
      "/products/the-plum-sculpted-suit/6.JPG",
      "/products/the-plum-sculpted-suit/7.JPG"
    ],
    badge: "Featured Edit",
    isNew: true
  }
];

export const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const getProductBySlug = (slug) => PRODUCTS.find((p) => p.slug === slug);
export const getProductsByCategory = (cat) => PRODUCTS.filter((p) => p.category === cat);
export const getProductsByGender = (gender) => PRODUCTS.filter((p) => p.gender === gender);

export const LOOKBOOK = [
  { id: 1, title: "Chapter I — The Boardroom", season: "Autumn / Winter 26", image: "/products/the-noir-tailored-suit/1.JPG" },
  { id: 2, title: "Chapter II — After Eight", season: "Evening Edit", image: "/products/the-plum-sculpted-suit/1.JPG" },
  { id: 3, title: "Chapter III — The City", season: "Capsule 04", image: "/products/dusty-rose-sculpted-flare-suit/1.JPG" },
  { id: 4, title: "Chapter IV — Private Hours", season: "Limited", image: "/products/midnight-peplum-fishtail-set/1.JPG" },
];

export const HERO_VIDEO = "/images/Flow_1080p_202606241721.mp4";
export const HERO_FALLBACK = "https://images.unsplash.com/photo-1600091166971-7f9faad6c1e2?crop=entropy&cs=srgb&fm=jpg&w=2000&q=85";

