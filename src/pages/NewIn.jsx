import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, X, SlidersHorizontal, Check } from "lucide-react";
import { useLenis } from "lenis/react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductContext";
import { CATEGORIES, SIZES, COLOURS, PRODUCTS as FALLBACK_PRODUCTS } from "../data/products";

const NewIn = () => {
  const lenis = useLenis();
  const [searchParams, setSearchParams] = useSearchParams();
  const genderParam = searchParams.get("gender") || "women";
  const categoryParam = searchParams.get("category") || "all";

  const { products: storeProducts, loading } = useProducts();
  const productsList = storeProducts && storeProducts.length > 0 ? storeProducts : FALLBACK_PRODUCTS;

  // Active Filter States
  const [selectedGender, setSelectedGender] = useState(genderParam.toLowerCase());
  const [selectedCategory, setSelectedCategory] = useState(categoryParam.toLowerCase());
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedColour, setSelectedColour] = useState("all");
  const [selectedSort, setSelectedSort] = useState("newest");

  // Dropdown UI Open States
  const [openDropdown, setOpenDropdown] = useState(null); // 'category' | 'size' | 'colour' | 'sort' | null

  // Pagination / Load More (Display initial 16 items: 8 before editorial break, 8 after)
  const [visibleCount, setVisibleCount] = useState(16);

  // Synchronize state with URL search params if changed externally
  useEffect(() => {
    if (genderParam) {
      setSelectedGender(genderParam.toLowerCase());
    }
  }, [genderParam]);

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam.toLowerCase());
    }
  }, [categoryParam]);

  // Gender Switch Handler
  const handleGenderChange = (gender) => {
    setSelectedGender(gender);
    setSelectedCategory("all");
    setSelectedSize("all");
    setSelectedColour("all");
    setVisibleCount(16);
    setSearchParams({ gender });
  };

  // Scroll listener for sticky filter bar behavior (top-0 on scroll UP, top-[66px]/[70px] on scroll DOWN)
  const [isScrolledPastBar, setIsScrolledPastBar] = useState(false);
  const [scrollDirection, setScrollDirection] = useState("down");
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolledPastBar(currentScrollY > 180);

      if (currentScrollY > lastScrollY.current + 4) {
        setScrollDirection("down");
      } else if (currentScrollY < lastScrollY.current - 4) {
        setScrollDirection("up");
      }

      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".filter-dropdown-container")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let list = productsList.filter((p) => {
      // Gender Filter
      const targetGender = (selectedGender === "women" || selectedGender === "female") ? "female" : "male";
      if (p.gender !== targetGender) return false;

      // Category Filter
      if (selectedCategory !== "all") {
        const cat = (p.category || "").toLowerCase();
        const catName = (p.categoryName || "").toLowerCase();
        const selCat = selectedCategory.toLowerCase();
        if (selCat === "suits") {
          const isSuit = cat.includes("suit") || cat.includes("set") || cat.includes("peplum") || cat.includes("tuxedo") ||
                         catName.includes("suit") || catName.includes("set") || catName.includes("peplum") || catName.includes("tuxedo");
          if (!isSuit) return false;
        } else if (selCat === "trousers") {
          const isTrouser = cat.includes("trouser") || cat.includes("pant") || catName.includes("trouser") || catName.includes("pant");
          if (!isTrouser) return false;
        } else if (selCat === "blazers") {
          const isBlazer = cat.includes("blazer") || cat.includes("jacket") || catName.includes("blazer") || catName.includes("jacket");
          if (!isBlazer) return false;
        } else if (selCat === "shirts") {
          const isShirt = cat.includes("shirt") || cat.includes("top") || catName.includes("shirt") || catName.includes("top");
          if (!isShirt) return false;
        } else if (cat !== selCat && !cat.includes(selCat) && !catName.includes(selCat)) {
          return false;
        }
      }

      // Size Filter
      if (selectedSize !== "all" && p.sizes && !p.sizes.includes(selectedSize)) {
        return false;
      }

      // Colour Filter
      if (selectedColour !== "all") {
        const prodColor = (p.color || "").toLowerCase();
        if (!prodColor.includes(selectedColour.toLowerCase())) return false;
      }

      return true;
    });

    // Sorting
    if (selectedSort === "price-low") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (selectedSort === "price-high") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else {
      // Newest default
      list = [...list].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return list;
  }, [productsList, selectedGender, selectedCategory, selectedSize, selectedColour, selectedSort]);

  // Sliced items for display
  const displayedItems = filteredProducts.slice(0, visibleCount);

  // Group displayed items into 5-item asymmetric editorial blocks (1 Large Feature + 4 Standard)
  const editorialBlocks = useMemo(() => {
    const blocks = [];
    for (let i = 0; i < displayedItems.length; i += 5) {
      const chunk = displayedItems.slice(i, i + 5);
      const isEvenBlock = (blocks.length % 2 === 0);
      blocks.push({
        id: `editorial-block-${i}`,
        type: isEvenBlock ? "left-feature" : "right-feature",
        featureProduct: chunk[0],
        smallProducts: chunk.slice(1),
        allProducts: chunk,
        startIndex: i
      });
    }
    return blocks;
  }, [displayedItems]);

  const hasActiveFilters = selectedCategory !== "all" || selectedSize !== "all" || selectedColour !== "all";

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedSize("all");
    setSelectedColour("all");
    setSelectedSort("newest");
    setOpenDropdown(null);
  };

  // Recently Viewed fallback items
  const recentlyViewed = useMemo(() => {
    return productsList
      .filter((p) => {
        const targetGender = (selectedGender === "women" || selectedGender === "female") ? "female" : "male";
        return p.gender === targetGender;
      })
      .slice(0, 4);
  }, [productsList, selectedGender]);

  // Mobile Drawer States
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  // Lock background body and smooth Lenis scroll when mobile filter/sort drawers are open
  useEffect(() => {
    if (mobileFilterOpen || mobileSortOpen) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.body.style.overflow = "";
    }
    return () => {
      lenis?.start();
      document.body.style.overflow = "";
    };
  }, [mobileFilterOpen, mobileSortOpen, lenis]);

  // Active filter count
  const activeFilterCount = (selectedCategory !== "all" ? 1 : 0) + (selectedSize !== "all" ? 1 : 0) + (selectedColour !== "all" ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-transparent text-[#111113] dark:text-[#F6F6F0] font-body transition-colors duration-300">
      
      {/* =========================================================================
          1. SLIM EDITORIAL PAGE HEADER (Product-First Luxury Hierarchy)
          ========================================================================= */}
      <section className="pt-24 sm:pt-32 lg:pt-36 pb-3 sm:pb-6 px-5 sm:px-6 lg:px-[3.5vw]">
        <div className="max-w-[1680px] mx-auto">
          
          {/* Breadcrumb: HOME / NEW IN */}
          <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] sm:text-[10.5px] uppercase tracking-[0.26em] text-[#706E68] dark:text-white/60 mb-2.5 sm:mb-3 font-medium">
            <Link to="/" className="hover:text-[#111113] dark:hover:text-white transition-colors">HOME</Link>
            <span>/</span>
            <span className="text-[#111113] dark:text-white font-medium">
              NEW IN
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-6">
            <div className="text-center md:text-left w-full md:w-auto">
              <h1 className="font-quiche text-3xl sm:text-5xl lg:text-[3.5rem] font-light tracking-tight text-[#111113] dark:text-white leading-[1.06] mb-1.5 sm:mb-2">
                New Arrivals
              </h1>
              
              <p className="text-xs sm:text-[13.5px] font-normal text-[#55555C] dark:text-white/70 max-w-md mx-auto md:mx-0 leading-relaxed">
                Sculpted silhouettes, sharp tailoring and modern executive wear.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          2. STICKY FILTER + SORT BAR
          ========================================================================= */}
      <section
        id="plp-filter-bar"
        className={`sticky z-40 bg-[#FAF8F5]/95 dark:bg-[#0A0A0C]/95 backdrop-blur-md border-y border-[#E8E4DC] dark:border-white/10 shadow-sm transition-all duration-300 ${
          scrollDirection === "down"
            ? "top-0 py-3 sm:py-3.5"
            : "top-[66px] lg:top-[70px] py-3.5 sm:py-4"
        }`}
      >
        <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-14 xl:px-16">
          
          {/* --- MOBILE VIEW (< md) --- */}
          <div className="md:hidden">
            {!isScrolledPastBar && (
              <div className="text-[10px] tracking-[0.22em] text-[#888890] dark:text-white/50 uppercase mb-2.5 font-light text-center">
                {filteredProducts.length} PIECES
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 border text-[10.5px] uppercase tracking-[0.22em] transition-colors ${
                  activeFilterCount > 0
                    ? "border-[#C2922E] text-[#C2922E] bg-[#C2922E]/5 font-medium"
                    : "border-[#E2DDD5] dark:border-white/15 text-[#111113] dark:text-white/90 bg-white/40 dark:bg-white/5"
                }`}
              >
                <SlidersHorizontal size={12} />
                <span>FILTERS {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileSortOpen(true)}
                className="flex items-center justify-center gap-2 py-2.5 px-4 border border-[#E2DDD5] dark:border-white/15 text-[10.5px] uppercase tracking-[0.22em] text-[#111113] dark:text-white/90 bg-white/40 dark:bg-white/5 transition-colors"
              >
                <span>SORT</span>
                <ChevronDown size={12} />
              </button>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2.5">
                {selectedCategory !== "all" && (
                  <span
                    onClick={() => setSelectedCategory("all")}
                    className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-2 py-1 bg-black/5 dark:bg-white/10 rounded-sm text-[#111113] dark:text-white cursor-pointer"
                  >
                    {selectedCategory} <X size={10} />
                  </span>
                )}
                {selectedSize !== "all" && (
                  <span
                    onClick={() => setSelectedSize("all")}
                    className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-2 py-1 bg-black/5 dark:bg-white/10 rounded-sm text-[#111113] dark:text-white cursor-pointer"
                  >
                    SIZE {selectedSize} <X size={10} />
                  </span>
                )}
                {selectedColour !== "all" && (
                  <span
                    onClick={() => setSelectedColour("all")}
                    className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-2 py-1 bg-black/5 dark:bg-white/10 rounded-sm text-[#111113] dark:text-white cursor-pointer"
                  >
                    {selectedColour} <X size={10} />
                  </span>
                )}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-[9px] uppercase tracking-widest text-[#C2922E] font-medium ml-1 underline"
                >
                  CLEAR ALL
                </button>
              </div>
            )}
          </div>

          {/* --- DESKTOP VIEW (>= md) --- */}
          <div className="hidden md:flex flex-wrap items-center justify-between gap-y-3 gap-x-6 text-[11px] uppercase tracking-[0.22em]">
            <div className="flex flex-wrap items-center gap-6 sm:gap-8 filter-dropdown-container">
              {!isScrolledPastBar && (
                <>
                  <span className="font-light text-[#888890] dark:text-white/50 shrink-0 tracking-widest text-[10.5px]">
                    {filteredProducts.length} PIECES
                  </span>
                  <span className="hidden sm:inline text-[#D8D4CC] dark:text-white/15">|</span>
                </>
              )}

              {/* CATEGORY DROPDOWN */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "category" ? null : "category")}
                  className={`flex items-center gap-1.5 transition-colors ${
                    selectedCategory !== "all"
                      ? "text-[#C2922E] font-semibold"
                      : "text-[#55555C] dark:text-white/70 hover:text-[#111113] dark:hover:text-white font-normal"
                  }`}
                >
                  <span>CATEGORY {selectedCategory !== "all" && `(${selectedCategory})`}</span>
                  <ChevronDown size={12} className={`transition-transform ${openDropdown === "category" ? "rotate-180" : ""}`} />
                </button>

                {openDropdown === "category" && (
                  <div className="absolute top-full left-0 mt-3 w-60 bg-[#FAF8F5] dark:bg-[#121216] border border-[#E2DDD5] dark:border-white/10 shadow-lg py-2 z-50">
                    <div className="px-1.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => { setSelectedCategory("all"); setOpenDropdown(null); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors shrink-0 ${
                          selectedCategory === "all"
                            ? "border-[#111113] bg-[#111113] text-white dark:border-[#C2922E] dark:bg-[#C2922E] dark:text-black"
                            : "border-[#888890] dark:border-white/30 bg-transparent group-hover:border-[#111113]"
                        }`}>
                          {selectedCategory === "all" && <Check size={10} strokeWidth={2.5} />}
                        </div>
                        <span className={`text-[10.5px] uppercase tracking-[0.16em] ${
                          selectedCategory === "all" ? "text-[#111113] dark:text-white font-medium" : "text-[#55555C] dark:text-white/70"
                        }`}>
                          All Categories
                        </span>
                      </button>
                      {CATEGORIES.map((cat) => {
                        const active = selectedCategory === cat.slug;
                        return (
                          <button
                            key={cat.slug}
                            type="button"
                            onClick={() => { setSelectedCategory(cat.slug); setOpenDropdown(null); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          >
                            <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors shrink-0 ${
                              active
                                ? "border-[#111113] bg-[#111113] text-white dark:border-[#C2922E] dark:bg-[#C2922E] dark:text-black"
                                : "border-[#888890] dark:border-white/30 bg-transparent group-hover:border-[#111113]"
                            }`}>
                              {active && <Check size={10} strokeWidth={2.5} />}
                            </div>
                            <span className={`text-[10.5px] uppercase tracking-[0.16em] ${
                              active ? "text-[#111113] dark:text-white font-medium" : "text-[#55555C] dark:text-white/70"
                            }`}>
                              {cat.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* SIZE DROPDOWN */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "size" ? null : "size")}
                  className={`flex items-center gap-1.5 transition-colors ${
                    selectedSize !== "all"
                      ? "text-[#C2922E] font-semibold"
                      : "text-[#55555C] dark:text-white/70 hover:text-[#111113] dark:hover:text-white font-normal"
                  }`}
                >
                  <span>SIZE {selectedSize !== "all" && `(${selectedSize})`}</span>
                  <ChevronDown size={12} className={`transition-transform ${openDropdown === "size" ? "rotate-180" : ""}`} />
                </button>

                {openDropdown === "size" && (
                  <div className="absolute top-full left-0 mt-3 w-52 bg-[#FAF8F5] dark:bg-[#121216] border border-[#E2DDD5] dark:border-white/10 shadow-lg py-2 z-50">
                    <div className="px-1.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => { setSelectedSize("all"); setOpenDropdown(null); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors shrink-0 ${
                          selectedSize === "all"
                            ? "border-[#111113] bg-[#111113] text-white dark:border-[#C2922E] dark:bg-[#C2922E] dark:text-black"
                            : "border-[#888890] dark:border-white/30 bg-transparent group-hover:border-[#111113]"
                        }`}>
                          {selectedSize === "all" && <Check size={10} strokeWidth={2.5} />}
                        </div>
                        <span className={`text-[10.5px] uppercase tracking-[0.16em] ${
                          selectedSize === "all" ? "text-[#111113] dark:text-white font-medium" : "text-[#55555C] dark:text-white/70"
                        }`}>
                          All Sizes
                        </span>
                      </button>
                      {SIZES.map((sz) => {
                        const active = selectedSize === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => { setSelectedSize(sz); setOpenDropdown(null); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          >
                            <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors shrink-0 ${
                              active
                                ? "border-[#111113] bg-[#111113] text-white dark:border-[#C2922E] dark:bg-[#C2922E] dark:text-black"
                                : "border-[#888890] dark:border-white/30 bg-transparent group-hover:border-[#111113]"
                            }`}>
                              {active && <Check size={10} strokeWidth={2.5} />}
                            </div>
                            <span className={`text-[10.5px] uppercase tracking-[0.16em] ${
                              active ? "text-[#111113] dark:text-white font-medium" : "text-[#55555C] dark:text-white/70"
                            }`}>
                              {sz}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* COLOUR DROPDOWN */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(openDropdown === "colour" ? null : "colour")}
                  className={`flex items-center gap-1.5 transition-colors ${
                    selectedColour !== "all"
                      ? "text-[#C2922E] font-semibold"
                      : "text-[#55555C] dark:text-white/70 hover:text-[#111113] dark:hover:text-white font-normal"
                  }`}
                >
                  <span>COLOUR {selectedColour !== "all" && `(${selectedColour})`}</span>
                  <ChevronDown size={12} className={`transition-transform ${openDropdown === "colour" ? "rotate-180" : ""}`} />
                </button>

                {openDropdown === "colour" && (
                  <div className="absolute top-full left-0 mt-3 w-56 bg-[#FAF8F5] dark:bg-[#121216] border border-[#E2DDD5] dark:border-white/10 shadow-lg py-2 z-50">
                    <div className="px-1.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => { setSelectedColour("all"); setOpenDropdown(null); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors shrink-0 ${
                          selectedColour === "all"
                            ? "border-[#111113] bg-[#111113] text-white dark:border-[#C2922E] dark:bg-[#C2922E] dark:text-black"
                            : "border-[#888890] dark:border-white/30 bg-transparent group-hover:border-[#111113]"
                        }`}>
                          {selectedColour === "all" && <Check size={10} strokeWidth={2.5} />}
                        </div>
                        <span className={`text-[10.5px] uppercase tracking-[0.16em] ${
                          selectedColour === "all" ? "text-[#111113] dark:text-white font-medium" : "text-[#55555C] dark:text-white/70"
                        }`}>
                          All Colours
                        </span>
                      </button>
                      {COLOURS.map((col) => {
                        const active = selectedColour === col.name;
                        return (
                          <button
                            key={col.name}
                            type="button"
                            onClick={() => { setSelectedColour(col.name); setOpenDropdown(null); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          >
                            <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors shrink-0 ${
                              active
                                ? "border-[#111113] bg-[#111113] text-white dark:border-[#C2922E] dark:bg-[#C2922E] dark:text-black"
                                : "border-[#888890] dark:border-white/30 bg-transparent group-hover:border-[#111113]"
                            }`}>
                              {active && <Check size={10} strokeWidth={2.5} />}
                            </div>
                            <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: col.hex }} />
                            <span className={`text-[10.5px] uppercase tracking-[0.16em] truncate ${
                              active ? "text-[#111113] dark:text-white font-medium" : "text-[#55555C] dark:text-white/70"
                            }`}>
                              {col.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 text-[10px] text-[#C2922E] hover:underline"
                >
                  <span>RESET</span>
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Right: SORT BY DROPDOWN */}
            <div className="relative filter-dropdown-container">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
                className="flex items-center gap-1.5 text-[#55555C] dark:text-white/70 hover:text-[#111113] dark:hover:text-white font-medium transition-colors"
              >
                <span className="text-[#88888E] dark:text-white/40">SORT BY:</span>
                <span className="text-[#111113] dark:text-white">
                  {selectedSort === "price-low" ? "PRICE: LOW TO HIGH" : selectedSort === "price-high" ? "PRICE: HIGH TO LOW" : "NEWEST"}
                </span>
                <ChevronDown size={12} className={`transition-transform ${openDropdown === "sort" ? "rotate-180" : ""}`} />
              </button>

              {openDropdown === "sort" && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-[#FAF8F5] dark:bg-[#121216] border border-[#E2DDD5] dark:border-white/10 shadow-lg py-2 z-50">
                  <div className="px-1.5 space-y-0.5">
                    {[
                      { value: "newest", label: "Newest" },
                      { value: "price-low", label: "Price: Low to High" },
                      { value: "price-high", label: "Price: High to Low" },
                    ].map((sortOpt) => {
                      const active = selectedSort === sortOpt.value;
                      return (
                        <button
                          key={sortOpt.value}
                          type="button"
                          onClick={() => { setSelectedSort(sortOpt.value); setOpenDropdown(null); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left group hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-colors shrink-0 ${
                            active
                              ? "border-[#111113] bg-[#111113] text-white dark:border-[#C2922E] dark:bg-[#C2922E] dark:text-black"
                              : "border-[#888890] dark:border-white/30 bg-transparent group-hover:border-[#111113]"
                          }`}>
                            {active && <Check size={10} strokeWidth={2.5} />}
                          </div>
                          <span className={`text-[10.5px] uppercase tracking-[0.16em] ${
                            active ? "text-[#111113] dark:text-white font-medium" : "text-[#55555C] dark:text-white/70"
                          }`}>
                            {sortOpt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          3. PRODUCT GRID (Asymmetric Luxury Editorial Blocks - 1 Large + 4 Small)
          ========================================================================= */}
      <section className="pt-6 sm:pt-10 lg:pt-12 pb-12 sm:pb-16 px-3.5 sm:px-6 lg:px-[3.5vw]">
        <div className="max-w-[1680px] mx-auto">
          
          {displayedItems.length > 0 ? (
            <div className="space-y-10 sm:space-y-14 lg:space-y-16">
              <AnimatePresence mode="popLayout">
                {editorialBlocks.map((block) => {
                  // Asymmetric Editorial Block (1 Large Feature Card + 1 to 4 Small Cards)
                  if (block.allProducts.length >= 2) {
                    if (block.type === "left-feature") {
                      return (
                        <div
                          key={block.id}
                          className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-7 items-stretch"
                        >
                          {/* Left (50% / 2 cols): Large Featured Editorial Card */}
                          <div className="lg:col-span-6 h-full flex flex-col">
                            <ProductCard
                              product={block.featureProduct}
                              index={block.startIndex}
                              isFeatured={true}
                              className="h-full"
                            />
                          </div>

                          {/* Right (50% / 2 cols): Small Cards in 2-Column Grid */}
                          <div className="lg:col-span-6 grid grid-cols-2 gap-x-3.5 sm:gap-x-5 lg:gap-x-6 gap-y-6 sm:gap-y-8">
                            {block.smallProducts.map((p, idx) => (
                              <ProductCard
                                key={p.id || idx}
                                product={p}
                                index={block.startIndex + 1 + idx}
                                isFeatured={false}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    } else {
                      // Alternating: Small Cards Left (2-Column) + 1 Large Feature Card Right
                      return (
                        <div
                          key={block.id}
                          className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 lg:gap-7 items-stretch"
                        >
                          {/* Left: Small Cards in 2-Column Grid */}
                          <div className="lg:col-span-6 grid grid-cols-2 gap-x-3.5 sm:gap-x-5 lg:gap-x-6 gap-y-6 sm:gap-y-8 order-2 lg:order-1">
                            {block.smallProducts.map((p, idx) => (
                              <ProductCard
                                key={p.id || idx}
                                product={p}
                                index={block.startIndex + 1 + idx}
                                isFeatured={false}
                              />
                            ))}
                          </div>

                          {/* Right: Large Featured Editorial Card */}
                          <div className="lg:col-span-6 h-full flex flex-col order-1 lg:order-2">
                            <ProductCard
                              product={block.featureProduct}
                              index={block.startIndex}
                              isFeatured={true}
                              className="h-full"
                            />
                          </div>
                        </div>
                      );
                    }
                  }

                  // Single piece fallback (1 item)
                  return (
                    <div
                      key={block.id}
                      className="max-w-md mx-auto"
                    >
                      {block.allProducts.map((p, idx) => (
                        <ProductCard
                          key={p.id || idx}
                          product={p}
                          index={block.startIndex + idx}
                          isFeatured={false}
                        />
                      ))}
                    </div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-24 text-[#706E68] dark:text-white/50">
              <p className="font-quiche text-2xl font-light mb-2">No matching pieces found</p>
              <p className="text-xs uppercase tracking-[0.2em] mb-6">Try clearing filters to explore our full edit</p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[11px] uppercase tracking-[0.22em] font-medium pb-1 border-b border-[#111113] dark:border-white text-[#111113] dark:text-white hover:text-[#C2922E] transition-colors"
              >
                RESET ALL FILTERS
              </button>
            </div>
          )}

        </div>
      </section>

      {/* =========================================================================
          4. LOAD MORE BUTTON
          ========================================================================= */}
      {visibleCount < filteredProducts.length && (
        <section className="pb-16 sm:pb-20 text-center px-6">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 16)}
            className="group inline-flex items-center gap-2 text-[11.5px] uppercase tracking-[0.25em] font-normal text-[#111113] dark:text-white hover:text-[#C2922E] dark:hover:text-[#C2922E] transition-all duration-300"
          >
            <span className="border-b border-[#111113] dark:border-white group-hover:border-[#C2922E] pb-1 transition-all duration-300">
              LOAD MORE PIECES &mdash; {Math.min(visibleCount, filteredProducts.length)} OF {filteredProducts.length}
            </span>
            <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </section>
      )}

      {/* =========================================================================
          5. RECENTLY VIEWED SECTION
          ========================================================================= */}
      {recentlyViewed.length > 0 && (
        <section className="border-t border-[#E8E4DC] dark:border-white/10 pt-12 sm:pt-14 pb-16 sm:pb-20 px-6 lg:px-[3.5vw] bg-[#F7F5F0] dark:bg-[#0A0A0C]/60 transition-colors duration-300">
          <div className="max-w-[1680px] mx-auto">
            
            <div className="flex items-center justify-between mb-8 sm:mb-10">
              <div>
                <span className="text-[10px] uppercase tracking-[0.32em] text-[#706E68] dark:text-white/60 font-medium block mb-1.5">
                  CONSIDERED CURATION
                </span>
                <h3 className="font-quiche text-2xl sm:text-3xl font-light text-[#111113] dark:text-white">
                  Recently Viewed
                </h3>
              </div>
              <Link
                to="/new-in"
                className="hidden sm:inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.22em] text-[#111113] dark:text-white hover:text-[#C2922E] transition-colors"
              >
                <span className="border-b border-current pb-0.5">VIEW ALL</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-7">
              {recentlyViewed.map((product, idx) => (
                <ProductCard key={`recent-${product.id || idx}`} product={product} index={idx} />
              ))}
            </div>

          </div>
        </section>
      )}

      {/* =========================================================================
          6. SERVICE STRIP
          ========================================================================= */}
      <section className="bg-[#F6F2EA] dark:bg-[#0A0A0C] py-3 sm:py-3.5 px-6 lg:px-12 border-y border-[#E2DDD5] dark:border-white/10 transition-colors duration-300">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-center sm:justify-between gap-y-2.5 gap-x-6 sm:gap-x-8 text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.22em] text-[#222227] dark:text-white/80 font-normal">
          <span>COMPLIMENTARY SHIPPING</span>
          <span className="hidden sm:inline text-[#D8D4CC]/70 dark:text-white/25">&bull;</span>
          <span>EASY EXCHANGES</span>
          <span className="hidden sm:inline text-[#D8D4CC]/70 dark:text-white/25">&bull;</span>
          <span>SECURE CHECKOUT</span>
          <span className="hidden sm:inline text-[#D8D4CC]/70 dark:text-white/25">&bull;</span>
          <span>CUSTOMER ASSISTANCE</span>
        </div>
      </section>

      {/* =========================================================================
          9. MOBILE FILTER SIDE DRAWER
          ========================================================================= */}
      {createPortal(
        <AnimatePresence>
          {mobileFilterOpen && (
            <div 
              data-lenis-prevent="true"
              data-lenis-prevent-touch="true"
              className="fixed inset-0 z-[9999] md:hidden flex justify-end"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileFilterOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="relative z-[10000] w-[88vw] max-w-[360px] h-[100dvh] bg-[#FAF8F5] dark:bg-[#121216] border-l border-[#E2DDD5] dark:border-white/15 flex flex-col shadow-2xl overflow-hidden font-body"
                data-lenis-prevent="true"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2DDD5] dark:border-white/10 shrink-0 bg-[#FAF8F5] dark:bg-[#121216]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[12px] uppercase tracking-[0.25em] font-semibold text-[#111113] dark:text-white">
                      FILTERS
                    </h3>
                    {activeFilterCount > 0 && (
                      <span className="text-[9.5px] bg-[#C2922E] text-white px-1.5 py-0.2 rounded-full font-medium">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 text-[#111113] dark:text-white hover:text-[#C2922E] transition-colors"
                    aria-label="Close Filters"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div 
                  data-lenis-prevent="true"
                  data-lenis-prevent-touch="true"
                  className="overflow-y-auto overscroll-contain px-6 py-5 flex-1 divide-y divide-[#EAE6DE] dark:divide-white/10"
                  style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
                >
                  {/* Category */}
                  <div className="pb-6">
                    <h4 className="text-[10.5px] uppercase tracking-[0.24em] font-semibold text-[#111113] dark:text-white mb-3.5">
                      CATEGORY
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("all")}
                        className="flex items-center gap-2.5 py-1 text-left group"
                      >
                        <div className={`w-4 h-4 border flex items-center justify-center transition-colors shrink-0 ${
                          selectedCategory === "all"
                            ? "border-[#111113] bg-[#111113] text-white dark:border-[#C2922E] dark:bg-[#C2922E] dark:text-black"
                            : "border-[#888890] dark:border-white/30 bg-transparent group-hover:border-[#111113]"
                        }`}>
                          {selectedCategory === "all" && <Check size={11} strokeWidth={2.5} />}
                        </div>
                        <span className={`text-[11.5px] font-normal tracking-wide transition-colors ${
                          selectedCategory === "all" ? "text-[#111113] dark:text-white font-medium" : "text-[#44444C] dark:text-white/70"
                        }`}>
                          All Categories
                        </span>
                      </button>
                      {CATEGORIES.map((cat) => {
                        const active = selectedCategory === cat.slug;
                        return (
                          <button
                            key={cat.slug}
                            type="button"
                            onClick={() => setSelectedCategory(cat.slug)}
                            className="flex items-center gap-2.5 py-1 text-left group"
                          >
                            <div className={`w-4 h-4 border flex items-center justify-center transition-colors shrink-0 ${
                              active
                                ? "border-[#111113] bg-[#111113] text-white dark:border-[#C2922E] dark:bg-[#C2922E] dark:text-black"
                                : "border-[#888890] dark:border-white/30 bg-transparent group-hover:border-[#111113]"
                            }`}>
                              {active && <Check size={11} strokeWidth={2.5} />}
                            </div>
                            <span className={`text-[11.5px] font-normal tracking-wide transition-colors ${
                              active ? "text-[#111113] dark:text-white font-medium" : "text-[#44444C] dark:text-white/70"
                            }`}>
                              {cat.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Size */}
                  <div className="py-6">
                    <h4 className="text-[10.5px] uppercase tracking-[0.24em] font-semibold text-[#111113] dark:text-white mb-3.5">
                      SIZE
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedSize("all")}
                        className="flex items-center gap-2.5 py-1 text-left group"
                      >
                        <div className={`w-4 h-4 border flex items-center justify-center transition-colors shrink-0 ${
                          selectedSize === "all"
                            ? "border-[#111113] bg-[#111113] text-white dark:border-[#C2922E] dark:bg-[#C2922E] dark:text-black"
                            : "border-[#888890] dark:border-white/30 bg-transparent group-hover:border-[#111113]"
                        }`}>
                          {selectedSize === "all" && <Check size={11} strokeWidth={2.5} />}
                        </div>
                        <span className={`text-[11.5px] font-normal tracking-wide transition-colors ${
                          selectedSize === "all" ? "text-[#111113] dark:text-white font-medium" : "text-[#44444C] dark:text-white/70"
                        }`}>
                          All Sizes
                        </span>
                      </button>
                      {SIZES.map((sz) => {
                        const active = selectedSize === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedSize(sz)}
                            className="flex items-center gap-2.5 py-1 text-left group"
                          >
                            <div className={`w-4 h-4 border flex items-center justify-center transition-colors shrink-0 ${
                              active
                                ? "border-[#111113] bg-[#111113] text-white dark:border-[#C2922E] dark:bg-[#C2922E] dark:text-black"
                                : "border-[#888890] dark:border-white/30 bg-transparent group-hover:border-[#111113]"
                            }`}>
                              {active && <Check size={11} strokeWidth={2.5} />}
                            </div>
                            <span className={`text-[11.5px] font-normal tracking-wide transition-colors ${
                              active ? "text-[#111113] dark:text-white font-medium" : "text-[#44444C] dark:text-white/70"
                            }`}>
                              {sz}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Colour */}
                  <div className="pt-6 pb-2">
                    <h4 className="text-[10.5px] uppercase tracking-[0.24em] font-semibold text-[#111113] dark:text-white mb-3.5">
                      COLOUR
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedColour("all")}
                        className="flex items-center gap-2.5 py-1 text-left group"
                      >
                        <div className={`w-4 h-4 border flex items-center justify-center transition-colors shrink-0 ${
                          selectedColour === "all"
                            ? "border-[#111113] bg-[#111113] text-white dark:border-[#C2922E] dark:bg-[#C2922E] dark:text-black"
                            : "border-[#888890] dark:border-white/30 bg-transparent group-hover:border-[#111113]"
                        }`}>
                          {selectedColour === "all" && <Check size={11} strokeWidth={2.5} />}
                        </div>
                        <span className={`text-[11.5px] font-normal tracking-wide transition-colors ${
                          selectedColour === "all" ? "text-[#111113] dark:text-white font-medium" : "text-[#44444C] dark:text-white/70"
                        }`}>
                          All Colours
                        </span>
                      </button>
                      {COLOURS.map((col) => {
                        const active = selectedColour === col.name;
                        return (
                          <button
                            key={col.name}
                            type="button"
                            onClick={() => setSelectedColour(col.name)}
                            className="flex items-center gap-2.5 py-1 text-left group"
                          >
                            <div className={`w-4 h-4 border flex items-center justify-center transition-colors shrink-0 ${
                              active
                                ? "border-[#111113] bg-[#111113] text-white dark:border-[#C2922E] dark:bg-[#C2922E] dark:text-black"
                                : "border-[#888890] dark:border-white/30 bg-transparent group-hover:border-[#111113]"
                            }`}>
                              {active && <Check size={11} strokeWidth={2.5} />}
                            </div>
                            <span className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: col.hex }} />
                            <span className={`text-[11.5px] font-normal tracking-wide transition-colors truncate ${
                              active ? "text-[#111113] dark:text-white font-medium" : "text-[#44444C] dark:text-white/70"
                            }`}>
                              {col.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-[#E2DDD5] dark:border-white/10 flex items-center gap-2.5 bg-[#FAF8F5] dark:bg-[#121216] shrink-0 z-20">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="py-3 px-3.5 text-[10px] uppercase tracking-[0.2em] text-[#706E68] dark:text-white/60 font-medium hover:text-[#C2922E]"
                    >
                      RESET
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="flex-1 py-3 bg-[#111113] dark:bg-white text-white dark:text-[#111113] text-[10.5px] uppercase tracking-[0.22em] font-medium text-center transition-opacity active:opacity-85"
                  >
                    APPLY FILTERS ({filteredProducts.length})
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* =========================================================================
          10. MOBILE SORT BOTTOM SHEET
          ========================================================================= */}
      {createPortal(
        <AnimatePresence>
          {mobileSortOpen && (
            <div 
              data-lenis-prevent="true"
              data-lenis-prevent-touch="true"
              className="fixed inset-0 z-[9999] md:hidden flex flex-col justify-end"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSortOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-[10000] w-full bg-[#FAF8F5] dark:bg-[#121216] border-t border-[#E2DDD5] dark:border-white/15 rounded-t-2xl flex flex-col shadow-2xl pb-8"
              >
                <div className="w-10 h-1 bg-black/20 dark:bg-white/20 rounded-full mx-auto my-2.5 shrink-0" />

                <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2DDD5] dark:border-white/10 shrink-0">
                  <h3 className="text-[12px] uppercase tracking-[0.25em] font-semibold text-[#111113] dark:text-white">
                    SORT BY
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMobileSortOpen(false)}
                    className="p-1 text-[#111113] dark:text-white hover:text-[#C2922E]"
                    aria-label="Close Sort"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => { setSelectedSort("newest"); setMobileSortOpen(false); }}
                    className={`w-full text-left py-3 px-4 text-[11px] uppercase tracking-[0.2em] border transition-colors ${
                      selectedSort === "newest"
                        ? "border-[#111113] dark:border-[#C2922E] bg-[#111113] text-white dark:bg-[#C2922E] dark:text-black font-medium"
                        : "border-[#E2DDD5] dark:border-white/15 text-[#55555C] dark:text-white/70"
                    }`}
                  >
                    Newest
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedSort("price-low"); setMobileSortOpen(false); }}
                    className={`w-full text-left py-3 px-4 text-[11px] uppercase tracking-[0.2em] border transition-colors ${
                      selectedSort === "price-low"
                        ? "border-[#111113] dark:border-[#C2922E] bg-[#111113] text-white dark:bg-[#C2922E] dark:text-black font-medium"
                        : "border-[#E2DDD5] dark:border-white/15 text-[#55555C] dark:text-white/70"
                    }`}
                  >
                    Price: Low to High
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedSort("price-high"); setMobileSortOpen(false); }}
                    className={`w-full text-left py-3 px-4 text-[11px] uppercase tracking-[0.2em] border transition-colors ${
                      selectedSort === "price-high"
                        ? "border-[#111113] dark:border-[#C2922E] bg-[#111113] text-white dark:bg-[#C2922E] dark:text-black font-medium"
                        : "border-[#E2DDD5] dark:border-white/15 text-[#55555C] dark:text-white/70"
                    }`}
                  >
                    Price: High to Low
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
};

export default NewIn;
