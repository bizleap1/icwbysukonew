import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import SEO from "../components/SEO";
import { MOMENTS, PRODUCTS, formatINR, WHATSAPP_LINK } from "../data/products";
import ServiceStrip from "../components/home/ServiceStrip";

export const ShopByMoment = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const momentParam = searchParams.get("moment") || "boardroom";

  const [activeMomentId, setActiveMomentId] = useState(momentParam);
  const tabsStripRef = useRef(null);

  useEffect(() => {
    if (momentParam) {
      setActiveMomentId(momentParam);
    }
  }, [momentParam]);

  // Auto-scroll active tab into center/visible position when selected
  useEffect(() => {
    if (activeMomentId && tabsStripRef.current) {
      setTimeout(() => {
        const activeTabEl = document.getElementById(`moment-tab-${activeMomentId}`);
        const container = tabsStripRef.current;
        if (activeTabEl && container) {
          const left = activeTabEl.offsetLeft - container.offsetWidth / 2 + activeTabEl.offsetWidth / 2;
          container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
        }
      }, 40);
    }
  }, [activeMomentId]);

  const activeMoment = MOMENTS.find((m) => m.id === activeMomentId) || MOMENTS[0];

  // Filter products for active moment
  const momentProducts = PRODUCTS.filter(
    (p) => p.moment === activeMoment.id || (p.moments && p.moments.includes(activeMoment.id))
  );

  const handleSelectMoment = (momentId) => {
    setActiveMomentId(momentId);
    setSearchParams({ moment: momentId }, { replace: true });
  };

  return (
    <div
      data-testid="shop-by-moment-page"
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white min-h-screen pt-[88px] sm:pt-[96px] lg:pt-[104px] pb-20 transition-colors duration-300"
    >
      <SEO
        title={`${activeMoment.title} — Shop By Moment | SUKO`}
        description={activeMoment.description}
      />

      <div className="w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-14">
        
        {/* 1. EDITORIAL PAGE HEADER INTRO (Top Compact Intro) */}
        <div className="text-center max-w-4xl mx-auto mb-3.5 sm:mb-5">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <span className="w-3.5 h-[1px] bg-[#C2922E]" />
            <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.28em] text-[#C2922E] font-medium">
              SHOP BY MOMENT
            </span>
            <span className="w-3.5 h-[1px] bg-[#C2922E]" />
          </div>

          <h1 className="font-quiche text-3xl sm:text-4xl lg:text-[44px] font-light tracking-tight text-[#111113] mb-1.5 sm:mb-2 leading-tight">
            Dress for the <span className="italic font-normal">Moment.</span>
          </h1>

          <p className="text-xs sm:text-[13px] text-[#555562] font-light leading-relaxed max-w-xl mx-auto">
            Curated edits for the moments that shape your professional life.
          </p>
        </div>

        {/* 2. HORIZONTAL SWIPEABLE TAB STRIP (Sticky under Navbar, Plain Text + Gold Underline closely under words) */}
        <div className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-y border-[#E8E4DC] mb-2 sm:mb-3 transition-all -mx-4 px-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
          <div
            ref={tabsStripRef}
            className="h-[46px] sm:h-[50px] flex items-center justify-start md:justify-center gap-6 sm:gap-7 lg:gap-8 overflow-x-auto hide-scrollbar whitespace-nowrap px-4 sm:px-5 lg:px-6"
          >
            {MOMENTS.map((m) => {
              const isSelected = activeMoment.id === m.id;
              return (
                <button
                  key={m.id}
                  id={`moment-tab-${m.id}`}
                  type="button"
                  onClick={() => handleSelectMoment(m.id)}
                  className={`group relative shrink-0 py-1 px-0.5 text-[11px] sm:text-[11.5px] uppercase tracking-[0.16em] sm:tracking-[0.18em] transition-all focus-visible:outline-none cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "text-[#111113] font-medium"
                      : "text-[#707078] font-normal hover:text-[#111113]"
                  }`}
                >
                  <span>{m.title}</span>
                  {isSelected ? (
                    <span className="absolute bottom-0 left-1 right-1 h-[1px] bg-[#C2922E]" />
                  ) : (
                    <span className="absolute bottom-0 left-1 right-1 h-[1px] bg-transparent group-hover:bg-[#121215]/20 transition-colors" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. ACTIVE MOMENT CINEMATIC EDITORIAL HERO (Mobile: 630-660px, Desktop: 550-580px) */}
        <div className="relative w-full max-w-[1680px] mx-auto overflow-hidden bg-[#121215] text-white mb-10 sm:mb-14 shadow-xl h-[630px] sm:h-[660px] lg:h-[550px] xl:h-[580px] 2xl:h-[600px] flex items-end lg:items-center">
          {/* Full-width Cinematic Image (Mobile: Upper-Right Model Framing, Desktop: Panoramic Layout) */}
          <img
            key={activeMoment.id}
            src={activeMoment.image}
            alt={activeMoment.title}
            className={`absolute inset-0 w-full h-full object-cover ${activeMoment.mobileImagePosition || "object-[82%_8%]"} lg:${activeMoment.imagePosition || "object-center"} transition-opacity duration-700`}
          />

          {/* Mobile Vertical Gradient (Top 52-58% bright model, Bottom 42-48% rich dark text safe-zone) */}
          <div 
            className="absolute inset-0 lg:hidden pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(18,18,21,0.12) 0%, rgba(18,18,21,0.04) 36%, rgba(18,18,21,0.50) 50%, rgba(18,18,21,0.92) 68%, #121215 88%, #121215 100%)"
            }}
          />

          {/* Narrative Text Overlay (Mobile: 20px padding, 36-40px bottom; Desktop: left-aligned 500px safe-zone) */}
          <div className="relative z-10 w-full max-w-[92%] sm:max-w-md lg:max-w-[480px] xl:max-w-[500px] px-5 sm:px-8 lg:pl-[56px] xl:pl-[70px] lg:pr-6 text-left pb-9 sm:pb-10 pt-4 lg:py-0">
            <p className="font-quiche italic text-[#D4AF37]/95 text-[15px] sm:text-[16px] lg:text-[14.5px] xl:text-[15.5px] mb-1.5 font-normal tracking-[0.06em]">
              {activeMoment.tagline}.
            </p>
            <h2 className="font-quiche text-[34px] sm:text-[38px] lg:text-[38px] font-light tracking-tight text-white mb-2 sm:mb-3 leading-[1.12]">
              {activeMoment.title}
            </h2>
            <p className="text-white/85 font-body text-[14px] sm:text-[15px] lg:text-[13px] font-light leading-relaxed mb-5 sm:mb-6">
              {activeMoment.description}
            </p>

            {/* Primary CTA Only */}
            <div>
              <a
                href="#moment-products-grid"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("moment-products-grid")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group relative inline-block pt-1 pb-1.5 select-none focus-visible:outline-none cursor-pointer"
              >
                <span className="text-[12px] uppercase tracking-[0.24em] font-medium text-white block">
                  EXPLORE THE EDIT
                </span>
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/40" />
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#C2922E] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
              </a>
            </div>
          </div>
        </div>

        {/* 4. ANCHOR FOR GRID SCROLL & CURATED PRODUCTS */}
        <div id="moment-products-grid" className="scroll-mt-24 mb-12 sm:mb-16">
          {/* Top Row: Heading + Count (Stacked on Mobile) */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-6 sm:mb-8 pb-3 border-b border-[#E8E4DC]">
            <h3 className="font-quiche text-[28px] sm:text-[32px] lg:text-[34px] font-light text-[#121215] leading-tight">
              {activeMoment.id === "boardroom"
                ? "The Boardroom Selection"
                : activeMoment.id === "founder"
                ? "The Founder Selection"
                : activeMoment.id === "presentation"
                ? "The Presentation Selection"
                : activeMoment.id === "after-hours"
                ? "The After-Hours Selection"
                : "The Executive Selection"}
            </h3>
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[#75757E] font-medium font-body mt-1 sm:mt-0">
              {momentProducts.length} {momentProducts.length === 1 ? "TAILORED PIECE" : "TAILORED PIECES"}
            </span>
          </div>

          {/* Product Grid: 1 Column Stacked on Mobile, Balanced Columns on Desktop */}
          <div className={`grid grid-cols-1 ${momentProducts.length === 2 ? "sm:grid-cols-2 max-w-[940px]" : "sm:grid-cols-2 lg:grid-cols-3"} gap-7 sm:gap-9 lg:gap-11`}>
            {momentProducts.map((product) => (
              <div
                key={product.id}
                className="group flex flex-col justify-between"
              >
                {/* 1. Large Editorial Image (4:5 Ratio, 0px border-radius) */}
                <Link to={`/product/${product.slug}`} className="block relative aspect-[4/5] overflow-hidden bg-[#F2EFEB] rounded-none">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover object-[50%_15%] transition-transform duration-700 ease-out group-hover:scale-104"
                  />
                </Link>

                {/* 2. Whitespace & Clean Product Details (Name -> Category -> Short Type -> Price) */}
                <div className="pt-4 pb-1 flex-1 flex flex-col justify-between">
                  <div>
                    {/* 1. Product Name */}
                    <Link to={`/product/${product.slug}`}>
                      <h4 className="font-quiche text-xl sm:text-2xl font-light text-[#121215] group-hover:text-[#C2922E] transition-colors leading-snug">
                        {product.name}
                      </h4>
                    </Link>

                    {/* 2. Category Label */}
                    <span className="text-[9.5px] sm:text-[10px] uppercase tracking-[0.24em] text-[#8C887B] font-medium block mt-1 font-body">
                      {product.categoryLabel || (product.categoryName ? product.categoryName.toUpperCase() : "POWER SUITS & SETS")}
                    </span>

                    {/* 3. Short Silhouette / Type */}
                    <p className="text-[12px] sm:text-[12.5px] text-[#75757E] font-light italic mt-0.5 mb-2 font-body">
                      {product.shortType || product.setType || "Tailored Silhouette"}
                    </p>

                    {/* 4. Price */}
                    <div className="text-[14px] sm:text-[15px] font-medium text-[#121215] font-body mb-3.5">
                      {formatINR(product.price)}
                    </div>
                  </div>

                  <div className="pt-1">
                    <Link
                      to={`/product/${product.slug}`}
                      className="group/cta relative inline-block pt-1 pb-1 select-none focus-visible:outline-none cursor-pointer"
                    >
                      <span className="text-[11px] uppercase tracking-[0.22em] font-medium text-[#121215] group-hover/cta:text-[#C2922E] transition-colors block">
                        VIEW LOOK
                      </span>
                      <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/20" />
                      <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#C2922E] transform origin-left scale-x-0 group-hover/cta:scale-x-100 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <ServiceStrip />
    </div>
  );
};

export default ShopByMoment;
