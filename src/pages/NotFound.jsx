import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Compass } from "lucide-react";
import SEO from "../components/SEO";

const NotFound = () => {
  return (
    <div 
      data-testid="not-found-page"
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white min-h-[85vh] flex items-center justify-center pt-28 sm:pt-36 pb-20 px-5 sm:px-6"
    >
      <SEO 
        title="Page Not Found"
        description="The requested page could not be found. Explore ICW by Suko ultra-luxury corporate tailoring."
      />

      <div className="max-w-xl w-full mx-auto text-center">
        {/* Luxury Gold Eyebrow */}
        <div className="flex items-center justify-center gap-2.5 mb-3.5 sm:mb-4">
          <span className="w-4 h-[1px] bg-[#C2922E]" />
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-[#C2922E] font-medium font-body">
            404 &mdash; SILHOUETTE NOT FOUND
          </span>
          <span className="w-4 h-[1px] bg-[#C2922E]" />
        </div>

        {/* Headline */}
        <h1 className="font-quiche text-4xl sm:text-6xl lg:text-7xl tracking-tight text-[#111113] font-light leading-[1.08] mb-4 sm:mb-5">
          Lost in the <br />
          <span className="italic font-normal text-[#111113]/85">Atelier.</span>
        </h1>

        {/* Subcopy */}
        <p className="text-[#555560] font-body text-xs sm:text-[14px] leading-relaxed max-w-md mx-auto mb-8 sm:mb-10 font-light">
          The garment or page you are looking for has been relocated, archived, or does not exist in our current collection.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Link
            to="/new-in"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-[#111113] text-white text-[11px] uppercase tracking-[0.24em] font-medium hover:bg-[#C2922E] transition-all duration-300"
          >
            <span>EXPLORE NEW IN</span>
            <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <Link
            to="/collection"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 border border-[#111113] text-[#111113] text-[11px] uppercase tracking-[0.24em] font-medium hover:border-[#C2922E] hover:text-[#C2922E] transition-all duration-300"
          >
            <span>VIEW ALL COLLECTIONS</span>
            <Compass size={13} className="transition-transform duration-300 group-hover:rotate-45" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
