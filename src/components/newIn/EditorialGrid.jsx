import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw } from "lucide-react";
import ProductCard from "../ProductCard";

export const EditorialGrid = ({
  editorialBlocks,
  products = [],
  totalResults,
  onClearFilters
}) => {
  if (totalResults === 0) {
    return (
      <div className="py-24 sm:py-32 text-center max-w-md mx-auto px-5 font-body">
        <h3 className="font-quiche text-2xl sm:text-3xl font-light text-[#111113] mb-2.5">
          No silhouettes match this filter
        </h3>
        <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed mb-6">
          Try resetting your selected filters or exploring our complete executive collection.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#111113] text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#C2922E] transition-colors cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>Reset All Filters</span>
        </button>
      </div>
    );
  }

  // When filtered results are 1 to 4 products, render a clean, standard symmetrical grid (same as collection)
  const allProds = products && products.length > 0
    ? products
    : editorialBlocks.flatMap((b) => b.allProducts || [b.featureProduct, ...(b.smallProducts || [])]).filter(Boolean);

  if (totalResults < 5) {
    return (
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-14 xl:px-16 pt-8 sm:pt-12 pb-20 sm:pb-28">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3.5 sm:gap-x-5 lg:gap-x-6 gap-y-6 sm:gap-y-10">
          {allProds.map((prod, idx) => (
            <ProductCard
              key={prod.id || prod.slug || idx}
              product={prod}
              index={idx}
              isFeatured={false}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-14 xl:px-16 pt-8 sm:pt-12 pb-6 sm:pb-8">
      {editorialBlocks.map((block, blockIndex) => {
        const isLeftFeature = block.type === "left-feature";
        const isLastBlock = blockIndex === editorialBlocks.length - 1;

        return (
          <React.Fragment key={block.id}>
            {/* 5-Item Asymmetric Grid Block */}
            <div className={isLastBlock ? "mb-0" : "mb-14 sm:mb-20"}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-7 items-stretch">
                
                {/* 1. Large Featured Product (50% desktop width / col-span-6) */}
                <div
                  className={`lg:col-span-6 h-full flex flex-col ${
                    isLeftFeature ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  {block.featureProduct && (
                    <ProductCard
                      product={block.featureProduct}
                      index={block.startIndex}
                      isFeatured={true}
                      className="h-full"
                    />
                  )}
                </div>

                {/* 2. Four Small Products in 2x2 Grid (50% desktop width / col-span-6) */}
                <div
                  className={`lg:col-span-6 grid grid-cols-2 gap-x-3.5 sm:gap-x-5 lg:gap-x-6 gap-y-6 sm:gap-y-8 ${
                    isLeftFeature ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  {block.smallProducts.map((prod, pIdx) => (
                    <ProductCard
                      key={`${block.id}-${prod.id || prod.slug || pIdx}`}
                      product={prod}
                      index={block.startIndex + pIdx + 1}
                      isFeatured={false}
                    />
                  ))}
                </div>

              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
