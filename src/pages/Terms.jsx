import React from "react";
import { motion } from "framer-motion";
import { FileText, Scale, Shield } from "lucide-react";
import SEO from "../components/SEO";
import ServiceStrip from "../components/home/ServiceStrip";

const Terms = () => {
  return (
    <div 
      data-testid="terms-page" 
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white min-h-screen pt-28 sm:pt-36 lg:pt-40 transition-colors duration-300"
    >
      <SEO 
        title="Terms &amp; Conditions"
        description="Terms and conditions for browsing and using the ICW by Suko platform."
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
              TERMS OF USE
            </span>
            <span className="w-4 h-[1px] bg-[#C2922E]" />
          </div>

          <h1 className="font-quiche text-3xl sm:text-5xl lg:text-6xl font-light text-[#111113] tracking-tight leading-[1.08] mb-3 sm:mb-4">
            Terms &amp; Conditions
          </h1>

          <p className="text-xs sm:text-[14px] text-[#555560] font-light leading-relaxed max-w-lg mx-auto">
            Terms governing the use of the ICW by Suko platform.
          </p>
        </motion.div>
      </div>

      {/* Content Container */}
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
        <div className="space-y-10 sm:space-y-12">
          
          {/* Section 1: Use of Website */}
          <section className="space-y-3 pb-8 border-b border-[#E8E4DC]">
            <div className="flex items-center gap-2.5 text-[#C2922E]">
              <FileText size={18} />
              <h2 className="font-quiche text-xl sm:text-2xl text-[#111113] font-normal">
                1. Use of Website
              </h2>
            </div>
            <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed">
              By accessing and using this website, you agree to comply with and be bound by these terms. The content on this site is provided for personal, non-commercial viewing and product inquiry purposes.
            </p>
          </section>

          {/* Section 2: Catalog & Product Information */}
          <section className="space-y-3 pb-8 border-b border-[#E8E4DC]">
            <div className="flex items-center gap-2.5 text-[#C2922E]">
              <Scale size={18} />
              <h2 className="font-quiche text-xl sm:text-2xl text-[#111113] font-normal">
                2. Product Information &amp; Pricing
              </h2>
            </div>
            <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed">
              We make every effort to display product details, fabric imagery, and prices accurately. Products and prices remain subject to availability and updates.
            </p>
          </section>

          {/* Section 3: Intellectual Property */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#C2922E]">
              <Shield size={18} />
              <h2 className="font-quiche text-xl sm:text-2xl text-[#111113] font-normal">
                3. Content &amp; Intellectual Property
              </h2>
            </div>
            <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed">
              All visual assets, photography, brand names, and website styling displayed on this platform are proprietary to ICW by Suko and may not be reproduced without prior written permission.
            </p>
          </section>

        </div>
      </div>

      <ServiceStrip />
    </div>
  );
};

export default Terms;
