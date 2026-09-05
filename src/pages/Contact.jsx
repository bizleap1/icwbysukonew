import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle, ShieldCheck, RefreshCw, Truck, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import SEO from "../components/SEO";
import ServiceStrip from "../components/home/ServiceStrip";

const Contact = () => {
  const shouldReduceMotion = useReducedMotion();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "Order Assistance",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      toast.success("Enquiry received", {
        description: "Our Client Concierge will respond to your inquiry within 24 hours."
      });
      setForm({
        name: "",
        email: "",
        phone: "",
        interest: "Order Assistance",
        message: ""
      });
      setSubmitting(false);
    }, 400);
  };

  const updateField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div 
      data-testid="contact-page" 
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white min-h-screen pt-28 sm:pt-36 lg:pt-40 transition-colors duration-300"
    >
      <SEO 
        title="Customer Care &amp; Private Concierge"
        description="Connect with the ICW by Suko Client Concierge for assistance with sizing, suiting orders, and styling inquiries."
      />

      {/* 1. Header Section */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-14 xl:px-16 mb-12 sm:mb-16">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.2 : 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="flex items-center justify-center gap-2.5 mb-2.5 sm:mb-3.5">
            <span className="w-4 h-[1px] bg-[#C2922E]" />
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] text-[#C2922E] font-medium font-body">
              CUSTOMER CARE
            </span>
            <span className="w-4 h-[1px] bg-[#C2922E]" />
          </div>

          <h1 className="font-quiche text-3xl sm:text-5xl lg:text-6xl font-light text-[#111113] tracking-tight leading-[1.08] mb-3 sm:mb-4">
            Customer Care &amp; Concierge
          </h1>

          <p className="text-xs sm:text-[14px] text-[#555560] font-light leading-relaxed max-w-lg mx-auto">
            Private client assistance for sizing guidance, order inquiries, and curated wardrobe styling.
          </p>
        </motion.div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-14 xl:px-16 pb-20 sm:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-start">
          
          {/* LEFT: Assistance Pillars & Direct Verified Concierge (5 cols) */}
          <div className="lg:col-span-5 space-y-8 sm:space-y-10">
            
            {/* Assistance Services Cards */}
            <div>
              <span className="text-[10px] uppercase tracking-[0.24em] text-[#C2922E] font-medium block mb-4">
                HOW WE CAN ASSIST YOU
              </span>

              <div className="divide-y divide-[#E8E4DC] border-y border-[#E8E4DC]">
                {[
                  {
                    icon: <ShieldCheck size={16} className="text-[#C2922E]" />,
                    title: "Order Assistance",
                    desc: "Updates regarding order confirmation, tailoring dispatch, and tracking."
                  },
                  {
                    icon: <HelpCircle size={16} className="text-[#C2922E]" />,
                    title: "Sizing & Fit Guidance",
                    desc: "Guidance on silhouette proportions, standard sizing, and coordinated trouser drape."
                  },
                  {
                    icon: <Truck size={16} className="text-[#C2922E]" />,
                    title: "Shipping & Delivery",
                    desc: "Delivery across India in ICW signature garment packaging."
                  },
                  {
                    icon: <RefreshCw size={16} className="text-[#C2922E]" />,
                    title: "Returns & Size Exchanges",
                    desc: "Inquiries regarding size exchange options and garment returns."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="py-4 flex items-start gap-3.5">
                    <span className="shrink-0 mt-0.5">{item.icon}</span>
                    <div>
                      <h4 className="text-xs uppercase tracking-wider font-semibold text-[#111113] mb-0.5">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#555560] font-light leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Verified WhatsApp Concierge Box */}
            <div className="bg-[#F3EFE6] border border-[#E8E4DC] p-6 sm:p-7">
              <span className="text-[10px] uppercase tracking-[0.24em] text-[#C2922E] font-medium block mb-1.5">
                DIRECT CONCIERGE
              </span>
              <h3 className="font-quiche text-xl text-[#111113] font-light mb-2">
                Client WhatsApp Concierge
              </h3>
              <p className="text-xs text-[#555560] font-light leading-relaxed mb-4">
                Connect directly with a dedicated client advisor for size confirmations and styling questions.
              </p>

              <a
                href="https://wa.me/919370350885"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 px-6 py-3 bg-[#111113] text-white text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#C2922E] transition-colors"
              >
                <MessageCircle size={14} className="text-[#C2922E] group-hover:text-white transition-colors" />
                <span>Message Concierge (+91 93703 50885)</span>
              </a>
            </div>

          </div>

          {/* RIGHT: Clean Minimalist Enquiry Form (7 cols) */}
          <div className="lg:col-span-7 bg-[#F3EFE6] border border-[#E8E4DC] p-6 sm:p-10 lg:p-12">
            <span className="text-[10px] uppercase tracking-[0.24em] text-[#C2922E] font-medium block mb-1">
              SEND AN ENQUIRY
            </span>
            <h2 className="font-quiche text-2xl sm:text-3xl text-[#111113] font-light mb-2">
              Client Concierge Request
            </h2>
            <p className="text-xs text-[#555560] font-light leading-relaxed mb-8">
              Please share your details below. An advisor will contact you with sizing and order guidance.
            </p>

            <form onSubmit={handleSubmit} data-testid="contact-form" className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-[#111113] block mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={updateField("name")}
                    placeholder="Enter your name"
                    data-testid="contact-name"
                    className="w-full bg-[#FAF8F5] border border-[#E8E4DC] px-4 py-3 text-xs text-[#111113] outline-none focus:border-[#111113] transition-colors placeholder:text-[#9999A0]"
                  />
                </div>

                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-[#111113] block mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={updateField("email")}
                    placeholder="name@example.com"
                    data-testid="contact-email"
                    className="w-full bg-[#FAF8F5] border border-[#E8E4DC] px-4 py-3 text-xs text-[#111113] outline-none focus:border-[#111113] transition-colors placeholder:text-[#9999A0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-[#111113] block mb-1.5">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={updateField("phone")}
                    placeholder="+91 Phone number"
                    data-testid="contact-phone"
                    className="w-full bg-[#FAF8F5] border border-[#E8E4DC] px-4 py-3 text-xs text-[#111113] outline-none focus:border-[#111113] transition-colors placeholder:text-[#9999A0]"
                  />
                </div>

                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-[#111113] block mb-1.5">
                    Nature of Inquiry
                  </label>
                  <select
                    value={form.interest}
                    onChange={updateField("interest")}
                    data-testid="contact-interest"
                    className="w-full bg-[#FAF8F5] border border-[#E8E4DC] px-4 py-3 text-xs text-[#111113] outline-none focus:border-[#111113] transition-colors"
                  >
                    <option>Order Assistance</option>
                    <option>Sizing &amp; Fit Guidance</option>
                    <option>Size Exchange Request</option>
                    <option>Corporate Wardrobe Inquiry</option>
                    <option>General Inquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-[#111113] block mb-1.5">
                  Message / Silhouette Inquiry *
                </label>
                <textarea
                  rows={4}
                  required
                  value={form.message}
                  onChange={updateField("message")}
                  placeholder="Please specify garment names, sizing questions, or order details..."
                  data-testid="contact-message"
                  className="w-full bg-[#FAF8F5] border border-[#E8E4DC] px-4 py-3 text-xs text-[#111113] outline-none focus:border-[#111113] transition-colors resize-none placeholder:text-[#9999A0]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="contact-submit-btn"
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#111113] text-white text-[11px] uppercase tracking-[0.24em] font-medium hover:bg-[#C2922E] transition-colors disabled:opacity-50"
                >
                  {submitting ? "SUBMITTING..." : "SUBMIT ENQUIRY"}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {/* 3. Service Strip */}
      <ServiceStrip />
    </div>
  );
};

export default Contact;
