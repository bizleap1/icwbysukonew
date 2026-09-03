import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DAY_MOMENTS = [
  {
    id: "arrival",
    time: "8:00 AM",
    title: "THE ARRIVAL",
    subtext: "The day begins on her terms.",
    videoSrc: "/Woman_walking_in_business_district_202608311458.mp4",
    poster: "/Woman_walking_in_business_district_202608311458_poster.webp",
    objectPosition: "object-[50%_15%] sm:object-[50%_25%]"
  },
  {
    id: "boardroom",
    time: "11:30 AM",
    title: "THE BOARDROOM",
    subtext: "She doesn't enter the room. She leads it.",
    videoSrc: "/Woman_walking_in_luxury_boardroom_202608311517.mp4",
    poster: "/Woman_walking_in_luxury_boardroom_202608311517_poster.webp",
    objectPosition: "object-[50%_12%] sm:object-[50%_20%]"
  },
  {
    id: "presentation",
    time: "3:00 PM",
    title: "THE PRESENTATION",
    subtext: "Poise in every move. Presence in every word.",
    videoSrc: "/Woman_presenting_in_office_1080p_202608311521.mp4",
    poster: "/Woman_presenting_in_office_1080p_202608311521_poster.webp",
    objectPosition: "object-[50%_15%] sm:object-[50%_22%]"
  },
  {
    id: "evening",
    time: "EVENING",
    title: "AFTER HOURS",
    subtext: "Work ends. Her presence doesn't.",
    videoSrc: "/Woman_walking_in_luxury_interior_202608311530.mp4",
    poster: "/Woman_walking_in_luxury_interior_202608311530_poster.webp",
    objectPosition: "object-[50%_12%] sm:object-[50%_20%]"
  }
];

export const StylingFilmSection = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeMoment = DAY_MOMENTS[activeIdx];
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const [isInView, setIsInView] = useState(true);

  // 1. Viewport visibility observation (Autoplays when visible, pauses when out of view)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 2. Automatically advance to next clip on video completion or 5.5s fallback
  const handleVideoEnded = () => {
    setActiveIdx((prev) => (prev + 1) % DAY_MOMENTS.length);
  };

  useEffect(() => {
    if (!isInView) return;

    const timer = setTimeout(() => {
      setActiveIdx((prev) => (prev + 1) % DAY_MOMENTS.length);
    }, 5500);

    return () => clearTimeout(timer);
  }, [activeIdx, isInView]);

  return (
    <section 
      ref={sectionRef}
      className="bg-[#FAF8F5] pt-5 sm:pt-7 lg:pt-8 pb-6 sm:pb-8 lg:pb-9 transition-colors duration-300"
    >
      <div className="w-full mx-auto px-3.5 sm:px-6 lg:px-12 xl:px-14">
        
        {/* 1. Header Area (Matched exactly with ShopByMomentSection typography & spacing) */}
        <div className="text-center max-w-4xl mx-auto mb-5 sm:mb-7 lg:mb-8 select-none">
          <div className="flex items-center justify-center gap-2 mb-1.5 sm:mb-3">
            <span className="w-3.5 h-[1px] bg-[#C2922E]" />
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.32em] text-[#C2922E] font-medium font-body">
              THE SUKO WOMAN
            </span>
            <span className="w-3.5 h-[1px] bg-[#C2922E]" />
          </div>

          <h2 className="font-quiche text-2xl sm:text-4xl lg:text-6xl font-light tracking-tight text-[#121215] leading-tight">
            One Woman. <span className="italic font-normal">Multiple Moments.</span>
          </h2>
        </div>

        {/* 2. Responsive Fashion Film: Taller 4:5 Portrait Mobile Crop (clamp 460px-560px) & Cinematic Desktop */}
        <div className="max-w-[1400px] w-full mx-auto">
          <div className="relative w-full h-[clamp(460px,60vh,560px)] sm:h-[460px] lg:h-[clamp(460px,53vh,560px)] overflow-hidden bg-[#0A0A0C] shadow-lg rounded-[2px]">
            
            {/* Auto-playing, looping crossfade video (350ms soft cross-dissolve) */}
            <AnimatePresence mode="wait">
              <motion.video
                key={activeMoment.id}
                ref={videoRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                autoPlay
                muted
                playsInline
                poster={activeMoment.poster}
                onEnded={handleVideoEnded}
                preload="metadata"
                className={`w-full h-full object-cover ${activeMoment.objectPosition} scale-[1.01]`}
              >
                <source src={activeMoment.videoSrc} type="video/mp4" />
              </motion.video>
            </AnimatePresence>

            {/* Subtle Gradient Overlay for Text Legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            {/* Lower-Left Restrained Typography Overlay (16–20px Mobile Safe-Area Padding) */}
            <div className="absolute bottom-4 sm:bottom-6 lg:bottom-8 left-4 sm:left-7 lg:left-9 z-20 select-none max-w-lg pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMoment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  {/* Small Gold Spaced Time Label */}
                  <span className="text-[9px] sm:text-[10px] lg:text-[10.5px] uppercase tracking-[0.28em] text-[#E0A838] font-medium font-body block mb-1 drop-shadow-md">
                    {activeMoment.time}
                  </span>

                  {/* Elegant Serif Moment Title (24–30px on Mobile) */}
                  <h3 className="font-quiche text-2xl sm:text-2xl lg:text-[30px] font-light text-white tracking-tight uppercase leading-none mb-1 sm:mb-1.5 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                    {activeMoment.title}
                  </h3>

                  {/* Restrained Supporting Narrative Copy (12–14px) */}
                  <p className="font-quiche italic text-[12.5px] sm:text-[13.5px] lg:text-[14.5px] text-white/90 font-light tracking-[0.02em] drop-shadow-md">
                    {activeMoment.subtext}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default StylingFilmSection;
