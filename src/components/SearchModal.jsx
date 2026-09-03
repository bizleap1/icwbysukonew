import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { X, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PRODUCTS, MOMENTS, CATEGORIES, formatINR } from "../data/products";
import { getCardImage } from "../utils/mediaUtils";

const POPULAR_SEARCHES = [
  { label: "The Boardroom Edit", link: "/shop-by-moment?moment=boardroom" },
  { label: "The Founder Edit", link: "/shop-by-moment?moment=founder" },
  { label: "The Presentation Edit", link: "/shop-by-moment?moment=presentation" },
  { label: "Executive Essentials", link: "/shop-by-moment?moment=essentials" },
  { label: "After-Hours Executive", link: "/shop-by-moment?moment=after-hours" },
  { label: "Power Suits", link: "/collection?category=suits" },
  { label: "Tailored Separates", link: "/collection?category=separates" },
  { label: "New Arrivals", link: "/new-in" },
];

const INTENT_MAPPINGS = [
  {
    keywords: ["investor", "pitch", "funding", "board", "leadership", "meeting", "ceo", "cxo"],
    momentId: "boardroom",
    title: "Curated for High-Stakes Leadership",
    recommendation: "The Boardroom Edit",
    description: "Structured double-breasted silhouettes & tailored luxury wool designed to command the room.",
  },
  {
    keywords: ["founder", "startup", "venture", "innovation", "keynote", "modern"],
    momentId: "founder",
    title: "Curated for High-Growth Visionaries",
    recommendation: "The Founder Edit",
    description: "Bold peplum cuts & sculptural separates projecting innovation and uncompromising authority.",
  },
  {
    keywords: ["stage", "conference", "presentation", "speech", "panel", "talk"],
    momentId: "presentation",
    title: "Curated for Keynotes & Public Presence",
    recommendation: "The Presentation Edit",
    description: "Fluid flare tailoring and sculpted lines engineered to hold poise under stage lights.",
  },
  {
    keywords: ["dinner", "gala", "networking", "evening", "cocktail", "soiree", "night", "after hours"],
    momentId: "after-hours",
    title: "Curated for Evening Networking & Galas",
    recommendation: "After-Hours Executive",
    description: "Elevated evening silhouettes and sculpted vest separates that transition effortlessly after hours.",
  },
];

const MOMENT_PORTRAITS = {
  boardroom: { image: "/boardroom_women.webp", position: "object-[center_18%]" },
  founder: { image: "/founder_women.webp", position: "object-[center_24%]" },
  presentation: { image: "/presentation_woman.webp", position: "object-[center_40%]" },
  "after-hours": { image: "/after_hour_woman.webp", position: "object-[center_10%]" },
  essentials: { image: "/executive_woman.webp", position: "object-[center_8%]" },
};

