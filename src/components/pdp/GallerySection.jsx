import React from "react";
import { Maximize2, ChevronLeft, ChevronRight } from "lucide-react";

export const GallerySection = ({
  images,
  activeImage,
  setActiveImage,
  productName,
  onOpenExpanded
}) => {
  return (
    <div className="lg:col-span-7 flex flex-col-reverse lg:flex-row gap-4 sm:gap-6">
      {/* Desktop Vertical Thumbnail Stack */}
      <div className="hidden lg:flex flex-col gap-3 w-20 shrink-0">
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveImage(idx)}
            className={`relative aspect-[3/4] overflow-hidden bg-[#EAE6DF] border transition-all ${
              activeImage === idx
                ? "border-[#C2922E] opacity-100"
                : "border-[#E8E4DC] opacity-50 hover:opacity-90"
            }`}
          >
            <img
              src={img}
              alt={`${productName} thumbnail ${idx + 1}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-top"
            />
          </button>
        ))}
      </div>

      {/* Main Image Display / Mobile Swipe Carousel */}
      <div className="relative flex-1 aspect-[3/4] sm:aspect-[4/5] lg:aspect-[3/4] bg-[#EAE6DF] overflow-hidden group">
        <img
          src={images[activeImage] || images[0]}
          alt={`${productName} view ${activeImage + 1}`}
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover object-top cursor-zoom-in transition-transform duration-500"
          onClick={onOpenExpanded}
        />

        {/* Zoom Trigger Button */}
        <button
          type="button"
          onClick={onOpenExpanded}
          aria-label="Expand image"
          className="absolute bottom-4 right-4 w-9 h-9 bg-black/40 hover:bg-black/70 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-colors opacity-90"
        >
          <Maximize2 size={15} />
        </button>

        {/* Mobile Next/Prev Controls */}
        {images.length > 1 && (
          <div className="flex lg:hidden items-center justify-between absolute inset-x-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
              }}
              aria-label="Previous image"
              className="w-8 h-8 rounded-full bg-black/40 text-white backdrop-blur-sm flex items-center justify-center pointer-events-auto"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
              }}
              aria-label="Next image"
              className="w-8 h-8 rounded-full bg-black/40 text-white backdrop-blur-sm flex items-center justify-center pointer-events-auto"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Mobile Pagination Dots */}
        {images.length > 1 && (
          <div className="flex lg:hidden items-center justify-center gap-1.5 absolute bottom-3 inset-x-0">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  activeImage === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
