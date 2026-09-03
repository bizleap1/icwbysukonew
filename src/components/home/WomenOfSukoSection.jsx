import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Quote } from "lucide-react";
import { WOMEN_OF_SUKO_PROFILES } from "../../data/products";

export const WomenOfSukoSection = () => {
  return (
    <section className="bg-[#FAF8F5] pt-10 sm:pt-14 lg:pt-18 pb-14 sm:pb-20 lg:pb-24 transition-colors duration-300">
      <div className="w-full mx-auto px-6 sm:px-10 lg:px-12 xl:px-14">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 sm:mb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="w-4 h-[1px] bg-[#C2922E]" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#C2922E] font-medium font-body">
                WOMEN OF SUKO &middot; LEADER PROFILES
              </span>
            </div>
            <h2 className="font-quiche text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#121215] mb-3">
              Designed for <span className="italic font-normal">Women Who Lead.</span>
            </h2>
            <p className="text-[#555562] font-body text-xs sm:text-[14px] font-light leading-relaxed">
              From boardroom tables and stage keynotes to venture scaling and architectural design — SUKO outfits leaders across every high-stakes arena.
            </p>
          </div>

          <div className="text-left md:text-right">
            <span className="text-[10px] uppercase tracking-[0.24em] text-[#8E8E93] block font-body">
              Editorial Archetype Series
            </span>
          </div>
        </div>

        {/* 4 Leader Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {WOMEN_OF_SUKO_PROFILES.map((profile) => (
            <div
              key={profile.id}
              className="bg-[#FAF8F5] border border-[#E8E4DC] p-6 sm:p-7 flex flex-col justify-between shadow-sm group hover:shadow-md transition-all duration-300 font-body"
            >
              <div>
                {/* Photo & Moment Tag */}
                <div className="relative aspect-[3/3.8] overflow-hidden bg-[#121215] mb-5">
                  <img
                    src={profile.image}
                    alt={profile.archetype}
                    loading="lazy"
                    className="w-full h-full object-cover object-[50%_15%] transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[8.5px] uppercase tracking-[0.22em] text-white bg-black/75 backdrop-blur-md px-2 py-0.5 font-medium">
                      {profile.momentLabel}
                    </span>
                  </div>
                </div>

                {/* Profile Information */}
                <span className="text-[9.5px] uppercase tracking-[0.22em] text-[#C2922E] font-semibold block mb-1">
                  {profile.archetype}
                </span>
                <h3 className="font-quiche text-lg sm:text-xl font-medium text-[#121215] mb-1">
                  {profile.role}
                </h3>
                <p className="text-[11px] uppercase tracking-wider text-[#75757E] mb-4">
                  {profile.field}
                </p>

                {/* Perspective Quote */}
                <div className="relative pt-2 pb-4 border-t border-[#E8E4DC]">
                  <Quote size={14} className="text-[#C2922E]/60 mb-2" />
                  <p className="text-xs text-[#44444C] font-light italic leading-relaxed">
                    &ldquo;{profile.quote}&rdquo;
                  </p>
                </div>
              </div>

              {/* Worn Piece Link */}
              <div className="pt-3 border-t border-[#E8E4DC]">
                <Link
                  to={`/product/${profile.wornSlug}`}
                  className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#121215] group-hover:text-[#C2922E] transition-colors flex items-center justify-between"
                >
                  <span>Shop Look &middot; {profile.wornItem}</span>
                  <ArrowRight size={11} className="text-[#C2922E] transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WomenOfSukoSection;
