import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
  const categoryParam = searchParams.get("category") || "all";

  const { products: storeProducts } = useProducts();
  const productsList = storeProducts && storeProducts.length > 0 ? storeProducts : FALLBACK_PRODUCTS;

  // Active Filter States (Default to Women luxury corporate wear)
  const [selectedCategory, setSelectedCategory] = useState(categoryParam.toLowerCase());
  const [selectedSize, setSelectedSize] = useState("all");
  const [selectedColour, setSelectedColour] = useState("all");
  const [selectedSort, setSelectedSort] = useState("newest");

  // Dropdown UI Open States
  const [openDropdown, setOpenDropdown] = useState(null); // 'category' | 'size' | 'colour' | 'sort' | null

  // Mobile Drawers
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  // Synchronize state with URL search params if changed externally
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam.toLowerCase());
    }
  }, [categoryParam]);

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
      list = [...list].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return list;
  }, [productsList, selectedCategory, selectedSize, selectedColour, selectedSort]);

  // Group displayed items into 5-item asymmetric editorial blocks (1 Large Feature + 4 Standard)
  const editorialBlocks = useMemo(() => {
    const blocks = [];
    for (let i = 0; i < filteredProducts.length; i += 5) {
      const chunk = filteredProducts.slice(i, i + 5);
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
  }, [filteredProducts]);

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedSize("all");
    setSelectedColour("all");
    setSelectedSort("newest");
    setOpenDropdown(null);
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

      {/* Asymmetric Editorial Product Grid */}
      <EditorialGrid
        editorialBlocks={editorialBlocks}
        totalResults={filteredProducts.length}
        onClearFilters={clearAllFilters}
      />

      {/* Mobile Modals */}
      <FilterDrawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
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
