import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Minus } from "lucide-react";

export const SignaturePillarsSection = () => {
  const [openSignaturePillar, setOpenSignaturePillar] = useState(0);

  const pillars = [
    {
      num: "01",
      title: "PRECISION TAILORING",
      desc: "Structured silhouettes designed for a refined professional fit."
    },
    {
      num: "02",
      title: "CONSIDERED FABRICS",
      desc: "Selected for breathability, drape and all-day executive comfort."
    },
    {
      num: "03",
      title: "FINISHED WITH PURPOSE",
      desc: "Thoughtful construction details crafted for enduring, polished wear."
    }
  ];

  return (
    <section className="bg-[#F7F5F0] pt-10 sm:pt-12 lg:pt-14 pb-14 sm:pb-20 lg:pb-24 px-4 sm:px-6 lg:px-[4.5vw] border-b border-[#EAE6DF] transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[28px] sm:gap-10 xl:gap-12 items-center">
          {/* Top/Left: Detail Image */}
          <div className="lg:col-span-6 relative aspect-[4/5] sm:aspect-[16/14] lg:aspect-[4/5] w-full bg-[#EAE6DF] overflow-hidden shadow-sm">
            <img
              src="/home_signature.webp"
              alt="ICW Signature Lapel Craftsmanship"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                if (e.currentTarget.src !== "/home_signature.png") {
                  e.currentTarget.src = "/home_signature.png";
                }
              }}
              className="w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
            />
          </div>

          {/* Bottom/Right: Editorial Narrative & Stacked Accordions */}
          <div className="lg:col-span-6 lg:pl-2 xl:pl-4 flex flex-col justify-center">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-2.5 sm:mb-4">
              <span className="w-5 h-[1.5px] bg-[#C2922E]" />
              <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.35em] text-[#C2922E] font-medium">
                ICW SIGNATURE
              </span>
            </div>

            {/* Large Quiche Heading */}
            <h2 className="font-quiche text-[31px] sm:text-5xl lg:text-[3.8rem] xl:text-[4.2rem] font-light text-[#121215] leading-[1.08] sm:leading-[1.05] mb-3.5 sm:mb-5">
              Tailoring, <br className="hidden sm:inline" />
              <span className="italic font-normal">refined.</span>
            </h2>

            {/* Description */}
            <p className="text-[#44444A] text-[13px] sm:text-base font-light leading-[1.68] sm:leading-relaxed mb-6 sm:mb-7 max-w-lg">
              Precision structure. Breathable comfort. Built for all-day confidence. Designed to elevate modern executive presence with timeless tailoring.
            </p>

            {/* Editorial Underline CTA */}
            <div className="mb-10 sm:mb-12">
              <Link
                to="/collection"
                className="group inline-flex items-center gap-2.5 text-[10.5px] sm:text-[11px] uppercase tracking-[0.24em] font-normal text-[#121215] hover:text-[#C2922E] transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C2922E]"
              >
                <span className="border-b border-[#121215] group-hover:border-[#C2922E] pb-1 transition-all duration-300">
                  DISCOVER SIGNATURE PIECES
                </span>
                <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Interactive Craftsmanship Accordions */}
            <div className="border-t border-[#E5E0D8]">
              {pillars.map((pillar, idx) => {
                const isOpen = openSignaturePillar === idx;
                return (
                  <div key={idx} className="border-b border-[#E5E0D8]">
                    <button
                      type="button"
                      onClick={() => setOpenSignaturePillar(isOpen ? -1 : idx)}
                      className="w-full py-3.5 sm:py-5 flex items-center justify-between text-left group transition-colors px-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C2922E]"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-3 sm:gap-6">
                        <span className="font-quiche text-xs sm:text-base text-[#B88628] tracking-widest font-semibold shrink-0">
                          {pillar.num}
                        </span>
                        <h4 className="font-quiche text-sm sm:text-xl font-medium text-[#111114] tracking-tight group-hover:text-[#C2922E] transition-colors">
                          {pillar.title}
                        </h4>
                      </div>
                      <span className="text-[#B88628] p-1">
                        {isOpen ? <Minus size={15} /> : <Plus size={15} />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="pb-3.5 pl-8 sm:pl-12 pr-4 text-xs sm:text-[14.5px] text-[#44444C] font-normal leading-relaxed">
                        {pillar.desc}
                      </div>
                    )}
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

export default SignaturePillarsSection;
