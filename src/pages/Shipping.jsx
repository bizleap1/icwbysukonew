import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck, Clock, HelpCircle } from "lucide-react";
import SEO from "../components/SEO";
import ServiceStrip from "../components/home/ServiceStrip";

const Shipping = () => {
  return (
    <div 
      data-testid="shipping-page" 
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white min-h-screen pt-28 sm:pt-36 lg:pt-40 transition-colors duration-300"
    >
      <SEO 
        title="Shipping &amp; Delivery"
        description="Information regarding shipping coverage, order dispatch, and delivery assistance for ICW by Suko."
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
            Shipping &amp; Delivery
          </h1>

          <p className="text-xs sm:text-[14px] text-[#555560] font-light leading-relaxed max-w-lg mx-auto">
            Information regarding order fulfillment, dispatch updates, and delivery assistance.
          </p>
        </motion.div>
      </div>

      {/* Content Container */}
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
        <div className="space-y-10 sm:space-y-12">
          
          {/* Section 1: Order Dispatch */}
          <section className="space-y-3 pb-8 border-b border-[#E8E4DC]">
            <div className="flex items-center gap-2.5 text-[#C2922E]">
              <Truck size={18} />
              <h2 className="font-quiche text-xl sm:text-2xl text-[#111113] font-normal">
                1. Order Fulfillment &amp; Dispatch
              </h2>
            </div>
            <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed">
              Each order placed with ICW by Suko is prepared and dispatched directly from our facilities. Once your shipment is arranged, confirmation details and status updates are provided via your registered contact information.
            </p>
          </section>

          {/* Section 2: Delivery Inquiries */}
          <section className="space-y-3 pb-8 border-b border-[#E8E4DC]">
            <div className="flex items-center gap-2.5 text-[#C2922E]">
              <Clock size={18} />
              <h2 className="font-quiche text-xl sm:text-2xl text-[#111113] font-normal">
                2. Status &amp; Tracking
              </h2>
            </div>
            <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed">
              For updates regarding the dispatch status of your order, delivery inquiries, or special delivery coordination, our support team is available to assist.
            </p>
          </section>

          {/* Section 3: Concierge Support */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#C2922E]">
              <HelpCircle size={18} />
              <h2 className="font-quiche text-xl sm:text-2xl text-[#111113] font-normal">
                3. Customer Assistance
              </h2>
            </div>
            <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed">
              If you have questions regarding shipping or order delivery, please connect with our team through the{" "}
              <Link to="/contact" className="text-[#111113] font-medium underline hover:text-[#C2922E] transition-colors">
                Customer Care &amp; Concierge
              </Link>
              {" "}page.
            </p>
          </section>

        </div>
      </div>

      <ServiceStrip />
    </div>
  );
};

export default Shipping;
