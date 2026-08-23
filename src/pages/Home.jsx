import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, Scissors, Award, Compass, Sparkles, Feather, ShieldCheck, RefreshCw, Plus, Minus } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductContext";

// Catalog fallback products for instant render (Diversified model faces across real shoots)
const FALLBACK_WOMEN = [
  {
    id: "fw-1",
    name: "Midnight Peplum Set",
    categoryName: "Executive Co-ord Sets",
    price: 72000,
    images: ["/products/midnight-peplum-fishtail-set/1.JPG", "/products/midnight-peplum-fishtail-set/2.png"],
    slug: "the-midnight-peplum-set",
    gender: "female"
  },
  {
    id: "fw-2",
    name: "Midnight Sculpted Vest Set",
    categoryName: "Executive Co-ord Sets",
    price: 68000,
    images: ["/products/midnight-sculpted-vest-set/1.JPG", "/products/midnight-sculpted-vest-set/2.png"],
    slug: "the-midnight-sculpted-vest-set",
    gender: "female"
  },
  {
    id: "fw-3",
    name: "Aubergine Draped Set",
    categoryName: "Executive Co-ord Sets",
    price: 68000,
    images: ["/products/aubergine-draped-vest-mini-set/1.JPG", "/products/aubergine-draped-vest-mini-set/2.png"],
    slug: "the-aubergine-draped-set",
    gender: "female"
  },
  {
    id: "fw-4",
    name: "Aubergine Tailored Suit",
    categoryName: "Power Suits & Sets",
    price: 78000,
    images: ["/products/aubergine-tailored-power-suit/1.JPG", "/products/aubergine-tailored-power-suit/2.png"],
    slug: "the-aubergine-tailored-suit",
    gender: "female"
  },
  {
    id: "fw-5",
    name: "Dusty Rose Flare Suit",
    categoryName: "Power Suits & Sets",
    price: 76000,
    images: ["/products/dusty-rose-sculpted-flare-suit/1.JPG", "/products/dusty-rose-sculpted-flare-suit/2.png"],
    slug: "the-dusty-rose-flare-suit",
    gender: "female"
  },
  {
    id: "fw-6",
    name: "Plum Sculpted Suit",
    categoryName: "Power Suits & Sets",
    price: 78000,
    images: ["/products/the-plum-sculpted-suit/1.JPG", "/products/the-plum-sculpted-suit/2.png"],
    slug: "the-plum-sculpted-suit",
    gender: "female"
  },
  {
    id: "fw-7",
    name: "Dusty Rose Embroidered Set",
    categoryName: "Signature Co-ord Sets",
    price: 72000,
    images: ["/products/the-dusty-rose-embroidered-set/1.JPG", "/products/the-dusty-rose-embroidered-set/2.png"],
    slug: "the-dusty-rose-embroidered-set",
    gender: "female"
  },
  {
    id: "fw-8",
    name: "Noir Tailored Suit",
    categoryName: "Power Suits & Sets",
    price: 78000,
    images: ["/products/the-noir-tailored-suit/1.JPG", "/products/the-noir-tailored-suit/2.png"],
    slug: "the-noir-tailored-suit",
    gender: "female"
  },
  {
    id: "fw-9",
    name: "Noir Layered Suit",
    categoryName: "Power Suits & Sets",
    price: 82000,
    images: ["/products/the-noir-layered-suit/1.JPG", "/products/the-noir-layered-suit/2.png"],
    slug: "the-noir-layered-suit",
    gender: "female"
  }
];

