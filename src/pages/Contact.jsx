import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Aurora from "../components/Aurora";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", interest: "Private Styling", message: "" });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Please share your name and email");
      return;
    }
    toast.success("Request received", { description: "Our concierge will be in touch within 24 hours." });
    setForm({ name: "", email: "", phone: "", interest: "Private Styling", message: "" });
  };

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div data-testid="contact-page" className="grain pt-40 pb-32 relative min-h-screen">

      <div className="fixed inset-0 bg-[#0a0a0c]/50 z-0 pointer-events-none" />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mb-20 max-w-3xl"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body block mb-4">— Private Concierge</span>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-tighter font-medium leading-[0.95]">
            An appointment, by <em className="italic font-normal text-foreground/55">invitation.</em>
          </h1>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="grid lg:grid-cols-12 gap-16"
        >
          <div className="lg:col-span-5">
            <h3 className="font-display text-2xl mb-4">The Atelier</h3>
            <p className="text-foreground/65 font-body leading-relaxed mb-8">
              Visit us by appointment. Each fitting is private — one client, one tailor, one hour.
            </p>

            <div className="space-y-8 text-sm font-body">
              {[
                { city: "Mumbai", line1: "12 Altamount Road", line2: "Mumbai 400026, India" },
                { city: "Milan", line1: "Via Monte Napoleone 21", line2: "20121 Milano, Italia" },
                { city: "London", line1: "47 Savile Row", line2: "London W1S 3PA, UK" },
              ].map((c) => (
                <div key={c.city}>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 block mb-2">— {c.city}</span>
                  <p className="text-foreground/85">{c.line1}</p>
                  <p className="text-foreground/55">{c.line2}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-10 border-t border-white/5 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body mb-2">— Concierge Helpline</p>
              <a href="https://wa.me/917666168147" target="_blank" rel="noopener noreferrer" className="luxe-link text-foreground/85 font-body block">+91 76661 68147 (WhatsApp Concierge)</a>
              <a href="mailto:concierge@suko.atelier" className="luxe-link text-foreground/85 font-body block">concierge@suko.atelier</a>
            </div>
          </div>

          <form onSubmit={submit} data-testid="contact-form" className="lg:col-span-7 space-y-8">
            <div className="grid sm:grid-cols-2 gap-6">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body block mb-2">Name</span>
                <input
                  data-testid="contact-name"
                  value={form.name}
                  onChange={upd("name")}
                  type="text"
                  className="w-full bg-transparent border-b border-white/15 focus:border-foreground outline-none py-3 text-base font-body"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body block mb-2">Email</span>
                <input
                  data-testid="contact-email"
                  value={form.email}
                  onChange={upd("email")}
                  type="email"
                  className="w-full bg-transparent border-b border-white/15 focus:border-foreground outline-none py-3 text-base font-body"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body block mb-2">Telephone</span>
                <input
                  data-testid="contact-phone"
                  value={form.phone}
                  onChange={upd("phone")}
                  type="tel"
                  className="w-full bg-transparent border-b border-white/15 focus:border-foreground outline-none py-3 text-base font-body"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body block mb-2">Interest</span>
                <select
                  data-testid="contact-interest"
                  value={form.interest}
                  onChange={upd("interest")}
                  className="w-full bg-transparent border-b border-white/15 focus:border-foreground outline-none py-3 text-base font-body"
                >
                  <option className="bg-background">Private Styling</option>
                  <option className="bg-background">Bespoke Suit</option>
                  <option className="bg-background">Wardrobe Consultation</option>
                  <option className="bg-background">General Enquiry</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body block mb-2">Message</span>
              <textarea
                data-testid="contact-message"
                value={form.message}
                onChange={upd("message")}
                rows={5}
                className="w-full bg-transparent border-b border-white/15 focus:border-foreground outline-none py-3 text-base font-body resize-none"
              />
            </label>
            <button
              type="submit"
              data-testid="contact-submit-btn"
              className="bg-foreground text-background px-10 py-4 text-[11px] uppercase tracking-[0.3em] font-body hover:bg-foreground/90 transition-all"
            >
              Request Appointment
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
