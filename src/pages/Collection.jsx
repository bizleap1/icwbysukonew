import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useSearchParams } from "react-router-dom";
import { X, Check, SlidersHorizontal, ArrowUpDown, Heart, ShoppingBag } from "lucide-react";
import { useLenis } from "lenis/react";
import SEO from "../components/SEO";
import { useProducts } from "../context/ProductContext";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { PRODUCTS as FALLBACK_PRODUCTS } from "../data/products";
import { getCardImage } from "../utils/mediaUtils";

// Category Tabs Definition for Collection Page
const COLLECTION_CATEGORIES = [
  { id: "all", label: "ALL PIECES" },
  { id: "suits", label: "POWER SUITS & SETS" },
  { 
    id: "separates", 
    label: "TAILORED SEPARATES", 
    subcategories: ["Blazers", "Jackets", "Vests", "Tunics", "Trousers", "Skirts"] 
  },
  { id: "coords", label: "VESTS & CO-ORDS" },
  { id: "signatures", label: "SIGNATURE PIECES" }
];

// Available Filter Attributes
const COLOUR_OPTIONS = [
  { id: "all", label: "All Colours" },
  { id: "Lilac", label: "Lilac", hex: "#C4A8D1" },
  { id: "Wine", label: "Wine", hex: "#5B1E31" },
  { id: "Navy Blue", label: "Navy Blue", hex: "#16233B" },
  { id: "Muted Pink", label: "Muted Pink", hex: "#D9A7AB" },
  { id: "Obsidian Black", label: "Obsidian Black", hex: "#0E0E11" }
];

const SIZE_OPTIONS = ["all", "XS", "S", "M", "L", "XL"];

const PRICE_OPTIONS = [
  { id: "all", label: "All Prices" },
  { id: "under-50k", label: "Under ₹50,000", max: 50000 },
  { id: "50k-75k", label: "₹50,000 – ₹75,000", min: 50000, max: 75000 },
  { id: "75k-plus", label: "₹75,000+", min: 75000 }
];

