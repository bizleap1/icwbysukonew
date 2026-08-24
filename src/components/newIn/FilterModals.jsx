import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { CATEGORIES, SIZES, COLOURS } from "../../data/products";

export const FilterDrawer = ({
  isOpen,
  onClose,
  selectedCategory,
  setSelectedCategory,
  selectedSize,
  setSelectedSize,
  selectedColour,
  setSelectedColour,
  onClearAll,
  resultsCount
}) => {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative w-full max-w-md bg-[#FAF8F5] h-full shadow-2xl flex flex-col justify-between z-10 overflow-hidden font-body"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#E8E4DC] flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#C2922E] font-medium block mb-1">
                  FILTERS
                </span>
                <h3 className="font-quiche text-xl text-[#111113] font-light">
                  Refine Curation
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filter drawer"
                className="w-9 h-9 rounded-full bg-[#F3EFE6] border border-[#E8E4DC] flex items-center justify-center text-[#111113] hover:text-[#C2922E] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Filters */}
            <div className="p-5 sm:p-6 space-y-7 overflow-y-auto flex-1">
              {/* Category */}
              <div>
                <h4 className="text-xs uppercase tracking-[0.22em] text-[#111113] font-semibold mb-3">
                  Category
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`px-3.5 py-2 text-xs uppercase tracking-wider border transition-all ${
                      selectedCategory === "all"
                        ? "bg-[#111113] text-white border-[#111113]"
                        : "bg-[#F3EFE6] text-[#555560] border-[#E8E4DC] hover:border-[#111113]"
                    }`}
                  >
                    All Categories
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`px-3.5 py-2 text-xs uppercase tracking-wider border transition-all ${
                        selectedCategory === cat.slug
                          ? "bg-[#111113] text-white border-[#111113]"
                          : "bg-[#F3EFE6] text-[#555560] border-[#E8E4DC] hover:border-[#111113]"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <h4 className="text-xs uppercase tracking-[0.22em] text-[#111113] font-semibold mb-3">
                  Size
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSize("all")}
                    className={`px-3.5 py-2 text-xs uppercase tracking-wider border transition-all ${
                      selectedSize === "all"
                        ? "bg-[#111113] text-white border-[#111113]"
                        : "bg-[#F3EFE6] text-[#555560] border-[#E8E4DC] hover:border-[#111113]"
                    }`}
                  >
                    All
                  </button>
                  {SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`w-10 h-10 flex items-center justify-center text-xs font-medium border transition-all ${
                        selectedSize === sz
                          ? "bg-[#111113] text-white border-[#111113]"
                          : "bg-[#F3EFE6] text-[#555560] border-[#E8E4DC] hover:border-[#111113]"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colour */}
              <div>
                <h4 className="text-xs uppercase tracking-[0.22em] text-[#111113] font-semibold mb-3">
                  Colour
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedColour("all")}
                    className={`px-3.5 py-2 text-xs uppercase tracking-wider border transition-all ${
                      selectedColour === "all"
                        ? "bg-[#111113] text-white border-[#111113]"
                        : "bg-[#F3EFE6] text-[#555560] border-[#E8E4DC] hover:border-[#111113]"
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
                        onClick={() => setSelectedColour(colName)}
                        className={`px-3.5 py-2 text-xs uppercase tracking-wider border flex items-center gap-2 transition-all ${
                          isSelected
                            ? "bg-[#111113] text-white border-[#111113]"
                            : "bg-[#F3EFE6] text-[#555560] border-[#E8E4DC] hover:border-[#111113]"
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: col.hex }} />
                        <span>{colName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 sm:p-6 border-t border-[#E8E4DC] bg-[#F3EFE6] flex items-center gap-3">
              <button
                type="button"
                onClick={onClearAll}
                className="flex-1 py-3 text-xs uppercase tracking-[0.2em] font-medium border border-[#111113] text-[#111113] hover:bg-[#FAF8F5] transition-colors"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-[2] py-3 text-xs uppercase tracking-[0.2em] font-medium bg-[#111113] text-white hover:bg-[#C2922E] transition-colors"
              >
                Show Results ({resultsCount})
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const SortSheet = ({
  isOpen,
  onClose,
  selectedSort,
  setSelectedSort
}) => {
  if (typeof document === "undefined") return null;

  const sortOptions = [
    { id: "newest", label: "Newest Additions" },
    { id: "price-low", label: "Price: Low to High" },
    { id: "price-high", label: "Price: High to Low" }
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#FAF8F5] rounded-t-2xl shadow-2xl z-10 overflow-hidden font-body p-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E4DC] mb-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#C2922E] font-medium block mb-1">
                  SORT
                </span>
                <h3 className="font-quiche text-lg text-[#111113] font-light">
                  Order Collection By
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sort sheet"
                className="w-8 h-8 rounded-full bg-[#F3EFE6] border border-[#E8E4DC] flex items-center justify-center text-[#111113]"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-1.5 pb-2">
              {sortOptions.map((opt) => {
                const isSelected = selectedSort === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedSort(opt.id);
                      onClose();
                    }}
                    className={`w-full p-3.5 text-left text-xs uppercase tracking-wider flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-[#111113] text-white font-medium"
                        : "text-[#555560] hover:bg-[#F3EFE6] hover:text-[#111113]"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={14} className="text-[#C2922E]" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
