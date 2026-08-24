import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw, MessageCircle, HelpCircle } from "lucide-react";
import SEO from "../components/SEO";
import ServiceStrip from "../components/home/ServiceStrip";

const Returns = () => {
  return (
    <div 
      data-testid="returns-page" 
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white min-h-screen pt-28 sm:pt-36 lg:pt-40 transition-colors duration-300"
    >
      <SEO 
        title="Returns &amp; Size Exchanges"
        description="Assistance and inquiry procedures for garment size exchanges and returns for ICW by Suko."
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
              CLIENT SERVICES
            </span>
            <span className="w-4 h-[1px] bg-[#C2922E]" />
          </div>

          <h1 className="font-quiche text-3xl sm:text-5xl lg:text-6xl font-light text-[#111113] tracking-tight leading-[1.08] mb-3 sm:mb-4">
            Returns &amp; Exchanges
          </h1>

          <p className="text-xs sm:text-[14px] text-[#555560] font-light leading-relaxed max-w-lg mx-auto">
            Guidance for size exchange requests and return inquiries.
          </p>
        </motion.div>
      </div>

      {/* Content Container */}
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
        <div className="space-y-10 sm:space-y-12">
          
          {/* Section 1: Overview */}
          <section className="space-y-3 pb-8 border-b border-[#E8E4DC]">
            <div className="flex items-center gap-2.5 text-[#C2922E]">
              <RefreshCw size={18} />
              <h2 className="font-quiche text-xl sm:text-2xl text-[#111113] font-normal">
                1. Size Exchanges &amp; Assistance
              </h2>
            </div>
            <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed">
              If you require an alternate size or fit consultation for your selected piece, our team can assist with available size options and exchange coordination.
            </p>
          </section>

          {/* Section 2: Inquiries */}
          <section className="space-y-3 pb-8 border-b border-[#E8E4DC]">
            <div className="flex items-center gap-2.5 text-[#C2922E]">
              <HelpCircle size={18} />
              <h2 className="font-quiche text-xl sm:text-2xl text-[#111113] font-normal">
                2. Submitting an Inquiry
              </h2>
            </div>
            <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed">
              To inquire about returns or size exchanges, please contact our support team with your order reference number through the{" "}
              <Link to="/contact" className="text-[#111113] font-medium underline hover:text-[#C2922E] transition-colors">
                Customer Care &amp; Concierge
              </Link>
              {" "}page.
            </p>
          </section>

          {/* Section 3: Concierge Direct */}
          <section className="bg-[#F3EFE6] border border-[#E8E4DC] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <h3 className="font-quiche text-xl text-[#111113] font-light mb-1">
                Client Concierge
              </h3>
              <p className="text-xs text-[#555560] font-light leading-relaxed max-w-md">
                Our advisors are available to assist with inquiries regarding sizing, product details, and exchanges.
              </p>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#111113] text-white text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#C2922E] transition-colors shrink-0"
            >
              <MessageCircle size={14} className="text-[#C2922E]" />
              <span>Contact Concierge</span>
            </Link>
          </section>

        </div>
      </div>

      <ServiceStrip />
    </div>
  );
};

export default Returns;
