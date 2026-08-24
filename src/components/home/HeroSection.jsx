import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export const HeroSection = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section 
      data-testid="hero-section"
      className="relative h-[78vh] sm:h-[85vh] lg:h-screen w-full bg-[#0A0A0C] overflow-hidden"
    >
      {/* Fullscreen Background Image with Focal Point Right */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#0A0A0C]">
        <img
          src="/boardroom_banner.jpg"
          alt="ICW Executive Luxury Tailoring Collection"
          fetchPriority="high"
          className="w-full h-full object-cover object-[78%_25%] sm:object-top opacity-90"
        />
        {/* Gradients ensuring uninterrupted typography legibility on the left */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-[2]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 sm:via-black/35 to-transparent z-[2]" />
      </div>

      {/* Lower-Third Anchored Hero Content */}
      <div className="absolute inset-x-0 bottom-[7vh] sm:bottom-[9vh] lg:bottom-[10vh] z-10 pointer-events-none">
        <div className="max-w-[1700px] w-full mx-auto px-5 sm:px-8 lg:px-14 xl:px-16 flex items-end justify-between">
          <div className="w-full max-w-[620px] pointer-events-auto">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.2 : 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Eyebrow Label with Gold Accent */}
              <div className="flex items-center gap-2.5 mb-2.5 sm:mb-[14px]">
                <span className="w-4 h-[1px] bg-[#C2922E]" />
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#C2922E] font-medium font-body">
                  ICW — BY SUKO
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="font-quiche text-3xl sm:text-5xl lg:text-[4.2rem] xl:text-[4.75rem] tracking-tight text-white leading-[0.98] sm:leading-[0.96] font-light mb-3.5 sm:mb-[18px] drop-shadow-2xl">
                The New <span className="italic font-normal text-white/90">Standard</span> <br />
                of <span className="italic font-normal text-white/90">Corporate</span> Style.
              </h1>

              {/* Concise 2-Line Subcopy */}
              <p className="text-white/80 sm:text-white/65 font-body text-xs sm:text-[13.5px] lg:text-[14.5px] tracking-wide font-light leading-relaxed max-w-[400px] mb-6 sm:mb-[28px] drop-shadow-sm">
                Impeccable structure designed for the modern female leader. Tailored for ambition.
              </p>

              {/* Editorial Underline CTA */}
              <div className="flex flex-row items-center gap-7 sm:gap-11 lg:gap-12 pt-1 pb-1">
                <Link
                  to="/women"
                  className="group inline-flex items-center gap-2 sm:gap-2.5 text-[10.5px] sm:text-[11.5px] uppercase tracking-[0.22em] font-normal text-white hover:text-[#C2922E] transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C2922E]"
                >
                  <span className="border-b border-[#C2922E] pb-0.5 sm:pb-1 transition-all duration-300">
                    DISCOVER THE COLLECTION
                  </span>
                  <ArrowUpRight size={13} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
