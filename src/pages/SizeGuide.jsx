import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Ruler, MessageCircle } from "lucide-react";
import SEO from "../components/SEO";
import ServiceStrip from "../components/home/ServiceStrip";

const SizeGuide = () => {
  return (
    <div 
      data-testid="size-guide-page" 
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white min-h-screen pt-28 sm:pt-36 lg:pt-40 transition-colors duration-300"
    >
      <SEO 
        title="Size Guide &amp; Fit Guidance"
        description="Measurement guidelines and fit guidance for ICW by Suko luxury tailoring."
      />

      {/* Header */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 mb-12 sm:mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex items-center justify-center gap-2.5 mb-2.5 sm:mb-3.5">
            <span className="w-4 h-[1px] bg-[#C2922E]" />
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] text-[#C2922E] font-medium font-body">
              FIT GUIDANCE
            </span>
            <span className="w-4 h-[1px] bg-[#C2922E]" />
          </div>

          <h1 className="font-quiche text-3xl sm:text-5xl lg:text-6xl font-light text-[#111113] tracking-tight leading-[1.08] mb-3 sm:mb-4">
            Size Guide &amp; Fit
          </h1>

          <p className="text-xs sm:text-[14px] text-[#555560] font-light leading-relaxed max-w-lg mx-auto">
            Measurement instructions and guidance for selecting tailored silhouettes.
          </p>
        </motion.div>
      </div>

      {/* Content Container */}
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
        
        {/* Status Box */}
        <div className="bg-[#F3EFE6] border border-[#E8E4DC] p-6 sm:p-8 mb-10 text-center">
          <div className="flex items-center justify-center gap-2 text-[#C2922E] mb-2">
            <Ruler size={18} />
            <h2 className="font-quiche text-xl sm:text-2xl text-[#111113] font-normal">
              Sizing Specifications
            </h2>
          </div>
          <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed max-w-md mx-auto mb-4">
            Detailed numerical garment measurements across sizes XS through XL are currently being standardized for each silhouette. Sizing details to be confirmed.
          </p>
          <p className="text-xs text-[#75757A] font-light">
            For exact piece measurements on specific jackets, vests, skirts, or trousers, please consult our Concierge directly.
          </p>
        </div>

        {/* How to Measure Guidelines */}
        <div className="space-y-6 mb-12">
          <h3 className="font-quiche text-xl sm:text-2xl text-[#111113] font-light">
            General Measurement Guidelines
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-[#F3EFE6] border border-[#E8E4DC] p-5">
              <span className="text-[10px] uppercase tracking-wider text-[#C2922E] font-medium block mb-1">
                01 &middot; BUST
              </span>
              <h4 className="text-xs font-semibold text-[#111113] mb-1.5">Across the Apex</h4>
              <p className="text-xs text-[#555560] font-light leading-relaxed">
                Measure around the fullest part of your chest with the tape held level under the arms.
              </p>
            </div>

            <div className="bg-[#F3EFE6] border border-[#E8E4DC] p-5">
              <span className="text-[10px] uppercase tracking-wider text-[#C2922E] font-medium block mb-1">
                02 &middot; WAIST
              </span>
              <h4 className="text-xs font-semibold text-[#111113] mb-1.5">Natural Waist</h4>
              <p className="text-xs text-[#555560] font-light leading-relaxed">
                Measure around the natural indentation of your waistline above the hip bone.
              </p>
            </div>

            <div className="bg-[#F3EFE6] border border-[#E8E4DC] p-5">
              <span className="text-[10px] uppercase tracking-wider text-[#C2922E] font-medium block mb-1">
                03 &middot; HIP
              </span>
              <h4 className="text-xs font-semibold text-[#111113] mb-1.5">Fullest Contour</h4>
              <p className="text-xs text-[#555560] font-light leading-relaxed">
                Measure around the fullest point of the hips with feet placed together.
              </p>
            </div>
          </div>
        </div>

        {/* Concierge Assistance Box */}
        <div className="bg-[#F3EFE6] border border-[#E8E4DC] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h4 className="font-quiche text-lg text-[#111113] font-normal mb-1">
              Require Sizing &amp; Fit Assistance?
            </h4>
            <p className="text-xs text-[#555560] font-light leading-relaxed max-w-md">
              Connect with our team for personalized fit recommendations and garment dimension checks.
            </p>
          </div>

          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#111113] text-white text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#C2922E] transition-colors shrink-0"
          >
            <MessageCircle size={14} className="text-[#C2922E]" />
            <span>Contact Concierge</span>
          </Link>
        </div>

      </div>

      <ServiceStrip />
    </div>
  );
};

export default SizeGuide;
