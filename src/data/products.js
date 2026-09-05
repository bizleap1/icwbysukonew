// Curated Luxury Catalog for SUKO — The Indian Corporate Wear
// High-Value Corporate Tailoring for Professional Women
// Pricing in INR: ₹1,550 to ₹8,999

export const CATEGORIES = [
  {
    "slug": "suits",
    "name": "Power Suits & Sets",
    "label": "POWER SUITS & SETS",
    "tagline": "Tailored executive silhouettes"
  },
  {
    "slug": "separates",
    "name": "Tailored Separates",
    "label": "TAILORED SEPARATES",
    "tagline": "Blazers, Jackets, Vests, Tunics, Trousers & Skirts",
    "subcategories": [
      "Blazers",
      "Jackets",
      "Vests",
      "Tunics",
      "Trousers",
      "Skirts"
    ]
  },
  {
    "slug": "coords",
    "name": "Vests & Co-ords",
    "label": "VESTS & CO-ORDS",
    "tagline": "Sculptural modern layering & sets"
  },
  {
    "slug": "signatures",
    "name": "Signature Pieces",
    "label": "SIGNATURE PIECES",
    "tagline": "The defining icons of SUKO"
  }
];

export const MOMENTS = [
  {
    "id": "boardroom",
    "slug": "boardroom-edit",
    "title": "The Boardroom Edit",
    "tagline": "Command the Room",
    "subtitle": "For leadership meetings, investor reviews & decision-making moments",
    "description": "Structured tailoring for high-stakes meetings, negotiations and leadership moments.",
    "image": "/shop_by_moment_boardroom.webp",
    "imagePosition": "object-[82%_center] sm:object-[76%_center] lg:object-[72%_center] xl:object-[70%_center]",
    "mobileImagePosition": "object-[72%_6%]",
    "secondaryImage": "/products/the-noir-tailored-suit/1.png",
    "accent": "#C2922E",
    "recommendedLooks": [
      "the-noir-tailored-suit",
      "the-aubergine-tailored-suit"
    ]
  },
  {
    "id": "founder",
    "slug": "founder-edit",
    "title": "The Founder Edit",
    "tagline": "Built for Women Building What’s Next",
    "subtitle": "For founders, decision-makers & visionaries",
    "description": "Bold, modern silhouettes for founders, decision-makers and women building what’s next.",
    "image": "/shop_by_moment_founder.webp",
    "imagePosition": "object-[95%_center] sm:object-[92%_center] lg:object-[88%_center] xl:object-[85%_center]",
    "mobileImagePosition": "object-[84%_6%]",
    "secondaryImage": "/products/the-plum-sculpted-suit/1.png",
    "accent": "#D4AF37",
    "recommendedLooks": [
      "the-noir-tailored-suit",
      "the-plum-sculpted-suit",
      "the-midnight-sculpted-vest-set",
      "the-midnight-peplum-set"
    ]
  },
  {
    "id": "presentation",
    "slug": "presentation-edit",
    "title": "The Presentation Edit",
    "tagline": "Made to Hold the Room",
    "subtitle": "For presentations, keynotes & high-visibility moments",
    "description": "Polished tailoring and sculptural silhouettes for presentations, keynotes and high-visibility moments.",
    "image": "/shop_by_moment_presntation.webp",
    "imagePosition": "object-[80%_center] sm:object-[72%_center] lg:object-[68%_center] xl:object-[65%_center]",
    "mobileImagePosition": "object-[72%_6%]",
    "secondaryImage": "/products/lilac-sculpted-flare-suit/1.png",
    "accent": "#C59A9A",
    "recommendedLooks": [
      "the-plum-sculpted-suit",
      "the-aubergine-tailored-suit",
      "the-lilac-flare-suit"
    ]
  },
  {
    "id": "after-hours",
    "slug": "after-hours-edit",
    "title": "The After-Hours Edit",
    "tagline": "From Workday to After Hours",
    "subtitle": "For late meetings, business dinners & evening occasions",
    "description": "Elevated tailoring designed to move effortlessly from late meetings to evening occasions.",
    "image": "/shop_by_moment_after_hours.webp",
    "imagePosition": "object-[95%_center] sm:object-[92%_center] lg:object-[88%_center] xl:object-[85%_center]",
    "mobileImagePosition": "object-[83%_6%]",
    "secondaryImage": "/products/midnight-peplum-fishtail-set/1.png",
    "accent": "#8B9BB4",
    "recommendedLooks": [
      "the-midnight-peplum-set",
      "the-aubergine-draped-set",
      "the-lilac-flare-suit",
      "the-dusty-rose-embroidered-farchi-set"
    ]
  },
  {
    "id": "essentials",
    "slug": "executive-essentials",
    "title": "Executive Essentials",
    "tagline": "Built for the Everyday",
    "subtitle": "For polished daily dressing & versatile separates",
    "description": "Versatile separates designed for polished, everyday professional dressing.",
    "image": "/shop_by_moment_executive.webp",
    "imagePosition": "object-[95%_center] sm:object-[90%_center] lg:object-[86%_center] xl:object-[82%_center]",
    "mobileImagePosition": "object-[78%_6%]",
    "secondaryImage": "/products/the-noir-tailored-suit/1.png",
    "accent": "#E8E4DC",
    "recommendedLooks": [
      "the-noir-tailored-suit",
      "the-midnight-sculpted-vest-set"
    ]
  }
];

export const SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "Custom Tailoring"
];

export const COLOURS = [
  {
    "id": "Lilac",
    "name": "Lilac",
    "label": "Lilac",
    "hex": "#C4A8D1"
  },
  {
    "id": "Wine",
    "name": "Wine",
    "label": "Wine",
    "hex": "#5B1E31"
  },
  {
    "id": "Navy Blue",
    "name": "Navy Blue",
    "label": "Navy Blue",
    "hex": "#16233B"
  },
  {
    "id": "Muted Pink",
    "name": "Muted Pink",
    "label": "Muted Pink",
    "hex": "#D9A7AB"
  },
  {
    "id": "Obsidian Black",
    "name": "Obsidian Black",
    "label": "Obsidian Black",
    "hex": "#0E0E11"
  }
];

