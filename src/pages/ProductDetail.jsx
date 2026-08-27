import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useLenis } from "lenis/react";
import { toast } from "sonner";
import SEO from "../components/SEO";
import { formatINR, SIZES, COLOURS } from "../data/products";
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

const ProductDetail = () => {
  const { slug } = useParams();
  const { products, getProductBySlug, loading } = useProducts();
  const product = getProductBySlug(slug);
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const lenis = useLenis();
  
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showStickyMobileBar, setShowStickyMobileBar] = useState(false);
  const [isExpandedMode, setIsExpandedMode] = useState(false);
  const [reviewsData, setReviewsData] = useState({ total: 0, averageRating: 5.0, reviews: [] });
  
  const buyButtonRef = useRef(null);

  // Gallery Images Array
  const galleryImages = (product?.images && product.images.length > 0)
    ? product.images
    : ["/products/midnight-peplum-fishtail-set/1.JPG"];

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

  // Lock body scroll and pause Lenis when Expanded Mode is open
  useEffect(() => {
    if (isExpandedMode) {
      document.body.style.overflow = "hidden";
      lenis?.stop();
    } else {
      document.body.style.overflow = "";
      lenis?.start();
    }
    return () => {
      document.body.style.overflow = "";
      lenis?.start();
    };
  }, [isExpandedMode, lenis]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#FAF8F5]">
        <div className="text-center">
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
      <div className="min-h-[70vh] flex items-center justify-center bg-[#FAF8F5] px-6 text-center">
        <div>
          <span className="text-[10.5px] uppercase tracking-[0.3em] text-[#C2922E] font-medium block mb-2">
            ICW BY SUKO
          </span>
          <h1 className="font-quiche text-3xl sm:text-4xl text-[#111113] mb-4">
            Piece Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[#555562] font-light mb-8 max-w-md mx-auto">
            The requested suiting piece is currently unavailable or has been archived.
          </p>
          <Link
            to="/collection"
            className="inline-flex items-center gap-2 border-b border-[#111113] text-[11px] uppercase tracking-[0.24em] font-medium text-[#111113] pb-1 hover:text-[#C2922E] hover:border-[#C2922E] transition-colors"
          >
            Return to Collection Hub
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
    addItem(product, size, qty);
    toast.success(`Added ${product.name} (Size ${size}) to your bag!`);
  };

  const isOutOfStock = product.stock === 0;

  // Related products (Max 4)
  const related = products ? products.filter(p => p.id !== product.id && (p.gender === product.gender || !p.gender)).slice(0, 4) : [];

  const setCategoryLabel = product.setType
    ? String(product.setType).toUpperCase()
    : (product.name || "").toLowerCase().includes("vest")
      ? "2-PIECE VEST SET"
      : product.category === "waistcoats"
        ? "2-PIECE VEST SET"
        : product.category === "blazers"
          ? "TAILORED BLAZER SUIT"
          : "SIGNATURE 2-PIECE SET";

  const setPiecesDescription = product.pieces
    ? product.pieces
    : (product.name || "").toLowerCase().includes("fishtail") || (product.name || "").toLowerCase().includes("skirt")
      ? "Includes Peplum Jacket + Coordinated Fishtail Skirt."
      : (product.name || "").toLowerCase().includes("vest")
        ? "Includes Sculpted Vest + Coordinated Column Skirt."
        : "Includes Tailored Jacket + Coordinated Formal Trousers.";

  const activeColors = product.availableColors && product.availableColors.length > 0
    ? COLOURS.filter(c => product.availableColors.some(ac => ac.toLowerCase() === (c.name || "").toLowerCase()))
    : product.color
      ? COLOURS.filter(c => c.name.toLowerCase() === product.color.toLowerCase())
      : COLOURS.slice(0, 1);

  return (
    <div 
      data-testid="product-detail-page"
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white transition-colors duration-300 pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-24"
    >
      <SEO 
        title={product.name}
        description={product.description || `Bespoke luxury corporate tailoring — ${product.name} by ICW.`}
        image={galleryImages[0]}
        productData={product}
      />

      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 mb-16 sm:mb-24">
        
        {/* Mobile View: Large Carousel */}
        <div className="block lg:hidden mb-8">
          <div 
            className="relative aspect-[3/4] bg-[#F2ECE1] overflow-hidden cursor-zoom-in flex items-center justify-center"
            onClick={() => setIsExpandedMode(true)}
          >
            <img
              src={galleryImages[activeImage]}
              alt={`${product.name} - view ${activeImage + 1}`}
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
        </div>

        {/* Desktop Fixed 3-Part Layout: [ Rail ~6% ] | [ Main Image ~56% ] | [ Details Panel ~38% ] */}
        <div className="hidden lg:flex items-stretch gap-8 xl:gap-12 w-full">
          
          {/* 1. Thumbnail Rail */}
          <div className="w-16 xl:w-20 shrink-0 flex flex-col justify-start gap-3">
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
                    ? "border border-[#111113] opacity-100 ring-1 ring-[#111113]"
                    : "opacity-40 hover:opacity-85"
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-top"
                />
              </button>
            ))}
          </div>

          {/* 2. Dominant Selected Image */}
          <div className="flex-1 relative min-h-[780px] xl:min-h-[850px] self-stretch bg-[#F5F0E6] overflow-hidden group flex items-center justify-center">
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
                src={galleryImages[activeImage]}
                alt={`${product.name} - view ${activeImage + 1}`}
                fetchPriority="high"
                decoding="async"
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

            {/* Floating Expand Icon on Desktop Hover */}
            <div 
              onClick={() => setIsExpandedMode(true)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#111113] shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer backdrop-blur-sm"
              title="Expand Lookbook"
            >
              <Maximize2 size={15} />
            </div>

          </div>

          {/* 3. Product Info & Actions Panel */}
          <div className="w-[360px] xl:w-[410px] shrink-0 flex flex-col justify-start space-y-5">
            
            {/* Breadcrumb & Brand */}
            <div>
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.22em] text-[#777782] font-medium mb-3">
                <Link to="/" className="hover:text-[#111113] transition-colors">Home</Link>
                <span>/</span>
                <Link to="/collection" className="hover:text-[#111113] transition-colors">Collections</Link>
                <span>/</span>
                <Link to="/women" className="hover:text-[#111113] transition-colors">Women</Link>
              </nav>

              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#C2922E] font-medium font-body">
                  ICW BY SUKO
                </span>
                <span className="text-[9.5px] uppercase tracking-[0.2em] text-[#666672] font-mono">
                  REF: {String(product.id || "").toUpperCase()}
                </span>
              </div>

              <h1 className="font-quiche text-2xl xl:text-3xl font-light text-[#111113] tracking-tight leading-[1.1] mb-1.5">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#C2922E] font-medium">
                  {setCategoryLabel}
                </span>
                {product.fabric && (
                  <>
                    <span className="text-[#9999A0]">&bull;</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#666672]">
                      {product.fabric}
                    </span>
                  </>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 pb-4 border-b border-[#E8E4DC]">
                <p className="font-quiche text-2xl text-[#111113] font-normal">
                  {formatINR(product.price)}
                </p>
                <span className="text-[10px] text-[#666672] uppercase tracking-widest font-light">
                  Complete Set &middot; Taxes Included
                </span>
              </div>
            </div>

            {/* Colour Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#111113]">
                  COLOUR: <span className="font-light text-[#555562]">{product.color || "Navy"}</span>
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                {activeColors.map((col) => {
                  const isCurrent = (product.color || "Navy").toLowerCase() === col.name.toLowerCase();
                  return (
                    <button
                      key={col.name}
                      type="button"
                      title={col.name}
                      aria-label={`Select color ${col.name}`}
                      className={`relative w-6 h-6 rounded-full transition-transform ${
                        isCurrent ? "ring-2 ring-[#C2922E] ring-offset-2 ring-offset-[#FAF8F5] scale-110" : "hover:scale-105 opacity-80"
                      }`}
                      style={{ backgroundColor: col.hex }}
                    />
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
                  className="text-[10.5px] uppercase tracking-[0.2em] font-medium text-[#C2922E] border-b border-[#C2922E] pb-0.5 hover:opacity-80 transition-opacity"
                >
                  SIZE GUIDE
                </button>
              </div>

              {/* Size Buttons Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(product.sizes || SIZES).map((s) => {
                  const isSelected = size === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={`py-2 text-[10.5px] uppercase tracking-[0.2em] font-medium transition-all ${
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

            {/* Complete Coordinated Set Banner */}
            <div className="p-3.5 bg-[#F2EDE2] border border-[#E0D9CB]">
              <div className="mb-1">
                <span className="text-[9.5px] uppercase tracking-[0.24em] font-semibold text-[#111113]">
                  COMPLETE COORDINATED SET
                </span>
              </div>
              <p className="text-xs text-[#484852] font-light leading-relaxed">
                {setPiecesDescription}
              </p>
            </div>

            {/* Add to Bag & Wishlist */}
            <div ref={buyButtonRef} className="space-y-2.5 pt-1">
              <div className="flex gap-3">
                <button
                  type="button"
                  data-testid="add-to-cart-btn"
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3.5 px-6 text-[10.5px] sm:text-[11px] uppercase tracking-[0.24em] font-medium transition-all shadow-sm active:scale-[0.99] ${
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
                  className={`w-12 shrink-0 flex items-center justify-center border transition-colors ${
                    isInWishlist(product.id)
                      ? "border-[#C2922E] bg-[#C2922E]/10 text-[#C2922E]"
                      : "border-[#DDD8CE] text-[#111113] hover:border-[#111113]"
                  }`}
                >
                  <Heart size={16} strokeWidth={1.5} className={isInWishlist(product.id) ? "fill-[#C2922E]" : ""} />
                </button>
              </div>
            </div>

            {/* Accordion */}
            <ProductAccordion product={product} />

          </div>
        </div>

      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 mb-16 sm:mb-20">
          <div className="flex items-end justify-between mb-6 pb-3 border-b border-[#E8E4DC]">
            <div>
              <span className="text-[9.5px] uppercase tracking-[0.26em] text-[#C2922E] font-medium block mb-1">
                CURATED SELECTION
              </span>
              <h2 className="font-quiche text-2xl sm:text-3xl font-light text-[#111113] tracking-tight">
                You May Also Like
              </h2>
            </div>
            <Link
              to="/collection"
              className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#111113] hover:text-[#C2922E] transition-colors border-b border-[#111113] hover:border-[#C2922E] pb-0.5"
            >
              All Sets &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {related.map((p, i) => (
              <ProductCard key={p.id || i} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Client Reviews Section */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 mb-16">
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
