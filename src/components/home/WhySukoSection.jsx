import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const PILLARS = [
  {
    num: "0 1",
    title: "DESIGNED WITH INDIAN WOMEN IN MIND",
    desc: "Considered proportions and refined silhouettes."
  },
  {
    num: "0 2",
    title: "EXECUTIVE-FIRST DESIGN",
    desc: "Structured dressing created for modern professional environments."
  },
  {
    num: "0 3",
    title: "VERSATILE BY DESIGN",
    desc: "Coordinated pieces designed to work together or independently."
  }
];

export const WhySukoSection = () => {
  // First item open by default
  const [openIdx, setOpenIdx] = useState(0);

  const toggleAccordion = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="bg-[#FAF8F5] pt-5 sm:pt-7 lg:pt-10 pb-6 sm:pb-8 lg:pb-10 transition-colors duration-300">
      <div className="w-full mx-auto px-5 sm:px-8 lg:px-12 xl:px-14">
        
        {/* 1. MOBILE-FIRST EDITORIAL FLOW (lg:hidden — Text -> Controlled Image -> Accordions) */}
        <div className="lg:hidden flex flex-col text-left">
          
          {/* STEP 1: Text Block (Left-Aligned) */}
          <div className="flex flex-col items-start">
            
            {/* Label / Eyebrow (14–18px gap to heading) */}
            <div className="flex items-center gap-3 mb-3.5 sm:mb-4">
              <span className="w-5 h-[1.5px] bg-[#C2922E]" />
              <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.35em] text-[#C2922E] font-medium font-body">
                WHY SUKO
              </span>
            </div>

            {/* Heading (20–24px gap to paragraph) */}
            <h2 className="font-quiche text-3xl sm:text-4xl font-light text-[#121215] leading-[1.08] tracking-tight mb-5 sm:mb-6">
              Tailoring, <br />
              <span className="italic font-normal">refined.</span>
            </h2>

            {/* Short Supporting Copy (20px gap to CTA) */}
            <p className="text-[#44444A] font-body text-[13.5px] sm:text-base font-light leading-[1.68] mb-5 max-w-lg">
              Designed for modern Indian professionals with considered proportions, structured silhouettes and versatile pieces.
            </p>

            {/* Mobile CTA */}
            <div>
              <Link
                to="/about"
                className="group relative inline-block pt-0.5 pb-1 select-none"
              >
                <span className="text-[11px] uppercase tracking-[0.20em] font-medium text-[#121215] block">
                  DISCOVER THE SUKO STORY
                </span>
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30" />
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#121215] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
              </Link>
            </div>
          </div>

          {/* STEP 2: Controlled Macro Tailoring Detail Image (320–380px, Lapel & Button Detail) */}
          <div className="mt-8 sm:mt-9 mb-8 w-full h-[320px] sm:h-[370px] overflow-hidden bg-[#121215] rounded-[2px] shadow-md">
            <img
              src="/home_signature.webp"
              alt="SUKO Executive Tailoring & Button Craftsmanship"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                if (e.currentTarget.src !== "/home_signature.png") {
                  e.currentTarget.src = "/home_signature.png";
                }
              }}
              className="w-full h-full object-cover object-[48%_38%]"
            />
          </div>

          {/* STEP 3: Single-Column Edge-to-Edge Accordions (Item 01 Default Open) */}
          <div className="border-t border-[#E5E0D8]">
            {PILLARS.map((pillar, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div key={pillar.num} className="border-b border-[#E5E0D8]">
                  <button
                    onClick={() => toggleAccordion(idx)}
                    className="w-full py-4 sm:py-4.5 flex items-center justify-between text-left focus:outline-none select-none group"
                  >
                    <div className="flex items-center gap-4 sm:gap-5 pr-3">
                      <span className="font-quiche text-xs sm:text-sm text-[#B88628] tracking-[0.25em] font-normal shrink-0">
                        {pillar.num}
                      </span>
                      <h3 className="font-quiche text-[15px] sm:text-[17px] font-normal tracking-[0.05em] text-[#111114] group-hover:text-[#C2922E] uppercase transition-colors">
                        {pillar.title}
                      </h3>
                    </div>
                    <span className="text-[#B88628] text-base font-light font-mono flex-shrink-0 transition-transform duration-200">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={idx === 0 ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="text-[13.5px] sm:text-[14.5px] text-[#44444C] font-normal leading-relaxed pb-3.5 pl-8 sm:pl-10">
                          {pillar.desc}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>

        {/* 2. DESKTOP EDITORIAL ACCORDION SPREAD (50/50 Image & Matched Typography Split) */}
        <div className="hidden lg:grid grid-cols-12 gap-10 xl:gap-14 items-center">
          
          {/* Left Column: Macro Tailoring Detail (50% width) */}
          <div className="lg:col-span-6 relative aspect-[4/5] overflow-hidden bg-[#121215] rounded-[2px] shadow-sm group">
            <img
              src="/home_signature.webp"
              alt="SUKO Executive Tailoring & Craftsmanship"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                if (e.currentTarget.src !== "/home_signature.png") {
                  e.currentTarget.src = "/home_signature.png";
                }
              }}
              className="w-full h-full object-cover object-[48%_38%] transition-transform duration-1000 ease-out group-hover:scale-104"
            />
          </div>

          {/* Right Column: Narrative + 3 Exact Matched Editorial Accordions (50% width) */}
          <div className="lg:col-span-6 flex flex-col justify-center pl-0 lg:pl-2">
            
            {/* Header Lockup */}
            <div className="flex items-center gap-3 mb-2.5 sm:mb-4">
              <span className="w-5 h-[1.5px] bg-[#C2922E]" />
              <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.35em] text-[#C2922E] font-medium font-body">
                WHY SUKO
              </span>
            </div>

            <h2 className="font-quiche text-[31px] sm:text-5xl lg:text-[3.8rem] xl:text-[4.2rem] font-light text-[#121215] leading-[1.08] sm:leading-[1.05] mb-3.5 sm:mb-5 max-w-xl">
              Tailoring, <br className="hidden sm:inline" />
              <span className="italic font-normal">refined.</span>
            </h2>

            {/* Short Supporting Copy */}
            <p className="text-[#44444A] font-body text-[13px] sm:text-base font-light leading-[1.68] sm:leading-relaxed mb-4 max-w-lg">
              Designed for modern Indian professionals with considered proportions, structured silhouettes and versatile pieces for every part of the workday.
            </p>

            {/* Signature Underline CTA */}
            <div className="mb-7">
              <Link
                to="/about"
                className="group relative inline-block pt-1 pb-1 select-none"
              >
                <span className="text-[11.5px] uppercase tracking-[0.20em] font-medium text-[#121215] block">
                  DISCOVER THE SUKO STORY
                </span>
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30" />
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#121215] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
              </Link>
            </div>

            {/* 3 Luxury Accordions (Exact Font & Size Matched with Screenshot) */}
            <div className="border-t border-[#E5E0D8]">
              {PILLARS.map((pillar, idx) => {
                const isOpen = openIdx === idx;
                return (
                  <div key={pillar.num} className="border-b border-[#E5E0D8]">
                    <button
                      onClick={() => toggleAccordion(idx)}
                      className="w-full py-4 sm:py-5 flex items-center justify-between text-left focus:outline-none select-none group"
                    >
                      <div className="flex items-center gap-4 sm:gap-6 pr-4">
                        <span className="font-quiche text-xs sm:text-base text-[#B88628] tracking-[0.25em] font-normal shrink-0">
                          {pillar.num}
                        </span>
                        <h3 className="font-quiche text-sm sm:text-lg lg:text-xl font-normal text-[#111114] tracking-[0.06em] group-hover:text-[#C2922E] uppercase transition-colors">
                          {pillar.title}
                        </h3>
                      </div>
                      <span className="text-[#B88628] text-base lg:text-lg font-light font-mono flex-shrink-0 transition-transform duration-200">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="text-xs sm:text-[14.5px] text-[#44444C] font-normal leading-relaxed pb-4 pl-8 sm:pl-12">
                            {pillar.desc}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default WhySukoSection;
