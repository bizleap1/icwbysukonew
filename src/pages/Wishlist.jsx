import React from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";
import PageWrapper from "../components/PageWrapper";

const Wishlist = () => {
  const { items } = useWishlist();

  return (
    <PageWrapper>
      <div 
        data-testid="wishlist-page"
        className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white min-h-screen pt-28 sm:pt-36 lg:pt-40 pb-24 sm:pb-32 transition-colors duration-300"
      >
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-14 xl:px-16">
          
          {/* Editorial Header */}
          <div className="flex flex-col items-center text-center mb-10 sm:mb-16">
            <div className="flex items-center justify-center gap-2.5 mb-2.5 sm:mb-3.5">
              <span className="w-4 h-[1px] bg-[#C2922E]" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-[#C2922E] font-medium font-body">
                YOUR CURATED COLLECTION
              </span>
              <span className="w-4 h-[1px] bg-[#C2922E]" />
            </div>

            <h1 className="font-quiche text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#111113] font-light mb-2.5">
              Wishlist
            </h1>

            {items.length > 0 && (
              <p className="text-xs sm:text-[13.5px] text-[#555560] font-light tracking-wide">
                {items.length} {items.length === 1 ? "silhouette" : "silhouettes"} saved to your private curation.
              </p>
            )}
          </div>

          {/* Empty State */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 sm:py-28 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-full bg-[#F3EFE6] border border-[#E8E4DC] flex items-center justify-center mb-6 text-[#C2922E]">
                <Heart size={20} strokeWidth={1.3} />
              </div>
              <h2 className="font-quiche text-2xl sm:text-3xl font-light text-[#111113] mb-2.5">
                Your curation is empty
              </h2>
              <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed mb-8">
                Explore our collections to save your favorite architectural silhouettes and tailored sets.
              </p>
              <Link
                to="/new-in"
                className="group inline-flex items-center gap-2.5 text-[11px] sm:text-[11.5px] uppercase tracking-[0.24em] font-medium text-[#111113] hover:text-[#C2922E] transition-colors border-b border-[#111113] hover:border-[#C2922E] pb-1"
              >
                <span>EXPLORE NEW ARRIVALS</span>
                <ArrowRight size={13} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          ) : (
            /* Product Grid */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {items.map((product, i) => (
                <ProductCard key={product.id || i} product={product} index={i} showAddToBag={true} />
              ))}
            </div>
          )}

        </div>
      </div>
    </PageWrapper>
  );
};

export default Wishlist;
