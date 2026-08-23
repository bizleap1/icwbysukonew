import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Instagram, Linkedin, MessageCircle, Plus, Minus } from "lucide-react";

const Footer = () => {
  const [openMobileAccordion, setOpenMobileAccordion] = useState(null);

  const toggleAccordion = (name) => {
    setOpenMobileAccordion(openMobileAccordion === name ? null : name);
  };

  return (
    <footer data-testid="site-footer" className="relative bg-[#0E0E10] text-[#E5E5E0] font-body border-t border-white/10 overflow-hidden">
      
      {/* 1. Newsletter Row (~140-155px height) */}
      <div className="border-b border-white/10 bg-[#121214]">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-7 sm:py-8 lg:py-9 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl text-center sm:text-left">
            <span className="text-[9.5px] uppercase tracking-[0.32em] text-[#C2922E] font-medium block mb-1">
              THE ICW WORLD
            </span>
            <h3 className="font-quiche text-2xl sm:text-3xl lg:text-[32px] font-light text-white tracking-tight">
              Stay in the know.
            </h3>
            <p className="text-white/60 text-xs sm:text-[13px] mt-1 font-light leading-relaxed">
              New collections, private previews and stories from ICW.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thank you for joining the ICW Community.");
            }}
            className="flex items-center w-full max-w-[420px] lg:max-w-[450px] mx-auto sm:mx-0 border-b border-white/25 focus-within:border-[#C2922E] pb-1.5 transition-colors group"
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

      {/* 2. Main Directory (Mobile Accordions / Desktop 4-Col Grid) */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-6 sm:pt-8 pb-5 sm:pb-6">
        
        {/* Mobile Accordion View (< md) */}
        <div className="md:hidden divide-y divide-white/10">
          
          {/* Mobile Accordion 1: SHOP */}
          <div className="py-3.5">
            <button
              type="button"
              onClick={() => toggleAccordion("shop")}
              className="w-full flex items-center justify-between text-[11px] uppercase tracking-[0.26em] font-medium text-white text-left"
            >
              <span>SHOP</span>
              {openMobileAccordion === "shop" ? <Minus size={14} className="text-[#C2922E]" /> : <Plus size={14} className="text-white/60" />}
            </button>
            {openMobileAccordion === "shop" && (
              <ul className="mt-3 space-y-2 text-[13px] text-[#A8A8B4] font-light pl-1">
                <li><Link to="/women" className="hover:text-white block py-0.5">Women</Link></li>
                <li><Link to="/new-in" className="hover:text-white block py-0.5">New In</Link></li>
                <li><Link to="/collection" className="hover:text-white block py-0.5">Collections</Link></li>
              </ul>
            )}
          </div>

          {/* Mobile Accordion 2: CUSTOMER CARE */}
          <div className="py-3.5">
            <button
              type="button"
              onClick={() => toggleAccordion("care")}
              className="w-full flex items-center justify-between text-[11px] uppercase tracking-[0.26em] font-medium text-white text-left"
            >
              <span>CUSTOMER CARE</span>
              {openMobileAccordion === "care" ? <Minus size={14} className="text-[#C2922E]" /> : <Plus size={14} className="text-white/60" />}
            </button>
            {openMobileAccordion === "care" && (
              <ul className="mt-3 space-y-2 text-[13px] text-[#A8A8B4] font-light pl-1">
                <li><Link to="/contact" className="hover:text-white block py-0.5">Shipping</Link></li>
                <li><Link to="/contact" className="hover:text-white block py-0.5">Returns &amp; Exchanges</Link></li>
                <li><Link to="/contact" className="hover:text-white block py-0.5">Contact</Link></li>
                <li><Link to="/contact" className="hover:text-white block py-0.5">Size Guide</Link></li>
                <li>
                  <a href="https://wa.me/917666168147" target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1.5 text-[#C2922E] py-0.5">
                    <MessageCircle size={13} /> Concierge (+91 76661 68147)
                  </a>
                </li>
              </ul>
            )}
          </div>

          {/* Mobile Accordion 3: CONNECT */}
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
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/60">@ICWBYSUKO</span>
              </div>
            )}
          </div>

        </div>

        {/* Desktop 3-Column Directory (>= md) */}
        <div className="hidden md:grid grid-cols-3 gap-8 lg:gap-16 max-w-[1500px]">
          
          {/* Column 1: SHOP */}
          <div>
            <h4 className="font-body text-[10.5px] sm:text-[11px] uppercase tracking-[0.26em] font-semibold text-white mb-3.5">
              SHOP
            </h4>
            <ul className="space-y-2.5 text-[13px] sm:text-[13.5px] text-[#A8A8B4] font-normal tracking-normal">
              <li><Link to="/women" className="hover:text-white transition-colors">Women</Link></li>
              <li><Link to="/new-in" className="hover:text-white transition-colors">New In</Link></li>
              <li><Link to="/collection" className="hover:text-white transition-colors">Collections</Link></li>
            </ul>
          </div>

          {/* Column 2: CUSTOMER CARE */}
          <div>
            <h4 className="font-body text-[10.5px] sm:text-[11px] uppercase tracking-[0.26em] font-semibold text-white mb-3.5">
              CUSTOMER CARE
            </h4>
            <ul className="space-y-2.5 text-[13px] sm:text-[13.5px] text-[#A8A8B4] font-normal tracking-normal">
              <li><Link to="/contact" className="hover:text-white transition-colors">Shipping</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Returns &amp; Exchanges</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Size Guide</Link></li>
              <li>
                <a
                  href="https://wa.me/917666168147"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5 text-[#C2922E] pt-0.5"
                >
                  <MessageCircle size={13} className="text-[#C2922E]" /> Concierge (+91 76661 68147)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: CONNECT */}
          <div>
            <h4 className="font-body text-[10.5px] sm:text-[11px] uppercase tracking-[0.26em] font-semibold text-white mb-3.5">
              CONNECT
            </h4>
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
              <span className="text-[10.5px] uppercase tracking-[0.18em] text-white/60">@ICWBYSUKO</span>
            </div>
          </div>

        </div>

        {/* 3. Bottom Compact Logo & Copyright (~120-130px height) */}
        <div className="mt-6 sm:mt-7 pt-4 sm:pt-5 text-center border-t border-white/10">
          <Link to="/" className="inline-block group">
            <img
              src="/logo-light.png"
              alt="ICW BY SUKO"
              className="w-[96px] sm:w-[106px] h-auto object-contain mx-auto opacity-90 group-hover:opacity-100 transition-opacity duration-300"
            />
          </Link>
          <div className="mt-2.5 sm:mt-3 text-[9.5px] uppercase tracking-[0.24em] text-white/40 font-body pb-1">
            &copy; {new Date().getFullYear()} ICW BY SUKO. ALL RIGHTS RESERVED.
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
