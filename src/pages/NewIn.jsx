import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link, useSearchParams, useLocation, useNavigationType } from "react-router-dom";
import { SlidersHorizontal, ArrowUpDown, RotateCcw, X, Check } from "lucide-react";
import { useLenis } from "lenis/react";
import SEO from "../components/SEO";
import { useProducts } from "../context/ProductContext";
import ProductCard from "../components/ProductCard";
import { FilterDrawer, SortSheet } from "../components/newIn/FilterModals";
import ServiceStrip from "../components/home/ServiceStrip";
import { SIZES, COLOURS } from "../data/products";

// Canonical Categories strictly matching Collections requirements
export const NEW_ARRIVALS_CATEGORIES = [
  { id: "all", label: "ALL PIECES" },
  { id: "suits", label: "POWER SUITS & SETS" },
  { id: "blazers", label: "BLAZERS" },
  { id: "trousers", label: "TROUSERS" },
  { id: "coords", label: "VESTS & CO-ORDS" },
  { id: "signatures", label: "SIGNATURE PIECES" }
];

const NewIn = () => {
  const lenis = useLenis();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navType = useNavigationType();

  // Helper to read initial state: URL search params -> sessionStorage -> default
  const getInitialValue = (paramKey, sessionKey, defaultValue) => {
    const urlVal = searchParams.get(paramKey);
    if (urlVal !== null && urlVal !== undefined && urlVal !== "") {
      return urlVal;
    }
    const sessionVal = sessionStorage.getItem(sessionKey);
    if (sessionVal !== null && sessionVal !== undefined && sessionVal !== "") {
      return sessionVal;
    }
    return defaultValue;
  };

  const { products: storeProducts } = useProducts();
  const productsList = storeProducts || [];

  // Active Filter States
  const [selectedCategory, setSelectedCategory] = useState(() => getInitialValue("category", "suko_newin_cat", "all").toLowerCase());
  const [selectedSize, setSelectedSize] = useState(() => getInitialValue("size", "suko_newin_size", "all"));
  const [selectedColour, setSelectedColour] = useState(() => getInitialValue("colour", "suko_newin_colour", "all"));
  const [selectedSort, setSelectedSort] = useState(() => getInitialValue("sort", "suko_newin_sort", "newest"));

  // Mobile Drawers
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  // Synchronize filter states to URL search parameters & sessionStorage
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    sessionStorage.setItem("suko_newin_cat", selectedCategory);
    sessionStorage.setItem("suko_newin_size", selectedSize);
    sessionStorage.setItem("suko_newin_colour", selectedColour);
    sessionStorage.setItem("suko_newin_sort", selectedSort);

    const newParams = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all") newParams.set("category", selectedCategory);
    if (selectedSize && selectedSize !== "all") newParams.set("size", selectedSize);
    if (selectedColour && selectedColour !== "all") newParams.set("colour", selectedColour);
    if (selectedSort && selectedSort !== "newest") newParams.set("sort", selectedSort);

    setSearchParams(newParams, { replace: true });
  }, [selectedCategory, selectedSize, selectedColour, selectedSort, setSearchParams]);

  // Synchronize state with URL search params if changed externally (e.g. Back/Forward)
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat !== null) setSelectedCategory(cat.toLowerCase());

    const size = searchParams.get("size");
    if (size !== null) setSelectedSize(size);

    const col = searchParams.get("colour");
    if (col !== null) setSelectedColour(col);

    const sort = searchParams.get("sort");
    if (sort !== null) setSelectedSort(sort);
  }, [searchParams]);

  // Lock background scroll when mobile drawers are open
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Filter strictly within products where is_new_arrival = true
  const filteredProducts = useMemo(() => {
    let list = productsList.filter((p) => {
      // 1. Must be an Active storefront product
      const status = (p.status || "active").toLowerCase();
      if (status !== "active" && status !== "published") return false;

      // 2. Merchandising Rule: FEATURE IN NEW ARRIVALS must be ON
      const isNewArrival = Boolean(p.is_new_arrival ?? p.isNew);
      if (!isNewArrival) return false;

      // 3. Exclusively Women Luxury Corporate Wear
      if (p.gender === "male" || p.gender === "men") return false;

      // 4. Canonical Category Filter
      if (selectedCategory !== "all") {
        const cat = (p.category || "").toLowerCase();
        const catName = (p.categoryName || "").toLowerCase();
        const pCatId = String(p.category_id || p.category?.id || p.category?.slug || "").toLowerCase();
        const pSub = (p.subCategory || p.sub_category || "").toLowerCase();
        const pName = (p.name || "").toLowerCase();
        const selCat = selectedCategory.toLowerCase();

        if (selCat === "suits") {
          const isSuit = (cat === "suits" || catName.includes("power suit") || catName.includes("suit") || pCatId === "suits" || pSub.includes("suit") || pName.includes("suit")) && pCatId !== "signatures" && cat !== "signatures";
          if (!isSuit) return false;
        } else if (selCat === "blazers") {
          const isBlazer = cat === "blazers" || catName.includes("blazer") || pCatId === "blazers" || pSub.includes("blazer") || pName.includes("blazer");
          if (!isBlazer) return false;
        } else if (selCat === "trousers") {
          const isTrouser = cat === "trousers" || catName.includes("trouser") || pCatId === "trousers" || pSub.includes("trouser") || pSub.includes("pant") || pName.includes("trouser") || pName.includes("pant");
          if (!isTrouser) return false;
        } else if (selCat === "coords" || selCat === "coord" || selCat === "co-ords") {
          const isCoord = (cat === "coords" || cat === "waistcoats" || catName.includes("co-ord") || catName.includes("vest") || catName.includes("waistcoat") || pCatId === "coords" || pSub.includes("coord") || pSub.includes("vest") || pSub.includes("waistcoat") || pName.includes("vest") || pName.includes("waistcoat") || pName.includes("co-ord")) && pCatId !== "signatures" && cat !== "signatures";
          if (!isCoord) return false;
        } else if (selCat === "signatures" || selCat === "signature") {
          const isSignature = pCatId === "signatures" || cat === "signatures" || p.badge?.toLowerCase().includes("signature") || (p.price && p.price >= 76000) || pName.includes("signature");
          if (!isSignature) return false;
        } else {
          const isMatch = pCatId === selCat || cat === selCat || catName === selCat || catName.includes(selCat);
          if (!isMatch) return false;
        }
      }

      // 5. Size Filter
      if (selectedSize !== "all" && p.sizes) {
        const hasSize = p.sizes.some((s) => s.toLowerCase() === selectedSize.toLowerCase());
        if (!hasSize) return false;
      }

      // 6. Colour Filter
      if (selectedColour !== "all") {
        const prodColor = (p.color || "").toLowerCase();
        const selCol = selectedColour.toLowerCase();
        if (prodColor !== selCol && !prodColor.includes(selCol)) return false;
      }

      return true;
    });

    // Sorting
    if (selectedSort === "price-low" || selectedSort === "price-asc") {
      list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (selectedSort === "price-high" || selectedSort === "price-desc") {
      list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else {
      // Newest first
      list = [...list].sort((a, b) => {
        const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
        const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
        return timeB - timeA;
      });
    }

    return list;
  }, [productsList, selectedCategory, selectedSize, selectedColour, selectedSort]);

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedSize("all");
    setSelectedColour("all");
    setSelectedSort("newest");

    sessionStorage.removeItem("suko_newin_cat");
    sessionStorage.removeItem("suko_newin_size");
    sessionStorage.removeItem("suko_newin_colour");
    sessionStorage.removeItem("suko_newin_sort");

    setSearchParams({}, { replace: true });
  };

  const activeFiltersCount = (selectedSize !== "all" ? 1 : 0) + (selectedColour !== "all" ? 1 : 0);

  return (
    <div 
      data-testid="new-in-page"
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white min-h-screen transition-colors duration-300"
    >
      <SEO 
        title="New In — Latest Luxury Corporate Wear | SUKO Atelier"
        description="Explore the newest arrivals of bespoke power suits, sculpted blazers, and architectural executive co-ords in our New In edit."
      />

      {/* Hero Header */}
      <div className="pt-28 sm:pt-36 lg:pt-40 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-14 xl:px-16 text-center max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2.5 mb-2.5 sm:mb-3.5">
          <span className="w-4 h-[1px] bg-[#C2922E]" />
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-[#C2922E] font-medium">
            THE LATEST ARRIVALS
          </span>
          <span className="w-4 h-[1px] bg-[#C2922E]" />
        </div>

        <h1 className="font-quiche text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#111113] font-light mb-3">
          New In
        </h1>

        <p className="text-xs sm:text-[14px] text-[#555560] font-light tracking-wide max-w-xl mx-auto leading-relaxed">
          The newest additions to the SUKO wardrobe &mdash; considered tailoring for the moments ahead.
        </p>
      </div>

      {/* Canonical Category Navigation Bar matching Collections */}
      <div className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-y border-[#E8E4DC] py-3.5 px-4 sm:px-6 lg:px-14 xl:px-16 transition-all duration-300 font-body">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
          
          {/* Canonical Category Tabs */}
          <div className="flex items-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar scroll-smooth py-1">
            {NEW_ARRIVALS_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`group relative py-1 px-1 text-[10.5px] sm:text-[11px] uppercase whitespace-nowrap transition-all focus-visible:outline-none cursor-pointer tracking-[0.18em] ${
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

          {/* Right Actions: Filter & Sort */}
          <div className="flex items-center gap-5 shrink-0">
            {/* Filter Trigger */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] font-medium text-[#121215] hover:text-[#C2922E] transition-colors cursor-pointer"
            >
              <SlidersHorizontal size={11} strokeWidth={1.5} />
              <span>FILTER {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className={`flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] font-medium transition-colors cursor-pointer ${
                  sortDropdownOpen || selectedSort !== "newest" ? "text-[#C2922E]" : "text-[#121215] hover:text-[#C2922E]"
                }`}
              >
                <ArrowUpDown size={11} strokeWidth={1.5} />
                <span className="hidden sm:inline">SORT BY</span>
              </button>

              {sortDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-[220px] bg-[#FAF8F5] border border-[#E8E4DC] shadow-[0_10px_30px_rgba(18,18,21,0.08)] rounded-[2px] z-50 p-1.5 text-left animate-in fade-in zoom-in-95 duration-150">
                  <div className="py-0.5 space-y-0.5">
                    {[
                      { id: "newest", label: "Newest First" },
                      { id: "price-low", label: "Price: Low to High" },
                      { id: "price-high", label: "Price: High to Low" }
                    ].map((opt) => {
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

            <span className="text-[10px] uppercase tracking-[0.18em] text-[#746F68] hidden md:inline">
              {filteredProducts.length} {filteredProducts.length === 1 ? "PIECE" : "PIECES"}
            </span>
          </div>

        </div>
      </div>

      {/* Editorial Merchandising Presentation (Asymmetric 1-Featured + 4-Small + Continuation) */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-14 xl:px-16 pt-8 sm:pt-12 pb-20 sm:pb-28">
        {filteredProducts.length === 0 ? (
          <div className="py-24 sm:py-32 text-center max-w-md mx-auto px-5 font-body">
            <h3 className="font-quiche text-2xl sm:text-3xl font-light text-[#111113] mb-2.5">
              No silhouettes match this filter
            </h3>
            <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed mb-6">
              Try resetting your selected filters or exploring our complete executive collection.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#111113] text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#C2922E] transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : filteredProducts.length < 5 ? (
          /* Low product count (< 5): Clean symmetrical grid without gaps */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 items-stretch">
            {filteredProducts.map((prod, idx) => (
              <ProductCard
                key={prod.id || prod.slug || idx}
                product={prod}
                index={idx}
                isFeatured={false}
              />
            ))}
          </div>
        ) : (
          /* 5+ Products: Asymmetric Luxury Editorial Merchandising Composition */
          <div className="space-y-12 sm:space-y-16">
            
            {/* Opening 5-Item Editorial Composition */}
            {/* Desktop (lg+): 1 Large 4:5 Card on Left (~50%) + 2x2 Grid on Right (~50%) */}
            {/* Mobile (< lg): Dominant 4:5 Card first, followed by clean 2-col product grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7 lg:gap-8 items-stretch">
              
              {/* Left Column: Featured Arrival (1 Large Dominant 4:5 Card, ~50% desktop width) */}
              <div className="lg:col-span-6 h-full flex flex-col">
                <ProductCard
                  product={filteredProducts[0]}
                  index={0}
                  isFeatured={true}
                  className="h-full"
                />
              </div>

              {/* Right Column: 2x2 Grid of 4 Smaller Products (~50% desktop width) */}
              <div className="lg:col-span-6 grid grid-cols-2 gap-x-3.5 sm:gap-x-5 lg:gap-x-6 gap-y-6 sm:gap-y-8">
                {filteredProducts.slice(1, 5).map((prod, pIdx) => (
                  <ProductCard
                    key={prod.id || prod.slug || pIdx}
                    product={prod}
                    index={pIdx + 1}
                    isFeatured={false}
                  />
                ))}
              </div>

            </div>

            {/* Continuation for Products Beyond the First 5 */}
            {filteredProducts.length > 5 && (
              <div className="border-t border-[#E8E4DC] pt-10 sm:pt-14">
                <div className="mb-6 sm:mb-8 text-left">
                  <span className="text-[10px] uppercase tracking-[0.26em] text-[#8C887B] font-medium">
                    MORE RECENT ARRIVALS
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 items-stretch">
                  {filteredProducts.slice(5).map((prod, remIdx) => (
                    <ProductCard
                      key={prod.id || prod.slug || remIdx}
                      product={prod}
                      index={remIdx + 5}
                      isFeatured={false}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Editorial Explore Master Collection Banner */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-14 xl:px-16 pb-10 sm:pb-14 text-center">
        <div className="border-t border-[#E8E4DC] pt-8 sm:pt-10 pb-2 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="w-4 h-[1px] bg-[#C2922E]" />
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.32em] text-[#C2922E] font-medium">
              THE ATELIER WARDROBE
            </span>
            <span className="w-4 h-[1px] bg-[#C2922E]" />
          </div>

          <h3 className="font-quiche text-2xl sm:text-3xl lg:text-4xl font-light text-[#121215] mb-3">
            Explore The Complete Collection
          </h3>

          <p className="text-xs sm:text-sm text-[#666672] font-light max-w-md mx-auto mb-8 leading-relaxed">
            Discover our full curation of bespoke power suits, sculpted waistcoats, and architectural separates tailored for modern authority.
          </p>

          <div>
            <Link
              to="/collection"
              className="group relative inline-block pt-1 pb-1.5 select-none focus-visible:outline-none cursor-pointer"
            >
              <span className="text-[12px] sm:text-[13.5px] lg:text-[14px] uppercase tracking-[0.20em] sm:tracking-[0.24em] font-medium text-[#121215] group-hover:text-[#C2922E] transition-colors duration-300 block">
                EXPLORE THE COMPLETE COLLECTION &rarr;
              </span>
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30 group-hover:bg-[#C2922E]/40 transition-colors duration-300" />
              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#121215] group-hover:bg-[#C2922E] transform origin-left scale-x-0 group-hover:scale-x-100 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        categories={NEW_ARRIVALS_CATEGORIES}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        selectedColour={selectedColour}
        setSelectedColour={setSelectedColour}
        onClearAll={clearAllFilters}
        resultsCount={filteredProducts.length}
      />

      {/* Sort Sheet for Mobile */}
      <SortSheet
        isOpen={mobileSortOpen}
        onClose={() => setMobileSortOpen(false)}
        selectedSort={selectedSort}
        setSelectedSort={setSelectedSort}
      />

      {/* Service Strip */}
      <ServiceStrip />
    </div>
  );
};

export default NewIn;
