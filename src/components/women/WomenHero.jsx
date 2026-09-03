import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export const WomenHero = ({ onExploreClick }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      data-testid="women-hero-section"
      className="relative h-[78vh] sm:h-[85vh] lg:h-screen w-full bg-[#0A0A0C] overflow-hidden"
    >
      {/* Female-Led Campaign Image Background */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#0A0A0C]">
        <img
          src="/women_bg.webp"
          alt="ICW Women Bespoke Tailoring Campaign"
          fetchPriority="high"
          onError={(e) => {
            if (e.currentTarget.src !== "/women_bg.png") {
              e.currentTarget.src = "/women_bg.png";
            }
          }}
          className="w-full h-full object-cover object-[75%_top] sm:object-[70%_top] opacity-100"
        />
        {/* Ultra-smooth Luxury Gradient */}
        <div 
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            background: "linear-gradient(90deg, rgba(10,10,12,0.90) 0%, rgba(10,10,12,0.78) 18%, rgba(10,10,12,0.50) 32%, rgba(10,10,12,0.22) 44%, rgba(10,10,12,0.06) 54%, rgba(10,10,12,0.01) 60%, rgba(10,10,12,0) 66%)"
          }}
        />
        <div 
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            background: "linear-gradient(0deg, rgba(10,10,12,0.55) 0%, rgba(10,10,12,0.12) 14%, rgba(10,10,12,0) 24%)"
          }}
        />
      </div>

      {/* Lower-Third Anchored Content */}
      <div className="absolute inset-x-0 bottom-[7vh] sm:bottom-[9vh] lg:bottom-[10vh] z-10 pointer-events-none">
        <div className="max-w-[1700px] w-full mx-auto px-5 sm:px-8 lg:px-14 xl:px-16 flex items-end justify-between">
          <div className="w-full max-w-[620px] pointer-events-auto">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.2 : 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Eyebrow */}
              <div className="flex items-center gap-2.5 mb-2.5 sm:mb-[14px]">
                <span className="w-4 h-[1px] bg-[#C2922E]" />
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#C2922E] font-medium font-body">
                  ICW WOMEN / BY SUKO
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-quiche text-4xl sm:text-6xl lg:text-[4.5rem] tracking-tight text-white leading-[0.98] font-light mb-3.5 sm:mb-[18px] drop-shadow-2xl">
                The ICW <span className="italic font-normal text-white/90">Woman</span>
              </h1>

              {/* Shorter Luxury Subline */}
              <p className="text-white/75 font-body text-xs sm:text-[14px] lg:text-[15px] tracking-wide font-light leading-relaxed max-w-[420px] mb-6 sm:mb-[28px]">
                Architectural silhouettes shaped for quiet authority and effortless presence.
              </p>

              {/* Underline CTA -> Smooth Scroll */}
              <div className="pt-1">
                <a
                  href="#women-categories"
                  onClick={onExploreClick}
                  className="group inline-flex items-center gap-2.5 text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.24em] font-normal text-white hover:text-[#C2922E] transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C2922E]"
                >
                  <span className="border-b border-[#C2922E] pb-1 transition-all duration-300">
                    EXPLORE THE COLLECTION
                  </span>
                  <ArrowUpRight size={13} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WomenHero;
