import React from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Compass, Shield, Sparkles } from "lucide-react";
import SEO from "../components/SEO";
import ServiceStrip from "../components/home/ServiceStrip";

const About = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div 
      data-testid="about-page" 
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white min-h-screen pt-28 sm:pt-36 lg:pt-40 transition-colors duration-300"
    >
      <SEO 
        title="The Atelier &amp; Heritage"
        description="The story and philosophy of ICW by Suko — precision corporate tailoring and sculpted silhouettes designed for modern executive authority."
      />

      {/* =========================================================================
          SECTION 1: HERO / EDITORIAL INTRODUCTION (Warm Ivory)
          ========================================================================= */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-14 xl:px-16 mb-16 sm:mb-24">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.2 : 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-center gap-2.5 mb-3 sm:mb-4">
            <span className="w-4 h-[1px] bg-[#C2922E]" />
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#C2922E] font-medium font-body">
              ICW BY SUKO &middot; THE ATELIER
            </span>
            <span className="w-4 h-[1px] bg-[#C2922E]" />
          </div>

          <h1 className="font-quiche text-3xl sm:text-5xl lg:text-7xl font-light text-[#111113] tracking-tight leading-[1.05] mb-5 sm:mb-7">
            Architectural Tailoring, <br />
            <span className="italic font-normal text-[#2A2A30]">Sculpted for Authority.</span>
          </h1>

          <p className="text-xs sm:text-[15px] text-[#555560] font-light leading-relaxed max-w-2xl mx-auto">
            Impeccable structure engineered for the modern female leader. We create tailored suiting sets and coordinated silhouettes shaped for effortless composure in the boardroom.
          </p>
        </motion.div>
      </section>

      {/* =========================================================================
          SECTION 2: LARGE EDITORIAL CAMPAIGN VISUAL (Warm Ivory Frame)
          ========================================================================= */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-14 xl:px-16 mb-20 sm:mb-28">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
          whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[16/9] sm:aspect-[21/9] lg:aspect-[24/10] overflow-hidden bg-[#F0EBE1] border border-[#E8E4DC]"
        >
          <img
            src="/boardroom_women.jpg"
            alt="ICW Executive Tailoring Editorial"
            fetchPriority="high"
            className="w-full h-full object-cover object-[50%_25%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 text-white">
            <span className="text-[9px] sm:text-[10.5px] uppercase tracking-[0.3em] font-medium block">
              THE BOARDROOM EDIT
            </span>
          </div>
        </motion.div>
      </section>

      {/* =========================================================================
          SECTION 3: BRAND PHILOSOPHY & PILLARS (Warm Ivory)
          ========================================================================= */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-14 xl:px-16 mb-20 sm:mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          <div className="lg:col-span-4">
            <span className="text-[10px] uppercase tracking-[0.26em] text-[#C2922E] font-medium block mb-2">
              OUR PHILOSOPHY
            </span>
            <h2 className="font-quiche text-2xl sm:text-4xl text-[#111113] font-light leading-tight mb-4">
              We do not chase seasons. We perfect the silhouette.
            </h2>
            <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed">
              Every ICW creation is conceived as an architectural garment — balancing structured shoulder pads, clean lapel lines, and fluid proportions that empower women in executive leadership.
            </p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                num: "01",
                icon: <Compass size={18} className="text-[#C2922E]" />,
                title: "Precision Structure",
                desc: "Sculpted shoulder lines and defined silhouettes designed to command presence."
              },
              {
                num: "02",
                icon: <Shield size={18} className="text-[#C2922E]" />,
                title: "Tailored Composure",
                desc: "Structured corporate tailoring designed with refined proportions and executive presence."
              },
              {
                num: "03",
                icon: <Sparkles size={18} className="text-[#C2922E]" />,
                title: "Complete Sets",
                desc: "Coordinated sets and modular separates designed to create a cohesive corporate wardrobe."
              }
            ].map((pillar, idx) => (
              <div key={idx} className="bg-[#F3EFE6] border border-[#E8E4DC] p-6 sm:p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-[#C2922E] tracking-widest">{pillar.num}</span>
                    {pillar.icon}
                  </div>
                  <h3 className="font-quiche text-lg text-[#111113] font-normal mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-[#555560] font-light leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 4: THE ICW WOMAN & EDITORIAL SPLIT (Warm Ivory)
          ========================================================================= */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-14 xl:px-16 mb-20 sm:mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="relative aspect-[3/4] max-w-md mx-auto lg:max-w-none overflow-hidden bg-[#F0EBE1] border border-[#E8E4DC]">
              <img
                src="/products/the-noir-tailored-suit/1.JPG"
                alt="The Noir Tailored Suit"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
            <span className="text-[10px] uppercase tracking-[0.26em] text-[#C2922E] font-medium block">
              THE SILHOUETTE
            </span>
            <h2 className="font-quiche text-3xl sm:text-5xl text-[#111113] font-light leading-tight">
              Crafted for Quiet Luxury &amp; Definite Presence.
            </h2>
            <div className="space-y-4 text-xs sm:text-[14px] text-[#555560] font-light leading-relaxed">
              <p>
                ICW by Suko is engineered around the belief that luxury in corporate dressing is quiet, impeccably tailored, and structured.
              </p>
              <p>
                From single-breasted power suits and sculpted waistcoats to fishtail skirts and flared trousers, our silhouettes are designed for executive presence.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/collection"
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] font-medium text-[#111113] border-b border-[#111113] pb-1 hover:text-[#C2922E] hover:border-[#C2922E] transition-colors"
              >
                Explore Curated Edits &rarr;
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 5: DARK CONTRAST ATELIER CINEMATIC BANNER (~20% Visual Weight)
          ========================================================================= */}
      <section className="relative min-h-[50vh] sm:min-h-[58vh] lg:min-h-[64vh] flex items-center justify-center overflow-hidden bg-[#0A0A0C] text-white py-16 sm:py-24 px-5 sm:px-6 mb-20 sm:mb-28">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-45 scale-105"
        >
          <source src="/atlier_women.mp4" type="video/mp4" />
        </video>

        <div className="relative z-10 text-center max-w-2xl mx-auto px-4">
          <span className="text-[10px] uppercase tracking-[0.32em] text-[#C2922E] font-medium block mb-3">
            THE ATELIER VISION
          </span>
          <h2 className="font-quiche text-3xl sm:text-5xl font-light text-white tracking-tight leading-tight mb-4">
            Cut with Intention. <br />
            <span className="italic font-normal text-white/80">Tailored for Ambition.</span>
          </h2>
          <p className="text-xs sm:text-sm text-white/70 font-light leading-relaxed max-w-lg mx-auto mb-8">
            Every silhouette is conceived to celebrate structure, elegance, and authoritative corporate poise.
          </p>

          <Link
            to="/new-in"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-[#111113] text-[11px] uppercase tracking-[0.24em] font-medium hover:bg-[#C2922E] hover:text-white transition-colors"
          >
            <span>Explore New Arrivals</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: SERVICE STRIP
          ========================================================================= */}
      <ServiceStrip />
    </div>
  );
};

export default About;
