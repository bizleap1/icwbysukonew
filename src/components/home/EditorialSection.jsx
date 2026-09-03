import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const EditorialSection = () => {
  return (
    <section className="bg-[#EFECE6] pt-10 sm:pt-14 lg:pt-16 pb-10 sm:pb-14 lg:pb-16 px-4 sm:px-6 lg:px-[3.5vw] border-b border-[#E0DCD4] transition-colors duration-300">
      <div className="max-w-[1680px] mx-auto">
        <Link
          to="/collection"
          className="group relative h-[65vh] sm:h-[72vh] lg:h-[680px] xl:h-[720px] overflow-hidden bg-[#1A1A1E] block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C99A2E]"
        >
          <img
            src="/editorial.webp"
            alt="The ICW Woman Signature Tailoring Campaign"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              if (e.currentTarget.src !== "/editorial.JPG") {
                e.currentTarget.src = "/editorial.JPG";
              }
            }}
            className="absolute inset-0 w-full h-full object-cover object-[68%_12%] sm:object-[62%_10%] transition-transform duration-1000 ease-out group-hover:scale-105"
          />
          {/* Multi-Stop Left-to-Right + Bottom Fade Gradient */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, rgba(10,10,12,0.92) 0%, rgba(10,10,12,0.78) 36%, rgba(10,10,12,0.35) 60%, rgba(10,10,12,0) 80%)"
            }}
          />
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(0deg, rgba(10,10,12,0.75) 0%, rgba(10,10,12,0.30) 35%, rgba(10,10,12,0) 60%)"
            }}
          />
          
          {/* Perfectly Anchored Content */}
          <div className="absolute inset-0 p-6 sm:p-12 lg:p-16 pt-10 sm:pt-16 lg:pt-20 flex flex-col justify-center max-w-[650px] z-10">
            {/* Refined Gold Eyebrow */}
            <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
              <span className="w-4 h-[1px] bg-[#C99A2E]" />
              <span className="text-[10.5px] sm:text-[11px] uppercase tracking-[0.24em] text-[#C99A2E] font-semibold font-body">
                THE EDITORIAL &middot; SIGNATURE SUITING
              </span>
            </div>

            {/* Main Headline */}
            <h3 className="font-quiche text-3xl sm:text-5xl lg:text-6xl text-white font-light leading-[1.04] mb-3.5 sm:mb-4 drop-shadow-md">
              THE ICW <br />
              <span className="italic font-normal text-white/95">WOMAN</span>
            </h3>

            {/* Exact Copy: 100% Solid White on Mobile */}
            <p className="text-white sm:text-white/95 font-body text-[13.5px] sm:text-[15px] lg:text-[16px] font-normal sm:font-light leading-[1.62] mb-6 sm:mb-8 max-w-[480px] drop-shadow-md">
              Architectural tailoring shaped for quiet authority and effortless presence.
            </p>

            {/* 100% White CTA with Gold Accent Underline & Arrow */}
            <div>
              <span className="inline-flex items-center gap-2.5 text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.24em] font-normal text-white transition-all cursor-pointer">
                <span className="border-b border-[#C99A2E] pb-0.5 sm:pb-1 transition-all">
                  EXPLORE THE COLLECTION
                </span>
                <ArrowRight size={13} className="text-[#C99A2E] transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default EditorialSection;
