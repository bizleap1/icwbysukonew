import React from "react";
import SEO from "../components/SEO";
import HeroSection from "../components/home/HeroSection";
import NewArrivalsSection from "../components/home/NewArrivalsSection";
import EditorialSection from "../components/home/EditorialSection";
import ManifestoSection from "../components/home/ManifestoSection";
import ShopByCategorySection from "../components/home/ShopByCategorySection";
import SignaturePillarsSection from "../components/home/SignaturePillarsSection";
import CampaignVideoSection from "../components/home/CampaignVideoSection";
import ServiceStrip from "../components/home/ServiceStrip";

const Home = () => {
  return (
    <div 
      data-testid="home-page" 
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white transition-colors duration-300"
    >
      <SEO 
        description="Structured blazers, executive power suits, and tailored co-ord sets designed for the modern female leader."
      />

      {/* 1. Hero Section (75-85vh mobile / Fullscreen desktop) */}
      <HeroSection />

      {/* 2. New Arrivals (2-Col Mobile / 4-Col Desktop) */}
      <NewArrivalsSection />

      {/* 3. Women Editorial (High-Fashion Panoramic Campaign) */}
      <EditorialSection />

      {/* 4. Brand Statement & Manifesto */}
      <ManifestoSection />

      {/* 5. Shop By Category */}
      <ShopByCategorySection />

      {/* 6. Signature Craftsmanship & Accordions */}
      <SignaturePillarsSection />

      {/* 7. Final Campaign Video / World of Suko */}
      <CampaignVideoSection />

      {/* 8. Service Strip */}
      <ServiceStrip />
    </div>
  );
};

export default Home;
