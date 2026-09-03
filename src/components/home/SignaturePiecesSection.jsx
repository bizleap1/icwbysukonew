import React from "react";
import { Link } from "react-router-dom";
import { PRODUCTS, formatINR } from "../../data/products";
import { getCardImage } from "../../utils/mediaUtils";

const heroProduct = PRODUCTS.find((p) => p.slug === "the-noir-tailored-suit");
const SIGNATURE_HERO = {
  id: heroProduct?.id || "w-08",
  slug: heroProduct?.slug || "the-noir-tailored-suit",
  name: heroProduct?.name || "Noir Tailored Set",
  category: "Single-Breasted Blazer & Wide-Leg Trousers",
  price: heroProduct?.price ? formatINR(heroProduct.price) : "₹4,550",
  image: "/boardroom_women.webp",
  position: "object-[50%_15%]"
};

const supportingSlugs = [
  {
    slug: "the-plum-sculpted-double-breasted-blazer",
    number: "02",
    position: "object-[50%_25%]"
  },
  {
    slug: "the-lilac-sculpted-flare-blazer",
    number: "03",
    position: "object-[50%_25%]"
  },
  {
    slug: "the-noir-structured-vest",
    number: "04",
    position: "object-[50%_25%]"
  }
];

const SUPPORTING_PIECES = supportingSlugs.map((cfg) => {
  const p = PRODUCTS.find((prod) => prod.slug === cfg.slug);
  const ghostImg = p?.images?.find((img) => img.includes("2.png")) || p?.images?.[1] || p?.images?.[0];
  return {
    id: p?.id || cfg.slug,
    slug: p?.slug || cfg.slug,
    number: cfg.number,
    name: p?.name || "Signature Piece",
    category: p?.shortType || p?.setType || p?.subCategory || "Tailored Separate",
    price: p?.price ? formatINR(p.price) : "",
    image: ghostImg || `/products/${cfg.slug.replace("the-", "")}/2.png`,
    position: cfg.position
  };
});

