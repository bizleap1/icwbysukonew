import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShoppingBag } from "lucide-react";
import { formatINR } from "../../data/products";

export const SizeGuideModal = ({ isOpen, onClose }) => {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative max-w-xl w-full bg-[#FAF8F5] border border-[#E8E4DC] shadow-2xl p-6 sm:p-8 z-10 font-body text-[#111113]"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E4DC] mb-6">
            <div>
              <span className="text-[10px] uppercase tracking-[0.24em] text-[#C2922E] font-medium block">
                ATELIER SPECIFICATIONS
              </span>
              <h3 className="font-quiche text-2xl text-[#111113] font-light">
                Bespoke Size Guide
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close size guide"
              className="w-8 h-8 rounded-full bg-[#F3EFE6] flex items-center justify-center text-[#111113] hover:text-[#C2922E]"
            >
              <X size={15} />
            </button>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E8E4DC] text-[#75757A] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Bust (in)</th>
                  <th className="py-2.5 px-3">Waist (in)</th>
                  <th className="py-2.5 px-3">Hip (in)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DC]">
                {[
                  { sz: "XS", bust: "32–33", waist: "25–26", hip: "35–36" },
                  { sz: "S", bust: "34–35", waist: "27–28", hip: "37–38" },
                  { sz: "M", bust: "36–37", waist: "29–30", hip: "39–40" },
                  { sz: "L", bust: "38–39", waist: "31–32", hip: "41–42" },
                  { sz: "XL", bust: "40–42", waist: "33–35", hip: "43–45" }
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-[#F3EFE6]">
                    <td className="py-2.5 px-3 font-semibold">{row.sz}</td>
                    <td className="py-2.5 px-3 text-[#555560]">{row.bust}</td>
                    <td className="py-2.5 px-3 text-[#555560]">{row.waist}</td>
                    <td className="py-2.5 px-3 text-[#555560]">{row.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-[#555560] leading-relaxed italic">
            * All measurements are in inches. If you fall between sizes or require custom tailoring, reach out to our Private Concierge.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export const StickyMobileBar = ({
  show,
  product,
  onAddToCart,
  isOutOfStock
}) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-[#FAF8F5] border-t border-[#E8E4DC] p-3.5 px-4 flex items-center justify-between gap-3 font-body shadow-lg sm:hidden">
      <div>
        <h4 className="font-quiche text-sm text-[#111113] truncate max-w-[170px]">
          {product.name}
        </h4>
        <span className="text-xs font-semibold text-[#111113]">
          {formatINR(product.price)}
        </span>
      </div>

      <button
        type="button"
        onClick={onAddToCart}
        disabled={isOutOfStock}
        className={`flex-1 py-3 text-xs uppercase tracking-[0.18em] font-medium flex items-center justify-center gap-2 transition-colors ${
          isOutOfStock
            ? "bg-[#EAE6DF] text-[#9999A0] cursor-not-allowed"
            : "bg-[#111113] text-white hover:bg-[#C2922E]"
        }`}
      >
        <ShoppingBag size={14} />
        <span>{isOutOfStock ? "Sold Out" : "Add to Bag"}</span>
      </button>
    </div>
  );
};
