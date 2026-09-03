import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { MOMENTS } from "../../data/products";

// Desktop and Mobile Moments for Homepage with original vertical editorial images
const HOME_MOMENTS = [
  { 
    id: "presentation", 
    title: "The Presentation Edit", 
    image: "/presentation_woman.webp", 
    position: "object-[50%_50%]" 
  },
  { 
    id: "after-hours", 
    title: "After-Hours Executive", 
    image: "/after_hour_woman.webp", 
    position: "object-[50%_8%]" 
  },
  { 
    id: "boardroom", 
    title: "The Boardroom Edit", 
    image: "/boardroom_women.webp", 
    position: "object-[50%_18%]" 
  },
  { 
    id: "founder", 
    title: "The Founder Edit", 
    image: "/founder_women.webp", 
    position: "object-[50%_24%]" 
  },
  { 
    id: "essentials", 
    title: "Executive Essentials", 
    image: "/executive_woman.webp", 
    position: "object-[50%_7%]" 
  }
];

const getObjectPosition = (id) => {
  switch (id) {
    case "presentation":
      return "object-[50%_50%]";
    case "founder":
      return "object-[50%_24%]";
    case "after-hours":
      return "object-[50%_8%]";
    case "essentials":
      return "object-[50%_7%]";
    case "boardroom":
    default:
      return "object-[50%_18%]";
  }
};

