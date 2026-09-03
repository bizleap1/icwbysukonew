import React from "react";
import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import ServiceStrip from "../components/home/ServiceStrip";

export const About = () => {
  return (
    <div
      data-testid="about-page"
      className="bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white min-h-screen pt-20 transition-colors duration-300"
    >
      <SEO
        title="About SUKO — Modern Tailoring. Indian Sensibility."
        description="The design philosophy, origin story, and architectural tailoring of SUKO — crafted intentionally for women shaping modern workplaces."
      />

      {/* ========================================================================= */}
      {/* 1. HERO — BRAND INTRODUCTION (Quiet Authority Brand Portrait) */}
      {/* ========================================================================= */}
      <section className="relative w-full h-[78vh] min-h-[540px] max-h-[660px] sm:h-[600px] lg:h-[640px] overflow-hidden bg-[#121215]">
        {/* Brand-Led Portrait with Textured Warm Stone Interior (Mobile Upper-Right Portrait Crop) */}
        <img
          src="/about_suko_brand.png"
          alt="SUKO Modern Tailoring & Indian Sensibility"
          className="absolute inset-0 w-full h-full object-cover object-[85%_12%] sm:object-[78%_center] lg:object-[80%_center] xl:object-[82%_center]"
        />

        {/* Desktop Airy Light Gradient */}
        <div
          className="absolute inset-0 hidden sm:block pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(14,14,17,0.45) 0%, rgba(14,14,17,0.25) 28%, rgba(14,14,17,0.05) 45%, transparent 60%)"
          }}
        />

        {/* Mobile Full-Bleed Readability Gradients (Vertical Scrim + Left Darkening) */}
        <div
          className="absolute inset-0 sm:hidden pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(14,14,17,0.10) 0%, rgba(14,14,17,0.30) 38%, rgba(14,14,17,0.80) 68%, rgba(14,14,17,0.96) 100%)"
          }}
        />
        <div
          className="absolute inset-0 sm:hidden pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(14,14,17,0.55) 0%, rgba(14,14,17,0.20) 50%, transparent 80%)"
          }}
        />

        {/* Hero Text Content (Bottom-Left on Mobile, Vertically Centered-Top on Desktop) */}
        <div className="relative h-full max-w-[1500px] mx-auto px-5 sm:px-8 lg:px-14 flex flex-col justify-end sm:justify-center pb-10 sm:pb-0 z-10">
          <div className="max-w-[340px] sm:max-w-[450px] lg:max-w-[470px] sm:-translate-y-7 lg:-translate-y-8">
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#C2922E] font-medium block mb-2 sm:mb-2.5">
              ABOUT SUKO
            </span>

            <h1 className="font-quiche text-[35px] sm:text-[38px] lg:text-[45px] xl:text-[48px] font-light tracking-tight text-white leading-[0.98] sm:leading-[1.12] mb-3 sm:mb-3">
              Modern Tailoring.<br />
              <span className="italic font-normal">Indian Sensibility.</span>
            </h1>

            <p className="text-white/90 text-[14.5px] sm:text-[14px] lg:text-[14.5px] font-light leading-relaxed max-w-[320px] sm:max-w-[450px] lg:max-w-[470px]">
              A considered approach to professional dressing for women shaping today’s workplaces.
            </p>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 2. THE SUKO POINT OF VIEW (Stacked Mobile Editorial & 55/45 Desktop Split) */}
      {/* ========================================================================= */}
      <section className="pt-10 sm:pt-12 lg:pt-12 pb-6 sm:pb-8 lg:pb-6 bg-[#FAF8F5]">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-10 xl:gap-12 items-center">

            {/* 1. Text Content (Top on Mobile, Left on Desktop) */}
            <div className="lg:col-span-7 pt-0">
              <span className="text-[10.5px] sm:text-[11px] uppercase tracking-[0.28em] text-[#8C887B] font-medium block mb-2.5 sm:mb-3">
                OUR POINT OF VIEW
              </span>

              <h2 className="font-quiche text-[34px] sm:text-[40px] lg:text-[42px] font-light text-[#121215] leading-[1.08] sm:leading-[1.12] mb-4 sm:mb-5">
                Professional Dressing,<br />
                <span className="italic font-normal">Reconsidered.</span>
              </h2>

              <div className="space-y-4 sm:space-y-4.5 text-[15px] sm:text-[15.5px] text-[#555562] font-light leading-relaxed max-w-[460px] lg:max-w-[480px]">
                <p>
                  SUKO approaches professional dressing through a considered balance of structure, ease and modern femininity.
                </p>
                <p>
                  Each piece is designed to move across roles, rooms and moments while remaining distinctly composed.
                </p>
              </div>
            </div>

            {/* 2. Editorial Tailoring Detail Visual Card (Second on Mobile, Right on Desktop) */}
            <div className="lg:col-span-5 mt-6 sm:mt-8 lg:mt-0 flex justify-center lg:justify-end w-full">
              <div className="w-full max-w-[490px] lg:max-w-none aspect-[4/5] lg:aspect-auto lg:h-[340px] xl:h-[360px] overflow-hidden bg-[#FAF8F5] border border-[#E8E4DC] shadow-sm relative">
                <img
                  src="/products/the-noir-layered-suit/7.webp"
                  alt="SUKO Noir Layered Tailoring Craftsmanship"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    if (e.currentTarget.src !== "/products/the-noir-layered-suit/7.png") {
                      e.currentTarget.src = "/products/the-noir-layered-suit/7.png";
                    }
                  }}
                  className="w-full h-full object-cover object-[center_50%] scale-[1.32] lg:scale-[1.35] transition-transform duration-700 hover:scale-[1.38]"
                />
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* TAILORING IN MOTION — STANDALONE EDITORIAL FILM (4:5 Tall Mobile | Cinema Desktop) */}
      {/* ========================================================================= */}
      <section className="pt-11 sm:pt-14 lg:pt-16 pb-13 sm:pb-16 lg:pb-20 bg-[#FAF8F5]">
        <div className="max-w-[1360px] w-full lg:w-[90vw] mx-auto px-4 sm:px-5 lg:px-0">
          <div className="w-full aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto lg:h-[490px] xl:h-[510px] overflow-hidden bg-[#FAF8F5] relative">
            <video
              src="/about_suko.mp4"
              poster="/about_suko_poster.webp"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-full object-cover object-[center_28%] block scale-[1.03] transform origin-center"
            />
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 3. THE SUKO DESIGN CODE (38/62 Ratio, Single-Line Desktop Header, Full-Width Rows) */}
      {/* ========================================================================= */}
      <section className="py-10 sm:py-12 lg:py-10 bg-[#F5F2EB] border-y border-[#E8E4DC]">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-14">

          {/* Mobile-Only Header (Heading FIRST on Mobile) */}
          <div className="block lg:hidden mb-6 sm:mb-7">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#C2922E] font-medium block mb-2 sm:mb-2.5">
              THE SUKO DESIGN CODE
            </span>
            <h2 className="font-quiche text-[36px] sm:text-[40px] font-light text-[#121215] leading-[1.02] tracking-tight">
              Structure. Proportion.<br />
              <span className="italic font-normal">Presence.</span>
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 xl:gap-16">

            {/* Blazer Image (38-39% Left Column on Desktop - 100% Edge-to-Edge Fill) */}
            <div className="w-full lg:w-[39%] max-w-[430px] xl:max-w-[450px] shrink-0 flex items-center justify-center">
              <div className="aspect-[4/4.7] sm:aspect-[4/4.7] w-full overflow-hidden bg-[#EAE6DE] border border-[#DDD8CE] relative flex items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <img
                  src="/products/the-noir-tailored-suit/2.webp"
                  alt="SUKO Tailored Blazer Architecture"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    if (e.currentTarget.src !== "/products/the-noir-tailored-suit/2.png") {
                      e.currentTarget.src = "/products/the-noir-tailored-suit/2.png";
                    }
                  }}
                  className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-103"
                />
              </div>
            </div>

            {/* Design Code Text Column (61% Right Column on Desktop) */}
            <div className="w-full lg:w-[61%] flex-1 lg:pl-2 xl:pl-4">

              {/* Desktop-Only Header (Single Line on Desktop) */}
              <div className="hidden lg:block mb-5 xl:mb-6">
                <span className="text-[10.5px] uppercase tracking-[0.28em] text-[#C2922E] font-medium block mb-2">
                  THE SUKO DESIGN CODE
                </span>
                <h2 className="font-quiche text-[32px] lg:text-[34px] xl:text-[37px] font-light text-[#121215] leading-tight tracking-tight whitespace-nowrap">
                  Structure. Proportion. Presence.
                </h2>
              </div>

              {/* 3 Crisp Rows (High-Contrast Titles, Subtle Dividers, Balanced Horizontal Fill) */}
              <div className="w-full space-y-0.5">
                <div className="border-b border-[#E2DDD3] py-4 sm:py-4.5">
                  <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#C2922E] block mb-1">
                    01
                  </span>
                  <h3 className="font-quiche text-[19px] sm:text-[21px] font-medium text-[#0E0E10] tracking-tight mb-1">
                    Considered Proportions
                  </h3>
                  <p className="text-[13.5px] sm:text-[14px] text-[#4A4A54] font-light leading-[1.55] w-full">
                    Balanced silhouettes and architectural structure designed for a composed, confident fit.
                  </p>
                </div>

                <div className="border-b border-[#E2DDD3] py-4 sm:py-4.5">
                  <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#C2922E] block mb-1">
                    02
                  </span>
                  <h3 className="font-quiche text-[19px] sm:text-[21px] font-medium text-[#0E0E10] tracking-tight mb-1">
                    Coordinated Dressing
                  </h3>
                  <p className="text-[13.5px] sm:text-[14px] text-[#4A4A54] font-light leading-[1.55] w-full">
                    Interchangeable tailoring designed to work together seamlessly across an intentional executive wardrobe rotation.
                  </p>
                </div>

                <div className="py-4 sm:py-4.5">
                  <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#C2922E] block mb-1">
                    03
                  </span>
                  <h3 className="font-quiche text-[19px] sm:text-[21px] font-medium text-[#0E0E10] tracking-tight mb-1">
                    Modern Femininity
                  </h3>
                  <p className="text-[13.5px] sm:text-[14px] text-[#4A4A54] font-light leading-[1.55] w-full">
                    Structure balanced with fluid ease, comfortable movement, and refined feminine poise.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 4. OUR BEGINNING / BRAND GENESIS (Mobile: Text First -> Image Second | Desktop: 62/38 Split) */}
      {/* ========================================================================= */}
      <section className="pt-14 sm:pt-16 lg:pt-12 pb-12 sm:pb-14 lg:pb-16 bg-[#FAF8F5]">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-14">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 xl:gap-16">

            {/* Story Text (First on Mobile, Left Column on Desktop - Lifted 20-30px up) */}
            <div className="w-full lg:w-[62%] flex-1 order-1 lg:order-1 lg:-translate-y-5 xl:-translate-y-6 lg:pr-4 xl:pr-8 mb-2 sm:mb-3 lg:mb-0">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#8C887B] font-medium block mb-2 sm:mb-2.5">
                OUR BEGINNING
              </span>

              <h2 className="font-quiche text-[40px] sm:text-[44px] lg:text-[46px] font-light text-[#121215] leading-[1.05] sm:leading-[1.08] lg:leading-[1.12] tracking-tight mb-5 sm:mb-6">
                Why SUKO<br />
                <span className="italic font-normal">Had to Exist.</span>
              </h2>

              <div className="space-y-4 sm:space-y-4.5 text-[15px] sm:text-[16px] text-[#2D2D36] font-light leading-relaxed max-w-[480px] lg:max-w-[500px]">
                <p>
                  SUKO was created around a simple idea: professional dressing for women should feel considered, modern and distinctly their own.
                </p>
                <p>
                  SUKO brings together structured tailoring, coordinated dressing and a refined feminine point of view for contemporary professional life.
                </p>
              </div>
            </div>

            {/* Tailoring Detail Visual (Second on Mobile, 38% Right Column on Desktop) */}
            <div className="w-full lg:w-[38%] max-w-[375px] xl:max-w-[395px] shrink-0 order-2 lg:order-2 lg:ml-auto">
              <div className="aspect-[4/5] w-full overflow-hidden bg-[#F2EFEB] border border-[#E8E4DC] shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
                <img
                  src="/about_noir_tailoring_detail.webp"
                  alt="SUKO Precision Tailoring, Lapel & Button Detail"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    if (e.currentTarget.src !== "/about_noir_tailoring_detail.png") {
                      e.currentTarget.src = "/about_noir_tailoring_detail.png";
                    }
                  }}
                  className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-103"
                />
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 5. DISCOVER THE SUKO WARDROBE (Mobile: Image First -> Text Second | Desktop: 2-Col Split) */}
      {/* ========================================================================= */}
      <section className="pt-12 sm:pt-14 lg:pt-18 pb-4 sm:pb-6 lg:pb-6 bg-[#F5F2EB] border-t border-[#E8E4DC]">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 xl:gap-16 items-center">

            {/* Story Text (Second on Mobile, Left Column on Desktop - Left Aligned) */}
            <div className="lg:col-span-6 order-2 lg:order-1 text-left">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#C2922E] font-medium block mb-2 sm:mb-2.5">
                THE SUKO WARDROBE
              </span>

              <h2 className="font-quiche text-[38px] sm:text-[42px] lg:text-[46px] font-light text-[#121215] leading-[1.0] sm:leading-[1.05] lg:leading-[1.12] tracking-tight mb-4 sm:mb-5">
                Discover the<br />
                <span className="italic font-normal">SUKO Wardrobe.</span>
              </h2>

              <p className="text-[15px] sm:text-[16px] text-[#3A3A46] font-light leading-relaxed mb-6 sm:mb-8 max-w-[440px]">
                Tailoring designed for the roles, rooms and moments of modern professional life.
              </p>

              <div>
                <Link
                  to="/collection"
                  className="group relative inline-block pt-1 pb-1 select-none focus-visible:outline-none cursor-pointer"
                >
                  <span className="text-[12px] sm:text-[13px] uppercase tracking-[0.22em] font-medium text-[#121215] block group-hover:text-[#C2922E] transition-colors">
                    EXPLORE COLLECTIONS
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30" />
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#C2922E] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                </Link>
              </div>
            </div>

            {/* Editorial Visual (First on Mobile, Right Column on Desktop - 4:5 on Mobile) */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="aspect-[4/5] sm:aspect-[16/10] lg:aspect-[4/3] w-full overflow-hidden bg-[#E8E4DC] border border-[#DDD8CE] shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
                <img
                  src="/collection_hero.webp"
                  alt="SUKO Executive Wardrobe Collection"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    if (e.currentTarget.src !== "/collection_hero.png") {
                      e.currentTarget.src = "/collection_hero.png";
                    }
                  }}
                  className="w-full h-full object-cover object-[center_12%] transition-transform duration-700 hover:scale-103"
                />
              </div>
            </div>

          </div>
        </div>
      </section>




      {/* ========================================================================= */}
      {/* 6. FINAL BRAND STATEMENT (Calibrated Closing Band) */}
      {/* ========================================================================= */}
      <section className="pt-2 sm:pt-3 lg:pt-4 pb-12 sm:pb-14 lg:pb-16 bg-[#F5F2EB] text-center flex items-center justify-center">
        <div className="max-w-[900px] mx-auto px-5 sm:px-8 w-full">
          <h2 className="font-quiche text-4xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-light text-[#121215] leading-[1.08] mb-7 sm:mb-9">
            For Women<br />
            <span className="italic font-normal">Who Lead.</span>
          </h2>

          <div>
            <Link
              to="/collection"
              className="group relative inline-block pt-1 pb-1 select-none focus-visible:outline-none cursor-pointer"
            >
              <span className="text-[11.5px] sm:text-[12px] uppercase tracking-[0.24em] font-medium text-[#121215] block group-hover:text-[#C2922E] transition-colors">
                DISCOVER THE COLLECTION
              </span>
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30" />
              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#C2922E] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
            </Link>
          </div>
        </div>
      </section>

      {/* Value Strip */}
      <ServiceStrip />
    </div>
  );
};

export default About;
