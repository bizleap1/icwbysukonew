import React, { useState } from "react";
import {
  ChevronLeft,
  Plus,
  Search,
  X,
  Tag,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Calendar,
  Layers,
  Percent,
  DollarSign,
  AlertCircle,
  Clock,
  MoreVertical,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "../../data/products";

export default function CouponsSection({
  couponsList = [],
  activeCouponsCount = 0,
  expiredCouponsCount = 0,
  inactiveCouponsCount = 0,
  newCouponForm,
  setNewCouponForm,
  submittingCoupon = false,
  handleCreateCouponSubmit,
  couponFilter = "all",
  setCouponFilter,
  couponSearch = "",
  setCouponSearch,
  filteredCoupons = [],
  togglingCouponId = null,
  handleToggleCouponStatus,
  handleDeleteCoupon,
  onBack
}) {
  // Mobile Create Modal State
  const [isMobileCreateModalOpen, setIsMobileCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon "${code}" copied to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    await handleCreateCouponSubmit(e);
    setIsMobileCreateModalOpen(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* ==================================================================== */}
      {/* 1. MOBILE INTERFACE (< md)                                           */}
      {/* ==================================================================== */}
      <div className="md:hidden space-y-4">
        
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
            <span>Discounts &amp; Coupons</span>
          </button>

          <div>
            <h2 className="text-2xl font-serif font-light text-[#111113] tracking-tight">
              Discounts &amp; Coupons
            </h2>
            <p className="text-xs text-[#746F68] font-sans mt-0.5 leading-relaxed">
              Manage offers &amp; promotions
            </p>
          </div>
        </div>

        {/* Top Action: Full Width Create Button */}
        <button
          type="button"
          onClick={() => setIsMobileCreateModalOpen(true)}
          className="w-full py-3 px-4 bg-[#111113] hover:bg-[#C2922E] text-[#FAF8F5] text-xs font-mono uppercase tracking-[0.14em] font-medium rounded-[2px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus size={15} className="text-[#C2922E]" />
          <span>Create Coupon</span>
        </button>

        {/* Filter Chips: All | Active | Expired | Inactive */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 suko-scrollbar">
          {[
            { id: "all", label: "All", count: couponsList.length },
            { id: "active", label: "Active", count: activeCouponsCount },
            { id: "expired", label: "Expired", count: expiredCouponsCount },
            { id: "inactive", label: "Inactive", count: inactiveCouponsCount },
          ].map((tab) => {
            const isSelected = couponFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCouponFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-[2px] transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? "bg-[#111113] text-white font-semibold shadow-xs"
                    : "bg-white text-[#55514B] border border-[#E5DDD1] hover:bg-[#FAF8F5]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-[#EFE9DF] text-[#746F68]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Search Bar */}
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E877E] pointer-events-none" />
          <input
            type="text"
            value={couponSearch}
            onChange={(e) => setCouponSearch(e.target.value)}
            placeholder="Search coupon codes..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#E5DDD1] rounded-[2px] focus:border-[#C2922E] outline-none font-mono text-[#111113] placeholder:text-[#8E877E]"
          />
          {couponSearch && (
            <button
              type="button"
              onClick={() => setCouponSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E877E] hover:text-[#111113]"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Mobile Coupon Cards List */}
        <div className="space-y-3">
          {filteredCoupons.length > 0 ? (
            filteredCoupons.map((c) => {
              const isExpired =
                (c.expiry_date && new Date(c.expiry_date).getTime() < Date.now()) ||
                (c.usage_limit && Number(c.used_count || 0) >= Number(c.usage_limit));
              const status = !c.is_active ? "inactive" : isExpired ? "expired" : "active";
              const isToggling = togglingCouponId === c.id;

              const expiryFormatted = c.expiry_date
                ? new Date(c.expiry_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })
                : "No expiry";

              return (
                <div
                  key={c.id}
                  className={`bg-white border rounded-[2px] p-4 space-y-3.5 shadow-2xs transition-all ${
                    status === "active"
                      ? "border-l-4 border-l-[#C2922E] border-[#E5DDD1]"
                      : "border-l-4 border-l-[#746F68] border-[#E5DDD1]"
                  }`}
                >
                  {/* Card Header: Code & Discount Value */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#F0EBE1] pb-2.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-[#111113] tracking-wider uppercase">
                          {c.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(c.code)}
                          className="text-[#746F68] hover:text-[#111113] p-1 cursor-pointer"
                          title="Copy Code"
                        >
                          {copiedCode === c.code ? (
                            <Check size={13} className="text-emerald-700" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#8E877E] block">
                        {c.discount_type === "percentage" ? "Percentage Discount" : "Flat Amount"}
                      </span>
                    </div>

                    <span className="font-serif text-lg font-medium text-[#C2922E]">
                      {c.discount_type === "percentage"
                        ? `${Number(c.discount_value)}% OFF`
                        : `₹${Number(c.discount_value).toLocaleString("en-IN")} OFF`}
                    </span>
                  </div>

                  {/* Card Metrics Body */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                    <div className="p-2 bg-[#FAF8F5] border border-[#ECE7DE] rounded-[2px]">
                      <span className="text-[9.5px] uppercase font-mono tracking-wider text-[#8E877E] block">
                        Usage Limit
                      </span>
                      <p className="font-mono text-xs text-[#111113] font-medium mt-0.5">
                        {c.used_count || 0} / {c.usage_limit || "∞"}
                      </p>
                    </div>

                    <div className="p-2 bg-[#FAF8F5] border border-[#ECE7DE] rounded-[2px]">
                      <span className="text-[9.5px] uppercase font-mono tracking-wider text-[#8E877E] block">
                        Expires
                      </span>
                      <p className="font-mono text-xs text-[#111113] font-medium mt-0.5">
                        {expiryFormatted}
                      </p>
                    </div>
                  </div>

                  {c.min_order_value && Number(c.min_order_value) > 0 && (
                    <div className="text-[11px] font-mono text-[#746F68]">
                      Min. cart value: ₹{Number(c.min_order_value).toLocaleString("en-IN")}
                    </div>
                  )}

                  {/* Card Footer: Status Pill & Action Buttons */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#ECE7DE]">
                    <div className="flex items-center gap-1.5">
                      {status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-emerald-50 text-emerald-700 text-[10px] font-mono font-medium border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : status === "expired" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-amber-50 text-amber-800 text-[10px] font-mono font-medium border border-amber-200">
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#FAF8F5] text-[#746F68] text-[10px] font-mono font-medium border border-[#E5DDD1]">
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCouponStatus(c)}
                        disabled={isToggling}
                        className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-[#111113] hover:text-[#C2922E] bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isToggling ? "Updating..." : c.is_active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(c.id, c.code)}
                        className="p-1.5 text-[#8E877E] hover:text-rose-700 transition-colors cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-white border border-[#E5DDD1] rounded-[2px] space-y-2">
              <Tag size={28} className="mx-auto text-[#C2922E]/60" />
              <p className="font-serif text-sm text-[#111113]">No coupons match this filter</p>
              <p className="text-xs text-[#746F68]">Try selecting a different filter tab or search term.</p>
            </div>
          )}
        </div>

      </div>

      {/* ==================================================================== */}
      {/* MOBILE CREATE COUPON MODAL / SHEET                                   */}
      {/* ==================================================================== */}
      {isMobileCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-lg max-h-[92vh] flex flex-col bg-white border border-[#E5DDD1] rounded-t-lg sm:rounded-[2px] shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#ECE7DE] p-4 shrink-0">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-[#C2922E]" />
                <h3 className="font-serif text-lg text-[#111113]">Create Coupon</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileCreateModalOpen(false)}
                className="text-[#746F68] hover:text-[#111113] p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleMobileSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans suko-scrollbar">
              {/* Coupon Code */}
              <div>
                <label className="text-[10px] uppercase tracking-wider font-mono text-[#3D3A35] font-semibold block mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={newCouponForm.code}
                  onChange={(e) =>
                    setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })
                  }
                  placeholder="E.G. FESTIVE15, SUKO500"
                  required
                  className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] px-3 py-2.5 text-xs font-mono uppercase text-[#111113] placeholder:text-[#A49E93] focus:border-[#C2922E] outline-none"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="text-[10px] uppercase tracking-wider font-mono text-[#3D3A35] font-semibold block mb-1">
                  Discount Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCouponForm({ ...newCouponForm, discount_type: "percentage" })}
                    className={`py-2 px-3 text-xs font-mono rounded-[2px] border transition-all cursor-pointer text-center ${
                      newCouponForm.discount_type === "percentage"
                        ? "bg-[#111113] text-white border-[#111113] font-semibold"
                        : "bg-[#FAF8F5] text-[#55514B] border-[#E5DDD1]"
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCouponForm({ ...newCouponForm, discount_type: "fixed" })}
                    className={`py-2 px-3 text-xs font-mono rounded-[2px] border transition-all cursor-pointer text-center ${
                      newCouponForm.discount_type === "fixed"
                        ? "bg-[#111113] text-white border-[#111113] font-semibold"
                        : "bg-[#FAF8F5] text-[#55514B] border-[#E5DDD1]"
                    }`}
                  >
                    Flat Amount (₹)
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div>
                <label className="text-[10px] uppercase tracking-wider font-mono text-[#3D3A35] font-semibold block mb-1">
                  Discount Value * ({newCouponForm.discount_type === "percentage" ? "%" : "₹"})
                </label>
                <input
                  type="number"
                  min="1"
                  max={newCouponForm.discount_type === "percentage" ? "100" : undefined}
                  value={newCouponForm.discount_value}
                  onChange={(e) =>
                    setNewCouponForm({ ...newCouponForm, discount_value: e.target.value })
                  }
                  placeholder={newCouponForm.discount_type === "percentage" ? "15" : "500"}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] px-3 py-2.5 text-xs font-mono text-[#111113] placeholder:text-[#A49E93] focus:border-[#C2922E] outline-none"
                />
              </div>

              {/* Minimum Order Value */}
              <div>
                <label className="text-[10px] uppercase tracking-wider font-mono text-[#3D3A35] font-semibold block mb-1">
                  Minimum Order (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newCouponForm.min_order_value}
                  onChange={(e) =>
                    setNewCouponForm({ ...newCouponForm, min_order_value: e.target.value })
                  }
                  placeholder="e.g. 2500"
                  className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] px-3 py-2.5 text-xs font-mono text-[#111113] placeholder:text-[#A49E93] focus:border-[#C2922E] outline-none"
                />
                <span className="text-[10px] font-mono text-[#8E877E] mt-0.5 block">0 or blank = No minimum</span>
              </div>

              {/* Usage Limit & Expiry Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-mono text-[#3D3A35] font-semibold block mb-1">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newCouponForm.usage_limit}
                    onChange={(e) =>
                      setNewCouponForm({ ...newCouponForm, usage_limit: e.target.value })
                    }
                    placeholder="e.g. 100"
                    className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] px-3 py-2 text-xs font-mono text-[#111113] placeholder:text-[#A49E93] focus:border-[#C2922E] outline-none"
                  />
                  <span className="text-[9.5px] font-mono text-[#8E877E] mt-0.5 block">Blank = Unlimited</span>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-mono text-[#3D3A35] font-semibold block mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newCouponForm.expiry_date ? newCouponForm.expiry_date.split("T")[0] : ""}
                    onChange={(e) =>
                      setNewCouponForm({
                        ...newCouponForm,
                        expiry_date: e.target.value ? `${e.target.value}T23:59:59.000Z` : ""
                      })
                    }
                    className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] px-2.5 py-2 text-xs font-mono text-[#111113] focus:border-[#C2922E] outline-none"
                  />
                  <span className="text-[9.5px] font-mono text-[#8E877E] mt-0.5 block">Blank = No expiry</span>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-[10px] uppercase tracking-wider font-mono text-[#3D3A35] font-semibold block mb-1">
                  Status
                </label>
                <div className="flex items-center gap-4 bg-[#FAF8F5] p-2.5 border border-[#E5DDD1] rounded-[2px]">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="mobile_coupon_status"
                      checked={newCouponForm.is_active === true}
                      onChange={() => setNewCouponForm({ ...newCouponForm, is_active: true })}
                      className="accent-[#C2922E]"
                    />
                    <span className="text-xs text-[#111113] font-medium">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="mobile_coupon_status"
                      checked={newCouponForm.is_active === false}
                      onChange={() => setNewCouponForm({ ...newCouponForm, is_active: false })}
                      className="accent-[#C2922E]"
                    />
                    <span className="text-xs text-[#55514B]">Inactive</span>
                  </label>
                </div>
              </div>

              {/* Sticky Bottom Save Coupon Button */}
              <div className="sticky bottom-0 bg-white pt-3 pb-1 border-t border-[#ECE7DE] mt-4">
                <button
                  type="submit"
                  disabled={submittingCoupon}
                  className="w-full py-3 px-4 bg-[#111113] hover:bg-[#C2922E] text-white text-xs font-mono uppercase tracking-[0.14em] font-semibold rounded-[2px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {submittingCoupon ? (
                    <>
                      <RotateCcw size={13} className="animate-spin text-[#C2922E]" />
                      <span>Saving Coupon...</span>
                    </>
                  ) : (
                    <span>SAVE COUPON</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. DESKTOP INTERFACE (md:)                                           */}
      {/* ==================================================================== */}
      <div className="hidden md:block space-y-6">
        
        {/* Desktop Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E5DDD1]">
          <div>
            <span className="text-[10px] uppercase tracking-[0.14em] text-[#C2922E] font-mono font-semibold block mb-0.5">
              MARKETING &amp; PROMOTIONS
            </span>
            <h2 className="text-xl sm:text-2xl font-serif text-[#111113] font-normal tracking-tight">
              Discounts &amp; Coupons
            </h2>
            <p className="text-xs text-[#6B655D] mt-0.5">
              Configure promotional codes, percentage or flat discounts, usage caps, and cart thresholds.
            </p>
          </div>

          {/* Quick Metric Badges */}
          <div className="flex items-center gap-2 text-xs">
            <div className="bg-white border border-[#E5DDD1] px-3 py-1.5 rounded-[3px] flex items-center gap-2">
              <span className="text-[11px] text-[#746F68] uppercase font-mono">Total Coupons:</span>
              <span className="font-mono font-medium text-[#111113]">{couponsList.length}</span>
            </div>
            <div className="bg-white border border-[#E5DDD1] px-3 py-1.5 rounded-[3px] flex items-center gap-2">
              <span className="text-[11px] text-emerald-700 uppercase font-mono">Active:</span>
              <span className="font-mono font-medium text-emerald-800">{activeCouponsCount}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* Left: Create Coupon Card */}
          <div className="lg:col-span-5">
            <div className="border border-[#E5DDD1] bg-white rounded-[4px] shadow-sm p-5 sm:p-6 space-y-5">
              <div className="border-b border-[#EAE6DF] pb-3.5">
                <span className="text-[10px] uppercase tracking-[0.14em] text-[#C2922E] font-mono font-semibold block mb-1">
                  CREATE NEW COUPON
                </span>
                <h3 className="text-lg font-serif text-[#111113] font-normal">Create Coupon</h3>
                <p className="text-xs text-[#746F68] mt-0.5">
                  Set redemption rules, discount type, validity, and cart conditions.
                </p>
              </div>

              <form onSubmit={handleCreateCouponSubmit} className="space-y-4 text-xs">
                {/* Coupon Code */}
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.10em] text-[#3D3A35] font-mono font-medium block mb-1.5">
                    Coupon Code <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newCouponForm.code}
                      onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })}
                      placeholder="E.G. SUKO10, FESTIVE500"
                      required
                      className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[3px] px-3.5 py-2.5 text-xs font-mono uppercase text-[#111113] placeholder:text-[#A49E93] focus:border-[#C2922E] focus:bg-white outline-none transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#8E877E] uppercase tracking-wider pointer-events-none">
                      AUTO UPPERCASE
                    </span>
                  </div>
                </div>

                {/* Discount Type */}
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.10em] text-[#3D3A35] font-mono font-medium block mb-1.5">
                    Discount Type <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-[#FAF8F5] p-1 border border-[#E5DDD1] rounded-[3px]">
                    <button
                      type="button"
                      onClick={() => setNewCouponForm({ ...newCouponForm, discount_type: "percentage" })}
                      className={`py-2 px-3 text-xs font-mono rounded-[2px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        newCouponForm.discount_type === "percentage"
                          ? "bg-[#111113] text-[#FAF8F5] font-medium shadow-xs"
                          : "text-[#55514B] hover:text-[#111113]"
                      }`}
                    >
                      <Percent size={12} />
                      <span>Percentage (%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCouponForm({ ...newCouponForm, discount_type: "fixed" })}
                      className={`py-2 px-3 text-xs font-mono rounded-[2px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        newCouponForm.discount_type === "fixed"
                          ? "bg-[#111113] text-[#FAF8F5] font-medium shadow-xs"
                          : "text-[#55514B] hover:text-[#111113]"
                      }`}
                    >
                      <DollarSign size={12} />
                      <span>Flat Amount (₹)</span>
                    </button>
                  </div>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.10em] text-[#3D3A35] font-mono font-medium block mb-1.5">
                    Discount Value ({newCouponForm.discount_type === "percentage" ? "%" : "₹"}) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={newCouponForm.discount_type === "percentage" ? "100" : undefined}
                      value={newCouponForm.discount_value}
                      onChange={(e) => setNewCouponForm({ ...newCouponForm, discount_value: e.target.value })}
                      placeholder={newCouponForm.discount_type === "percentage" ? "e.g. 10 (for 10% off)" : "e.g. 500 (for ₹500 off)"}
                      required
                      className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[3px] px-3.5 py-2.5 text-xs font-mono text-[#111113] placeholder:text-[#A49E93] focus:border-[#C2922E] focus:bg-white outline-none transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#8E877E]">
                      {newCouponForm.discount_type === "percentage" ? "%" : "INR"}
                    </span>
                  </div>
                </div>

                {/* Minimum Order Value */}
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.10em] text-[#3D3A35] font-mono font-medium block mb-1.5">
                    Minimum Order Value (₹)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={newCouponForm.min_order_value}
                      onChange={(e) => setNewCouponForm({ ...newCouponForm, min_order_value: e.target.value })}
                      placeholder="e.g. 2999 (0 for no minimum)"
                      className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[3px] px-3.5 py-2.5 text-xs font-mono text-[#111113] placeholder:text-[#A49E93] focus:border-[#C2922E] focus:bg-white outline-none transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#8E877E]">INR</span>
                  </div>
                  <span className="text-[10px] text-[#8E877E] mt-0.5 block">Leave empty or 0 if coupon applies without cart minimum</span>
                </div>

                {/* Usage Limit & Expiry Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10.5px] uppercase tracking-[0.10em] text-[#3D3A35] font-mono font-medium block mb-1.5">
                      Usage Limit (Total)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newCouponForm.usage_limit}
                      onChange={(e) => setNewCouponForm({ ...newCouponForm, usage_limit: e.target.value })}
                      placeholder="e.g. 100"
                      className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[3px] px-3 py-2.5 text-xs font-mono text-[#111113] placeholder:text-[#A49E93] focus:border-[#C2922E] focus:bg-white outline-none transition-colors"
                    />
                    <span className="text-[10px] text-[#8E877E] mt-0.5 block">Blank = Unlimited</span>
                  </div>

                  <div>
                    <label className="text-[10.5px] uppercase tracking-[0.10em] text-[#3D3A35] font-mono font-medium block mb-1.5">
                      Valid Until
                    </label>
                    <input
                      type="date"
                      value={newCouponForm.expiry_date ? newCouponForm.expiry_date.split("T")[0] : ""}
                      onChange={(e) => setNewCouponForm({ ...newCouponForm, expiry_date: e.target.value ? `${e.target.value}T23:59:59.000Z` : "" })}
                      className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[3px] px-3 py-2 text-xs font-mono text-[#111113] focus:border-[#C2922E] focus:bg-white outline-none transition-colors"
                    />
                    <span className="text-[10px] text-[#8E877E] mt-0.5 block">Blank = No expiry</span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-[10.5px] uppercase tracking-[0.10em] text-[#3D3A35] font-mono font-medium block mb-1.5">
                    Status
                  </label>
                  <div className="flex items-center gap-4 bg-[#FAF8F5] p-2 border border-[#E5DDD1] rounded-[3px]">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="coupon_status_desktop"
                        checked={newCouponForm.is_active === true}
                        onChange={() => setNewCouponForm({ ...newCouponForm, is_active: true })}
                        className="accent-[#C2922E]"
                      />
                      <span className="text-xs text-[#111113] font-medium">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="coupon_status_desktop"
                        checked={newCouponForm.is_active === false}
                        onChange={() => setNewCouponForm({ ...newCouponForm, is_active: false })}
                        className="accent-[#C2922E]"
                      />
                      <span className="text-xs text-[#55514B]">Inactive</span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submittingCoupon}
                  className="w-full bg-[#111113] hover:bg-[#C2922E] text-[#FAF8F5] py-3 rounded-[3px] text-xs uppercase tracking-[0.12em] font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {submittingCoupon ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Coupon...</span>
                    </>
                  ) : (
                    <span>Create Coupon</span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Detailed Table & Filters */}
          <div className="lg:col-span-7 space-y-4">
            {/* Filter Bar & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-[4px] border border-[#E5DDD1] shadow-sm">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: "all", label: "All", count: couponsList.length },
                  { id: "active", label: "Active", count: activeCouponsCount },
                  { id: "expired", label: "Expired", count: expiredCouponsCount },
                  { id: "inactive", label: "Inactive", count: inactiveCouponsCount },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCouponFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs rounded-[2px] transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      couponFilter === tab.id
                        ? "bg-[#111113] text-[#FAF8F5] font-medium"
                        : "text-[#55514B] hover:text-[#111113] hover:bg-[#FAF8F5]"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      couponFilter === tab.id ? "bg-white/20 text-white" : "bg-[#EFE9DF] text-[#746F68]"
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-56">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8E877E] pointer-events-none" />
                <input
                  type="text"
                  value={couponSearch}
                  onChange={(e) => setCouponSearch(e.target.value)}
                  placeholder="Search by code..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:bg-white focus:border-[#C2922E] outline-none font-mono transition-colors text-[#111113] placeholder:text-[#8E877E]"
                />
                {couponSearch && (
                  <button
                    type="button"
                    onClick={() => setCouponSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8E877E] hover:text-[#111113]"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Coupons Table Card */}
            <div className="border border-[#E5DDD1] bg-white rounded-[4px] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#FAF8F5] text-[10px] uppercase tracking-[0.10em] text-[#746F68] font-mono border-b border-[#E5DDD1]">
                    <tr>
                      <th className="py-3 px-3.5 font-medium">Code</th>
                      <th className="py-3 px-3 font-medium">Discount</th>
                      <th className="py-3 px-3 font-medium">Min Order</th>
                      <th className="py-3 px-3 font-medium">Used</th>
                      <th className="py-3 px-3 font-medium">Validity</th>
                      <th className="py-3 px-3 font-medium">Status</th>
                      <th className="py-3 px-3.5 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE6DF] text-[#111113]">
                    {filteredCoupons.map((c) => {
                      const isExpired = (c.expiry_date && new Date(c.expiry_date).getTime() < Date.now()) ||
                                        (c.usage_limit && Number(c.used_count || 0) >= Number(c.usage_limit));
                      const status = !c.is_active ? "inactive" : isExpired ? "expired" : "active";
                      const isToggling = togglingCouponId === c.id;

                      return (
                        <tr key={c.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                          <td className="py-3 px-3.5 font-mono font-medium text-[#111113]">
                            <div className="flex items-center gap-1.5">
                              <span className="tracking-wider uppercase">{c.code}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(c.code)}
                                className="text-[#8E877E] hover:text-[#111113] p-0.5 rounded cursor-pointer transition-colors"
                                title="Copy code"
                              >
                                {copiedCode === c.code ? (
                                  <Check size={11} className="text-emerald-700" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-serif font-medium text-[#C2922E]">
                            {c.discount_type === "percentage"
                              ? `${Number(c.discount_value)}% OFF`
                              : `₹${Number(c.discount_value).toLocaleString("en-IN")} OFF`}
                          </td>
                          <td className="py-3 px-3 font-mono text-[#55514B]">
                            {c.min_order_value && Number(c.min_order_value) > 0
                              ? `₹${Number(c.min_order_value).toLocaleString("en-IN")}`
                              : "None"}
                          </td>
                          <td className="py-3 px-3 font-mono text-[#55514B]">
                            <span className="font-medium text-[#111113]">{c.used_count || 0}</span>
                            <span className="text-[#8E877E]"> / {c.usage_limit || "∞"}</span>
                          </td>
                          <td className="py-3 px-3 text-[#55514B] font-mono text-[11px]">
                            {c.expiry_date
                              ? new Date(c.expiry_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                              : "No Expiry"}
                          </td>
                          <td className="py-3 px-3">
                            {status === "active" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-emerald-50 text-emerald-700 text-[10px] font-mono font-medium border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active
                              </span>
                            ) : status === "expired" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-amber-50 text-amber-800 text-[10px] font-mono font-medium border border-amber-200">
                                Expired
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#FAF8F5] text-[#746F68] text-[10px] font-mono font-medium border border-[#E5DDD1]">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleCouponStatus(c)}
                                disabled={isToggling}
                                className={`text-[11px] font-mono underline hover:text-[#C2922E] cursor-pointer disabled:opacity-50 ${
                                  c.is_active ? "text-[#746F68]" : "text-emerald-700"
                                }`}
                              >
                                {isToggling ? "Updating..." : c.is_active ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCoupon(c.id, c.code)}
                                className="text-[#8E877E] hover:text-rose-700 p-1 transition-colors cursor-pointer"
                                title="Delete Coupon"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredCoupons.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-10 text-center text-[#746F68] font-sans">
                          <div className="space-y-1">
                            <p className="font-serif text-sm text-[#111113]">No coupons found</p>
                            <p className="text-xs">Adjust search or create your first promotional code on the left.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