export const PRODUCTS = [
  {
    "id": "w-10",
    "name": "Plum Sculpted Set",
    "slug": "the-plum-sculpted-suit",
    "categoryType": "set",
    "gender": "female",
    "category": "suits",
    "categoryName": "Power Suits & Sets",
    "categoryLabel": "POWER SUITS & SETS",
    "shortType": "Sculpted Double-Breasted Suit",
    "setType": "Sculpted Double-Breasted Suit",
    "moment": "founder",
    "moments": [
      "founder",
      "presentation"
    ],
    "momentName": "The Founder Edit",
    "price": 4800,
    "color": "Wine",
    "availableColors": [
      "Wine",
      "Lilac",
      "Navy Blue",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "includedPieces": [
      "Sculpted Double-Breasted Blazer",
      "Coordinated Flared Trousers"
    ],
    "coordinates": [
      {
        "slug": "the-plum-sculpted-double-breasted-blazer",
        "label": "Matching Double-Breasted Power Blazer"
      },
      {
        "slug": "the-plum-sculpted-trousers",
        "label": "Matching Sculpted Flared Trousers"
      }
    ],
    "gallery": [
      {
        "url": "/products/the-plum-sculpted-suit/1.png",
        "type": "model_front"
      },
      {
        "url": "/products/the-plum-sculpted-suit/2.png",
        "type": "model_three_quarter"
      },
      {
        "url": "/products/the-plum-sculpted-suit/3.png",
        "type": "model_side"
      },
      {
        "url": "/products/the-plum-sculpted-suit/4.png",
        "type": "detail"
      },
      {
        "url": "/products/the-plum-sculpted-suit/5.png",
        "type": "model_back"
      },
      {
        "url": "/products/the-plum-sculpted-suit/6.png",
        "type": "garment_front"
      },
      {
        "url": "/products/the-plum-sculpted-suit/7.png",
        "type": "detail"
      }
    ],
    "pieces": "Includes Double-Breasted Tailored Blazer + Coordinated Flared Trousers.",
    "description": "A coordinated two-piece suit featuring a sculpted double-breasted blazer with defined lapels, fitted waist and a softly flared hem, paired with matching tailored trousers finished in a clean flared silhouette.",
    "story": "Designed for women creating their own table. Rich deep plum offers an authoritative alternative to traditional black and navy, expressing visionary confidence.",
    "stylingNotes": "Wear buttoned up over a fine knit top for investor meetings, or open over a silk shell top for keynote addresses.",
    "sizeFit": "Blazer is tailored through the shoulders and waist with a feminine structured shape. Trousers are fitted through the upper leg before opening into a subtle flare.",
    "fabricCare": {
      "fabric": "Tailored suiting blend with subtle structured stretch.",
      "care": "Dry clean only. Steam on low heat."
    },
    "images": [
      "/products/the-plum-sculpted-suit/1.png",
      "/products/the-plum-sculpted-suit/2.png",
      "/products/the-plum-sculpted-suit/3.png",
      "/products/the-plum-sculpted-suit/4.png",
      "/products/the-plum-sculpted-suit/5.png",
      "/products/the-plum-sculpted-suit/6.png",
      "/products/the-plum-sculpted-suit/7.png"
    ],
    "badge": null,
    "isNew": true,
    "separates": [
      {
        "slug": "the-plum-sculpted-double-breasted-blazer",
        "label": "Plum Sculpted Double Breasted Blazer"
      },
      {
        "slug": "the-plum-sculpted-trousers",
        "label": "Plum Sculpted Trousers"
      }
    ]
  },
  {
    "id": "w-16",
    "name": "Plum Sculpted Double Breasted Blazer",
    "slug": "the-plum-sculpted-double-breasted-blazer",
    "categoryType": "blazer",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Blazers",
    "shortType": "Double Breasted Blazer",
    "setType": "Sculpted Double Breasted Blazer",
    "moment": "boardroom",
    "moments": [
      "boardroom",
      "founder",
      "essentials"
    ],
    "momentName": "The Boardroom Edit",
    "price": 2350,
    "color": "Wine",
    "availableColors": [
      "Wine",
      "Lilac",
      "Navy Blue",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "the-plum-sculpted-trousers",
        "label": "Coordinating Plum Flared Trousers"
      },
      {
        "slug": "the-plum-sculpted-suit",
        "label": "Complete Plum Sculpted Power Suit"
      }
    ],
    "coordinateText": "Pair with coordinating plum flared trousers.",
    "gallery": [
      {
        "url": "/products/plum-sculpted-double-breasted-blazer/1.JPG",
        "type": "model_front"
      },
      {
        "url": "/products/plum-sculpted-double-breasted-blazer/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/plum-sculpted-double-breasted-blazer/3.png",
        "type": "detail"
      },
      {
        "url": "/products/plum-sculpted-double-breasted-blazer/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/plum-sculpted-double-breasted-blazer/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes Sculpted Double-Breasted Tailored Blazer with Peak Lapels.",
    "description": "A commanding double-breasted power blazer in royal plum, featuring sharp peak lapels, tonal button closures, and precision structural darts for an authoritative executive silhouette.",
    "story": "Created for high-stakes executive leadership. The double-breasted architecture frames the shoulders with commanding poise while the deep plum tone conveys subtle luxury.",
    "stylingNotes": "Wear buttoned over tailored trousers with pointed pumps for annual general meetings or executive board reviews.",
    "sizeFit": "Structured tailoring with sharp shoulders and defined waist. True to size. Model wears size S. Refer to Size Guide for measurements.",
    "fabricCare": {
      "fabric": "Premium heavy suiting wool-crepe blend with full tonal interior lining.",
      "care": "Dry clean only. Store on structured garment hanger."
    },
    "images": [
      "/products/plum-sculpted-double-breasted-blazer/1.JPG",
      "/products/plum-sculpted-double-breasted-blazer/2.png",
      "/products/plum-sculpted-double-breasted-blazer/3.png",
      "/products/plum-sculpted-double-breasted-blazer/4.png",
      "/products/plum-sculpted-double-breasted-blazer/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },
  {
    "id": "w-27",
    "name": "Plum Sculpted Trousers",
    "slug": "the-plum-sculpted-trousers",
    "categoryType": "trouser",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Trousers",
    "shortType": "Sculpted Flared Trousers",
    "setType": "Plum Sculpted Trousers",
    "moment": "founder",
    "moments": [
      "founder",
      "boardroom",
      "presentation"
    ],
    "momentName": "The Founder Edit",
    "price": 2450,
    "color": "Wine",
    "availableColors": [
      "Wine",
      "Lilac",
      "Navy Blue",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "the-plum-sculpted-double-breasted-blazer",
        "label": "Coordinating Double-Breasted Power Blazer"
      },
      {
        "slug": "the-plum-sculpted-suit",
        "label": "Complete Sculpted Power Suit"
      }
    ],
    "coordinateText": "Pair with the coordinating sculpted double-breasted blazer for a commanding executive presence.",
    "gallery": [
      {
        "url": "/products/plum-sculpted-trousers/1.JPG",
        "type": "model_front"
      },
      {
        "url": "/products/plum-sculpted-trousers/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/plum-sculpted-trousers/3.png",
        "type": "detail"
      },
      {
        "url": "/products/plum-sculpted-trousers/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/plum-sculpted-trousers/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes Tailored Sculpted Flared Trousers.",
    "description": "Architecturally tailored flared trousers in deep plum, featuring a clean high waistband, subtle front pleating, and an elongating flare that balances executive authority with modern graceful movement.",
    "story": "Crafted for key presentations and leadership summits. The deep plum shade delivers sophisticated distinction, offering an empowered alternative to conventional corporate suiting.",
    "stylingNotes": "Style with the matching Plum Double-Breasted Blazer or fine silk button-downs with sculptural gold jewelry.",
    "sizeFit": "High-rise waistband tailored through the hip and thigh, opening into a structured subtle flare. True to size.",
    "fabricCare": {
      "fabric": "Premium structured suiting blend with natural stretch and fluid drape.",
      "care": "Specialized dry clean only. Steam on low heat."
    },
    "images": [
      "/products/plum-sculpted-trousers/1.JPG",
      "/products/plum-sculpted-trousers/2.png",
      "/products/plum-sculpted-trousers/3.png",
      "/products/plum-sculpted-trousers/4.png",
      "/products/plum-sculpted-trousers/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },
  {
    "id": "w-13",
    "name": "Aubergine Asymmetric Wrap Vest",
    "slug": "the-aubergine-asymmetric-wrap-vest",
    "categoryType": "vest",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Vests",
    "shortType": "Sculpted Wrap Vest",
    "setType": "Asymmetric Wrap Vest",
    "moment": "founder",
    "moments": [
      "founder",
      "essentials",
      "after-hours"
    ],
    "momentName": "The Founder's Suite",
    "price": 3300,
    "color": "Wine",
    "availableColors": [
      "Wine",
      "Lilac",
      "Navy Blue",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "the-aubergine-draped-set",
        "label": "Complete Aubergine Draped Set"
      },
      {
        "slug": "the-aubergine-tailored-mini-skirt",
        "label": "Coordinating Tailored Mini Skirt"
      },
      {
        "slug": "the-aubergine-tailored-wide-leg-trousers",
        "label": "Coordinating Wide-Leg Aubergine Trousers"
      }
    ],
    "coordinateText": "Pair with coordinating tailored mini skirt or wide-leg trousers.",
    "gallery": [
      {
        "url": "/products/aubergine-asymmetric-wrap-vest/1.JPG",
        "type": "model_front"
      },
      {
        "url": "/products/aubergine-asymmetric-wrap-vest/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/aubergine-asymmetric-wrap-vest/3.png",
        "type": "detail"
      },
      {
        "url": "/products/aubergine-asymmetric-wrap-vest/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/aubergine-asymmetric-wrap-vest/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes Asymmetric Sculpted Wrap Vest with Tailored Overlap Closure.",
    "description": "An asymmetric tailored wrap vest in rich aubergine, featuring diagonal overlap closure, sculpted waist darts, and clean structured lapel lines. A standout power separate that commands refined authority.",
    "story": "Engineered as a versatile statement piece for modern leadership dressing. The rich aubergine hue adds sophisticated depth while the architectural wrap cut flatters and shapes the silhouette.",
    "stylingNotes": "Style standalone with high-waisted black or ivory tailored trousers for key pitches, or layer under an open blazer for dimensional executive presence.",
    "sizeFit": "Structured tailored fit with adjustable wrap fastening. True to size. Model wears size S. Refer to Size Guide for measurements.",
    "fabricCare": {
      "fabric": "Luxe suiting blend with breathable satin lining.",
      "care": "Dry clean only. Store on structured garment hanger."
    },
    "images": [
      "/products/aubergine-asymmetric-wrap-vest/1.JPG",
      "/products/aubergine-asymmetric-wrap-vest/2.png",
      "/products/aubergine-asymmetric-wrap-vest/3.png",
      "/products/aubergine-asymmetric-wrap-vest/4.png",
      "/products/aubergine-asymmetric-wrap-vest/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },
  {
    "id": "w-21",
    "name": "Aubergine Tailored Mini Skirt",
    "slug": "the-aubergine-tailored-mini-skirt",
    "categoryType": "skirt",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Skirts",
    "shortType": "Tailored Mini Skirt",
    "setType": "Tailored Mini Skirt",
    "moment": "after-hours",
    "moments": [
      "after-hours",
      "founder"
    ],
    "momentName": "After-Hours Executive",
    "price": 1550,
    "color": "Wine",
    "availableColors": [
      "Wine",
      "Lilac",
      "Navy Blue",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "the-aubergine-draped-set",
        "label": "Complete Aubergine Draped Set"
      },
      {
        "slug": "the-aubergine-asymmetric-wrap-vest",
        "label": "Matching Asymmetric Wrap Vest"
      },
      {
        "slug": "the-aubergine-draped-blazer",
        "label": "Matching Draped Aubergine Blazer"
      }
    ],
    "coordinateText": "Pair with the matching draped vest to complete the set, or style with the draped blazer.",
    "gallery": [
      {
        "url": "/products/aubergine-tailored-mini-skirt/1.JPG",
        "type": "model_front"
      },
      {
        "url": "/products/aubergine-tailored-mini-skirt/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/aubergine-tailored-mini-skirt/3.png",
        "type": "detail"
      },
      {
        "url": "/products/aubergine-tailored-mini-skirt/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/aubergine-tailored-mini-skirt/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes Tailored Structured Mini Skirt with Concealed Zip.",
    "description": "A razor-sharp tailored mini skirt crafted from structured aubergine suiting blend. Features a clean high-rise waistband, flattering structural darts, and a smooth satin lining, engineered to pair effortlessly with executive blazers and draped vests.",
    "story": "Conceived for modern evening networking, summits, and post-conference dinners where sharp feminine tailoring offers distinctive authority.",
    "stylingNotes": "Pair with the matching Aubergine Draped Blazer and pointed leather pumps, or style with a silk shell for warm evening events.",
    "sizeFit": "High-waisted, tailored A-line silhouette with structured drape. Fits true to size. Refer to the Size Guide for detailed measurements.",
    "fabricCare": {
      "fabric": "Tailored structured suiting blend with tonal silky interior lining.",
      "care": "Dry clean only. Store on clip skirt hanger."
    },
    "images": [
      "/products/aubergine-tailored-mini-skirt/1.JPG",
      "/products/aubergine-tailored-mini-skirt/2.png",
      "/products/aubergine-tailored-mini-skirt/3.png",
      "/products/aubergine-tailored-mini-skirt/4.png",
      "/products/aubergine-tailored-mini-skirt/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },
  {
    "id": "w-01",
    "name": "Midnight Peplum Set",
    "slug": "the-midnight-peplum-set",
    "categoryType": "set",
    "gender": "female",
    "category": "coords",
    "categoryName": "Vests & Co-ords",
    "categoryLabel": "EXECUTIVE CO-ORDS",
    "shortType": "Peplum Jacket & Fishtail Skirt",
    "setType": "Peplum Jacket & Fishtail Skirt",
    "moment": "after-hours",
    "moments": [
      "after-hours",
      "founder"
    ],
    "momentName": "After-Hours Executive",
    "price": 6599,
    "color": "Navy Blue",
    "availableColors": [
      "Navy Blue",
      "Lilac",
      "Wine",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "includedPieces": [
      "Fitted Peplum Jacket",
      "Coordinated Fishtail Skirt"
    ],
    "coordinates": [
      {
        "slug": "the-midnight-contour-jacket",
        "label": "Matching Tailored Contour Jacket"
      }
    ],
    "gallery": [
      {
        "url": "/products/midnight-peplum-fishtail-set/1.png",
        "type": "model_front"
      },
      {
        "url": "/products/midnight-peplum-fishtail-set/2.png",
        "type": "model_side"
      },
      {
        "url": "/products/midnight-peplum-fishtail-set/3.png",
        "type": "detail"
      },
      {
        "url": "/products/midnight-peplum-fishtail-set/4.png",
        "type": "model_back"
      },
      {
        "url": "/products/midnight-peplum-fishtail-set/5.png",
        "type": "garment_front"
      },
      {
        "url": "/products/midnight-peplum-fishtail-set/6.png",
        "type": "garment_detail"
      },
      {
        "url": "/products/midnight-peplum-fishtail-set/7.png",
        "type": "detail"
      }
    ],
    "pieces": "Includes Peplum Jacket + Coordinated Fishtail Skirt.",
    "description": "A coordinated two-piece set featuring a fitted peplum jacket with gold-tone buttons and a matching fishtail skirt. Designed with a defined waist and softly flared silhouette.",
    "story": "Engineered for evening corporate banquets, awards nights, and high-profile networking dinners where standard suits feel too rigid.",
    "stylingNotes": "Accompany with delicate gold earrings and a structured mini clutch.",
    "sizeFit": "Tailored, close-to-body fit through the waist with a flared peplum and fishtail hem.",
    "fabricCare": {
      "fabric": "Subtly textured suiting fabric with structured body.",
      "care": "Dry clean only."
    },
    "images": [
      "/products/midnight-peplum-fishtail-set/1.png",
      "/products/midnight-peplum-fishtail-set/2.png",
      "/products/midnight-peplum-fishtail-set/3.png",
      "/products/midnight-peplum-fishtail-set/4.png",
      "/products/midnight-peplum-fishtail-set/5.png",
      "/products/midnight-peplum-fishtail-set/6.png",
      "/products/midnight-peplum-fishtail-set/7.png"
    ],
    "badge": null,
    "isNew": true,
    "separates": [
      {
        "slug": "the-midnight-contour-jacket",
        "label": "Midnight Contour Jacket"
      },
      {
        "slug": "the-midnight-flare-skirt",
        "label": "Midnight Flare Skirt"
      }
    ]
  },
  {
    "id": "w-12",
    "name": "Midnight Contour Jacket",
    "slug": "the-midnight-contour-jacket",
    "categoryType": "blazer",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Jackets",
    "shortType": "Tailored Executive Jacket",
    "setType": "Tailored Contour Jacket",
    "moment": "boardroom",
    "moments": [
      "boardroom",
      "founder",
      "essentials"
    ],
    "momentName": "The Boardroom Edit",
    "price": 3600,
    "color": "Navy Blue",
    "availableColors": [
      "Navy Blue",
      "Lilac",
      "Wine",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "the-midnight-peplum-set",
        "label": "Complete Peplum & Fishtail Set"
      },
      {
        "slug": "the-midnight-flare-skirt",
        "label": "Coordinating Midnight Fishtail Flare Skirt"
      }
    ],
    "coordinateText": "Pair with coordinating tailored trousers or fishtail skirt.",
    "gallery": [
      {
        "url": "/products/midnight-contour-jacket/1.png",
        "type": "model_front"
      },
      {
        "url": "/products/midnight-contour-jacket/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/midnight-contour-jacket/3.png",
        "type": "detail"
      },
      {
        "url": "/products/midnight-contour-jacket/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/midnight-contour-jacket/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes Structured Tailored Contour Jacket with Precision Darts.",
    "description": "A precision-engineered tailored contour jacket featuring architectural shoulder framing, sculpted waist shaping, and clean concealed fastening. Designed for high-stakes leadership presentations and sharp corporate transitions.",
    "story": "Designed for executive women commanding boardroom presence. The sharp contour silhouette delivers clean structural definition while ensuring lightweight all-day comfort.",
    "stylingNotes": "Pair with tailored wide-leg trousers and a crisp silk blouse for investor reviews, or layer over a minimal vest for sleek after-hours networking.",
    "sizeFit": "Tailored contour fit through shoulders and waist. True to size. Model wears size S. Refer to Size Guide for measurements.",
    "fabricCare": {
      "fabric": "Premium structured suiting crepe with smooth tonal interior lining.",
      "care": "Dry clean only. Store on structured garment hanger."
    },
    "images": [
      "/products/midnight-contour-jacket/1.png",
      "/products/midnight-contour-jacket/2.png",
      "/products/midnight-contour-jacket/3.png",
      "/products/midnight-contour-jacket/4.png",
      "/products/midnight-contour-jacket/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },
  {
    "id": "w-26",
    "name": "Midnight Flare Skirt",
    "slug": "the-midnight-flare-skirt",
    "categoryType": "skirt",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Skirts",
    "shortType": "Fishtail Flared Skirt",
    "setType": "Fishtail Flared Skirt",
    "moment": "after-hours",
    "moments": [
      "after-hours",
      "founder"
    ],
    "momentName": "After-Hours Executive",
    "price": 2999,
    "color": "Navy Blue",
    "availableColors": [
      "Navy Blue",
      "Lilac",
      "Wine",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "the-midnight-contour-jacket",
        "label": "Matching Contour Peplum Jacket"
      },
      {
        "slug": "the-midnight-peplum-set",
        "label": "Complete Peplum & Fishtail Set"
      }
    ],
    "coordinateText": "Pair with the coordinating contour jacket to complete the iconic fishtail skirt ensemble.",
    "gallery": [
      {
        "url": "/products/midnight-flare-skirt/1.JPG",
        "type": "model_front"
      },
      {
        "url": "/products/midnight-flare-skirt/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/midnight-flare-skirt/3.png",
        "type": "detail"
      },
      {
        "url": "/products/midnight-flare-skirt/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/midnight-flare-skirt/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes Flared Fishtail Tailored Skirt.",
    "description": "A dramatic fishtail flare skirt tailored in rich midnight navy. Sculpted smoothly through the hips with a delicate flared hemline, balancing corporate polish with fluid evening elegance.",
    "story": "Created for evening galas and corporate banquets where structured suiting transitions into graceful movement under formal lighting.",
    "stylingNotes": "Combine with the Midnight Contour Jacket or fitted knitwear and delicate gold accessories.",
    "sizeFit": "Close-to-body fit through hips with a gradual flare toward the hem. True to size.",
    "fabricCare": {
      "fabric": "Subtly textured suiting fabric with structured body and stretch drape.",
      "care": "Dry clean only."
    },
    "images": [
      "/products/midnight-flare-skirt/1.JPG",
      "/products/midnight-flare-skirt/2.png",
      "/products/midnight-flare-skirt/3.png",
      "/products/midnight-flare-skirt/4.png",
      "/products/midnight-flare-skirt/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },
  {
    "id": "w-11",
    "name": "Midnight Sculpted Vest",
    "slug": "the-midnight-sculpted-vest",
    "categoryType": "vest",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Vests",
    "shortType": "Sculpted Sleeveless Vest",
    "setType": "Sculpted Sleeveless Vest",
    "moment": "essentials",
    "moments": [
      "essentials",
      "founder",
      "after-hours"
    ],
    "momentName": "Executive Essentials",
    "price": 2999,
    "color": "Navy Blue",
    "availableColors": [
      "Navy Blue",
      "Lilac",
      "Wine",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "the-midnight-column-skirt",
        "label": "Coordinating Midnight Column Skirt"
      },
      {
        "slug": "the-midnight-sculpted-vest-set",
        "label": "Complete Sculpted Vest Set"
      }
    ],
    "coordinateText": "Pair with coordinating midnight column skirt or tailored trousers.",
    "gallery": [
      {
        "url": "/products/midnight-sculpted-vest/1.png",
        "type": "model_front"
      },
      {
        "url": "/products/midnight-sculpted-vest/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/midnight-sculpted-vest/3.png",
        "type": "detail"
      },
      {
        "url": "/products/midnight-sculpted-vest/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/midnight-sculpted-vest/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes Sculpted Tailored Vest with Contrast Cowl Neckline.",
    "description": "An architectural sleeveless vest tailored in deep midnight navy with an ivory contrast cowl drape neckline. Defined by precision waist sculpting and asymmetric button closures, engineered as a standalone power piece or layered over executive separates.",
    "story": "Created for modern leaders seeking architectural structure without the full weight of a heavy jacket. The sculpted silhouette balances feminine refinement with decisive authority.",
    "stylingNotes": "Wear standalone with high-waisted navy or black trousers for strategy sessions, or layer under a structured blazer for boardroom presentations.",
    "sizeFit": "Tailored, structured fit through the bust and waist with a subtle peplum flare. True to size. Refer to the Size Guide for detailed measurements.",
    "fabricCare": {
      "fabric": "Premium structured suiting crepe blend with smooth tonal interior lining.",
      "care": "Dry clean only. Store on structured garment hanger."
    },
    "images": [
      "/products/midnight-sculpted-vest/1.png",
      "/products/midnight-sculpted-vest/2.png",
      "/products/midnight-sculpted-vest/3.png",
      "/products/midnight-sculpted-vest/4.png",
      "/products/midnight-sculpted-vest/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },
  {
    "id": "w-25",
    "name": "Midnight Column Skirt",
    "slug": "the-midnight-column-skirt",
    "categoryType": "skirt",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Skirts",
    "shortType": "Tailored Column Skirt",
    "setType": "Tailored Column Skirt",
    "moment": "essentials",
    "moments": [
      "essentials",
      "founder"
    ],
    "momentName": "Executive Essentials",
    "price": 1999,
    "color": "Navy Blue",
    "availableColors": [
      "Navy Blue",
      "Lilac",
      "Wine",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "the-midnight-sculpted-vest",
        "label": "Matching Sculpted Cowl Vest"
      },
      {
        "slug": "the-midnight-sculpted-vest-set",
        "label": "Complete Sculpted Vest Set"
      }
    ],
    "coordinateText": "Pair with the matching Midnight Sculpted Vest to recreate the full architectural column ensemble.",
    "gallery": [
      {
        "url": "/products/midnight-column-skirt/1.JPG",
        "type": "model_front"
      },
      {
        "url": "/products/midnight-column-skirt/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/midnight-column-skirt/3.png",
        "type": "detail"
      },
      {
        "url": "/products/midnight-column-skirt/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/midnight-column-skirt/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes Floor-Length Tailored Column Skirt with Back Slit.",
    "description": "An architectural floor-length column skirt in midnight navy. Tailored with a clean contoured high waist and a discreet back walking slit, creating an unbroken vertical line that embodies modern executive composure.",
    "story": "Inspired by statuesque executive silhouettes. The column skirt provides uncompromising formal elegance for summits, boardroom meetings, and ceremonial corporate milestones.",
    "stylingNotes": "Pairs seamlessly with the Midnight Sculpted Vest or sharp tailored jackets and stiletto pumps.",
    "sizeFit": "Fitted through hips and thighs with a straight floor-length drape. Back vent ensures comfortable stride.",
    "fabricCare": {
      "fabric": "Tailored structured crepe suiting blend with smooth tonal lining.",
      "care": "Dry clean only."
    },
    "images": [
      "/products/midnight-column-skirt/1.JPG",
      "/products/midnight-column-skirt/2.png",
      "/products/midnight-column-skirt/3.png",
      "/products/midnight-column-skirt/4.png",
      "/products/midnight-column-skirt/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },
  {
    "id": "w-08",
    "name": "Noir Tailored Set",
    "slug": "the-noir-tailored-suit",
    "categoryType": "set",
    "gender": "female",
    "category": "suits",
    "categoryName": "Power Suits & Sets",
    "categoryLabel": "POWER SUITS & SETS",
    "shortType": "Single-Breasted Blazer & Wide-Leg Trousers",
    "setType": "Single-Breasted Blazer & Wide-Leg Trousers",
    "moment": "boardroom",
    "moments": [
      "boardroom",
      "founder",
      "essentials"
    ],
    "momentName": "The Boardroom Edit",
    "price": 4550,
    "color": "Obsidian Black",
    "availableColors": [
      "Obsidian Black"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "includedPieces": [
      "Single-Breasted Tailored Blazer",
      "Coordinated Wide-Leg Trousers"
    ],
    "coordinates": [
      {
        "slug": "the-noir-tailored-blazer",
        "label": "Matching Single-Breasted Power Blazer"
      },
      {
        "slug": "the-noir-tailored-trousers",
        "label": "Matching Tailored Wide-Leg Trousers"
      },
      {
        "slug": "the-noir-structured-vest",
        "label": "Matching Sleeveless Structured Vest"
      }
    ],
    "gallery": [
      {
        "url": "/products/the-noir-tailored-suit/1.png",
        "type": "model_front"
      },
      {
        "url": "/products/the-noir-tailored-suit/2.png",
        "type": "model_three_quarter"
      },
      {
        "url": "/products/the-noir-tailored-suit/3.png",
        "type": "model_side"
      },
      {
        "url": "/products/the-noir-tailored-suit/4.png",
        "type": "detail"
      },
      {
        "url": "/products/the-noir-tailored-suit/5.png",
        "type": "model_back"
      },
      {
        "url": "/products/the-noir-tailored-suit/6.png",
        "type": "garment_front"
      },
      {
        "url": "/products/the-noir-tailored-suit/7.png",
        "type": "detail"
      }
    ],
    "pieces": "Includes Tailored Single-Breasted Blazer + Coordinated Wide-Leg Trousers.",
    "description": "A refined black tailoring set built around a clean, elongated silhouette. The single-breasted blazer is defined by sharp notch lapels, a sculpted waist and a statement metallic button, paired with fluid wide-leg trousers for a modern expression of executive presence.",
    "story": "Created for moments of high authority. The clean black silhouette provides a commanding visual line, while relaxed trousers ensure effortless movement throughout full-day boardroom sessions.",
    "stylingNotes": "Pair with an ivory silk camisole and pointed pumps for morning reviews; switch to minimalist gold jewelry for evening dinners.",
    "sizeFit": "Blazer is tailored through the shoulders and waist with an elongated silhouette. Trousers fall from the waist into a relaxed wide-leg shape. Refer to the Size Guide for detailed measurements.",
    "fabricCare": {
      "fabric": "Premium structured suiting blend with smooth interior lining.",
      "care": "Dry clean only. Store on structured garment hanger."
    },
    "images": [
      "/products/the-noir-tailored-suit/1.png",
      "/products/the-noir-tailored-suit/2.png",
      "/products/the-noir-tailored-suit/3.png",
      "/products/the-noir-tailored-suit/4.png",
      "/products/the-noir-tailored-suit/5.png",
      "/products/the-noir-tailored-suit/6.png",
      "/products/the-noir-tailored-suit/7.png"
    ],
    "badge": null,
    "isNew": true,
    "separates": [
      {
        "slug": "the-noir-tailored-blazer",
        "label": "Noir Tailored Blazer"
      },
      {
        "slug": "the-noir-tailored-trousers",
        "label": "Noir Tailored Trousers"
      }
    ]
  },
  {
    "id": "w-18",
    "name": "Noir Tailored Blazer",
    "slug": "the-noir-tailored-blazer",
    "categoryType": "blazer",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Blazers",
    "shortType": "Tailored Power Blazer",
    "setType": "Noir Tailored Blazer",
    "moment": "boardroom",
    "moments": [
      "boardroom",
      "presentation",
      "founder"
    ],
    "momentName": "The Boardroom Edit",
    "price": 1600,
    "color": "Obsidian Black",
    "availableColors": [
      "Obsidian Black"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "the-noir-tailored-trousers",
        "label": "Coordinating Noir Tailored Trousers"
      },
      {
        "slug": "the-noir-tailored-suit",
        "label": "Complete Noir Tailored Suit"
      }
    ],
    "coordinateText": "Pair with coordinating noir wide-leg trousers.",
    "gallery": [
      {
        "url": "/products/noir-tailored-blazer/1.JPG",
        "type": "model_front"
      },
      {
        "url": "/products/noir-tailored-blazer/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/noir-tailored-blazer/3.png",
        "type": "detail"
      },
      {
        "url": "/products/noir-tailored-blazer/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/noir-tailored-blazer/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes Standalone Single-Breasted Tailored Power Blazer with Metallic Hardware.",
    "description": "An impeccably structured power blazer in obsidian black, defined by sharp notched lapels, precision waist contouring, and statement metallic button closure for a commanding executive presence.",
    "story": "Designed as the quintessential boardroom cornerstone. Its clean architectural lines deliver uncompromising authority and timeless sophistication across high-stakes corporate settings.",
    "stylingNotes": "Layer over silk camisoles or pair with crisp tailored trousers and pointed heels for board meetings and investor presentations.",
    "sizeFit": "Sharp tailored fit through the shoulders with structural waist contour. True to size. Model wears size S. Refer to Size Guide for measurements.",
    "fabricCare": {
      "fabric": "Premium suiting wool-crepe blend with full tonal interior satin lining.",
      "care": "Dry clean only. Store on structured garment hanger."
    },
    "images": [
      "/products/noir-tailored-blazer/1.JPG",
      "/products/noir-tailored-blazer/2.png",
      "/products/noir-tailored-blazer/3.png",
      "/products/noir-tailored-blazer/4.png",
      "/products/noir-tailored-blazer/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },
  {
    "id": "w-28",
    "name": "Noir Tailored Trousers",
    "slug": "the-noir-tailored-trousers",
    "categoryType": "trouser",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Trousers",
    "shortType": "Tailored Wide-Leg Trousers",
    "setType": "Noir Tailored Trousers",
    "moment": "boardroom",
    "moments": [
      "boardroom",
      "founder",
      "essentials"
    ],
    "momentName": "The Boardroom Edit",
    "price": 2950,
    "color": "Obsidian Black",
    "availableColors": [
      "Obsidian Black"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "the-noir-tailored-suit",
        "label": "Full Outfit: Noir Tailored Set"
      },
      {
        "slug": "the-noir-tailored-blazer",
        "label": "Matching Noir Tailored Blazer"
      },
      {
        "slug": "the-noir-structured-vest",
        "label": "Matching Noir Structured Vest"
      },
      {
        "slug": "the-noir-layered-longline-vest",
        "label": "Matching Noir Layered Longline Vest"
      }
    ],
    "coordinateText": "Complete the full outfit with the Noir Tailored Set, or pair with its matching blazers and vests.",
    "gallery": [
      {
        "url": "/products/noir-tailored-trousers/1.JPG",
        "type": "model_front"
      },
      {
        "url": "/products/noir-tailored-trousers/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/noir-tailored-trousers/3.png",
        "type": "detail"
      },
      {
        "url": "/products/noir-tailored-trousers/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/noir-tailored-trousers/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes Tailored Wide-Leg Trousers with Clean Front Fly.",
    "description": "Precision-tailored wide-leg trousers in obsidian black, engineered with an elongated high-waist rise, concealed front fastening, and graceful fluid volume for all-day executive polish.",
    "story": "The defining foundation of executive dressing. Designed to transition effortlessly from morning boardroom sessions to evening dinner meetings with commanding elegance.",
    "stylingNotes": "Pair with the Noir Tailored Blazer for full power suiting, or wear with the Noir Structured Vest for clean architectural layering.",
    "sizeFit": "High-rise waistband with relaxed, fluid wide-leg silhouette. True to size.",
    "fabricCare": {
      "fabric": "Mid-weight wool-crepe suiting blend with smooth drape and anti-crease finish.",
      "care": "Specialized dry clean only. Store on structured clamp hanger."
    },
    "images": [
      "/products/noir-tailored-trousers/1.JPG",
      "/products/noir-tailored-trousers/2.png",
      "/products/noir-tailored-trousers/3.png",
      "/products/noir-tailored-trousers/4.png",
      "/products/noir-tailored-trousers/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },
  {
    "id": "w-14",
    "name": "Aubergine Draped Blazer",
    "slug": "the-aubergine-draped-blazer",
    "categoryType": "blazer",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Blazers",
    "shortType": "Tailored Draped Blazer",
    "setType": "Structured Draped Blazer",
    "moment": "presentation",
    "moments": [
      "presentation",
      "founder",
      "after-hours"
    ],
    "momentName": "Presentations & Pitches",
    "price": 3550,
    "color": "Wine",
    "availableColors": [
      "Wine",
      "Lilac",
      "Navy Blue",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "the-aubergine-tailored-suit",
        "label": "Complete Aubergine Tailored Set"
      },
      {
        "slug": "the-aubergine-tailored-wide-leg-trousers",
        "label": "Coordinating Wide-Leg Aubergine Trousers"
      },
      {
        "slug": "the-aubergine-tailored-mini-skirt",
        "label": "Coordinating Tailored Mini Skirt"
      }
    ],
    "coordinateText": "Pair with coordinating aubergine wide-leg trousers.",
    "gallery": [
      {
        "url": "/products/aubergine-draped-blazer/1.JPG",
        "type": "model_front"
      },
      {
        "url": "/products/aubergine-draped-blazer/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/aubergine-draped-blazer/3.png",
        "type": "detail"
      },
      {
        "url": "/products/aubergine-draped-blazer/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/aubergine-draped-blazer/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes Architectural Draped Blazer with Asymmetrical Lapel.",
    "description": "An architectural tailored blazer in rich aubergine, featuring an asymmetrical lapel drape, sculpted waist darts, and clean structured shoulder framing. Crafted as a standout executive statement piece.",
    "story": "Conceived for presentations and keynote moments where presence is non-negotiable. The rich aubergine drape adds sculptural fluidity to rigorous executive tailoring.",
    "stylingNotes": "Pair with tailored high-waisted black trousers for formal pitches, or wear over a silk camisole for evening networking.",
    "sizeFit": "Tailored structured silhouette with sculpted waist. True to size. Model wears size S. Refer to Size Guide for measurements.",
    "fabricCare": {
      "fabric": "Luxe suiting crepe blend with smooth tonal satin lining.",
      "care": "Dry clean only. Store on structured garment hanger."
    },
    "images": [
      "/products/aubergine-draped-blazer/1.JPG",
      "/products/aubergine-draped-blazer/2.png",
      "/products/aubergine-draped-blazer/3.png",
      "/products/aubergine-draped-blazer/4.png",
      "/products/aubergine-draped-blazer/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },
  {
    "id": "w-22",
    "name": "Aubergine Tailored Wide-Leg Trousers",
    "slug": "the-aubergine-tailored-wide-leg-trousers",
    "categoryType": "trouser",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Trousers",
    "shortType": "Wide-Leg Trousers",
    "setType": "Wide-Leg Trousers",
    "moment": "boardroom",
    "moments": [
      "boardroom",
      "presentation"
    ],
    "momentName": "The Boardroom Edit",
    "price": 1999,
    "color": "Wine",
    "availableColors": [
      "Wine",
      "Lilac",
      "Navy Blue",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "the-aubergine-tailored-suit",
        "label": "Complete Aubergine Tailored Set"
      },
      {
        "slug": "the-aubergine-draped-blazer",
        "label": "Matching Draped Aubergine Blazer"
      },
      {
        "slug": "the-aubergine-asymmetric-wrap-vest",
        "label": "Matching Asymmetric Wrap Vest"
      }
    ],
    "coordinateText": "Pair with coordinating aubergine single-button blazer or draped vest to create a complete power suit.",
    "gallery": [
      {
        "url": "/products/aubergine-tailored-wide-leg-trousers/1.png",
        "type": "model_front"
      },
      {
        "url": "/products/aubergine-tailored-wide-leg-trousers/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/aubergine-tailored-wide-leg-trousers/3.png",
        "type": "detail"
      },
      {
        "url": "/products/aubergine-tailored-wide-leg-trousers/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/aubergine-tailored-wide-leg-trousers/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes High-Waisted Wide-Leg Tailored Trousers.",
    "description": "Commanding wide-leg trousers cut in deep jewel-toned aubergine. Designed with crisp front pressing, an elongated fluid silhouette, side slip pockets, and a tailored contoured waistband for decisive boardroom gravitas.",
    "story": "Engineered for executive motion. The fluid leg drape delivers maximum elegance during strides through conference halls while maintaining razor-sharp structure.",
    "stylingNotes": "Style with the matching Aubergine Shawl Blazer for high-stakes investor meetings, or with a crisp ivory blouse for day-to-day authority.",
    "sizeFit": "High-rise, relaxed wide-leg cut with extended leg length suited for heels. Refer to the Size Guide for detailed measurements.",
    "fabricCare": {
      "fabric": "Premium structured suiting weave with comfortable stretch recovery.",
      "care": "Dry clean only. Hang on felted trouser bar."
    },
    "images": [
      "/products/aubergine-tailored-wide-leg-trousers/1.png",
      "/products/aubergine-tailored-wide-leg-trousers/2.png",
      "/products/aubergine-tailored-wide-leg-trousers/3.png",
      "/products/aubergine-tailored-wide-leg-trousers/4.png",
      "/products/aubergine-tailored-wide-leg-trousers/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },
  {
    "id": "w-05",
    "name": "Lilac Flare Set",
    "slug": "the-lilac-flare-suit",
    "categoryType": "set",
    "gender": "female",
    "category": "suits",
    "categoryName": "Power Suits & Sets",
    "categoryLabel": "POWER SUITS & SETS",
    "shortType": "3-Piece Set: Longline Blazer, Tube Top & Flared Trousers",
    "setType": "3-Piece Set: Longline Blazer, Tube Top & Flared Trousers",
    "moment": "presentation",
    "moments": [
      "presentation",
      "after-hours"
    ],
    "momentName": "The Presentation Edit",
    "price": 8999,
    "color": "Lilac",
    "availableColors": [
      "Lilac",
      "Wine",
      "Navy Blue",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "includedPieces": [
      "Longline Single-Breasted Blazer",
      "Coordinated Inner Tube Top (Included)",
      "Coordinated Flared Trousers"
    ],
    "coordinates": [
      {
        "slug": "the-lilac-sculpted-flare-blazer",
        "label": "Matching Sculpted Flare Blazer"
      }
    ],
    "gallery": [
      {
        "url": "/products/lilac-sculpted-flare-suit/1.png",
        "type": "model_front"
      },
      {
        "url": "/products/lilac-sculpted-flare-suit/2.png",
        "type": "model_side"
      },
      {
        "url": "/products/lilac-sculpted-flare-suit/3.png",
        "type": "detail"
      },
      {
        "url": "/products/lilac-sculpted-flare-suit/4.png",
        "type": "model_back"
      },
      {
        "url": "/products/lilac-sculpted-flare-suit/5.png",
        "type": "garment_front"
      },
      {
        "url": "/products/lilac-sculpted-flare-suit/6.png",
        "type": "garment_detail"
      },
      {
        "url": "/products/lilac-sculpted-flare-suit/7.png",
        "type": "detail"
      }
    ],
    "pieces": "Complete 3-Piece Ensemble: Longline Single-Breasted Blazer + Coordinated Inner Tube Top + Flared Trousers (Tube Top included in price).",
    "description": "A softly tinted 3-piece tailoring ensemble featuring a structured longline single-breasted blazer, coordinated inner tube top (included in price), and flared trousers. Cut in an understated lilac hue that balances contemporary sophistication with professional rigor.",
    "story": "Tailored to command the room with warmth and poise. The elongated silhouette makes a lasting impression from stage presentations to client conclaves.",
    "stylingNotes": "Style with neutral tones and metallic accents for maximum impact during conference appearances.",
    "sizeFit": "Longline blazer with structured shoulders; matching inner tube top; high-rise flared trousers with graceful floor-skimming length.",
    "fabricCare": {
      "fabric": "Refined suiting blend with soft drape.",
      "care": "Dry clean only. Store on wide wooden hanger."
    },
    "images": [
      "/products/lilac-sculpted-flare-suit/1.png",
      "/products/lilac-sculpted-flare-suit/2.png",
      "/products/lilac-sculpted-flare-suit/3.png",
      "/products/lilac-sculpted-flare-suit/4.png",
      "/products/lilac-sculpted-flare-suit/5.png",
      "/products/lilac-sculpted-flare-suit/6.png",
      "/products/lilac-sculpted-flare-suit/7.png"
    ],
    "badge": null,
    "isNew": true,
    "separates": [
      {
        "slug": "the-lilac-sculpted-flare-blazer",
        "label": "Lilac Sculpted Flare Blazer"
      },
      {
        "slug": "the-lilac-flare-trousers",
        "label": "Lilac Flare Trousers"
      }
    ]
  },
  {
    "id": "w-15",
    "name": "Lilac Sculpted Flare Blazer",
    "slug": "the-lilac-sculpted-flare-blazer",
    "categoryType": "blazer",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Blazers",
    "shortType": "Sculpted Flare Blazer",
    "setType": "Tailored Peplum Flare Blazer",
    "moment": "founder",
    "moments": [
      "founder",
      "essentials",
      "presentation"
    ],
    "momentName": "The Founder's Suite",
    "price": 2999,
    "color": "Lilac",
    "availableColors": [
      "Lilac",
      "Wine",
      "Navy Blue",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "the-lilac-flare-trousers",
        "label": "Coordinating Lilac Flared Trousers"
      },
      {
        "slug": "the-lilac-flare-suit",
        "label": "Complete Lilac Tailored Suit"
      }
    ],
    "coordinateText": "Pair with coordinating dusty rose flared trousers.",
    "gallery": [
      {
        "url": "/products/lilac-sculpted-flare-blazer/1.JPG",
        "type": "model_front"
      },
      {
        "url": "/products/lilac-sculpted-flare-blazer/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/lilac-sculpted-flare-blazer/3.png",
        "type": "detail"
      },
      {
        "url": "/products/lilac-sculpted-flare-blazer/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/lilac-sculpted-flare-blazer/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes Sculpted Contoured Blazer with Peplum Flare.",
    "description": "A tailored feminine blazer in muted lilac, featuring an architectural hourglass waist, contoured peplum flare, and crisp notch lapels. Designed to bring sculpted grace to boardroom dressing.",
    "story": "Engineered to redefine corporate softness through architectural precision. The structured waist and subtle flare create an authoritative yet refined silhouette.",
    "stylingNotes": "Style with matching flared or straight-leg trousers for daytime executive meetings, or style open over a slip dress.",
    "sizeFit": "Contoured hourglass fit through waist with gentle peplum flare. True to size. Model wears size S. Refer to Size Guide for measurements.",
    "fabricCare": {
      "fabric": "Structured bonded suiting blend with breathable lining.",
      "care": "Dry clean only. Store on structured garment hanger."
    },
    "images": [
      "/products/lilac-sculpted-flare-blazer/1.JPG",
      "/products/lilac-sculpted-flare-blazer/2.png",
      "/products/lilac-sculpted-flare-blazer/3.png",
      "/products/lilac-sculpted-flare-blazer/4.png",
      "/products/lilac-sculpted-flare-blazer/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },
  {
    "id": "w-23",
    "name": "Lilac Flare Trousers",
    "slug": "the-lilac-flare-trousers",
    "categoryType": "trouser",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Trousers",
    "shortType": "Flared Tailored Trousers",
    "setType": "Flared Tailored Trousers",
    "moment": "presentation",
    "moments": [
      "presentation",
      "founder"
    ],
    "momentName": "Keynote & Presence",
    "price": 3999,
    "color": "Lilac",
    "availableColors": [
      "Lilac",
      "Wine",
      "Navy Blue",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "the-lilac-sculpted-flare-blazer",
        "label": "Matching Sculpted Flare Blazer"
      },
      {
        "slug": "the-lilac-flare-suit",
        "label": "Complete Lilac Tailored Suit"
      }
    ],
    "coordinateText": "Pair with the coordinating sculpted flare blazer to complete the monochromatic power suit.",
    "gallery": [
      {
        "url": "/products/lilac-flare-trousers/1.png",
        "type": "model_front"
      },
      {
        "url": "/products/lilac-flare-trousers/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/lilac-flare-trousers/3.png",
        "type": "detail"
      },
      {
        "url": "/products/lilac-flare-trousers/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/lilac-flare-trousers/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes Tailored Flared Suiting Trousers.",
    "description": "Sculptural flared trousers in subtle lilac. Tailored slim through the thigh before gently breaking into an architectural flare at the knee, creating an elongated and commanding posture.",
    "story": "Created for presentation stages and keynote addresses, introducing soft modern warmth into executive power dressing without losing sharp tailoring.",
    "stylingNotes": "Pair with pointed nude or gold heels and the matching Dusty Rose Flare Blazer.",
    "sizeFit": "Slim through hip and thigh with a graceful flare below the knee. True to size.",
    "fabricCare": {
      "fabric": "High-density tailored suiting blend with smooth drape.",
      "care": "Dry clean only."
    },
    "images": [
      "/products/lilac-flare-trousers/1.png",
      "/products/lilac-flare-trousers/2.png",
      "/products/lilac-flare-trousers/3.png",
      "/products/lilac-flare-trousers/4.png",
      "/products/lilac-flare-trousers/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },

  {
    "id": "w-24",
    "name": "Dusty Rose Tailored Trousers",
    "slug": "the-dusty-rose-trousers",
    "categoryType": "trouser",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Trousers",
    "shortType": "Tailored Straight Trousers",
    "setType": "Tailored Straight Trousers",
    "moment": "after-hours",
    "moments": [
      "after-hours",
      "essentials"
    ],
    "momentName": "After-Hours Executive",
    "price": 3450,
    "color": "Muted Pink",
    "availableColors": [
      "Muted Pink",
      "Lilac",
      "Wine",
      "Navy Blue"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "the-dusty-rose-embroidered-farchi-set",
        "label": "Complete Embroidered Farchi Set"
      }
    ],
    "coordinateText": "Pair with the coordinating embroidered farchi set for an elevated Indian corporate look.",
    "gallery": [
      {
        "url": "/products/dusty-rose-trousers/1.png",
        "type": "model_front"
      },
      {
        "url": "/products/dusty-rose-trousers/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/dusty-rose-trousers/3.png",
        "type": "detail"
      },
      {
        "url": "/products/dusty-rose-trousers/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/dusty-rose-trousers/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes Tailored Straight-Leg Suiting Trousers.",
    "description": "Refined straight-leg tailoring trousers in dusty rose, cut with an ankle-grazing hem and structured waistband designed to complement corporate tunics and statement jackets.",
    "story": "A bridge between heritage Indian corporate wear and Western executive tailoring, offering comfortable movement across festive corporate gatherings and dinner meetings.",
    "stylingNotes": "Complements the Dusty Rose Embroidered Farchi Set or minimalist ivory silk tops.",
    "sizeFit": "Mid-to-high rise with tailored straight-leg drape. True to size.",
    "fabricCare": {
      "fabric": "Fine suiting blend with soft breathable texture.",
      "care": "Dry clean only."
    },
    "images": [
      "/products/dusty-rose-trousers/1.png",
      "/products/dusty-rose-trousers/2.png",
      "/products/dusty-rose-trousers/3.png",
      "/products/dusty-rose-trousers/4.png",
      "/products/dusty-rose-trousers/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },
  {
    "id": "w-19",
    "name": "Noir Structured Vest",
    "slug": "the-noir-structured-vest",
    "categoryType": "vest",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Vests",
    "shortType": "Structured Tailored Vest",
    "setType": "Noir Structured Vest",
    "moment": "presentation",
    "moments": [
      "presentation",
      "founder",
      "after-hours"
    ],
    "momentName": "The Presentation Edit",
    "price": 2999,
    "color": "Obsidian Black",
    "availableColors": [
      "Obsidian Black"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "noir-sculpted-vest-set",
        "label": "Full Set: Noir Sculpted Vest Set"
      },
      {
        "slug": "the-noir-tailored-trousers",
        "label": "Coordinating Noir Tailored Trousers"
      }
    ],
    "coordinateText": "Complete the full outfit with the Noir Sculpted Vest Set, or pair with coordinating Noir Tailored Trousers.",
    "gallery": [
      {
        "url": "/products/noir-structured-vest/1.JPG",
        "type": "model_front"
      },
      {
        "url": "/products/noir-structured-vest/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/noir-structured-vest/3.png",
        "type": "detail"
      },
      {
        "url": "/products/noir-structured-vest/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/noir-structured-vest/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes Standalone Sculpted Tailored Vest with Clean Front Closure.",
    "description": "A sculptural sleeveless tailored vest in rich obsidian black, crafted with angular lapel architecture, sculpted waist darts, and clean minimalist lines for modern power dressing.",
    "story": "A bold reimagination of executive tailoring designed for modern versatility. Worn solo or styled over shirts, it commands authority with contemporary ease.",
    "stylingNotes": "Wear buttoned as a standalone statement top with tailored wide-leg trousers, or layer under a structured power blazer for three-piece dimension.",
    "sizeFit": "Tailored sculpt through the bust and waist with a clean straight back line. True to size. Model wears size S. Refer to Size Guide for measurements.",
    "fabricCare": {
      "fabric": "High-density tailored crepe suiting with breathable lining.",
      "care": "Specialized dry clean only. Store on padded hanger."
    },
    "images": [
      "/products/noir-structured-vest/1.JPG",
      "/products/noir-structured-vest/2.png",
      "/products/noir-structured-vest/3.png",
      "/products/noir-structured-vest/4.png",
      "/products/noir-structured-vest/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },
  {
    "id": "w-04",
    "name": "Aubergine Tailored Set",
    "slug": "the-aubergine-tailored-suit",
    "categoryType": "set",
    "gender": "female",
    "category": "suits",
    "categoryName": "Power Suits & Sets",
    "categoryLabel": "POWER SUITS & SETS",
    "shortType": "Shawl-Lapel Blazer & Wide-Leg Trousers",
    "setType": "Shawl-Lapel Blazer & Wide-Leg Trousers",
    "moment": "boardroom",
    "moments": [
      "boardroom",
      "presentation"
    ],
    "momentName": "The Boardroom Edit",
    "price": 6000,
    "color": "Wine",
    "availableColors": [
      "Wine",
      "Lilac",
      "Navy Blue",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "includedPieces": [
      "Tailored Shawl-Lapel Blazer",
      "Coordinated Wide-Leg Trousers"
    ],
    "coordinates": [
      {
        "slug": "the-aubergine-draped-blazer",
        "label": "Matching Draped Aubergine Blazer"
      },
      {
        "slug": "the-aubergine-asymmetric-wrap-vest",
        "label": "Matching Asymmetric Wrap Vest"
      }
    ],
    "gallery": [
      {
        "url": "/products/aubergine-tailored-power-suit/1.png",
        "type": "model_front"
      },
      {
        "url": "/products/aubergine-tailored-power-suit/2.png",
        "type": "model_side"
      },
      {
        "url": "/products/aubergine-tailored-power-suit/3.png",
        "type": "detail"
      },
      {
        "url": "/products/aubergine-tailored-power-suit/4.png",
        "type": "model_back"
      },
      {
        "url": "/products/aubergine-tailored-power-suit/5.png",
        "type": "garment_front"
      },
      {
        "url": "/products/aubergine-tailored-power-suit/6.png",
        "type": "garment_detail"
      },
      {
        "url": "/products/aubergine-tailored-power-suit/7.png",
        "type": "detail"
      }
    ],
    "pieces": "Includes Tailored Blazer + Coordinated Wide-Leg Trousers.",
    "description": "A coordinated two-piece suit featuring a tailored single-button blazer with a soft shawl-style lapel, structured shoulders, front pockets and buttoned cuffs, paired with matching wide-leg trousers.",
    "story": "Deep jewel-toned aubergine combines quiet gravitas with modern executive distinction.",
    "stylingNotes": "Pair with black leather accessories and minimal jewelry.",
    "sizeFit": "Tailored fit through the blazer with a defined shoulder line and a relaxed wide-leg trouser silhouette.",
    "fabricCare": {
      "fabric": "Tailored woven suiting blend.",
      "care": "Dry clean only."
    },
    "images": [
      "/products/aubergine-tailored-power-suit/1.png",
      "/products/aubergine-tailored-power-suit/2.png",
      "/products/aubergine-tailored-power-suit/3.png",
      "/products/aubergine-tailored-power-suit/4.png",
      "/products/aubergine-tailored-power-suit/5.png",
      "/products/aubergine-tailored-power-suit/6.png",
      "/products/aubergine-tailored-power-suit/7.png"
    ],
    "badge": null,
    "isNew": true,
    "separates": [
      {
        "slug": "the-aubergine-draped-blazer",
        "label": "Aubergine Draped Blazer"
      },
      {
        "slug": "the-aubergine-tailored-wide-leg-trousers",
        "label": "Aubergine Tailored Wide-Leg Trousers"
      }
    ]
  },
  {
    "id": "w-02",
    "name": "Midnight Sculpted Vest Set",
    "slug": "the-midnight-sculpted-vest-set",
    "categoryType": "set",
    "gender": "female",
    "category": "coords",
    "categoryName": "Vests & Co-ords",
    "categoryLabel": "EXECUTIVE CO-ORDS",
    "shortType": "Sculpted Vest & Column Skirt",
    "setType": "Sculpted Vest & Column Skirt",
    "moment": "essentials",
    "moments": [
      "essentials",
      "founder"
    ],
    "momentName": "Executive Essentials",
    "price": 4998,
    "color": "Navy Blue",
    "availableColors": [
      "Navy Blue",
      "Lilac",
      "Wine",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "includedPieces": [
      "Sculpted Sleeveless Vest with Cowl Neckline",
      "Coordinated Column Skirt"
    ],
    "coordinates": [
      {
        "slug": "the-midnight-sculpted-vest",
        "label": "Matching Sculpted Sleeveless Vest"
      }
    ],
    "gallery": [
      {
        "url": "/products/midnight-sculpted-vest-set/1.png",
        "type": "model_front"
      },
      {
        "url": "/products/midnight-sculpted-vest-set/2.png",
        "type": "model_side"
      },
      {
        "url": "/products/midnight-sculpted-vest-set/3.png",
        "type": "detail"
      },
      {
        "url": "/products/midnight-sculpted-vest-set/4.png",
        "type": "model_back"
      },
      {
        "url": "/products/midnight-sculpted-vest-set/5.png",
        "type": "garment_front"
      },
      {
        "url": "/products/midnight-sculpted-vest-set/6.png",
        "type": "garment_detail"
      },
      {
        "url": "/products/midnight-sculpted-vest-set/7.png",
        "type": "detail"
      }
    ],
    "pieces": "Includes Sculpted Vest + Coordinated Column Skirt.",
    "description": "A tailored two-piece set featuring a sculpted sleeveless vest with ivory cowl contrast neckline and a coordinating column skirt in deep midnight navy.",
    "story": "Architectural contrast and clean lines provide an elevated presence for executive office days.",
    "stylingNotes": "Can be worn as an ensemble or paired separately with tailored trousers.",
    "sizeFit": "Structured, tailored fit with defined silhouette and floor-length column skirt.",
    "fabricCare": {
      "fabric": "Structured crepe and suiting blend.",
      "care": "Dry clean only."
    },
    "images": [
      "/products/midnight-sculpted-vest-set/1.png",
      "/products/midnight-sculpted-vest-set/2.png",
      "/products/midnight-sculpted-vest-set/3.png",
      "/products/midnight-sculpted-vest-set/4.png",
      "/products/midnight-sculpted-vest-set/5.png",
      "/products/midnight-sculpted-vest-set/6.png",
      "/products/midnight-sculpted-vest-set/7.png"
    ],
    "badge": null,
    "isNew": true,
    "separates": [
      {
        "slug": "the-midnight-sculpted-vest",
        "label": "Midnight Sculpted Vest"
      },
      {
        "slug": "the-midnight-column-skirt",
        "label": "Midnight Column Skirt"
      }
    ]
  },
  {
    "id": "w-03",
    "name": "Aubergine Draped Set",
    "slug": "the-aubergine-draped-set",
    "categoryType": "set",
    "gender": "female",
    "category": "coords",
    "categoryName": "Vests & Co-ords",
    "categoryLabel": "EXECUTIVE CO-ORDS",
    "shortType": "Draped Vest & Tailored Mini Skirt",
    "setType": "Draped Vest & Tailored Mini Skirt",
    "moment": "after-hours",
    "moments": [
      "after-hours"
    ],
    "momentName": "After-Hours Executive",
    "price": 4850,
    "color": "Wine",
    "availableColors": [
      "Wine",
      "Lilac",
      "Navy Blue",
      "Muted Pink"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "includedPieces": [
      "Draped Sleeveless Vest",
      "Coordinated Tailored Mini Skirt"
    ],
    "coordinates": [
      {
        "slug": "the-aubergine-asymmetric-wrap-vest",
        "label": "Matching Asymmetric Wrap Vest"
      },
      {
        "slug": "the-aubergine-draped-blazer",
        "label": "Matching Draped Blazer"
      }
    ],
    "gallery": [
      {
        "url": "/products/aubergine-draped-vest-mini-set/1.png",
        "type": "model_front"
      },
      {
        "url": "/products/aubergine-draped-vest-mini-set/2.png",
        "type": "model_side"
      },
      {
        "url": "/products/aubergine-draped-vest-mini-set/3.png",
        "type": "detail"
      },
      {
        "url": "/products/aubergine-draped-vest-mini-set/4.png",
        "type": "model_back"
      },
      {
        "url": "/products/aubergine-draped-vest-mini-set/5.png",
        "type": "garment_front"
      },
      {
        "url": "/products/aubergine-draped-vest-mini-set/6.png",
        "type": "garment_detail"
      },
      {
        "url": "/products/aubergine-draped-vest-mini-set/7.png",
        "type": "detail"
      }
    ],
    "pieces": "Includes Draped Sleeveless Vest + Coordinated Mini Skirt.",
    "description": "A coordinated two-piece set featuring a sleeveless structured vest with layered draped lapels, an asymmetric front panel and a single gold-tone button detail, paired with a matching tailored mini skirt.",
    "story": "Modern sculptural tailoring that offers a sharp, elevated cocktail and networking presence.",
    "stylingNotes": "Pairs elegantly with sheer tights, pointed ankle boots, and gold cuffs.",
    "sizeFit": "Tailored fit through the waist with a structured sleeveless silhouette.",
    "fabricCare": {
      "fabric": "Tailored suiting blend.",
      "care": "Dry clean only."
    },
    "images": [
      "/products/aubergine-draped-vest-mini-set/1.png",
      "/products/aubergine-draped-vest-mini-set/2.png",
      "/products/aubergine-draped-vest-mini-set/3.png",
      "/products/aubergine-draped-vest-mini-set/4.png",
      "/products/aubergine-draped-vest-mini-set/5.png",
      "/products/aubergine-draped-vest-mini-set/6.png",
      "/products/aubergine-draped-vest-mini-set/7.png"
    ],
    "badge": null,
    "isNew": true,
    "separates": [
      {
        "slug": "the-aubergine-asymmetric-wrap-vest",
        "label": "Aubergine Asymmetric Wrap Vest"
      },
      {
        "slug": "the-aubergine-tailored-mini-skirt",
        "label": "Aubergine Tailored Mini Skirt"
      }
    ]
  },
  {
    "id": "w-07",
    "name": "Dusty Rose Embroidered Farchi Set",
    "slug": "the-dusty-rose-embroidered-farchi-set",
    "categoryType": "set",
    "gender": "female",
    "category": "coords",
    "categoryName": "Vests & Co-ords",
    "categoryLabel": "EXECUTIVE CO-ORDS",
    "shortType": "Embroidered Tunic & Flared Trousers",
    "setType": "Embroidered Farchi Tunic & Flared Trousers",
    "moment": "after-hours",
    "moments": [
      "after-hours"
    ],
    "momentName": "After-Hours Executive",
    "price": 7550,
    "color": "Muted Pink",
    "availableColors": [
      "Muted Pink",
      "Lilac",
      "Wine",
      "Navy Blue"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "includedPieces": [
      "Embroidered Farchi Tunic",
      "Coordinated Flared Trousers"
    ],
    "coordinates": [
      {
        "slug": "the-dusty-rose-trousers",
        "label": "Matching Dusty Rose Tailored Trousers"
      },
      {
        "slug": "the-lilac-sculpted-flare-blazer",
        "label": "Matching Sculpted Flare Blazer"
      }
    ],
    "gallery": [
      {
        "url": "/products/the-dusty-rose-embroidered-farchi-set/1.png",
        "type": "model_front"
      },
      {
        "url": "/products/the-dusty-rose-embroidered-farchi-set/2.png",
        "type": "model_side"
      },
      {
        "url": "/products/the-dusty-rose-embroidered-farchi-set/3.png",
        "type": "detail"
      },
      {
        "url": "/products/the-dusty-rose-embroidered-farchi-set/4.png",
        "type": "model_back"
      },
      {
        "url": "/products/the-dusty-rose-embroidered-farchi-set/5.png",
        "type": "garment_front"
      },
      {
        "url": "/products/the-dusty-rose-embroidered-farchi-set/6.png",
        "type": "garment_detail"
      },
      {
        "url": "/products/the-dusty-rose-embroidered-farchi-set/7.png",
        "type": "detail"
      }
    ],
    "pieces": "Includes Embroidered Farchi Tunic + Coordinated Flared Trousers.",
    "description": "An elegant two-piece ensemble featuring a tailored tunic with delicate tone-on-tone embroidery across the shoulders, paired with matching flared suiting trousers.",
    "story": "A refined Indian executive statement piece blending traditional elegance with contemporary tailored lines.",
    "stylingNotes": "Ideal for festive corporate galas, summit dinners, and industry award ceremonies.",
    "sizeFit": "Tailored fit through the bust and waist with a fluid flared trousers silhouette.",
    "fabricCare": {
      "fabric": "Embroidered fine suiting blend.",
      "care": "Specialized dry clean only."
    },
    "images": [
      "/products/the-dusty-rose-embroidered-farchi-set/1.png",
      "/products/the-dusty-rose-embroidered-farchi-set/2.png",
      "/products/the-dusty-rose-embroidered-farchi-set/3.png",
      "/products/the-dusty-rose-embroidered-farchi-set/4.png",
      "/products/the-dusty-rose-embroidered-farchi-set/5.png",
      "/products/the-dusty-rose-embroidered-farchi-set/6.png",
      "/products/the-dusty-rose-embroidered-farchi-set/7.png"
    ],
    "badge": null,
    "isNew": true,
    "separates": [
      {
        "slug": "the-dusty-rose-trousers",
        "label": "Dusty Rose Tailored Trousers"
      }
    ]
  },
  {
    "id": "w-20",
    "name": "Noir Layered Longline Vest",
    "slug": "the-noir-layered-longline-vest",
    "categoryType": "vest",
    "gender": "female",
    "category": "separates",
    "categoryName": "Tailored Separates",
    "categoryLabel": "TAILORED SEPARATES",
    "subCategory": "Vests",
    "shortType": "Layered Longline Vest",
    "setType": "Noir Layered Longline Vest",
    "moment": "after-hours",
    "moments": [
      "after-hours",
      "founder",
      "boardroom"
    ],
    "momentName": "After-Hours Executive",
    "price": 2450,
    "color": "Obsidian Black",
    "availableColors": [
      "Obsidian Black"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "coordinates": [
      {
        "slug": "noir-layered-vest-set",
        "label": "Full Set: Noir Layered Vest Set"
      },
      {
        "slug": "the-noir-tailored-trousers",
        "label": "Coordinating Noir Tailored Trousers"
      }
    ],
    "coordinateText": "Complete the full outfit with the Noir Layered Vest Set, or pair with coordinating Noir Tailored Trousers.",
    "gallery": [
      {
        "url": "/products/noir-layered-longline-vest/1.JPG",
        "type": "model_front"
      },
      {
        "url": "/products/noir-layered-longline-vest/2.png",
        "type": "garment_front"
      },
      {
        "url": "/products/noir-layered-longline-vest/3.png",
        "type": "detail"
      },
      {
        "url": "/products/noir-layered-longline-vest/4.png",
        "type": "garment_back"
      },
      {
        "url": "/products/noir-layered-longline-vest/5.JPG",
        "type": "model_editorial"
      }
    ],
    "pieces": "Includes Standalone Multi-Layered Longline Tailored Vest with Peak Lapels.",
    "description": "An architectural longline vest featuring innovative double-layered front panels, sharp peak lapels, flapped welt pockets, and a refined elongated silhouette in pitch black.",
    "story": "Designed to introduce dimensional layering to the modern professional wardrobe. The elongated proportions elongate the body line while dual vest panels create captivating depth.",
    "stylingNotes": "Style open over silk base layers or closed as a standalone longline power piece with sleek cigarette pants and gold cuffs for evening networking.",
    "sizeFit": "Elongated tailored fit with fluid ease through the hips. True to size. Model wears size S. Refer to Size Guide for measurements.",
    "fabricCare": {
      "fabric": "Premium mid-weight tailored suiting blend with full interior lining.",
      "care": "Dry clean only. Store on structured garment hanger."
    },
    "images": [
      "/products/noir-layered-longline-vest/1.JPG",
      "/products/noir-layered-longline-vest/2.png",
      "/products/noir-layered-longline-vest/3.png",
      "/products/noir-layered-longline-vest/4.png",
      "/products/noir-layered-longline-vest/5.JPG"
    ],
    "badge": "New Arrival",
    "isNew": true
  },
  {
    "id": "w-29",
    "name": "Noir Sculpted Vest Set",
    "slug": "noir-sculpted-vest-set",
    "categoryType": "set",
    "gender": "female",
    "category": "suits",
    "categoryName": "Power Suits & Sets",
    "categoryLabel": "POWER SUITS & SETS",
    "shortType": "Sculpted Vest & Tailored Trouser Set",
    "setType": "Noir Sculpted Vest Set",
    "moment": "essentials",
    "moments": [
      "essentials",
      "presentation",
      "founder"
    ],
    "momentName": "Executive Essentials",
    "price": 5945,
    "color": "Obsidian Black",
    "availableColors": [
      "Obsidian Black"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "includedPieces": [
      "Noir Sculpted Vest",
      "Noir Tailored Trousers"
    ],
    "coordinates": [
      {
        "slug": "the-noir-structured-vest",
        "label": "Noir Structured Vest (Separate)"
      },
      {
        "slug": "the-noir-tailored-trousers",
        "label": "Matching Tailored Trousers"
      }
    ],
    "gallery": [
      {
        "url": "/products/noir-sculpted-vest-set/1.png",
        "type": "model_front"
      },
      {
        "url": "/products/noir-sculpted-vest-set/2.png",
        "type": "model_three_quarter"
      },
      {
        "url": "/products/noir-sculpted-vest-set/3.png",
        "type": "model_side"
      },
      {
        "url": "/products/noir-sculpted-vest-set/4.png",
        "type": "detail"
      },
      {
        "url": "/products/noir-sculpted-vest-set/5.png",
        "type": "model_back"
      },
      {
        "url": "/products/noir-sculpted-vest-set/6.png",
        "type": "garment_front"
      },
      {
        "url": "/products/noir-sculpted-vest-set/7.png",
        "type": "detail"
      }
    ],
    "pieces": "Includes Sculpted Waistline Vest + Coordinated Tailored Wide-Leg Trousers.",
    "description": "An architectural two-piece ensemble combining a precision-sculpted tailored vest with coordinated high-waist trousers in deep obsidian black. Designed with sculpted waistlines and structural seam detailing for commanding boardroom authority.",
    "story": "Engineered for the modern executive wardrobe, seamlessly bridging boardroom demands with sleek minimalist tailoring.",
    "stylingNotes": "Wear as a complete monochrome ensemble with pointed heels, or style the sculpted vest separately with tailored separates for evening engagements.",
    "sizeFit": "Tailored structural fit through the torso with a relaxed, elegant drape through the leg. True to size. Model wears size S.",
    "fabricCare": {
      "fabric": "Premium structured suiting crepe blend with smooth tonal interior lining.",
      "care": "Dry clean only."
    },
    "images": [
      "/products/noir-sculpted-vest-set/1.png",
      "/products/noir-sculpted-vest-set/2.png",
      "/products/noir-sculpted-vest-set/3.png",
      "/products/noir-sculpted-vest-set/4.png",
      "/products/noir-sculpted-vest-set/5.png",
      "/products/noir-sculpted-vest-set/6.png",
      "/products/noir-sculpted-vest-set/7.png"
    ],
    "badge": "New Arrival",
    "isNew": true,
    "separates": [
      {
        "slug": "the-noir-structured-vest",
        "label": "Noir Structured Vest"
      },
      {
        "slug": "the-noir-tailored-trousers",
        "label": "Noir Tailored Trousers"
      }
    ]
  },
  {
    "id": "w-30",
    "name": "Noir Layered Vest Set",
    "slug": "noir-layered-vest-set",
    "categoryType": "set",
    "gender": "female",
    "category": "suits",
    "categoryName": "Power Suits & Sets",
    "categoryLabel": "POWER SUITS & SETS",
    "shortType": "Layered Tailored Vest & Trouser Set",
    "setType": "Noir Layered Vest Set",
    "moment": "essentials",
    "moments": [
      "essentials",
      "presentation"
    ],
    "momentName": "Executive Essentials",
    "price": 5400,
    "color": "Obsidian Black",
    "availableColors": [
      "Obsidian Black"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL"
    ],
    "includedPieces": [
      "Noir Layered Longline Vest",
      "Noir Tailored Trousers"
    ],
    "coordinates": [
      {
        "slug": "the-noir-layered-longline-vest",
        "label": "Noir Layered Longline Vest (Separate)"
      },
      {
        "slug": "the-noir-tailored-trousers",
        "label": "Matching Tailored Trousers"
      }
    ],
    "gallery": [
      {
        "url": "/products/noir-layered-vest-set/1.png",
        "type": "model_front"
      },
      {
        "url": "/products/noir-layered-vest-set/2.png",
        "type": "model_three_quarter"
      },
      {
        "url": "/products/noir-layered-vest-set/3.png",
        "type": "model_side"
      },
      {
        "url": "/products/noir-layered-vest-set/4.png",
        "type": "detail"
      },
      {
        "url": "/products/noir-layered-vest-set/5.png",
        "type": "model_back"
      },
      {
        "url": "/products/noir-layered-vest-set/6.png",
        "type": "garment_front"
      },
      {
        "url": "/products/noir-layered-vest-set/7.png",
        "type": "detail"
      }
    ],
    "pieces": "Includes Layered Longline Vest + Coordinated Tailored Wide-Leg Trousers.",
    "description": "A refined layered vest and trouser tailoring set crafted in obsidian black. Featuring structural layered vest styling over fluid wide-leg trousers for a balance of architectural precision and fluid movement.",
    "story": "Designed for versatile multi-schedule executive days, offering effortless polish between boardrooms and transit.",
    "stylingNotes": "Pair with minimalist jewelry and pointed loafers for an effortless commanding look.",
    "sizeFit": "Upper silhouette is structured with a clean, elongated trouser cut. True to size. Model wears size S.",
    "fabricCare": {
      "fabric": "Structured suiting twill blend with smooth tonal interior lining.",
      "care": "Dry clean only."
    },
    "images": [
      "/products/noir-layered-vest-set/1.png",
      "/products/noir-layered-vest-set/2.png",
      "/products/noir-layered-vest-set/3.png",
      "/products/noir-layered-vest-set/4.png",
      "/products/noir-layered-vest-set/5.png",
      "/products/noir-layered-vest-set/6.png",
      "/products/noir-layered-vest-set/7.png"
    ],
    "badge": "New Arrival",
    "isNew": true,
    "separates": [
      {
        "slug": "the-noir-layered-longline-vest",
        "label": "Noir Layered Longline Vest"
      },
      {
        "slug": "the-noir-tailored-trousers",
        "label": "Noir Tailored Trousers"
      }
    ]
  }
];

export const WHATSAPP_NUMBER = "919370350885";
export const DEFAULT_WHATSAPP_LINK = "https://wa.me/919370350885?text=" + encodeURIComponent("Hello SUKO Stylist, I would like to explore the Indian Corporate Wear collection and book a styling consultation.");
export const WHATSAPP_LINK = DEFAULT_WHATSAPP_LINK;

export const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const getProductBySlug = (slug) => {
  if (!slug) return undefined;
  return PRODUCTS.find((p) => p.slug === slug || p.slug === slug.replace(/^the-/, "") || `the-${p.slug}` === slug);
};
export const getProductsByCategory = (cat) => PRODUCTS.filter((p) => p.category === cat);
export const getProductsByGender = (gender) => PRODUCTS.filter((p) => p.gender === gender);
