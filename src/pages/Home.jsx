import React from "react";
import SEO from "../components/SEO";
import HeroSection from "../components/home/HeroSection";
import ShopByMomentSection from "../components/home/ShopByMomentSection";
import NewArrivalsSection from "../components/home/NewArrivalsSection";
import StylingFilmSection from "../components/home/StylingFilmSection";
import WhySukoSection from "../components/home/WhySukoSection";
import SignaturePiecesSection from "../components/home/SignaturePiecesSection";
import WardrobeConciergeSection from "../components/home/WardrobeConciergeSection";
import ServiceStrip from "../components/home/ServiceStrip";

const Home = () => {
  return (
    <div 
      data-testid="home-page" 
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white transition-colors duration-300"
    >
      <SEO 
        title="SUKO — The Indian Corporate Wear"
        description="SUKO — Precision tailored corporate suits, structured silhouettes and executive ensembles designed for modern Indian women leaders."
      />

      {/* 01 — HERO SECTION (Fullscreen Cinematic Fashion Hero) */}
      <HeroSection />

      {/* 02 — NEW ARRIVALS (The Latest from SUKO — 4 Editorial Product Visuals) */}
      <NewArrivalsSection />

      {/* 03 — THE MOMENTS ARCHITECTURE (5 Visual Professional Moments) */}
      <ShopByMomentSection />

      {/* 04 — STYLING FILM SECTION (One Woman. Multiple Moments.) */}
      <StylingFilmSection />

      {/* 05 — WHY SUKO (Trust & Tailoring Philosophy) */}
      <WhySukoSection />

      {/* 06 — SIGNATURE PIECES (The Pieces That Define SUKO) */}
      <SignaturePiecesSection />

      {/* 07 — WARDROBE CONCIERGE (Private Styling & Capsule Services) */}
      <WardrobeConciergeSection />

      {/* 08 — SERVICE STRIP */}
      <ServiceStrip />
    </div>
  );
};

export default Home;