const SORT_OPTIONS = [
  { id: "featured", label: "Recommended" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" }
];



// 3 Moments Teaser Tiles
const MOMENTS_TEASERS = [
  {
    id: "boardroom",
    title: "The Boardroom Edit",
    subtitle: "Leadership meetings & investor reviews",
    image: "/boardroom_women.webp",
    link: "/shop-by-moment?moment=boardroom"
  },
  {
    id: "presentation",
    title: "The Presentation Edit",
    subtitle: "Keynotes, conferences & addresses",
    image: "/presentation_woman.webp",
    link: "/shop-by-moment?moment=presentation"
  },
  {
    id: "after-hours",
    title: "The After-Hours Edit",
    subtitle: "Business dinners & evening networking",
    image: "/after_hour_woman.webp",
    link: "/shop-by-moment?moment=after-hours"
  }
];

export const Collection = () => {
  const lenis = useLenis();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const subCategoryParam = searchParams.get("subcat");
  const sortParam = searchParams.get("sort");

  // Global Products Context (falling back to static catalog if DB is loading)
  const { products: contextProducts, loading: productsLoading } = useProducts();
  const productsList = useMemo(() => {
    if (contextProducts && contextProducts.length > 0) return contextProducts;
    return FALLBACK_PRODUCTS;
  }, [contextProducts]);

  // Selected Filter States
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("all");
  const [selectedColour, setSelectedColour] = useState("all");
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedSort, setSelectedSort] = useState(sortParam || "featured");

  // Drawer & Popover States
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);
  const mobileCategoryStripRef = useRef(null);

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Close Sort Dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setSortDropdownOpen(false);
      }
    };
    if (sortDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sortDropdownOpen]);

  // Auto-scroll the active category tab horizontally into view on mobile
  useEffect(() => {
    if (selectedCategory) {
      setTimeout(() => {
        const activeTabEl = document.getElementById(`mobile-tab-${selectedCategory}`);
        if (activeTabEl && mobileCategoryStripRef.current) {
          const container = mobileCategoryStripRef.current;
          const left = activeTabEl.offsetLeft - container.offsetWidth / 2 + activeTabEl.offsetWidth / 2;
          container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
        }
      }, 50);
    }
  }, [selectedCategory]);

  // Synchronize state with URL search params if changed externally
  useEffect(() => {
    if (categoryParam) {
      const param = categoryParam.toLowerCase();
      if (param === "signature" || param === "signatures" || param === "signature-pieces") {
        setSelectedCategory("signatures");
      } else {
        setSelectedCategory(param);
      }
    }
    if (subCategoryParam) {
      setSelectedSubCategory(subCategoryParam.toLowerCase());
    } else {
      setSelectedSubCategory("all");
    }
  }, [categoryParam, subCategoryParam]);

  // Lock background scroll when filter drawer is open
  useEffect(() => {
    if (filterDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [filterDrawerOpen]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let list = productsList.filter((p) => {
      // Exclusively Women Luxury Corporate Wear
      if (p.gender === "male" || p.gender === "men") return false;

      // Category / Tab filter
      if (selectedCategory !== "all") {
        const cat = (p.category || "").toLowerCase();
        const catName = (p.categoryName || "").toLowerCase();
        const setType = (p.setType || "").toLowerCase();
        const selCat = selectedCategory.toLowerCase();

        if (selCat === "suits") {
          const isSuit = cat === "suits" || catName.includes("power suit");
          if (!isSuit) return false;
        } else if (selCat === "coords" || selCat === "coord" || selCat === "co-ords") {
          const isCoord = cat === "coords" || cat === "waistcoats" || catName.includes("co-ord") || catName.includes("vests & co-ords");
          if (!isCoord) return false;
        } else if (selCat === "signatures" || selCat === "signature") {
          const isSignature = p.badge?.toLowerCase().includes("signature") || (p.price && p.price >= 76000);
          if (!isSignature) return false;
        } else if (selCat === "separates" || selCat === "blazers" || selCat === "blazers-vests" || selCat === "tailored-separates") {
          // Strictly standalone Tailored Separates
          const isSeparate = cat === "separates" || catName === "tailored separates";
          if (!isSeparate) return false;

          // Subcategory check (Blazers, Jackets, Vests, Trousers, Skirts)
          if (selectedSubCategory && selectedSubCategory !== "all") {
            const sub = selectedSubCategory.toLowerCase();
            const pSub = (p.subCategory || "").toLowerCase();

            if (sub === "vests" || sub === "vest") {
              if (!pSub.includes("vest")) return false;
            } else if (sub === "jackets" || sub === "jacket") {
              if (!pSub.includes("jacket")) return false;
            } else if (sub === "blazers" || sub === "blazer") {
              if (!pSub.includes("blazer")) return false;
            } else if (sub === "tunics" || sub === "tunic" || sub.includes("tunic")) {
              if (!pSub.includes("tunic")) return false;
            } else if (sub === "pants" || sub === "pant" || sub === "trousers" || sub === "trouser") {
              if (!pSub.includes("trouser") && !pSub.includes("pant")) return false;
            } else if (sub === "skirts" || sub === "skirt") {
              if (!pSub.includes("skirt")) return false;
            }
          }
        }
      }

      // Colour filter
      if (selectedColour !== "all") {
        const pColor = (p.color || "").toLowerCase();
        const selCol = selectedColour.toLowerCase();
        if (pColor !== selCol && !pColor.includes(selCol)) {
          return false;
        }
      }

      // Size filter
      if (selectedSize !== "all") {
        if (!p.sizes || !p.sizes.includes(selectedSize)) {
          return false;
        }
      }

      // Price filter
      if (selectedPrice !== "all") {
        const price = p.price || 0;
        if (selectedPrice === "under-50k" && price >= 50000) return false;
        if (selectedPrice === "50k-75k" && (price < 50000 || price > 75000)) return false;
        if (selectedPrice === "75k-plus" && price <= 75000) return false;
      }

      return true;
    });

    // Sorting Logic
    if (selectedSort === "price-asc") {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (selectedSort === "price-desc") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (selectedSort === "newest") {
      list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return list;
  }, [productsList, selectedCategory, selectedSubCategory, selectedColour, selectedSize, selectedPrice, selectedSort]);

  // Split products for the rhythm with editorial break (only on "All Pieces" view)
  const isAllView = selectedCategory === "all";
  const firstBatch = isAllView ? filteredProducts.slice(0, 8) : filteredProducts;
  const remainingBatch = isAllView ? filteredProducts.slice(8) : [];

  const handleCategorySelect = (id) => {
    setSelectedCategory(id);
    setSelectedSubCategory("all");
    if (id === "all") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ category: id }, { replace: true });
    }
  };

  const handleSubCategorySelect = (sub) => {
    setSelectedCategory("separates");
    const subKey = sub.toLowerCase();
    setSelectedSubCategory(subKey);
    if (subKey === "all") {
      setSearchParams({ category: "separates" }, { replace: true });
    } else {
      setSearchParams({ category: "separates", subcat: subKey }, { replace: true });
    }
  };

  const handleDiscoverSignatures = (e) => {
    e?.preventDefault();
    setSelectedCategory("signatures");
    setSearchParams({ category: "signatures" });

    // Scroll up smoothly directly to the top of the collection grid
    setTimeout(() => {
      // Scroll mobile strip horizontally to show SIGNATURE PIECES
      const activeTabEl = document.getElementById("mobile-tab-signatures");
      if (activeTabEl && mobileCategoryStripRef.current) {
        const container = mobileCategoryStripRef.current;
        const left = activeTabEl.offsetLeft - container.offsetWidth / 2 + activeTabEl.offsetWidth / 2;
        container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
      }

      const elem = document.getElementById("collection-grid-top") || document.getElementById("complete-edit");
      if (elem) {
        if (lenis) {
          lenis.scrollTo(elem, { offset: -30, duration: 1.2 });
        } else {
          elem.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }, 40);
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubmitted(true);
    }
  };

  const activeFiltersCount = 
    (selectedColour !== "all" ? 1 : 0) + 
    (selectedSize !== "all" ? 1 : 0) + 
    (selectedPrice !== "all" ? 1 : 0);

  return (
    <div className="bg-[#FAF8F5] text-[#121215] min-h-screen font-body selection:bg-[#C2922E] selection:text-white">
      <SEO
        title="Collections | The SUKO Wardrobe"
        description="Explore SUKO's complete luxury corporate wear collections. Structured power suits, tailored blazers, fluid trousers, and signature pieces crafted for modern executive women."
      />

      {/* ========================================================================= */}
      {/* 1. COMPACT EDITORIAL COLLECTION HEADER (Minimal, Low-Height Intro) */}
      {/* ========================================================================= */}
      <section className="bg-[#FAF8F5] pt-[88px] sm:pt-[96px] lg:pt-[104px] pb-5 sm:pb-6 lg:pb-7">
        <div className="w-full mx-auto px-6 sm:px-10 lg:px-12 xl:px-14 text-left">
          
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
            <span className="w-4 h-[1px] bg-[#C2922E]" />
            <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.32em] text-[#C2922E] font-medium font-body">
              COLLECTIONS
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-quiche text-[32px] sm:text-[40px] lg:text-[46px] font-light text-[#121215] leading-[1.06] tracking-tight mb-2 sm:mb-2.5">
            The SUKO <span className="italic font-normal">Wardrobe.</span>
          </h1>

          {/* Subtext */}
          <p className="text-[#555560] font-body text-[13.5px] sm:text-[14.5px] font-light leading-relaxed max-w-xl">
            Tailored pieces for modern professional life — across roles, rooms and moments.
          </p>
        </div>
      </section>

      {/* Scroll Anchor */}
      <div id="collection-grid-top" className="w-full h-0 relative -top-6 pointer-events-none scroll-mt-20" />

      {/* ========================================================================= */}
      {/* 2. STICKY CATEGORY NAVIGATION & FILTER BAR (Desktop: 1-Row / Mobile: 2-Tier) */}
      {/* ========================================================================= */}
      <div id="complete-edit" className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-y border-[#E8E4DC] transition-all duration-300 scroll-mt-20">
        
        {/* DESKTOP LAYOUT (Unified Single Line on lg screens) */}
        <div className="hidden lg:block w-full mx-auto px-12 xl:px-14 py-3">
          <div className="flex items-center justify-between gap-6">
            
            {/* Left: Pieces Count */}
            <div className="shrink-0 min-w-[70px] text-left">
              <span className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#52525A]">
                {filteredProducts.length} {filteredProducts.length === 1 ? "PIECE" : "PIECES"}
              </span>
            </div>

            {/* Center: Category Navigation Links */}
            <div className="flex items-center justify-center gap-6 overflow-x-auto hide-scrollbar whitespace-nowrap">
              {COLLECTION_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                const isLongTab = cat.id === "signatures";
                const hasSub = cat.subcategories && cat.subcategories.length > 0;

                if (hasSub) {
                  return (
                    <div key={cat.id} className="relative group/tab">
                      <button
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`py-1 px-1 text-[10.5px] uppercase transition-all focus-visible:outline-none cursor-pointer tracking-[0.18em] flex items-center gap-1 ${
                          isActive
                            ? "text-[#121215] font-medium"
                            : "text-[#4E4E56] font-normal hover:text-[#121215]"
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className="text-[9px] text-[#C2922E]">&bull;</span>
                        {isActive ? (
                          <span className="absolute bottom-0 left-1 right-1 h-[1.5px] bg-[#C2922E]" />
                        ) : (
                          <span className="absolute bottom-0 left-1 right-1 h-[1px] bg-transparent group-hover/tab:bg-[#121215]/20 transition-colors" />
                        )}
                      </button>

                      {/* Desktop Hover Flyout Dropdown */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-48 bg-[#FAF8F5] border border-[#E8E4DC] shadow-xl py-1 z-50 opacity-0 pointer-events-none group-hover/tab:opacity-100 group-hover/tab:pointer-events-auto transition-all duration-200">
                        <button
                          onClick={() => handleSubCategorySelect("all")}
                          className={`w-full px-3.5 py-2 text-left text-[10.5px] uppercase tracking-wider transition-colors flex items-center justify-between cursor-pointer ${
                            selectedCategory === "separates" && selectedSubCategory === "all"
                              ? "text-[#111113] font-semibold bg-[#EFECE6]"
                              : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                          }`}
                        >
                          <span>All Separates</span>
                          {selectedCategory === "separates" && selectedSubCategory === "all" && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" />
                          )}
                        </button>
                        {cat.subcategories.map((sub) => {
                          const isSubActive = selectedCategory === "separates" && selectedSubCategory === sub.toLowerCase();
                          return (
                            <button
                              key={sub}
                              onClick={() => handleSubCategorySelect(sub)}
                              className={`w-full px-3.5 py-2 text-left text-[10.5px] uppercase tracking-wider transition-colors flex items-center justify-between cursor-pointer ${
                                isSubActive
                                  ? "text-[#C2922E] font-semibold bg-[#EFECE6]"
                                  : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                              }`}
                            >
                              <span>{sub}</span>
                              {isSubActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`group relative py-1 px-1 text-[10.5px] uppercase transition-all focus-visible:outline-none cursor-pointer ${
                      isLongTab ? "tracking-[0.16em]" : "tracking-[0.18em]"
                    } ${
                      isActive
                        ? "text-[#121215] font-medium"
                        : "text-[#4E4E56] font-normal hover:text-[#121215]"
                    }`}
                  >
                    <span>{cat.label}</span>
                    {isActive ? (
                      <span className="absolute bottom-0 left-1 right-1 h-[1.5px] bg-[#C2922E]" />
                    ) : (
                      <span className="absolute bottom-0 left-1 right-1 h-[1px] bg-transparent group-hover:bg-[#121215]/20 transition-colors" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right: Filter & Sort Actions */}
            <div className="flex items-center gap-6 shrink-0">
              {/* Filter Drawer Trigger */}
              <button
                onClick={() => setFilterDrawerOpen(true)}
                className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] font-medium text-[#121215] hover:text-[#C2922E] transition-colors cursor-pointer"
              >
                <SlidersHorizontal size={11} strokeWidth={1.5} />
                <span>FILTER {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
              </button>

              {/* Sort By Compact Dropdown / Popover */}
              <div className="relative" ref={sortDropdownRef}>
                <button
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className={`flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] font-medium transition-colors cursor-pointer ${
                    sortDropdownOpen || selectedSort !== "featured" ? "text-[#C2922E]" : "text-[#121215] hover:text-[#C2922E]"
                  }`}
                >
                  <ArrowUpDown size={11} strokeWidth={1.5} />
                  <span>SORT BY</span>
                </button>

                {/* Compact Dropdown Menu */}
                {sortDropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-[230px] sm:w-[250px] bg-[#FAF8F5] border border-[#E8E4DC] shadow-[0_10px_30px_rgba(18,18,21,0.08)] rounded-[2px] z-50 p-1.5 text-left animate-in fade-in zoom-in-95 duration-150">
                    <div className="py-0.5 space-y-0.5">
                      {SORT_OPTIONS.map((opt) => {
                        const isSelected = selectedSort === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setSelectedSort(opt.id);
                              setSortDropdownOpen(false);
                            }}
                            className={`w-full text-left py-2 px-3 flex items-center justify-between text-[10.5px] sm:text-[11px] uppercase tracking-[0.14em] transition-colors rounded-[1px] cursor-pointer ${
                              isSelected
                                ? "bg-[#121215] text-white font-medium"
                                : "text-[#4A4A52] hover:bg-[#EFEAE1] hover:text-[#121215] font-normal"
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check size={13} className="text-[#C2922E]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* MOBILE LAYOUT (< lg screens: Clean 2-Tier Hierarchy) */}
        <div className="lg:hidden w-full">
          {/* Top Row: Pieces Count on Left, Filter | Sort on Right */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-[#E8E4DC]/80">
            <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#52525A]">
              {filteredProducts.length} {filteredProducts.length === 1 ? "PIECE" : "PIECES"}
            </span>

            <div className="flex items-center gap-4 sm:gap-5">
              <button
                onClick={() => setFilterDrawerOpen(true)}
                className="flex items-center gap-1.5 text-[10px] sm:text-[10.5px] uppercase tracking-[0.18em] font-medium text-[#121215] hover:text-[#C2922E] transition-colors cursor-pointer"
              >
                <SlidersHorizontal size={11} strokeWidth={1.5} />
                <span>FILTER {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
              </button>

              <span className="w-[1px] h-3 bg-[#E8E4DC]" />

              <div className="relative">
                <button
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className={`flex items-center gap-1.5 text-[10px] sm:text-[10.5px] uppercase tracking-[0.18em] font-medium transition-colors cursor-pointer ${
                    sortDropdownOpen || selectedSort !== "featured" ? "text-[#C2922E]" : "text-[#121215] hover:text-[#C2922E]"
                  }`}
                >
                  <ArrowUpDown size={11} strokeWidth={1.5} />
                  <span>SORT</span>
                </button>

                {sortDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[220px] bg-[#FAF8F5] border border-[#E8E4DC] shadow-[0_10px_30px_rgba(18,18,21,0.08)] rounded-[2px] z-50 p-1.5 text-left animate-in fade-in zoom-in-95 duration-150">
                    <div className="py-0.5 space-y-0.5">
                      {SORT_OPTIONS.map((opt) => {
                        const isSelected = selectedSort === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setSelectedSort(opt.id);
                              setSortDropdownOpen(false);
                            }}
                            className={`w-full text-left py-2 px-3 flex items-center justify-between text-[10.5px] uppercase tracking-[0.14em] transition-colors rounded-[1px] cursor-pointer ${
                              isSelected
                                ? "bg-[#121215] text-white font-medium"
                                : "text-[#4A4A52] hover:bg-[#EFEAE1] hover:text-[#121215] font-normal"
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check size={13} className="text-[#C2922E]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Horizontal Swipeable Category Strip */}
          <div 
            ref={mobileCategoryStripRef}
            className="h-[48px] sm:h-[52px] flex items-center overflow-x-auto hide-scrollbar whitespace-nowrap px-4 sm:px-5 gap-6 sm:gap-7"
          >
            {COLLECTION_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`mobile-tab-${cat.id}`}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`relative shrink-0 h-full flex items-center text-[10.5px] sm:text-[11px] uppercase tracking-[0.16em] transition-all focus-visible:outline-none cursor-pointer ${
                    isActive
                      ? "text-[#121215] font-semibold"
                      : "text-[#707078] font-normal hover:text-[#121215]"
                  }`}
                >
                  <span>{cat.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#C2922E]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Subcategories Strip for Tailored Separates */}
        {selectedCategory === "separates" && (
          <div className="w-full bg-[#F5F1E8]/95 border-t border-[#E8E4DC] py-2 sm:py-2.5 px-4 sm:px-8 lg:px-14 flex items-center justify-start sm:justify-center gap-4 sm:gap-6 overflow-x-auto hide-scrollbar text-[10px] sm:text-[10.5px] uppercase tracking-[0.2em]">
            <span className="text-[#8C887B] font-medium shrink-0">SEPARATES:</span>
            {["All Separates", "Blazers", "Jackets", "Vests", "Tunics", "Trousers", "Skirts"].map((sub) => {
              const subKey = sub === "All Separates" ? "all" : sub.toLowerCase();
              const isSubActive = selectedSubCategory === subKey;
              return (
                <button
                  key={sub}
                  onClick={() => handleSubCategorySelect(subKey)}
                  className={`py-0.5 px-1.5 transition-all rounded-[1px] shrink-0 cursor-pointer whitespace-nowrap ${
                    isSubActive
                      ? "text-[#C2922E] font-semibold border-b border-[#C2922E]"
                      : "text-[#555560] hover:text-[#121215] font-normal"
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN SHOPPING AREA (Matching New Arrivals Card Sizing & Proportions) */}
      {/* ========================================================================= */}
      <section className="pt-6 sm:pt-8 pb-4 sm:pb-6">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-14 xl:px-16">
          
          {/* First 6 Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3.5 sm:gap-x-5 lg:gap-x-6 gap-y-6 sm:gap-y-10">
            {firstBatch.map((product) => (
              <ProductCard key={product.id || product.slug} product={product} />
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. COMPACT MID-PRODUCT EDITORIAL BANNER (Mobile: 400-410px | Desktop: ~330px) */}
      {/* ========================================================================= */}
      {firstBatch.length > 0 && isAllView && (
        <section className="my-8 sm:my-10 lg:my-12 relative bg-[#121215] text-[#FAF8F5] overflow-hidden h-[400px] sm:h-[420px] lg:h-[330px] xl:h-[350px] flex items-end lg:items-center border-y border-white/10 w-full">
          {/* Full Background Image (Model on Right in Mobile, Left on Desktop) */}
          <img
            src="/signature.webp"
            alt="The SUKO Signature Edit"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              if (e.currentTarget.src !== "/signature.png") {
                e.currentTarget.src = "/signature.png";
              }
            }}
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1] lg:scale-x-100 object-[12%_4%] sm:object-[14%_6%] lg:object-[16%_12%]"
          />

          {/* Desktop Smooth Dark Gradient (Right-Aligned Copy Vignette, Left Model Bright) */}
          <div 
            className="hidden lg:block absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(270deg, rgba(18,18,21,0.96) 0%, rgba(18,18,21,0.88) 45%, rgba(18,18,21,0.35) 65%, rgba(18,18,21,0.0) 82%, rgba(18,18,21,0.0) 100%)"
            }}
          />

          {/* Mobile Vertical Gradient (Upper 55% Model Crisp -> Deep Black for Text with Tight Base) */}
          <div 
            className="lg:hidden absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(18,18,21,0.0) 0%, rgba(18,18,21,0.0) 28%, rgba(18,18,21,0.60) 48%, rgba(18,18,21,0.92) 68%, #121215 88%, #121215 100%)"
            }}
          />

          {/* Foreground Campaign Copy (Bottom empty space reduced ~12-15px, eyebrow gap tightened 2-3px) */}
          <div className="relative z-10 w-full mx-auto px-4 sm:px-5 lg:px-14 xl:px-16 pb-3.5 sm:pb-4 lg:py-0 flex justify-start lg:justify-end lg:pr-14 xl:pr-20">
            <div className="max-w-md text-left">
              <div className="flex items-center gap-2 pt-0.5 mb-1 sm:mb-1.5">
                <span className="w-3.5 h-[1.5px] bg-[#C2922E]" />
                <span className="text-[10px] uppercase tracking-[0.30em] text-[#C2922E] font-medium font-body">
                  THE SIGNATURE EDIT
                </span>
              </div>

              <h2 className="font-quiche text-[30px] sm:text-[34px] lg:text-[38px] xl:text-[42px] font-light text-white leading-[1.06] tracking-tight mb-2 sm:mb-2.5">
                Structure That <br />
                <span className="italic font-normal text-[#FAF8F5]">Speaks Quietly.</span>
              </h2>

              <p className="text-white/85 font-body text-[13.5px] sm:text-[14px] font-light leading-relaxed mb-4 sm:mb-5 max-w-[310px] sm:max-w-[360px]">
                Defining SUKO silhouettes — structured, refined and designed with presence.
              </p>

              <div>
                <button
                  onClick={handleDiscoverSignatures}
                  className="group relative inline-block pt-0.5 pb-1 select-none focus-visible:outline-none cursor-pointer"
                >
                  <span className="text-[11px] sm:text-[11.5px] uppercase tracking-[0.20em] font-medium text-white block group-hover:text-[#C2922E] transition-colors">
                    DISCOVER SIGNATURE PIECES
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/40" />
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#C2922E] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. REMAINING PRODUCT GRID (Continuing Rhythm) */}
      {/* ========================================================================= */}
      {remainingBatch.length > 0 && (
        <section className="pt-2 sm:pt-4 pb-2 sm:pb-3">
          <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-14 xl:px-16">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3.5 sm:gap-x-5 lg:gap-x-6 gap-y-6 sm:gap-y-10">
              {remainingBatch.map((product) => (
                <ProductCard key={product.id || product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. SHOP BY MOMENT CROSS-LINK (3 Curated Teaser Tiles Max) */}
      {/* ========================================================================= */}
      <section className="pt-6 sm:pt-8 pb-12 sm:pb-14 bg-[#FAF8F5]">
        <div className="w-full mx-auto px-5 sm:px-8 lg:px-12 xl:px-14">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10 text-left">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-4 h-[1px] bg-[#C2922E]" />
                <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.30em] text-[#C2922E] font-medium">
                  SHOP DIFFERENTLY
                </span>
              </div>
              <h2 className="font-quiche text-2xl sm:text-4xl lg:text-5xl font-light text-[#121215] leading-tight">
                Dressing for Something <br />
                <span className="italic font-normal">Specific?</span>
              </h2>
            </div>

            <Link
              to="/shop-by-moment"
              className="group relative inline-block pt-0.5 pb-1 select-none focus-visible:outline-none cursor-pointer self-start sm:self-end"
            >
              <span className="text-[11px] sm:text-[11.5px] uppercase tracking-[0.22em] font-medium text-[#121215] block">
                SHOP BY MOMENT
              </span>
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30" />
              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#121215] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
            </Link>
          </div>

          {/* 3 Moments Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {MOMENTS_TEASERS.map((moment) => (
              <Link
                key={moment.id}
                to={moment.link}
                className="group relative h-[360px] sm:h-[400px] overflow-hidden rounded-[2px] bg-[#121215] block select-none cursor-pointer"
              >
                <img
                  src={moment.image}
                  alt={moment.title}
                  className="w-full h-full object-cover object-[50%_15%] transition-transform duration-700 ease-out group-hover:scale-105 opacity-85 group-hover:opacity-100"
                />
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(0deg, rgba(14,14,17,0.85) 0%, rgba(14,14,17,0.30) 40%, transparent 70%)"
                  }}
                />
                
                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-left text-white">
                  <h3 className="font-quiche text-xl sm:text-2xl font-light mb-1.5 group-hover:text-[#C2922E] transition-colors">
                    {moment.title}
                  </h3>
                  <p className="text-white/75 text-[11.5px] sm:text-xs font-light line-clamp-1 truncate mb-3">
                    {moment.subtitle}
                  </p>
                  <div className="pt-1">
                    <span className="relative inline-block pt-0.5 pb-0.5 select-none">
                      <span className="text-[10.5px] sm:text-[11px] uppercase tracking-[0.22em] font-medium text-white block">
                        EXPLORE EDIT
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
      </section>

      {/* ========================================================================= */}
      {/* 9. PERSONAL STYLING COMPACT STRIP (Warm Ivory Light Background) */}
      {/* ========================================================================= */}
      <section className="bg-[#FAF8F5] text-[#121215] py-8 sm:py-9 lg:py-10 border-t border-[#E8E4DC] text-left">
        <div className="max-w-[1550px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-14 flex flex-col md:flex-row md:items-center justify-between gap-6 lg:gap-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-4 h-[1px] bg-[#C2922E]" />
              <span className="text-[10px] uppercase tracking-[0.35em] text-[#C2922E] font-medium">
                PERSONAL STYLING
              </span>
            </div>
            <h2 className="font-quiche text-2xl sm:text-3xl lg:text-[34px] font-light text-[#121215] leading-tight mb-1.5">
              Not Sure Where to Begin?
            </h2>
            <p className="text-[#555560] font-body text-xs sm:text-[13px] font-light leading-relaxed">
              Book a private styling appointment and build a wardrobe around your professional world.
            </p>
          </div>

          <div className="lg:pr-16 xl:pr-24 shrink-0">
            <Link
              to="/wardrobe-concierge"
              className="group relative inline-block pt-0.5 pb-1 select-none focus-visible:outline-none cursor-pointer"
            >
              <span className="text-[11px] sm:text-[11.5px] uppercase tracking-[0.22em] font-medium text-[#121215] block">
                BOOK A STYLING APPOINTMENT &rarr;
              </span>
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30" />
              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#121215] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
            </Link>
          </div>
        </div>
      </section>



      {/* ========================================================================= */}
      {/* FILTER DRAWER MODAL (Rendered to document.body via Portal) */}
      {/* ========================================================================= */}
      {filterDrawerOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex justify-end">
          {/* 35-45% Dark Overlay Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300" 
            onClick={() => setFilterDrawerOpen(false)}
          />

          {/* Drawer Panel (400-440px on Desktop, Full-width on Mobile) */}
          <aside 
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="relative w-full sm:w-[420px] lg:w-[440px] bg-[#FAF8F5] text-[#121215] h-full h-[100dvh] shadow-2xl z-10 flex flex-col justify-between animate-in slide-in-from-right duration-300 overscroll-contain"
          >
            
            {/* 1. Top Header (Sticky Top) */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-[#E8E4DC] bg-[#FAF8F5] shrink-0">
              <span className="font-quiche text-xl sm:text-2xl font-light tracking-wide text-[#121215]">
                FILTERS
              </span>
              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="p-1.5 -mr-1.5 text-[#555560] hover:text-[#121215] transition-colors cursor-pointer"
                aria-label="Close filters"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* 2. Scrollable Body (Clean 28-32px section rhythm) */}
            <div 
              data-lenis-prevent="true"
              data-lenis-prevent-wheel="true"
              data-lenis-prevent-touch="true"
              className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-6 sm:px-8 py-6 space-y-7 divide-y divide-[#E8E4DC]/60"
            >
              
              {/* CATEGORY SECTION */}
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] uppercase tracking-[0.25em] font-medium text-[#707078] block">
                    CATEGORY
                  </span>
                  {selectedCategory !== "all" && (
                    <button
                      onClick={() => handleCategorySelect("all")}
                      className="text-[10px] uppercase tracking-wider text-[#C2922E] hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {COLLECTION_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`px-3 py-2 text-[10.5px] uppercase tracking-wider transition-all border cursor-pointer ${
                          isSelected
                            ? "bg-[#121215] text-white border-[#121215] font-medium shadow-xs"
                            : "bg-transparent text-[#3A3A42] border-[#E8E4DC] hover:border-[#121215] hover:text-[#121215]"
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Subcategory Pills for Tailored Separates */}
                {selectedCategory === "separates" && (
                  <div className="mt-3 pt-3 border-t border-[#E8E4DC]/80">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#C2922E] font-medium block mb-2">
                      Filter Separates By:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {["All Separates", "Blazers", "Jackets", "Vests", "Tunics", "Trousers", "Skirts"].map((sub) => {
                        const subKey = sub === "All Separates" ? "all" : sub.toLowerCase();
                        const isSubActive = selectedSubCategory === subKey;
                        return (
                          <button
                            key={sub}
                            onClick={() => handleSubCategorySelect(subKey)}
                            className={`px-2.5 py-1.5 text-[10px] uppercase tracking-wider border transition-all rounded-[1px] cursor-pointer ${
                              isSubActive
                                ? "bg-[#C2922E] text-white border-[#C2922E] font-medium"
                                : "bg-white text-[#555560] border-[#E8E4DC] hover:border-[#121215]"
                            }`}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* COLOUR SECTION */}
              <div className="pt-6 space-y-3.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] uppercase tracking-[0.25em] font-medium text-[#707078] block">
                    COLOUR
                  </span>
                  {selectedColour !== "all" && (
                    <button
                      onClick={() => setSelectedColour("all")}
                      className="text-[10px] uppercase tracking-wider text-[#C2922E] hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {COLOUR_OPTIONS.map((col) => {
                    const isSelected = selectedColour === col.id;
                    return (
                      <button
                        key={col.id}
                        onClick={() => setSelectedColour(col.id)}
                        className={`px-3 py-2.5 text-[11px] uppercase tracking-[0.14em] transition-all flex items-center gap-2.5 border cursor-pointer ${
                          isSelected
                            ? "bg-[#121215] text-white border-[#121215] font-medium shadow-xs"
                            : "bg-transparent text-[#3A3A42] border-[#E8E4DC] hover:border-[#121215] hover:text-[#121215]"
                        }`}
                      >
                        {col.hex ? (
                          <span
                            className={`w-3 h-3 rounded-full shrink-0 ${
                              isSelected ? "border border-white/60" : "border border-black/20"
                            }`}
                            style={{ backgroundColor: col.hex }}
                          />
                        ) : (
                          <span
                            className={`w-3 h-3 rounded-full border shrink-0 ${
                              isSelected ? "border-white bg-white/20" : "border-black/30"
                            }`}
                          />
                        )}
                        <span className="truncate">{col.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SIZE SECTION */}
              <div className="pt-6 space-y-3.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] uppercase tracking-[0.25em] font-medium text-[#707078] block">
                    SIZE
                  </span>
                  {selectedSize !== "all" && (
                    <button
                      onClick={() => setSelectedSize("all")}
                      className="text-[10px] uppercase tracking-wider text-[#C2922E] hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((sz) => {
                    const isSelected = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`min-w-[44px] h-[36px] px-3.5 text-[11px] uppercase tracking-[0.16em] transition-all border flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? "bg-[#121215] text-white border-[#121215] font-medium shadow-xs"
                            : "bg-transparent text-[#3A3A42] border-[#E8E4DC] hover:border-[#121215] hover:text-[#121215]"
                        }`}
                      >
                        {sz === "all" ? "ALL SIZES" : sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PRICE SECTION */}
              <div className="pt-6 space-y-3.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] uppercase tracking-[0.25em] font-medium text-[#707078] block">
                    PRICE
                  </span>
                  {selectedPrice !== "all" && (
                    <button
                      onClick={() => setSelectedPrice("all")}
                      className="text-[10px] uppercase tracking-wider text-[#C2922E] hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {PRICE_OPTIONS.map((pr) => {
                    const isSelected = selectedPrice === pr.id;
                    return (
                      <button
                        key={pr.id}
                        onClick={() => setSelectedPrice(pr.id)}
                        className={`w-full py-2.5 px-3.5 text-left text-[11px] uppercase tracking-[0.14em] transition-all border flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-[#121215] text-white border-[#121215] font-medium shadow-xs"
                            : "bg-transparent text-[#3A3A42] border-[#E8E4DC] hover:border-[#121215] hover:text-[#121215]"
                        }`}
                      >
                        <span>{pr.label}</span>
                        {isSelected && <Check size={13} className="text-[#C2922E]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* 3. Sticky Bottom Footer Actions */}
            <div className="px-6 sm:px-8 py-4.5 border-t border-[#E8E4DC] bg-[#FAF8F5] flex items-center justify-between gap-4 shrink-0">
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedColour("all");
                  setSelectedSize("all");
                  setSelectedPrice("all");
                }}
                className="text-[11px] uppercase tracking-[0.20em] font-medium text-[#707078] hover:text-[#121215] underline underline-offset-4 decoration-[#E8E4DC] hover:decoration-[#121215] transition-all cursor-pointer"
              >
                CLEAR ALL
              </button>
              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="py-3 px-6 text-[11px] uppercase tracking-[0.20em] font-medium bg-[#121215] text-white hover:bg-[#C2922E] transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <span>VIEW {filteredProducts.length} {filteredProducts.length === 1 ? "PIECE" : "PIECES"} &rarr;</span>
              </button>
            </div>
          </aside>
        </div>,
        document.body
      )}

    </div>
  );
};

// =============================================================================
// REUSABLE PRODUCT CARD (Consistent 4:5 Portrait Ratio, Smooth Model Flip Hover, Wishlist & Bag)
// =============================================================================
const ProductCard = ({ product }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  const [hasHovered, setHasHovered] = useState(false);
  const isWishlisted = isInWishlist ? isInWishlist(product.id || product._id) : false;

  const isSeparate = 
    product.category === "separates" || 
    product.categoryName?.toLowerCase().includes("separates") ||
    ["blazers", "vests", "jackets", "tunics"].includes(product.subCategory?.toLowerCase());

  const ghostImg = product.images?.find(img => img.includes("2.png")) || product.images?.[1] || product.images?.[0] || product.image || "/products/the-noir-tailored-suit/1.png";
  const modelImg = product.images?.find(img => img.includes("1.JPG") || img.includes("1.png") || img.includes("5.JPG")) || product.images?.[0] || ghostImg;

  const primaryImage = isSeparate ? ghostImg : (product.images?.[0] || product.image || "/products/the-noir-tailored-suit/1.png");
  const hoverImage = isSeparate ? modelImg : (product.images?.[1] || product.hoverImage || product.images?.[0] || primaryImage);

  const formattedPrice = typeof product.price === "number"
    ? `₹${product.price.toLocaleString("en-IN")}`
    : (product.price || "₹78,000");

  const productUrl = `/product/${product.slug || product.id}`;

  return (
    <div 
      className="group flex flex-col text-left select-none relative"
      onMouseEnter={() => setHasHovered(true)}
    >
      <Link to={productUrl} className="block cursor-pointer">
        {/* 3:4 Portrait Image Container (Matching New Arrivals small cards) */}
        <div className="aspect-[3/4] w-full overflow-hidden rounded-[2px] bg-[#E8E4DC] relative mb-3 sm:mb-3.5">
          
          {/* Primary Image */}
          <img
            src={getCardImage(primaryImage)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              if (e.currentTarget.src !== primaryImage) {
                e.currentTarget.src = primaryImage;
              }
            }}
            className="w-full h-full object-cover object-[50%_15%] transition-transform duration-700 ease-out group-hover:scale-103"
          />

          {/* Hover Secondary Editorial Image */}
          {hasHovered && hoverImage && hoverImage !== primaryImage && (
            <img
              src={getCardImage(hoverImage)}
              alt={`${product.name} — Look`}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                if (e.currentTarget.src !== hoverImage) {
                  e.currentTarget.src = hoverImage;
                }
              }}
              className="absolute inset-0 w-full h-full object-cover object-[50%_15%] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out"
            />
          )}

          {/* Subtle Bottom Vignette on Hover */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: "linear-gradient(0deg, rgba(18,18,21,0.25) 0%, transparent 35%)"
            }}
          />

          {/* VIEW SET Floating Pill Inside Card on Hover */}
          <div className="hidden md:flex absolute inset-x-0 bottom-3 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none z-10">
            <span className="text-[9.5px] uppercase tracking-[0.24em] font-medium text-white bg-black/60 backdrop-blur-xs px-3.5 py-1.5 rounded-[1px] shadow-sm">
              VIEW SET &rarr;
            </span>
          </div>
        </div>

        {/* Product Details & Actions Row */}
        <div className="flex items-start justify-between gap-2.5 pt-1 font-body">
          {/* Left Info: Name -> Category -> Short Type -> Price */}
          <div className="flex flex-col min-w-0 pr-1 flex-1">
            {/* 1. Product Name */}
            <h3 className="font-quiche text-[14px] sm:text-[16px] lg:text-[17px] font-normal text-[#121215] group-hover:text-[#C2922E] transition-colors leading-tight">
              {product.name}
            </h3>

            {/* 2. Category Label */}
            <p className="text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.2em] font-medium text-[#9E9A90] mt-1">
              {product.categoryLabel || (product.categoryName ? product.categoryName.toUpperCase() : "POWER SUITS & SETS")}
            </p>

            {/* 3. Short Silhouette / Type */}
            <p className="text-[#6B6B72] text-[11px] sm:text-[12px] font-light italic mt-0.5 leading-snug line-clamp-1">
              {product.shortType || product.setType || "Tailored Silhouette"}
            </p>

            {/* 4. Price */}
            <p className="text-[12.5px] sm:text-[13.5px] font-medium text-[#121215] mt-1.5">
              {formattedPrice}
            </p>
          </div>

          {/* Right Actions: Wishlist & Bag Icons */}
          <div className="flex items-center gap-2 pt-0.5 shrink-0">
            {/* Wishlist Icon */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product);
              }}
              aria-label="Save to Wishlist"
              className="p-1.5 text-[#121215]/70 hover:text-[#C2922E] transition-colors cursor-pointer"
            >
              <Heart
                size={16}
                strokeWidth={1.3}
                className={`transition-all ${
                  isWishlisted ? "fill-[#C2922E] text-[#C2922E] scale-110" : "hover:scale-110"
                }`}
              />
            </button>

            {/* Shopping Bag Icon */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addItem(product, product.sizes?.[0] || "Standard", 1);
              }}
              aria-label="Add to Bag"
              className="p-1.5 text-[#121215]/70 hover:text-[#C2922E] transition-colors cursor-pointer"
            >
              <ShoppingBag
                size={16}
                strokeWidth={1.3}
                className="transition-transform hover:scale-110"
              />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default Collection;
