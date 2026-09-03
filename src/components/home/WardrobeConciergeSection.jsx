import React from "react";
import { Link } from "react-router-dom";

export const WardrobeConciergeSection = () => {
  return (
    <section className="bg-[#0E0E11] text-[#FAF8F5] pt-14 sm:pt-16 pb-10 sm:pb-12 lg:py-0 lg:h-[390px] xl:h-[415px] flex items-center overflow-hidden font-body transition-colors duration-300 relative border-t border-b border-white/10">
      <div className="w-full mx-auto px-5 sm:px-8 lg:px-12 xl:px-14">
        
        {/* 1. MOBILE-FIRST EDITORIAL FLOW (lg:hidden — Text First -> Taller Consultation Image Below) */}
        <div className="lg:hidden flex flex-col text-left">
          
          {/* STEP 1: Text Block (Left-Aligned) */}
          <div className="flex flex-col items-start">
            
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-3.5 sm:mb-4">
              <span className="w-5 h-[1.5px] bg-[#C2922E]" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-[#C2922E] font-medium font-body">
                PERSONAL STYLING
              </span>
            </div>

            {/* Headline */}
            <h2 className="font-quiche text-3xl sm:text-4xl font-light text-white leading-[1.04] tracking-tight mb-4 sm:mb-5">
              A Wardrobe, <br />
              <span className="italic font-normal text-[#FAF8F5]">Considered Around You.</span>
            </h2>

            {/* Short Supporting Line */}
            <p className="text-white/75 font-body text-[13.5px] sm:text-[14.5px] font-light leading-relaxed mb-6 max-w-lg">
              Personalised wardrobe assistance for the moments that matter in your professional life.
            </p>

            {/* Signature CTA (Hero-matched expanding underline) */}
            <div>
              <Link
                to="/wardrobe-concierge"
                className="group relative inline-block pt-0.5 pb-1 select-none focus-visible:outline-none cursor-pointer"
              >
                <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.20em] sm:tracking-[0.22em] font-medium text-white block">
                  TALK TO A SUKO STYLIST &rarr;
                </span>
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/40" />
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
              </Link>
            </div>
          </div>

          {/* STEP 2: Full-Width Taller Styling Consultation Image Below (4:5 Crop, ~420–480px Height) */}
          <div className="mt-8 sm:mt-9 w-full h-[420px] sm:h-[480px] overflow-hidden rounded-[2px] shadow-2xl bg-[#16161A] relative">
            <img
              src="/personal_styling.webp"
              alt="SUKO Personal Styling — Private Executive Consultation"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                if (e.currentTarget.src !== "/personal_styling.png") {
                  e.currentTarget.src = "/personal_styling.png";
                }
              }}
              className="w-full h-full object-cover object-[55%_20%]"
            />
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(0deg, rgba(14,14,17,0.50) 0%, rgba(14,14,17,0.05) 30%, transparent 60%)"
              }}
            />
          </div>

        </div>

        {/* 2. DESKTOP 50/50 EDITORIAL SPREAD (hidden on mobile) */}
        <div className="hidden lg:grid grid-cols-12 gap-6 sm:gap-8 lg:gap-10 xl:gap-14 items-center">
          
          {/* Desktop Left: Copy & Narrative */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-2 sm:mb-2.5">
              <span className="w-5 h-[1.5px] bg-[#C2922E]" />
              <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.35em] text-[#C2922E] font-medium font-body">
                PERSONAL STYLING
              </span>
            </div>

            {/* Headline */}
            <h2 className="font-quiche text-2xl sm:text-4xl lg:text-[37px] xl:text-[42px] font-light text-white leading-[1.04] sm:leading-[1.02] tracking-tight mb-2 sm:mb-2.5">
              A Wardrobe, <br />
              <span className="italic font-normal text-[#FAF8F5]">Considered Around You.</span>
            </h2>

            {/* Short Supporting Line */}
            <p className="text-white/75 font-body text-xs sm:text-[13.5px] lg:text-[14px] font-light leading-relaxed mb-5 sm:mb-6 max-w-lg">
              Personalised wardrobe assistance for the moments that matter in your professional life.
            </p>

            {/* Signature CTA */}
            <div>
              <Link
                to="/wardrobe-concierge"
                className="group relative inline-block pt-0.5 pb-1 select-none focus-visible:outline-none cursor-pointer"
              >
                <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.20em] sm:tracking-[0.22em] font-medium text-white block">
                  TALK TO A SUKO STYLIST &rarr;
                </span>
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/40" />
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
              </Link>
            </div>

          </div>

          {/* Desktop Right: Image */}
          <div className="lg:col-span-6">
            <Link 
              to="/wardrobe-concierge"
              className="group relative h-[320px] xl:h-[350px] w-full overflow-hidden rounded-[2px] shadow-2xl bg-[#16161A] block select-none cursor-pointer"
            >
              <img
                src="/personal_styling.webp"
                alt="SUKO Personal Styling — Private Executive Appointment"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  if (e.currentTarget.src !== "/personal_styling.png") {
                    e.currentTarget.src = "/personal_styling.png";
                  }
                }}
                className="w-full h-full object-cover object-[50%_25%] transition-transform duration-1000 ease-out group-hover:scale-103"
              />
              <div 
                className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                style={{
                  background: "linear-gradient(0deg, rgba(14,14,17,0.40) 0%, rgba(14,14,17,0.05) 30%, transparent 60%)"
                }}
              />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
};

export default WardrobeConciergeSection;
