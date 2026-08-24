import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "../ProductCard";

export const WomenNewInGrid = ({ products }) => {
  if (!products || products.length === 0) return null;

  return (
    <section className="bg-[#F6F2EA] pt-6 sm:pt-8 lg:pt-9 pb-10 sm:pb-14 lg:pb-16 px-4 sm:px-6 lg:px-[3.5vw] border-b border-[#E8E4DC] transition-colors duration-300">
      <div className="max-w-[1680px] mx-auto">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-10 text-center sm:text-left">
          <div>
            <span className="text-[10.5px] sm:text-[11px] lg:text-[11.5px] uppercase tracking-[0.26em] text-[#6A6A74] font-medium block mb-2 sm:mb-2.5">
              NEW TO THE EDIT
            </span>
            <h2 className="font-quiche text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#111113]">
              New In Women
            </h2>
          </div>
          <Link
            to="/new-in?gender=women"
            className="group inline-flex items-center gap-2 text-[10.5px] sm:text-[11px] uppercase tracking-[0.22em] text-[#111113] hover:text-[#C2922E] transition-colors self-center sm:self-end"
          >
            <span className="border-b border-[#111113] group-hover:border-[#C2922E] pb-0.5 transition-all">
              VIEW ALL NEW IN
            </span>
            <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Asymmetric Editorial Grid (1 Large Left + 4 Small in 2x2 Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-7 items-stretch">
          {/* Left (50% / 2 cols): Large Featured Editorial Product */}
          <div className="lg:col-span-6 h-full flex flex-col">
            {products[0] && (
              <ProductCard
                product={products[0]}
                index={0}
                isFeatured={true}
                className="h-full"
              />
            )}
          </div>

          {/* Right (50% / 2 cols): 4 Standard Cards in 2x2 Grid */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-x-3.5 sm:gap-x-5 lg:gap-x-6 gap-y-6 sm:gap-y-8">
            {products.slice(1, 5).map((product, idx) => (
              <ProductCard
                key={product.id || product.slug || idx}
                product={product}
                index={idx + 1}
                isFeatured={false}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export const WomenBoardroomBanner = () => {
  return (
    <section className="relative w-full h-[60vh] sm:h-[65vh] min-h-[440px] max-h-[640px] bg-[#0A0A0C] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src="/boardroom_women.jpg"
          alt="The Boardroom Edit - Luxury Tailoring"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover object-top transition-transform duration-1000 ease-out hover:scale-105"
        />
        {/* Calibrated Left Dark Gradient */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, rgba(10,10,12,0.92) 0%, rgba(10,10,12,0.78) 32%, rgba(10,10,12,0.28) 52%, rgba(10,10,12,0.04) 66%, rgba(10,10,12,0) 80%)"
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(0deg, rgba(10,10,12,0.50) 0%, rgba(10,10,12,0.10) 25%, rgba(10,10,12,0) 45%)"
          }}
        />
      </div>

      <div className="relative z-10 w-full h-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-14 xl:px-16 flex flex-col justify-center text-white">
        <div className="max-w-xl">
          <div className="flex items-center gap-2.5 mb-2 sm:mb-3">
            <span className="w-4 h-[1px] bg-[#C99A2E]" />
            <span className="text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.28em] text-[#C99A2E] font-semibold font-body">
              THE BOARDROOM EDIT
            </span>
          </div>
          <h2 className="font-quiche text-3xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight mb-2 sm:mb-3 leading-[1.05]">
            Tailored <span className="italic font-normal text-white/95">confidence.</span>
          </h2>
          <p className="text-[11px] sm:text-[12.5px] uppercase tracking-[0.24em] text-white/95 font-medium mb-6 sm:mb-8 font-body">
            UNCOMPROMISING STRUCTURE &middot; EFFORTLESS AUTHORITY
          </p>
          <Link
            to="/collection?category=suits&gender=women"
            className="group inline-flex items-center gap-2.5 text-[11px] sm:text-[12px] uppercase tracking-[0.22em] font-medium text-white hover:text-[#C99A2E] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C99A2E]"
          >
            <span className="border-b border-[#C99A2E] pb-0.5 transition-colors">
              DISCOVER THE EDIT
            </span>
            <ArrowRight size={13} className="text-[#C99A2E] transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export const WomenAtelierBanner = () => {
  return (
    <section className="bg-[#FAF8F5] py-10 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-[3.5vw] border-b border-[#E8E4DC] transition-colors duration-300">
      <div className="max-w-[1680px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 xl:gap-20 items-center">
          
          {/* LEFT (~55%): Clean Macro Craftsmanship Video */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] lg:aspect-[16/11.5] overflow-hidden bg-[#18181D] shadow-sm">
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="w-full h-full object-cover object-center"
              >
                <source src="/atlier_women.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-black/[0.06] pointer-events-none" />
            </div>
          </div>

          {/* RIGHT (~45%): Editorial Content */}
          <div className="lg:col-span-5 flex flex-col justify-center text-left lg:pl-2 xl:pl-4">
            {/* Gold Eyebrow */}
            <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
              <span className="w-5 h-[1px] bg-[#C2922E]" />
              <span className="text-[10px] sm:text-[11px] lg:text-[11.5px] uppercase tracking-[0.32em] text-[#C2922E] font-semibold font-body">
                THE WOMEN&apos;S ATELIER
              </span>
            </div>

            {/* Large Editorial Serif Headline */}
            <h2 className="font-quiche text-3xl sm:text-5xl lg:text-[3.4rem] xl:text-[3.8rem] font-light tracking-tight text-[#111113] leading-[1.04] mb-4 sm:mb-6">
              Cut with <span className="italic font-normal">intention.</span>
            </h2>

            {/* Single Supporting Statement */}
            <p className="text-[#484852] font-body text-sm sm:text-base lg:text-[16.5px] font-normal leading-[1.75] mb-7 sm:mb-9 max-w-[440px]">
              Considered lines. Precise proportions. Tailoring designed to hold its presence.
            </p>

            {/* Minimal Underlined Luxury CTA */}
            <div>
              <Link
                to="/about"
                className="group inline-flex items-center gap-2.5 text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.24em] font-normal text-[#111113] hover:text-[#C2922E] transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C2922E]"
              >
                <span className="border-b border-[#111113] group-hover:border-[#C2922E] pb-1 transition-all duration-300">
                  DISCOVER THE ATELIER
                </span>
                <ArrowRight size={13} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export const WomenSignatureEdit = () => {
  const corePieces = [
    {
      title: "Noir Tailored Suit",
      tag: "Signature 2-Piece Set",
      price: "₹78,000",
      desc: "Single-breasted structured blazer and wide-leg trousers for modern authority.",
      image: "/products/the-noir-tailored-suit/1.JPG",
      link: "/product/the-noir-tailored-suit"
    },
    {
      title: "Dusty Rose Flare Suit",
      tag: "Sculptural Flared Set",
      price: "₹76,000",
      desc: "Longline single-breasted blazer paired with high-rise flared trousers.",
      image: "/products/dusty-rose-sculpted-flare-suit/1.JPG",
      link: "/product/the-dusty-rose-flare-suit"
    },
    {
      title: "Aubergine Draped Set",
      tag: "Executive Co-ord Set",
      price: "₹68,000",
      desc: "Asymmetric draped vest paired with coordinated tailored mini skirt.",
      image: "/products/aubergine-draped-vest-mini-set/1.JPG",
      link: "/product/the-aubergine-draped-set"
    },
    {
      title: "Midnight Peplum Set",
      tag: "Architectural Suiting",
      price: "₹72,000",
      desc: "Fitted peplum jacket with gold-tone buttons and matching fishtail skirt.",
      image: "/products/midnight-peplum-fishtail-set/1.JPG",
      link: "/product/the-midnight-peplum-set"
    }
  ];

  return (
    <section className="bg-[#F6F2EA] pt-6 sm:pt-8 lg:pt-9 pb-10 sm:pb-14 lg:pb-16 px-4 sm:px-6 lg:px-[3.5vw] border-b border-[#E8E4DC] transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto">

        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="text-[10.5px] sm:text-[11px] lg:text-[11.5px] uppercase tracking-[0.26em] text-[#C2922E] font-medium block mb-2 sm:mb-2.5">
            THE SIGNATURE EDIT
          </span>
          <h2 className="font-quiche text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#111113] mb-2">
            Shop the Silhouettes
          </h2>
          <p className="text-[13px] sm:text-[14.5px] text-[#484852] font-normal leading-relaxed">
            Complete tailoring, composed for modern authority.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {corePieces.map((piece, idx) => (
            <Link
              key={idx}
              to={piece.link}
              className="group block bg-[#FAF8F5] border border-[#EAE6DF]/60 overflow-hidden transition-all duration-300 hover:border-[#C2922E] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C2922E]"
            >
              <div className="aspect-[3/4] overflow-hidden bg-[#EAE6DF]">
                <img
                  src={piece.image}
                  alt={piece.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-4 sm:p-5">
                <span className="text-[9px] uppercase tracking-[0.24em] text-[#C2922E] font-medium block mb-1">
                  {piece.tag}
                </span>
                <h3 className="font-quiche text-base sm:text-lg font-light text-[#121215] mb-1 truncate">
                  {piece.title}
                </h3>
                <p className="text-xs text-[#555560] font-light leading-relaxed mb-3.5">
                  {piece.desc}
                </p>
                <div className="text-xs font-medium text-[#111113] flex items-center justify-between pt-2.5 border-t border-[#E8E4DC]/60">
                  <span>{piece.price}</span>
                  <ArrowRight size={13} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-1.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};
