import React, { useState } from "react";
import { ChevronDown, ChevronRight, SlidersHorizontal, ArrowUpDown, Check } from "lucide-react";
import { CATEGORIES, SIZES, COLOURS } from "../../data/products";

export const StickyFilterBar = ({
  selectedCategory,
  setSelectedCategory,
  selectedSubCategory = "all",
  setSelectedSubCategory,
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
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const sortLabels = {
    "newest": "Newest",
    "price-low": "Price: Low to High",
    "price-high": "Price: High to Low"
  };

  const getCategoryLabel = () => {
    if (selectedCategory === "all") return "All Categories";
    const found = CATEGORIES.find(c => c.slug === selectedCategory);
    if (found) {
      if (selectedCategory === "separates" && selectedSubCategory && selectedSubCategory !== "all") {
        const subName = selectedSubCategory.charAt(0).toUpperCase() + selectedSubCategory.slice(1);
        return `Separates: ${subName}`;
      }
      return found.name;
    }
    return selectedCategory.toUpperCase();
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
              onClick={() => {
                setOpenDropdown(openDropdown === "category" ? null : "category");
                setOpenSubmenu(null);
              }}
              className={`px-4 py-2 text-[11px] uppercase tracking-[0.16em] border flex items-center gap-2 transition-all cursor-pointer ${
                selectedCategory !== "all"
                  ? "bg-[#FAF8F5] text-[#111113] border-[#C2922E] shadow-sm font-medium"
                  : "bg-[#F3EFE6] text-[#44444C] border-[#E8E4DC] hover:border-[#111113]"
              }`}
            >
              <span>{getCategoryLabel()}</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${openDropdown === "category" ? "rotate-180 text-[#C2922E]" : ""}`} />
            </button>

            {openDropdown === "category" && (
              <div 
                className="absolute top-full left-0 mt-1.5 w-60 bg-[#FAF8F5] border border-[#E8E4DC] shadow-xl py-1.5 z-50 animate-in fade-in duration-150"
                onMouseLeave={() => setOpenSubmenu(null)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    if (setSelectedSubCategory) setSelectedSubCategory("all");
                    setOpenDropdown(null);
                    setOpenSubmenu(null);
                  }}
                  onMouseEnter={() => setOpenSubmenu(null)}
                  className={`w-full px-4 py-2.5 text-left text-[11px] uppercase tracking-wider transition-colors flex items-center justify-between cursor-pointer ${
                    selectedCategory === "all"
                      ? "text-[#111113] font-semibold bg-[#EFECE6]"
                      : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                  }`}
                >
                  <span>All Categories</span>
                  {selectedCategory === "all" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" />
                  )}
                </button>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.slug;
                  const hasSub = cat.subcategories && cat.subcategories.length > 0;

                  if (hasSub) {
                    const isSubmenuOpen = openSubmenu === cat.slug;
                    return (
                      <div 
                        key={cat.id || cat.slug} 
                        className="relative group/sub"
                        onMouseEnter={() => setOpenSubmenu(cat.slug)}
                      >
                        <div
                          onClick={() => {
                            setSelectedCategory(cat.slug);
                            if (setSelectedSubCategory) setSelectedSubCategory("all");
                            setOpenDropdown(null);
                            setOpenSubmenu(null);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-[11px] uppercase tracking-wider transition-colors flex items-center justify-between cursor-pointer font-medium ${
                            isSelected
                              ? "text-[#111113] font-semibold bg-[#EFECE6]"
                              : isSubmenuOpen
                              ? "text-[#111113] bg-[#F3EFE6]"
                              : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{cat.name}</span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" />
                            )}
                          </div>
                          <ChevronRight 
                            size={12} 
                            className={`transition-colors shrink-0 ${
                              isSubmenuOpen || isSelected ? "text-[#C2922E]" : "text-[#777782] group-hover/sub:text-[#111113]"
                            }`} 
                          />
                        </div>

                        {/* Side Flyout Submenu ("Baju Mai") on Hover or Click */}
                        {isSubmenuOpen && (
                          <div 
                            className="absolute left-full top-0 ml-1 w-52 bg-[#FAF8F5] border border-[#E8E4DC] shadow-[0_12px_36px_rgba(18,18,21,0.12)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                            onMouseEnter={() => setOpenSubmenu(cat.slug)}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCategory(cat.slug);
                                if (setSelectedSubCategory) setSelectedSubCategory("all");
                                setOpenDropdown(null);
                                setOpenSubmenu(null);
                              }}
                              className={`w-full px-4 py-2 text-left text-[10.5px] uppercase tracking-wider transition-colors flex items-center justify-between cursor-pointer ${
                                isSelected && (!selectedSubCategory || selectedSubCategory === "all")
                                  ? "text-[#111113] font-semibold bg-[#EFECE6]"
                                  : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                              }`}
                            >
                              <span>All Separates</span>
                              {isSelected && (!selectedSubCategory || selectedSubCategory === "all") && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" />
                              )}
                            </button>

                            <div className="h-[1px] bg-[#E8E4DC]/80 my-1 mx-3" />

                            {cat.subcategories.map((sub) => {
                              const isSubSelected = isSelected && selectedSubCategory?.toLowerCase() === sub.toLowerCase();
                              return (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCategory(cat.slug);
                                    if (setSelectedSubCategory) setSelectedSubCategory(sub.toLowerCase());
                                    setOpenDropdown(null);
                                    setOpenSubmenu(null);
                                  }}
                                  className={`w-full px-4 py-2 text-left text-[10.5px] uppercase tracking-wider transition-colors flex items-center justify-between cursor-pointer ${
                                    isSubSelected
                                      ? "text-[#C2922E] font-semibold bg-[#EFECE6]"
                                      : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                                  }`}
                                >
                                  <span>{sub}</span>
                                  {isSubSelected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={cat.id || cat.slug}
                      type="button"
                      onMouseEnter={() => setOpenSubmenu(null)}
                      onClick={() => {
                        setSelectedCategory(cat.slug);
                        if (setSelectedSubCategory) setSelectedSubCategory("all");
                        setOpenDropdown(null);
                        setOpenSubmenu(null);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-[11px] uppercase tracking-wider transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "text-[#111113] font-semibold bg-[#EFECE6]"
                          : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                      }`}
                    >
                      <span>{cat.name}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" />
                      )}
                    </button>
                  );
                })}
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
              <div className="absolute top-full left-0 mt-1.5 w-40 bg-[#FAF8F5] border border-[#E8E4DC] shadow-xl py-1 z-50 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSize("all");
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-4 py-2 text-left text-[11px] uppercase tracking-wider transition-colors flex items-center justify-between cursor-pointer ${
                    selectedSize === "all"
                      ? "text-[#111113] font-semibold bg-[#EFECE6]"
                      : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                  }`}
                >
                  <span>All Sizes</span>
                  {selectedSize === "all" && (
                    <Check size={12} className="text-[#C2922E] shrink-0" />
                  )}
                </button>
                {SIZES.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setSelectedSize(sz);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-4 py-2 text-left text-[11px] uppercase tracking-wider transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "text-[#111113] font-semibold bg-[#EFECE6]"
                          : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                      }`}
                    >
                      <span>{sz}</span>
                      {isSelected && (
                        <Check size={12} className="text-[#C2922E] shrink-0" />
                      )}
                    </button>
                  );
                })}
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
              <div className="absolute top-full left-0 mt-1.5 w-56 bg-[#FAF8F5] border border-[#E8E4DC] shadow-xl py-1 z-50 animate-in fade-in duration-150 max-h-[380px] overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#C2922E]/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedColour("all");
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-4 py-2 text-left text-[11px] uppercase tracking-wider transition-colors flex items-center justify-between cursor-pointer ${
                    selectedColour === "all"
                      ? "text-[#111113] font-semibold bg-[#EFECE6]"
                      : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shrink-0 border border-[#111113]/30 bg-gradient-to-tr from-[#111113] via-[#C2922E] to-[#FAF8F5]" />
                    <span>All Colours</span>
                  </div>
                  {selectedColour === "all" && (
                    <Check size={12} className="text-[#C2922E] shrink-0" />
                  )}
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
                      className={`w-full px-4 py-2 text-left text-[11px] uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? "text-[#111113] font-semibold bg-[#EFECE6]"
                          : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-black/20"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span className="truncate">{colName}</span>
                      </div>
                      {isSelected && (
                        <Check size={12} className="text-[#C2922E] shrink-0 ml-2" />
                      )}
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
                {Object.entries(sortLabels).map(([id, label]) => {
                  const isSelected = selectedSort === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setSelectedSort(id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-4 py-2 text-left text-[11px] uppercase tracking-wider transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "text-[#111113] font-semibold bg-[#EFECE6]"
                          : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                      }`}
                    >
                      <span>{label}</span>
                      {isSelected && (
                        <Check size={12} className="text-[#C2922E] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
