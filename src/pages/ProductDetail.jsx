import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, ChevronLeft, ChevronRight, Maximize2, MessageCircle, Sparkles, Check, HelpCircle } from "lucide-react";
import { useLenis } from "lenis/react";
import { toast } from "sonner";
import SEO from "../components/SEO";
import { formatINR, SIZES, COLOURS, PRODUCTS, WHATSAPP_LINK } from "../data/products";
import { useProducts } from "../context/ProductContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import { ProductAccordion } from "../components/pdp/ProductAccordion";
import { SizeGuideModal, StickyMobileBar } from "../components/pdp/PdpExtras";
import { ExpandedGalleryModal } from "../components/pdp/ExpandedGalleryModal";
import { ReviewsSection } from "../components/pdp/ReviewsSection";
import ServiceStrip from "../components/home/ServiceStrip";
import { getThumbImage, getHighResImage } from "../utils/mediaUtils";

export const ProductDetail = () => {
  const { slug } = useParams();
  const { products, getProductBySlug, loading } = useProducts();
  const product = getProductBySlug(slug) || PRODUCTS.find((p) => p.slug === slug);
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const lenis = useLenis();
  
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product?.color || "Navy Blue");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showStickyMobileBar, setShowStickyMobileBar] = useState(false);
  const [isExpandedMode, setIsExpandedMode] = useState(false);
  const [reviewsData, setReviewsData] = useState({ total: 0, averageRating: 5.0, reviews: [] });
  
  const buyButtonRef = useRef(null);

  useEffect(() => {
    if (product) {
      if (product.availableColors && product.availableColors.length > 0) {
        const pColor = (product.color || "").toLowerCase();
        let matched = product.availableColors.find((c) => c.toLowerCase() === pColor);
        if (!matched) {
          if (pColor.includes("plum") || pColor.includes("wine") || pColor.includes("aubergine")) {
            matched = product.availableColors.find((c) => c.toLowerCase() === "wine");
          } else if (pColor.includes("rose") || pColor.includes("pink")) {
            matched = product.availableColors.find((c) => c.toLowerCase() === "muted pink");
          } else if (pColor.includes("navy") || pColor.includes("blue")) {
            matched = product.availableColors.find((c) => c.toLowerCase() === "navy blue");
          } else if (pColor.includes("lilac")) {
            matched = product.availableColors.find((c) => c.toLowerCase() === "lilac");
          }
        }
        setSelectedColor(matched || product.availableColors[0]);
      } else if (product.color) {
        setSelectedColor(product.color);
      }
    }
  }, [product]);

  // Touch swipe support for mobile gallery
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 45) {
      // Swiped Left -> Next Photo
      setActiveImage((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
    } else if (distance < -45) {
      // Swiped Right -> Previous Photo
      setActiveImage((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
    }
  };

  // Gallery Priority Ordering (model_front -> angles -> back -> garment -> detail)
  const typeOrder = {
    model_front: 1,
    model_three_quarter: 2,
    model_side: 3,
    model_back: 4,
    model_editorial: 5,
    garment_front: 6,
    garment_detail: 7,
    garment_back: 8,
    detail: 9
  };

  const isSeparate = 
    product?.category === "separates" || 
    product?.categoryName?.toLowerCase().includes("separates") ||
    ["blazers", "vests", "jackets", "tunics", "trousers", "skirts"].includes(product?.subCategory?.toLowerCase());

  const rawImages = (product?.gallery && product.gallery.length > 0)
    ? [...product.gallery].sort((a, b) => {
        if (isSeparate) {
          const aIs2 = (a.url && a.url.includes("2.png")) || a.type === "garment_front";
          const bIs2 = (b.url && b.url.includes("2.png")) || b.type === "garment_front";
          if (aIs2 && !bIs2) return -1;
          if (!aIs2 && bIs2) return 1;
        }
        return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
      })
    : (product?.images && product.images.length > 0)
      ? [...product.images].sort((a, b) => {
          if (isSeparate) {
            const aIs2 = typeof a === "string" && a.includes("2.png");
            const bIs2 = typeof b === "string" && b.includes("2.png");
            if (aIs2 && !bIs2) return -1;
            if (!aIs2 && bIs2) return 1;
          }
          return 0;
        })
      : ["/products/midnight-peplum-fishtail-set/1.png"];

  const galleryImages = rawImages.map((img) => (typeof img === "string" ? img : img.url));

  // Scroll spy to toggle mobile bottom sticky bar
  useEffect(() => {
    const handleScroll = () => {
      if (!buyButtonRef.current) return;
      const rect = buyButtonRef.current.getBoundingClientRect();
      setShowStickyMobileBar(rect.bottom < 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock scroll when expanded modal is open
  useEffect(() => {
    if (isExpandedMode) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isExpandedMode]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#FAF8F5]">
        <div className="text-center font-body">
          <div className="w-8 h-8 border-2 border-[#111113] border-t-transparent animate-spin rounded-full mx-auto mb-4" />
          <p className="font-quiche text-2xl font-light text-[#111113]">
            Loading tailored silhouette...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#FAF8F5] px-6 text-center font-body">
        <div>
          <span className="text-[10.5px] uppercase tracking-[0.3em] text-[#C2922E] font-medium block mb-2">
            SUKO &middot; THE INDIAN CORPORATE WEAR
          </span>
          <h1 className="font-quiche text-3xl sm:text-4xl text-[#111113] mb-4">
            Piece Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[#555562] font-light mb-8 max-w-md mx-auto">
            The requested suiting piece is currently unavailable or has been archived.
          </p>
          <Link
            to="/new-in"
            className="inline-flex items-center gap-2 border-b border-[#111113] text-[11px] uppercase tracking-[0.24em] font-medium text-[#111113] pb-1 hover:text-[#C2922E] hover:border-[#C2922E] transition-colors"
          >
            Explore Executive Collection
          </Link>
        </div>
      </div>
    );
  }

  const handleAdd = () => {
    if (!size) {
      toast.error("Please select a size before adding to bag");
      return;
    }
    addItem({ ...product, color: selectedColor, garmentLabel: garmentTypeLabel }, size, qty);
  };

  const isOutOfStock = product.stock === 0;

  const categoryType = product.categoryType || (product.category === "suits" || product.category === "coords" ? "set" : "blazer");
  const isFullSet = categoryType === "set";

  // Customer-facing garment type label next to price (never generic "Tailored Separate")
  const garmentTypeLabel = {
    set: "Complete Set",
    blazer: "Blazer",
    trouser: "Trousers",
    vest: "Tailored Vest",
    tunic: "Tailored Tunic",
    skirt: "Tailored Skirt",
    shirt: "Shirt",
    dress: "Dress"
  }[categoryType] || (product.subCategory ? product.subCategory.replace(/s$/i, "") : "Silhouetted Piece");

  // Coordinates resolution (supporting both { slug, label } objects and string slugs)
  const coordinateItems = (product.coordinates && product.coordinates.length > 0)
    ? product.coordinates
        .map((coord) => {
          const cSlug = typeof coord === "string" ? coord : coord?.slug;
          const customLabel = typeof coord === "object" ? coord?.label : null;
          const foundProduct = (products || PRODUCTS).find((p) => p.slug === cSlug || p.id === cSlug);
          if (!foundProduct) return null;
          return { product: foundProduct, customLabel };
        })
        .filter(Boolean)
    : [];

  // Separates resolution for Full Sets (supporting { slug, label } objects)
  const separateItems = (isFullSet && product.separates && product.separates.length > 0)
    ? product.separates
        .map((sep) => {
          const sSlug = typeof sep === "string" ? sep : sep?.slug;
          const customLabel = typeof sep === "object" ? sep?.label : null;
          const foundProduct = (products || PRODUCTS).find((p) => p.slug === sSlug || p.id === sSlug);
          if (!foundProduct) return null;
          return { product: foundProduct, customLabel };
        })
        .filter(Boolean)
    : [];

  const coordinateSlugs = coordinateItems.map((ci) => ci.product.slug);
  const separateSlugs = separateItems.map((si) => si.product.slug);

  // Related products (Max 4, excluding active item, coordinates, and separates)
  const related = (products || PRODUCTS)
    .filter((p) => p.id !== product.id && !coordinateSlugs.includes(p.slug) && !separateSlugs.includes(p.slug))
    .slice(0, 4);

  const activeColors = product.availableColors && product.availableColors.length > 0
    ? product.availableColors.map((ac) => {
        const found = COLOURS.find((c) => (c.name || "").toLowerCase() === ac.toLowerCase() || (c.id || "").toLowerCase() === ac.toLowerCase());
        return found || { id: ac, name: ac, label: ac, hex: "#16233B" };
      })
    : product.color
      ? COLOURS.filter((c) => c.name.toLowerCase() === product.color.toLowerCase())
      : COLOURS.slice(0, 1);

  const productWhatsappMsg = `Hello SUKO Stylist, I am inquiring about the ${product.name} in ${selectedColor} (${formatINR(product.price)}). Could you please advise on fit and styling?`;

  const renderProductInfo = () => (
    <div className="w-full lg:w-[370px] xl:w-[420px] shrink-0 flex flex-col justify-start space-y-4 font-body">
      {/* Moment Badge & Title Block */}
      <div>
        {product.momentName && (
          <div className="mb-2">
            <Link
              to={`/shop-by-moment?moment=${product.moment || "boardroom"}`}
              className="inline-flex items-center px-2.5 py-1 bg-[#121215] text-white text-[9px] uppercase tracking-[0.22em] font-medium hover:bg-[#C2922E] transition-colors"
            >
              <span>{product.momentName}</span>
            </Link>
          </div>
        )}

        <h1 className="font-quiche text-2xl xl:text-3xl font-light text-[#111113] tracking-tight leading-[1.1] mb-1">
          {product.name}
        </h1>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-[10px] uppercase tracking-[0.22em] text-[#C2922E] font-medium">
            {product.shortType || product.setType || product.categoryLabel}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3 pb-3.5 border-b border-[#E8E4DC]">
          <p className="font-quiche text-2xl text-[#111113] font-normal">
            {formatINR(product.price)}
          </p>
          <span className="text-[10.5px] text-[#666672] uppercase tracking-widest font-light">
            {garmentTypeLabel}
          </span>
        </div>
      </div>

      {/* Colour Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#111113]">
            COLOUR: <span className="font-medium text-[#C2922E]">{selectedColor}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {activeColors.map((col) => {
            const isCurrent = (selectedColor || "").toLowerCase() === col.name.toLowerCase() || (selectedColor || "").toLowerCase() === (col.id || "").toLowerCase();
            return (
              <button
                key={col.name}
                type="button"
                onClick={() => setSelectedColor(col.name)}
                title={col.name}
                aria-label={`Select color ${col.name}`}
                className={`relative w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                  isCurrent 
                    ? "ring-2 ring-[#C2922E] ring-offset-2 ring-offset-[#FAF8F5] scale-110 shadow-sm" 
                    : "hover:scale-105 opacity-85 hover:opacity-100 hover:ring-1 hover:ring-[#C2922E]/50"
                }`}
                style={{ backgroundColor: col.hex }}
              >
                {isCurrent && (
                  <Check size={11} className={col.hex === "#16233B" || col.hex === "#0E0E11" || col.hex === "#2E1729" || col.hex === "#4A1828" || col.hex === "#5B1E31" ? "text-white" : "text-[#121215]"} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size Selector + Size Guide */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#111113]">
            SELECT SIZE
          </span>
          <button
            type="button"
            onClick={() => setShowSizeGuide(true)}
            className="text-[10.5px] uppercase tracking-[0.2em] font-medium text-[#C2922E] border-b border-[#C2922E] pb-0.5 hover:opacity-80 transition-opacity cursor-pointer"
          >
            SIZE GUIDE
          </button>
        </div>

        {/* Size Buttons Grid */}
        <div className="grid grid-cols-5 gap-2">
          {(product.sizes || SIZES.slice(0, 5)).map((s) => {
            const isSelected = size === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`py-2 text-[10.5px] uppercase tracking-[0.2em] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#111113] text-white border border-[#111113] shadow-sm"
                    : "bg-transparent text-[#111113] border border-[#DDD8CE] hover:border-[#111113]"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Add to Bag & Wishlist */}
      <div ref={buyButtonRef} className="space-y-2.5 pt-1">
        <div className="flex gap-3">
          <button
            type="button"
            data-testid="add-to-cart-btn"
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`flex-1 py-3.5 px-6 text-[10.5px] sm:text-[11px] uppercase tracking-[0.24em] font-medium transition-all shadow-sm active:scale-[0.99] cursor-pointer ${
              isOutOfStock
                ? "bg-[#EAE6DF] text-[#9999A0] cursor-not-allowed"
                : "bg-[#111113] text-white hover:bg-[#C2922E]"
            }`}
          >
            {isOutOfStock ? "SOLD OUT" : `ADD TO BAG · ${formatINR(product.price)}`}
          </button>

          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            aria-label={isInWishlist(product.id) ? "Remove from Wishlist" : "Save to Wishlist"}
            className={`w-12 shrink-0 flex items-center justify-center border transition-colors cursor-pointer ${
              isInWishlist(product.id)
                ? "border-[#C2922E] bg-[#C2922E]/10 text-[#C2922E]"
                : "border-[#DDD8CE] text-[#111113] hover:border-[#111113]"
            }`}
          >
            <Heart size={16} strokeWidth={1.5} className={isInWishlist(product.id) ? "fill-[#C2922E]" : ""} />
          </button>
        </div>

        {/* Full-width secondary outline button below ADD TO BAG */}
        <a
          href={`https://wa.me/919370350885?text=${encodeURIComponent(productWhatsappMsg)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-4 border border-[#111113] hover:border-[#C2922E] bg-transparent text-[#111113] hover:text-[#C2922E] text-[10.5px] sm:text-[11px] uppercase tracking-[0.22em] font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <MessageCircle size={14} className="text-[#C2922E]" />
          <span>Chat with a SUKO Stylist</span>
        </a>
      </div>

      {/* Dynamic What's Included / Complete The Set Block */}
      {isFullSet ? (
        <div className="p-3.5 bg-[#F2EDE2] border border-[#E0D9CB]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-[1px] bg-[#C2922E]" />
            <span className="text-[9.5px] uppercase tracking-[0.24em] font-semibold text-[#111113]">
              WHAT&apos;S INCLUDED
            </span>
          </div>
          {product.includedPieces && product.includedPieces.length > 0 ? (
            <ul className="space-y-1.5 text-xs text-[#3E3E48] font-light">
              {product.includedPieces.map((piece, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E] shrink-0" />
                  <span>{piece}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#484852] font-light leading-relaxed">
              {product.pieces || "Includes Tailored Jacket + Coordinated Trousers."}
            </p>
          )}

          {/* Inline Link to Individual Pieces if Sold Separately */}
          {separateItems.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[#E0D9CB]/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9.5px] uppercase tracking-[0.22em] font-semibold text-[#111113]">
                  PREFER SEPARATES?
                </span>
                <span className="text-[9px] uppercase tracking-wider text-[#C2922E] font-medium">
                  Shop Individually
                </span>
              </div>
              <div className="space-y-1.5">
                {separateItems.map(({ product: sep, customLabel }) => (
                  <Link
                    key={sep.id}
                    to={`/product/${sep.slug}`}
                    className="group flex items-center justify-between py-1 text-xs text-[#111113] hover:text-[#C2922E] transition-colors"
                  >
                    <span className="font-medium underline underline-offset-2 group-hover:text-[#C2922E]">
                      {customLabel || sep.name}
                    </span>
                    <span className="text-[11px] text-[#666672] font-mono group-hover:text-[#C2922E]">
                      {formatINR(sep.price)} &rarr;
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3.5 bg-[#F2EDE2] border border-[#E0D9CB]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-[1px] bg-[#C2922E]" />
            <span className="text-[9.5px] uppercase tracking-[0.24em] font-semibold text-[#111113]">
              COMPLETE THE SET
            </span>
          </div>
          <p className="text-xs text-[#484852] font-light leading-relaxed mb-2.5">
            {product.coordinateText || "Explore coordinating pieces from this collection to complete the ensemble."}
          </p>
          {coordinateItems.length > 0 ? (
            <div className="space-y-1.5 pt-1.5 border-t border-[#E0D9CB]/80">
              {coordinateItems.map(({ product: coord, customLabel }) => (
                <Link
                  key={coord.id}
                  to={`/product/${coord.slug}`}
                  className="group flex items-center justify-between py-1 text-xs text-[#111113] hover:text-[#C2922E] transition-colors"
                >
                  <span className="font-medium underline underline-offset-2 group-hover:text-[#C2922E]">
                    {customLabel || `View ${coord.name}`}
                  </span>
                  <span className="text-[11px] text-[#666672] font-mono group-hover:text-[#C2922E]">
                    {formatINR(coord.price)} &rarr;
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <Link
              to="/collection"
              className="inline-block text-[10.5px] uppercase tracking-[0.2em] font-medium text-[#111113] hover:text-[#C2922E] underline underline-offset-2"
            >
              Explore Coordinating Pieces &rarr;
            </Link>
          )}
        </div>
      )}

      {/* Accordion (Occasion & Story, Details, Care, Shipping) */}
      <ProductAccordion product={product} />
    </div>
  );

  return (
    <div 
      data-testid="product-detail-page"
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white transition-colors duration-300 pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-24"
    >
      <SEO 
        title={`${product.name} — SUKO The Indian Corporate Wear`}
        description={product.description || `Luxury corporate tailoring — ${product.name} by SUKO.`}
        image={galleryImages[0]}
        productData={product}
      />

      <div className="max-w-[1740px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 mb-6 sm:mb-10">
        
        {/* Single Clean Breadcrumb / Back Navigation */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = "/collection";
              }
            }}
            className="group inline-flex items-center gap-2 text-[11px] sm:text-[11.5px] uppercase tracking-[0.2em] font-medium text-[#6B6B75] hover:text-[#121215] transition-colors cursor-pointer"
          >
            <span className="text-sm transition-transform group-hover:-translate-x-1">&larr;</span>
            <span>Back</span>
          </button>
          
          <div className="hidden sm:flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#8C887B]">
            <Link to="/collection" className="hover:text-[#121215] transition-colors">Collections</Link>
            <span>/</span>
            <span className="text-[#121215] font-medium">{product.categoryName || product.categoryLabel || "Tailoring"}</span>
          </div>
        </div>

        {/* Mobile View: Carousel + Info */}
        <div className="block lg:hidden mb-12">
          <div 
            className="relative aspect-[3/4] bg-[#F2ECE1] overflow-hidden cursor-zoom-in flex items-center justify-center"
            onClick={() => setIsExpandedMode(true)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={getHighResImage(galleryImages[activeImage])}
              alt={`${product.name} - view ${activeImage + 1}`}
              fetchPriority={activeImage === 0 ? "high" : "auto"}
              decoding="async"
              onError={(e) => {
                if (e.currentTarget.src !== galleryImages[activeImage]) {
                  e.currentTarget.src = galleryImages[activeImage];
                }
              }}
              className="w-full h-full object-cover object-top transition-opacity duration-300"
            />
            
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md p-1.5 rounded-full text-white/80">
              <Maximize2 size={13} />
            </div>

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
                  }}
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 backdrop-blur-md text-white flex items-center justify-center rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
                  }}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 backdrop-blur-md text-white flex items-center justify-center rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
              {galleryImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage(idx);
                  }}
                  className={`h-1.5 transition-all rounded-full ${activeImage === idx ? "w-5 bg-[#C2922E]" : "w-1.5 bg-white/50"}`}
                />
              ))}
            </div>
          </div>

          {/* Mobile Product Purchase Panel */}
          <div className="mt-6">
            {renderProductInfo()}
          </div>
        </div>

        {/* Desktop 3-Column Layout */}
        <div className="hidden lg:flex items-stretch gap-6 xl:gap-8 w-full">
          
          {/* 1. Thumbnail Rail (92px on lg, 104px on xl) */}
          <div className="w-[92px] xl:w-[104px] shrink-0 flex flex-col justify-start gap-3">
            {galleryImages.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (activeImage === idx) {
                    setIsExpandedMode(true);
                  } else {
                    setActiveImage(idx);
                  }
                }}
                className={`relative aspect-[3/4] w-full overflow-hidden bg-[#F2ECE1] transition-all duration-200 cursor-pointer ${
                  activeImage === idx
                    ? "border border-[#C2922E] opacity-100 ring-1 ring-[#C2922E]"
                    : "border border-[#E8E4DC] opacity-60 hover:opacity-95"
                }`}
              >
                <img
                  src={getThumbImage(imgUrl)}
                  alt={`Thumbnail ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    if (e.currentTarget.src !== imgUrl) {
                      e.currentTarget.src = imgUrl;
                    }
                  }}
                  className="w-full h-full object-cover object-top"
                />
              </button>
            ))}
          </div>

          {/* 2. Dominant Selected Image */}
          <div className="flex-1 relative min-h-[720px] xl:min-h-[820px] self-stretch bg-[#F5F0E6] overflow-hidden group flex items-center justify-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImage((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
              }}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 text-[#111113] hover:text-[#C2922E] flex items-center justify-center opacity-60 hover:opacity-100 transition-all cursor-pointer"
            >
              <ChevronLeft size={28} strokeWidth={1.2} />
            </button>

            <div
              onClick={() => setIsExpandedMode(true)}
              className="w-full h-full flex items-center justify-center cursor-zoom-in"
            >
              <img
                src={getHighResImage(galleryImages[activeImage])}
                alt={`${product.name} - view ${activeImage + 1}`}
                fetchPriority="high"
                decoding="async"
                onError={(e) => {
                  if (e.currentTarget.src !== galleryImages[activeImage]) {
                    e.currentTarget.src = galleryImages[activeImage];
                  }
                }}
                className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.015]"
              />
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImage((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
              }}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 text-[#111113] hover:text-[#C2922E] flex items-center justify-center opacity-60 hover:opacity-100 transition-all cursor-pointer"
            >
              <ChevronRight size={28} strokeWidth={1.2} />
            </button>

            <div 
              onClick={() => setIsExpandedMode(true)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#111113] shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer backdrop-blur-sm"
              title="Expand Lookbook"
            >
              <Maximize2 size={15} />
            </div>
          </div>

          {/* 3. Product Info & Actions Panel on Desktop */}
          {renderProductInfo()}
        </div>

      </div>

      {/* 1. Full Set PDP: SHOP SEPARATELY Gallery Section */}
      {isFullSet && separateItems.length > 0 && (
        <section className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 mb-12 sm:mb-16 font-body">
          <div className="bg-[#F5F2EB] py-6 px-5 sm:py-9 sm:px-8 lg:px-12 border border-[#E8E4DC]">
            <div className="max-w-4xl mx-auto mb-6 sm:mb-8 text-left sm:text-center">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-5 h-[1px] bg-[#C2922E]" />
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#C2922E] font-medium font-body">
                  INDIVIDUAL PIECES
                </span>
                <span className="w-5 h-[1px] bg-[#C2922E] hidden sm:inline-block" />
              </div>
              <h3 className="font-quiche text-2xl sm:text-3xl lg:text-4xl font-light text-[#121215] mb-2.5">
                SHOP SEPARATELY
              </h3>
              <p className="text-xs sm:text-[13px] text-[#555562] font-light max-w-xl sm:mx-auto leading-relaxed">
                The Pieces Within The Set.
              </p>
            </div>

            {/* Centered Editorial Cards Layout */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 max-w-4xl mx-auto">
              {separateItems.map(({ product: item, customLabel }) => {
                const isItemSep = item.category === "separates" || item.categoryName?.toLowerCase().includes("separates");
                const ghostImg = item.images?.find((img) => typeof img === "string" && img.includes("2.png"))
                  || item.gallery?.find((g) => g.type === "garment_front" || g.url?.includes("2.png"))?.url;
                const displayImg = (isItemSep && ghostImg)
                  ? ghostImg
                  : (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url);

                const sub = (item.subCategory || "").toLowerCase();
                let roleLabel = "STANDALONE SEPARATE";
                let actionLabel = "VIEW PIECE \u2192";
                if (sub.includes("blazer")) { roleLabel = "TAILORED BLAZER"; actionLabel = "VIEW BLAZER \u2192"; }
                else if (sub.includes("trouser") || sub.includes("pant")) { roleLabel = "TAILORED TROUSERS"; actionLabel = "VIEW TROUSERS \u2192"; }
                else if (sub.includes("vest")) { roleLabel = "STRUCTURED VEST"; actionLabel = "VIEW VEST \u2192"; }
                else if (sub.includes("skirt")) { roleLabel = "TAILORED SKIRT"; actionLabel = "VIEW SKIRT \u2192"; }
                else if (sub.includes("jacket")) { roleLabel = "CONTOUR JACKET"; actionLabel = "VIEW JACKET \u2192"; }
                else if (sub.includes("tunic")) { roleLabel = "EMBROIDERED TUNIC"; actionLabel = "VIEW TUNIC \u2192"; }

                return (
                  <Link
                    key={item.id}
                    to={`/product/${item.slug}`}
                    className="group w-full sm:w-[320px] md:w-[360px] bg-[#FAF8F5] border border-[#E8E4DC] hover:border-[#C2922E]/80 transition-all duration-300 flex flex-col overflow-hidden hover:shadow-md"
                  >
                    {/* Direct Full-Bleed Card Image (No inner white spacing) */}
                    <div className="w-full aspect-[3/4] bg-[#EAE6DF] border-b border-[#E8E4DC] relative overflow-hidden">
                      <img
                        src={displayImg}
                        alt={item.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    </div>

                    {/* Card Content */}
                    <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between bg-[#FAF8F5]">
                      <div>
                        <span className="text-[9.5px] uppercase tracking-[0.24em] text-[#C2922E] font-medium block mb-1.5">
                          {roleLabel}
                        </span>
                        <h4 className="font-quiche text-lg sm:text-xl font-light text-[#121215] mb-1.5 group-hover:text-[#C2922E] transition-colors leading-snug">
                          {item.name}
                        </h4>
                        {customLabel && (
                          <p className="text-xs text-[#666672] italic font-light mb-2 line-clamp-1">
                            {customLabel}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#E8E4DC]/80 flex items-center justify-between mt-3">
                        <p className="font-quiche text-base text-[#121215] font-normal">
                          {formatINR(item.price)}
                        </p>
                        <span className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#121215] group-hover:text-[#C2922E] underline underline-offset-4 decoration-[#121215]/40 group-hover:decoration-[#C2922E] transition-all">
                          {actionLabel}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 2. Separates PDP: COMPLETE THE SET Coordinating Gallery Section */}
      {!isFullSet && coordinateItems.length > 0 && (
        <section className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 mb-12 sm:mb-16 font-body">
          <div className="bg-[#F5F2EB] py-6 px-5 sm:py-9 sm:px-8 lg:px-12 border border-[#E8E4DC]">
            <div className="max-w-4xl mx-auto mb-6 sm:mb-8 text-left sm:text-center">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-5 h-[1px] bg-[#C2922E]" />
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#C2922E] font-medium font-body">
                  COORDINATING PIECES
                </span>
                <span className="w-5 h-[1px] bg-[#C2922E] hidden sm:inline-block" />
              </div>
              <h3 className="font-quiche text-2xl sm:text-3xl lg:text-4xl font-light text-[#121215] mb-2.5">
                Complete The Set
              </h3>
              <p className="text-xs sm:text-[13px] text-[#555562] font-light max-w-xl sm:mx-auto leading-relaxed">
                {product.coordinateText || "Pair this piece with its matching coordinates for a unified executive presence."}
              </p>
            </div>

            {/* Centered Editorial Cards Layout */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 max-w-4xl mx-auto">
              {coordinateItems.map(({ product: item, customLabel }) => {
                const isItemSep = item.category === "separates" || item.categoryName?.toLowerCase().includes("separates");
                const ghostImg = item.images?.find((img) => typeof img === "string" && img.includes("2.png"))
                  || item.gallery?.find((g) => g.type === "garment_front" || g.url?.includes("2.png"))?.url;
                const displayImg = (isItemSep && ghostImg)
                  ? ghostImg
                  : (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url);

                // Luxury category role label (never generic "TAILORED SEPARATES")
                const roleLabel = (() => {
                  const cType = item.categoryType || (item.category === "suits" ? "set" : "blazer");
                  if (cType === "set") {
                    if (item.name?.toLowerCase().includes("ensemble")) return "COMPLETE ENSEMBLE";
                    if (item.name?.toLowerCase().includes("suit")) return "COMPLETE POWER SUIT";
                    return "COMPLETE CO-ORD SET";
                  }
                  if (cType === "blazer") return "COORDINATING BLAZER";
                  if (cType === "trouser") return "COORDINATING TROUSERS";
                  if (cType === "vest") return "COORDINATING VEST";
                  if (cType === "skirt") return "COORDINATING SKIRT";
                  if (cType === "tunic") return "COORDINATING TUNIC";
                  const sub = (item.subCategory || "").toLowerCase();
                  if (sub.includes("blazer")) return "COORDINATING BLAZER";
                  if (sub.includes("trouser") || sub.includes("pant")) return "COORDINATING TROUSERS";
                  if (sub.includes("skirt")) return "COORDINATING SKIRT";
                  if (sub.includes("vest")) return "COORDINATING VEST";
                  return "COORDINATING PIECE";
                })();

                const isItemSet = item.categoryType === "set" || item.category === "suits" || item.category === "coords";
                const actionLabel = isItemSet ? "VIEW COMPLETE SET \u2192" : "EXPLORE PIECE";

                return (
                  <Link
                    key={item.id}
                    to={`/product/${item.slug}`}
                    className="group w-full sm:w-[320px] md:w-[360px] bg-[#FAF8F5] border border-[#E8E4DC] hover:border-[#C2922E]/80 transition-all duration-300 flex flex-col overflow-hidden hover:shadow-md"
                  >
                    {/* Direct Full-Bleed Card Image (No inner white spacing) */}
                    <div className="w-full aspect-[3/4] bg-[#EAE6DF] border-b border-[#E8E4DC] relative overflow-hidden">
                      <img
                        src={displayImg}
                        alt={item.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    </div>

                    {/* Card Content */}
                    <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between bg-[#FAF8F5]">
                      <div>
                        <span className="text-[9.5px] uppercase tracking-[0.24em] text-[#C2922E] font-medium block mb-1.5">
                          {roleLabel}
                        </span>
                        <h4 className="font-quiche text-lg sm:text-xl font-light text-[#121215] mb-1.5 group-hover:text-[#C2922E] transition-colors leading-snug">
                          {item.name}
                        </h4>
                        {customLabel && (
                          <p className="text-xs text-[#666672] italic font-light mb-2 line-clamp-1">
                            {customLabel}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#E8E4DC]/80 flex items-center justify-between mt-3">
                        <p className="font-quiche text-base text-[#121215] font-normal">
                          {formatINR(item.price)}
                        </p>
                        <span className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#121215] group-hover:text-[#C2922E] underline underline-offset-4 decoration-[#121215]/40 group-hover:decoration-[#C2922E] transition-all">
                          {actionLabel}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Related Products: You May Also Like (Single Curated Recommendation Strip) */}
      {related.length > 0 && (
        <section className="max-w-[1740px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 mb-5 sm:mb-6">
          <div className="flex items-end justify-between mb-6 pb-3 border-b border-[#E8E4DC]">
            <div>
              <span className="text-[9.5px] uppercase tracking-[0.26em] text-[#C2922E] font-medium block mb-1">
                CURATED SELECTION
              </span>
              <h2 className="font-quiche text-2xl sm:text-3xl font-light text-[#121215] tracking-tight">
                You May Also Like
              </h2>
            </div>
            <Link
              to="/collection"
              className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#121215] hover:text-[#C2922E] transition-colors border-b border-[#121215] hover:border-[#C2922E] pb-0.5"
            >
              All Collections
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {related.map((p, i) => (
              <ProductCard key={p.id || i} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Client Reviews Section (Low page priority, compact when zero reviews) */}
      <div className="max-w-[1740px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 mb-8 sm:mb-10">
        <ReviewsSection
          product={product}
          user={user}
          reviewsData={reviewsData}
          setReviewsData={setReviewsData}
        />
      </div>

      {/* Modals & Bottom Sticky */}
      <ExpandedGalleryModal
        isOpen={isExpandedMode}
        onClose={() => setIsExpandedMode(false)}
        images={galleryImages}
        activeImage={activeImage}
        setActiveImage={setActiveImage}
        productName={product.name}
      />

      <SizeGuideModal
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
      />

      <StickyMobileBar
        show={showStickyMobileBar}
        product={product}
        onAddToCart={handleAdd}
        isOutOfStock={isOutOfStock}
      />

      {/* Service Strip */}
      <ServiceStrip />
    </div>
  );
};

export default ProductDetail;

