import React from "react";
import { ChevronDown, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { CATEGORIES, SIZES, COLOURS } from "../../data/products";

export const StickyFilterBar = ({
  selectedCategory,
  setSelectedCategory,
  selectedSize,
  setSelectedSize,
  selectedColour,
  setSelectedColour,
  selectedSort,
  setSelectedSort,
  openDropdown,
  setOpenDropdown,
  onOpenMobileFilter,
  onOpenMobileSort,
  totalResults
}) => {
  const sortLabels = {
    "newest": "Newest",
    "price-low": "Price: Low to High",
    "price-high": "Price: High to Low"
  };

  const getCategoryLabel = () => {
    if (selectedCategory === "all") return "All Categories";
    const found = CATEGORIES.find(c => c.slug === selectedCategory);
    return found ? found.name : selectedCategory.toUpperCase();
  };

  const getColourLabel = () => {
    if (selectedColour === "all") return "All Colours";
    const found = COLOURS.find(c => (c.name || c.label || c.id || "").toLowerCase() === selectedColour.toLowerCase());
    return found ? (found.name || found.label) : selectedColour;
  };

  return (
    <div className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-y border-[#E8E4DC] py-3.5 px-4 sm:px-6 lg:px-14 xl:px-16 transition-all duration-300 font-body">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        
        {/* Desktop Filter Pills */}
        <div className="hidden lg:flex items-center gap-3 filter-dropdown-container">
          {/* Category Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === "category" ? null : "category")}
              className={`px-4 py-2 text-[11px] uppercase tracking-[0.16em] border flex items-center gap-2 transition-all ${
                selectedCategory !== "all"
                  ? "bg-[#111113] text-white border-[#111113]"
                  : "bg-[#F3EFE6] text-[#44444C] border-[#E8E4DC] hover:border-[#111113]"
              }`}
            >
              <span>{getCategoryLabel()}</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${openDropdown === "category" ? "rotate-180" : ""}`} />
            </button>

            {openDropdown === "category" && (
              <div className="absolute top-full left-0 mt-1.5 w-48 bg-[#FAF8F5] border border-[#E8E4DC] shadow-xl py-1 z-50 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-4 py-2 text-left text-[11px] uppercase tracking-wider transition-colors ${
                    selectedCategory === "all" ? "bg-[#111113] text-white" : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                  }`}
                >
                  All Categories
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.slug);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-4 py-2 text-left text-[11px] uppercase tracking-wider transition-colors ${
                      selectedCategory === cat.slug ? "bg-[#111113] text-white" : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Size Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === "size" ? null : "size")}
              className={`px-4 py-2 text-[11px] uppercase tracking-[0.16em] border flex items-center gap-2 transition-all ${
                selectedSize !== "all"
                  ? "bg-[#111113] text-white border-[#111113]"
                  : "bg-[#F3EFE6] text-[#44444C] border-[#E8E4DC] hover:border-[#111113]"
              }`}
            >
              <span>{selectedSize === "all" ? "Size" : `Size: ${selectedSize}`}</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${openDropdown === "size" ? "rotate-180" : ""}`} />
            </button>

            {openDropdown === "size" && (
              <div className="absolute top-full left-0 mt-1.5 w-36 bg-[#FAF8F5] border border-[#E8E4DC] shadow-xl py-1 z-50 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSize("all");
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-4 py-2 text-left text-[11px] uppercase tracking-wider transition-colors ${
                    selectedSize === "all" ? "bg-[#111113] text-white" : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                  }`}
                >
                  All Sizes
                </button>
                {SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => {
                      setSelectedSize(sz);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-4 py-2 text-left text-[11px] uppercase tracking-wider transition-colors ${
                      selectedSize === sz ? "bg-[#111113] text-white" : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Colour Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === "colour" ? null : "colour")}
              className={`px-4 py-2 text-[11px] uppercase tracking-[0.16em] border flex items-center gap-2 transition-all ${
                selectedColour !== "all"
                  ? "bg-[#111113] text-white border-[#111113]"
                  : "bg-[#F3EFE6] text-[#44444C] border-[#E8E4DC] hover:border-[#111113]"
              }`}
            >
              <span>{getColourLabel()}</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${openDropdown === "colour" ? "rotate-180" : ""}`} />
            </button>

            {openDropdown === "colour" && (
              <div className="absolute top-full left-0 mt-1.5 w-52 bg-[#FAF8F5] border border-[#E8E4DC] shadow-xl py-1 z-50 animate-in fade-in duration-150 max-h-72 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedColour("all");
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-4 py-2 text-left text-[11px] uppercase tracking-wider transition-colors ${
                    selectedColour === "all" ? "bg-[#111113] text-white" : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                  }`}
                >
                  All Colours
                </button>
                {COLOURS.map((col) => {
                  const colName = col.name || col.label || col.id;
                  const isSelected = selectedColour.toLowerCase() === colName.toLowerCase();
                  return (
                    <button
                      key={colName}
                      type="button"
                      onClick={() => {
                        setSelectedColour(colName);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-4 py-2 text-left text-[11px] uppercase tracking-wider flex items-center gap-2.5 transition-colors ${
                        isSelected ? "bg-[#111113] text-white font-medium" : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0 border border-black/20"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span className="truncate">{colName}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter & Sort Triggers */}
        <div className="flex lg:hidden items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={onOpenMobileFilter}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#F3EFE6] border border-[#E8E4DC] text-xs uppercase tracking-[0.18em] font-medium flex items-center justify-center gap-2 text-[#111113]"
          >
            <SlidersHorizontal size={13} />
            <span>Filter</span>
          </button>
          <button
            type="button"
            onClick={onOpenMobileSort}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-[#F3EFE6] border border-[#E8E4DC] text-xs uppercase tracking-[0.18em] font-medium flex items-center justify-center gap-2 text-[#111113]"
          >
            <ArrowUpDown size={13} />
            <span>Sort</span>
          </button>
        </div>

        {/* Right Info: Item Count & Sort (Desktop) */}
        <div className="hidden lg:flex items-center gap-5 filter-dropdown-container">
          <span className="text-xs text-[#555560] font-light">
            {totalResults} {totalResults === 1 ? "silhouette" : "silhouettes"}
          </span>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
              className="px-4 py-2 text-[11px] uppercase tracking-[0.16em] bg-[#F3EFE6] border border-[#E8E4DC] text-[#111113] hover:border-[#111113] flex items-center gap-2 transition-all"
            >
              <span>Sort: {sortLabels[selectedSort]}</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${openDropdown === "sort" ? "rotate-180" : ""}`} />
            </button>

            {openDropdown === "sort" && (
              <div className="absolute top-full right-0 mt-1.5 w-48 bg-[#FAF8F5] border border-[#E8E4DC] shadow-xl py-1 z-50 animate-in fade-in duration-150">
                {Object.entries(sortLabels).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSelectedSort(id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full px-4 py-2 text-left text-[11px] uppercase tracking-wider transition-colors ${
                      selectedSort === id ? "bg-[#111113] text-white" : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
