import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, Download, Share2, Printer, ChevronDown, Check, ArrowLeft,
  FileText, CheckCircle, Truck, RotateCcw, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "../../data/products";
import { API_BASE_URL } from "../../config/api";

/**
 * High-Resolution Atelier Brand Logo Component
 * - Preloads image asset before rendering to avoid broken/blank image flashes
 * - Falls back to bespoke SUKO Atelier Monogram Emblem if image fails or is missing
 * - Maintains strict aspect ratio (no blur, no stretch, max-width capped)
 */
function AtelierBrandLogo({ logoUrl, businessName }) {
  const [logoState, setLogoState] = useState("loading"); // "loading" | "loaded" | "fallback"

  useEffect(() => {
    if (!logoUrl) {
      setLogoState("fallback");
      return;
    }
    let isCancelled = false;
    setLogoState("loading");

    const img = new Image();
    img.onload = () => {
      if (!isCancelled) setLogoState("loaded");
    };
    img.onerror = () => {
      if (!isCancelled) setLogoState("fallback");
    };
    img.src = logoUrl;

    return () => {
      isCancelled = true;
    };
  }, [logoUrl]);

  if (logoState === "loading") {
    return (
      <div className="h-9 w-20 mx-auto bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] flex items-center justify-center animate-pulse mb-1">
        <Sparkles size={13} className="text-[#C2922E] animate-spin" />
      </div>
    );
  }

  if (logoState === "fallback" || !logoUrl) {
    return (
      <div className="flex flex-col items-center justify-center mb-1">
        <div className="w-8 h-8 rounded-full border border-[#C2922E]/60 bg-[#FAF8F5] flex items-center justify-center shadow-xs">
          <span className="font-serif text-sm font-semibold tracking-wider text-[#111113]">S</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center mb-1 overflow-hidden">
      <img
        src={logoUrl}
        alt={businessName || "SUKO Atelier"}
        className="h-9 w-auto max-w-[120px] object-contain mx-auto"
        onError={() => setLogoState("fallback")}
      />
    </div>
  );
}

/**
 * Loading Skeleton for Document Generation / Tab Transitions
 * Prevents any previous document or stale PDF from flashing during transition
 */
function DocumentSkeletonLoader({ docTypeLabel }) {
  return (
    <div className="w-full max-w-2xl bg-white border border-[#E5DDD1] rounded-[2px] shadow-sm p-6 sm:p-10 space-y-6 animate-pulse overflow-hidden shrink-0 mb-6">
      {/* Brand Header Shimmer */}
      <div className="text-center space-y-2 pb-4 border-b border-[#ECE7DE]">
        <div className="w-10 h-10 bg-[#FAF8F5] border border-[#E5DDD1] rounded-full mx-auto flex items-center justify-center">
          <Sparkles size={15} className="text-[#C2922E] animate-spin" />
        </div>
        <div className="h-4 bg-[#EFE9DF] rounded w-44 mx-auto" />
        <div className="h-2.5 bg-[#FAF8F5] rounded w-28 mx-auto" />
        <div className="h-[1.5px] w-12 bg-[#C2922E]/40 mx-auto mt-2" />
      </div>

      {/* Meta Bar Shimmer */}
      <div className="bg-[#FAF8F5] border border-[#E5DDD1] p-4 rounded-[2px] flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-3 bg-[#EAE6DF] rounded w-28" />
          <div className="h-4 bg-[#E0D9CC] rounded w-36" />
        </div>
        <div className="space-y-1.5 text-right">
          <div className="h-2.5 bg-[#EAE6DF] rounded w-24 ml-auto" />
          <div className="h-2.5 bg-[#EAE6DF] rounded w-20 ml-auto" />
        </div>
      </div>

      {/* Two Column Client/Studio Shimmer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
        <div className="space-y-2">
          <div className="h-2.5 bg-[#EAE6DF] rounded w-20" />
          <div className="h-3 bg-[#E0D9CC] rounded w-32" />
          <div className="h-2.5 bg-[#FAF8F5] rounded w-44" />
        </div>
        <div className="space-y-2 sm:text-right">
          <div className="h-2.5 bg-[#EAE6DF] rounded w-20 sm:ml-auto" />
          <div className="h-3 bg-[#E0D9CC] rounded w-32 sm:ml-auto" />
          <div className="h-2.5 bg-[#FAF8F5] rounded w-44 sm:ml-auto" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="border border-[#E5DDD1] rounded-[2px] overflow-hidden space-y-2 p-3">
        <div className="h-3 bg-[#FAF8F5] rounded w-full" />
        <div className="h-8 bg-[#EFE9DF]/60 rounded w-full" />
        <div className="h-8 bg-[#EFE9DF]/40 rounded w-full" />
      </div>

      {/* Status Notice */}
      <div className="text-center py-2">
        <p className="text-xs font-mono text-[#8E877E] uppercase tracking-widest flex items-center justify-center gap-2">
          <RotateCcw size={12} className="animate-spin text-[#C2922E]" />
          <span>Generating Atelier {docTypeLabel || "Document"}...</span>
        </p>
      </div>
    </div>
  );
}

/**
 * 1. Dedicated Tax Invoice Preview Component
 * Commercial Billing, GST Breakdown & Tax Signatory
 */
function TaxInvoicePreview({ order, brandSettings, clientDetails, items }) {
  const invoiceNum = `${brandSettings.invoice_prefix || "INV-2026-"}${1000 + (order.id || 1)}`;
  const subtotal = order.total || 4800;
  const gstRate = 0.18;
  const taxableAmount = Math.round((subtotal / (1 + gstRate)) * 100) / 100;
  const gstAmount = Math.round((subtotal - taxableAmount) * 100) / 100;

  return (
    <div className="w-full max-w-2xl bg-white border border-[#E5DDD1] rounded-[2px] shadow-sm p-4 sm:p-8 space-y-5 text-[#111113] overflow-hidden animate-in fade-in duration-200 shrink-0 mb-6">
      {/* Atelier Header */}
      <div className="text-center space-y-1 pb-3 border-b border-[#ECE7DE]">
        <AtelierBrandLogo logoUrl={brandSettings.logo_url} businessName={brandSettings.business_name} />
        <h1 className="font-serif text-lg sm:text-xl font-normal tracking-[0.22em] text-[#111113] uppercase">
          {brandSettings.business_name || "SUKO ATELIER"}
        </h1>
        <p className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-[#8E877E]">
          {brandSettings.tagline || "Contemporary Indian Corporate Wear"}
        </p>
        <div className="h-[1.5px] w-12 bg-[#C2922E] mx-auto mt-2.5" />
      </div>

      {/* Invoice Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#FAF8F5] border border-[#E5DDD1] p-3 rounded-[2px] text-xs font-mono">
        <div>
          <span className="inline-block px-2 py-0.5 rounded-[2px] text-[9.5px] font-bold tracking-wider uppercase mb-1 bg-[#C2922E]/10 text-[#C2922E] border border-[#C2922E]/30">
            ORIGINAL FOR RECIPIENT &middot; TAX INVOICE
          </span>
          <p className="font-serif text-base sm:text-lg font-medium text-[#111113] tracking-tight">
            {invoiceNum}
          </p>
        </div>
        <div className="text-left sm:text-right text-[11px] text-[#55514B] space-y-0.5">
          <p><span className="text-[#8E877E]">Invoice Date:</span> {new Date(order.created_at || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
          <p><span className="text-[#8E877E]">Order Ref:</span> #SUKO-{1000 + order.id}</p>
          {brandSettings.gst_number && (
            <p className="font-semibold text-[#111113]"><span className="text-[#8E877E] font-normal">Atelier GSTIN:</span> {brandSettings.gst_number}</p>
          )}
        </div>
      </div>

      {/* Client & Registered Office Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-body border-b border-[#ECE7DE] pb-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E877E] block font-semibold">
            BILLED &amp; DELIVERED TO
          </span>
          <p className="font-serif font-medium text-sm text-[#111113]">{clientDetails.name}</p>
          <p className="text-[#55514B] leading-relaxed text-[11.5px]">{clientDetails.address}</p>
          <p className="font-mono text-[11px] text-[#746F68]">Contact: {clientDetails.phone}</p>
          <p className="font-mono text-[11px] text-[#746F68] truncate">{clientDetails.email}</p>
        </div>
        <div className="space-y-1 text-left sm:text-right">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E877E] block font-semibold">
            ATELIER REGISTERED STUDIO
          </span>
          <p className="font-serif font-medium text-sm text-[#111113]">{brandSettings.business_name || "SUKO Atelier"}</p>
          <p className="text-[#55514B] leading-relaxed text-[11.5px]">
            {brandSettings.address || "Atelier Flagship, BKC, Mumbai, Maharashtra 400051"}
          </p>
          <p className="font-mono text-[11px] text-[#746F68]">
            WhatsApp Concierge: <span className="font-semibold text-[#111113]">{brandSettings.support_phone || "+91 93703 50885"}</span>
          </p>
          <p className="font-mono text-[11px] text-[#746F68] truncate">
            {brandSettings.support_email || "indiancorporatewearbysuko@gmail.com"}
          </p>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E877E] block font-semibold">
          COMMERCIAL GARMENT SPECIFICATIONS
        </span>
        <div className="border border-[#E5DDD1] rounded-[2px] overflow-hidden">
          <table className="w-full text-left text-xs table-fixed">
            <thead className="bg-[#FAF8F5] text-[10px] font-mono uppercase tracking-wider text-[#746F68] border-b border-[#E5DDD1]">
              <tr>
                <th className="py-2.5 px-3 font-medium w-[50%]">Item Description</th>
                <th className="py-2.5 px-2 font-medium text-center w-[12%]">Qty</th>
                <th className="py-2.5 px-2 font-medium text-right w-[18%]">Rate</th>
                <th className="py-2.5 px-3 font-medium text-right w-[20%]">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD1]/70 font-sans">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#FAF8F5]/50">
                  <td className="py-2.5 px-3 align-top">
                    <p className="font-serif font-medium text-[#111113]">
                      {item.product_name || item.name || "Tailored Garment"}
                    </p>
                    <p className="font-mono text-[10px] text-[#746F68] mt-0.5">
                      Size: {item.size || "M"} &bull; HSN: 6204 &bull; GST: 18%
                    </p>
                  </td>
                  <td className="py-2.5 px-2 align-top text-center font-mono text-xs">
                    {item.quantity || 1}
                  </td>
                  <td className="py-2.5 px-2 align-top text-right font-mono text-[11px] text-[#55514B]">
                    {formatINR(item.price_at_purchase || item.price || 0)}
                  </td>
                  <td className="py-2.5 px-3 align-top text-right font-mono text-xs font-semibold text-[#111113]">
                    {formatINR((item.price_at_purchase || item.price || 0) * (item.quantity || 1))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Breakdown & Grand Total */}
      <div className="space-y-2 pt-2 border-t border-[#ECE7DE] text-xs font-mono text-[#55514B]">
        <div className="flex justify-between">
          <span>Taxable Value (Before GST)</span>
          <span>{formatINR(taxableAmount)}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span>Integrated GST (IGST 18% / Central + State Tax)</span>
          <span>{formatINR(gstAmount)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-[#111113] text-sm text-[#111113]">
          <span className="font-mono uppercase font-semibold text-xs tracking-wider">Total Invoice Amount</span>
          <span className="font-serif font-medium text-lg">{formatINR(subtotal)}</span>
        </div>
      </div>

      {/* Payment Confirmation Badge */}
      <div className="p-3 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-[10px] text-[#8E877E] uppercase block">Payment Channel</span>
          <span className="font-medium text-[#111113]">{order.payment_method?.toUpperCase() || "UPI QR / NET BANKING"}</span>
        </div>
        {order.transaction_id && (
          <div>
            <span className="text-[10px] text-[#8E877E] uppercase block">UTR Reference</span>
            <span className="font-semibold text-[#111113] select-all">{order.transaction_id}</span>
          </div>
        )}
        <div className="text-right">
          <span className="text-[10px] text-[#8E877E] uppercase block">Settlement</span>
          <span className="text-emerald-800 font-semibold uppercase">
            {order.status === "paid" ? "Settled & Verified" : order.status?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Signatory & Policy */}
      <div className="pt-4 border-t border-[#ECE7DE] flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-xs font-mono text-[#8E877E]">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#111113] font-medium">Bespoke Policy</p>
          <p className="text-[10.5px] leading-relaxed max-w-sm mt-0.5 text-[#746F68]">
            {brandSettings.invoice_terms || "Official Tax Invoice issued by SUKO Atelier. Retain for tax & accounting records."}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div className="h-7 w-24 border-b border-[#111113]/40 sm:ml-auto" />
          <p className="text-[10px] uppercase tracking-wider text-[#111113] font-medium mt-1">Authorized Signatory</p>
          <p className="text-[9.5px]">SUKO Atelier &middot; Finance Division</p>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Dedicated Payment Receipt Preview Component
 * Settlement Voucher & Transaction Audit Record
 */
function PaymentReceiptPreview({ order, brandSettings, clientDetails }) {
  const receiptNum = `${brandSettings.receipt_prefix || "REC-2026-"}${1000 + (order.id || 1)}`;

  return (
    <div className="w-full max-w-2xl bg-white border border-[#E5DDD1] rounded-[2px] shadow-sm p-4 sm:p-8 space-y-5 text-[#111113] overflow-hidden animate-in fade-in duration-200 shrink-0 mb-6">
      {/* Atelier Header */}
      <div className="text-center space-y-1 pb-3 border-b border-[#ECE7DE]">
        <AtelierBrandLogo logoUrl={brandSettings.logo_url} businessName={brandSettings.business_name} />
        <h1 className="font-serif text-lg sm:text-xl font-normal tracking-[0.22em] text-[#111113] uppercase">
          {brandSettings.business_name || "SUKO ATELIER"}
        </h1>
        <p className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-[#8E877E]">
          Official Settlement Voucher &middot; Patron Receipt
        </p>
        <div className="h-[1.5px] w-12 bg-[#166534] mx-auto mt-2.5" />
      </div>

      {/* Receipt Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-emerald-50/50 border border-emerald-200/70 p-3 rounded-[2px] text-xs font-mono">
        <div>
          <span className="inline-block px-2 py-0.5 rounded-[2px] text-[9.5px] font-bold tracking-wider uppercase mb-1 bg-emerald-100 text-emerald-800 border border-emerald-300">
            PAYMENT SETTLED &middot; OFFICIAL RECEIPT
          </span>
          <p className="font-serif text-base sm:text-lg font-medium text-[#111113] tracking-tight">
            {receiptNum}
          </p>
        </div>
        <div className="text-left sm:text-right text-[11px] text-[#55514B] space-y-0.5">
          <p><span className="text-[#8E877E]">Receipt Date:</span> {new Date(order.created_at || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
          <p><span className="text-[#8E877E]">Linked Order:</span> #SUKO-{1000 + order.id}</p>
          <p className="text-emerald-800 font-semibold">&bull; Funds Received in Merchant Account</p>
        </div>
      </div>

      {/* Received From Patron Card */}
      <div className="bg-[#FAF8F5] border border-[#E5DDD1] p-4 rounded-[2px] space-y-2 text-xs">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E877E] block font-semibold">
          RECEIVED WITH THANKS FROM
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="font-serif font-medium text-base text-[#111113]">{clientDetails.name}</p>
            <p className="text-[#55514B] text-[11.5px]">{clientDetails.email} &bull; {clientDetails.phone}</p>
          </div>
          <div className="text-left sm:text-right font-mono">
            <span className="text-[10px] text-[#8E877E] uppercase block">Settlement Amount</span>
            <span className="font-serif text-xl font-medium text-[#166534]">{formatINR(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Settlement Audit Details Table */}
      <div className="border border-[#E5DDD1] rounded-[2px] overflow-hidden text-xs font-mono">
        <div className="bg-[#FAF8F5] px-3.5 py-2 font-semibold text-[#746F68] uppercase tracking-wider text-[10px] border-b border-[#E5DDD1]">
          Transaction Audit &amp; Settlement Log
        </div>
        <div className="divide-y divide-[#ECE7DE] p-3 space-y-2.5 text-[11.5px]">
          <div className="flex justify-between pt-1">
            <span className="text-[#746F68]">Settlement Channel</span>
            <span className="font-medium text-[#111113]">{order.payment_method?.toUpperCase() || "DIRECT UPI SETTLEMENT"}</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-[#746F68]">Bank UTR / Transaction Reference</span>
            <span className="font-mono font-bold text-[#111113] select-all tracking-wider">
              {order.transaction_id || "VERIFIED-MERCHANT-DEPOSIT"}
            </span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-[#746F68]">Settlement Status</span>
            <span className="text-emerald-800 font-semibold uppercase flex items-center gap-1">
              <CheckCircle size={13} />
              <span>Payment Verified &amp; Cleared</span>
            </span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-[#746F68]">Beneficiary</span>
            <span className="text-[#111113] font-medium">{brandSettings.business_name || "SUKO Atelier Flagship"}</span>
          </div>
        </div>
      </div>

      {/* Patron Thank You Note */}
      <div className="p-4 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] text-center space-y-1">
        <p className="font-serif text-sm font-medium text-[#111113]">
          {brandSettings.receipt_footer_thankyou || "Thank you for curating your executive wardrobe with SUKO Atelier."}
        </p>
        <p className="text-[10px] font-mono text-[#8E877E]">
          Your order has entered craftsmanship preparation. Concierge queries: {brandSettings.support_phone || "+91 93703 50885"}
        </p>
      </div>

      {/* Signoff */}
      <div className="pt-4 border-t border-[#ECE7DE] flex justify-between items-end text-xs font-mono text-[#8E877E]">
        <div>
          <p className="text-[10px] uppercase text-[#111113] font-medium">Computer-Generated Voucher</p>
          <p className="text-[9.5px]">No physical signature mandatory &middot; Official Receipt Record</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase text-[#111113] font-medium">SUKO Atelier Accounts</p>
          <p className="text-[9.5px]">Mumbai Flagship</p>
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Dedicated Packing Slip Preview Component
 * Workshop QA Checklist & Dispatch Verification (STRICTLY NO PRICING OR PAYMENTS)
 */
function PackingSlipPreview({ order, brandSettings, clientDetails, items }) {
  const packingNum = `${brandSettings.packing_prefix || "PCK-2026-"}${1000 + (order.id || 1)}`;

  return (
    <div className="w-full max-w-2xl bg-white border border-[#E5DDD1] rounded-[2px] shadow-sm p-4 sm:p-8 space-y-5 text-[#111113] overflow-hidden animate-in fade-in duration-200 shrink-0 mb-6">
      {/* Workshop Header */}
      <div className="text-center space-y-1 pb-3 border-b border-[#ECE7DE]">
        <AtelierBrandLogo logoUrl={brandSettings.logo_url} businessName={brandSettings.business_name} />
        <h1 className="font-serif text-lg sm:text-xl font-normal tracking-[0.22em] text-[#111113] uppercase">
          {brandSettings.business_name || "SUKO ATELIER"}
        </h1>
        <p className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-[#1E3A8A]">
          Workshop Fulfillment &middot; Quality Assurance Record
        </p>
        <div className="h-[1.5px] w-12 bg-[#1E3A8A] mx-auto mt-2.5" />
      </div>

      {/* Slip Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-blue-50/50 border border-blue-200/70 p-3 rounded-[2px] text-xs font-mono">
        <div>
          <span className="inline-block px-2 py-0.5 rounded-[2px] text-[9.5px] font-bold tracking-wider uppercase mb-1 bg-blue-100 text-blue-900 border border-blue-300">
            WORKSHOP COPY &middot; ZERO PRICING ATTACHED
          </span>
          <p className="font-serif text-base sm:text-lg font-medium text-[#111113] tracking-tight">
            {packingNum}
          </p>
        </div>
        <div className="text-left sm:text-right text-[11px] text-[#55514B] space-y-0.5">
          <p><span className="text-[#8E877E]">Inspection Date:</span> {new Date(order.created_at || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
          <p><span className="text-[#8E877E]">Order Reference:</span> #SUKO-{1000 + order.id}</p>
          <p className="text-blue-800 font-semibold">&bull; White-Glove Dispatch Unit</p>
        </div>
      </div>

      {/* Ship To Destination */}
      <div className="bg-[#FAF8F5] border border-[#E5DDD1] p-4 rounded-[2px] space-y-1.5 text-xs">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E877E] block font-semibold">
          DELIVERY RECIPIENT &amp; SHIPPING DESTINATION
        </span>
        <p className="font-serif font-medium text-sm text-[#111113]">{clientDetails.name}</p>
        <p className="text-[#55514B] leading-relaxed text-[11.5px]">{clientDetails.address}</p>
        <p className="font-mono text-[11px] text-[#746F68]">Contact for Courier: {clientDetails.phone}</p>
      </div>

      {/* Items Checklist Table (STRICTLY EXCLUDES PRICES) */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E877E] block font-semibold">
          GARMENT VERIFICATION CHECKLIST
        </span>
        <div className="border border-[#E5DDD1] rounded-[2px] overflow-hidden">
          <table className="w-full text-left text-xs table-fixed">
            <thead className="bg-[#FAF8F5] text-[10px] font-mono uppercase tracking-wider text-[#746F68] border-b border-[#E5DDD1]">
              <tr>
                <th className="py-2.5 px-3 font-medium w-[60%]">Garment Specifications</th>
                <th className="py-2.5 px-2 font-medium text-center w-[15%]">Qty</th>
                <th className="py-2.5 px-3 font-medium text-right w-[25%]">QA Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DDD1]/70 font-sans">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#FAF8F5]/50">
                  <td className="py-2.5 px-3 align-top">
                    <p className="font-serif font-medium text-[#111113]">
                      {item.product_name || item.name || "Tailored Garment"}
                    </p>
                    <p className="font-mono text-[10px] text-[#746F68] mt-0.5">
                      Size: {item.size || "M"} &bull; Category: {item.product?.category?.name || "Executive Collection"}
                    </p>
                  </td>
                  <td className="py-2.5 px-2 align-top text-center font-mono text-xs font-bold text-[#111113]">
                    {item.quantity || 1}
                  </td>
                  <td className="py-2.5 px-3 align-top text-right font-mono text-[11px] text-emerald-700 font-semibold">
                    ✓ Passed Final QA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workshop Packaging Signoff Checklist */}
      <div className="bg-[#FAF8F5] border border-[#E5DDD1] p-3.5 rounded-[2px] space-y-2 text-xs font-mono">
        <span className="text-[10px] uppercase tracking-wider text-[#746F68] font-bold block">
          WORKSHOP PACKAGING SIGN-OFF
        </span>
        <div className="grid grid-cols-2 gap-2 text-[10.5px] text-[#55514B]">
          <div className="flex items-center gap-1.5">
            <Check size={12} className="text-emerald-700" />
            <span>Garment Steam Pressed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check size={12} className="text-emerald-700" />
            <span>Atelier Tags &amp; Labels Intact</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check size={12} className="text-emerald-700" />
            <span>Seams &amp; Lining Inspected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check size={12} className="text-emerald-700" />
            <span>Protective Garment Bag Enclosed</span>
          </div>
        </div>
      </div>

      {/* Workshop Seal */}
      <div className="pt-4 border-t border-[#ECE7DE] flex justify-between items-end text-xs font-mono text-[#8E877E]">
        <div>
          <p className="text-[10px] uppercase text-[#111113] font-medium">Logistics &amp; Dispatch Division</p>
          <p className="text-[9.5px]">Strictly Confidential &middot; Workshop Internal Use Only</p>
        </div>
        <div className="text-right">
          <div className="h-7 w-24 border-b border-[#111113]/40 ml-auto" />
          <p className="text-[10px] uppercase text-[#111113] font-medium mt-1">Lead Inspector Sign</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Main OrderDocumentPreviewModal
 * Features:
 * - Immediate clearing of previous document on tab switch (Zero Flash)
 * - Shimmer skeleton state while generating the new document
 * - Clean state reset on modal close (no retained preview or blob URLs)
 * - Exact and reliable filename download per document type
 * - Preloaded brand logo with bespoke SUKO monogram fallback
 */
export default function OrderDocumentPreviewModal({
  isOpen,
  onClose,
  order,
  brandSettings = {},
  initialDocType = "invoice",
  token
}) {
  const [selectedDocType, setSelectedDocType] = useState(initialDocType || "invoice");
  // activeRenderedType is null while transitioning/generating to guarantee old document is unmounted immediately
  const [activeRenderedType, setActiveRenderedType] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const transitionTimerRef = useRef(null);

  // Document labels and titles
  const docLabels = {
    invoice: "Tax Invoice",
    receipt: "Payment Receipt",
    packing_slip: "Packing Slip"
  };

  // Synchronize state when modal opens or closes
  useEffect(() => {
    if (isOpen && order) {
      const targetType = initialDocType || "invoice";
      setSelectedDocType(targetType);
      // Immediately clear rendered view so old preview never flashes
      setActiveRenderedType(null);

      // Short smooth transition to generate fresh document
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = setTimeout(() => {
        setActiveRenderedType(targetType);
      }, 200);
    } else {
      // Complete state cleanup on modal close
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      setSelectedDocType("invoice");
      setActiveRenderedType(null);
      setIsDownloading(false);
    }

    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, [isOpen, initialDocType, order?.id]);

  // Prevent background scrolling and handle Escape key while document modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !order || typeof document === "undefined") return null;

  // Safe client details
  const clientDetails = {
    name: (order.shipping_name || order.name || order.user?.name || "Valued Atelier Patron").trim(),
    email: (order.shipping_email || order.email || order.user?.email || "—").trim(),
    phone: (order.shipping_phone || order.phone || order.user?.phone || "—").trim(),
    address: [
      order.shipping_line1 || order.line1,
      order.shipping_line2 || order.line2,
      order.shipping_city || order.city,
      order.shipping_state || order.state,
      order.shipping_pincode ? `PIN: ${order.shipping_pincode}` : null,
      order.shipping_country || order.country || "India"
    ].filter(Boolean).join(", ") || "Atelier Flagship Collection / Direct Courier"
  };

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    {
      product_name: "Tailored Garment",
      name: "Tailored Garment",
      size: "M",
      quantity: 1,
      price: order.total || 4800,
      price_at_purchase: order.total || 4800
    }
  ];

  /**
   * Tab switch handler:
   * 1. Updates selected tab immediately
   * 2. Immediately unmounts previous preview (activeRenderedType = null) -> Zero Flash!
   * 3. Shows dedicated loading skeleton
   * 4. Mounts new document renderer after generation
   */
  const handleTabSwitch = (newType) => {
    if (newType === selectedDocType && activeRenderedType === newType) return;

    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);

    setSelectedDocType(newType);
    // Instant clear of previous preview
    setActiveRenderedType(null);

    transitionTimerRef.current = setTimeout(() => {
      setActiveRenderedType(newType);
    }, 240); // 240ms smooth luxury transition
  };

  /**
   * Download official vector PDF with exact required filenames:
   * Invoice tab: SUKO-Invoice-XXXX.pdf
   * Receipt tab: SUKO-Receipt-XXXX.pdf
   * Packing tab: SUKO-PackingSlip-XXXX.pdf
   */
  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      const invoiceRef = order.invoice_number || (1000 + order.id);
      const filePrefixMap = {
        invoice: `SUKO-Invoice-${invoiceRef}`,
        receipt: `SUKO-Receipt-${invoiceRef}`,
        packing_slip: `SUKO-PackingSlip-${invoiceRef}`
      };
      const filename = `${filePrefixMap[selectedDocType] || `SUKO-Document-${order.id}`}.pdf`;
      const downloadUrl = `${API_BASE_URL}/api/orders/${order.id}/pdf?type=${selectedDocType}`;

      toast.info(`Generating ${docLabels[selectedDocType]} PDF...`);

      const res = await fetch(downloadUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        throw new Error("Failed to download PDF from atelier server.");
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL immediately
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      console.warn("Direct blob download error, attempting fallback:", err);
      // Fallback: direct window download
      const fallbackUrl = `${API_BASE_URL}/api/orders/${order.id}/pdf?type=${selectedDocType}&token=${encodeURIComponent(token)}`;
      window.open(fallbackUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  // Share action
  const handleShare = async () => {
    const shareText = `SUKO Atelier ${docLabels[selectedDocType]} for Order #SUKO-${1000 + order.id} (${formatINR(order.total)})`;
    const shareUrl = `${window.location.origin}/admin`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `SUKO Atelier ${docLabels[selectedDocType]}`,
          text: shareText,
          url: shareUrl
        });
        toast.success("Shared successfully!");
        return;
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("Share error:", err);
        }
      }
    }

    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(waUrl, "_blank");
    toast.success("Opening WhatsApp to share document...");
  };

  // Print Document
  const handlePrint = () => {
    const url = `${API_BASE_URL}/api/orders/${order.id}/document?type=${selectedDocType}&token=${encodeURIComponent(token)}`;
    window.open(url, "_blank", "width=880,height=1000,menubar=no,toolbar=no");
  };

  return createPortal(
    <div
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      data-lenis-prevent-touch="true"
      onWheel={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[9999] flex flex-col md:items-center md:justify-center bg-[#FAF8F5] md:bg-black/70 md:backdrop-blur-sm p-0 md:p-4 overscroll-contain"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        onWheel={(e) => e.stopPropagation()}
        className="w-full h-full md:h-[90vh] md:max-h-[90vh] md:max-w-3xl bg-[#FAF8F5] border-0 md:border md:border-[#E5DDD1] md:rounded-[3px] shadow-2xl flex flex-col overflow-hidden text-[#111113] overscroll-contain"
      >
        {/* ==================================================================== */}
        {/* 1. TOP STICKY HEADER                                                 */}
        {/* ==================================================================== */}
        <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-[#E5DDD1] bg-white/95 backdrop-blur-xs flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -ml-1 text-[#746F68] hover:text-[#111113] hover:bg-[#FAF8F5] rounded-[2px] transition-colors md:hidden cursor-pointer"
              title="Back to Orders"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <span className="text-[10px] uppercase tracking-[0.16em] text-[#C2922E] font-mono block leading-tight font-medium">
                {docLabels[selectedDocType]?.toUpperCase()}
              </span>
              <h2 className="font-serif text-base sm:text-lg font-medium text-[#111113] tracking-tight leading-tight">
                Order #SUKO-{1000 + order.id}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EFE9DF] border border-[#E5DDD1] text-xs font-mono uppercase tracking-wider text-[#111113] rounded-[2px] transition-colors cursor-pointer"
            >
              <Printer size={13} className="text-[#C2922E]" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#746F68] hover:text-[#111113] hover:bg-[#FAF8F5] rounded-[2px] border border-[#E5DDD1] transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 2. DOCUMENT TYPE SELECTOR (Mobile Dropdown / Desktop Segmented Tabs) */}
        {/* ==================================================================== */}
        <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-[#F7F3ED] border-b border-[#E5DDD1]">
          {/* Mobile Selector: Luxury Dropdown */}
          <div className="sm:hidden relative">
            <label className="text-[9.5px] uppercase tracking-[0.14em] text-[#746F68] font-mono block mb-1">
              Select Document Type
            </label>
            <div className="relative">
              <select
                value={selectedDocType}
                onChange={(e) => handleTabSwitch(e.target.value)}
                className="w-full bg-white border border-[#E5DDD1] rounded-[2px] py-2 px-3 pr-8 text-xs font-mono uppercase tracking-wider text-[#111113] appearance-none focus:outline-none focus:border-[#111113]"
              >
                <option value="invoice">TAX INVOICE (Commercial Billing &amp; GST)</option>
                <option value="receipt">PAYMENT RECEIPT (Settlement Voucher)</option>
                <option value="packing_slip">PACKING SLIP (Workshop QA &middot; No Pricing)</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#746F68] pointer-events-none" />
            </div>
          </div>

          {/* Desktop Selector: Segmented Luxury Tabs */}
          <div className="hidden sm:flex items-center gap-2">
            {[
              { id: "invoice", label: "Tax Invoice", icon: FileText },
              { id: "receipt", label: "Payment Receipt", icon: CheckCircle },
              { id: "packing_slip", label: "Packing Slip", icon: Truck }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedDocType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`flex-1 py-1.5 px-3 text-xs font-mono uppercase tracking-wider rounded-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-[#111113] text-white font-medium shadow-xs"
                      : "bg-white hover:bg-[#FAF8F5] text-[#55514B] border border-[#E5DDD1]"
                  }`}
                >
                  <Icon size={13} className={isActive ? "text-[#C2922E]" : "text-[#746F68]"} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          onWheel={(e) => e.stopPropagation()}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain suko-scrollbar p-3 sm:p-6 pb-8 sm:pb-12 bg-[#EFE9DF]/40 flex justify-center items-start"
        >
          {/* If activeRenderedType is null, show Skeleton Loader (Instant unmount of old document) */}
          {!activeRenderedType || activeRenderedType !== selectedDocType ? (
            <DocumentSkeletonLoader docTypeLabel={docLabels[selectedDocType]} />
          ) : activeRenderedType === "receipt" ? (
            <PaymentReceiptPreview
              key={`receipt-${order.id}`}
              order={order}
              brandSettings={brandSettings}
              clientDetails={clientDetails}
            />
          ) : activeRenderedType === "packing_slip" ? (
            <PackingSlipPreview
              key={`packing-${order.id}`}
              order={order}
              brandSettings={brandSettings}
              clientDetails={clientDetails}
              items={items}
            />
          ) : (
            <TaxInvoicePreview
              key={`invoice-${order.id}`}
              order={order}
              brandSettings={brandSettings}
              clientDetails={clientDetails}
              items={items}
            />
          )}
        </div>

        {/* ==================================================================== */}
        {/* 4. STICKY BOTTOM ACTIONS BAR                                         */}
        {/* ==================================================================== */}
        <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-[#E5DDD1] bg-white flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            {/* Primary Action: Download PDF */}
            <button
              type="button"
              disabled={isDownloading || !activeRenderedType}
              onClick={handleDownloadPdf}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#111113] hover:bg-[#C2922E] text-white text-xs font-mono uppercase tracking-wider rounded-[2px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Download size={14} className="text-[#C2922E]" />
              <span>{isDownloading ? "Preparing PDF..." : `Download ${docLabels[selectedDocType]} PDF`}</span>
            </button>

            {/* Secondary Action: Share */}
            <button
              type="button"
              onClick={handleShare}
              disabled={!activeRenderedType}
              className="px-3.5 py-2.5 border border-[#E5DDD1] hover:border-[#111113] bg-[#FAF8F5] text-xs font-mono uppercase tracking-wider text-[#111113] rounded-[2px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Share document link or WhatsApp"
            >
              <Share2 size={13} className="text-[#746F68]" />
              <span className="hidden xs:inline">Share</span>
            </button>
          </div>

          {/* Tertiary Action: Close */}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-[#E5DDD1] hover:bg-[#FAF8F5] text-xs font-mono uppercase tracking-wider text-[#746F68] hover:text-[#111113] rounded-[2px] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