const FALLBACK_MEN = [
  {
    id: "fm-1",
    name: "Midnight Pinstripe Executive Suit",
    categoryName: "Luxury Suits",
    price: 92000,
    images: ["/images/mens_item1_front_1782649409337.png", "/images/mens_item1_back_1782649420927.png"],
    slug: "midnight-pinstripe-suit-5",
    gender: "male",
    badge: "Signature"
  },
  {
    id: "fm-2",
    name: "Graphite Structured Blazer",
    categoryName: "Tailored Blazers",
    price: 58000,
    images: ["/images/mens_item2_front_1782649430719.png", "/images/mens_item2_back_1782649442548.png"],
    slug: "graphite-structured-blazer-6",
    gender: "male"
  },
  {
    id: "fm-3",
    name: "Crisp White Executive Shirt",
    categoryName: "Executive Shirts",
    price: 28000,
    images: ["/images/mens_item3_front_1782649454163.png", "/images/mens_item3_back_1782649466148.png"],
    slug: "crisp-white-executive-shirt-7",
    gender: "male"
  },
  {
    id: "fm-4",
    name: "Navy Twill Tailored Trousers",
    categoryName: "Premium Trousers",
    price: 26000,
    images: ["/images/mens_item5_front_1782649505331.png", "/images/mens_item5_back_1782649516789.png"],
    slug: "navy-twill-tailored-trousers-8",
    gender: "male"
  }
];

