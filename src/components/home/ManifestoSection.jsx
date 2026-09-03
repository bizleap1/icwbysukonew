import React from "react";
import { motion, useReducedMotion } from "framer-motion";

export const ManifestoSection = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative bg-[#0A0A0D] text-white py-20 sm:py-28 lg:py-36 min-h-[60vh] sm:min-h-[68vh] lg:min-h-[74vh] flex items-center justify-center px-5 sm:px-8 lg:px-12 overflow-hidden">
      {/* Background Ambient Cinematic Video */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/manifesto_poster.webp"
          className="w-full h-full object-cover object-[50%_15%] scale-120 brightness-[0.92] contrast-[1.05]"
        >
          <source src="/manifesto.mp4" type="video/mp4" />
        </video>
        {/* Calibrated 50% Gradient Overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.48) 50%, rgba(0,0,0,0.58) 100%)"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/50" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0A0A0D] via-[#0A0A0D]/60 to-transparent" />
      </div>

      {/* Content */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 25 }}
        whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: shouldReduceMotion ? 0.2 : 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-[1050px] mx-auto text-center relative z-10"
      >
        <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.38em] text-[#C2922E] font-medium block mb-2.5">
          &mdash; The Manifesto
        </span>
        <div className="w-8 sm:w-10 h-[1px] bg-[#C2922E]/80 mx-auto mb-6 sm:mb-8" />

        {/* Manifesto Quote */}
        <h2 className="font-quiche text-2xl sm:text-3xl lg:text-[2.65rem] font-light tracking-tight leading-[1.25] sm:leading-[1.22] text-white max-w-[980px] mx-auto mb-6 sm:mb-8 drop-shadow-sm">
          &ldquo;We do not chase seasons. We perfect the <span className="italic font-normal text-white/95">silhouette</span> &mdash; tailoring with precision, purpose and quiet confidence.&rdquo;
        </h2>

        <p className="text-white/60 font-body text-[9.5px] sm:text-[11px] uppercase tracking-[0.3em] font-light max-w-lg mx-auto">
          DESIGNED FOR AMBITION &middot; TAILORED WITH PURPOSE
        </p>
      </motion.div>
    </section>
  );
};

export default ManifestoSection;