export const SignaturePiecesSection = () => {
  return (
    <section className="bg-[#FAF8F5] pt-4 sm:pt-5 lg:pt-6 pb-6 sm:pb-8 lg:pb-10 transition-colors duration-300">
      <div className="w-full mx-auto px-5 sm:px-8 lg:px-12 xl:px-14">
        
        {/* 1. Minimal Luxury Section Header (Baseline-Aligned CTA) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-6 lg:mb-7">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-1.5 sm:mb-3">
              <span className="w-3.5 h-[1px] bg-[#C2922E]" />
              <span className="text-[9.5px] sm:text-[11px] uppercase tracking-[0.32em] text-[#C2922E] font-medium font-body">
                SIGNATURE PIECES
              </span>
            </div>

            <h2 className="font-quiche text-2xl sm:text-4xl lg:text-6xl font-light tracking-tight text-[#121215] leading-tight">
              The Pieces That <span className="italic font-normal">Define SUKO.</span>
            </h2>
          </div>

          {/* Right CTA — Baseline Aligned */}
          <div className="pt-2 md:pt-0 md:pb-1 flex-shrink-0">
            <Link
              to="/collection"
              className="group relative inline-block pt-1 pb-1 select-none"
            >
              <span className="text-[11px] sm:text-[11.5px] uppercase tracking-[0.20em] sm:tracking-[0.22em] font-medium text-[#121215] block">
                VIEW ALL SIGNATURES
              </span>
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30" />
              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#121215] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
            </Link>
          </div>
        </div>

        {/* 2. MOBILE VIEW: 1 Dominant Hero Card (480-540px) + 3-Product Horizontal Swipe (78-82vw, 340px tall) */}
        <div className="lg:hidden flex flex-col gap-4">
          
          {/* Main Hero Look Card (Noir Power Suit) */}
          <Link
            to={`/product/${SIGNATURE_HERO.slug}`}
            className="group relative h-[490px] sm:h-[540px] overflow-hidden bg-[#121215] rounded-[2px] flex flex-col justify-end p-6 text-white block select-none shadow-md"
          >
            <img
              src={SIGNATURE_HERO.image}
              alt={SIGNATURE_HERO.name}
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 w-full h-full object-cover ${SIGNATURE_HERO.position} transition-transform duration-700 ease-out group-hover:scale-103`}
            />
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(0deg, rgba(10,10,12,0.85) 0%, rgba(10,10,12,0.25) 35%, transparent 60%)"
              }}
            />
            <div className="relative z-10 font-body">
              <h3 className="font-quiche text-[26px] sm:text-[28px] font-light text-white leading-tight mb-1">
                {SIGNATURE_HERO.name}
              </h3>
              <p className="text-[12px] sm:text-[13px] text-white/75 font-light tracking-wide mb-3">
                {SIGNATURE_HERO.category} &middot; {SIGNATURE_HERO.price}
              </p>
              <div>
                <span className="relative inline-block pt-0 pb-0.5 select-none">
                  <span className="text-[11px] uppercase tracking-[0.20em] font-medium text-white drop-shadow-md block">
                    DISCOVER THE LOOK
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/40" />
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                </span>
              </div>
            </div>
          </Link>

          {/* 3 Supporting Products Horizontal Swipe (78-82vw, 340px tall, next card peek) */}
          <div className="flex gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-2 pt-1 -mx-5 px-5 sm:-mx-8 sm:px-8 hide-scrollbar select-none">
            {SUPPORTING_PIECES.map((piece) => (
              <Link
                key={piece.id}
                to={`/product/${piece.slug}`}
                className="group snap-center flex-shrink-0 w-[80vw] sm:w-[70vw] max-w-[340px] h-[340px] sm:h-[360px] relative overflow-hidden bg-[#121215] rounded-[2px] flex flex-col justify-end p-5 text-white block select-none shadow-sm"
              >
                <img
                  src={getCardImage(piece.image)}
                  alt={piece.name}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    if (e.currentTarget.src !== piece.image) {
                      e.currentTarget.src = piece.image;
                    }
                  }}
                  className={`absolute inset-0 w-full h-full object-cover ${piece.position} transition-transform duration-700 ease-out group-hover:scale-103`}
                />
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(0deg, rgba(10,10,12,0.80) 0%, rgba(10,10,12,0.20) 30%, transparent 55%)"
                  }}
                />
                <div className="relative z-10 font-body">
                  <h4 className="font-quiche text-xl font-light text-white leading-snug mb-0.5">
                    {piece.name}
                  </h4>
                  <p className="text-[11px] text-white/70 font-light tracking-wide mb-2.5">
                    {piece.category} &middot; {piece.price}
                  </p>
                  <div>
                    <span className="relative inline-block pt-0 pb-0.5 select-none">
                      <span className="text-[10px] uppercase tracking-[0.20em] font-medium text-white drop-shadow-md block">
                        DISCOVER
                      </span>
                      <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/40" />
                      <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>

        {/* 3. DESKTOP VIEW: Asymmetric Editorial Spread (58% Hero Left / 42% 3-Stack Right) */}
        <div className="hidden lg:grid grid-cols-12 gap-5 xl:gap-6 items-stretch">
          
          {/* Left Column: Dominant Hero Product (~58% width) */}
          <Link
            to={`/product/${SIGNATURE_HERO.slug}`}
            className="lg:col-span-7 group relative overflow-hidden bg-[#121215] h-[640px] xl:h-[680px] rounded-[2px] flex flex-col justify-end p-8 xl:p-10 text-white block select-none cursor-pointer shadow-md"
          >
            <img
              src={SIGNATURE_HERO.image}
              alt={SIGNATURE_HERO.name}
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 w-full h-full object-cover ${SIGNATURE_HERO.position} transition-transform duration-1000 ease-out group-hover:scale-103`}
            />
            <div 
              className="absolute inset-0 pointer-events-none transition-opacity duration-500"
              style={{
                background: "linear-gradient(0deg, rgba(10,10,12,0.85) 0%, rgba(10,10,12,0.25) 35%, transparent 60%)"
              }}
            />
            
            <div className="relative z-10 font-body">
              <h3 className="font-quiche text-3xl lg:text-[36px] font-light text-white leading-tight tracking-tight mb-1 drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
                {SIGNATURE_HERO.name}
              </h3>
              <p className="text-[11.5px] sm:text-[12px] text-white/70 font-light tracking-wide mb-3">
                {SIGNATURE_HERO.category} &middot; {SIGNATURE_HERO.price}
              </p>
              
              <div>
                <span className="relative inline-block pt-0.5 pb-1 select-none">
                  <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.20em] sm:tracking-[0.22em] font-medium text-white drop-shadow-md block">
                    DISCOVER THE LOOK
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/40" />
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                </span>
              </div>
            </div>
          </Link>

          {/* Right Column: 3 Curated Editorial Cards with Consistent Garment-Focused Crops (~42% width) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4 xl:gap-4.5">
            {SUPPORTING_PIECES.map((piece) => (
              <Link
                key={piece.id}
                to={`/product/${piece.slug}`}
                className="group relative overflow-hidden bg-[#121215] h-[200px] xl:h-[214px] rounded-[2px] flex items-end p-5 xl:p-6 text-white block select-none cursor-pointer shadow-sm"
              >
                <img
                  src={getCardImage(piece.image)}
                  alt={piece.name}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    if (e.currentTarget.src !== piece.image) {
                      e.currentTarget.src = piece.image;
                    }
                  }}
                  className={`absolute inset-0 w-full h-full object-cover ${piece.position} transition-transform duration-1000 ease-out group-hover:scale-103`}
                />
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(0deg, rgba(10,10,12,0.85) 0%, rgba(10,10,12,0.25) 40%, transparent 65%)"
                  }}
                />
                
                <div className="relative z-10 w-full flex items-end justify-between gap-4 font-body">
                  <div>
                    <h4 className="font-quiche text-xl font-light text-white leading-snug tracking-tight mb-0.5 group-hover:text-white/95 transition-colors drop-shadow-md">
                      {piece.name}
                    </h4>
                    <p className="text-[10px] sm:text-[10.5px] text-white/65 font-light tracking-wide">
                      {piece.category} &middot; {piece.price}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <span className="relative inline-block pt-0.5 pb-1 select-none">
                      <span className="text-[9.5px] sm:text-[10px] uppercase tracking-[0.20em] sm:tracking-[0.22em] font-medium text-white drop-shadow-md block">
                        DISCOVER
                      </span>
                      <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/40" />
                      <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default SignaturePiecesSection;
