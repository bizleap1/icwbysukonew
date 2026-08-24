import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Eye, Lock } from "lucide-react";
import SEO from "../components/SEO";
import ServiceStrip from "../components/home/ServiceStrip";

const PrivacyPolicy = () => {
  return (
    <div 
      data-testid="privacy-policy-page" 
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white min-h-screen pt-28 sm:pt-36 lg:pt-40 transition-colors duration-300"
    >
      <SEO 
        title="Privacy Policy"
        description="Privacy policy and data handling principles for ICW by Suko."
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
              INFORMATION POLICY
            </span>
            <span className="w-4 h-[1px] bg-[#C2922E]" />
          </div>

          <h1 className="font-quiche text-3xl sm:text-5xl lg:text-6xl font-light text-[#111113] tracking-tight leading-[1.08] mb-3 sm:mb-4">
            Privacy Policy
          </h1>

          <p className="text-xs sm:text-[14px] text-[#555560] font-light leading-relaxed max-w-lg mx-auto">
            How we handle information provided when you browse our platform or contact client support.
          </p>
        </motion.div>
      </div>

      {/* Content Container */}
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
        <div className="space-y-10 sm:space-y-12">
          
          {/* Section 1: Information Collected */}
          <section className="space-y-3 pb-8 border-b border-[#E8E4DC]">
            <div className="flex items-center gap-2.5 text-[#C2922E]">
              <ShieldCheck size={18} />
              <h2 className="font-quiche text-xl sm:text-2xl text-[#111113] font-normal">
                1. Information Collected
              </h2>
            </div>
            <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed">
              We collect information that you choose to provide directly to us when creating an account, submitting an inquiry via our contact form, saving items to your wishlist, or placing an order. This may include your name, email address, contact telephone number, and delivery details.
            </p>
          </section>

          {/* Section 2: Use of Information */}
          <section className="space-y-3 pb-8 border-b border-[#E8E4DC]">
            <div className="flex items-center gap-2.5 text-[#C2922E]">
              <Eye size={18} />
              <h2 className="font-quiche text-xl sm:text-2xl text-[#111113] font-normal">
                2. Use of Information
              </h2>
            </div>
            <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed">
              Information provided is used to process transactions, respond to customer inquiries, coordinate delivery updates, and support account functionality across the website.
            </p>
          </section>

          {/* Section 3: Data Handling */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#C2922E]">
              <Lock size={18} />
              <h2 className="font-quiche text-xl sm:text-2xl text-[#111113] font-normal">
                3. Data Inquiries &amp; Contact
              </h2>
            </div>
            <p className="text-xs sm:text-[13.5px] text-[#555560] font-light leading-relaxed">
              For any questions regarding your account information or to update your contact preferences, please contact our support team via our official Customer Care channels.
            </p>
          </section>

        </div>
      </div>

      <ServiceStrip />
    </div>
  );
};

export default PrivacyPolicy;
