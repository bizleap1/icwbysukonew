import React from "react";
import { Link } from "react-router-dom";
import ProductCard from "../ProductCard";
import { PRODUCTS } from "../../data/products";

export const NewArrivalsSection = () => {
  // 4 Core Latest Individual Upper Silhouettes
  const displayedSlugs = [
    "the-noir-tailored-blazer",
    "the-plum-sculpted-double-breasted-blazer",
    "the-lilac-sculpted-flare-blazer",
    "the-noir-structured-vest"
  ];

  const displayedProducts = displayedSlugs
    .map((slug) => PRODUCTS.find((p) => p.slug === slug))
    .filter(Boolean);

  return (
    <section className="bg-[#FAF8F5] pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 lg:pb-9 transition-colors duration-300">
      <div className="w-full mx-auto px-6 sm:px-10 lg:px-12 xl:px-14">
        
        {/* Minimal Luxury Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8 lg:mb-9">
          <div>
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="w-4 h-[1px] bg-[#C2922E]" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.34em] text-[#C2922E] font-medium font-body">
                THE LATEST FROM SUKO
              </span>
            </div>
            <h2 className="font-quiche text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#121215]">
              New <span className="italic font-normal">Arrivals.</span>
            </h2>
          </div>

          {/* Top-Right Header Link (Hero Luxury Signature Style) */}
          <Link
            to="/new-in"
            className="group relative inline-block pt-1 pb-1.5 select-none self-start md:self-end"
          >
            <span className="text-[11.5px] sm:text-[12.5px] uppercase tracking-[0.20em] sm:tracking-[0.22em] font-medium text-[#121215] block">
              VIEW ALL NEW ARRIVALS
            </span>
            <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30" />
            <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#121215] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
          </Link>
        </div>

        {/* 4 Clean Editorial Product Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 items-stretch">
          {displayedProducts.map((product, idx) => (
            <ProductCard 
              key={product.id || product.slug || idx} 
              product={product} 
              index={idx} 
            />
          ))}
        </div>

      </div>
    </section>
  );
};

export default NewArrivalsSection;
