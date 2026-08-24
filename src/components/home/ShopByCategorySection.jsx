import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const ShopByCategorySection = () => {
  const categoryCards = [
    {
      num: "02",
      title: "Waistcoat Sets",
      tagline: "Vest & Trouser Co-ords",
      image: "/products/midnight-sculpted-vest-set/1.JPG",
      link: "/collection?category=waistcoats&gender=women"
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
  ];

  return (
    <section className="bg-[#F7F5F0] pt-10 sm:pt-14 lg:pt-16 pb-10 sm:pb-12 lg:pb-14 px-4 sm:px-6 lg:px-[3.5vw] transition-colors duration-300">
      <div className="max-w-[1680px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-10 text-center md:text-left">
          <div>
            <span className="text-[10.5px] sm:text-[11px] lg:text-[11.5px] uppercase tracking-[0.26em] text-[#6A6A74] font-medium block mb-3 sm:mb-3.5">
              Considered Architecture
            </span>
            <h2 className="font-quiche text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#121215]">
              SHOP BY CATEGORY
            </h2>
          </div>
        </div>

        {/* Asymmetric Layout: 1 Featured Card (Full-width on mobile) + 3 Cards (2-col on mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-7 items-stretch">
          
          {/* 1. Large Feature Category Card */}
          <Link
            to="/collection?category=suits&gender=women"
            className="lg:col-span-4 group relative overflow-hidden bg-[#1A1A1E] min-h-[460px] sm:min-h-[540px] flex flex-col justify-end p-6 sm:p-8 pb-9 sm:pb-12 text-white block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C99A2E]"
          >
            <img
              src="/products/the-plum-sculpted-suit/1.JPG"
              alt="Women's Power Suits & Co-ord Sets"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-[50%_15%] transition-transform duration-1000 ease-out group-hover:scale-105"
            />
            {/* Lower 60-65% Soft Dark Gradient */}
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

          {/* 2. Remaining 3 Category Cards */}
          <div className="lg:col-span-8 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-7 items-start">
            {categoryCards.map((cat, idx) => (
              <Link
                key={idx}
                to={cat.link}
                className={`group block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C2922E] ${idx === 2 ? "col-span-2 sm:col-span-1" : ""}`}
              >
                {/* Photo Container */}
                <div className="relative aspect-[3/4.2] sm:aspect-[3/4.5] lg:aspect-[3/4.9] overflow-hidden bg-[#EAE6DF] mb-2.5 sm:mb-3.5">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    loading="lazy"
                    decoding="async"
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
                  <h3 className="font-quiche text-base sm:text-xl font-light text-[#121215] group-hover:text-[#C2922E] transition-colors leading-snug">
                    {cat.title}
                  </h3>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-[#75757A] font-medium mt-1 truncate">
                    {cat.tagline}
                  </p>
                </div>
              </Link>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default ShopByCategorySection;
