import React, { useState } from "react";
import { Plus, Trash2, Check, AlertCircle, RefreshCw, Ruler } from "lucide-react";
import { toast } from "sonner";
import { sortGarmentSizes, DEFAULT_SIZE_GUIDE, NUMERIC_SIZE_GUIDE } from "../../utils/sizeUtils";

export const PRESET_OPTIONS = [
  { id: "atelier_alpha", label: "Atelier XS–XL", sizes: ["XS", "S", "M", "L", "XL"] },
  { id: "extended_alpha", label: "Extended XS–3XL", sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"] },
  { id: "tailored_numeric", label: "Tailored 38–46", sizes: ["38", "40", "42", "44", "46"] },
  { id: "extended_numeric", label: "Extended 36–48", sizes: ["36", "38", "40", "42", "44", "46", "48"] },
  { id: "free_size", label: "Free Size", sizes: ["Free Size"] },
];

export const ProductSizeInventoryManager = ({
  applicableSizes = [],
  setApplicableSizes,
  sizeStockMap = {},
  setSizeStockMap,
  sizeGuide = null,
  setSizeGuide,
  isDrawer = false
}) => {
  const [newSizeInput, setNewSizeInput] = useState("");
  const [batchQtyInput, setBatchQtyInput] = useState("");
  const [isCustomGuideActive, setIsCustomGuideActive] = useState(
    Array.isArray(sizeGuide) && sizeGuide.length > 0
  );

  // Calculate total units
  const totalUnits = (applicableSizes || []).reduce((sum, sz) => {
    return sum + (Math.max(0, Number(sizeStockMap[sz])) || 0);
  }, 0);

  // Handle preset application
  const applyPreset = (presetSizes) => {
    setApplicableSizes(presetSizes);
    const newMap = { ...sizeStockMap };
    presetSizes.forEach(sz => {
      if (newMap[sz] === undefined) {
        newMap[sz] = 5; // Default healthy stock
      }
    });
    setSizeStockMap(newMap);
    toast.success(`Applied ${presetSizes.join(", ")} sizing configuration`);
  };

  // Add a single custom size
  const handleAddCustomSize = (e) => {
    if (e) e.preventDefault();
    const raw = (newSizeInput || "").trim();
    if (!raw) return;

    const formatted = raw.length <= 4 && !/^\d+$/.test(raw) ? raw.toUpperCase() : raw;

    if (applicableSizes.some(s => s.toLowerCase() === formatted.toLowerCase())) {
      toast.error(`Size "${formatted}" is already in the list.`);
      return;
    }

    const nextSizes = sortGarmentSizes([...applicableSizes, formatted]);
    setApplicableSizes(nextSizes);
    setSizeStockMap(prev => ({
      ...prev,
      [formatted]: prev[formatted] !== undefined ? prev[formatted] : 5
    }));
    setNewSizeInput("");
    toast.success(`Added size ${formatted}`);
  };

  // Remove a size
  const handleRemoveSize = (sz) => {
    if (applicableSizes.length <= 1) {
      toast.error("At least one size must remain on the product.");
      return;
    }
    const nextSizes = applicableSizes.filter(s => s !== sz);
    setApplicableSizes(nextSizes);
    toast.info(`Removed size ${sz}`);
  };

  // Stock change
  const handleStockChange = (sz, val) => {
    const parsed = Math.max(0, parseInt(val, 10) || 0);
    setSizeStockMap(prev => ({
      ...prev,
      [sz]: parsed
    }));
  };

  // Quick mark sold out
  const handleMarkSoldOut = (sz) => {
    setSizeStockMap(prev => ({
      ...prev,
      [sz]: 0
    }));
  };

  // Quick make available
  const handleMakeAvailable = (sz, amount = 5) => {
    setSizeStockMap(prev => ({
      ...prev,
      [sz]: Math.max(1, amount)
    }));
  };

  // Batch fill all sizes
  const handleApplyBatchQty = () => {
    const parsed = Math.max(0, parseInt(batchQtyInput, 10) || 0);
    const newMap = { ...sizeStockMap };
    applicableSizes.forEach(sz => {
      newMap[sz] = parsed;
    });
    setSizeStockMap(newMap);
    setBatchQtyInput("");
    toast.success(`Set all sizes to ${parsed} units`);
  };

  // Mark all sold out
  const handleMarkAllSoldOut = () => {
    const newMap = { ...sizeStockMap };
    applicableSizes.forEach(sz => {
      newMap[sz] = 0;
    });
    setSizeStockMap(newMap);
    toast.info("All sizes marked as Sold Out");
  };

  // Size Guide management
  const handleToggleGuideType = (useCustom) => {
    setIsCustomGuideActive(useCustom);
    if (!useCustom) {
      if (setSizeGuide) setSizeGuide(null);
    } else {
      if (setSizeGuide) {
        if (!sizeGuide || sizeGuide.length === 0) {
          // Preload default guide rows based on product sizes
          const isNumeric = applicableSizes.some(s => /^\d+$/.test(s));
          setSizeGuide(isNumeric ? [...NUMERIC_SIZE_GUIDE] : [...DEFAULT_SIZE_GUIDE]);
        }
      }
    }
  };

  const handleUpdateGuideRow = (index, field, value) => {
    if (!setSizeGuide || !Array.isArray(sizeGuide)) return;
    const updated = [...sizeGuide];
    updated[index] = { ...updated[index], [field]: value };
    setSizeGuide(updated);
  };

  const handleAddGuideRow = () => {
    if (!setSizeGuide) return;
    const current = Array.isArray(sizeGuide) ? sizeGuide : [];
    setSizeGuide([
      ...current,
      { size: "Custom", bust: "0", waist: "0", hip: "0" }
    ]);
  };

  const handleRemoveGuideRow = (index) => {
    if (!setSizeGuide || !Array.isArray(sizeGuide)) return;
    const updated = sizeGuide.filter((_, i) => i !== index);
    setSizeGuide(updated);
  };

  return (
    <div className="space-y-4 font-body">
      {/* Top Presets & Summary Bar */}
      <div className="bg-[#FAF8F5] border border-[#E5DDD1] p-3 rounded-[2px] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE6DF] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#111113] font-semibold">
              Size Presets:
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#C2922E] font-semibold uppercase tracking-wider">
              TOTAL INVENTORY: {totalUnits} UNITS
            </span>
          </div>
        </div>

        {/* Preset Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESET_OPTIONS.map((preset) => {
            const isMatch =
              applicableSizes.length === preset.sizes.length &&
              preset.sizes.every((sz) => applicableSizes.includes(sz));

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.sizes)}
                className={`px-2.5 py-1 text-[9.5px] font-mono uppercase rounded-[1px] border transition-all cursor-pointer ${
                  isMatch
                    ? "bg-[#111113] text-white border-[#111113] shadow-xs"
                    : "bg-white text-[#746F68] border-[#DDD8CE] hover:border-[#C2922E] hover:text-[#C2922E]"
                }`}
              >
                {isMatch ? `✓ ${preset.label}` : preset.label}
              </button>
            );
          })}
        </div>

        {/* Quick Add Custom Size & Bulk Batch Tool */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#EAE6DF]/70">
          {/* Add Size */}
          <form onSubmit={handleAddCustomSize} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. 2XL, 48, XS, Free..."
              value={newSizeInput}
              onChange={(e) => setNewSizeInput(e.target.value)}
              className="flex-1 bg-white border border-[#E5DDD1] rounded-[2px] px-2.5 py-1 text-xs font-mono text-[#111113] focus:border-[#C2922E] outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1 bg-[#111113] hover:bg-[#C2922E] text-white text-[9.5px] font-mono uppercase tracking-wider rounded-[1px] transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus size={11} />
              <span>Add Size</span>
            </button>
          </form>

          {/* Quick Batch Set */}
          <div className="flex items-center gap-2 justify-end">
            <input
              type="number"
              min="0"
              placeholder="Qty"
              value={batchQtyInput}
              onChange={(e) => setBatchQtyInput(e.target.value)}
              className="w-16 bg-white border border-[#E5DDD1] rounded-[2px] px-2 py-1 text-xs font-mono text-center text-[#111113] focus:border-[#C2922E] outline-none"
            />
            <button
              type="button"
              onClick={handleApplyBatchQty}
              className="px-2.5 py-1 bg-white hover:bg-[#FAF8F5] border border-[#DDD8CE] text-[#111113] hover:border-[#111113] text-[9px] font-mono uppercase tracking-wider rounded-[1px] transition-colors cursor-pointer"
            >
              Fill All
            </button>
            <button
              type="button"
              onClick={handleMarkAllSoldOut}
              className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-[9px] font-mono uppercase tracking-wider rounded-[1px] transition-colors cursor-pointer"
            >
              Clear All (0)
            </button>
          </div>
        </div>
      </div>

      {/* Structured Size Inventory Table */}
      <div className="border border-[#E5DDD1] rounded-[2px] bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E5DDD1] text-[9.5px] font-mono uppercase tracking-[0.16em] text-[#746F68]">
                <th className="py-2.5 px-4 font-semibold">Size</th>
                <th className="py-2.5 px-4 font-semibold text-center w-28">Stock Units</th>
                <th className="py-2.5 px-4 font-semibold text-center w-36">Live Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE6DF] text-xs">
              {applicableSizes.map((sz) => {
                const stock = Math.max(0, Number(sizeStockMap[sz])) || 0;
                const isSoldOut = stock === 0;

                return (
                  <tr key={sz} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    {/* Size Name */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#111113] tracking-wide">
                          {sz}
                        </span>
                      </div>
                    </td>

                    {/* Stock Input */}
                    <td className="py-2.5 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        value={sizeStockMap[sz] ?? 0}
                        onChange={(e) => handleStockChange(sz, e.target.value)}
                        className={`w-20 text-center py-1 px-1.5 font-mono text-xs font-semibold rounded-[2px] border outline-none transition-all ${
                          isSoldOut
                            ? "bg-rose-50/50 border-rose-200 text-rose-700 focus:border-rose-400"
                            : "bg-[#FAF8F5] border-[#E5DDD1] text-[#111113] focus:border-[#C2922E]"
                        }`}
                      />
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-4 text-center">
                      {isSoldOut ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[1px] bg-rose-50 border border-rose-200 text-rose-700 font-mono text-[9px] uppercase tracking-wider font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          Sold Out
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[1px] bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[9px] uppercase tracking-wider font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Available ({stock})
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isSoldOut ? (
                          <button
                            type="button"
                            onClick={() => handleMakeAvailable(sz, 5)}
                            className="px-2 py-1 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-700 text-[9px] font-mono uppercase tracking-wider rounded-[1px] transition-colors cursor-pointer"
                            title="Set stock to 5 units"
                          >
                            + Make Available
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMarkSoldOut(sz)}
                            className="px-2 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 text-[9px] font-mono uppercase tracking-wider rounded-[1px] transition-colors cursor-pointer"
                            title="Set stock to 0"
                          >
                            Mark Sold Out
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveSize(sz)}
                          className="p-1 text-[#746F68] hover:text-rose-600 transition-colors cursor-pointer"
                          title={`Remove size ${sz}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SIZING GUIDE CONFIGURATION (Default vs Custom) */}
      <div className="border border-[#E5DDD1] rounded-[2px] bg-white p-3.5 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE6DF] pb-2">
          <div className="flex items-center gap-2">
            <Ruler size={14} className="text-[#C2922E]" />
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#111113] font-semibold">
              Garment Size Guide Configuration
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono text-[#746F68]">
              <input
                type="radio"
                name={`sizeGuideType_${isDrawer ? "drawer" : "main"}`}
                checked={!isCustomGuideActive}
                onChange={() => handleToggleGuideType(false)}
                className="accent-[#111113]"
              />
              <span>Use Default Size Guide</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono text-[#111113] font-medium">
              <input
                type="radio"
                name={`sizeGuideType_${isDrawer ? "drawer" : "main"}`}
                checked={isCustomGuideActive}
                onChange={() => handleToggleGuideType(true)}
                className="accent-[#C2922E]"
              />
              <span>Use Custom Size Guide</span>
            </label>
          </div>
        </div>

        {!isCustomGuideActive ? (
          <div className="bg-[#FAF8F5] p-3 rounded-[2px] text-xs text-[#746F68] space-y-1">
            <p className="font-sans">
              Currently using the <strong className="text-[#111113]">Global Default ICW Size Guide</strong> (XS–XL Atelier standards).
            </p>
            <p className="text-[10px] font-mono text-[#8E877E]">
              Measurements: XS (32-33 / 25-26 / 35-36) &middot; S (34-35 / 27-28 / 37-38) &middot; M (36-37 / 29-30 / 39-40) &middot; L (38-39 / 31-32 / 41-42) &middot; XL (40-42 / 33-35 / 43-45)
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-mono uppercase text-[#746F68]">
                Custom Product Size Guide Table:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSizeGuide && setSizeGuide([...DEFAULT_SIZE_GUIDE])}
                  className="px-2 py-0.5 bg-white border border-[#DDD8CE] text-[9px] font-mono text-[#746F68] hover:border-[#111113] rounded-[1px] cursor-pointer"
                >
                  Load XS–XL
                </button>
                <button
                  type="button"
                  onClick={() => setSizeGuide && setSizeGuide([...NUMERIC_SIZE_GUIDE])}
                  className="px-2 py-0.5 bg-white border border-[#DDD8CE] text-[9px] font-mono text-[#746F68] hover:border-[#111113] rounded-[1px] cursor-pointer"
                >
                  Load 36–46
                </button>
                <button
                  type="button"
                  onClick={handleAddGuideRow}
                  className="px-2 py-0.5 bg-[#111113] hover:bg-[#C2922E] text-white text-[9px] font-mono uppercase tracking-wider rounded-[1px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus size={10} />
                  <span>Add Row</span>
                </button>
              </div>
            </div>

            <div className="border border-[#E5DDD1] rounded-[2px] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#E5DDD1] text-[9px] font-mono uppercase tracking-wider text-[#746F68]">
                    <th className="py-2 px-3">Size Label</th>
                    <th className="py-2 px-3">Bust (in)</th>
                    <th className="py-2 px-3">Waist (in)</th>
                    <th className="py-2 px-3">Hip (in)</th>
                    <th className="py-2 px-3 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF] text-xs">
                  {(Array.isArray(sizeGuide) ? sizeGuide : []).map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF8F5]/50">
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={row.size || ""}
                          onChange={(e) => handleUpdateGuideRow(idx, "size", e.target.value)}
                          placeholder="e.g. M or 40"
                          className="w-20 bg-white border border-[#E5DDD1] rounded-[2px] px-2 py-1 text-xs font-mono font-bold text-[#111113] focus:border-[#C2922E] outline-none"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={row.bust || ""}
                          onChange={(e) => handleUpdateGuideRow(idx, "bust", e.target.value)}
                          placeholder="e.g. 36–37"
                          className="w-24 bg-white border border-[#E5DDD1] rounded-[2px] px-2 py-1 text-xs font-mono text-[#111113] focus:border-[#C2922E] outline-none"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={row.waist || ""}
                          onChange={(e) => handleUpdateGuideRow(idx, "waist", e.target.value)}
                          placeholder="e.g. 29–30"
                          className="w-24 bg-white border border-[#E5DDD1] rounded-[2px] px-2 py-1 text-xs font-mono text-[#111113] focus:border-[#C2922E] outline-none"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={row.hip || ""}
                          onChange={(e) => handleUpdateGuideRow(idx, "hip", e.target.value)}
                          placeholder="e.g. 39–40"
                          className="w-24 bg-white border border-[#E5DDD1] rounded-[2px] px-2 py-1 text-xs font-mono text-[#111113] focus:border-[#C2922E] outline-none"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveGuideRow(idx)}
                          className="text-[#746F68] hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[9.5px] font-mono text-[#746F68]">
              * This custom guide will be rendered dynamically when customers click &ldquo;SIZE GUIDE&rdquo; on this specific product.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSizeInventoryManager;
