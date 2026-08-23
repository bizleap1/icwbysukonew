import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, Plus, Minus, Scissors, Sparkles, ShieldCheck } from "lucide-react";
import { useLenis } from "lenis/react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductContext";

const WOMEN_HERO_PRODUCTS = [
  {
    id: "fw-suit-5",
    name: "Noir Layered Suit",
    categoryName: "Power Suits & Sets",
    price: 82000,
    images: ["/products/the-noir-layered-suit/1.JPG", "/products/the-noir-layered-suit/2.png"],
    slug: "the-noir-layered-suit",
    gender: "female"
  },
  {
    id: "fw-suit-4",
    name: "Noir Tailored Suit",
    categoryName: "Power Suits & Sets",
    price: 78000,
    images: ["/products/the-noir-tailored-suit/1.JPG", "/products/the-noir-tailored-suit/2.png"],
    slug: "the-noir-tailored-suit",
    gender: "female"
  },
  {
    id: "fw-set-1",
    name: "Dusty Rose Embroidered Set",
    categoryName: "Signature Co-ord Sets",
    price: 72000,
    images: ["/products/the-dusty-rose-embroidered-set/1.JPG", "/products/the-dusty-rose-embroidered-set/2.png"],
    slug: "the-dusty-rose-embroidered-set",
    gender: "female"
  },
  {
    id: "fw-suit-3",
    name: "Plum Sculpted Suit",
    categoryName: "Power Suits & Sets",
    price: 78000,
    images: ["/products/the-plum-sculpted-suit/1.JPG", "/products/the-plum-sculpted-suit/2.png"],
    slug: "the-plum-sculpted-suit",
    gender: "female"
  },
  {
    id: "fw-suit-2",
    name: "Dusty Rose Flare Suit",
    categoryName: "Power Suits & Sets",
    price: 76000,
    images: ["/products/dusty-rose-sculpted-flare-suit/1.JPG", "/products/dusty-rose-sculpted-flare-suit/2.png"],
    slug: "the-dusty-rose-flare-suit",
    gender: "female"
  },
  {
    id: "fw-suit-1",
    name: "Aubergine Tailored Suit",
    categoryName: "Power Suits & Sets",
    price: 78000,
    images: ["/products/aubergine-tailored-power-suit/1.JPG", "/products/aubergine-tailored-power-suit/2.png"],
    slug: "the-aubergine-tailored-suit",
    gender: "female"
  },
  {
    id: "fw-vest-2",
    name: "Aubergine Draped Set",
    categoryName: "Executive Co-ord Sets",
    price: 68000,
    images: ["/products/aubergine-draped-vest-mini-set/1.JPG", "/products/aubergine-draped-vest-mini-set/2.png"],
    slug: "the-aubergine-draped-set",
    gender: "female"
  },
  {
    id: "fw-vest-1",
    name: "Midnight Sculpted Vest Set",
    categoryName: "Executive Co-ord Sets",
    price: 68000,
    images: ["/products/midnight-sculpted-vest-set/1.JPG", "/products/midnight-sculpted-vest-set/2.png"],
    slug: "the-midnight-sculpted-vest-set",
    gender: "female"
  },
  {
    id: "fw-peplum-1",
    name: "Midnight Peplum Set",
    categoryName: "Executive Co-ord Sets",
    price: 72000,
    images: ["/products/midnight-peplum-fishtail-set/1.JPG", "/products/midnight-peplum-fishtail-set/2.png"],
    slug: "the-midnight-peplum-set",
    gender: "female"
  }
];