export const ShopByMomentSection = () => {
  const [activeMobileIdx, setActiveMobileIdx] = useState(0);
  const scrollRef = useRef(null);

  const handleMobileScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollLeft = container.scrollLeft;
    const itemWidth = container.clientWidth * 0.84;
    const newIdx = Math.round(scrollLeft / itemWidth);
    if (newIdx !== activeMobileIdx && newIdx >= 0 && newIdx < HOME_MOMENTS.length) {
      setActiveMobileIdx(newIdx);
    }
  };

  return (
    <section className="bg-[#FAF8F5] pt-6 sm:pt-8 lg:pt-9 pb-2 sm:pb-4 lg:pb-6 transition-colors duration-300">
      <div className="w-full mx-auto px-6 sm:px-10 lg:px-12 xl:px-14">
        
        {/* 1. Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-5 sm:mb-8 lg:mb-9">
          <div>
            <div className="flex items-center gap-2 mb-1.5 sm:mb-3">
              <span className="w-3.5 h-[1px] bg-[#C2922E]" />
              <span className="text-[9.5px] sm:text-[11px] uppercase tracking-[0.32em] text-[#C2922E] font-medium font-body">
                THE MOMENTS ARCHITECTURE
              </span>
            </div>
            <h2 className="font-quiche text-2xl sm:text-4xl lg:text-6xl font-light tracking-tight text-[#121215] leading-tight">
              What Are You <span className="italic font-normal">Dressing For?</span>
            </h2>
          </div>

          {/* Header Link / CTA */}
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full md:w-auto">
            <Link
              to="/shop-by-moment"
              className="group relative inline-block pt-1 pb-1 select-none"
            >
              <span className="text-[11px] sm:text-[12.5px] uppercase tracking-[0.20em] sm:tracking-[0.22em] font-medium text-[#121215] block">
                EXPLORE ALL 5 EDITS
              </span>
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30" />
              <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#121215] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
            </Link>

            {/* Subtle Mobile Counter (e.g. 01 / 05) */}
            <span className="lg:hidden text-[10.5px] uppercase tracking-[0.22em] text-[#8E8E93] font-body">
              {String(activeMobileIdx + 1).padStart(2, "0")} / {String(HOME_MOMENTS.length).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* 2. MOBILE VIEW: Premium Horizontal Editorial Swipe Carousel (lg:hidden) */}
        <div className="lg:hidden">
          <div 
            ref={scrollRef}
            onScroll={handleMobileScroll}
            className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-3 pt-1 -mx-6 px-6 hide-scrollbar select-none"
          >
            {HOME_MOMENTS.map((m) => (
              <Link
                key={m.id}
                to={`/shop-by-moment?moment=${m.id}`}
                className="snap-center flex-shrink-0 w-[84vw] sm:w-[70vw] max-w-[420px] aspect-[4/5] relative overflow-hidden bg-[#121215] rounded-[2px] flex flex-col justify-end p-5 text-white block select-none cursor-pointer shadow-md"
              >
                {/* High-Fashion Portrait Image */}
                <img
                  src={m.image}
                  alt={m.title}
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 w-full h-full object-cover ${m.position}`}
                />
                
                {/* Subtle Bottom Gradient */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(0deg, rgba(10,10,12,0.80) 0%, rgba(10,10,12,0.25) 32%, transparent 55%)"
                  }}
                />
                
                {/* Card Text Inside Image (Bottom-Left) */}
                <div className="relative z-10">
                  <h3 className="font-quiche text-2xl sm:text-3xl font-light leading-tight tracking-tight text-white mb-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                    {m.title}
                  </h3>

                  <div>
                    <span className="relative inline-block pt-0 pb-0.5 select-none">
                      <span className="text-[10px] uppercase tracking-[0.24em] font-medium text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] block">
                        EXPLORE THE EDIT
                      </span>
                      <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/40" />
                      <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. DESKTOP VIEW: Magazine Campaign Layout 2 Large + 3 Supporting (hidden lg:grid) */}
        <div className="hidden lg:grid grid-cols-12 gap-3 items-stretch">
          
          {/* TOP ROW: 2 Large Featured Moments (The Presentation Edit & After-Hours Executive) */}
          {HOME_MOMENTS.slice(0, 2).map((m) => (
            <Link
              key={m.id}
              to={`/shop-by-moment?moment=${m.id}`}
              className="lg:col-span-6 group relative overflow-hidden bg-[#121215] h-[540px] xl:h-[580px] flex flex-col justify-end p-7 lg:p-8 text-white block select-none cursor-pointer rounded-[2px]"
            >
              <img
                src={m.image}
                alt={m.title}
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 w-full h-full object-cover ${m.position || getObjectPosition(m.id)} transition-transform duration-1000 ease-out group-hover:scale-106 opacity-100`}
              />
              
              <div 
                className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: "linear-gradient(0deg, rgba(10,10,12,0.60) 0%, rgba(10,10,12,0.20) 22%, transparent 45%)"
                }}
              />
              
              <div className="relative z-10">
                <h3 className="font-quiche text-3xl lg:text-[34px] font-light leading-tight tracking-tight text-white mb-1 group-hover:text-white/95 transition-colors drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
                  {m.title}
                </h3>

                <div>
                  <span className="relative inline-block pt-0 pb-0.5 select-none">
                    <span className="text-[10px] uppercase tracking-[0.26em] font-medium text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] block">
                      EXPLORE THE EDIT
                    </span>
                    <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/40" />
                    <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {/* BOTTOM ROW: 3 Supporting Moments (The Boardroom Edit, The Founder Edit, Executive Essentials) */}
          {HOME_MOMENTS.slice(2, 5).map((m) => (
            <Link
              key={m.id}
              to={`/shop-by-moment?moment=${m.id}`}
              className="lg:col-span-4 group relative overflow-hidden bg-[#121215] h-[540px] xl:h-[580px] flex flex-col justify-end p-5 lg:p-6 text-white block select-none cursor-pointer rounded-[2px]"
            >
              <img
                src={m.image}
                alt={m.title}
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 w-full h-full object-cover ${m.position || getObjectPosition(m.id)} transition-transform duration-1000 ease-out group-hover:scale-106 opacity-100`}
              />
              
              <div 
                className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: "linear-gradient(0deg, rgba(10,10,12,0.60) 0%, rgba(10,10,12,0.20) 22%, transparent 45%)"
                }}
              />
              
              <div className="relative z-10">
                <h3 className="font-quiche text-2xl lg:text-[24px] font-light leading-snug tracking-tight text-white mb-0.5 group-hover:text-white/95 transition-colors drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
                  {m.title}
                </h3>

                <div>
                  <span className="relative inline-block pt-0 pb-0.5 select-none">
                    <span className="text-[9.5px] uppercase tracking-[0.26em] font-medium text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] block">
                      EXPLORE THE EDIT
                    </span>
                    <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/40" />
                    <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                  </span>
                </div>
              </div>
            </Link>
          ))}

        </div>

      </div>
    </section>
  );
};

export default ShopByMomentSection;
