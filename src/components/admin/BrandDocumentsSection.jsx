import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw,
  Check,
  Download,
  Printer,
  Image as ImageIcon,
  Building2,
  FileText,
  Receipt,
  Package,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  Share2
} from "lucide-react";
import { toast } from "sonner";

// Luxury logo preview with fallback SUKO emblem
function BrandLogoPreviewEmblem({ src, name, className = "h-8 w-auto" }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className="flex justify-center mb-1">
        <div className="w-8 h-8 rounded-full border border-[#C2922E]/50 bg-[#FAF8F5] flex items-center justify-center shadow-xs">
          <span className="font-serif text-xs font-semibold tracking-wider text-[#111113]">S</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || "SUKO Atelier"}
      className={`${className} mx-auto object-contain mb-1 max-w-[120px]`}
      onError={() => setFailed(true)}
    />
  );
}

export default function BrandDocumentsSection({
  brandForm,
  setBrandForm,
  brandLogoPreview,
  setBrandLogoPreview,
  setBrandLogoFile,
  savingBrandSettings,
  handleSaveBrandSettings,
  handleResetBrandSettings,
  previewDocType,
  setPreviewDocType,
  onBack
}) {
  // Mobile sub-section drill-down: null | "brand_identity" | "tax_invoice" | "receipt" | "packing_slip"
  const [activeMobileSection, setActiveMobileSection] = useState(null);

  // Download Sample Document Handler
  const handleDownloadSample = () => {
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.info("Please allow popups to download or print sample documents.");
        return;
      }

      const docTitle =
        previewDocType === "packing_slip"
          ? "SUKO-PackingSlip-Sample"
          : previewDocType === "receipt"
          ? "SUKO-Receipt-Sample"
          : "SUKO-TaxInvoice-Sample";

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${docTitle}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #C2922E; padding-bottom: 20px; margin-bottom: 25px; }
            .brand { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
            .tagline { font-size: 11px; color: #666; text-transform: uppercase; margin-top: 4px; }
            .doc-type { font-size: 18px; font-weight: 600; margin: 20px 0 10px; color: #111; }
            .meta-grid { display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th { border-top: 1px solid #111; border-bottom: 1px solid #111; padding: 10px 6px; text-align: left; }
            td { border-bottom: 1px solid #eee; padding: 10px 6px; }
            .total-row { font-weight: bold; border-top: 2px solid #111; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">${brandForm.business_name || "SUKO ATELIER"}</div>
            <div class="tagline">${brandForm.tagline || "Contemporary Indian Corporate Wear"}</div>
          </div>
          <div class="meta-grid">
            <div>
              <strong>${previewDocType === "packing_slip" ? "PACKING SLIP" : (previewDocType === "receipt" ? "PAYMENT RECEIPT" : "TAX INVOICE")}</strong><br/>
              Document #: ${brandForm.invoice_prefix || "INV-"}1001<br/>
              Date: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div style="text-align: right;">
              <strong>Patron:</strong> Shreya Meshram<br/>
              Mumbai, Maharashtra<br/>
              ${brandForm.gst_number ? `GSTIN: ${brandForm.gst_number}` : ""}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item Silhouette</th>
                <th style="text-align: center;">Qty</th>
                ${previewDocType !== "packing_slip" ? '<th style="text-align: right;">Price</th><th style="text-align: right;">Total</th>' : '<th style="text-align: center;">QA Check</th><th style="text-align: center;">Packaging</th>'}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Savile Double-Breasted Blazer (Obsidian Black)</td>
                <td style="text-align: center;">1</td>
                ${previewDocType !== "packing_slip" ? '<td style="text-align: right;">₹4,800.00</td><td style="text-align: right;">₹4,800.00</td>' : '<td style="text-align: center;">PASSED</td><td style="text-align: center;">VERIFIED</td>'}
              </tr>
            </tbody>
          </table>
          <div class="footer">
            Thank you for choosing ${brandForm.business_name || "SUKO Atelier"}.<br/>
            ${brandForm.support_email || "support@indiancorporatewear.com"} &bull; ${brandForm.website_url || "indiancorporatewear.com"}
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
        </html>
      `);
      printWindow.document.close();
      toast.success("Sample document prepared for download/print");
    } catch (e) {
      toast.error("Failed to generate sample document preview");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* ==================================================================== */}
      {/* 1. MOBILE INTERFACE (< md)                                           */}
      {/* ==================================================================== */}
      <div className="md:hidden space-y-5">
        
        {/* Case A: Root List View (Sections Menu + Document Preview) */}
        {activeMobileSection === null ? (
          <div className="space-y-5">
            
            {/* Mobile Header */}
            <div className="space-y-2 border-b border-[#E5DDD1] pb-4">
              <button
                type="button"
                onClick={() => {
                  if (onBack) onBack();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#746F68] hover:text-[#111113] transition-colors py-1 cursor-pointer"
              >
                <ChevronLeft size={16} className="text-[#C2922E]" />
                <span>Settings</span>
              </button>

              <div>
                <h2 className="text-2xl font-serif font-light text-[#111113] tracking-tight">
                  Brand &amp; Documents
                </h2>
                <p className="text-xs text-[#746F68] font-sans mt-0.5 leading-relaxed">
                  Manage brand identity, invoice &amp; document appearance across atelier storefront and operations.
                </p>
              </div>
            </div>

            {/* Section Cards */}
            <div className="space-y-2.5">
              
              {/* Card 1: Brand Identity */}
              <button
                type="button"
                onClick={() => setActiveMobileSection("brand_identity")}
                className="w-full bg-white border border-[#E5DDD1] rounded-[2px] p-4 text-left shadow-2xs hover:border-[#C2922E] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C2922E]" />
                    <h3 className="font-serif text-base font-normal text-[#111113]">
                      Brand Identity
                    </h3>
                  </div>
                  <p className="text-xs text-[#746F68] font-sans">
                    Logo, name, tagline, GSTIN &amp; address
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E5DDD1] flex items-center justify-center text-[#746F68] group-hover:text-[#111113] group-hover:border-[#C2922E] transition-colors">
                  <ChevronRight size={16} />
                </div>
              </button>

              {/* Card 2: Tax Invoice */}
              <button
                type="button"
                onClick={() => setActiveMobileSection("tax_invoice")}
                className="w-full bg-white border border-[#E5DDD1] rounded-[2px] p-4 text-left shadow-2xs hover:border-[#C2922E] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#111113]" />
                    <h3 className="font-serif text-base font-normal text-[#111113]">
                      Tax Invoice
                    </h3>
                  </div>
                  <p className="text-xs text-[#746F68] font-sans">
                    Invoice prefix, numbering, terms &amp; bank settlement
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E5DDD1] flex items-center justify-center text-[#746F68] group-hover:text-[#111113] group-hover:border-[#C2922E] transition-colors">
                  <ChevronRight size={16} />
                </div>
              </button>

              {/* Card 3: Payment Receipt */}
              <button
                type="button"
                onClick={() => setActiveMobileSection("receipt")}
                className="w-full bg-white border border-[#E5DDD1] rounded-[2px] p-4 text-left shadow-2xs hover:border-[#C2922E] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#607D8B]" />
                    <h3 className="font-serif text-base font-normal text-[#111113]">
                      Payment Receipt
                    </h3>
                  </div>
                  <p className="text-xs text-[#746F68] font-sans">
                    Receipt template, numbering &amp; thank you message
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E5DDD1] flex items-center justify-center text-[#746F68] group-hover:text-[#111113] group-hover:border-[#C2922E] transition-colors">
                  <ChevronRight size={16} />
                </div>
              </button>

              {/* Card 4: Packing Slip */}
              <button
                type="button"
                onClick={() => setActiveMobileSection("packing_slip")}
                className="w-full bg-white border border-[#E5DDD1] rounded-[2px] p-4 text-left shadow-2xs hover:border-[#C2922E] transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#8B7355]" />
                    <h3 className="font-serif text-base font-normal text-[#111113]">
                      Packing Slip
                    </h3>
                  </div>
                  <p className="text-xs text-[#746F68] font-sans">
                    Fulfillment docs, workshop QA &amp; price hiding
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E5DDD1] flex items-center justify-center text-[#746F68] group-hover:text-[#111113] group-hover:border-[#C2922E] transition-colors">
                  <ChevronRight size={16} />
                </div>
              </button>

            </div>

            {/* Document Preview Section (Stacked on Mobile) */}
            <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-4 shadow-2xs space-y-4 pt-5 border-t-2 border-t-[#C2922E]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#C2922E] block font-semibold">
                  LIVE DOCUMENT PREVIEW
                </span>
                <h3 className="font-serif text-lg font-normal text-[#111113] mt-0.5">
                  Document Preview
                </h3>
              </div>

              {/* Mobile Document Type Dropdown Selector */}
              <div className="relative">
                <label className="text-[9.5px] uppercase tracking-[0.14em] text-[#746F68] font-mono block mb-1">
                  Preview Document Type
                </label>
                <div className="relative">
                  <select
                    value={previewDocType}
                    onChange={(e) => setPreviewDocType(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] py-2 px-3 pr-8 text-xs font-mono uppercase tracking-wider text-[#111113] appearance-none focus:outline-none focus:border-[#111113]"
                  >
                    <option value="invoice">TAX INVOICE</option>
                    <option value="receipt">PAYMENT RECEIPT</option>
                    <option value="packing_slip">PACKING SLIP</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#746F68] pointer-events-none" />
                </div>
              </div>

              {/* Mobile Paper Preview Card */}
              <div className="bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] p-4 space-y-3.5 text-xs w-full max-w-full overflow-hidden">
                {/* Header */}
                <div className="text-center space-y-1 pb-1">
                  <BrandLogoPreviewEmblem
                    src={brandLogoPreview || brandForm.logo_url}
                    name={brandForm.business_name}
                    className="h-8 w-auto"
                  />
                  <div className="font-serif text-sm font-medium tracking-widest text-[#111113] uppercase">
                    {brandForm.business_name || "SUKO ATELIER"}
                  </div>
                  {brandForm.tagline && (
                    <div className="text-[9px] font-mono text-[#746F68] uppercase">
                      {brandForm.tagline}
                    </div>
                  )}
                </div>

                <div className="border-t border-b border-[#ECE7DE] py-2 flex items-center justify-between font-mono text-[10.5px]">
                  <div>
                    <span className="text-[#C2922E] font-bold block">
                      {previewDocType === "packing_slip"
                        ? "PACKING SLIP"
                        : previewDocType === "receipt"
                        ? "RECEIPT"
                        : "TAX INVOICE"}
                    </span>
                    <span className="text-[#111113]">
                      {brandForm.invoice_prefix || "INV-2026-"}1001
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#746F68] block">Order #1001</span>
                    {brandForm.gst_number && (
                      <span className="text-[9.5px] text-[#111113]">
                        GST: {brandForm.gst_number}
                      </span>
                    )}
                  </div>
                </div>

                {/* Line Item */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium text-[#111113]">
                    <span>Savile Double-Breasted Blazer (M)</span>
                    {previewDocType !== "packing_slip" ? (
                      <span className="font-mono">₹4,800.00</span>
                    ) : (
                      <span className="font-mono text-[10px] text-emerald-700">✓ QA Passed</span>
                    )}
                  </div>
                </div>

                {/* Total */}
                {previewDocType !== "packing_slip" && (
                  <div className="pt-2 border-t border-[#D5CEBF] flex justify-between items-center font-bold text-xs">
                    <span className="font-mono uppercase text-[10px]">Total</span>
                    <span className="font-mono text-sm text-[#111113]">₹4,800.00</span>
                  </div>
                )}
              </div>

              {/* Bottom Actions: Download Sample & Share */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="flex-1 py-2.5 px-3 bg-[#111113] hover:bg-[#C2922E] text-white font-mono text-xs uppercase tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download size={14} className="text-[#C2922E]" />
                  <span>Download Sample</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const shareText = `SUKO Atelier Sample ${previewDocType.toUpperCase()} - ${brandForm.business_name || "SUKO Atelier"}`;
                    if (navigator.share) {
                      navigator.share({ title: "SUKO Atelier Document Sample", text: shareText, url: window.location.origin }).catch(() => {});
                    } else {
                      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
                      toast.success("Opening WhatsApp to share sample...");
                    }
                  }}
                  className="py-2.5 px-3 border border-[#E5DDD1] hover:border-[#111113] bg-[#FAF8F5] text-xs font-mono uppercase tracking-wider text-[#111113] rounded-[2px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Share Sample"
                >
                  <Share2 size={13} className="text-[#746F68]" />
                  <span>Share</span>
                </button>
              </div>
            </div>

          </div>
        ) : (
          /* Case B: Dedicated Sub-Screen for Selected Section */
          <div className="space-y-4 pb-20">
            
            {/* Sub-Screen Header */}
            <div className="flex items-center justify-between border-b border-[#E5DDD1] pb-3">
              <button
                type="button"
                onClick={() => setActiveMobileSection(null)}
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#746F68] hover:text-[#111113] transition-colors py-1 cursor-pointer"
              >
                <ChevronLeft size={16} className="text-[#C2922E]" />
                <span>Back to Sections</span>
              </button>

              <button
                type="button"
                onClick={handleResetBrandSettings}
                className="text-[11px] font-mono text-[#8E877E] hover:text-[#111113] underline"
              >
                Reset
              </button>
            </div>

            {/* Screen Title */}
            <div>
              <h2 className="text-xl font-serif font-light text-[#111113]">
                {activeMobileSection === "brand_identity" && "Brand Identity"}
                {activeMobileSection === "tax_invoice" && "Tax Invoice Settings"}
                {activeMobileSection === "receipt" && "Payment Receipt Settings"}
                {activeMobileSection === "packing_slip" && "Packing Slip Settings"}
              </h2>
            </div>

            {/* SECTION 1 FORM: Brand Identity */}
            {activeMobileSection === "brand_identity" && (
              <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-4 space-y-4 shadow-2xs">
                {/* Logo Preview & Upload */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                    Logo Preview
                  </label>
                  <div className="p-4 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] flex items-center justify-center min-h-[90px]">
                    <img
                      src={brandLogoPreview || brandForm.logo_url || "/logo.png"}
                      alt="Preview"
                      className="max-h-14 w-auto object-contain"
                      onError={(e) => { e.currentTarget.src = "/logo.png"; }}
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={brandForm.logo_url || ""}
                      onChange={(e) => {
                        setBrandForm({ ...brandForm, logo_url: e.target.value });
                        setBrandLogoPreview(e.target.value);
                      }}
                      placeholder="Paste logo URL or upload below..."
                      className="flex-1 text-xs font-mono p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                    />
                    <label className="px-3 py-2 bg-[#111113] hover:bg-[#C2922E] text-white text-xs font-mono uppercase rounded-[2px] transition-colors cursor-pointer shrink-0">
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setBrandLogoFile(file);
                            setBrandLogoPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Business Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={brandForm.business_name || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, business_name: e.target.value })}
                    placeholder="SUKO Atelier"
                    className="w-full text-xs font-sans p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                  />
                </div>

                {/* Tagline */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={brandForm.tagline || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, tagline: e.target.value })}
                    placeholder="Contemporary Indian Corporate Wear"
                    className="w-full text-xs font-sans p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                  />
                </div>

                {/* GSTIN */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={brandForm.gst_number || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, gst_number: e.target.value })}
                    placeholder="27ABCDE1234F1Z5"
                    className="w-full text-xs font-mono p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                  />
                </div>

                {/* Business Address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                    Business Address
                  </label>
                  <textarea
                    value={brandForm.address || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, address: e.target.value })}
                    rows={3}
                    placeholder="Studio Flagship, Bandra Kurla Complex, Mumbai, Maharashtra 400051"
                    className="w-full text-xs font-sans p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                  />
                </div>

                {/* Support Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                      Concierge Email
                    </label>
                    <input
                      type="email"
                      value={brandForm.support_email || ""}
                      onChange={(e) => setBrandForm({ ...brandForm, support_email: e.target.value })}
                      placeholder="indiancorporatewearbysuko@gmail.com"
                      className="w-full text-xs font-mono p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                      Concierge Phone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={brandForm.support_phone ?? brandForm.contact_phone ?? ""}
                      onChange={(e) => setBrandForm({ ...brandForm, support_phone: e.target.value, contact_phone: e.target.value })}
                      placeholder="+91 93703 50885"
                      className="w-full text-xs font-mono p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2 FORM: Tax Invoice Settings */}
            {activeMobileSection === "tax_invoice" && (
              <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-4 space-y-4 shadow-2xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                      Invoice Prefix
                    </label>
                    <input
                      type="text"
                      value={brandForm.invoice_prefix || ""}
                      onChange={(e) => setBrandForm({ ...brandForm, invoice_prefix: e.target.value })}
                      placeholder="INV-2026-"
                      className="w-full text-xs font-mono p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                      Next Number
                    </label>
                    <input
                      type="number"
                      value={brandForm.next_invoice_number || 1001}
                      onChange={(e) => setBrandForm({ ...brandForm, next_invoice_number: parseInt(e.target.value, 10) || 1 })}
                      className="w-full text-xs font-mono p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                    />
                  </div>
                </div>

                {/* Bank Settlement Details */}
                <div className="space-y-2 pt-2 border-t border-[#F0EBE1]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#C2922E] block font-semibold">
                    Direct Bank &amp; UPI Settlement Details
                  </span>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={brandForm.payment_details?.bank_name || ""}
                      onChange={(e) => setBrandForm({
                        ...brandForm,
                        payment_details: { ...brandForm.payment_details, bank_name: e.target.value }
                      })}
                      placeholder="Bank Name (e.g. HDFC Bank)"
                      className="w-full text-xs font-sans p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                    />
                    <input
                      type="text"
                      value={brandForm.payment_details?.account_number || ""}
                      onChange={(e) => setBrandForm({
                        ...brandForm,
                        payment_details: { ...brandForm.payment_details, account_number: e.target.value }
                      })}
                      placeholder="Account Number"
                      className="w-full text-xs font-mono p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={brandForm.payment_details?.ifsc_code || ""}
                        onChange={(e) => setBrandForm({
                          ...brandForm,
                          payment_details: { ...brandForm.payment_details, ifsc_code: e.target.value }
                        })}
                        placeholder="IFSC Code"
                        className="w-full text-xs font-mono p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                      />
                      <input
                        type="text"
                        value={brandForm.payment_details?.upi_id || ""}
                        onChange={(e) => setBrandForm({
                          ...brandForm,
                          payment_details: { ...brandForm.payment_details, upi_id: e.target.value }
                        })}
                        placeholder="UPI ID"
                        className="w-full text-xs font-mono p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                    Invoice Terms &amp; Conditions
                  </label>
                  <textarea
                    value={brandForm.invoice_terms || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, invoice_terms: e.target.value })}
                    rows={3}
                    placeholder="Bespoke handcrafted pieces. All sales are subject to SUKO atelier exchange policy."
                    className="w-full text-xs font-sans p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                  />
                </div>
              </div>
            )}

            {/* SECTION 3 FORM: Payment Receipt */}
            {activeMobileSection === "receipt" && (
              <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-4 space-y-4 shadow-2xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                      Receipt Prefix
                    </label>
                    <input
                      type="text"
                      value={brandForm.receipt_prefix || ""}
                      onChange={(e) => setBrandForm({ ...brandForm, receipt_prefix: e.target.value })}
                      placeholder="REC-2026-"
                      className="w-full text-xs font-mono p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                      Next Number
                    </label>
                    <input
                      type="number"
                      value={brandForm.next_receipt_number || 1001}
                      onChange={(e) => setBrandForm({ ...brandForm, next_receipt_number: parseInt(e.target.value, 10) || 1 })}
                      className="w-full text-xs font-mono p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                    Receipt Header Note
                  </label>
                  <input
                    type="text"
                    value={brandForm.receipt_header_note || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, receipt_header_note: e.target.value })}
                    placeholder="Electronic Payment Voucher"
                    className="w-full text-xs font-sans p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                    Thank You Message
                  </label>
                  <textarea
                    value={brandForm.receipt_footer_thankyou || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, receipt_footer_thankyou: e.target.value })}
                    rows={3}
                    placeholder="Thank you for trusting SUKO Atelier with your corporate wardrobe."
                    className="w-full text-xs font-sans p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                  />
                </div>
              </div>
            )}

            {/* SECTION 4 FORM: Packing Slip */}
            {activeMobileSection === "packing_slip" && (
              <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-4 space-y-4 shadow-2xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                    Packing Slip Prefix
                  </label>
                  <input
                    type="text"
                    value={brandForm.packing_slip_prefix || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, packing_slip_prefix: e.target.value })}
                    placeholder="PACK-2026-"
                    className="w-full text-xs font-mono p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                  />
                </div>

                {/* Toggles */}
                <div className="space-y-2 pt-2 border-t border-[#F0EBE1]">
                  <label className="flex items-center justify-between p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] cursor-pointer">
                    <span className="text-xs font-sans text-[#111113]">Show Item Prices on Packing Slip</span>
                    <input
                      type="checkbox"
                      checked={brandForm.packing_slip_show_prices || false}
                      onChange={(e) => setBrandForm({ ...brandForm, packing_slip_show_prices: e.target.checked })}
                      className="accent-[#111113] w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] cursor-pointer">
                    <span className="text-xs font-sans text-[#111113]">Show Patron Contact Phone</span>
                    <input
                      type="checkbox"
                      checked={brandForm.packing_slip_show_phone || false}
                      onChange={(e) => setBrandForm({ ...brandForm, packing_slip_show_phone: e.target.checked })}
                      className="accent-[#111113] w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                    Packaging Instructions
                  </label>
                  <textarea
                    value={brandForm.packing_instructions || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, packing_instructions: e.target.value })}
                    rows={3}
                    placeholder="Pack silhouettes in breathable SUKO garment covers with cedar wood hangers."
                    className="w-full text-xs font-sans p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                  />
                </div>
              </div>
            )}

            {/* Sticky Bottom Save Bar */}
            <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#E5DDD1] p-3 px-4 z-40 flex items-center justify-between shadow-lg">
              <button
                type="button"
                onClick={() => setActiveMobileSection(null)}
                className="text-xs font-mono uppercase tracking-wider text-[#746F68] hover:text-[#111113] py-2 px-3 border border-[#E5DDD1] rounded-[2px]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveBrandSettings}
                disabled={savingBrandSettings}
                className="px-6 py-2.5 bg-[#111113] hover:bg-[#C2922E] text-white text-xs font-mono uppercase tracking-wider rounded-[2px] transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {savingBrandSettings ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} className="text-[#C2922E]" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>

      {/* ==================================================================== */}
      {/* 2. DESKTOP INTERFACE (hidden md:block)                               */}
      {/* ==================================================================== */}
      <div className="hidden md:block space-y-8">
        
        {/* Top Section Header */}
        <div className="flex flex-row items-center justify-between gap-4 border-b border-[#E5DDD1] pb-5">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C2922E] font-mono block font-semibold">
              ATELIER IDENTITY &amp; BILLING
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-light text-[#111113] tracking-tight">
              Brand &amp; Documents
            </h2>
            <p className="text-xs text-[#746F68] font-sans">
              Configure brand identity, contact details, GST, and automated document generation across invoices, receipts, and workshop slips.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleResetBrandSettings}
              disabled={savingBrandSettings}
              className="px-3.5 py-2 border border-[#E5DDD1] hover:border-[#111113] bg-white text-xs font-mono tracking-wider uppercase text-[#746F68] hover:text-[#111113] rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Restore initial SUKO Atelier settings"
            >
              <RotateCcw size={13} />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSaveBrandSettings}
              disabled={savingBrandSettings}
              className="px-5 py-2 bg-[#111113] hover:bg-[#C2922E] text-[#FAF8F5] text-xs font-mono uppercase tracking-wider rounded-[2px] transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {savingBrandSettings ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} className="text-[#C2922E]" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Split Grid: 4-Zone Settings Form (Left 7 cols) & Live Luxury Document Preview (Right 5 cols) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Left 7 Columns: Form Configurations */}
          <div className="xl:col-span-7 space-y-6">
            
            {/* CARD 1: BRAND IDENTITY & LOGO */}
            <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-5">
              <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C2922E]" />
                  <h3 className="font-serif text-lg font-normal text-[#111113]">
                    1. Brand Identity &amp; Atelier Emblem
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E877E] bg-[#FAF8F5] px-2 py-0.5 border border-[#E5DDD1] rounded-[2px]">
                  Document Header
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase tracking-[0.14em] font-mono text-[#55514B] block font-medium">
                    Business Name <span className="text-[#C2922E]">*</span>
                  </label>
                  <input
                    type="text"
                    value={brandForm.business_name || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, business_name: e.target.value })}
                    placeholder="e.g. SUKO Atelier"
                    className="w-full text-xs font-sans p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase tracking-[0.14em] font-mono text-[#55514B] block font-medium">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={brandForm.tagline || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, tagline: e.target.value })}
                    placeholder="e.g. Contemporary Indian Corporate Wear"
                    className="w-full text-xs font-sans p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113] transition-colors"
                  />
                </div>
              </div>

              {/* Logo Architecture */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10.5px] uppercase tracking-[0.14em] font-mono text-[#55514B] block font-medium">
                    Atelier Logo (CDN &amp; Local File Support)
                  </label>
                  <span className="text-[10px] text-[#8E877E] font-mono">
                    PNG, JPG, SVG, WebP
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={brandForm.logo_url || ""}
                      onChange={(e) => {
                        setBrandForm({ ...brandForm, logo_url: e.target.value });
                        setBrandLogoPreview(e.target.value);
                      }}
                      placeholder="https://res.cloudinary.com/... or /logo.png"
                      className="w-full text-xs font-mono p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113] transition-colors"
                    />
                  </div>

                  <label className="px-4 py-2.5 bg-[#FAF8F5] hover:bg-[#EFE9DF] border border-[#E5DDD1] text-xs font-mono tracking-wider uppercase text-[#111113] rounded-[2px] transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0">
                    <ImageIcon size={14} className="text-[#C2922E]" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setBrandLogoFile(file);
                          setBrandLogoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* GSTIN & Contact Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase tracking-[0.14em] font-mono text-[#55514B] block font-medium">
                    GSTIN / Tax Registration
                  </label>
                  <input
                    type="text"
                    value={brandForm.gst_number || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, gst_number: e.target.value })}
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    className="w-full text-xs font-mono p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase tracking-[0.14em] font-mono text-[#55514B] block font-medium">
                    Concierge Support Email
                  </label>
                  <input
                    type="email"
                    value={brandForm.support_email || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, support_email: e.target.value })}
                    placeholder="indiancorporatewearbysuko@gmail.com"
                    className="w-full text-xs font-mono p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase tracking-[0.14em] font-mono text-[#55514B] block font-medium">
                    Concierge Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={brandForm.support_phone ?? brandForm.contact_phone ?? ""}
                    onChange={(e) => setBrandForm({ ...brandForm, support_phone: e.target.value, contact_phone: e.target.value })}
                    placeholder="+91 93703 50885"
                    className="w-full text-xs font-mono p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10.5px] uppercase tracking-[0.14em] font-mono text-[#55514B] block font-medium">
                  Studio Flagship Registered Address
                </label>
                <textarea
                  value={brandForm.address || ""}
                  onChange={(e) => setBrandForm({ ...brandForm, address: e.target.value })}
                  rows={2}
                  placeholder="SUKO Atelier Flagship, Bandra Kurla Complex, Mumbai, Maharashtra 400051"
                  className="w-full text-xs font-sans p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113] transition-colors"
                />
              </div>

            </div>

            {/* CARD 2: TAX INVOICE */}
            <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-5">
              <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#111113]" />
                  <h3 className="font-serif text-lg font-normal text-[#111113]">
                    2. Tax Invoice Configuration
                  </h3>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E877E] bg-[#FAF8F5] px-2 py-0.5 border border-[#E5DDD1] rounded-[2px]">
                  Accounting Standard
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase tracking-[0.14em] font-mono text-[#55514B] block font-medium">
                    Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={brandForm.invoice_prefix || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, invoice_prefix: e.target.value })}
                    placeholder="INV-2026-"
                    className="w-full text-xs font-mono p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase tracking-[0.14em] font-mono text-[#55514B] block font-medium">
                    Next Sequence Number
                  </label>
                  <input
                    type="number"
                    value={brandForm.next_invoice_number || 1001}
                    onChange={(e) => setBrandForm({ ...brandForm, next_invoice_number: parseInt(e.target.value, 10) || 1 })}
                    className="w-full text-xs font-mono p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113] transition-colors"
                  />
                </div>
              </div>

              {/* Direct Bank Settlement */}
              <div className="p-4 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#C2922E] block font-semibold">
                  Direct Bank &amp; UPI Settlement Credentials
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={brandForm.payment_details?.bank_name || ""}
                    onChange={(e) => setBrandForm({
                      ...brandForm,
                      payment_details: { ...brandForm.payment_details, bank_name: e.target.value }
                    })}
                    placeholder="Bank Name (e.g. HDFC Bank)"
                    className="text-xs font-sans p-2 bg-white border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                  />
                  <input
                    type="text"
                    value={brandForm.payment_details?.account_number || ""}
                    onChange={(e) => setBrandForm({
                      ...brandForm,
                      payment_details: { ...brandForm.payment_details, account_number: e.target.value }
                    })}
                    placeholder="Account Number"
                    className="text-xs font-mono p-2 bg-white border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                  />
                  <input
                    type="text"
                    value={brandForm.payment_details?.ifsc_code || ""}
                    onChange={(e) => setBrandForm({
                      ...brandForm,
                      payment_details: { ...brandForm.payment_details, ifsc_code: e.target.value }
                    })}
                    placeholder="IFSC Code"
                    className="text-xs font-mono p-2 bg-white border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                  />
                  <input
                    type="text"
                    value={brandForm.payment_details?.upi_id || ""}
                    onChange={(e) => setBrandForm({
                      ...brandForm,
                      payment_details: { ...brandForm.payment_details, upi_id: e.target.value }
                    })}
                    placeholder="UPI ID"
                    className="text-xs font-mono p-2 bg-white border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10.5px] uppercase tracking-[0.14em] font-mono text-[#55514B] block font-medium">
                  Terms &amp; Conditions
                </label>
                <textarea
                  value={brandForm.invoice_terms || ""}
                  onChange={(e) => setBrandForm({ ...brandForm, invoice_terms: e.target.value })}
                  rows={2}
                  className="w-full text-xs font-sans p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                />
              </div>

            </div>

            {/* CARD 3: PAYMENT RECEIPT & PACKING SLIP */}
            <div className="grid grid-cols-2 gap-6">
              {/* Receipt */}
              <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-5 shadow-2xs space-y-4">
                <div className="border-b border-[#F0EBE1] pb-2">
                  <h3 className="font-serif text-base font-normal text-[#111113]">
                    3. Payment Receipt
                  </h3>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={brandForm.receipt_prefix || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, receipt_prefix: e.target.value })}
                    placeholder="Prefix (REC-)"
                    className="w-full text-xs font-mono p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px]"
                  />
                  <input
                    type="text"
                    value={brandForm.receipt_header_note || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, receipt_header_note: e.target.value })}
                    placeholder="Header Note"
                    className="w-full text-xs font-sans p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px]"
                  />
                  <textarea
                    value={brandForm.receipt_footer_thankyou || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, receipt_footer_thankyou: e.target.value })}
                    rows={2}
                    placeholder="Thank You Message"
                    className="w-full text-xs font-sans p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px]"
                  />
                </div>
              </div>

              {/* Packing Slip */}
              <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-5 shadow-2xs space-y-4">
                <div className="border-b border-[#F0EBE1] pb-2">
                  <h3 className="font-serif text-base font-normal text-[#111113]">
                    4. Packing Slip
                  </h3>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={brandForm.packing_slip_prefix || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, packing_slip_prefix: e.target.value })}
                    placeholder="Prefix (PACK-)"
                    className="w-full text-xs font-mono p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px]"
                  />
                  <label className="flex items-center justify-between p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] text-xs cursor-pointer">
                    <span>Show Prices</span>
                    <input
                      type="checkbox"
                      checked={brandForm.packing_slip_show_prices || false}
                      onChange={(e) => setBrandForm({ ...brandForm, packing_slip_show_prices: e.target.checked })}
                      className="accent-[#111113]"
                    />
                  </label>
                  <textarea
                    value={brandForm.packing_instructions || ""}
                    onChange={(e) => setBrandForm({ ...brandForm, packing_instructions: e.target.value })}
                    rows={2}
                    placeholder="Packaging QA Instructions"
                    className="w-full text-xs font-sans p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px]"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right 5 Columns: Live Luxury Document Preview */}
          <div className="xl:col-span-5 space-y-4 sticky top-20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C2922E] block font-semibold">
                  LIVE DOCUMENT PREVIEW
                </span>
                <h3 className="font-serif text-xl font-normal text-[#111113]">
                  Document Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={handleDownloadSample}
                className="px-3 py-1.5 bg-[#111113] hover:bg-[#C2922E] text-white text-xs font-mono uppercase rounded-[2px] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download size={13} className="text-[#C2922E]" />
                <span>Sample PDF</span>
              </button>
            </div>

            {/* Document Tabs */}
            <div className="flex p-0.5 bg-white border border-[#E5DDD1] rounded-[3px]">
              <button
                type="button"
                onClick={() => setPreviewDocType("invoice")}
                className={`flex-1 py-1.5 text-xs font-mono tracking-wider uppercase rounded-[2px] transition-all cursor-pointer text-center ${
                  previewDocType === "invoice"
                    ? "bg-[#111113] text-white font-semibold shadow-xs"
                    : "text-[#746F68] hover:text-[#111113]"
                }`}
              >
                Invoice
              </button>
              <button
                type="button"
                onClick={() => setPreviewDocType("receipt")}
                className={`flex-1 py-1.5 text-xs font-mono tracking-wider uppercase rounded-[2px] transition-all cursor-pointer text-center ${
                  previewDocType === "receipt"
                    ? "bg-[#111113] text-white font-semibold shadow-xs"
                    : "text-[#746F68] hover:text-[#111113]"
                }`}
              >
                Receipt
              </button>
              <button
                type="button"
                onClick={() => setPreviewDocType("packing_slip")}
                className={`flex-1 py-1.5 text-xs font-mono tracking-wider uppercase rounded-[2px] transition-all cursor-pointer text-center ${
                  previewDocType === "packing_slip"
                    ? "bg-[#111113] text-white font-semibold shadow-xs"
                    : "text-[#746F68] hover:text-[#111113]"
                }`}
              >
                Packing
              </button>
            </div>

            {/* Live Paper Canvas */}
            <div
              data-lenis-prevent="true"
              data-lenis-prevent-wheel="true"
              data-lenis-prevent-touch="true"
              onWheel={(e) => e.stopPropagation()}
              className="bg-white border border-[#E5DDD1] rounded-[3px] p-6 shadow-md text-[#111113] font-sans space-y-5 max-h-[75vh] overflow-y-auto suko-scrollbar"
            >
              <div className="text-center space-y-1 pb-2">
                <BrandLogoPreviewEmblem
                  src={brandLogoPreview || brandForm.logo_url}
                  name={brandForm.business_name}
                  className="h-10 w-auto"
                />
                <div className="font-serif text-lg font-normal tracking-[0.24em] text-[#111113] uppercase pt-1">
                  {brandForm.business_name || "SUKO ATELIER"}
                </div>
                {brandForm.tagline && (
                  <div className="font-mono text-[9px] tracking-[0.16em] uppercase text-[#8E877E]">
                    {brandForm.tagline}
                  </div>
                )}
                <div className="h-[1.5px] w-10 bg-[#C2922E] mx-auto mt-2" />
              </div>

              <div className="h-[1px] bg-[#EAE6DF] w-full" />

              <div className="flex items-start justify-between text-xs">
                <div>
                  <span className="inline-block px-2 py-0.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] font-mono text-[9px] font-bold tracking-wider uppercase text-[#C2922E] mb-1">
                    {previewDocType === "packing_slip" ? "PACKING SLIP" : (previewDocType === "receipt" ? "PAYMENT RECEIPT" : "TAX INVOICE")}
                  </span>
                  <div className="font-serif text-base text-[#111113]">
                    {brandForm.invoice_prefix || "INV-2026-"}1001
                  </div>
                </div>
                <div className="text-right font-mono text-[10px] text-[#746F68]">
                  Order: #SUKO-1001
                  {brandForm.gst_number && (
                    <div className="text-[#111113] font-semibold mt-0.5">GST: {brandForm.gst_number}</div>
                  )}
                  <div className="text-[#8E877E] mt-0.5">
                    WhatsApp: {brandForm.support_phone || brandForm.contact_phone || "+91 93703 50885"}
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="pt-2 border-t border-[#ECE7DE]">
                <div className="flex justify-between text-xs font-serif text-[#111113]">
                  <span>Savile Double-Breasted Blazer (M &bull; Obsidian)</span>
                  {previewDocType !== "packing_slip" ? (
                    <span className="font-mono font-bold">₹4,800.00</span>
                  ) : (
                    <span className="font-mono text-emerald-700 font-semibold">✓ Verified</span>
                  )}
                </div>
              </div>

              {previewDocType !== "packing_slip" && (
                <div className="pt-3 border-t border-[#D5CEBF] flex justify-between items-center text-xs font-bold text-[#111113]">
                  <span className="font-mono uppercase text-[10px]">Total Amount</span>
                  <span className="font-mono text-sm">₹4,800.00</span>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
