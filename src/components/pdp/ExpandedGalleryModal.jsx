import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

export const ExpandedGalleryModal = ({
  isOpen,
  onClose,
  images,
  activeImage,
  setActiveImage,
  productName
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  const handlePrev = useCallback(() => {
    setIsZoomed(false);
    setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length, setActiveImage]);

  const handleNext = useCallback(() => {
    setIsZoomed(false);
    setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length, setActiveImage]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-[#0A0A0C] flex flex-col justify-between font-body text-white">
      {/* Top Header */}
      <div className="p-4 sm:p-6 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md z-10">
        <div>
          <span className="text-[10px] uppercase tracking-[0.24em] text-[#C2922E] font-medium block">
            GALLERY
          </span>
          <h3 className="font-quiche text-base sm:text-lg text-white font-light">
            {productName} &mdash; {activeImage + 1} / {images.length}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            aria-label="Toggle zoom"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            {isZoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close expanded view"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Large Image Container */}
      <div className="relative flex-1 flex items-center justify-center overflow-auto p-4 sm:p-8">
        <img
          src={images[activeImage] || images[0]}
          alt={`${productName} full screen`}
          className={`max-h-full max-w-full object-contain transition-transform duration-300 ${
            isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
        />

        {/* Prev / Next Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous photo"
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next photo"
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      <div className="p-3 sm:p-4 border-t border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-center gap-2 overflow-x-auto">
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setIsZoomed(false);
              setActiveImage(idx);
            }}
            className={`w-12 h-16 shrink-0 bg-neutral-900 border transition-all overflow-hidden ${
              activeImage === idx ? "border-[#C2922E] opacity-100" : "border-transparent opacity-50 hover:opacity-80"
            }`}
          >
            <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover object-top" />
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
};
