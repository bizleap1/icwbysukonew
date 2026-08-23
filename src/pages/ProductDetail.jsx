import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useLenis } from "lenis/react";
import { toast } from "sonner";
import { formatINR, SIZES, COLOURS } from "../data/products";
import { useProducts } from "../context/ProductContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import ProductCard from "../components/ProductCard";

const ProductDetail = () => {
  const { slug } = useParams();
  const { products, getProductBySlug, loading } = useProducts();
  const product = getProductBySlug(slug);
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const lenis = useLenis();
  
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [openAccordion, setOpenAccordion] = useState("details"); // 'details' | 'size-fit' | 'fabric' | 'shipping'
  const [showStickyMobileBar, setShowStickyMobileBar] = useState(false);
  
  // Expanded Lightbox / Immersive Mode states
  const [isExpandedMode, setIsExpandedMode] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  
  const buyButtonRef = useRef(null);

  // Reviews state
  const [reviewsData, setReviewsData] = useState({ total: 0, averageRating: 5.0, reviews: [] });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Safe fallback to full gallery images (supports all 7 photos)
  const galleryImages = (product?.images && product.images.length > 0)
    ? product.images
    : ["/products/midnight-peplum-fishtail-set/1.JPG"];

  // Lock body scroll and pause Lenis when Expanded Mode is open
  useEffect(() => {
    if (isExpandedMode) {
      document.body.style.overflow = "hidden";
      lenis?.stop();
      setTimeout(() => {
        const el = document.getElementById(`expanded-img-${activeImage}`);
        if (el) {
          el.scrollIntoView({ behavior: "instant", block: "start" });
        }
      }, 50);
    } else {
      document.body.style.overflow = "";
      lenis?.start();
    }
    return () => {
      document.body.style.overflow = "";
      lenis?.start();
    };
  }, [isExpandedMode, activeImage, lenis]);

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

  // Keyboard navigation for Expanded Mode
  const handlePrevImage = useCallback(() => {
    setIsZoomed(false);
    setActiveImage((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  }, [galleryImages.length]);

  const handleNextImage = useCallback(() => {
    setIsZoomed(false);
    setActiveImage((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  }, [galleryImages.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isExpandedMode) return;
      if (e.key === "Escape") {
        setIsExpandedMode(false);
        setIsZoomed(false);
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "z" || e.key === "Z") {
        setIsZoomed((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpandedMode, handlePrevImage, handleNextImage]);

  // Touch Swipe for Mobile
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) {
      handleNextImage();
    } else if (diff < -50) {
      handlePrevImage();
    }
    setTouchStart(null);
  };

  // Fetch reviews
  useEffect(() => {
    if (product?.id) {
      fetch(`${API_BASE_URL}/api/reviews/product/${product.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setReviewsData(data);
        })
        .catch(err => console.error(err));
    }
  }, [product?.id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#FAF8F5] dark:bg-[#0A0A0C]">
        <div className="text-center">
          <span className="text-[10.5px] uppercase tracking-[0.3em] text-[#C2922E] font-medium block mb-2">
            ICW BY SUKO
          </span>
          <p className="font-quiche text-2xl font-light text-[#111113] dark:text-white">
            Loading tailored piece...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#FAF8F5] dark:bg-[#0A0A0C] px-6 text-center">
        <div>
          <span className="text-[10.5px] uppercase tracking-[0.3em] text-[#C2922E] font-medium block mb-2">
            ICW BY SUKO
          </span>
          <h1 className="font-quiche text-3xl sm:text-4xl text-[#111113] dark:text-white mb-4">
            Piece Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[#555562] dark:text-white/60 font-light mb-8 max-w-md mx-auto">
            The requested suiting piece is currently unavailable.
          </p>
          <Link
            to="/collection"
            className="inline-flex items-center gap-2 border-b border-[#111113] dark:border-white text-[11px] uppercase tracking-[0.24em] font-medium text-[#111113] dark:text-white pb-1 hover:text-[#C2922E] hover:border-[#C2922E] transition-colors"
          >
            Return to Collection Hub
          </Link>
        </div>
      </div>
    );
  }

  // Related products (Max 4)
  const related = products ? products.filter(p => p.id !== product.id && p.gender === product.gender).slice(0, 4) : [];

  const handleAdd = () => {
    if (!size) {
      toast.error("Please select a size before adding to bag");
      return;
    }
    addItem(product, size, qty);
    toast.success(`Added ${product.name} (Size ${size}) to your bag!`);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user?.authenticated) {
      toast.error("Please sign in to leave a review.");
      navigate("/auth");
      return;
    }
    if (!newComment.trim()) {
      toast.error("Please write feedback regarding your piece.");
      return;
    }
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: product.id,
          rating: newRating,
          comment: newComment
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");

      toast.success("Review submitted!");
      setNewComment("");
      setShowReviewForm(false);
      const updated = await fetch(`${API_BASE_URL}/api/reviews/product/${product.id}`).then(r => r.json());
      setReviewsData(updated);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const setCategoryLabel = product.setType
    ? product.setType.toUpperCase()
    : product.name.toLowerCase().includes("vest")
      ? "2-PIECE VEST SET"
      : product.category === "waistcoats"
        ? "2-PIECE VEST SET"
        : product.category === "blazers"
          ? "TAILORED BLAZER SUIT"
          : "SIGNATURE 2-PIECE SET";

  const setPiecesDescription = product.pieces
    ? product.pieces
    : product.name.toLowerCase().includes("fishtail") || product.name.toLowerCase().includes("skirt")
      ? "Includes Peplum Jacket + Coordinated Fishtail Skirt."
      : product.name.toLowerCase().includes("vest")
        ? "Includes Sculpted Vest + Coordinated Column Skirt."
        : product.category === "waistcoats"
          ? "Includes Tailored Waistcoat + Coordinated Formal Trousers."
          : product.category === "blazers"
            ? "Includes Sculpted Blazer + Coordinated Formal Trousers."
            : "Includes Tailored Jacket + Coordinated Formal Trousers.";

  const activeColors = product.availableColors && product.availableColors.length > 0
    ? COLOURS.filter(c => product.availableColors.some(ac => ac.toLowerCase() === c.name.toLowerCase()))
    : product.color
      ? COLOURS.filter(c => c.name.toLowerCase() === product.color.toLowerCase())
      : COLOURS.slice(0, 1);

  return (
    <div className="grain bg-[#FAF8F5] dark:bg-transparent text-[#121215] dark:text-[#F6F6F0] font-body selection:bg-[#C2922E] selection:text-white transition-colors duration-300 pt-16 sm:pt-20 lg:pt-22 pb-16 sm:pb-24">
      
      {/* =========================================================================
          DESKTOP MAIN PRODUCT VIEW (EXACT VICTORIA BECKHAM UX REFERENCE)
          [ THUMBNAIL RAIL: ~6% ] | [ ONE LARGE DOMINANT MAIN IMAGE: ~56% ] | [ PRODUCT DETAILS: ~38% ]
          ========================================================================= */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 mb-16 sm:mb-24">
        
        {/* Mobile View: Large Carousel with 1/5 counter & Touch Swipe */}
        <div className="block lg:hidden mb-8">
          <div 
            className="relative aspect-[3/4] bg-[#F2ECE1] dark:bg-[#151518] overflow-hidden cursor-zoom-in flex items-center justify-center"
            onClick={() => {
              setIsExpandedMode(true);
              setIsZoomed(false);
            }}
          >
            <img
              src={galleryImages[activeImage]}
              alt={`${product.name} - view ${activeImage + 1}`}
              className="w-full h-full object-cover object-top transition-opacity duration-300"
            />
            
            {/* Tap to Zoom indicator */}
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md p-1.5 rounded-full text-white/80">
              <Maximize2 size={13} />
            </div>

            {/* Pagination Pill (e.g. 1 / 5) */}
            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white font-mono rounded-full">
              {activeImage + 1} / {galleryImages.length}
            </div>

            {/* Prev / Next Arrows */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 backdrop-blur-md text-white flex items-center justify-center rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 backdrop-blur-md text-white flex items-center justify-center rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

            {/* Mobile Thumbnail Dots */}
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
          
          {/* =========================================================================
              PART 1: VERTICAL THUMBNAIL RAIL (~6% WIDTH, EXACTLY 5 THUMBNAILS)
              ========================================================================= */}
          <div className="w-16 xl:w-20 shrink-0 flex flex-col justify-start gap-3">
            {galleryImages.map((imgUrl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(idx)}
                className={`relative aspect-[3/4] w-full overflow-hidden bg-[#F2ECE1] dark:bg-[#151518] transition-all duration-200 cursor-pointer ${
                  activeImage === idx
                    ? "border border-[#111113] dark:border-white opacity-100"
                    : "opacity-40 hover:opacity-85"
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`Thumbnail 0${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-top"
                />
              </button>
            ))}
          </div>

          {/* =========================================================================
              PART 2: ONE LARGE DOMINANT SELECTED PRODUCT IMAGE (~56% WIDTH)
              Matches the exact vertical alignment & height of the right product panel
              ========================================================================= */}
          <div className="flex-1 relative min-h-[780px] xl:min-h-[850px] self-stretch bg-[#F5F0E6] dark:bg-[#121215] overflow-hidden group flex items-center justify-center">
            
            {/* Minimal Left Navigation Arrow */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 text-[#111113] dark:text-white hover:text-[#C2922E] flex items-center justify-center opacity-60 hover:opacity-100 transition-all cursor-pointer"
            >
              <ChevronLeft size={28} strokeWidth={1.2} />
            </button>

            {/* Large Image (Fills Container, Click to Enter Expanded Mode) */}
            <div
              onClick={() => {
                setIsExpandedMode(true);
                setIsZoomed(false);
              }}
              className="w-full h-full flex items-center justify-center cursor-zoom-in"
            >
              <motion.img
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                src={galleryImages[activeImage]}
                alt={`${product.name} - selected view ${activeImage + 1}`}
                decoding="async"
                className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.015]"
              />
            </div>

            {/* Minimal Right Navigation Arrow */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 text-[#111113] dark:text-white hover:text-[#C2922E] flex items-center justify-center opacity-60 hover:opacity-100 transition-all cursor-pointer"
            >
              <ChevronRight size={28} strokeWidth={1.2} />
            </button>

            {/* Minimal Counter Badge (e.g. 1 / 5) */}
            <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md px-2.5 py-1 text-[9.5px] uppercase tracking-[0.2em] text-white/90 font-mono">
              {activeImage + 1} / {galleryImages.length}
            </div>
          </div>

          {/* =========================================================================
              PART 3: CLEAN STICKY PRODUCT INFORMATION PANEL (~38% WIDTH)
              ========================================================================= */}
          <div className="w-[360px] xl:w-[410px] shrink-0 flex flex-col justify-start space-y-5">
            
            {/* Breadcrumb & Brand Header */}
            <div>
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.22em] text-[#777782] dark:text-white/50 font-medium mb-3">
                <Link to="/" className="hover:text-[#111113] dark:hover:text-white transition-colors">Home</Link>
                <span>/</span>
                <Link to="/collection" className="hover:text-[#111113] dark:hover:text-white transition-colors">Collections</Link>
                <span>/</span>
                <Link to="/women" className="hover:text-[#111113] dark:hover:text-white transition-colors">
                  Women
                </Link>
              </nav>

              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#C2922E] font-medium font-body">
                  ICW BY SUKO
                </span>
                <span className="text-[9.5px] uppercase tracking-[0.2em] text-[#666672] dark:text-white/50 font-mono">
                  REF: {product.id?.toUpperCase()}
                </span>
              </div>

              <h1 className="font-quiche text-2xl xl:text-3xl font-light text-[#111113] dark:text-white tracking-tight leading-[1.1] mb-1.5">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#C2922E] font-medium">
                  {setCategoryLabel}
                </span>
                {product.fabric && (
                  <>
                    <span className="text-[#9999A0] dark:text-white/30">&bull;</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#666672] dark:text-white/60">
                      {product.fabric}
                    </span>
                  </>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 pb-4 border-b border-[#E8E4DC] dark:border-white/10">
                <p className="font-quiche text-2xl text-[#111113] dark:text-white font-normal">
                  {formatINR(product.price)}
                </p>
                <span className="text-[10px] text-[#666672] dark:text-white/50 uppercase tracking-widest font-light">
                  Complete Set &middot; Taxes Included
                </span>
              </div>
            </div>

            {/* Colour Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#111113] dark:text-white">
                  COLOUR: <span className="font-light text-[#555562] dark:text-white/70">{product.color || "Navy"}</span>
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
                      className={`relative w-6 h-6 rounded-full transition-transform ${
                        isCurrent ? "ring-2 ring-[#C2922E] ring-offset-2 ring-offset-[#FAF8F5] dark:ring-offset-[#0A0A0C] scale-110" : "hover:scale-105 opacity-80"
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
                <span className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#111113] dark:text-white">
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
                          ? "bg-[#111113] dark:bg-white text-white dark:text-[#111113] border border-[#111113] dark:border-white shadow-sm"
                          : "bg-transparent text-[#111113] dark:text-white/80 border border-[#DDD8CE] dark:border-white/15 hover:border-[#111113] dark:hover:border-white"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COMPLETE COORDINATED SET INFORMATION */}
            <div className="p-3.5 bg-[#F2EDE2] dark:bg-[#15151A] border border-[#E0D9CB] dark:border-white/10">
              <div className="mb-1">
                <span className="text-[9.5px] uppercase tracking-[0.24em] font-semibold text-[#111113] dark:text-white">
                  COMPLETE COORDINATED SET
                </span>
              </div>
              <p className="text-xs text-[#484852] dark:text-white/80 font-light leading-relaxed">
                {setPiecesDescription}
              </p>
            </div>

            {/* Add to Bag & Wishlist Actions */}
            <div ref={buyButtonRef} className="space-y-2.5 pt-1">
              <div className="flex gap-3">
                <button
                  type="button"
                  data-testid="add-to-cart-btn"
                  onClick={handleAdd}
                  className="flex-1 bg-[#111113] dark:bg-white text-white dark:text-[#111113] hover:bg-[#25252B] dark:hover:bg-white/90 py-3.5 px-6 text-[10.5px] sm:text-[11px] uppercase tracking-[0.24em] font-medium transition-all shadow-sm active:scale-[0.99]"
                >
                  ADD TO BAG &middot; {formatINR(product.price)}
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  aria-label="Save to Wishlist"
                  className={`w-13 shrink-0 flex items-center justify-center border transition-colors ${
                    isInWishlist(product.id)
                      ? "border-[#C2922E] bg-[#C2922E]/10 text-[#C2922E]"
                      : "border-[#DDD8CE] dark:border-white/15 text-[#111113] dark:text-white hover:border-[#111113] dark:hover:border-white"
                  }`}
                >
                  <Heart size={16} strokeWidth={1.5} className={isInWishlist(product.id) ? "fill-[#C2922E]" : ""} />
                </button>
              </div>
            </div>

            {/* Minimal Accordions */}
            <div className="pt-3 border-t border-[#E8E4DC] dark:border-white/10 space-y-0">
              
              {/* 1. PRODUCT DETAILS */}
              <div className="border-b border-[#E8E4DC] dark:border-white/10 py-3">
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === "details" ? "" : "details")}
                  className="w-full flex items-center justify-between text-left text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#111113] dark:text-white"
                >
                  <span>PRODUCT DETAILS</span>
                  {openAccordion === "details" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <AnimatePresence>
                  {openAccordion === "details" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pt-2 text-xs text-[#555562] dark:text-white/70 font-light leading-relaxed"
                    >
                      <p>{product.description}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. SIZE & FIT */}
              <div className="border-b border-[#E8E4DC] dark:border-white/10 py-3">
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === "size-fit" ? "" : "size-fit")}
                  className="w-full flex items-center justify-between text-left text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#111113] dark:text-white"
                >
                  <span>SIZE & FIT</span>
                  {openAccordion === "size-fit" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <AnimatePresence>
                  {openAccordion === "size-fit" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pt-2 text-xs text-[#555562] dark:text-white/70 font-light leading-relaxed space-y-1.5"
                    >
                      {product.sizeFit ? (
                        <>
                          <p>{product.sizeFit.split(". ")[0]}.</p>
                          <p>{product.sizeFit.split(". ").slice(1).join(". ")}</p>
                        </>
                      ) : (
                        <>
                          <p>Tailored formal fit engineered for structured composure.</p>
                          <p>Refer to the Size Guide for detailed top and bottom measurements.</p>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. FABRIC & CARE */}
              <div className="border-b border-[#E8E4DC] dark:border-white/10 py-3">
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === "fabric" ? "" : "fabric")}
                  className="w-full flex items-center justify-between text-left text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#111113] dark:text-white"
                >
                  <span>FABRIC & CARE</span>
                  {openAccordion === "fabric" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <AnimatePresence>
                  {openAccordion === "fabric" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pt-2 text-xs text-[#555562] dark:text-white/70 font-light leading-relaxed space-y-1"
                    >
                      <p><strong>Fabric composition:</strong> {product.fabricCare?.fabric || product.fabric || "Refer to product specification."}</p>
                      <p><strong>Care:</strong> {product.fabricCare?.care || "Follow the garment care label instructions."}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 4. SHIPPING & RETURNS */}
              <div className="border-b border-[#E8E4DC] dark:border-white/10 py-3">
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === "shipping" ? "" : "shipping")}
                  className="w-full flex items-center justify-between text-left text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#111113] dark:text-white"
                >
                  <span>SHIPPING & RETURNS</span>
                  {openAccordion === "shipping" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <AnimatePresence>
                  {openAccordion === "shipping" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pt-2 text-xs text-[#555562] dark:text-white/70 font-light leading-relaxed space-y-1"
                    >
                      <p>Complimentary insured delivery across India in ICW garment bags.</p>
                      <p>Complimentary size exchanges available within 7 days.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =========================================================================
          SECTION: YOU MAY ALSO LIKE (Related Coordinated Sets)
          ========================================================================= */}
      {related.length > 0 && (
        <section className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 mb-16 sm:mb-20">
          <div className="flex items-end justify-between mb-6 pb-3 border-b border-[#E8E4DC] dark:border-white/10">
            <div>
              <span className="text-[9.5px] uppercase tracking-[0.26em] text-[#C2922E] font-medium block mb-1">
                CURATED SELECTION
              </span>
              <h2 className="font-quiche text-2xl sm:text-3xl font-light text-[#111113] dark:text-white tracking-tight">
                You May Also Like
              </h2>
            </div>
            <Link
              to="/collection"
              className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#111113] dark:text-white hover:text-[#C2922E] transition-colors border-b border-[#111113] dark:border-white hover:border-[#C2922E] pb-0.5"
            >
              All Sets &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION: CLIENT REVIEWS & RATINGS (COMPACT 2-STATE LUXURY DESIGN)
          ========================================================================= */}
      <section className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 mb-14 sm:mb-16">
        <div className="max-w-3xl">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#E8E4DC] dark:border-white/10">
            <div>
              <span className="text-[9.5px] uppercase tracking-[0.26em] text-[#C2922E] font-medium block mb-1">
                CLIENT REVIEWS & RATINGS
              </span>
              
              {/* If reviews exist (> 0), show rating summary; otherwise show slim empty sentence */}
              {reviewsData.total > 0 ? (
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-quiche text-2xl sm:text-3xl font-light text-[#111113] dark:text-white">
                    {reviewsData.averageRating}
                  </span>
                  <div>
                    <span className="text-[#C2922E] text-xs tracking-widest">
                      {"★".repeat(Math.round(reviewsData.averageRating))}
                    </span>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#666672] dark:text-white/50 font-mono">
                      Based on {reviewsData.total} {reviewsData.total === 1 ? "review" : "reviews"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-[13px] text-[#666672] dark:text-white/60 font-light">
                  No reviews yet. Be the first to share your experience.
                </p>
              )}
            </div>

            {/* Collapsible Form Toggle Button */}
            <button
              type="button"
              onClick={() => setShowReviewForm((prev) => !prev)}
              className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#111113] dark:text-white hover:text-[#C2922E] transition-colors border-b border-[#111113] dark:border-white hover:border-[#C2922E] pb-0.5 self-start sm:self-auto shrink-0"
            >
              {showReviewForm ? "CANCEL ✕" : "WRITE A REVIEW →"}
            </button>
          </div>

          {/* Collapsible Review Submission Form */}
          <AnimatePresence>
            {showReviewForm && (
              <motion.form
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleReviewSubmit}
                className="overflow-hidden pt-4 pb-2 space-y-3"
              >
                <div className="bg-[#F6F2EA] dark:bg-[#121215] border border-[#E8E4DC] dark:border-white/10 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] uppercase tracking-[0.22em] text-[#111113] dark:text-white font-medium">
                      Your Rating & Feedback
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className={`text-sm sm:text-base transition-transform ${
                            star <= newRating ? "text-[#C2922E] scale-110" : "text-[#CCCCCC] dark:text-white/20"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your experience with fit, tailoring proportions, and fabric drape..."
                    className="w-full bg-white dark:bg-black/40 border border-[#DDD8CE] dark:border-white/15 p-2.5 text-xs text-[#111113] dark:text-white outline-none focus:border-[#C2922E] placeholder:text-[#9999A0]"
                    required
                  />

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="bg-[#111113] dark:bg-white text-white dark:text-[#111113] px-5 py-2 text-[10.5px] uppercase tracking-[0.22em] font-medium hover:bg-[#25252B] dark:hover:bg-white/90 transition-colors disabled:opacity-50"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Reviews List (Only shown when reviews exist) */}
          {reviewsData.reviews.length > 0 && (
            <div className="pt-4 space-y-4">
              {reviewsData.reviews.map((r) => (
                <div key={r.id} className="border-b border-[#E8E4DC] dark:border-white/10 pb-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#111113] dark:text-white">
                        {r.user?.name || "Verified Client"}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-[#C2922E] bg-[#C2922E]/10 px-1.5 py-0.5">
                        Verified Purchase
                      </span>
                    </div>
                    <span className="text-xs text-[#C2922E]">{"★".repeat(r.rating)}</span>
                  </div>
                  <p className="text-xs text-[#555562] dark:text-white/75 font-light leading-relaxed">
                    {r.comment}
                  </p>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* =========================================================================
          MOBILE STICKY BOTTOM PURCHASE BAR
          ========================================================================= */}
      <AnimatePresence>
        {showStickyMobileBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[#FAF8F5]/95 dark:bg-[#0E0E12]/95 backdrop-blur-md border-t border-[#E8E4DC] dark:border-white/10 px-4 py-3 shadow-2xl flex items-center justify-between gap-3"
          >
            <div>
              <p className="font-quiche text-sm text-[#111113] dark:text-white font-medium truncate max-w-[160px]">
                {product.name}
              </p>
              <p className="text-xs font-mono text-[#C2922E]">
                {formatINR(product.price)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              className="bg-[#111113] dark:bg-white text-white dark:text-[#111113] px-5 py-2.5 text-[10.5px] uppercase tracking-[0.22em] font-medium shadow-md"
            >
              Add to Bag
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          IMMERSIVE FULLSCREEN VERTICAL SCROLL GALLERY (EXACT USER REFERENCE)
          ========================================================================= */}
      {createPortal(
        <AnimatePresence>
          {isExpandedMode && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] bg-[#FAF8F5] dark:bg-[#0A0A0C] text-[#111113] dark:text-[#F6F6F0] overflow-y-auto overscroll-contain transition-colors duration-300"
              data-lenis-prevent="true"
              data-lenis-prevent-touch="true"
            >
              
              {/* Minimal Circular Close Button (Top Right Floating) */}
              <button
                type="button"
                onClick={() => setIsExpandedMode(false)}
                title="Close Gallery (Esc)"
                aria-label="Close Fullscreen Gallery"
                className="fixed top-5 right-6 sm:top-8 sm:right-10 z-[100000] w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-md border border-black/15 dark:border-white/20 flex items-center justify-center text-[#111113] dark:text-white hover:scale-105 hover:bg-white dark:hover:bg-black transition-all duration-200 cursor-pointer shadow-md"
              >
                <X size={18} strokeWidth={1.3} />
              </button>

              {/* Seamless Vertical Stream of Ultra-Large Editorial Images */}
              <div className="w-full min-h-screen flex flex-col items-center gap-8 sm:gap-16 pt-4 sm:pt-8 pb-32 px-4 sm:px-12">
                {galleryImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    id={`expanded-img-${idx}`}
                    className="w-full flex items-center justify-center max-w-[1400px] xl:max-w-[1550px]"
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} - editorial view 0${idx + 1}`}
                      className="w-full h-auto object-cover select-none"
                      loading={idx <= 1 ? "eager" : "lazy"}
                    />
                  </div>
                ))}
              </div>

            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* =========================================================================
          SIZE GUIDE MODAL
          ========================================================================= */}
      {createPortal(
        <AnimatePresence>
          {showSizeGuide && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSizeGuide(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-[#FAF8F5] dark:bg-[#101014] border border-[#E0D9CC] dark:border-white/15 p-6 sm:p-10 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <button 
                  onClick={() => setShowSizeGuide(false)}
                  className="absolute top-5 right-5 text-[#777782] hover:text-[#111113] dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="text-center mb-8">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-[#C2922E] mb-2 block">
                    MEASUREMENTS
                  </span>
                  <h2 className="font-quiche text-2xl sm:text-3xl text-[#111113] dark:text-white">
                    Size Guide
                  </h2>
                  <p className="text-xs text-[#555562] dark:text-white/60 font-light mt-2 max-w-md mx-auto">
                    All measurements are in inches.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Top Guide */}
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-[#111113] dark:text-white mb-2 pb-1 border-b border-[#E8E4DC] dark:border-white/10">
                      Jacket / Top Measurements
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-body">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wider text-[#777782] dark:text-white/50 border-b border-[#E8E4DC] dark:border-white/10">
                            <th className="py-2.5 px-2">Size</th>
                            <th className="py-2.5 px-2">Bust / Chest</th>
                            <th className="py-2.5 px-2">Shoulder</th>
                            <th className="py-2.5 px-2">Sleeve</th>
                            <th className="py-2.5 px-2">Length</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#333338] dark:text-white/80">
                          {[
                            { s: "XS", b: '33"', sh: '14.5"', sl: '23.5"', l: '28"' },
                            { s: "S", b: '35"', sh: '15.0"', sl: '24.0"', l: '28.5"' },
                            { s: "M", b: '37"', sh: '15.5"', sl: '24.5"', l: '29"' },
                            { s: "L", b: '39"', sh: '16.0"', sl: '25.0"', l: '29.5"' },
                            { s: "XL", b: '41"', sh: '16.5"', sl: '25.5"', l: '30"' },
                          ].map((row) => (
                            <tr key={row.s} className="border-b border-[#EAE6DF]/60 dark:border-white/5 hover:bg-[#F2ECE1] dark:hover:bg-white/5">
                              <td className="py-2 px-2 font-medium">{row.s}</td>
                              <td className="py-2 px-2">{row.b}</td>
                              <td className="py-2 px-2">{row.sh}</td>
                              <td className="py-2 px-2">{row.sl}</td>
                              <td className="py-2 px-2">{row.l}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bottom Guide */}
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] font-medium text-[#111113] dark:text-white mb-2 pb-1 border-b border-[#E8E4DC] dark:border-white/10">
                      Coordinated Trouser Measurements
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-body">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wider text-[#777782] dark:text-white/50 border-b border-[#E8E4DC] dark:border-white/10">
                            <th className="py-2.5 px-2">Size</th>
                            <th className="py-2.5 px-2">High Waist</th>
                            <th className="py-2.5 px-2">Hips</th>
                            <th className="py-2.5 px-2">Inseam</th>
                            <th className="py-2.5 px-2">Rise</th>
                          </tr>
                        </thead>
                        <tbody className="text-[#333338] dark:text-white/80">
                          {[
                            { s: "XS", w: '25-26"', h: '35-36"', ins: '32"', r: '11.5"' },
                            { s: "S", w: '27-28"', h: '37-38"', ins: '32.5"', r: '12.0"' },
                            { s: "M", w: '29-30"', h: '39-40"', ins: '33"', r: '12.5"' },
                            { s: "L", w: '31-32"', h: '41-42"', ins: '33.5"', r: '13.0"' },
                            { s: "XL", w: '33-34"', h: '43-44"', ins: '34"', r: '13.5"' },
                          ].map((row) => (
                            <tr key={row.s} className="border-b border-[#EAE6DF]/60 dark:border-white/5 hover:bg-[#F2ECE1] dark:hover:bg-white/5">
                              <td className="py-2 px-2 font-medium">{row.s}</td>
                              <td className="py-2 px-2">{row.w}</td>
                              <td className="py-2 px-2">{row.h}</td>
                              <td className="py-2 px-2">{row.ins}</td>
                              <td className="py-2 px-2">{row.r}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
};

export default ProductDetail;
