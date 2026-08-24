import React, { useMemo } from "react";
import { useLenis } from "lenis/react";
import SEO from "../components/SEO";
import { useProducts } from "../context/ProductContext";
import { PRODUCTS as FALLBACK_PRODUCTS } from "../data/products";
import WomenHero from "../components/women/WomenHero";
import { WomenBrandIntro, WomenCategories } from "../components/women/WomenCategories";
import { WomenNewInGrid, WomenBoardroomBanner, WomenAtelierBanner, WomenSignatureEdit } from "../components/women/WomenSections";
import ServiceStrip from "../components/home/ServiceStrip";

const Women = () => {
  const lenis = useLenis();
  const { products } = useProducts();

  // Smooth scroll down to Shop By Category
  const scrollToCategories = (e) => {
    e.preventDefault();
    const elem = document.getElementById("women-categories");
    if (elem) {
      if (lenis) {
        lenis.scrollTo(elem, { offset: -60, duration: 1.2 });
      } else {
        elem.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Women catalog products (5 items for asymmetric editorial block: 1 large + 4 small)
  const newInProducts = useMemo(() => {
    const rawList = products && products.length > 0 ? products : FALLBACK_PRODUCTS;
    const femaleItems = rawList.filter((p) => p.gender === "female" || p.gender === "women" || !p.gender);
    return femaleItems.slice(0, 5);
  }, [products]);

  return (
    <div 
      data-testid="women-page" 
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white transition-colors duration-300"
    >
      <SEO 
        title="Women's Executive Collection"
        description="Sculptural silhouettes, tailored power suits, and signature executive co-ords designed for the modern female leader."
      />

      {/* 1. Hero Section */}
      <WomenHero onExploreClick={scrollToCategories} />

      {/* 2. Brand Statement */}
      <WomenBrandIntro />

      {/* 3. Shop Women By Category */}
      <WomenCategories />

      {/* 4. New In Women (1 Large + 4 Small Asymmetric Grid) */}
      <WomenNewInGrid products={newInProducts} />

      {/* 5. Boardroom Campaign Banner */}
      <WomenBoardroomBanner />

      {/* 6. Women's Atelier Video */}
      <WomenAtelierBanner />

      {/* 7. The Signature Edit */}
      <WomenSignatureEdit />

      {/* 8. Service Strip */}
      <ServiceStrip />
    </div>
  );
};

export default Women;
