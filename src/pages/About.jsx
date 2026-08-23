import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const About = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const yHero = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div data-testid="about-page" className="bg-[#0a0a0c] text-white min-h-screen" ref={containerRef}>
      
      {/* 1. CINEMATIC HERO SECTION */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        <motion.div 
          style={{ y: yHero, opacity: opacityHero }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="/products/the-noir-tailored-suit/1.JPG" 
            alt="SUKO Atelier Fabric" 
            className="w-full h-full object-cover scale-105"
          />
          {/* Dark luxury gradients to blend the image into the background seamlessly */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c]/60 via-[#0a0a0c]/80 to-[#0a0a0c]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-transparent to-[#0a0a0c] opacity-80" />
        </motion.div>

        <div className="relative z-10 text-center px-6 mt-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-[10px] uppercase tracking-[0.5em] text-white/50 font-body block mb-8">— The Atelier</span>
            <h1 className="font-display text-5xl sm:text-7xl lg:text-[8rem] tracking-tighter font-medium leading-[0.9]">
              Quiet luxury for those <br className="hidden lg:block" /> who let the <em className="italic font-normal text-white/60">work speak.</em>
            </h1>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-10"
        >
          <span className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-body">Scroll to explore</span>
          <div className="w-[1px] h-12 bg-white/20 relative overflow-hidden">
             <motion.div 
               animate={{ y: ["-100%", "100%"] }}
               transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
               className="absolute inset-0 bg-white"
             />
          </div>
        </motion.div>
      </section>

      {/* 2. EDITORIAL HERITAGE SECTION */}
      <section className="relative z-20 max-w-[1600px] mx-auto px-6 lg:px-16 py-20 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 lg:col-start-2"
          >
            <span className="text-[10px] uppercase tracking-[0.4em] text-white/50 font-body block mb-6">— Heritage</span>
            <h2 className="font-display text-4xl lg:text-5xl tracking-tight mb-8 leading-tight">A house, not a brand.</h2>
            <div className="space-y-6 text-white/60 font-body text-sm lg:text-base leading-relaxed max-w-md">
              <p>
                SUKO was founded with a single conviction — that the modern executive deserves tailoring as exacting as her ambition. We work between Mumbai and Milan, drawing on three generations of craftsmen who can still hand-pad a lapel in under forty minutes.
              </p>
              <p>
                Each garment is cut by a single tailor and finished by a single hand. We do not produce volume. We produce wardrobe.
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-4 aspect-[3/4] overflow-hidden bg-[#111113] relative border border-white/5"
          >
            <img src="/products/the-plum-sculpted-suit/1.JPG" alt="Bespoke luxury tailoring" className="w-full h-full object-cover scale-105" />
            <div className="absolute inset-0 bg-black/20 mix-blend-overlay pointer-events-none" />
          </motion.div>
          
        </div>
      </section>

      {/* 3. THE CRAFTSMANSHIP SHOWCASE */}
      <section className="border-y border-white/5 bg-[#08080a] py-20 lg:py-32 px-6 lg:px-16 overflow-hidden">
        <div className="max-w-[1600px] mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="mb-24 lg:w-1/2"
          >
            <span className="text-[10px] uppercase tracking-[0.4em] text-white/50 font-body block mb-6">— Craftsmanship</span>
            <h2 className="font-display text-4xl lg:text-6xl tracking-tighter mb-8 leading-[1.1]">Forty-eight hours, twelve hands.</h2>
            <p className="text-white/60 leading-relaxed font-body text-base max-w-md">
              A SUKO two-piece passes through twelve craftspeople over forty-eight hours. The canvas is sewn by hand. The lapels are pressed three times. Buttonholes are cut, then bound — never milled.
            </p>
          </motion.div>

          {/* Macro details grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { src: "/products/dusty-rose-sculpted-flare-suit/1.JPG", title: "Hand-finished lapel", delay: 0 },
              { src: "/products/midnight-sculpted-vest-set/1.JPG", title: "Bespoke construction", delay: 0.2 },
              { src: "/products/midnight-peplum-fishtail-set/1.JPG", title: "Sculpted silhouette", delay: 0.4 },
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: item.delay, ease: [0.22, 1, 0.36, 1] }}
                className="group cursor-default"
              >
                <div className="aspect-[4/5] overflow-hidden bg-[#111113] border border-white/5 mb-6 relative">
                   <img 
                     src={item.src} 
                     alt={item.title} 
                     loading="lazy"
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-[cubic-bezier(0.25,1,0.5,1)] opacity-80 group-hover:opacity-100" 
                   />
                </div>
                <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-white/40 group-hover:text-white/80 transition-colors duration-500">
                  <span className="w-6 h-[1px] bg-white/20 group-hover:bg-white/50 transition-colors" />
                  {item.title}
                </div>
              </motion.div>
            ))}
          </div>
          
        </div>
      </section>

      {/* 4. FOOTER CLOSING STATEMENT */}
      <section className="py-40 text-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="max-w-2xl mx-auto"
        >
          <span className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-body block mb-8">— Three Cities</span>
          <div className="font-display text-4xl lg:text-6xl tracking-tight text-white/90">
            Mumbai <span className="text-white/20 mx-4 font-body font-light">|</span> Milan <span className="text-white/20 mx-4 font-body font-light">|</span> London
          </div>
        </motion.div>
      </section>

    </div>
  );
};

export default About;
