import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Check } from "lucide-react";
import { formatINR, PRODUCTS } from "../data/products";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product, index = 0, lightTheme = false, isFeatured = false, showAddToBag = false, className = "" }) => {
  const [hover, setHover] = useState(false);
  const [isSelectingSize, setIsSelectingSize] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  
  // For small cards: default is 2nd image (upper garment cutout), hover reveals 1st image (model)
  // For large feature cards: model image remains steady on both default & hover (no image swap)
  const defaultImg = isFeatured
    ? (product.images?.[0] || product.image_url || "/placeholder.png")
    : (product.images?.[1] || product.images?.[0] || product.image_url || "/placeholder.png");

  const hoverImg = isFeatured
    ? null
    : (product.images?.[0] || defaultImg);

  const wishlisted = isInWishlist ? isInWishlist(product.id) : false;

  const matchedProduct = PRODUCTS.find((p) => p.id === product.id || p.slug === product.slug);
  const availableSizes = product.sizes || matchedProduct?.sizes || (product.gender === "male" ? ["38R", "40R", "42R", "44R"] : ["XS", "S", "M", "L", "XL"]);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggleWishlist) {
      toggleWishlist(product);
    }
  };

  const handleAddToBagClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (availableSizes && availableSizes.length > 1) {
      setIsSelectingSize((prev) => !prev);
    } else {
      const sizeToUse = (availableSizes && availableSizes[0]) || "Standard";
      executeAddToCart(sizeToUse);
    }
  };

  const handleSelectSizeAndAdd = (e, size) => {
    e.preventDefault();
    e.stopPropagation();
    executeAddToCart(size);
  };

  const executeAddToCart = (size) => {
    if (addItem) {
      const fullProduct = matchedProduct || product;
      addItem(fullProduct, size, 1);
      setIsSelectingSize(false);
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
      }, 2500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: (index % 4) * 0.08 }}
      className={`product-card group relative font-body ${
        isFeatured
          ? "col-span-2 md:col-span-2 lg:col-span-2 lg:row-span-2"
          : "col-span-1"
      } ${className}`}
      data-testid={`product-card-${product.id}`}
    >
      <Link to={`/product/${product.slug}`} className="block h-full flex flex-col justify-between">
        {/* Crisp Luxury Rectangular Image Container (Solid Background Crossfade - No Ghosting) */}
        <div
          className={`relative overflow-hidden ${
            isFeatured ? "aspect-[3/4] lg:aspect-auto lg:flex-1" : "aspect-[3/4]"
          } bg-[#FAF8F5] dark:bg-[#18181D] rounded-none w-full`}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          {/* Base Layer (Garment on small cards / Model on feature cards) */}
          <div className="absolute inset-0 w-full h-full bg-[#FAF8F5] dark:bg-[#18181D]">
            <img
              src={defaultImg}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
          </div>

          {/* Hover Reveal Layer (Model on small cards / Garment on feature cards) */}
          {hoverImg && hoverImg !== defaultImg && (
            <div
              className={`absolute inset-0 w-full h-full bg-[#FAF8F5] dark:bg-[#18181D] z-[1] transition-opacity duration-500 ease-out flex items-center justify-center ${
                hover ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <img
                src={hoverImg}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              />
            </div>
          )}

          {/* Subtle Small Text Reveal on Desktop (No Dark Overlay) */}
          <div className="hidden md:flex absolute inset-x-0 bottom-3 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none z-10">
            <span className="text-[9px] uppercase tracking-[0.24em] font-medium text-white bg-black/50 backdrop-blur-sm px-3.5 py-1">
              VIEW SET &rarr;
            </span>
          </div>
        </div>

        {/* Product Details (Max Mara Inspired Editorial Info Area with Wishlist Heart on Top-Right) */}
        <div className="pt-2.5 sm:pt-3.5 pb-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 pr-1">
              <h3 className={`font-normal tracking-wide transition-opacity line-clamp-1 text-[#111113] dark:text-[#F5F5F7] group-hover:opacity-75 ${
                isFeatured ? "text-[13.5px] sm:text-[15.5px] lg:text-[17px]" : "text-[12px] sm:text-[14px]"
              }`}>
                {product.name}
              </h3>
              
              <p className={`uppercase tracking-[0.18em] mt-0.5 font-normal text-[#555560] dark:text-white/60 ${
                isFeatured ? "text-[9.5px] sm:text-[10.5px] lg:text-[11px]" : "text-[8.5px] sm:text-[9.5px]"
              }`}>
                {product.categoryName || product.category || "Tailored Suiting"}
              </p>
            </div>

            {/* Editorial Outline Wishlist Heart Icon (Top-Right of Info Section) */}
            <button
              type="button"
              onClick={handleWishlistClick}
              aria-label="Save to Wishlist"
              className="p-0.5 -mr-0.5 text-[#111113]/70 dark:text-white/70 hover:text-[#C2922E] dark:hover:text-[#C2922E] transition-colors shrink-0 cursor-pointer"
            >
              <Heart
                size={16}
                strokeWidth={1.2}
                className={`transition-all ${
                  wishlisted
                    ? "fill-[#C2922E] text-[#C2922E] scale-110"
                    : "hover:scale-110"
                }`}
              />
            </button>
          </div>

          {product.price != null && (
            <span className={`font-light mt-1 tracking-wider text-[#111113] dark:text-[#F6F6F0] ${
              isFeatured ? "text-[12.5px] sm:text-[14.5px] lg:text-[16px]" : "text-[11.5px] sm:text-[13.5px]"
            }`}>
              {formatINR(product.price)}
            </span>
          )}

          {/* Subtle Minimalist Add to Bag Action (Wishlist & Dedicated Views) */}
          {showAddToBag && (
            <div 
              className="mt-2.5 pt-2 border-t border-[#E8E4DC]/70"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {isAdded ? (
                <div className="inline-flex items-center gap-1.5 text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.22em] text-[#C2922E] font-medium py-0.5">
                  <Check size={12} strokeWidth={2.2} />
                  <span>ADDED TO BAG ✓</span>
                </div>
              ) : isSelectingSize ? (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#777782] font-medium">
                      Select Size:
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsSelectingSize(false);
                      }}
                      className="text-[10px] text-[#777782] hover:text-[#111113] p-0.5"
                      aria-label="Cancel size selection"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSizes.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={(e) => handleSelectSizeAndAdd(e, sz)}
                        className="px-2 py-1 text-[9.5px] uppercase font-mono tracking-wider border border-[#D8D4CC] bg-white text-[#111113] hover:border-[#C2922E] hover:text-[#C2922E] transition-all cursor-pointer shadow-xs"
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAddToBagClick}
                  className="group/btn inline-flex items-center gap-1 text-[10px] sm:text-[10.5px] uppercase tracking-[0.22em] text-[#111113] hover:text-[#C2922E] font-medium transition-colors border-b border-[#111113]/30 hover:border-[#C2922E] pb-0.5 cursor-pointer"
                >
                  <span>+ ADD TO BAG</span>
                </button>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
