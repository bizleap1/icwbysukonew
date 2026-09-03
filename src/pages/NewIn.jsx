import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link, useSearchParams, useLocation, useNavigationType } from "react-router-dom";
import { useLenis } from "lenis/react";
import SEO from "../components/SEO";
import { useProducts } from "../context/ProductContext";
import { PRODUCTS as FALLBACK_PRODUCTS } from "../data/products";
import { StickyFilterBar } from "../components/newIn/StickyFilterBar";
import { FilterDrawer, SortSheet } from "../components/newIn/FilterModals";
import { EditorialGrid } from "../components/newIn/EditorialGrid";
import ServiceStrip from "../components/home/ServiceStrip";

const NewIn = () => {
  const lenis = useLenis();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navType = useNavigationType();

  // Helper to read initial state: priority order: URL search params -> sessionStorage -> default
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
  const productsList = storeProducts && storeProducts.length > 0 ? storeProducts : FALLBACK_PRODUCTS;

  // Active Filter States (persisted across navigation and back-button)
  const [selectedCategory, setSelectedCategory] = useState(() => getInitialValue("category", "suko_newin_cat", "all").toLowerCase());
  const [selectedSubCategory, setSelectedSubCategory] = useState(() => getInitialValue("subcat", "suko_newin_subcat", "all").toLowerCase());
  const [selectedSize, setSelectedSize] = useState(() => getInitialValue("size", "suko_newin_size", "all"));
  const [selectedColour, setSelectedColour] = useState(() => getInitialValue("colour", "suko_newin_colour", "all"));
  const [selectedSort, setSelectedSort] = useState(() => getInitialValue("sort", "suko_newin_sort", "newest"));

  // Dropdown UI Open States
  const [openDropdown, setOpenDropdown] = useState(null); // 'category' | 'size' | 'colour' | 'sort' | null

  // Mobile Drawers
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  // Synchronize filter states to URL search parameters & sessionStorage
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    sessionStorage.setItem("suko_newin_cat", selectedCategory);
    sessionStorage.setItem("suko_newin_subcat", selectedSubCategory);
    sessionStorage.setItem("suko_newin_size", selectedSize);
    sessionStorage.setItem("suko_newin_colour", selectedColour);
    sessionStorage.setItem("suko_newin_sort", selectedSort);

    const newParams = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all") newParams.set("category", selectedCategory);
    if (selectedSubCategory && selectedSubCategory !== "all") newParams.set("subcat", selectedSubCategory);
    if (selectedSize && selectedSize !== "all") newParams.set("size", selectedSize);
    if (selectedColour && selectedColour !== "all") newParams.set("colour", selectedColour);
    if (selectedSort && selectedSort !== "newest") newParams.set("sort", selectedSort);

    setSearchParams(newParams, { replace: true });
  }, [selectedCategory, selectedSubCategory, selectedSize, selectedColour, selectedSort, setSearchParams]);

  // Synchronize state with URL search params if changed externally (e.g. Back/Forward)
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat !== null) setSelectedCategory(cat.toLowerCase());

    const subcat = searchParams.get("subcat");
    if (subcat !== null) setSelectedSubCategory(subcat.toLowerCase());

    const size = searchParams.get("size");
    if (size !== null) setSelectedSize(size);

    const col = searchParams.get("colour");
    if (col !== null) setSelectedColour(col);

    const sort = searchParams.get("sort");
    if (sort !== null) setSelectedSort(sort);
  }, [searchParams]);

  // Track active scroll position continuously to sessionStorage
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY || (lenis ? lenis.scroll : 0);
      if (scrollY > 50) {
        sessionStorage.setItem("suko_newin_scroll_pos", scrollY.toString());
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lenis]);

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
      // Exclusively Women Luxury Corporate Wear
      if (p.gender === "male" || p.gender === "men") return false;

      // Category Filter
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
            } else if (sub === "trousers" || sub === "trouser" || sub === "pants") {
              if (!pSub.includes("trouser") && !pSub.includes("pant")) return false;
            } else if (sub === "skirts" || sub === "skirt") {
              if (!pSub.includes("skirt")) return false;
            }
          }
        }
      }

      // Size Filter (Case-insensitive)
      if (selectedSize !== "all" && p.sizes) {
        const hasSize = p.sizes.some((s) => s.toLowerCase() === selectedSize.toLowerCase());
        if (!hasSize) return false;
      }

      // Colour Filter (Matches primary silhouette color)
      if (selectedColour !== "all") {
        const prodColor = (p.color || "").toLowerCase();
        const selCol = selectedColour.toLowerCase();
        if (prodColor !== selCol && !prodColor.includes(selCol)) return false;
      }

      return true;
    });

    // Sorting
    if (selectedSort === "price-low") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (selectedSort === "price-high") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else {
      list = [...list].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return list;
  }, [productsList, selectedCategory, selectedSubCategory, selectedSize, selectedColour, selectedSort]);

  // Handle click on any product card in the grid to remember position & target card
  const handleGridClick = (e) => {
    const card = e.target.closest("[data-testid^='product-card-']");
    if (card) {
      const scrollY = window.scrollY || (lenis ? lenis.scroll : 0);
      sessionStorage.setItem("suko_newin_scroll_pos", scrollY.toString());
      const prodId = card.getAttribute("data-testid")?.replace("product-card-", "");
      if (prodId) {
        sessionStorage.setItem("suko_newin_target_product", prodId);
      }
    }
  };

  // Restore scroll or target product card position when returning to the page
  const hasRestoredScrollRef = useRef(false);

  useEffect(() => {
    const savedScrollPos = sessionStorage.getItem("suko_newin_scroll_pos");
    const targetProductId = sessionStorage.getItem("suko_newin_target_product");

    if (!hasRestoredScrollRef.current && (savedScrollPos || targetProductId)) {
      const targetY = savedScrollPos ? parseFloat(savedScrollPos) : 0;
      let attempts = 0;
      const maxAttempts = 12;

      const attemptScrollRestore = () => {
        attempts++;
        const targetEl = targetProductId ? document.querySelector(`[data-testid="product-card-${targetProductId}"]`) : null;

        if (targetEl) {
          targetEl.scrollIntoView({ block: "center", behavior: "instant" });
          hasRestoredScrollRef.current = true;
          sessionStorage.removeItem("suko_newin_target_product");
          sessionStorage.removeItem("suko_newin_scroll_pos");
          return;
        }

        if (targetY > 0 && document.body.scrollHeight >= targetY + 100) {
          if (lenis) {
            lenis.scrollTo(targetY, { immediate: true });
          } else {
            window.scrollTo({ top: targetY, behavior: "instant" });
          }
          hasRestoredScrollRef.current = true;
          sessionStorage.removeItem("suko_newin_target_product");
          sessionStorage.removeItem("suko_newin_scroll_pos");
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(attemptScrollRestore, 50);
        }
      };

      const timer = setTimeout(attemptScrollRestore, 40);
      return () => clearTimeout(timer);
    }
  }, [filteredProducts.length, lenis]);

  // Curated 4 Grand Editorial Showcase Blocks for default showcase
  const CURATED_DEFAULT_BLOCKS = [
    {
      feature: "the-plum-sculpted-suit",
      small: [
        "the-plum-sculpted-double-breasted-blazer",
        "the-plum-sculpted-trousers",
        "the-aubergine-asymmetric-wrap-vest",
        "the-aubergine-tailored-mini-skirt"
      ]
    },
    {
      feature: "the-midnight-peplum-set",
      small: [
        "the-midnight-contour-jacket",
        "the-midnight-flare-skirt",
        "the-midnight-sculpted-vest",
        "the-midnight-column-skirt"
      ]
    },
    {
      feature: "the-noir-tailored-suit",
      small: [
        "the-noir-tailored-blazer",
        "the-noir-tailored-trousers",
        "the-aubergine-draped-blazer",
        "the-aubergine-tailored-wide-leg-trousers"
      ]
    },
    {
      feature: "the-lilac-flare-suit",
      small: [
        "the-lilac-sculpted-flare-blazer",
        "the-lilac-flare-trousers",
        "the-dusty-rose-embroidered-farchi-tunic",
        "the-dusty-rose-trousers"
      ]
    }
  ];

  // Group displayed items into 5-item asymmetric editorial blocks (1 Large Feature + 4 Standard)
  const editorialBlocks = useMemo(() => {
    const isDefaultView =
      selectedCategory === "all" &&
      selectedSubCategory === "all" &&
      selectedSize === "all" &&
      selectedColour === "all" &&
      selectedSort === "newest";

    if (isDefaultView && productsList && productsList.length > 0) {
      const blocks = [];
      let runningIndex = 0;

      // Build the 4 curated editorial blocks exclusively (no extra trailing blocks)
      CURATED_DEFAULT_BLOCKS.forEach((cur, bIdx) => {
        const feat = productsList.find((p) => p.slug === cur.feature);
        const small = cur.small
          .map((s) => productsList.find((p) => p.slug === s))
          .filter(Boolean);

        blocks.push({
          id: `curated-editorial-block-${bIdx}`,
          type: bIdx % 2 === 0 ? "left-feature" : "right-feature",
          featureProduct: feat,
          smallProducts: small,
          allProducts: [feat, ...small].filter(Boolean),
          startIndex: runningIndex
        });
        runningIndex += 1 + small.length;
      });

      return blocks;
    }

    // Filtered / Sorted View: Standard 5-item chunks
    const blocks = [];
    for (let i = 0; i < filteredProducts.length; i += 5) {
      const chunk = filteredProducts.slice(i, i + 5);
      const isEvenBlock = blocks.length % 2 === 0;
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
  }, [filteredProducts, productsList, selectedCategory, selectedSubCategory, selectedSize, selectedColour, selectedSort]);

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedSubCategory("all");
    setSelectedSize("all");
    setSelectedColour("all");
    setSelectedSort("newest");
    setOpenDropdown(null);

    sessionStorage.removeItem("suko_newin_cat");
    sessionStorage.removeItem("suko_newin_subcat");
    sessionStorage.removeItem("suko_newin_size");
    sessionStorage.removeItem("suko_newin_colour");
    sessionStorage.removeItem("suko_newin_sort");

    setSearchParams({}, { replace: true });
  };

  return (
    <div 
      data-testid="new-in-page"
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white min-h-screen transition-colors duration-300"
    >
      <SEO 
        title="New In — Latest Luxury Corporate Wear"
        description="Explore the latest bespoke power suits, sculpted blazers, and architectural executive co-ords in our New In edit."
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
          The newest expressions of precision executive tailoring &mdash; tailored power suits, sculpted waistcoats, and coordinated sets.
        </p>
      </div>

      {/* Sticky Filter & Sort Bar */}
      <StickyFilterBar
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSubCategory={selectedSubCategory}
        setSelectedSubCategory={setSelectedSubCategory}
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        selectedColour={selectedColour}
        setSelectedColour={setSelectedColour}
        selectedSort={selectedSort}
        setSelectedSort={setSelectedSort}
        openDropdown={openDropdown}
        setOpenDropdown={setOpenDropdown}
        onOpenMobileFilter={() => setMobileFilterOpen(true)}
        onOpenMobileSort={() => setMobileSortOpen(true)}
        totalResults={filteredProducts.length}
      />

      {/* Asymmetric Editorial Product Grid with Click-Position Capture */}
      <div onClickCapture={handleGridClick}>
        <EditorialGrid
          editorialBlocks={editorialBlocks}
          products={filteredProducts}
          totalResults={filteredProducts.length}
          onClearFilters={clearAllFilters}
        />
      </div>

      {/* Editorial Explore Collection Action Banner */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-14 xl:px-16 pb-10 sm:pb-14 text-center">
        <div className="border-t border-[#E8E4DC] pt-6 sm:pt-8 pb-2 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="w-4 h-[1px] bg-[#C2922E]" />
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.32em] text-[#C2922E] font-medium">
              THE FULL REPERTOIRE
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
                EXPLORE COLLECTION
              </span>

              {/* Thin Base Line */}
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30 group-hover:bg-[#C2922E]/40 transition-colors duration-300" />

              {/* Animated Active Line on Hover */}
              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#121215] group-hover:bg-[#C2922E] transform origin-left scale-x-0 group-hover:scale-x-100 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Modals */}
      <FilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSubCategory={selectedSubCategory}
        setSelectedSubCategory={setSelectedSubCategory}
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        selectedColour={selectedColour}
        setSelectedColour={setSelectedColour}
        onClearAll={clearAllFilters}
        resultsCount={filteredProducts.length}
      />

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
