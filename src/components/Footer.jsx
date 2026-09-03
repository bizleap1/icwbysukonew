import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Instagram, Linkedin, MessageCircle, Plus, Minus, Sparkles } from "lucide-react";
import { MOMENTS, WHATSAPP_LINK } from "../data/products";

export const Footer = () => {
  const [openMobileAccordion, setOpenMobileAccordion] = useState(null);

  const toggleAccordion = (name) => {
    setOpenMobileAccordion(openMobileAccordion === name ? null : name);
  };

  return (
    <footer data-testid="site-footer" className="relative bg-[#0E0E11] text-[#E5E5E0] font-body border-t border-white/10 overflow-hidden">
      
      {/* 1. Newsletter Row */}
      <div className="border-b border-white/10 bg-[#121215]">
        <div className="w-full mx-auto px-6 sm:px-10 lg:px-12 xl:px-14 py-8 sm:py-9 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl text-center sm:text-left">
            <span className="text-[9.5px] uppercase tracking-[0.32em] text-[#C2922E] font-medium block mb-1">
              THE SUKO LETTER
            </span>
            <h3 className="font-quiche text-2xl sm:text-3xl lg:text-[32px] font-light text-white tracking-tight">
              Stay in the know.
            </h3>
            <p className="text-white/60 text-xs sm:text-[13px] mt-1 font-light leading-relaxed">
              New arrivals, private edits and styling notes from SUKO.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thank you for joining The SUKO Letter.");
            }}
            className="flex items-center w-full max-w-[440px] mx-auto sm:mx-0 border-b border-white/25 focus-within:border-[#C2922E] pb-1.5 transition-colors group"
          >
            <input
              data-testid="newsletter-email-input"
              type="email"
              required
              placeholder="Enter your email address"
              className="bg-transparent flex-1 text-xs sm:text-sm font-light placeholder:text-white/35 text-white outline-none pr-3"
            />
            <button
              data-testid="newsletter-subscribe-btn"
              type="submit"
              className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-white/90 group-hover:text-[#C2922E] flex items-center gap-1.5 transition-colors shrink-0"
            >
              JOIN <ArrowRight size={12} />
            </button>
          </form>
        </div>
      </div>

      {/* 2. Main Directory */}
      <div className="w-full mx-auto px-6 sm:px-10 lg:px-12 xl:px-14 pt-8 pb-6">
        
        {/* Mobile Accordion View (< md) */}
        <div className="md:hidden divide-y divide-white/10">
          
          {/* Mobile Accordion 1: SHOP BY MOMENT */}
          <div className="py-3.5">
            <button
              type="button"
              onClick={() => toggleAccordion("moments")}
              className="w-full flex items-center justify-between text-[11px] uppercase tracking-[0.26em] font-medium text-white text-left"
            >
              <span>SHOP BY MOMENT</span>
              {openMobileAccordion === "moments" ? <Minus size={14} className="text-[#C2922E]" /> : <Plus size={14} className="text-white/60" />}
            </button>
            {openMobileAccordion === "moments" && (
              <ul className="mt-3 space-y-2 text-[13px] text-[#A8A8B4] font-light pl-1">
                {MOMENTS.map((m) => (
                  <li key={m.id}>
                    <Link to={`/shop-by-moment?moment=${m.id}`} className="hover:text-white block py-0.5">
                      {m.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Mobile Accordion 2: SERVICES & CONCIERGE */}
          <div className="py-3.5">
            <button
              type="button"
              onClick={() => toggleAccordion("services")}
              className="w-full flex items-center justify-between text-[11px] uppercase tracking-[0.26em] font-medium text-white text-left"
            >
              <span>PERSONAL STYLING</span>
              {openMobileAccordion === "services" ? <Minus size={14} className="text-[#C2922E]" /> : <Plus size={14} className="text-white/60" />}
            </button>
            {openMobileAccordion === "services" && (
              <ul className="mt-3 space-y-2 text-[13px] text-[#A8A8B4] font-light pl-1">
                <li><Link to="/wardrobe-concierge" className="hover:text-white block py-0.5">Talk to a SUKO Stylist</Link></li>
                <li><Link to="/wardrobe-concierge" className="hover:text-white block py-0.5">Wardrobe Concierge</Link></li>
                <li><Link to="/size-guide" className="hover:text-white block py-0.5">Size Guide &amp; Fit</Link></li>
                <li>
                  <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1.5 text-[#C2922E] py-0.5">
                    <MessageCircle size={13} /> WhatsApp Styling Support
                  </a>
                </li>
              </ul>
            )}
          </div>

          {/* Mobile Accordion 3: THE ATELIER */}
          <div className="py-3.5">
            <button
              type="button"
              onClick={() => toggleAccordion("atelier")}
              className="w-full flex items-center justify-between text-[11px] uppercase tracking-[0.26em] font-medium text-white text-left"
            >
              <span>THE HOUSE</span>
              {openMobileAccordion === "atelier" ? <Minus size={14} className="text-[#C2922E]" /> : <Plus size={14} className="text-white/60" />}
            </button>
            {openMobileAccordion === "atelier" && (
              <ul className="mt-3 space-y-2 text-[13px] text-[#A8A8B4] font-light pl-1">
                <li><Link to="/about" className="hover:text-white block py-0.5">About SUKO</Link></li>
                <li><Link to="/contact" className="hover:text-white block py-0.5">Customer Concierge</Link></li>
                <li><Link to="/shipping" className="hover:text-white block py-0.5">Shipping &amp; Delivery</Link></li>
                <li><Link to="/returns" className="hover:text-white block py-0.5">Returns &amp; Exchanges</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-white block py-0.5">Privacy Policy</Link></li>
                <li><Link to="/terms-conditions" className="hover:text-white block py-0.5">Terms of Service</Link></li>
              </ul>
            )}
          </div>

          {/* Mobile Accordion 4: CONNECT */}
          <div className="py-3.5">
            <button
              type="button"
              onClick={() => toggleAccordion("connect")}
              className="w-full flex items-center justify-between text-[11px] uppercase tracking-[0.26em] font-medium text-white text-left"
            >
              <span>CONNECT</span>
              {openMobileAccordion === "connect" ? <Minus size={14} className="text-[#C2922E]" /> : <Plus size={14} className="text-white/60" />}
            </button>
            {openMobileAccordion === "connect" && (
              <div className="mt-3 flex items-center gap-4 text-white/75 pl-1 py-1">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#C2922E] p-1" aria-label="Instagram">
                  <Instagram size={17} strokeWidth={1.5} />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#C2922E] p-1" aria-label="LinkedIn">
                  <Linkedin size={17} strokeWidth={1.5} />
                </a>
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">@SUKOOFFICIAL</span>
              </div>
            )}
          </div>

        </div>

        {/* Desktop 4-Column Directory */}
        <div className="hidden md:grid grid-cols-4 gap-8 lg:gap-14 max-w-[1600px]">
          
          {/* Column 1: SHOP BY MOMENT */}
          <div>
            <h4 className="font-body text-[10.5px] sm:text-[11px] uppercase tracking-[0.26em] font-semibold text-white mb-3.5">
              SHOP BY MOMENT
            </h4>
            <ul className="space-y-2.5 text-[13px] sm:text-[13.5px] text-[#A8A8B4] font-normal tracking-normal">
              {MOMENTS.map((m) => (
                <li key={m.id}>
                  <Link to={`/shop-by-moment?moment=${m.id}`} className="hover:text-white transition-colors">
                    {m.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: PERSONAL STYLING */}
          <div>
            <h4 className="font-body text-[10.5px] sm:text-[11px] uppercase tracking-[0.26em] font-semibold text-white mb-3.5">
              PERSONAL STYLING
            </h4>
            <ul className="space-y-2.5 text-[13px] sm:text-[13.5px] text-[#A8A8B4] font-normal tracking-normal">
              <li><Link to="/wardrobe-concierge" className="hover:text-white transition-colors">Talk to a SUKO Stylist</Link></li>
              <li><Link to="/wardrobe-concierge" className="hover:text-white transition-colors">Wardrobe Concierge</Link></li>
              <li><Link to="/size-guide" className="hover:text-white transition-colors">Size Guide &amp; Fit</Link></li>
              <li>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-[#C2922E] pt-0.5"
                >
                  <MessageCircle size={13} className="text-[#C2922E]" /> WhatsApp Styling Support
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: THE HOUSE */}
          <div>
            <h4 className="font-body text-[10.5px] sm:text-[11px] uppercase tracking-[0.26em] font-semibold text-white mb-3.5">
              THE HOUSE
            </h4>
            <ul className="space-y-2.5 text-[13px] sm:text-[13.5px] text-[#A8A8B4] font-normal tracking-normal">
              <li><Link to="/about" className="hover:text-white transition-colors">About SUKO</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Customer Care</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping &amp; Delivery</Link></li>
              <li><Link to="/returns" className="hover:text-white transition-colors">Returns &amp; Exchanges</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Column 4: CONNECT & ATELIER */}
          <div>
            <h4 className="font-body text-[10.5px] sm:text-[11px] uppercase tracking-[0.26em] font-semibold text-white mb-3.5">
              CONNECT
            </h4>
            <p className="text-xs text-white/60 font-light mb-3">
              Modern tailoring. Indian sensibility. Designed for women who lead.
            </p>
            <div className="flex items-center gap-3.5 text-white/75 pt-0.5">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#C2922E] transition-colors p-1 -ml-1"
                aria-label="Instagram"
              >
                <Instagram size={17} strokeWidth={1.5} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#C2922E] transition-colors p-1"
                aria-label="LinkedIn"
              >
                <Linkedin size={17} strokeWidth={1.5} />
              </a>
              <span className="text-[10.5px] uppercase tracking-[0.18em] text-white/60">@SUKOOFFICIAL</span>
            </div>
          </div>

        </div>

        {/* 3. Bottom Signature */}
        <div className="mt-8 pt-5 text-center border-t border-white/10">
          <Link to="/" className="inline-block group">
            <img
              src="/logo-light.png"
              alt="SUKO — The Indian Corporate Wear"
              className="w-[96px] sm:w-[106px] h-auto object-contain mx-auto opacity-90 group-hover:opacity-100 transition-opacity duration-300"
            />
          </Link>
          <div className="mt-2.5 text-[9.5px] uppercase tracking-[0.24em] text-white/40 font-body pb-1">
            &copy; {new Date().getFullYear()} SUKO &middot; THE INDIAN CORPORATE WEAR. ALL RIGHTS RESERVED.
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
