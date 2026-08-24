import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const CampaignVideoSection = () => {
  return (
    <section className="relative min-h-[68vh] sm:min-h-[75vh] lg:min-h-[82vh] flex items-center justify-center overflow-hidden bg-[#0A0A0C] text-white py-16 sm:py-24 px-5 sm:px-6">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover object-[50%_20%] opacity-65 scale-105"
        src="/world_of_suko.mp4"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/90" />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <span className="text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.4em] text-[#C2922E] font-medium block mb-3 sm:mb-4">
          THE WORLD OF SUKO
        </span>

        <h2 className="font-quiche text-3xl sm:text-6xl lg:text-7xl font-light text-white tracking-tight leading-[1.1] sm:leading-[1.08] mb-4 sm:mb-5">
          Built for the room. <br />
          <span className="italic font-normal text-white/95">Designed to own it.</span>
        </h2>

        <p className="text-white/70 text-[10px] sm:text-[12.5px] uppercase tracking-[0.26em] font-light mb-6 sm:mb-8">
          Precision Executive Tailoring &mdash; ICW BY SUKO
        </p>

        <div>
          <Link
            to="/collection"
            className="group inline-flex items-center gap-2.5 text-[10.5px] sm:text-[11px] uppercase tracking-[0.26em] font-normal text-white hover:text-[#C2922E] transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C2922E]"
          >
            <span className="border-b border-white group-hover:border-[#C2922E] pb-1 transition-all duration-300">
              EXPLORE THE COLLECTION
            </span>
            <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CampaignVideoSection;
