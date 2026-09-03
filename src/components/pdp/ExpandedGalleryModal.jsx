import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { getHighResImage } from "../../utils/mediaUtils";

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

    // Auto-scroll to the clicked image inside the modal container
    const timer = setTimeout(() => {
      const targetEl = imageRefs.current[activeImage];
      if (targetEl && containerRef.current) {
        containerRef.current.scrollTop = targetEl.offsetTop;
      }
    }, 50);

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
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      data-lenis-prevent-touch="true"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[99999] bg-[#FFFFFF] w-full h-full min-h-screen overflow-y-scroll overflow-x-hidden font-body text-[#121215] selection:bg-[#C2922E] selection:text-white"
      style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
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

      {/* Vertical Feed of All Product Images (Seamless Touching) */}
      <div className="w-full max-w-[950px] mx-auto flex flex-col items-center p-0 m-0">
        {images.map((imgUrl, idx) => (
          <div
            key={idx}
            ref={(el) => (imageRefs.current[idx] = el)}
            className="w-full p-0 m-0 leading-none flex flex-col items-center"
          >
            <img
              src={getHighResImage(imgUrl)}
              alt={`${productName} — Look ${idx + 1}`}
              loading={idx === activeImage ? "eager" : "lazy"}
              decoding="async"
              onError={(e) => {
                if (e.currentTarget.src !== imgUrl) {
                  e.currentTarget.src = imgUrl;
                }
              }}
              className="w-full h-auto block object-cover select-none"
            />
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
};

export default ExpandedGalleryModal;
