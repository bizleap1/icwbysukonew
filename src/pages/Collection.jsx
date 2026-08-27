import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLenis } from "lenis/react";
import SEO from "../components/SEO";

// Curated Collection Tabs in exact sequential page flow
const COLLECTIONS_TABS = [
  { id: "signature", label: "SIGNATURE", targetId: "signature-sets" },
  { id: "boardroom", label: "BOARDROOM EDIT", targetId: "boardroom-edit" },
  { id: "atelier", label: "ATELIER EDIT", targetId: "atelier-edit" },
  { id: "new-season", label: "NEW SEASON", targetId: "new-season" }
];

// Curated 4 Complete Sets Showcase (Exact 1-to-1 Product Links & Names)
const CURATED_SETS = [
  {
    id: "the-plum-sculpted-suit",
    title: "Plum Sculpted Suit",
    tag: "Double-Breasted 2-Piece Suit",
    price: "₹78,000",
    desc: "Sculpted double-breasted blazer with flared trousers in deep plum.",
    image: "/products/the-plum-sculpted-suit/1.JPG",
    link: "/product/the-plum-sculpted-suit"
  },
  {
    id: "the-dusty-rose-flare-suit",
    title: "Dusty Rose Flare Suit",
    tag: "Flared 2-Piece Suit",
    price: "₹76,000",
    desc: "Longline single-breasted blazer paired with exaggerated sculptural flared trousers.",
    image: "/products/dusty-rose-sculpted-flare-suit/1.png",
    link: "/product/the-dusty-rose-flare-suit"
  },
  {
    id: "the-noir-tailored-suit",
    title: "Noir Tailored Suit",
    tag: "Single-Breasted 2-Piece Suit",
    price: "₹78,000",
    desc: "Refined black tailoring set with structured notch lapels and wide-leg trousers.",
    image: "/products/the-noir-tailored-suit/1.JPG",
    link: "/product/the-noir-tailored-suit"
  },
  {
    id: "the-aubergine-tailored-suit",
    title: "Aubergine Tailored Suit",
    tag: "Single-Breasted 2-Piece Suit",
    price: "₹82,000",
    desc: "Sharp notch-lapel tailored blazer paired with coordinated straight-leg trousers in deep aubergine.",
    image: "/products/aubergine-tailored-power-suit/1.png",
    link: "/product/the-aubergine-tailored-suit"
  }
];

// Visual Tiles for Shop by Collection (Section 6: New Season Edit)
const COLLECTION_TILES = [
  {
    id: "boardroom-tile",
    title: "THE BOARDROOM EDIT",
    sub: "Signature Suiting",
    image: "/products/the-noir-tailored-suit/1.JPG",
    link: "/new-in?category=suits&gender=women"
  },
  {
    id: "atelier-tile",
    title: "THE ATELIER EDIT",
    sub: "Sculpted Co-ords",
    image: "/products/midnight-peplum-fishtail-set/1.png",
    link: "/new-in?category=suits&gender=women"
  },
  {
    id: "signature-tile",
    title: "SIGNATURE SUITING",
    sub: "Complete Sets",
    image: "/products/the-plum-sculpted-suit/1.JPG",
    link: "/new-in?category=suits&gender=women"
  },
  {
    id: "new-season-tile",
    title: "NEW SEASON",
    sub: "Atelier Creations",
    image: "/products/the-dusty-rose-embroidered-set/1.JPG",
    link: "/new-in"
  }
];

// Distinct Visual Tiles for Shop by Collection (Section 7: Explore Editions)
const SHOP_BY_COLLECTION_TILES = [
  {
    id: "shop-power-suits",
    title: "THE POWER SUITS EDIT",
    sub: "Architectural Suiting",
    image: "/products/the-noir-layered-suit/1.JPG",
    link: "/new-in?category=suits&gender=women"
  },
  {
    id: "shop-sculpted-flare",
    title: "THE SCULPTED FLARE",
    sub: "Fluid Proportions",
    image: "/products/dusty-rose-sculpted-flare-suit/1.png",
    link: "/new-in?category=suits&gender=women"
  },
  {
    id: "shop-waistcoat-coords",
    title: "EXECUTIVE WAISTCOATS",
    sub: "Vest & Trouser Co-ords",
    image: "/products/midnight-sculpted-vest-set/1.JPG",
    link: "/new-in?category=suits&gender=women"
  },
  {
    id: "shop-draped-mini",
    title: "THE DRAPED ATELIER",
    sub: "Contemporary Sets",
    image: "/products/aubergine-draped-vest-mini-set/1.png",
    link: "/new-in?category=suits&gender=women"
  }
];

