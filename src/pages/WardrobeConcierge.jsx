import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import SEO from "../components/SEO";
import ServiceStrip from "../components/home/ServiceStrip";

export const WardrobeConcierge = () => {
  const [activeMomentIndex, setActiveMomentIndex] = useState(0);

  // Pre-filled WhatsApp message helper
  const getWhatsAppLink = (customText = "Hi SUKO, I’d like help curating my professional wardrobe.") => {
    return `https://wa.me/919370350885?text=${encodeURIComponent(customText)}`;
  };

  const DEFAULT_WHATSAPP_LINK = getWhatsAppLink("Hi SUKO, I’d like help curating my professional wardrobe.");

  // Section 2: 4 Assisted Shopping Moments (Interactive Digital Concierge Selector)
  const ASSISTED_OCCASIONS = [
    {
      id: "presentations",
      title: "PRESENTATIONS & PITCHES",
      description: "High-visibility dressing for pitches and key presentations.",
      whatsappText: "Hi SUKO, I’d like styling help for an upcoming presentation or pitch.",
      image: "/presentation_woman.webp",
      tagline: "Keynotes & Boardroom Pitches"
    },
    {
      id: "leadership",
      title: "LEADERSHIP MOMENTS",
      description: "Considered tailoring for meetings, new roles and executive presence.",
      whatsappText: "Hi SUKO, I’d like styling help for an important leadership moment.",
      image: "/boardroom_women.webp",
      tagline: "Executive Presence & Board Meetings"
    },
    {
      id: "travel",
      title: "BUSINESS TRAVEL",
      description: "Coordinated looks planned around your trip.",
      whatsappText: "Hi SUKO, I’d like help planning my wardrobe for a business trip.",
      image: "/collection_hero.webp",
      tagline: "Transit, Summits & International Trips"
    },
    {
      id: "wardrobe",
      title: "EXECUTIVE WARDROBE",
      description: "Build a professional wardrobe around your needs.",
      whatsappText: "Hi SUKO, I’d like help building my professional wardrobe.",
      image: "/executive_woman.webp",
      tagline: "Complete Capsule & Wardrobe Foundations"
    }
  ];

  // Section 3: 3-Step WhatsApp Concierge Process
  const HOW_IT_WORKS_STEPS = [
    {
      num: "01",
      title: "Tell Us What You’re Dressing For",
      description: "Start your conversation with a SUKO stylist on WhatsApp."
    },
    {
      num: "02",
      title: "Share Your Preferences",
      description: "Height, usual size, preferred fit and budget."
    },
    {
      num: "03",
      title: "Receive Your SUKO Edit",
      description: "Curated pieces selected for you, with direct product links."
    }
  ];

  // Section 4: Moments Bridge (Discover The SUKO Edits)
  const MOMENTS_LINKS = [
    {
      id: "boardroom",
      name: "The Boardroom Edit",
      tagline: "Command the Room.",
      image: "/boardroom_women.webp",
      link: "/shop-by-moment?moment=boardroom"
    },
    {
      id: "founder",
      name: "The Founder Edit",
      tagline: "Building What’s Next.",
      image: "/founder_women.webp",
      link: "/shop-by-moment?moment=founder"
    },
    {
      id: "presentation",
      name: "The Presentation Edit",
      tagline: "Own the Room.",
      image: "/presentation_woman.webp",
      link: "/shop-by-moment?moment=presentation"
    },
    {
      id: "after-hours",
      name: "The After-Hours Edit",
      tagline: "From Workday to Evening.",
      image: "/after_hour_woman.webp",
      link: "/shop-by-moment?moment=after-hours"
    }
  ];

  // Section 5: The SUKO Approach (3 Benefits)
  const DETAILS_POINTS = [
    {
      title: "FIT & SIZE GUIDANCE",
      description: "Recommendations based on your usual size and preferred fit."
    },
    {
      title: "PERSONALISED SELECTION",
      description: "SUKO pieces curated around what you’re dressing for and your preferences."
    },
    {
      title: "COORDINATED STYLING",
      description: "Looks selected to work together across your professional wardrobe."
    }
  ];

  return (
    <div
      data-testid="personal-styling-page"
      className="bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white min-h-screen pt-20 transition-colors duration-300"
    >
      <SEO
        title="Personal Styling — A Wardrobe, Considered Around You | SUKO"
        description="Personalised wardrobe assistance for the moments that matter in your professional life. Talk to a SUKO stylist directly on WhatsApp."
      />

      {/* ========================================================================= */}
      {/* 1. HERO — FULL BACKGROUND IMAGE (Mobile 640px Dedicated Crop + Editorial Overlay) */}
      {/* ========================================================================= */}
      <section className="relative w-full h-[640px] sm:h-[calc(100vh-80px)] lg:h-[calc(100vh-86px)] min-h-[620px] max-h-[920px] overflow-hidden bg-[#121215]">
        {/* Background Editorial Image (Client & Stylist Visible — Model Upper-Right on Mobile) */}
        <img
          src="/personal_styling.webp"
          alt="SUKO Personal Styling Experience"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onError={(e) => {
            if (e.currentTarget.src !== "/personal_styling.png") {
              e.currentTarget.src = "/personal_styling.png";
            }
          }}
          className="absolute inset-0 w-full h-full object-cover object-[78%_2%] sm:object-[75%_4%] lg:object-[80%_4%]"
        />

        {/* Dark Editorial Gradient (Desktop 90deg Left Shade / Mobile 180deg Bottom-Heavy Gradient) */}
        <div 
          className="absolute inset-0 hidden sm:block pointer-events-none"
          style={{
            background: "linear-gradient(90deg, rgba(14,14,17,0.92) 0%, rgba(14,14,17,0.80) 35%, rgba(14,14,17,0.40) 60%, rgba(14,14,17,0.15) 100%)"
          }}
        />
        <div 
          className="absolute inset-0 sm:hidden pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(14,14,17,0.08) 0%, rgba(14,14,17,0.22) 28%, rgba(14,14,17,0.70) 52%, rgba(14,14,17,0.92) 76%, rgba(14,14,17,0.98) 100%)"
          }}
        />

        {/* Hero Content (Bottom-Left with 20px padding & 44px Bottom Offset) */}
        <div className="relative h-full max-w-[1500px] mx-auto px-5 sm:px-8 lg:px-14 flex flex-col justify-end sm:justify-center pb-11 sm:pb-0 z-10">
          <div className="max-w-xl lg:max-w-2xl">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="w-4 h-[1.5px] bg-[#C2922E]" />
              <span className="text-[11px] uppercase tracking-[0.35em] text-[#C2922E] font-medium font-body">
                PERSONAL STYLING
              </span>
            </div>

            <h1 className="font-quiche text-[38px] min-[390px]:text-[42px] sm:text-5xl lg:text-[54px] xl:text-[60px] font-light tracking-tight text-white leading-[1.08] mb-3 sm:mb-4">
              A Wardrobe,<br />
              <span className="italic font-normal">Considered Around You.</span>
            </h1>

            <p className="text-white/90 text-[15px] sm:text-[15.5px] lg:text-[16.5px] font-light leading-relaxed mb-6 sm:mb-8 max-w-lg">
              Personalised wardrobe assistance for the moments that matter in your professional life.
            </p>

            {/* Direct 1-Tap WhatsApp CTA: 44px+ touch target */}
            <div>
              <a
                href={DEFAULT_WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center min-h-[44px] pt-1 pb-1.5 select-none focus-visible:outline-none cursor-pointer"
              >
                <span className="text-[12px] uppercase tracking-[0.24em] font-medium text-white block">
                  TALK TO A SUKO STYLIST
                </span>
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/40" />
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
              </a>
            </div>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 2. SECTION 2 — OCCASION EDIT (What Are You Dressing For?) */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-10 sm:py-14 lg:py-16 bg-[#FAF8F5] border-b border-[#E8E4DC]">
        <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-10 lg:gap-12 xl:gap-16 items-center">
            
            {/* Top on Mobile (380-420px Portrait Crop) / Left on Desktop (~42% Col Span 5) */}
            <div className="lg:col-span-5 order-1 w-full">
              <div className="w-full h-[380px] min-[390px]:h-[410px] sm:h-[440px] lg:h-[560px] xl:h-[600px] overflow-hidden bg-[#18181D] border border-[#E8E4DC] shadow-md relative rounded-none">
                {ASSISTED_OCCASIONS.map((item, idx) => (
                  <img
                    key={item.id}
                    src={item.image}
                    alt={item.title}
                    className={`absolute inset-0 w-full h-full object-cover object-[50%_15%] transition-opacity duration-500 ease-in-out ${
                      activeMomentIndex === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  />
                ))}
                
                {/* Subtle bottom gradient pill with active moment label */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-black/85 via-black/35 to-transparent z-20 pointer-events-none flex items-center justify-between">
                  <div>
                    <span className="text-[9px] sm:text-[9.5px] uppercase tracking-[0.25em] text-[#E8C581] font-medium block">
                      SUKO CURATION
                    </span>
                    <span className="text-white text-xs sm:text-[13px] font-light tracking-wide">
                      {ASSISTED_OCCASIONS[activeMomentIndex]?.tagline}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-white/80">
                    0{activeMomentIndex + 1} / 04
                  </span>
                </div>
              </div>
            </div>

            {/* Below Image on Mobile / Right on Desktop (~58% Col Span 7) */}
            <div className="lg:col-span-7 order-2 flex flex-col justify-center">
              
              {/* Header */}
              <div className="mb-5 sm:mb-7 lg:mb-8 text-left">
                <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.28em] text-[#8C887B] font-medium block mb-2 sm:mb-2.5">
                  SUKO WARDROBE CONCIERGE
                </span>
                <h2 className="font-quiche text-[34px] min-[390px]:text-[36px] sm:text-4xl lg:text-[40px] xl:text-[46px] font-light text-[#121215] leading-[1.08] sm:leading-[1.12] mb-2 sm:mb-2.5">
                  What Are You <span className="italic font-normal">Dressing For?</span>
                </h2>
                <p className="text-[14px] sm:text-[14.5px] text-[#6B6B75] font-light leading-relaxed">
                  Choose the moment. We’ll curate the rest.
                </p>
              </div>

              {/* 4 Stacked Editorial Rows (86-96px Height, Clear Typography & Spacing) */}
              <div className="divide-y divide-[#E8E4DC] border-y border-[#E8E4DC]">
                {ASSISTED_OCCASIONS.map((item, idx) => {
                  const isActive = activeMomentIndex === idx;
                  return (
                    <a
                      key={item.id}
                      href={getWhatsAppLink(item.whatsappText)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseEnter={() => setActiveMomentIndex(idx)}
                      onFocus={() => setActiveMomentIndex(idx)}
                      className={`group py-4.5 sm:py-5 lg:py-5.5 px-1 sm:px-3 flex items-center justify-between transition-all duration-300 cursor-pointer select-none min-h-[86px] sm:min-h-[92px] lg:min-h-[96px] text-left ${
                        isActive ? 'lg:bg-[#EDE7DC]/35 lg:pl-4' : 'hover:bg-[#EDE7DC]/20 hover:pl-3.5'
                      }`}
                    >
                      <div className="pr-4 flex-1 min-w-0">
                        <div className="flex items-baseline gap-2.5 mb-1">
                          <span className="text-[11px] font-mono tracking-widest text-[#C2922E] font-medium shrink-0">
                            0{idx + 1}
                          </span>
                          <h3 className={`font-quiche text-[15.5px] min-[390px]:text-[16.5px] sm:text-[18px] lg:text-[19px] uppercase tracking-[0.06em] font-medium transition-colors ${
                            isActive ? 'lg:text-[#C2922E]' : 'text-[#121215] group-hover:text-[#C2922E]'
                          }`}>
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-[13px] sm:text-[13.5px] text-[#6B6B75] font-light leading-snug pl-[26px]">
                          {item.description}
                        </p>
                      </div>
                      <span className={`transition-all duration-300 text-lg sm:text-xl shrink-0 ${
                        isActive ? 'lg:text-[#C2922E] lg:translate-x-1.5 text-[#121215]/40' : 'text-[#121215]/40 group-hover:text-[#C2922E] group-hover:translate-x-1.5'
                      }`}>
                        &rarr;
                      </span>
                    </a>
                  );
                })}
              </div>

              {/* Prominent Fallback CTA with ~20px Vertical Padding and Clear Divider */}
              <div className="pt-5 sm:pt-6 text-left">
                <a
                  href={DEFAULT_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center min-h-[48px] py-2.5 select-none focus-visible:outline-none cursor-pointer"
                >
                  <span className="text-[12px] sm:text-[12.5px] uppercase tracking-[0.24em] font-medium text-[#121215] group-hover:text-[#C2922E] transition-colors block">
                    NOT SURE? TALK TO A SUKO STYLIST &rarr;
                  </span>
                  <span className="absolute bottom-1 left-0 w-full h-[1px] bg-[#121215]/30" />
                  <span className="absolute bottom-1 left-0 w-full h-[1.5px] bg-[#C2922E] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                </a>
              </div>

            </div>

          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 3. SECTION 3 — HOW IT WORKS (From Conversation to Your SUKO Edit) */}
      {/* ========================================================================= */}
      <section className="py-8 sm:py-10 lg:py-11 bg-[#F5F2EB] border-y border-[#E8E4DC]">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 xl:gap-16 items-start">
            
            {/* Left Header (Refined Proportions) */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.28em] text-[#C2922E] font-medium block mb-2 sm:mb-2.5">
                YOUR PRIVATE SUKO EDIT
              </span>
              <h2 className="font-quiche text-2xl sm:text-3xl lg:text-[36px] xl:text-[40px] font-light text-[#121215] leading-[1.12] mb-2.5 sm:mb-3">
                From Conversation<br />
                <span className="italic font-normal">to Your SUKO Edit.</span>
              </h2>
              <p className="text-[13.5px] sm:text-[14.5px] text-[#555562] font-light leading-relaxed mb-6 sm:mb-7 max-w-md">
                Connect with a SUKO stylist on WhatsApp for personalised wardrobe guidance.
              </p>

              <div className="hidden lg:block">
                <a
                  href={DEFAULT_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center min-h-[44px] pt-1 pb-1.5 select-none focus-visible:outline-none cursor-pointer"
                >
                  <span className="text-[11.5px] uppercase tracking-[0.24em] font-medium text-[#121215] block group-hover:text-[#C2922E] transition-colors">
                    TALK TO A SUKO STYLIST
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30" />
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#C2922E] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                </a>
              </div>
            </div>

            {/* Right 3 Clean Process Steps (Consistent Vertical Rhythm) */}
            <div className="lg:col-span-7 divide-y divide-[#E8E4DC] border-y border-[#E8E4DC] lg:pl-4">
              {HOW_IT_WORKS_STEPS.map((step) => (
                <div key={step.num} className="py-3.5 sm:py-4 lg:py-4">
                  <span className="text-[10.5px] sm:text-[11px] font-mono tracking-widest text-[#C2922E] block mb-0.5">
                    {step.num}
                  </span>
                  <h3 className="font-quiche text-[18.5px] sm:text-[20.5px] lg:text-[22px] font-medium text-[#121215] mb-1 tracking-wide">
                    {step.title}
                  </h3>
                  <p className="text-[13.5px] sm:text-[14.5px] text-[#555562] font-light leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}

              <div className="pt-4 pb-2 lg:hidden border-t-0">
                <a
                  href={DEFAULT_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center min-h-[44px] pt-1 pb-1.5 select-none focus-visible:outline-none cursor-pointer"
                >
                  <span className="text-[11px] uppercase tracking-[0.22em] font-medium text-[#121215] block group-hover:text-[#C2922E] transition-colors">
                    TALK TO A SUKO STYLIST
                  </span>
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#121215]/30" />
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#C2922E] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>





      {/* ========================================================================= */}
      {/* 4. SECTION 4 — DISCOVER THE SUKO EDITS (Shop By Moment Ecosystem Bridge) */}
      {/* ========================================================================= */}
      <section className="py-10 sm:py-12 lg:py-14 bg-[#121215] text-white overflow-hidden">
        <div className="max-w-[1500px] mx-auto px-5 sm:px-8 lg:px-14">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <span className="text-[9.5px] sm:text-[10px] uppercase tracking-[0.3em] text-[#C2922E] font-medium block mb-2">
                DISCOVER THE SUKO EDITS
              </span>
              <h2 className="font-quiche text-[23px] sm:text-[27px] lg:text-[33px] xl:text-[36px] font-light text-white leading-[1.18]">
                Curated for the <span className="italic font-normal">Moments That Matter.</span>
              </h2>
            </div>

            <div className="sm:pb-0.5">
              <Link
                to="/shop-by-moment"
                className="group relative inline-flex items-center min-h-[40px] pt-1 pb-1 select-none focus-visible:outline-none cursor-pointer"
              >
                <span className="text-[11px] sm:text-[11.5px] uppercase tracking-[0.24em] font-medium text-white block group-hover:text-[#C2922E] transition-colors">
                  EXPLORE SHOP BY MOMENT &rarr;
                </span>
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/30" />
                <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#C2922E] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
              </Link>
            </div>
          </div>

          {/* Horizontal Swipeable Cards on Mobile (80vw) / 4-Col on Desktop (24–28px Gap) */}
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-7 overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 pb-1">
            {MOMENTS_LINKS.map((m) => (
              <Link
                key={m.id}
                to={m.link}
                className="w-[80vw] sm:w-auto shrink-0 snap-center group block relative overflow-hidden bg-[#1D1D24] border border-white/10"
              >
                <div className="aspect-[3/3.8] w-full overflow-hidden relative">
                  <img
                    src={m.image}
                    alt={m.name}
                    loading="lazy"
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-103"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                </div>
                
                <div className="p-4 sm:p-5 absolute inset-x-0 bottom-0 z-10 flex items-center justify-between">
                  <div>
                    <h3 className="font-quiche text-[17px] sm:text-[18px] lg:text-[19px] font-light text-white group-hover:text-[#C2922E] transition-colors mb-0.5">
                      {m.name}
                    </h3>
                    <p className="text-[11.5px] text-white/70 font-light italic font-body">
                      {m.tagline}
                    </p>
                  </div>
                  <span className="text-white/60 text-base sm:text-lg group-hover:text-[#C2922E] group-hover:translate-x-1 transition-all duration-300">
                    &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 5. SECTION 5 — THE SUKO APPROACH (3 Concierge Benefits) */}
      {/* ========================================================================= */}
      <section className="pt-7 sm:pt-8 lg:pt-9 pb-6 sm:pb-7 lg:pb-7 bg-[#FAF8F5]">
        <div className="max-w-[1300px] mx-auto px-5 sm:px-8 lg:px-14">
          
          <div className="text-left sm:text-center max-w-xl sm:mx-auto mb-4 sm:mb-6">
            <span className="text-[9.5px] sm:text-[10px] uppercase tracking-[0.28em] text-[#8C887B] font-medium block mb-1.5 sm:mb-2">
              THE SUKO APPROACH
            </span>
            <h2 className="font-quiche text-2xl sm:text-3xl lg:text-[34px] xl:text-[38px] font-light text-[#121215] mb-1.5 sm:mb-2">
              The Details<br />
              <span className="italic font-normal">That Guide Your Edit.</span>
            </h2>
          </div>

          <div className="divide-y divide-[#E8E4DC] border-y border-[#E8E4DC]">
            {DETAILS_POINTS.map((item, idx) => (
              <div
                key={idx}
                className="py-3 sm:py-3.5 lg:py-4 grid grid-cols-1 md:grid-cols-12 gap-1.5 md:gap-8 items-baseline"
              >
                <div className="md:col-span-5 flex items-center gap-3">
                  <span className="text-[10.5px] font-mono text-[#C2922E] tracking-normal">
                    0{idx + 1}
                  </span>
                  <h3 className="font-quiche text-base sm:text-[17.5px] lg:text-[18.5px] font-medium text-[#121215] tracking-normal">
                    {item.title}
                  </h3>
                </div>
                <div className="md:col-span-7">
                  <p className="text-[13px] sm:text-[14px] text-[#2B2B33] font-normal leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 6. SECTION 6 — FINAL WHATSAPP CTA (Light Ivory, Refined Proportions) */}
      {/* ========================================================================= */}
      <section className="py-8 sm:py-9 lg:py-10 bg-[#F5F2EB] border-t border-[#E8E4DC]">
        <div className="max-w-[1000px] mx-auto px-5 sm:px-8 text-center">
          
          <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.3em] text-[#C2922E] font-medium block mb-2 sm:mb-2.5">
            PERSONAL STYLING
          </span>

          <h2 className="font-quiche text-[28px] sm:text-4xl lg:text-[44px] font-light text-[#121215] leading-tight mb-2.5 sm:mb-3">
            Ready to Build Your<br />
            <span className="italic font-normal">Professional Wardrobe?</span>
          </h2>

          <p className="text-[13.5px] sm:text-[14.5px] text-[#555562] font-light leading-relaxed max-w-lg mx-auto mb-5 sm:mb-6">
            Connect with a SUKO stylist on WhatsApp for personalised recommendations and fit guidance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <a
              href={DEFAULT_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="group w-full sm:w-auto h-[56px] px-8 bg-[#121215] text-white hover:bg-[#C2922E] text-xs uppercase tracking-[0.22em] font-medium transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2.5"
            >
              <MessageCircle size={15} className="text-[#C2922E] group-hover:text-white transition-colors" />
              <span className="text-white">TALK TO A SUKO STYLIST</span>
            </a>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER / VALUE STRIP */}
      {/* ========================================================================= */}
      <ServiceStrip />
    </div>
  );
};

export default WardrobeConcierge;
