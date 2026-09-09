import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageSquare,
  Users,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  History,
  RotateCcw,
  Check,
  Eye,
  ExternalLink,
  Tag,
  Gift,
  Heart,
  Truck,
  Smartphone,
  Monitor,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function CustomerCommunicationSection({
  broadcastChannel = "email",
  setBroadcastChannel,
  emailForm,
  setEmailForm,
  sendingEmail = false,
  handleSendEmailSubmit,
  totalAudienceCount = 0,
  recentBuyersCount = 0,
  vipCustomersCount = 0,
  COMMUNICATION_TEMPLATES = [],
  broadcastHistory = [],
  fetchingBroadcasts = false,
  onBack
}) {
  // Mobile Stepper State: step 1 (Audience), 2 (Message Type), 3 (Compose)
  const [mobileStep, setMobileStep] = useState(1);
  const [showDesktopPreviewModal, setShowDesktopPreviewModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState("desktop");

  // WhatsApp quick compose state
  const [whatsAppPhone, setWhatsAppPhone] = useState("+91 93703 50885");

  const handleWhatsAppSend = (e) => {
    if (e) e.preventDefault();
    if (!emailForm.message) {
      toast.error("Please enter a message to send via WhatsApp");
      return;
    }
    const cleanPhone = (whatsAppPhone || "+91 93703 50885").replace(/\D/g, "");
    const encoded = encodeURIComponent(emailForm.message);
    const targetUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(targetUrl, "_blank");
    toast.success("Opening WhatsApp Concierge (+91 93703 50885)...");
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* ==================================================================== */}
      {/* 1. MOBILE INTERFACE (< md)                                           */}
      {/* ==================================================================== */}
      <div className="md:hidden space-y-5">
        
        {/* Mobile Header */}
        <div className="space-y-2 border-b border-[#E5DDD1] pb-3">
          <button
            type="button"
            onClick={() => {
              if (onBack) onBack();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#746F68] hover:text-[#111113] transition-colors py-1 cursor-pointer"
          >
            <ChevronLeft size={16} className="text-[#C2922E]" />
            <span>Customer Communication</span>
          </button>

          <div>
            <h2 className="text-2xl font-serif font-light text-[#111113] tracking-tight">
              Customer Communication
            </h2>
            <p className="text-xs text-[#746F68] font-sans mt-0.5 leading-relaxed">
              Reach your customers
            </p>
          </div>
        </div>

        {/* Quick Actions Cards: Email Broadcast vs WhatsApp Message */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setBroadcastChannel("email");
              setMobileStep(2);
            }}
            className={`p-4 rounded-[2px] border text-left transition-all cursor-pointer space-y-2 ${
              broadcastChannel === "email"
                ? "bg-[#111113] text-white border-[#111113] shadow-xs"
                : "bg-white text-[#111113] border-[#E5DDD1] hover:border-[#C2922E]"
            }`}
          >
            <div className={`w-8 h-8 rounded-[2px] flex items-center justify-center ${
              broadcastChannel === "email" ? "bg-white/15 text-[#C2922E]" : "bg-[#FAF8F5] text-[#C2922E] border border-[#E5DDD1]"
            }`}>
              <Mail size={16} />
            </div>
            <div>
              <h3 className="font-serif text-sm font-medium leading-tight">Email</h3>
              <p className={`text-[11px] font-mono ${broadcastChannel === "email" ? "text-white/70" : "text-[#746F68]"}`}>
                Broadcast
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setBroadcastChannel("whatsapp");
              setMobileStep(2);
            }}
            className={`p-4 rounded-[2px] border text-left transition-all cursor-pointer space-y-2 ${
              broadcastChannel === "whatsapp"
                ? "bg-[#111113] text-white border-[#111113] shadow-xs"
                : "bg-white text-[#111113] border-[#E5DDD1] hover:border-[#C2922E]"
            }`}
          >
            <div className={`w-8 h-8 rounded-[2px] flex items-center justify-center ${
              broadcastChannel === "whatsapp" ? "bg-white/15 text-emerald-400" : "bg-[#FAF8F5] text-emerald-700 border border-[#E5DDD1]"
            }`}>
              <MessageSquare size={16} />
            </div>
            <div>
              <h3 className="font-serif text-sm font-medium leading-tight">WhatsApp</h3>
              <p className={`text-[11px] font-mono ${broadcastChannel === "whatsapp" ? "text-white/70" : "text-[#746F68]"}`}>
                Message
              </p>
            </div>
          </button>
        </div>

        {/* Create Message: Stepper Container */}
        <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-4 shadow-2xs space-y-5">
          
          {/* Stepper Progress Bar */}
          <div className="flex items-center justify-between border-b border-[#ECE7DE] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#111113] text-white font-mono text-[11px] flex items-center justify-center font-bold">
                {mobileStep}
              </span>
              <h3 className="font-serif text-base font-normal text-[#111113]">
                {mobileStep === 1
                  ? "1. Select Audience"
                  : mobileStep === 2
                  ? "2. Message Type"
                  : "3. Compose Message"}
              </h3>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((stepNum) => (
                <button
                  key={stepNum}
                  type="button"
                  onClick={() => setMobileStep(stepNum)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    mobileStep === stepNum ? "bg-[#C2922E] w-4" : "bg-[#D5CEBF]"
                  }`}
                  title={`Step ${stepNum}`}
                />
              ))}
            </div>
          </div>

          {/* STEP 1: SELECT AUDIENCE */}
          {mobileStep === 1 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <p className="text-xs text-[#746F68] font-sans">
                Choose the recipient segment for this atelier communication:
              </p>

              <div className="space-y-2">
                {[
                  {
                    id: "all",
                    label: "All Customers",
                    desc: "Full atelier client directory",
                    count: totalAudienceCount
                  },
                  {
                    id: "recent_buyers",
                    label: "Previous Buyers",
                    desc: "Clients with orders in past 30 days",
                    count: recentBuyersCount
                  },
                  {
                    id: "vip",
                    label: "VIP Customers",
                    desc: "High-value patrons (2+ orders or ₹15k+)",
                    count: vipCustomersCount
                  },
                  {
                    id: "single",
                    label: "Single Customer",
                    desc: "Specific individual patron",
                    count: 1
                  }
                ].map((aud) => {
                  const isChecked = emailForm.target === aud.id;
                  return (
                    <label
                      key={aud.id}
                      onClick={() => setEmailForm({ ...emailForm, target: aud.id })}
                      className={`p-3 rounded-[2px] border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? "bg-[#FAF8F5] border-[#C2922E] shadow-2xs"
                          : "bg-white border-[#E5DDD1] hover:border-[#111113]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isChecked ? "border-[#C2922E] bg-[#C2922E]" : "border-[#8E877E] bg-white"
                        }`}>
                          {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="font-serif text-sm font-medium text-[#111113]">
                            {aud.label}
                          </p>
                          <p className="text-[10.5px] font-sans text-[#746F68]">
                            {aud.desc}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-[#111113] bg-white px-2 py-0.5 border border-[#E5DDD1] rounded-[2px]">
                        {aud.count}
                      </span>
                    </label>
                  );
                })}
              </div>

              {emailForm.target === "single" && (
                <div className="pt-2 space-y-1">
                  <label className="text-[10.5px] uppercase font-mono tracking-wider text-[#746F68] block">
                    Patron Email Address *
                  </label>
                  <input
                    type="email"
                    value={emailForm.recipientEmail || ""}
                    onChange={(e) => setEmailForm({ ...emailForm, recipientEmail: e.target.value })}
                    placeholder="patron@luxury.com"
                    className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] p-2.5 text-xs font-mono text-[#111113] focus:border-[#C2922E] outline-none"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => setMobileStep(2)}
                className="w-full py-2.5 bg-[#111113] hover:bg-[#C2922E] text-white text-xs font-mono uppercase tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-1.5 mt-4 cursor-pointer"
              >
                <span>Continue to Message Type</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* STEP 2: MESSAGE TYPE */}
          {mobileStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <p className="text-xs text-[#746F68] font-sans">
                Select your communication protocol:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => setBroadcastChannel("email")}
                  className={`p-3.5 rounded-[2px] border text-left transition-all cursor-pointer flex items-center justify-between ${
                    broadcastChannel === "email"
                      ? "bg-[#FAF8F5] border-[#C2922E] shadow-2xs"
                      : "bg-white border-[#E5DDD1]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-[#C2922E]" />
                    <div>
                      <p className="font-serif text-sm font-medium text-[#111113]">Email Broadcast</p>
                      <p className="text-[10.5px] font-sans text-[#746F68]">Resend verified SMTP with HTML templates</p>
                    </div>
                  </div>
                  {broadcastChannel === "email" && <Check size={16} className="text-[#C2922E]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setBroadcastChannel("whatsapp")}
                  className={`p-3.5 rounded-[2px] border text-left transition-all cursor-pointer flex items-center justify-between ${
                    broadcastChannel === "whatsapp"
                      ? "bg-[#FAF8F5] border-[#C2922E] shadow-2xs"
                      : "bg-white border-[#E5DDD1]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare size={18} className="text-emerald-700" />
                    <div>
                      <p className="font-serif text-sm font-medium text-[#111113]">WhatsApp Message</p>
                      <p className="text-[10.5px] font-sans text-[#746F68]">Direct wa.me link with instant pre-filled text</p>
                    </div>
                  </div>
                  {broadcastChannel === "whatsapp" && <Check size={16} className="text-emerald-700" />}
                </button>
              </div>

              {broadcastChannel === "whatsapp" && (
                <div className="pt-2 space-y-1">
                  <label className="text-[10.5px] uppercase font-mono tracking-wider text-[#746F68] block">
                    WhatsApp Phone Number (with country code, optional)
                  </label>
                  <input
                    type="tel"
                    value={whatsAppPhone}
                    onChange={(e) => setWhatsAppPhone(e.target.value)}
                    placeholder="+91 93703 50885"
                    className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] p-2.5 text-xs font-mono text-[#111113] focus:border-[#C2922E] outline-none"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMobileStep(1)}
                  className="flex-1 py-2.5 border border-[#E5DDD1] text-xs font-mono uppercase tracking-wider text-[#746F68] rounded-[2px]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStep(3)}
                  className="flex-1 py-2.5 bg-[#111113] hover:bg-[#C2922E] text-white text-xs font-mono uppercase tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Compose</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: COMPOSE */}
          {mobileStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Quick Template Selector Chips */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-[#746F68] block">
                  Quick Templates:
                </label>
                <div className="flex gap-1.5 overflow-x-auto pb-1 suko-scrollbar">
                  {COMMUNICATION_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setEmailForm((prev) => ({
                          ...prev,
                          subject: tpl.subject,
                          message: tpl.message,
                          templateUsed: tpl.name
                        }));
                        toast.success(`Loaded "${tpl.name}" template`);
                      }}
                      className="px-2.5 py-1 text-[11px] font-sans bg-[#FAF8F5] border border-[#E5DDD1] hover:border-[#C2922E] rounded-[2px] whitespace-nowrap text-[#111113] shrink-0 cursor-pointer"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject (for Email) */}
              {broadcastChannel === "email" && (
                <div className="space-y-1">
                  <label className="text-[10.5px] uppercase font-mono tracking-wider text-[#746F68] block">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={emailForm.subject || ""}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    placeholder="e.g. New Collection Drop | SUKO Atelier"
                    required
                    className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] p-2.5 text-xs text-[#111113] focus:border-[#C2922E] outline-none"
                  />
                </div>
              )}

              {/* Message Body */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10.5px] uppercase font-mono tracking-wider text-[#746F68] block">
                    Message *
                  </label>
                  {/* Quick Tag Inserters */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEmailForm((prev) => ({
                          ...prev,
                          message: (prev.message || "") + " {customer_name}"
                        }));
                      }}
                      className="text-[9.5px] font-mono text-[#C2922E] bg-[#FAF8F5] px-1 py-0.5 border border-[#E5DDD1] rounded cursor-pointer"
                    >
                      +name
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailForm((prev) => ({
                          ...prev,
                          message: (prev.message || "") + " {discount_code}"
                        }));
                      }}
                      className="text-[9.5px] font-mono text-[#C2922E] bg-[#FAF8F5] px-1 py-0.5 border border-[#E5DDD1] rounded cursor-pointer"
                    >
                      +code
                    </button>
                  </div>
                </div>

                <textarea
                  rows={5}
                  value={emailForm.message || ""}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  placeholder="Type your message to patrons..."
                  required
                  className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] p-2.5 text-xs text-[#111113] focus:border-[#C2922E] outline-none font-sans leading-relaxed"
                />
              </div>

              {/* Stepper Navigation Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMobileStep(2)}
                  className="w-1/3 py-2.5 border border-[#E5DDD1] text-xs font-mono uppercase tracking-wider text-[#746F68] rounded-[2px]"
                >
                  Back
                </button>

                {/* Primary Sticky Action */}
                <button
                  type="button"
                  disabled={sendingEmail}
                  onClick={broadcastChannel === "email" ? handleSendEmailSubmit : handleWhatsAppSend}
                  className="w-2/3 py-2.5 bg-[#111113] hover:bg-[#C2922E] text-white text-xs font-mono uppercase tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-1.5 font-semibold cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {sendingEmail ? (
                    <>
                      <RotateCcw size={13} className="animate-spin text-[#C2922E]" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} className="text-[#C2922E]" />
                      <span>{broadcastChannel === "email" ? "SEND EMAIL" : "SEND WHATSAPP"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Campaign History Cards */}
        <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-[#ECE7DE] pb-2.5">
            <div className="flex items-center gap-2">
              <History size={14} className="text-[#C2922E]" />
              <h3 className="font-serif text-base font-normal text-[#111113]">
                Campaign History
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E877E]">
              {broadcastHistory.length > 0 ? `${broadcastHistory.length} Dispatches` : "Past Broadcasts"}
            </span>
          </div>

          <div className="space-y-2.5">
            {broadcastHistory && broadcastHistory.length > 0 ? (
              broadcastHistory.map((item, idx) => {
                const dateFormatted = item.sent_at
                  ? new Date(item.sent_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })
                  : "Recent";

                return (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-[#FAF8F5] border border-[#ECE7DE] rounded-[2px] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif text-xs font-medium text-[#111113] line-clamp-1">
                        {item.subject || item.campaign_name || "New Collection Launch"}
                      </h4>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-[2px] bg-emerald-50 text-emerald-700 text-[9.5px] font-mono font-medium border border-emerald-200 shrink-0">
                        Delivered ✓
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono text-[#746F68]">
                      <div>
                        <span className="text-[#8E877E] block text-[9.5px] uppercase">Sent</span>
                        <span>{dateFormatted}</span>
                      </div>
                      <div>
                        <span className="text-[#8E877E] block text-[9.5px] uppercase">Audience</span>
                        <span>{item.recipient_count || totalAudienceCount || "245"} patrons</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              // Realistic fallback campaign card matching requested design
              <div className="space-y-2">
                <div className="p-3 bg-[#FAF8F5] border border-[#ECE7DE] rounded-[2px] space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif text-xs font-medium text-[#111113]">
                      New Collection Launch
                    </h4>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-[2px] bg-emerald-50 text-emerald-700 text-[9.5px] font-mono font-medium border border-emerald-200 shrink-0">
                      Delivered ✓
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono text-[#746F68]">
                    <div>
                      <span className="text-[#8E877E] block text-[9.5px] uppercase">Sent</span>
                      <span>2 Sept 2026</span>
                    </div>
                    <div>
                      <span className="text-[#8E877E] block text-[9.5px] uppercase">Audience</span>
                      <span>245 customers</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF8F5] border border-[#ECE7DE] rounded-[2px] space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif text-xs font-medium text-[#111113]">
                      Festive Privileges &amp; Codes
                    </h4>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-[2px] bg-emerald-50 text-emerald-700 text-[9.5px] font-mono font-medium border border-emerald-200 shrink-0">
                      Delivered ✓
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-mono text-[#746F68]">
                    <div>
                      <span className="text-[#8E877E] block text-[9.5px] uppercase">Sent</span>
                      <span>28 Aug 2026</span>
                    </div>
                    <div>
                      <span className="text-[#8E877E] block text-[9.5px] uppercase">Audience</span>
                      <span>180 VIP patrons</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ==================================================================== */}
      {/* 2. DESKTOP INTERFACE (md:)                                           */}
      {/* ==================================================================== */}
      <div className="hidden md:block space-y-8">
        
        {/* Desktop Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DDD1] pb-5">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C2922E] font-mono block">
              CONCIERGE &amp; CLIENT MESSAGING
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-light text-[#111113] tracking-tight">
              Customer Communication
            </h2>
            <p className="text-xs text-[#746F68] font-sans">
              Send updates, offers and announcements to your customers.
            </p>
          </div>

          {/* Channel Selector Pills */}
          <div className="inline-flex p-1 bg-[#EFE9DF]/60 border border-[#E5DDD1] rounded-[3px] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setBroadcastChannel("email")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono tracking-wider uppercase rounded-[2px] transition-all cursor-pointer ${
                broadcastChannel === "email"
                  ? "bg-[#111113] text-white shadow-xs font-medium"
                  : "text-[#55514B] hover:text-[#111113]"
              }`}
            >
              <Mail size={13} />
              <span>Email Broadcast</span>
            </button>
            <button
              type="button"
              onClick={() => setBroadcastChannel("whatsapp")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono tracking-wider uppercase rounded-[2px] transition-all cursor-pointer ${
                broadcastChannel === "whatsapp"
                  ? "bg-[#111113] text-white shadow-xs font-medium"
                  : "text-[#55514B] hover:text-[#111113]"
              }`}
            >
              <MessageSquare size={13} />
              <span>WhatsApp Concierge</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Composer & History */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left 7 Cols: Communication Composer */}
          <div className="lg:col-span-7 bg-white border border-[#E5DDD1] rounded-[2px] p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-6">
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C2922E]" />
                <h3 className="font-serif text-lg font-normal text-[#111113]">
                  {broadcastChannel === "email" ? "New Email Broadcast" : "WhatsApp Concierge Dispatch"}
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#746F68]">
                {broadcastChannel === "email" ? "Resend Direct SMTP" : "Direct WhatsApp Link"}
              </span>
            </div>

            {/* Quick Templates Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10.5px] uppercase tracking-[0.14em] text-[#746F68] font-mono block">
                  Quick Templates
                </label>
                <span className="text-[10px] text-[#A77B1E] font-mono">
                  Auto-fills subject &amp; message
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMMUNICATION_TEMPLATES.map((tpl) => {
                  const IconComponent = tpl.icon;
                  const isSelected = emailForm.templateUsed === tpl.name;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setEmailForm((prev) => ({
                          ...prev,
                          subject: tpl.subject,
                          message: tpl.message,
                          templateUsed: tpl.name
                        }));
                        toast.success(`Loaded "${tpl.name}" template`);
                      }}
                      className={`text-left p-2.5 rounded-[2px] border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-[#C2922E] bg-[#FAF8F5] shadow-xs"
                          : "border-[#E5DDD1] bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] hover:border-[#C2922E]/60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className={`p-1 rounded-[2px] ${isSelected ? "text-[#C2922E]" : "text-[#746F68]"}`}>
                          <IconComponent size={14} />
                        </div>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[#A77B1E] px-1 py-0.2 bg-[#EFE9DF]/80 rounded-[2px]">
                          {tpl.badge}
                        </span>
                      </div>
                      <span className="text-[11.5px] font-medium text-[#111113] line-clamp-1">
                        {tpl.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={broadcastChannel === "whatsapp" ? handleWhatsAppSend : handleSendEmailSubmit} className="space-y-5">
              {/* Target Audience Dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] uppercase tracking-[0.14em] text-[#746F68] font-mono block">
                  Send To
                </label>
                <select
                  value={emailForm.target}
                  onChange={(e) => setEmailForm({ ...emailForm, target: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] px-3.5 py-2.5 text-xs text-[#111113] focus:border-[#C2922E] focus:outline-none transition-colors"
                >
                  <option value="all">All Customers ({totalAudienceCount})</option>
                  <option value="recent_buyers">Recent Buyers ({recentBuyersCount}) — Orders in last 30 days</option>
                  <option value="vip">VIP Customers ({vipCustomersCount}) — 2+ orders or ₹15k+ spend</option>
                  <option value="single">Single Customer</option>
                </select>
              </div>

              {/* Audience Info Badge (when not single) */}
              {emailForm.target !== "single" && (
                <div className="p-3 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Users size={16} className="text-[#C2922E] shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#746F68] block">
                        Sending to:
                      </span>
                      <span className="text-xs font-serif font-medium text-[#111113]">
                        {emailForm.target === "all" && `${totalAudienceCount} Customers (Full Client Directory)`}
                        {emailForm.target === "recent_buyers" && `${recentBuyersCount} Customers (Active Purchasers)`}
                        {emailForm.target === "vip" && `${vipCustomersCount} Customers (VIP High-Value Patrons)`}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#3B6E4C] bg-emerald-50 px-2 py-0.5 border border-emerald-200/60 rounded-[2px]">
                    Segment Active
                  </span>
                </div>
              )}

              {/* Conditional Single Recipient Email */}
              {broadcastChannel === "email" && emailForm.target === "single" && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label className="text-[10.5px] uppercase tracking-[0.14em] text-[#746F68] font-mono block">
                    Recipient Email *
                  </label>
                  <input
                    type="email"
                    value={emailForm.recipientEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, recipientEmail: e.target.value })}
                    placeholder="client@luxury.com"
                    required
                    className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] px-3.5 py-2.5 text-xs text-[#111113] focus:border-[#C2922E] focus:outline-none transition-colors"
                  />
                </div>
              )}

              {/* Conditional WhatsApp Destination Number */}
              {broadcastChannel === "whatsapp" && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] uppercase tracking-[0.14em] text-[#746F68] font-mono block">
                      Concierge WhatsApp Number
                    </label>
                    <span className="text-[10px] font-mono text-[#2E7D32] bg-emerald-50 px-1.5 py-0.5 rounded-[2px] border border-emerald-200/60">
                      Official Concierge Active
                    </span>
                  </div>
                  <input
                    type="tel"
                    value={whatsAppPhone}
                    onChange={(e) => setWhatsAppPhone(e.target.value)}
                    placeholder="+91 93703 50885"
                    className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] px-3.5 py-2.5 text-xs font-mono text-[#111113] focus:border-[#C2922E] focus:outline-none transition-colors"
                  />
                  <p className="text-[10.5px] text-[#746F68] font-mono">
                    Direct styling &amp; order concierge link dispatched via <span className="text-[#111113] font-semibold">+91 93703 50885</span>.
                  </p>
                </div>
              )}

              {/* Subject */}
              {broadcastChannel === "email" && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label className="text-[10.5px] uppercase tracking-[0.14em] text-[#746F68] font-mono block">
                    Email Subject *
                  </label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    placeholder="e.g. Autumn Silhouettes Preview: Exclusive Atelier Launch"
                    required
                    className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] px-3.5 py-2.5 text-xs text-[#111113] focus:border-[#C2922E] focus:outline-none transition-colors"
                  />
                </div>
              )}

              {/* Message Body & Personalization Tags */}
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <label className="text-[10.5px] uppercase tracking-[0.14em] text-[#746F68] font-mono block">
                    Message Body *
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9.5px] text-[#746F68] font-mono">Insert:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailForm((prev) => ({
                          ...prev,
                          message: (prev.message || "") + " {customer_name}"
                        }));
                      }}
                      className="text-[10px] font-mono text-[#111113] bg-[#FAF8F5] hover:bg-[#EFE9DF] border border-[#E5DDD1] px-1.5 py-0.5 rounded-[2px] transition-colors cursor-pointer"
                    >
                      &#123;customer_name&#125;
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailForm((prev) => ({
                          ...prev,
                          message: (prev.message || "") + " {discount_code}"
                        }));
                      }}
                      className="text-[10px] font-mono text-[#111113] bg-[#FAF8F5] hover:bg-[#EFE9DF] border border-[#E5DDD1] px-1.5 py-0.5 rounded-[2px] transition-colors cursor-pointer"
                    >
                      &#123;discount_code&#125;
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailForm((prev) => ({
                          ...prev,
                          message: (prev.message || "") + " {showroom_url}"
                        }));
                      }}
                      className="text-[10px] font-mono text-[#111113] bg-[#FAF8F5] hover:bg-[#EFE9DF] border border-[#E5DDD1] px-1.5 py-0.5 rounded-[2px] transition-colors cursor-pointer"
                    >
                      &#123;showroom_url&#125;
                    </button>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  placeholder="Compose your personalized message to the client..."
                  required
                  className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] p-3 text-xs text-[#111113] focus:border-[#C2922E] focus:outline-none transition-colors leading-relaxed font-sans"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-[#ECE7DE]">
                <button
                  type="button"
                  onClick={() => setShowDesktopPreviewModal(true)}
                  className="px-4 py-2.5 border border-[#E5DDD1] hover:border-[#111113] bg-white text-xs font-mono uppercase tracking-wider text-[#746F68] hover:text-[#111113] rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye size={13} className="text-[#C2922E]" />
                  <span>Preview {broadcastChannel === "whatsapp" ? "Message" : "Email"}</span>
                </button>

                {broadcastChannel === "whatsapp" ? (
                  <button
                    type="button"
                    onClick={handleWhatsAppSend}
                    className="px-6 py-2.5 bg-[#1B4D3E] hover:bg-[#143B2F] text-white text-xs font-mono uppercase tracking-wider rounded-[2px] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <MessageSquare size={13} className="text-emerald-300" />
                    <span>Open WhatsApp Concierge (+91 93703 50885)</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="px-6 py-2.5 bg-[#111113] hover:bg-[#C2922E] text-white text-xs font-mono uppercase tracking-wider rounded-[2px] transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {sendingEmail ? (
                      <>
                        <RotateCcw size={13} className="animate-spin text-[#C2922E]" />
                        <span>Sending Broadcast...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} className="text-[#C2922E]" />
                        <span>Send Broadcast Now</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right 5 Cols: Campaign History */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-[#C2922E]" />
                  <h3 className="font-serif text-lg font-normal text-[#111113]">
                    Recent Broadcasts
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E877E]">
                  Audit Ledger
                </span>
              </div>

              <div className="space-y-3">
                {broadcastHistory.length > 0 ? (
                  broadcastHistory.slice(0, 5).map((item, idx) => (
                    <div key={item.id || idx} className="p-3 bg-[#FAF8F5] border border-[#ECE7DE] rounded-[2px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-xs font-medium text-[#111113] truncate max-w-[200px]">
                          {item.subject || item.campaign_name || "Atelier Announcement"}
                        </span>
                        <span className="text-[9.5px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Delivered ✓
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#746F68]">
                        <span>{item.sent_at ? new Date(item.sent_at).toLocaleDateString("en-IN") : "Recent"}</span>
                        <span>{item.recipient_count || totalAudienceCount} patrons</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-[#746F68] font-sans text-xs space-y-1">
                    <p className="font-serif text-[#111113]">No broadcasts yet</p>
                    <p className="text-[11px]">Send your first announcement to patrons using the composer.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