const Collection = () => {
  const lenis = useLenis();
  const [activeTab, setActiveTab] = useState("signature");

  // Synchronize Active Tab with Scroll Position (Scroll Spy)
  useEffect(() => {
    const handleScrollSpy = () => {
      const scrollPos = window.scrollY + 180;
      const sections = [
        { id: "signature", el: document.getElementById("signature-sets") },
        { id: "boardroom", el: document.getElementById("boardroom-edit") },
        { id: "atelier", el: document.getElementById("atelier-edit") },
        { id: "new-season", el: document.getElementById("new-season") }
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const sec = sections[i];
        if (sec.el && sec.el.offsetTop <= scrollPos) {
          setActiveTab(sec.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScrollSpy, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollSpy);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis) {
      lenis.scrollTo(el, { offset: -55, duration: 1.1 });
    } else {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    scrollToSection(tab.targetId);
  };

  return (
    <div data-testid="collections-hub-page" className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white transition-colors duration-300">
      <SEO 
        title="Curated Collections &amp; Edits"
        description="Discover ICW by Suko suiting editions — Boardroom, Signature, and Atelier creations designed for high-ranking authority."
      />
      
      {/* =========================================================================
          SECTION 1: HERO / COLLECTION INTRO (Mobile-Native 78vh-85vh)
          ========================================================================= */}
      <section
        data-testid="collections-hero"
        className="relative h-[80vh] sm:h-[85vh] lg:h-screen w-full bg-[#0A0A0C] overflow-hidden"
      >
        {/* Campaign Visual Background */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#0A0A0C]">
          <img
            src="/products/the-noir-tailored-suit/1.JPG"
            alt="ICW The Signature Collection"
            className="w-full h-full object-cover object-[55%_25%] sm:object-[50%_25%] opacity-95 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10 z-[2]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-transparent z-[2]" />
        </div>

        {/* Lower-Left Typography Content */}
        <div className="absolute inset-x-0 bottom-8 sm:bottom-12 lg:bottom-16 z-10 pointer-events-none">
          <div className="max-w-[1700px] w-full mx-auto px-5 sm:px-8 lg:px-14 xl:px-16 flex items-end justify-between">
            <div className="w-full max-w-[580px] pointer-events-auto">
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Eyebrow */}
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <span className="w-3.5 h-[1px] bg-[#C2922E]" />
                  <span className="text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.24em] text-[#C2922E] font-medium font-body">
                    ICW BY SUKO / COLLECTIONS
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="font-quiche text-3xl sm:text-5xl lg:text-[4.5rem] tracking-tight text-white leading-[1.02] font-light mb-2.5 sm:mb-3.5 drop-shadow-2xl">
                  The Signature <span className="italic font-normal text-white/90">Collection</span>
                </h1>

                {/* Subline (Clean 1-line luxury copy) */}
                <p className="text-white/80 font-body text-xs sm:text-[14px] lg:text-[15px] tracking-wide font-light leading-relaxed max-w-[440px] mb-4 sm:mb-6">
                  Complete coordinated tailoring, composed for modern authority.
                </p>

                {/* Underline CTA */}
                <div>
                  <a
                    href="#signature-sets"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("signature-sets");
                    }}
                    className="group inline-flex items-center gap-2 text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.24em] font-normal text-white hover:text-[#C2922E] transition-all duration-300 cursor-pointer"
                  >
                    <span className="border-b border-[#C2922E] pb-1 transition-all duration-300">
                      EXPLORE THE COLLECTION
                    </span>
                    <ArrowRight size={13} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-1.5" />
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: COLLECTION NAVIGATION STRIP (Horizontal Single-Line Swipe, Sticky)
          ========================================================================= */}
      <section
        id="collection-nav"
        className="sticky top-0 z-30 bg-[#FAF8F5]/95 dark:bg-[#0A0A0C]/90 backdrop-blur-md border-y border-[#E8E4DC] dark:border-white/10 transition-colors duration-300 h-[48px] sm:h-[52px] flex items-center"
      >
        <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-14 xl:px-16">
          <div className="flex items-center justify-start sm:justify-center gap-6 sm:gap-10 lg:gap-14 overflow-x-auto no-scrollbar whitespace-nowrap py-2">
            {COLLECTIONS_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab)}
                  className={`relative text-[10px] sm:text-[11.5px] uppercase tracking-[0.22em] sm:tracking-[0.24em] font-medium transition-colors shrink-0 pb-1 ${
                    active
                      ? "text-[#111113] dark:text-white"
                      : "text-[#777782] dark:text-white/50 hover:text-[#111113] dark:hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>
                  {active && (
                    <motion.div
                      layoutId="activeCollectionUnderline"
                      className="absolute bottom-0 inset-x-0 h-[1.5px] bg-[#C2922E]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: SIGNATURE COLLECTION (2-Column Mobile Grid, 4-Col Desktop)
          ========================================================================= */}
      <section
        id="signature-sets"
        className="bg-[#F6F2EA] dark:bg-transparent pt-8 sm:pt-12 lg:pt-16 pb-10 sm:pb-14 lg:pb-20 px-4 sm:px-6 lg:px-14 xl:px-16 border-b border-[#E8E4DC] dark:border-white/10 transition-colors duration-300 scroll-mt-14"
      >
        <div className="max-w-[1700px] mx-auto">

          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
            <span className="text-[9.5px] sm:text-[11px] lg:text-[11.5px] uppercase tracking-[0.26em] text-[#C2922E] font-medium block mb-1.5 sm:mb-2">
              THE SIGNATURE EDIT
            </span>
            <h2 className="font-quiche text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#111113] dark:text-white mb-1.5">
              Curated Silhouettes
            </h2>
            <p className="text-xs sm:text-[14px] text-[#484852] dark:text-white/80 font-normal leading-relaxed">
              Complete coordinated sets, tailored for modern authority.
            </p>
          </div>

          {/* 2-Column Mobile Grid / 4-Column Desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {CURATED_SETS.map((piece) => (
              <Link
                key={piece.id}
                to={piece.link}
                className="group block bg-[#FAF8F5] dark:bg-[#121215] border border-[#EAE6DF]/70 dark:border-white/5 overflow-hidden transition-all duration-300 hover:border-[#C2922E] dark:hover:border-[#C2922E]"
              >
                {/* Edge-to-edge flush image */}
                <div className="aspect-[3/4] overflow-hidden bg-[#EAE6DF] dark:bg-[#18181D]">
                  <img
                    src={piece.image}
                    alt={piece.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  />
                </div>
                {/* Text padded below */}
                <div className="p-3 sm:p-4 lg:p-5">
                  <span className="text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.2em] text-[#C2922E] font-medium block mb-0.5 truncate">
                    {piece.tag}
                  </span>
                  <h3 className="font-quiche text-[13px] sm:text-base lg:text-lg font-light text-[#121215] dark:text-white mb-1 truncate">
                    {piece.title}
                  </h3>
                  <p className="hidden sm:block text-xs text-[#555560] dark:text-white/65 font-light leading-relaxed mb-3 line-clamp-2">
                    {piece.desc}
                  </p>
                  <div className="text-[11.5px] sm:text-xs font-medium text-[#111113] dark:text-white flex items-center justify-between pt-2 border-t border-[#E8E4DC]/60 dark:border-white/10">
                    <span>{piece.price}</span>
                    <ArrowRight size={12} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* View All Sets Link */}
          <div className="mt-7 sm:mt-10 text-center">
            <Link
              to="/new-in?category=suits"
              className="group inline-flex items-center gap-2 text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.24em] font-medium text-[#111113] dark:text-white hover:text-[#C2922E] transition-colors"
            >
              <span className="border-b border-[#111113] dark:border-white group-hover:border-[#C2922E] pb-0.5 transition-colors">
                VIEW ALL COORDINATED SETS
              </span>
              <ArrowRight size={13} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 4: THE BOARDROOM EDIT (Women: Image First ~65vh, Text Below on Mobile)
          ========================================================================= */}
      <section
        id="boardroom-edit"
        className="bg-[#FAF8F5] dark:bg-transparent pt-8 sm:pt-12 lg:pt-16 pb-8 sm:pb-12 lg:pb-16 px-4 sm:px-6 lg:px-14 xl:px-16 border-b border-[#E8E4DC] dark:border-white/10 transition-colors duration-300 scroll-mt-14"
      >
        <div className="max-w-[1700px] mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-12 items-center">
            {/* Women Editorial Image (Stacked First on Mobile ~65vh) */}
            <div className="lg:col-span-6 relative h-[62vh] sm:h-[68vh] lg:h-auto lg:aspect-[5/4.6] overflow-hidden bg-[#151518]">
              <img
                src="/products/the-plum-sculpted-suit/1.JPG"
                alt="The Boardroom Edit — Complete Coordinated Tailoring"
                loading="lazy"
                className="w-full h-full object-cover object-[50%_15%] transition-transform duration-700 ease-out hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Typography Story Block */}
            <div className="lg:col-span-6 flex flex-col justify-center lg:pl-4 xl:pl-8 pt-2 sm:pt-0">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-[#C2922E] font-medium block mb-1.5 sm:mb-3">
                THE BOARDROOM EDIT
              </span>

              <h2 className="font-quiche text-2xl sm:text-4xl lg:text-5xl font-light text-[#111113] dark:text-white tracking-tight leading-[1.1] mb-2 sm:mb-4">
                Tailored for <span className="italic font-normal">commanding presence.</span>
              </h2>

              <p className="text-[#484852] dark:text-white/80 font-body text-xs sm:text-[14px] lg:text-[15px] font-light leading-relaxed mb-5 sm:mb-7 max-w-md">
                Architectural tailoring and coordinated sets, composed for women who lead.
              </p>

              <div>
                <Link
                  to="/new-in?category=suits&gender=women"
                  className="group inline-flex items-center gap-2.5 text-[10.5px] sm:text-[12px] uppercase tracking-[0.22em] font-medium text-[#111113] dark:text-white hover:text-[#C2922E] transition-colors"
                >
                  <span className="border-b border-[#111113] dark:border-white group-hover:border-[#C2922E] pb-0.5 transition-colors">
                    DISCOVER THE EDIT
                  </span>
                  <ArrowRight size={13} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 5: THE ATELIER EDIT (Sculpted Silhouettes & Modular Sets)
          ========================================================================= */}
      <section
        id="atelier-edit"
        className="bg-[#FAF8F5] dark:bg-transparent pt-8 sm:pt-12 lg:pt-16 pb-8 sm:pb-12 lg:pb-16 px-4 sm:px-6 lg:px-14 xl:px-16 border-b border-[#E8E4DC] dark:border-white/10 transition-colors duration-300 scroll-mt-14"
      >
        <div className="max-w-[1700px] mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-12 items-center">
            {/* Text First on Mobile (order-1 on mobile, lg:order-1 on desktop) */}
            <div className="lg:col-span-5 flex flex-col justify-center order-1 lg:order-1">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-[#C2922E] font-medium block mb-1.5 sm:mb-3">
                THE ATELIER EDIT
              </span>

              <h2 className="font-quiche text-2xl sm:text-4xl lg:text-5xl font-light text-[#111113] dark:text-white tracking-tight leading-[1.1] mb-2 sm:mb-4">
                Sculpted <span className="italic font-normal">distinction.</span>
              </h2>

              <p className="text-[#484852] dark:text-white/80 font-body text-xs sm:text-[14px] lg:text-[15px] font-light leading-relaxed mb-5 sm:mb-7 max-w-lg">
                Engineered with architectural draping, peplum lines, and hand-finished couture elements for uncompromising presence.
              </p>

              <div>
                <Link
                  to="/new-in?category=suits&gender=women"
                  className="group inline-flex items-center gap-2.5 text-[10.5px] sm:text-[12px] uppercase tracking-[0.22em] font-medium text-[#111113] dark:text-white hover:text-[#C2922E] transition-colors"
                >
                  <span className="border-b border-[#111113] dark:border-white group-hover:border-[#C2922E] pb-0.5 transition-colors">
                    DISCOVER ATELIER PIECES
                  </span>
                  <ArrowRight size={13} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* Editorial Image */}
            <div className="lg:col-span-7 relative h-[52vh] sm:h-[58vh] lg:h-auto lg:aspect-[16/10] overflow-hidden bg-[#151518] order-2 lg:order-2 mt-2 sm:mt-0">
              <img
                src="/products/dusty-rose-sculpted-flare-suit/1.png"
                alt="The Atelier Edit"
                loading="lazy"
                className="w-full h-full object-cover object-[50%_25%] transition-transform duration-700 ease-out hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 6: NEW SEASON (Swipeable Carousel on Mobile, 4-Col Desktop)
          ========================================================================= */}
      <section
        id="new-season"
        className="bg-[#FAF8F5] dark:bg-transparent pt-8 sm:pt-11 lg:pt-13 pb-10 sm:pb-14 lg:pb-18 px-4 sm:px-6 lg:px-14 xl:px-16 border-b border-[#E8E4DC] dark:border-white/10 transition-colors duration-300 scroll-mt-14 overflow-hidden"
      >
        <div className="max-w-[1700px] mx-auto">

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
            <span className="text-[9.5px] sm:text-[11px] lg:text-[11.5px] uppercase tracking-[0.26em] text-[#C2922E] font-medium block mb-1.5 sm:mb-2">
              SEASONAL ATELIER
            </span>
            <h2 className="font-quiche text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#111113] dark:text-white mb-1.5">
              The New Season Edit
            </h2>
            <p className="text-xs sm:text-[14.5px] text-[#484852] dark:text-white/80 font-normal leading-relaxed">
              Explore our seasonal portfolio of architectural suiting across curated editions.
            </p>
          </div>

          {/* Swipeable Carousel on Mobile / 4-Col Grid on Desktop */}
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
            {COLLECTION_TILES.map((tile) => (
              <Link
                key={tile.id}
                to={tile.link}
                className="group relative aspect-[3/4] w-[78vw] sm:w-auto shrink-0 snap-start overflow-hidden bg-[#121215] border border-[#EAE6DF]/70 dark:border-white/5 transition-all duration-300 hover:border-[#C2922E] dark:hover:border-[#C2922E] block"
              >
                <img
                  src={tile.image}
                  alt={tile.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03] opacity-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                
                <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 lg:p-6 text-white">
                  <span className="text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.22em] text-[#C2922E] font-medium block mb-0.5">
                    {tile.sub}
                  </span>
                  <h3 className="font-quiche text-base sm:text-lg lg:text-xl font-light text-white mb-1.5 leading-snug">
                    {tile.title}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.2em] font-medium text-white/90 group-hover:text-[#C2922E] transition-colors">
                    <span>EXPLORE EDIT</span>
                    <ArrowRight size={11} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 7: SHOP BY COLLECTION TILES (2x2 Grid on Mobile, 4-Col Desktop)
          ========================================================================= */}
      <section className="bg-[#F6F2EA] dark:bg-transparent pt-8 sm:pt-11 lg:pt-13 pb-10 sm:pb-14 lg:pb-18 px-4 sm:px-6 lg:px-14 xl:px-16 border-b border-[#E8E4DC] dark:border-white/10 transition-colors duration-300">
        <div className="max-w-[1700px] mx-auto">

          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
            <span className="text-[9.5px] sm:text-[11px] uppercase tracking-[0.26em] text-[#C2922E] font-medium block mb-1.5">
              EXPLORE EDITIONS
            </span>
            <h2 className="font-quiche text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-[#111113] dark:text-white">
              Shop by Collection
            </h2>
          </div>

          {/* 2x2 Grid on Mobile / 4-Col Desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {SHOP_BY_COLLECTION_TILES.map((tile) => (
              <Link
                key={tile.id}
                to={tile.link}
                className="group relative aspect-square sm:aspect-[4/5] overflow-hidden bg-[#121215] border border-[#EAE6DF]/70 dark:border-white/5 block transition-all duration-300 hover:border-[#C2922E]"
              >
                <img
                  src={tile.image}
                  alt={tile.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-top opacity-90 transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 text-white">
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-[#C2922E] font-medium block mb-0.5">
                    {tile.sub}
                  </span>
                  <h4 className="font-quiche text-[13px] sm:text-base font-light text-white leading-snug">
                    {tile.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 8: SERVICE STRIP (2x2 Compact Grid on Mobile)
          ========================================================================= */}
      <section className="bg-[#FAF8F5] dark:bg-[#0A0A0C]/50 py-3.5 sm:py-4 px-4 sm:px-6 lg:px-14 xl:px-16 border-y border-[#E2DDD5] dark:border-white/10 transition-colors duration-300">
        <div className="max-w-[1700px] mx-auto grid grid-cols-2 gap-y-2 gap-x-3 text-center sm:flex sm:items-center sm:justify-between sm:text-left text-[9px] sm:text-[10.5px] uppercase tracking-[0.22em] text-[#222227] dark:text-white/80 font-normal">
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

export default Collection;