export const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [momentResults, setMomentResults] = useState([]);
  const [categoryResults, setCategoryResults] = useState([]);
  const [curatedIntent, setCuratedIntent] = useState(null);

  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();

  // Lock background scroll & focus input when opened
  useEffect(() => {
    if (isOpen) {
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyOverflow = document.body.style.overflow;

      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";

      setTimeout(() => {
        inputRef.current?.focus();
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 100);

      return () => {
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.overflow = originalBodyOverflow;
      };
    } else {
      setQuery("");
      setProductResults([]);
      setMomentResults([]);
      setCategoryResults([]);
      setCuratedIntent(null);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Live Predictive Search
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setProductResults([]);
      setMomentResults([]);
      setCategoryResults([]);
      setCuratedIntent(null);
      return;
    }

    const timer = setTimeout(() => {
      // 1. Match Products
      const matchedProducts = PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q) ||
          p.tagline?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.styleNotes?.toLowerCase().includes(q)
      ).slice(0, 8);

      // 2. Match Categories / Collections
      const matchedCategories = CATEGORIES.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.tagline.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q)
      );

      // 3. Match Moments
      const matchedMoments = MOMENTS.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.tagline.toLowerCase().includes(q) ||
          m.subtitle.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );

      // 4. Match Stylist Intent
      const matchedIntent = INTENT_MAPPINGS.find((item) =>
        item.keywords.some((k) => q.includes(k))
      );

      setProductResults(matchedProducts);
      setCategoryResults(matchedCategories);
      setMomentResults(matchedMoments);
      setCuratedIntent(matchedIntent || null);
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url) => {
    onClose();
    navigate(url);
  };

  if (!isOpen) return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={scrollContainerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[99999] bg-[#FAF8F5] text-[#121215] h-screen w-screen overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* 1. Sticky Top Minimal Editorial Header */}
          <div className="sticky top-0 z-30 bg-[#FAF8F5]/98 backdrop-blur-md border-b border-[#121215]/[0.08] px-6 sm:px-12 lg:px-20 py-4 sm:py-5 flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <span className="text-[10px] uppercase tracking-[0.30em] font-light text-[#8C827A] select-none">
              SEARCH SUKO
            </span>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-[#121215] hover:opacity-50 transition-opacity flex items-center gap-2 group select-none cursor-pointer"
              aria-label="Close Search"
            >
              <span className="text-[10.5px] uppercase tracking-[0.20em] font-light hidden sm:inline-block text-[#8C827A] group-hover:text-[#121215]">
                CLOSE (ESC)
              </span>
              <X size={20} strokeWidth={1.1} />
            </button>
          </div>

          {/* 2. Main Search Body */}
          <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-12 lg:px-16 pt-8 sm:pt-14 pb-36">
            
            {/* Minimal Large Editorial Search Input */}
            <div className="relative border-b border-[#121215]/20 focus-within:border-[#121215] transition-colors pb-3 sm:pb-4 flex items-center justify-between">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, collections, moments..."
                className="w-full bg-transparent border-none outline-none text-2xl sm:text-4xl lg:text-5xl font-light font-display text-[#121215] placeholder-[#8C827A]/40 tracking-tight pr-10"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-[11px] uppercase tracking-[0.18em] text-[#8C827A] hover:text-[#121215] transition-colors px-2 py-1 select-none cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* 3. Dynamic Content */}
            {query.trim() === "" ? (
              /* --- INITIAL STATE: Popular Search Links & 5 Moments Showcase --- */
              <div className="mt-12 sm:mt-16 flex flex-col gap-14 sm:gap-20">
                
                {/* A. Popular Searches (Simple Text Links + Subtle Hover Underline) */}
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.28em] text-[#8C827A] font-light mb-5">
                    Popular Searches
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-8 sm:gap-x-10 gap-y-3.5 sm:gap-y-4">
                    {POPULAR_SEARCHES.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelect(item.link)}
                        className="group relative py-1 text-[12.5px] sm:text-[13.5px] uppercase tracking-[0.18em] font-light text-[#121215] transition-opacity hover:opacity-75 text-left cursor-pointer"
                      >
                        <span>{item.label}</span>
                        <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#121215] transition-all duration-300 group-hover:w-full" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* B. Curated Professional Moments Showcase (5 Moments, Large Images, Zero Card Boxes) */}
                <div>
                  <div className="flex items-center justify-between mb-6 sm:mb-8 border-b border-[#121215]/[0.08] pb-3">
                    <h3 className="text-[10px] uppercase tracking-[0.28em] text-[#8C827A] font-light">
                      Curated Professional Moments
                    </h3>
                    <Link
                      to="/shop-by-moment"
                      onClick={onClose}
                      className="text-[10.5px] uppercase tracking-[0.20em] font-light text-[#121215] hover:opacity-60 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Explore All Moments</span>
                      <ArrowRight size={11} />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-7">
                    {MOMENTS.map((moment) => {
                      const portrait = MOMENT_PORTRAITS[moment.id] || { image: moment.image, position: "object-center" };
                      return (
                        <div
                          key={moment.id}
                          onClick={() => handleSelect(`/shop-by-moment?moment=${moment.id}`)}
                          className="group cursor-pointer flex flex-col"
                        >
                          {/* High-Fashion Editorial Imagery */}
                          <div className="aspect-[3/4] overflow-hidden bg-[#F3EFE6] relative">
                            <img
                              src={portrait.image}
                              alt={moment.title}
                              className={`w-full h-full object-cover ${portrait.position} group-hover:scale-[1.04] transition-transform duration-700 ease-out`}
                            />
                          </div>
                          {/* Minimal Editorial Typography */}
                          <h4 className="text-[13px] sm:text-[14px] font-normal tracking-wide text-[#121215] mt-3 mb-0.5 group-hover:underline underline-offset-4">
                            {moment.title}
                          </h4>
                          <p className="text-[11px] text-[#6E6E75] font-light">
                            {moment.tagline}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              /* --- LIVE SEARCH RESULTS (Hierarchy: Products -> Collections -> Moments -> Stylist Intent) --- */
              <div className="mt-10 sm:mt-14 flex flex-col gap-14">
                
                {/* 1. Stylist Curated Intent Banner (e.g. for 'investor meeting', 'keynote', 'gala') */}
                {curatedIntent && (
                  <div
                    onClick={() => handleSelect(`/shop-by-moment?moment=${curatedIntent.momentId}`)}
                    className="p-5 sm:p-6 bg-white border border-[#121215]/20 hover:border-[#121215] transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="p-2 bg-[#FAF8F5] border border-[#EAE6DF] mt-0.5">
                        <Sparkles size={15} className="text-[#121215]" />
                      </div>
                      <div>
                        <span className="text-[9.5px] uppercase tracking-[0.24em] text-[#8C827A] font-light block mb-1">
                          {curatedIntent.title}
                        </span>
                        <h4 className="text-[15px] font-medium text-[#121215] group-hover:underline underline-offset-4">
                          Recommended: {curatedIntent.recommendation}
                        </h4>
                        <p className="text-[12px] text-[#6E6E75] font-light mt-1">
                          {curatedIntent.description}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] uppercase tracking-[0.20em] font-medium text-[#121215] flex items-center gap-1.5 self-end sm:self-center">
                      <span>Explore Moment</span>
                      <ArrowRight size={12} />
                    </span>
                  </div>
                )}

                {/* 2. Priority 1: Products / Garments */}
                {productResults.length > 0 && (
                  <div>
                    <h3 className="text-[10px] uppercase tracking-[0.28em] text-[#8C827A] font-light mb-6 border-b border-[#121215]/[0.08] pb-2.5">
                      Products ({productResults.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                      {productResults.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => handleSelect(`/product/${product.slug}`)}
                          className="cursor-pointer group flex flex-col"
                        >
                          <div className="aspect-[3/4] overflow-hidden bg-[#F3EFE6] relative mb-3">
                            <img
                              src={getCardImage(product.images[0])}
                              alt={product.name}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                if (e.currentTarget.src !== product.images[0]) {
                                  e.currentTarget.src = product.images[0];
                                }
                              }}
                              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                            />
                          </div>
                          <span className="text-[9.5px] uppercase tracking-[0.20em] font-light text-[#8C827A] mb-1">
                            {product.category}
                          </span>
                          <h4 className="text-[13.5px] font-normal text-[#121215] group-hover:underline underline-offset-4 mb-1">
                            {product.name}
                          </h4>
                          <span className="text-[12.5px] font-light text-[#121215]">
                            {formatINR(product.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Priority 2: Collections & Categories */}
                {categoryResults.length > 0 && (
                  <div>
                    <h3 className="text-[10px] uppercase tracking-[0.28em] text-[#8C827A] font-light mb-4 border-b border-[#121215]/[0.08] pb-2.5">
                      Collections &amp; Categories
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                      {categoryResults.map((cat) => (
                        <button
                          key={cat.slug}
                          onClick={() => handleSelect(`/collection?category=${cat.slug}`)}
                          className="group relative py-1 text-[12.5px] uppercase tracking-[0.18em] font-light text-[#121215] hover:opacity-75 transition-opacity cursor-pointer"
                        >
                          <span>{cat.name}</span>
                          <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#121215] transition-all duration-300 group-hover:w-full" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Priority 3: Professional Moments */}
                {momentResults.length > 0 && (
                  <div>
                    <h3 className="text-[10px] uppercase tracking-[0.28em] text-[#8C827A] font-light mb-6 border-b border-[#121215]/[0.08] pb-2.5">
                      Professional Moments ({momentResults.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-7">
                      {momentResults.map((m) => {
                        const portrait = MOMENT_PORTRAITS[m.id] || { image: m.image, position: "object-center" };
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleSelect(`/shop-by-moment?moment=${m.id}`)}
                            className="cursor-pointer group flex flex-col"
                          >
                            <div className="aspect-[3/4] overflow-hidden bg-[#F3EFE6] relative mb-3">
                              <img
                                src={portrait.image}
                                alt={m.title}
                                className={`w-full h-full object-cover ${portrait.position} group-hover:scale-[1.04] transition-transform duration-700 ease-out`}
                              />
                            </div>
                            <h4 className="text-[13px] font-normal text-[#121215] group-hover:underline underline-offset-4 mb-0.5">
                              {m.title}
                            </h4>
                            <p className="text-[11px] text-[#6E6E75] font-light">
                              {m.tagline}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty Results Fallback */}
                {productResults.length === 0 &&
                  momentResults.length === 0 &&
                  categoryResults.length === 0 && (
                    <div className="text-center py-20">
                      <p className="text-[15px] font-light text-[#6E6E75] mb-4">
                        No results found for &ldquo;{query}&rdquo;.
                      </p>
                      <p className="text-[12px] text-[#8C827A] font-light">
                        Try searching for <span className="text-[#121215] underline cursor-pointer" onClick={() => setQuery("Boardroom")}>Boardroom</span>, <span className="text-[#121215] underline cursor-pointer" onClick={() => setQuery("Blazer")}>Blazer</span>, <span className="text-[#121215] underline cursor-pointer" onClick={() => setQuery("Founder")}>Founder</span>, or <span className="text-[#121215] underline cursor-pointer" onClick={() => setQuery("Suit")}>Suit</span>.
                      </p>
                    </div>
                  )}

              </div>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};

export default SearchModal;