const Home = () => {
  const { products } = useProducts();
  const [newArrivalsTab, setNewArrivalsTab] = useState("women");
  const [essentialsTab, setEssentialsTab] = useState("women");
  const [categoryGender, setCategoryGender] = useState("women");
  const [openSignaturePillar, setOpenSignaturePillar] = useState(0);

  // Women products mapped directly to authentic ICW product collections
  const womenProducts = useMemo(() => {
    return FALLBACK_WOMEN;
  }, []);

  const menProducts = useMemo(() => {
    const list = products?.filter((p) => p.gender === "male" || p.gender === "men") || [];
    return list.length >= 4 ? list : [...list, ...FALLBACK_MEN.filter(f => !list.some(p => p.name === f.name))];
  }, [products]);

  const displayedNewArrivals = newArrivalsTab === "women" ? womenProducts.slice(0, 4) : menProducts.slice(0, 4);
  const displayedEssentials = essentialsTab === "women" ? womenProducts.slice(4, 8) : menProducts.slice(0, 4);

  return (
    <div data-testid="home-page" className="grain bg-[#FAF8F5] dark:bg-transparent text-[#121215] dark:text-[#F6F6F0] font-body selection:bg-[#C2922E] selection:text-white transition-colors duration-300">
      
      {/* =========================================================================
          SECTION 1: HERO — 75–85vh MOBILE / FULLSCREEN DESKTOP
          ========================================================================= */}
      <section 
        data-testid="hero-section"
        className="relative h-[78vh] sm:h-[85vh] lg:h-screen w-full bg-[#0A0A0C] overflow-hidden"
      >
        {/* Fullscreen Background Image with Focal Point Right */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-[#0A0A0C]">
          <img
            src="/boardroom_banner.jpg"
            alt="ICW Executive Tailoring"
            className="w-full h-full object-cover object-[78%_25%] sm:object-top opacity-90"
            decoding="async"
          />
          {/* Gradients ensuring uninterrupted typography legibility on the left */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-[2]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 sm:via-black/35 to-transparent z-[2]" />
        </div>

        {/* Lower-Third Anchored Hero Content */}
        <div className="absolute inset-x-0 bottom-[7vh] sm:bottom-[9vh] lg:bottom-[10vh] z-10 pointer-events-none">
          <div className="max-w-[1700px] w-full mx-auto px-5 sm:px-8 lg:px-14 xl:px-16 flex items-end justify-between">
            <div className="w-full max-w-[620px] pointer-events-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Eyebrow Label with Gold Accent (Inter Medium, 11px, 0.18em tracking) */}
                <div className="flex items-center gap-2.5 mb-2.5 sm:mb-[14px]">
                  <span className="w-4 h-[1px] bg-[#C2922E]" />
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#C2922E] font-medium font-body">
                    ICW — BY SUKO
                  </span>
                </div>

                {/* Main Headline (Quiche Typography, leading-[0.96]) */}
                <h1 className="font-quiche text-3xl sm:text-5xl lg:text-[4.2rem] xl:text-[4.75rem] tracking-tight text-white leading-[0.98] sm:leading-[0.96] font-light mb-3.5 sm:mb-[18px] drop-shadow-2xl">
                  The New <span className="italic font-normal text-white/90">Standard</span> <br />
                  of <span className="italic font-normal text-white/90">Corporate</span> Style.
                </h1>

                {/* Concise 2-Line Subcopy (Dimmer / lighter grey for hero dominance, 14-16px breathing room) */}
                <p className="text-white/80 sm:text-white/65 font-body text-xs sm:text-[13.5px] lg:text-[14.5px] tracking-wide font-light leading-relaxed max-w-[400px] mb-6 sm:mb-[28px] drop-shadow-sm">
                  Impeccable structure designed for the modern female leader. Tailored for ambition.
                </p>

                {/* Editorial Underline CTA */}
                <div className="flex flex-row items-center gap-7 sm:gap-11 lg:gap-12 pt-1 pb-1">
                  <Link
                    to="/women"
                    className="group inline-flex items-center gap-2 sm:gap-2.5 text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.22em] font-normal text-white hover:text-[#C2922E] transition-all duration-300"
                  >
                    <span className="border-b border-[#C2922E] pb-0.5 sm:pb-1 transition-all duration-300">
                      DISCOVER THE COLLECTION
                    </span>
                    <ArrowUpRight size={13} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: NEW ARRIVALS (2-Column Mobile Grid, Clean Spacing)
          ========================================================================= */}
      <section className="bg-[#F6F2EA] dark:bg-transparent pt-10 sm:pt-14 lg:pt-16 pb-10 sm:pb-12 lg:pb-14 px-4 sm:px-6 lg:px-[3.5vw] border-b border-[#E8E4DC] dark:border-white/10 transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-10 text-center md:text-left">
            <div>
              <span className="text-[10.5px] sm:text-[11px] lg:text-[11.5px] uppercase tracking-[0.26em] text-[#6A6A74] dark:text-white/60 font-medium block mb-3 sm:mb-3.5">
                THE LATEST FROM ICW
              </span>
              <h2 className="font-quiche text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#111113] dark:text-white">
                NEW ARRIVALS
              </h2>
            </div>
          </div>

          {/* 2-Column Mobile Grid / 4-Column Desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-7">
            <AnimatePresence mode="wait">
              {displayedNewArrivals.map((product, idx) => (
                <ProductCard key={product.id || idx} product={product} index={idx} />
              ))}
            </AnimatePresence>
          </div>

          {/* Bottom Link */}
          <div className="mt-7 sm:mt-9 text-center">
            <Link
              to="/new-in"
              className="group inline-flex items-center gap-2.5 text-[10.5px] sm:text-[11px] uppercase tracking-[0.24em] font-normal text-[#111113] dark:text-white hover:text-[#C2922E] dark:hover:text-[#C2922E] transition-all duration-300"
            >
              <span className="border-b border-[#111113] dark:border-white group-hover:border-[#C2922E] pb-1 transition-all duration-300">
                VIEW ALL NEW ARRIVALS
              </span>
              <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 3: WOMEN EDITORIAL (Panoramic High-Fashion Campaign)
          ========================================================================= */}
      <section className="bg-[#EFECE6] dark:bg-transparent pt-10 sm:pt-14 lg:pt-16 pb-10 sm:pb-14 lg:pb-16 px-4 sm:px-6 lg:px-[3.5vw] border-b border-[#E0DCD4] dark:border-white/10 transition-colors duration-300">
        <div className="max-w-[1680px] mx-auto">
          <Link
            to="/collection"
            className="group relative h-[65vh] sm:h-[72vh] lg:h-[680px] xl:h-[720px] overflow-hidden bg-[#1A1A1E] block"
          >
            <img
              src="/editorial.JPG"
              alt="The ICW Woman Campaign"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover object-[68%_12%] sm:object-[62%_10%] transition-transform duration-1000 ease-out group-hover:scale-105"
            />
            {/* Multi-Stop Left-to-Right + Bottom Fade Gradient (Model on right remains naturally illuminated) */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, rgba(10,10,12,0.92) 0%, rgba(10,10,12,0.78) 36%, rgba(10,10,12,0.35) 60%, rgba(10,10,12,0) 80%)"
              }}
            />
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(0deg, rgba(10,10,12,0.75) 0%, rgba(10,10,12,0.30) 35%, rgba(10,10,12,0) 60%)"
              }}
            />
            
            {/* Perfectly Anchored Content */}
            <div className="absolute inset-0 p-6 sm:p-12 lg:p-16 pt-10 sm:pt-16 lg:pt-20 flex flex-col justify-center max-w-[650px] z-10">
              {/* Refined Gold Eyebrow: Bright, readable luxury gold #C99A2E with wide tracking */}
              <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
                <span className="w-4 h-[1px] bg-[#C99A2E]" />
                <span className="text-[10.5px] sm:text-[11px] uppercase tracking-[0.24em] text-[#C99A2E] font-semibold font-body">
                  THE EDITORIAL &middot; SIGNATURE SUITING
                </span>
              </div>

              {/* Main Headline: Tighter luxury leading, bold visual dominance */}
              <h3 className="font-quiche text-3xl sm:text-5xl lg:text-6xl text-white font-light leading-[1.04] mb-3.5 sm:mb-4 drop-shadow-md">
                THE ICW <br />
                <span className="italic font-normal text-white/95">WOMAN</span>
              </h3>

              {/* Exact Copy: 100% Solid White on Mobile for Crystal-Clear Readability */}
              <p className="text-white sm:text-white/95 font-body text-[13.5px] sm:text-[15px] lg:text-[16px] font-normal sm:font-light leading-[1.62] mb-6 sm:mb-8 max-w-[480px] drop-shadow-md">
                Architectural tailoring shaped for quiet authority and effortless presence.
              </p>

              {/* 100% White CTA with Gold Accent Underline & Arrow */}
              <div>
                <span className="inline-flex items-center gap-2.5 text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.24em] font-normal text-white transition-all cursor-pointer">
                  <span className="border-b border-[#C99A2E] pb-0.5 sm:pb-1 transition-all">
                    EXPLORE THE COLLECTION
                  </span>
                  <ArrowRight size={13} className="text-[#C99A2E] transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: BRAND STATEMENT & MANIFESTO (~60–70vh)
          ========================================================================= */}
      <section className="relative bg-[#0A0A0D] text-white py-20 sm:py-28 lg:py-36 min-h-[60vh] sm:min-h-[68vh] lg:min-h-[74vh] flex items-center justify-center px-5 sm:px-8 lg:px-12 overflow-hidden">
        {/* Background Ambient Cinematic Video */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover object-[50%_15%] scale-120 brightness-[0.92] contrast-[1.05]"
          >
            <source src="/manifesto.mp4" type="video/mp4" />
          </video>
          {/* Calibrated 50% Gradient Overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.48) 50%, rgba(0,0,0,0.58) 100%)"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/50" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0A0A0D] via-[#0A0A0D]/60 to-transparent" />
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[1050px] mx-auto text-center relative z-10"
        >
          <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.38em] text-[#C2922E] font-medium block mb-2.5">
            &mdash; The Manifesto
          </span>
          <div className="w-8 sm:w-10 h-[1px] bg-[#C2922E]/80 mx-auto mb-6 sm:mb-8" />

          {/* Manifesto Quote (32-38px on Mobile) */}
          <h2 className="font-quiche text-2xl sm:text-3xl lg:text-[2.65rem] font-light tracking-tight leading-[1.25] sm:leading-[1.22] text-white max-w-[980px] mx-auto mb-6 sm:mb-8 drop-shadow-sm">
            &ldquo;We do not chase seasons. We perfect the <span className="italic font-normal text-white/95">silhouette</span> &mdash; tailoring with precision, purpose and quiet confidence.&rdquo;
          </h2>

          <p className="text-white/60 font-body text-[9.5px] sm:text-[11px] uppercase tracking-[0.3em] font-light max-w-lg mx-auto">
            DESIGNED FOR AMBITION &middot; TAILORED WITH PURPOSE
          </p>
        </motion.div>
      </section>

      {/* =========================================================================
          SECTION 5: SHOP BY CATEGORY (Featured Full-Width + 2-Column Mobile Grid)
          ========================================================================= */}
      <section className="bg-[#F7F5F0] dark:bg-transparent pt-10 sm:pt-14 lg:pt-16 pb-10 sm:pb-12 lg:pb-14 px-4 sm:px-6 lg:px-[3.5vw] transition-colors duration-300">
        <div className="max-w-[1680px] mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-10 text-center md:text-left">
            <div>
              <span className="text-[10.5px] sm:text-[11px] lg:text-[11.5px] uppercase tracking-[0.26em] text-[#6A6A74] dark:text-white/60 font-medium block mb-3 sm:mb-3.5">
                Considered Architecture
              </span>
              <h2 className="font-quiche text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#121215] dark:text-white">
                SHOP BY CATEGORY
              </h2>
            </div>
          </div>

          {/* Asymmetric Layout: 1 Featured Card (Full-width on mobile) + 3 Cards (2-col on mobile) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-7 items-stretch">
            
            {/* 1. Large Feature Category Card */}
            <Link
              to="/collection?category=suits&gender=women"
              className="lg:col-span-4 group relative overflow-hidden bg-[#1A1A1E] min-h-[460px] sm:min-h-[540px] flex flex-col justify-end p-6 sm:p-8 pb-9 sm:pb-12 text-white block"
            >
              <img
                src="/products/the-plum-sculpted-suit/1.JPG"
                alt="Women's Power Suits & Co-ord Sets"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover object-[50%_15%] transition-transform duration-1000 ease-out group-hover:scale-105"
              />
              {/* Lower 60-65% Soft Dark Gradient (Model top/face 100% clean & clear) */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(0deg, rgba(12,12,12,0.86) 0%, rgba(12,12,12,0.64) 28%, rgba(12,12,12,0.32) 50%, rgba(12,12,12,0.06) 60%, rgba(12,12,12,0) 66%)"
                }}
              />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 sm:mb-[18px]">
                  <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.22em] text-[#C99A2E] font-semibold font-body">
                    01 &middot; Signature Sets
                  </span>
                </div>
                <h3 className="font-quiche text-2xl sm:text-[1.95rem] font-light leading-[1.05] tracking-tight mb-2.5 text-white">
                  POWER SUITS &amp; <br />
                  <span className="italic font-normal">PANTSUITS</span>
                </h3>
                <p className="text-white/85 text-xs sm:text-[13px] font-light leading-relaxed mb-6 max-w-[310px] font-body">
                  Complete 2-piece tailored blazer &amp; trouser sets engineered for boardroom presence.
                </p>
                <div className="pt-0.5">
                  <span className="inline-flex items-center gap-2 text-[10px] sm:text-[10.5px] uppercase tracking-[0.24em] font-normal text-white transition-colors cursor-pointer">
                    <span className="border-b border-[#C2922E] pb-0.5 transition-all">
                      EXPLORE POWER SUITS
                    </span>
                    <ArrowRight size={12} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>

            {/* 2. Remaining 3 Category Cards (2-Column Mobile Grid, 3-Col Desktop) */}
            <div className="lg:col-span-8 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-7 items-start">
              {(categoryGender === "women"
                ? [
                    {
                      num: "02",
                      title: "Waistcoat Sets",
                      tagline: "Vest & Trouser Co-ords",
                      image: "/products/midnight-sculpted-vest-set/1.JPG",
                      link: "/collection?category=suits&gender=women"
                    },
                    {
                      num: "03",
                      title: "Peplum & Co-ords",
                      tagline: "Fishtail & Modular Sets",
                      image: "/products/midnight-peplum-fishtail-set/1.JPG",
                      link: "/collection?category=suits&gender=women"
                    },
                    {
                      num: "04",
                      title: "All Women's Sets",
                      tagline: "The Complete Suiting Edit",
                      image: "/products/the-noir-layered-suit/1.JPG",
                      link: "/collection?gender=women"
                    }
                  ]
                : [
                    {
                      num: "02",
                      title: "Blazers",
                      tagline: "Sculpted Silhouettes",
                      image: "/images/mens_item2_front_1782649430719.png",
                      link: "/collection?category=blazers&gender=men"
                    },
                    {
                      num: "03",
                      title: "Formal Trousers",
                      tagline: "Tailored Precision",
                      image: "/images/mens_item5_front_1782649505331.png",
                      link: "/collection?category=trousers&gender=men"
                    },
                    {
                      num: "04",
                      title: "Formal Shirts",
                      tagline: "Crisp European Cottons",
                      image: "/images/mens_item3_front_1782649454163.png",
                      link: "/collection?category=shirts&gender=men"
                    }
                  ]
              ).map((cat, idx) => (
                <Link
                  key={idx}
                  to={cat.link}
                  className={`group block ${idx === 2 ? "col-span-2 sm:col-span-1" : ""}`}
                >
                  {/* Photo Container */}
                  <div className="relative aspect-[3/4.2] sm:aspect-[3/4.5] lg:aspect-[3/4.9] overflow-hidden bg-[#EAE6DF] dark:bg-[#18181D]/80 mb-2.5 sm:mb-3.5">
                    <img
                      src={cat.image}
                      alt={cat.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                      <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-white bg-black/40 backdrop-blur-md px-1.5 sm:px-2 py-0.5 font-medium">
                        {cat.num}
                      </span>
                    </div>
                  </div>

                  {/* Details Below Photo */}
                  <div>
                    <h3 className="font-quiche text-base sm:text-xl font-light text-[#121215] dark:text-white group-hover:text-[#C2922E] dark:group-hover:text-[#C2922E] transition-colors leading-snug">
                      {cat.title}
                    </h3>
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-[#75757A] dark:text-white/60 font-medium mt-1 truncate">
                      {cat.tagline}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 6: ICW SIGNATURE & CRAFTSMANSHIP (Stacked on Mobile + Accordions)
          ========================================================================= */}
      <section className="bg-[#F7F5F0] dark:bg-transparent pt-10 sm:pt-12 lg:pt-14 pb-14 sm:pb-20 lg:pb-24 px-4 sm:px-6 lg:px-[4.5vw] border-b border-[#EAE6DF] dark:border-white/10 transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-[28px] sm:gap-10 xl:gap-12 items-center">
            {/* Top/Left: Detail Image */}
            <div className="lg:col-span-6 relative aspect-[4/5] sm:aspect-[16/14] lg:aspect-[4/5] w-full bg-[#EAE6DF] dark:bg-[#18181D]/80 overflow-hidden shadow-sm">
              <img
                src="/home_signature.png"
                alt="ICW Signature Lapel Craftsmanship"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
              />
            </div>

            {/* Bottom/Right: Editorial Narrative & Stacked Accordions */}
            <div className="lg:col-span-6 lg:pl-2 xl:pl-4 flex flex-col justify-center">
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-2.5 sm:mb-4">
                <span className="w-5 h-[1.5px] bg-[#C2922E]" />
                <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.35em] text-[#C2922E] font-medium">
                  ICW SIGNATURE
                </span>
              </div>

              {/* Large Quiche Heading (31-32px on mobile) */}
              <h2 className="font-quiche text-[31px] sm:text-5xl lg:text-[3.8rem] xl:text-[4.2rem] font-light text-[#121215] dark:text-white leading-[1.08] sm:leading-[1.05] mb-3.5 sm:mb-5">
                Tailoring, <br className="hidden sm:inline" />
                <span className="italic font-normal">refined.</span>
              </h2>

              {/* Description (Increased line-height for effortless breathing room) */}
              <p className="text-[#44444A] dark:text-white/70 text-[13px] sm:text-base font-light leading-[1.68] sm:leading-relaxed mb-6 sm:mb-7 max-w-lg">
                Precision structure. Breathable comfort. Built for all-day confidence. Designed to elevate modern executive presence with timeless tailoring.
              </p>

              {/* Editorial Underline CTA with ~38-40px separation before accordions */}
              <div className="mb-10 sm:mb-12">
                <Link
                  to="/collection"
                  className="group inline-flex items-center gap-2.5 text-[10.5px] sm:text-[11px] uppercase tracking-[0.24em] font-normal text-[#121215] dark:text-white hover:text-[#C2922E] dark:hover:text-[#C2922E] transition-all duration-300"
                >
                  <span className="border-b border-[#121215] dark:border-white group-hover:border-[#C2922E] pb-1 transition-all duration-300">
                    DISCOVER SIGNATURE PIECES
                  </span>
                  <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Interactive Craftsmanship Accordions */}
              <div className="border-t border-[#E5E0D8] dark:border-white/10">
                {[
                  {
                    num: "01",
                    title: "PRECISION TAILORING",
                    desc: "Structured silhouettes designed for a refined professional fit."
                  },
                  {
                    num: "02",
                    title: "CONSIDERED FABRICS",
                    desc: "Selected for breathability, drape and all-day executive comfort."
                  },
                  {
                    num: "03",
                    title: "FINISHED WITH PURPOSE",
                    desc: "Thoughtful construction details crafted for enduring, polished wear."
                  }
                ].map((pillar, idx) => {
                  const isOpen = openSignaturePillar === idx;
                  return (
                    <div key={idx} className="border-b border-[#E5E0D8] dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setOpenSignaturePillar(isOpen ? -1 : idx)}
                        className="w-full py-3.5 sm:py-5 flex items-center justify-between text-left group transition-colors px-1"
                      >
                        <div className="flex items-center gap-3 sm:gap-6">
                          <span className="font-quiche text-xs sm:text-base text-[#B88628] dark:text-[#D8A845] tracking-widest font-semibold shrink-0">
                            {pillar.num}
                          </span>
                          <h4 className="font-quiche text-sm sm:text-xl font-medium text-[#111114] dark:text-white tracking-tight group-hover:text-[#C2922E] dark:group-hover:text-[#C2922E] transition-colors">
                            {pillar.title}
                          </h4>
                        </div>
                        <span className="text-[#B88628] dark:text-[#D8A845] p-1">
                          {isOpen ? <Minus size={15} /> : <Plus size={15} />}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="pb-3.5 pl-8 sm:pl-12 pr-4 text-xs sm:text-[14.5px] text-[#44444C] dark:text-white/65 font-normal leading-relaxed">
                          {pillar.desc}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 7: FINAL CAMPAIGN VIDEO / IMAGE (~70vh)
          ========================================================================= */}
      <section className="relative min-h-[68vh] sm:min-h-[75vh] lg:min-h-[82vh] flex items-center justify-center overflow-hidden bg-[#0A0A0C] text-white py-16 sm:py-24 px-5 sm:px-6">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-[50%_20%] opacity-65 scale-105"
          src="/world_of_suko.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/90" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <span className="text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.4em] text-[#C2922E] font-medium block mb-3 sm:mb-4">
            THE WORLD OF SUKO
          </span>

          <h2 className="font-quiche text-3xl sm:text-6xl lg:text-7xl font-light text-white tracking-tight leading-[1.1] sm:leading-[1.08] mb-4 sm:mb-5">
            Built for the room. <br />
            <span className="italic font-normal text-white/95">Designed to own it.</span>
          </h2>

          <p className="text-white/70 text-[10px] sm:text-[12.5px] uppercase tracking-[0.26em] font-light mb-6 sm:mb-8">
            Precision Executive Tailoring &mdash; ICW BY SUKO
          </p>

          <div>
            <Link
              to="/collection"
              className="group inline-flex items-center gap-2.5 text-[10.5px] sm:text-[11px] uppercase tracking-[0.26em] font-normal text-white hover:text-[#C2922E] transition-all duration-300"
            >
              <span className="border-b border-white group-hover:border-[#C2922E] pb-1 transition-all duration-300">
                EXPLORE THE COLLECTION
              </span>
              <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: SERVICE STRIP (2×2 Mobile Grid / 1-Line Desktop)
          ========================================================================= */}
      <section className="bg-[#F6F2EA] dark:bg-[#0A0A0C]/50 py-5 sm:py-5.5 px-4 sm:px-6 lg:px-12 border-y border-[#E2DDD5] dark:border-white/10 transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto grid grid-cols-2 gap-y-3.5 gap-x-3 text-center sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:text-left text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.22em] text-[#222227] dark:text-white/80 font-normal">
          <span>COMPLIMENTARY SHIPPING</span>
          <span className="hidden sm:inline text-[#D8D4CC]/70 dark:text-white/25">&bull;</span>
          <span>EASY EXCHANGES</span>
          <span className="hidden sm:inline text-[#D8D4CC]/70 dark:text-white/25">&bull;</span>
          <span>SECURE CHECKOUT</span>
          <span className="hidden sm:inline text-[#D8D4CC]/70 dark:text-white/25">&bull;</span>
          <span>CUSTOMER ASSISTANCE</span>
        </div>
      </section>

    </div>
  );
};

export default Home;
