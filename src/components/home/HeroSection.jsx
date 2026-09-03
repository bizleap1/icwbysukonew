import React from "react";
import { Link } from "react-router-dom";

export const HeroSection = () => {
  return (
    <section
      data-testid="hero-section"
      className="relative w-full h-[100dvh] min-h-[580px] sm:min-h-[640px] lg:min-h-[720px] bg-[#0A0A0C] overflow-hidden flex items-end justify-center"
    >
      {/* 1. Fullscreen Background Video */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#0A0A0C]">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/hero_bg_poster.webp"
          className="w-full h-full object-cover object-[50%_18%] sm:object-[52%_20%] lg:object-[54%_20%] scale-[1.03] brightness-[1.06] contrast-[1.02]"
        >
          <source src="/hero_bg.mp4" type="video/mp4" />
        </video>
        {/* Soft Ambient Contrast Gradient (Lightened for garment detail clarity) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 sm:from-black/65 via-black/10 to-black/20 pointer-events-none" />
      </div>

      {/* 2. Direct Campaign Text Overlay (Crisp on All Screens) */}
      <div className="relative z-10 w-full mx-auto px-6 sm:px-10 lg:px-12 xl:px-14 pb-8 sm:pb-12 lg:pb-14 text-center flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto select-none">

          {/* Brand Title: SUKO */}
          <h1 className="font-quiche text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light tracking-[0.20em] sm:tracking-[0.24em] uppercase leading-none text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
            SUKO
          </h1>

          {/* Subtitle Statement: The Indian Corporate Wear */}
          <p className="font-quiche italic text-sm sm:text-lg md:text-xl lg:text-2xl text-white/95 font-light tracking-[0.08em] sm:tracking-[0.12em] mt-2.5 sm:mt-3 mb-4 sm:mb-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            The Indian Corporate Wear
          </p>

          {/* Luxury Editorial CTA: DISCOVER THE EDIT */}
          <div>
            <Link
              to="/new-in"
              className="group relative inline-block pt-1 pb-1.5 select-none focus-visible:outline-none cursor-pointer"
            >
              <span className="text-[12px] sm:text-[13.5px] lg:text-[15px] uppercase tracking-[0.18em] sm:tracking-[0.22em] font-medium text-white drop-shadow-md block">
                DISCOVER THE EDIT
              </span>

              {/* Thin Base Line */}
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/40" />

              {/* Animated Active Line on Hover */}
              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
