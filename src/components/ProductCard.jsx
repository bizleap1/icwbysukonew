import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Check } from "lucide-react";
import { formatINR } from "../data/products";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { getCardImage } from "../utils/mediaUtils";

const ProductCard = ({ product, index = 0, lightTheme = false, isFeatured = false, showAddToBag = false, disableHoverImage = false, useSecondImage, className = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hover, setHover] = useState(false);
  const [hasHovered, setHasHovered] = useState(false);
  const [isSelectingSize, setIsSelectingSize] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addItem } = useCart();
  
  // Helper to determine if a product is a standalone trouser or skirt (separate bottom)
  const isTrouserOrSkirt = (() => {
    if (!product) return false;
    const cat = (product.category || "").toLowerCase();
    const catName = (product.categoryName || "").toLowerCase();
    const catType = (product.categoryType || "").toLowerCase();
    const sub = (product.subCategory || "").toLowerCase();
    const slug = (product.slug || "").toLowerCase();
    const name = (product.name || "").toLowerCase();

    // Full suits, sets, or coordinated ensembles are not standalone trousers or skirts
    if (slug.includes("suit") || slug.includes("set") || name.includes("suit") || name.includes("set")) {
      return false;
    }

    if (catType === "trouser" || catType === "skirt") {
      return true;
    }

    return (
      cat === "separates" ||
      catName.includes("separates") ||
      sub.includes("trouser") ||
      sub.includes("pant") ||
      sub.includes("skirt") ||
      slug.includes("trouser") ||
      slug.includes("pant") ||
      slug.includes("skirt") ||
      name.includes("trouser") ||
      name.includes("skirt")
    );
  })();

  const isHomePage = location.pathname === "/";
  const isNewInPage = 
    location.pathname === "/new-in" || 
    location.pathname.startsWith("/new-in") ||
    location.pathname === "/shop" ||
    location.pathname.startsWith("/shop") ||
    location.pathname.startsWith("/collection/");

  // 1st image (primary model / editorial look)
  const firstImg = 
    product.images?.find((img) => typeof img === "string" && (img.includes("1.png") || img.includes("1.webp") || img.includes("1.JPG") || img.includes("1.jpg"))) || 
    (typeof product.images?.[0] === "string" ? product.images[0] : product.images?.[0]?.url) || 
    product.image_url || 
    "/placeholder.png";

  // 2nd image (secondary visual / garment view)
  const secondImg = 
    product.images?.find((img) => typeof img === "string" && (img.includes("2.png") || img.includes("2.webp") || img.includes("2.JPG") || img.includes("2.jpg"))) || 
    (typeof product.images?.[1] === "string" ? product.images[1] : product.images?.[1]?.url) || 
    firstImg;

  // Image display rules:
  // 1. If useSecondImage is explicitly passed, respect it.
  // 2. Trousers & Skirts across the entire website always show 2nd image by default (hover reveals 1st image).
  // 3. On New In page ("/new-in"):
  //    - Large cards & suits/sets show 1st image as default.
  // 4. On Homepage ("/"):
  //    - New Arrivals show 2nd image as default, hover reveals 1st image.
  // 5. On Collection page, PDP ("You May Also Like"), Shop By Moment, etc.:
  //    - Suits & sets show 1st image as default, hover reveals 2nd image.
  let preferSecondImage = false;
  if (useSecondImage !== undefined) {
    preferSecondImage = useSecondImage;
  } else if (isTrouserOrSkirt) {
    // User: "2nd image he rakh trousers or skirts ke liye product card pe pure website mai"
    preferSecondImage = true;
  } else if (isNewInPage) {
    preferSecondImage = false; // 1st image by default on New In for suits/sets
  } else if (isHomePage) {
    preferSecondImage = true; // 2nd image by default on Homepage
  } else {
    preferSecondImage = false; // 1st image for suits & sets elsewhere
  }

  const defaultImg = preferSecondImage ? secondImg : firstImg;

  // Hover image logic:
  // User: "ye new arrivals mai jo bade cards hai usmai hover pe dusri image nhi ani chahiye sirf halka sa zoom honga product card ki image or ye sirf new arrvials ke liye he krna or vo bhi bade vale cards"
  // For large featured cards on New Arrivals (isFeatured={true} on New In), disable hover image swap.
  // Small cards in New Arrivals and other sections retain their normal hover image behavior.
  const isLargeNewInCard = isNewInPage && isFeatured;
  const isHoverDisabled = disableHoverImage || isLargeNewInCard || (isFeatured && !isNewInPage);
  const hoverImg = isHoverDisabled
    ? null
    : (preferSecondImage ? firstImg : secondImg);

  const wishlisted = isInWishlist ? isInWishlist(product.id) : false;

  const availableSizes = Array.isArray(product.sizes) && product.sizes.length > 0 
    ? product.sizes 
    : (product.gender === "male" ? ["38R", "40R", "42R", "44R"] : ["XS", "S", "M", "L", "XL"]);

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

    // Everywhere except Wishlist (where showAddToBag is true),
    // clicking the bag icon navigates to the product page so users can select their size and details.
    if (!showAddToBag) {
      navigate(`/product/${product.slug || product.id}`);
      return;
    }

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
          className={`relative overflow-hidden aspect-[3/4] ${
            isFeatured ? "lg:aspect-auto lg:min-h-[460px] lg:flex-1" : ""
          } bg-[#FAF8F5] dark:bg-[#18181D] rounded-none w-full`}
          onMouseEnter={() => {
            setHover(true);
            setHasHovered(true);
          }}
          onMouseLeave={() => setHover(false)}
        >
          {/* Base Layer (Garment on small cards / Model on feature cards) */}
          <div className="absolute inset-0 w-full h-full bg-[#FAF8F5] dark:bg-[#18181D]">
            <img
              src={getCardImage(defaultImg)}
              alt={product.name}
              loading={index < 4 ? "eager" : "lazy"}
              decoding="async"
              onError={(e) => {
                if (e.currentTarget.src !== defaultImg) {
                  e.currentTarget.src = defaultImg;
                }
              }}
              className={`w-full h-full object-cover object-top transition-transform duration-700 ease-out ${
                isLargeNewInCard ? "group-hover:scale-[1.035]" : "group-hover:scale-[1.02]"
              }`}
            />
          </div>

          {/* Hover Reveal Layer (Model on small cards / Garment on feature cards) */}
          {hoverImg && hoverImg !== defaultImg && hasHovered && (
            <div
              className={`absolute inset-0 w-full h-full bg-[#FAF8F5] dark:bg-[#18181D] z-[1] transition-opacity duration-500 ease-out flex items-center justify-center ${
                hover ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <img
                src={getCardImage(hoverImg)}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  if (e.currentTarget.src !== hoverImg) {
                    e.currentTarget.src = hoverImg;
                  }
                }}
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

        {/* Product Details (Max Mara Inspired Editorial Info Area with Wishlist Heart & Bag) */}
        <div className="pt-3 pb-1 flex flex-col font-body">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex-1 min-w-0 pr-1">
              {/* 1. Product Name */}
              <h3 className={`font-quiche font-normal tracking-wide transition-colors line-clamp-1 text-[#111113] dark:text-[#F5F5F7] group-hover:text-[#C2922E] ${
                isFeatured ? "text-[15px] sm:text-[17px] lg:text-[18px]" : "text-[13.5px] sm:text-[15px] lg:text-[16px]"
              }`}>
                {product.name}
              </h3>
              
              {/* 2. Category Label */}
              <p className={`uppercase tracking-[0.2em] mt-1 font-medium text-[#9E9A90] dark:text-[#A5A196] ${
                isFeatured ? "text-[9.5px] sm:text-[10.5px]" : "text-[8.5px] sm:text-[9.5px]"
              }`}>
                {product.categoryLabel || (product.categoryName ? product.categoryName.toUpperCase() : "POWER SUITS & SETS")}
              </p>

              {/* 3. Short Silhouette / Type */}
              <p className="text-[11.5px] sm:text-[12.5px] text-[#6B6B72] dark:text-white/60 font-light italic mt-0.5 leading-snug line-clamp-1">
                {product.shortType || product.setType || "Tailored Silhouette"}
              </p>

              {/* 4. Price */}
              {product.price != null && (
                <p className={`font-medium mt-1.5 tracking-normal text-[#111113] dark:text-[#F6F6F0] ${
                  isFeatured ? "text-[13.5px] sm:text-[15px] lg:text-[16px]" : "text-[12.5px] sm:text-[14px]"
                }`}>
                  {formatINR(product.price)}
                </p>
              )}
            </div>

            {/* Editorial Wishlist Heart & Bag Actions */}
            <div className="flex items-center gap-1.5 pt-0.5 -mr-0.5 shrink-0">
              {/* Wishlist Heart Icon */}
              <button
                type="button"
                onClick={handleWishlistClick}
                aria-label="Save to Wishlist"
                className="p-1 text-[#111113]/70 dark:text-white/70 hover:text-[#C2922E] dark:hover:text-[#C2922E] transition-colors cursor-pointer"
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

              {/* Shopping Bag Icon */}
              <button
                type="button"
                onClick={handleAddToBagClick}
                aria-label={showAddToBag ? "Add to Bag" : "Select size on product page"}
                className="p-1 text-[#111113]/70 dark:text-white/70 hover:text-[#C2922E] dark:hover:text-[#C2922E] transition-colors cursor-pointer"
              >
                {showAddToBag && isAdded ? (
                  <Check size={16} strokeWidth={2} className="text-[#C2922E]" />
                ) : (
                  <ShoppingBag
                    size={16}
                    strokeWidth={1.2}
                    className="transition-transform hover:scale-110"
                  />
                )}
              </button>
            </div>
          </div>

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
