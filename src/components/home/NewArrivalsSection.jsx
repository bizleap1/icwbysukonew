import React from "react";
import { Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import ProductCard from "../ProductCard";
import { useProducts } from "../../context/ProductContext";
import { PRODUCTS as FALLBACK_PRODUCTS } from "../../data/products";

export const NewArrivalsSection = () => {
  const { products } = useProducts();
  const rawList = products && products.length > 0 ? products : FALLBACK_PRODUCTS;
  
  // Exclusively Women Luxury Corporate Wear (4 initial new arrival pieces)
  const displayedNewArrivals = rawList
    .filter(p => p.gender === "female" || !p.gender)
    .slice(0, 4);

  return (
    <section className="bg-[#F6F2EA] pt-10 sm:pt-14 lg:pt-16 pb-10 sm:pb-12 lg:pb-14 px-4 sm:px-6 lg:px-[3.5vw] border-b border-[#E8E4DC] transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-10 text-center md:text-left">
          <div>
            <span className="text-[10.5px] sm:text-[11px] lg:text-[11.5px] uppercase tracking-[0.26em] text-[#6A6A74] font-medium block mb-3 sm:mb-3.5">
              THE LATEST FROM ICW
            </span>
            <h2 className="font-quiche text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#111113]">
              NEW ARRIVALS
            </h2>
          </div>
        </div>

        {/* 2-Column Mobile Grid / 4-Column Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-7">
          <AnimatePresence mode="wait">
            {displayedNewArrivals.map((product, idx) => (
              <ProductCard key={product.id || product.slug || idx} product={product} index={idx} />
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom Link */}
        <div className="mt-7 sm:mt-9 text-center">
          <Link
            to="/new-in"
            className="group inline-flex items-center gap-2.5 text-[10.5px] sm:text-[11px] uppercase tracking-[0.24em] font-normal text-[#111113] hover:text-[#C2922E] transition-all duration-300"
          >
            <span className="border-b border-[#111113] group-hover:border-[#C2922E] pb-1 transition-all duration-300">
              VIEW ALL NEW ARRIVALS
            </span>
            <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

      </div>
    </section>
  );
};

export default NewArrivalsSection;