const CORE_PIECES = [
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

const Women = () => {
  const lenis = useLenis();
  const { products } = useProducts();
  const [openTailoringPillar, setOpenTailoringPillar] = useState(0);

  // Smooth scroll down to Shop By Category
  const scrollToCategories = (e) => {
    e.preventDefault();
    const elem = document.getElementById("women-categories");
    if (elem) {
      if (lenis) {
        lenis.scrollTo(elem, { offset: -60, duration: 1.2 });
      } else {
        elem.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Women catalog products (5 items for asymmetric editorial block: 1 large + 4 small)
  const newInProducts = useMemo(() => {
    const apiWomen = products?.filter((p) => p.gender === "female" || p.gender === "women") || [];
    if (apiWomen.length >= 5) {
      return apiWomen.slice(0, 5);
    }
    return WOMEN_HERO_PRODUCTS.slice(0, 5);
  }, [products]);

  return (
    <div data-testid="women-page" className="grain bg-[#FAF8F5] dark:bg-transparent text-[#121215] dark:text-[#F6F6F0] font-body selection:bg-[#C2922E] selection:text-white transition-colors duration-300">

      {/* =========================================================================
          SECTION 1: WOMEN HERO (Lower-Third Anchored Editorial Visual)
          ========================================================================= */}
      <section
        data-testid="women-hero-section"
        className="relative h-[78vh] sm:h-[85vh] lg:h-screen w-full bg-[#0A0A0C] overflow-hidden"
      >
        {/* Female-Led Campaign Image Background */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#0A0A0C]">
          <img
            src="/women_bg.png"
            alt="ICW Women Campaign"
            className="w-full h-full object-cover object-[75%_top] sm:object-[70%_top] opacity-100"
            decoding="async"
          />
          {/* Ultra-smooth Luxury Gradient: Deep Charcoal -> Warm Fade -> Soft Shade -> Seamless Transparent */}
          <div 
            className="absolute inset-0 z-[2] pointer-events-none"
            style={{
              background: "linear-gradient(90deg, rgba(10,10,12,0.90) 0%, rgba(10,10,12,0.78) 18%, rgba(10,10,12,0.50) 32%, rgba(10,10,12,0.22) 44%, rgba(10,10,12,0.06) 54%, rgba(10,10,12,0.01) 60%, rgba(10,10,12,0) 66%)"
            }}
          />
          {/* Bottom-Left subtle edge anchor */}
          <div 
            className="absolute inset-0 z-[2] pointer-events-none"
            style={{
              background: "linear-gradient(0deg, rgba(10,10,12,0.55) 0%, rgba(10,10,12,0.12) 14%, rgba(10,10,12,0) 24%)"
            }}
          />
        </div>

        {/* Lower-Third Anchored Content (Exact Alignment Matching Men's Hero) */}
        <div className="absolute inset-x-0 bottom-[7vh] sm:bottom-[9vh] lg:bottom-[10vh] z-10 pointer-events-none">
          <div className="max-w-[1700px] w-full mx-auto px-5 sm:px-8 lg:px-14 xl:px-16 flex items-end justify-between">
            <div className="w-full max-w-[620px] pointer-events-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Eyebrow */}
                <div className="flex items-center gap-2.5 mb-2.5 sm:mb-[14px]">
                  <span className="w-4 h-[1px] bg-[#C2922E]" />
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#C2922E] font-medium font-body">
                    ICW WOMEN / BY SUKO
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="font-quiche text-4xl sm:text-6xl lg:text-[4.5rem] tracking-tight text-white leading-[0.98] font-light mb-3.5 sm:mb-[18px] drop-shadow-2xl">
                  The ICW <span className="italic font-normal text-white/90">Woman</span>
                </h1>

                {/* Shorter Luxury Subline */}
                <p className="text-white/75 font-body text-xs sm:text-[14px] lg:text-[15px] tracking-wide font-light leading-relaxed max-w-[420px] mb-6 sm:mb-[28px]">
                  Architectural silhouettes shaped for quiet authority and effortless presence.
                </p>

                {/* Underline CTA -> Smooth Scroll to #women-categories */}
                <div className="pt-1">
                  <a
                    href="#women-categories"
                    onClick={scrollToCategories}
                    className="group inline-flex items-center gap-2.5 text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.24em] font-normal text-white hover:text-[#C2922E] transition-all duration-300 cursor-pointer"
                  >
                    <span className="border-b border-[#C2922E] pb-1 transition-all duration-300">
                      EXPLORE THE COLLECTION
                    </span>
                    <ArrowUpRight size={13} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: WOMEN INTRO / BRAND STATEMENT (Ivory Whitespace Architecture)
          ========================================================================= */}
      <section className="bg-[#FAF8F5] dark:bg-transparent pt-5 sm:pt-7 lg:pt-8 pb-5 sm:pb-6 lg:pb-7 px-5 sm:px-8 border-b border-[#E8E4DC] dark:border-white/10 transition-colors duration-300">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-[#C2922E] font-medium block mb-2 sm:mb-2.5">
            THE WOMEN'S EDIT
          </span>
          <div className="w-8 sm:w-10 h-[1.5px] bg-[#C2922E] mx-auto mb-3.5 sm:mb-4" />

          <h2 className="font-quiche text-3xl sm:text-5xl lg:text-[3.2rem] font-light tracking-tight text-[#111113] dark:text-white leading-[1.12] mb-3.5 sm:mb-4 drop-shadow-sm">
            Designed for <span className="italic font-normal">presence.</span>
          </h2>

          <p className="text-[#484852] dark:text-white/80 font-body text-xs sm:text-[14.5px] lg:text-[15.5px] font-normal leading-[1.75] max-w-2xl mx-auto">
            Precision tailoring shaped for women who lead — considered structure, effortless comfort, and a silhouette made to command the room.
          </p>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: SHOP WOMEN BY CATEGORY (Asymmetric Editorial Grid - Set-Led)
          ========================================================================= */}
      <section id="women-categories" className="bg-[#F7F5F0] dark:bg-transparent pt-7 sm:pt-9 lg:pt-10 pb-6 sm:pb-8 lg:pb-9 px-4 sm:px-6 lg:px-[3.5vw] border-b border-[#E8E4DC] dark:border-white/10 transition-colors duration-300 scroll-mt-14">
        <div className="max-w-[1680px] mx-auto">

          <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <span className="text-[10.5px] sm:text-[11px] lg:text-[11.5px] uppercase tracking-[0.26em] text-[#C2922E] font-medium block mb-2 sm:mb-2.5">
                EXECUTIVE WARDROBE
              </span>
              <h2 className="font-quiche text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#111113] dark:text-white">
                SHOP BY CATEGORY
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-7 items-stretch">

            {/* Featured Tile: Power Suits & Pantsuits */}
            <Link
              to="/new-in?category=suits&gender=women"
              className="lg:col-span-4 group relative overflow-hidden bg-[#1A1A1E] min-h-[460px] sm:min-h-[540px] flex flex-col justify-end p-6 sm:p-8 pb-9 sm:pb-12 text-white block"
            >
              <img
                src="/products/the-plum-sculpted-suit/1.JPG"
                alt="Power Suits & 2-Piece Sets"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover object-[50%_15%] transition-transform duration-1000 ease-out group-hover:scale-105"
              />
              {/* Lower 60-65% Soft Dark Gradient (Model top/face 100% clean & clear) */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(0deg, rgba(12,12,12,0.86) 0%, rgba(12,12,12,0.64) 28%, rgba(12,12,12,0.32) 50%, rgba(12,12,12,0.06) 60%, rgba(12,12,12,0) 66%)"
                }}
              />

              <div className="relative z-10">
                {/* Repositioned Eyebrow: 18-20px above heading, Brighter Gold #C99A2E, Left aligned on background */}
                <div className="flex items-center gap-2 mb-4 sm:mb-[18px]">
                  <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.22em] text-[#C99A2E] font-semibold font-body">
                    01 &middot; Signature Sets
                  </span>
                </div>
                <h3 className="font-quiche text-2xl sm:text-[1.95rem] font-light leading-[1.05] tracking-tight mb-2.5 text-white">
                  POWER SUITS &amp; <br />
                  <span className="italic font-normal">PANTSUITS</span>
                </h3>
                <p className="text-white/85 text-xs sm:text-[13px] font-light leading-relaxed mb-6 max-w-[310px] font-body">
                  Complete 2-piece tailored blazer &amp; trouser sets engineered for boardroom presence.
                </p>
                <div className="pt-0.5">
                  <span className="inline-flex items-center gap-2 text-[10px] sm:text-[10.5px] uppercase tracking-[0.24em] font-normal text-white transition-colors cursor-pointer">
                    <span className="border-b border-[#C2922E] pb-0.5 transition-all">
                      EXPLORE POWER SUITS
                    </span>
                    <ArrowRight size={12} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>

            {/* 3 Smaller Set-Based Tiles */}
            <div className="lg:col-span-8 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-7 items-start">
              {[
                {
                  num: "02",
                  title: "Waistcoat Sets",
                  tagline: "Vest & Trouser Co-ords",
                  image: "/products/midnight-sculpted-vest-set/1.JPG",
                  link: "/new-in?category=suits&gender=women"
                },
                {
                  num: "03",
                  title: "Peplum & Co-ords",
                  tagline: "Fishtail & Modular Sets",
                  image: "/products/midnight-peplum-fishtail-set/1.JPG",
                  link: "/new-in?category=suits&gender=women"
                },
                {
                  num: "04",
                  title: "All Women's Sets",
                  tagline: "The Complete Suiting Edit",
                  image: "/products/the-noir-layered-suit/1.JPG",
                  link: "/new-in?gender=women"
                }
              ].map((cat, idx) => (
                <Link
                  key={idx}
                  to={cat.link}
                  className={`group block ${idx === 2 ? "col-span-2 sm:col-span-1" : ""}`}
                >
                  <div className="relative aspect-[3/4.2] sm:aspect-[3/4.5] lg:aspect-[3/4.9] overflow-hidden bg-[#EAE6DF] dark:bg-[#18181D]/80 mb-2.5 sm:mb-3.5">
                    <img
                      src={cat.image}
                      alt={cat.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                      <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-white bg-black/40 backdrop-blur-md px-1.5 sm:px-2 py-0.5 font-medium">
                        {cat.num}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-quiche text-base sm:text-xl font-light text-[#121215] dark:text-white group-hover:text-[#C2922E] transition-colors leading-snug">
                      {cat.title}
                    </h3>
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-[#75757A] dark:text-white/60 font-medium mt-1 truncate">
                      {cat.tagline}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 4: NEW IN WOMEN (Asymmetric Editorial Layout - 1 Large + 4 Small)
          ========================================================================= */}
      <section className="bg-[#F6F2EA] dark:bg-transparent pt-6 sm:pt-8 lg:pt-9 pb-10 sm:pb-14 lg:pb-16 px-4 sm:px-6 lg:px-[3.5vw] border-b border-[#E8E4DC] dark:border-white/10 transition-colors duration-300">
        <div className="max-w-[1680px] mx-auto">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-10 text-center sm:text-left">
            <div>
              <span className="text-[10.5px] sm:text-[11px] lg:text-[11.5px] uppercase tracking-[0.26em] text-[#6A6A74] dark:text-white/60 font-medium block mb-2 sm:mb-2.5">
                NEW TO THE EDIT
              </span>
              <h2 className="font-quiche text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#111113] dark:text-white">
                New In Women
              </h2>
            </div>
            <Link
              to="/new-in?gender=women"
              className="group inline-flex items-center gap-2 text-[10.5px] sm:text-[11px] uppercase tracking-[0.22em] text-[#111113] dark:text-white hover:text-[#C2922E] transition-colors self-center sm:self-end"
            >
              <span className="border-b border-[#111113] dark:border-white group-hover:border-[#C2922E] pb-0.5 transition-all">
                VIEW ALL NEW IN
              </span>
              <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Asymmetric Editorial Grid (1 Large Left + 4 Small in 2x2 Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-7 items-stretch">
            {/* Left (50% / 2 cols): Large Featured Editorial Product */}
            <div className="lg:col-span-6 h-full flex flex-col">
              {newInProducts[0] && (
                <ProductCard
                  product={newInProducts[0]}
                  index={0}
                  isFeatured={true}
                  className="h-full"
                />
              )}
            </div>

            {/* Right (50% / 2 cols): 4 Standard Cards in 2x2 Grid */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-x-3.5 sm:gap-x-5 lg:gap-x-6 gap-y-6 sm:gap-y-8">
              {newInProducts.slice(1, 5).map((product, idx) => (
                <ProductCard
                  key={product.id || idx}
                  product={product}
                  index={idx + 1}
                  isFeatured={false}
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 5: EDITORIAL LOOK / FULL-WIDTH CAMPAIGN (Visual Break)
          ========================================================================= */}
      <section className="relative w-full h-[60vh] sm:h-[65vh] min-h-[440px] max-h-[640px] bg-[#0A0A0C] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/boardroom_women.jpg"
            alt="The Boardroom Edit"
            className="w-full h-full object-cover object-top transition-transform duration-1000 ease-out hover:scale-105"
          />
          {/* Calibrated Left Dark Gradient (Right 50% where model stands is naturally bright & clear) */}
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
              className="group inline-flex items-center gap-2.5 text-[11px] sm:text-[12px] uppercase tracking-[0.22em] font-medium text-white hover:text-[#C99A2E] transition-colors"
            >
              <span className="border-b border-[#C99A2E] pb-0.5 transition-colors">
                DISCOVER THE EDIT
              </span>
              <ArrowRight size={13} className="text-[#C99A2E] transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: WOMEN'S ATELIER (Craftsmanship Split Editorial)
          ========================================================================= */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="bg-[#FAF8F5] dark:bg-transparent py-10 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-[3.5vw] border-b border-[#E8E4DC] dark:border-white/10 transition-colors duration-300"
      >
        <div className="max-w-[1680px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 xl:gap-20 items-center">
            
            {/* LEFT (~55%): Clean Macro Craftsmanship Video (Slow, Refined, Seamless Loop) */}
            <div className="lg:col-span-7">
              <div className="relative aspect-[4/3] sm:aspect-[16/11] lg:aspect-[16/11.5] overflow-hidden bg-[#18181D] shadow-sm">
                <video
                  ref={(el) => {
                    if (el) el.playbackRate = 0.85;
                  }}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover object-center"
                >
                  <source src="/atlier_women.mp4" type="video/mp4" />
                </video>
                {/* Subtle 6% Neutral Overlay */}
                <div className="absolute inset-0 bg-black/[0.06] pointer-events-none" />
              </div>
            </div>

            {/* RIGHT (~45%): Warm Ivory Editorial Content Area with Generous Whitespace */}
            <div className="lg:col-span-5 flex flex-col justify-center text-left lg:pl-2 xl:pl-4">
              {/* Gold Eyebrow */}
              <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
                <span className="w-5 h-[1px] bg-[#C2922E]" />
                <span className="text-[10px] sm:text-[11px] lg:text-[11.5px] uppercase tracking-[0.32em] text-[#C2922E] font-semibold font-body">
                  THE WOMEN&apos;S ATELIER
                </span>
              </div>

              {/* Large Editorial Serif Headline */}
              <h2 className="font-quiche text-3xl sm:text-5xl lg:text-[3.4rem] xl:text-[3.8rem] font-light tracking-tight text-[#111113] dark:text-white leading-[1.04] mb-4 sm:mb-6">
                Cut with <span className="italic font-normal">intention.</span>
              </h2>

              {/* Single Supporting Statement */}
              <p className="text-[#484852] dark:text-white/80 font-body text-sm sm:text-base lg:text-[16.5px] font-normal leading-[1.75] mb-7 sm:mb-9 max-w-[440px]">
                Considered lines. Precise proportions. Tailoring designed to hold its presence.
              </p>

              {/* Minimal Underlined Luxury CTA */}
              <div>
                <Link
                  to="/collection?gender=women"
                  className="group inline-flex items-center gap-2.5 text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.24em] font-normal text-[#111113] dark:text-white hover:text-[#C2922E] dark:hover:text-[#C2922E] transition-all duration-300"
                >
                  <span className="border-b border-[#111113] dark:border-white group-hover:border-[#C2922E] pb-1 transition-all duration-300">
                    DISCOVER THE COLLECTION
                  </span>
                  <ArrowRight size={13} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </motion.section>

      {/* =========================================================================
          SECTION 7: THE SIGNATURE EDIT / COMPLETE SUITING SETS
          ========================================================================= */}
      <section className="bg-[#F6F2EA] dark:bg-transparent pt-6 sm:pt-8 lg:pt-9 pb-10 sm:pb-14 lg:pb-16 px-4 sm:px-6 lg:px-[3.5vw] border-b border-[#E8E4DC] dark:border-white/10 transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto">

          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="text-[10.5px] sm:text-[11px] lg:text-[11.5px] uppercase tracking-[0.26em] text-[#C2922E] font-medium block mb-2 sm:mb-2.5">
              THE SIGNATURE EDIT
            </span>
            <h2 className="font-quiche text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#111113] dark:text-white mb-2">
              Shop the Silhouettes
            </h2>
            <p className="text-[13px] sm:text-[14.5px] text-[#484852] dark:text-white/80 font-normal leading-relaxed">
              Complete tailoring, composed for modern authority.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {CORE_PIECES.map((piece, idx) => (
              <Link
                key={idx}
                to={piece.link}
                className="group block bg-[#FAF8F5] dark:bg-[#121215] border border-[#EAE6DF]/60 dark:border-white/5 overflow-hidden transition-all duration-300 hover:border-[#C2922E] dark:hover:border-[#C2922E]"
              >
                <div className="aspect-[3/4] overflow-hidden bg-[#EAE6DF] dark:bg-[#18181D]">
                  <img
                    src={piece.image}
                    alt={piece.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  />
                </div>
                <div className="p-4 sm:p-5">
                  <span className="text-[9px] uppercase tracking-[0.24em] text-[#C2922E] font-medium block mb-1">
                    {piece.tag}
                  </span>
                  <h3 className="font-quiche text-base sm:text-lg font-light text-[#121215] dark:text-white mb-1 truncate">
                    {piece.title}
                  </h3>
                  <p className="text-xs text-[#555560] dark:text-white/65 font-light leading-relaxed mb-3.5">
                    {piece.desc}
                  </p>
                  <div className="text-xs font-medium text-[#111113] dark:text-white flex items-center justify-between pt-2.5 border-t border-[#E8E4DC]/60 dark:border-white/10">
                    <span>{piece.price}</span>
                    <ArrowRight size={13} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-1.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>



      {/* =========================================================================
          SECTION 8: SERVICE STRIP
          ========================================================================= */}
      <section className="bg-[#F6F2EA] dark:bg-[#0A0A0C]/50 py-3 sm:py-3.5 px-4 sm:px-6 lg:px-14 xl:px-16 border-y border-[#E2DDD5] dark:border-white/10 transition-colors duration-300">
        <div className="max-w-[1700px] mx-auto grid grid-cols-2 gap-y-2.5 gap-x-3 text-center sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:text-left text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.22em] text-[#222227] dark:text-white/80 font-normal">
          <span>COMPLIMENTARY SHIPPING</span>
          <span className="hidden sm:inline text-[#D8D4CC]/70 dark:text-white/25">&bull;</span>
          <span>EASY EXCHANGES</span>
          <span className="hidden sm:inline text-[#D8D4CC]/70 dark:text-white/25">&bull;</span>
          <span>SECURE CHECKOUT</span>
          <span className="hidden sm:inline text-[#D8D4CC]/70 dark:text-white/25">&bull;</span>
          <span>CUSTOMER ASSISTANCE</span>
        </div>
      </section>

    </div>
  );
};

export default Women;
