import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../ProductCard";
import { useProducts } from "../../context/ProductContext";

export const NewArrivalsSection = () => {
  const { products } = useProducts();

  // Dynamically select the latest 4 Active products where is_new_arrival = true
  const displayedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    // Filter strictly Active storefront products flagged as is_new_arrival
    const activeNewArrivals = products.filter((p) => {
      const status = (p.status || "active").toLowerCase();
      const isActive = status === "active" || status === "published";
      const isNewArrival = Boolean(p.is_new_arrival ?? p.isNew);
      return isActive && isNewArrival;
    });

    // Sort newest first (by created_at or sort_order if present)
    const sorted = [...activeNewArrivals].sort((a, b) => {
      if (a.sort_order !== undefined && b.sort_order !== undefined && a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      const timeA = new Date(a.created_at || a.createdAt || 0).getTime();
      const timeB = new Date(b.created_at || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    // Take top 4, with graceful fallback to newest active products if fewer than 4 are flagged
    if (sorted.length >= 4) {
      return sorted.slice(0, 4);
    }
    const fallbackActive = products
      .filter((p) => (p.status || "active").toLowerCase() === "active")
      .filter((p) => !sorted.some((s) => s.id === p.id));
    return [...sorted, ...fallbackActive].slice(0, 4);
  }, [products]);

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
            to="/new-arrivals"
            className="group relative inline-block pt-1 pb-1.5 select-none self-start md:self-end"
          >
            <span className="text-[11.5px] sm:text-[12.5px] uppercase tracking-[0.20em] sm:tracking-[0.22em] font-medium text-[#121215] block">
              VIEW ALL NEW ARRIVALS &rarr;
            </span>
            <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30" />
            <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#121215] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
          </Link>
        </div>

        {/* 4 Clean Editorial Product Cards: Desktop Grid / Mobile Swipe Carousel */}
        <div className="flex sm:grid overflow-x-auto sm:overflow-visible no-scrollbar snap-x snap-mandatory sm:snap-none gap-4 sm:gap-6 lg:gap-8 grid-cols-2 lg:grid-cols-4 -mx-6 px-6 sm:mx-0 sm:px-0 pb-4 sm:pb-0 items-stretch">
          {displayedProducts.map((product, idx) => (
            <div
              key={product.id || product.slug || idx}
              className="min-w-[72vw] sm:min-w-0 snap-center shrink-0 sm:shrink"
            >
              <ProductCard 
                product={product} 
                index={idx} 
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default NewArrivalsSection;
