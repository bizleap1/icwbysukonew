import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export const ExpandedGalleryModal = ({
  isOpen,
  onClose,
  images = [],
  activeImage = 0,
  setActiveImage,
  productName = "Product"
}) => {
  const containerRef = useRef(null);
  const imageRefs = useRef([]);

  // Lock background body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Auto-scroll to the clicked image
    const timer = setTimeout(() => {
      if (imageRefs.current[activeImage]) {
        imageRefs.current[activeImage].scrollIntoView({
          behavior: "auto",
          block: "start"
        });
      }
    }, 40);

    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(timer);
    };
  }, [isOpen, activeImage]);

  // Keyboard navigation (Escape key to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined" || !images.length) return null;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99999] bg-[#FFFFFF] overflow-y-auto overflow-x-hidden font-body text-[#121215] selection:bg-[#C2922E] selection:text-white"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* Floating Top-Right Close Button (matches reference design) */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close expanded view"
        className="fixed top-4 right-4 sm:top-6 sm:right-8 z-[100000] w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 hover:bg-white border border-black/10 shadow-[0_2px_12px_rgba(0,0,0,0.08)] flex items-center justify-center text-[#121215] hover:text-black transition-all hover:scale-105 cursor-pointer backdrop-blur-sm"
      >
        <X size={18} strokeWidth={1.3} />
      </button>

      {/* Vertical Feed of All Product Images */}
      <div className="w-full max-w-[1300px] mx-auto px-3 sm:px-8 py-6 sm:py-14 flex flex-col items-center gap-6 sm:gap-14">
        {images.map((imgUrl, idx) => (
          <div
            key={idx}
            ref={(el) => (imageRefs.current[idx] = el)}
            className="w-full flex flex-col items-center justify-center scroll-mt-6 sm:scroll-mt-10"
          >
            <div className="w-full max-w-[950px] flex items-center justify-center bg-white">
              <img
                src={imgUrl}
                alt={`${productName} — Look ${idx + 1}`}
                loading={idx === activeImage ? "eager" : "lazy"}
                decoding="async"
                className="w-full h-auto max-h-[92vh] sm:max-h-[95vh] object-contain select-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
};

export default ExpandedGalleryModal;
