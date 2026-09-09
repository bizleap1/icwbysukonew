import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  User,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  CheckCircle2
} from "lucide-react";
import { formatINR } from "../../data/products";

export default function CustomerDirectorySection({
  uniqueClientsList = [],
  clientSearch = "",
  setClientSearch,
  patronFilter = "all",
  setPatronFilter,
  orders = [],
  openClientProfile,
  selectedClientProfile,
  closeClientProfile,
  setEmailForm,
  setActiveTab,
  formatDateTime,
  renderStatusIndicator,
  isFinanciallyPaid,
  onBack
}) {
  // Mobile accordion state for contact info
  const [isContactAccordionOpen, setIsContactAccordionOpen] = useState(true);

  // Filter logic
  const filteredPatrons = uniqueClientsList.filter((c) => {
    if (clientSearch.trim()) {
      const q = clientSearch.toLowerCase().trim();
      const matchName = (c.name || "").toLowerCase().includes(q);
      const matchEmail = (c.email || "").toLowerCase().includes(q);
      const matchPhone = (c.phone || "").toLowerCase().includes(q);
      const matchCity = (c.city || "").toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchCity) return false;
    }

    if (patronFilter === "recent") {
      if (!c.lastOrderDate) return false;
      const days = (Date.now() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 60 || c.orderCount > 0;
    }
    if (patronFilter === "high_value") {
      return c.totalSpent >= 25000 || (c.totalSpent > 0 && c.orderCount >= 2);
    }
    if (patronFilter === "new") {
      const joined = c.joinedDate ? new Date(c.joinedDate).getTime() : 0;
      const daysSinceJoined = joined ? (Date.now() - joined) / (1000 * 60 * 60 * 24) : 999;
      return daysSinceJoined <= 30 || c.orderCount <= 1;
    }
    return true;
  });

  const checkPaid = (status) => {
    if (typeof isFinanciallyPaid === "function") return isFinanciallyPaid(status);
    if (!status) return false;
    return ["paid", "delivered", "shipped", "processing", "confirmed"].includes(status.toLowerCase());
  };

  const totalOrdersCompleted = orders.filter((o) => checkPaid(o.status)).length;
  const totalRevenueGenerated = uniqueClientsList.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
  const activeClientsCount = uniqueClientsList.filter((c) => c.orderCount > 0).length;

  const handleContactCustomer = (client) => {
    if (setEmailForm && setActiveTab) {
      setEmailForm({
        target: "single",
        recipientEmail: client.email || "",
        subject: `SUKO Atelier Privileges | Exclusive Update for ${client.name}`,
        message: `Dear ${client.name},\n\nWe hope this note finds you well. Our concierge is reaching out to share a personalized update regarding your atelier wardrobe.\n\nWarm regards,\nSUKO Atelier Team`
      });
      if (closeClientProfile) closeClientProfile();
      setActiveTab("broadcast");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* ==================================================================== */}
      {/* 1. MOBILE INTERFACE (< md)                                           */}
      {/* ==================================================================== */}
      <div className="md:hidden space-y-4">

        {/* CASE A: FULL-SCREEN MOBILE CUSTOMER PROFILE PAGE */}
        {selectedClientProfile ? (
          <div className="space-y-4 pb-24 animate-in fade-in slide-in-from-right duration-200">
            
            {/* Mobile Profile Header */}
            <div className="flex items-center justify-between border-b border-[#E5DDD1] pb-3 sticky top-0 bg-[#FAF8F5] z-20 pt-1">
              <button
                type="button"
                onClick={closeClientProfile}
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#746F68] hover:text-[#111113] transition-colors py-1 cursor-pointer"
              >
                <ChevronLeft size={16} className="text-[#C2922E]" />
                <span className="font-serif font-normal text-sm text-[#111113] truncate max-w-[180px]">
                  {selectedClientProfile.name}
                </span>
              </button>

              <button
                type="button"
                onClick={closeClientProfile}
                className="p-1 text-[#746F68] hover:text-[#111113] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Header Card */}
            <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-4.5 space-y-3 shadow-2xs border-t-2 border-t-[#C2922E]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-serif text-xl font-medium text-[#111113]">
                    {selectedClientProfile.name}
                  </h3>
                  <p className="text-xs font-mono text-[#746F68] mt-0.5">
                    {selectedClientProfile.email}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#FAF8F5] text-[#7A5B15] text-[10px] font-mono uppercase tracking-wider font-semibold border border-[#DECBA6]">
                  {selectedClientProfile.totalSpent >= 25000 || selectedClientProfile.orderCount >= 3
                    ? "VIP Patron"
                    : selectedClientProfile.orderCount > 1
                    ? "Returning Client"
                    : "New Client"}
                </span>
              </div>

              {/* 2 Key Metric Badges */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#ECE7DE]">
                <div className="p-2.5 bg-[#FAF8F5] border border-[#ECE7DE] rounded-[2px]">
                  <span className="text-[9.5px] uppercase font-mono tracking-wider text-[#8E877E] block">
                    Lifetime Value
                  </span>
                  <span className="font-serif text-lg font-medium text-[#111113] mt-0.5 block">
                    {formatINR(selectedClientProfile.totalSpent)}
                  </span>
                </div>

                <div className="p-2.5 bg-[#FAF8F5] border border-[#ECE7DE] rounded-[2px]">
                  <span className="text-[9.5px] uppercase font-mono tracking-wider text-[#8E877E] block">
                    Commissions
                  </span>
                  <span className="font-serif text-lg font-medium text-[#111113] mt-0.5 block">
                    {String(selectedClientProfile.orderCount).padStart(2, "0")} Orders
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Section (Accordion) */}
            <div className="bg-white border border-[#E5DDD1] rounded-[2px] shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => setIsContactAccordionOpen(!isContactAccordionOpen)}
                className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-[#FAF8F5] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" />
                  <span className="font-mono text-xs uppercase tracking-[0.14em] font-semibold text-[#111113]">
                    CONTACT &amp; DETAILS
                  </span>
                </div>
                {isContactAccordionOpen ? <ChevronUp size={16} className="text-[#746F68]" /> : <ChevronDown size={16} className="text-[#746F68]" />}
              </button>

              {isContactAccordionOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-[#ECE7DE] space-y-2.5 text-xs font-sans">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#F0EBE1]">
                    <span className="font-mono text-[10.5px] uppercase text-[#746F68]">Phone</span>
                    <span className="font-mono font-medium text-[#111113]">
                      {selectedClientProfile.phone || "No phone registered"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#F0EBE1]">
                    <span className="font-mono text-[10.5px] uppercase text-[#746F68]">Email</span>
                    <span className="font-mono text-[#111113] truncate max-w-[200px]">
                      {selectedClientProfile.email}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#F0EBE1]">
                    <span className="font-mono text-[10.5px] uppercase text-[#746F68]">City</span>
                    <span className="font-serif text-[#111113]">
                      {selectedClientProfile.city !== "—" ? selectedClientProfile.city : "Atelier Client"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="font-mono text-[10.5px] uppercase text-[#746F68]">Patron Since</span>
                    <span className="font-mono text-[11px] text-[#746F68]">
                      {selectedClientProfile.joinedDate
                        ? new Date(selectedClientProfile.joinedDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })
                        : "Sep 2026"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Order History Section (Cards) */}
            <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#ECE7DE] pb-2.5">
                <h3 className="font-serif text-base font-normal text-[#111113]">
                  Order History
                </h3>
                <span className="text-[10px] font-mono text-[#746F68]">
                  {selectedClientProfile.orders?.length || 0} Commissions
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedClientProfile.orders && selectedClientProfile.orders.length > 0 ? (
                  selectedClientProfile.orders.map((ord) => (
                    <div
                      key={ord.id || ord.orderNumber}
                      className="p-3.5 bg-[#FAF8F5] border border-[#ECE7DE] rounded-[2px] space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-[#111113] block">
                            {ord.orderNumber}
                          </span>
                          <span className="text-[10px] font-mono text-[#746F68]">
                            {ord.date
                              ? new Date(ord.date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric"
                                })
                              : "Recent"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-serif text-sm font-medium text-[#111113] block">
                            {formatINR(ord.total)}
                          </span>
                          <span className="inline-block mt-0.5 text-[9px] font-mono uppercase font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {ord.status || "Delivered"}
                          </span>
                        </div>
                      </div>

                      {/* Items in this order */}
                      {Array.isArray(ord.items) && ord.items.length > 0 && (
                        <div className="pt-2 border-t border-[#ECE7DE] space-y-1">
                          {ord.items.map((it, itIdx) => (
                            <div key={itIdx} className="flex justify-between text-xs">
                              <span className="font-serif text-[#111113] line-clamp-1">
                                {it.product?.name || it.product_name || `Garment #${it.id || itIdx + 1}`}
                              </span>
                              <span className="font-mono text-[11px] text-[#746F68] shrink-0">
                                {it.size ? `Size ${it.size}` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#746F68] font-sans py-2 text-center">
                    No orders cataloged for this patron yet.
                  </p>
                )}
              </div>
            </div>

            {/* Purchased Garments (Grid) */}
            <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#ECE7DE] pb-2.5">
                <h3 className="font-serif text-base font-normal text-[#111113]">
                  Purchased Garments
                </h3>
                <span className="text-[10px] font-mono text-[#746F68]">
                  {selectedClientProfile.purchasedGarments?.length || 0} Pieces
                </span>
              </div>

              {selectedClientProfile.purchasedGarments && selectedClientProfile.purchasedGarments.length > 0 ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {selectedClientProfile.purchasedGarments.map((g, gIdx) => (
                    <div
                      key={gIdx}
                      className="p-2.5 bg-[#FAF8F5] border border-[#ECE7DE] rounded-[2px] space-y-2 text-center"
                    >
                      <div className="h-28 bg-white border border-[#E5DDD1] rounded-[1px] flex items-center justify-center overflow-hidden">
                        {g.imageUrl ? (
                          <img
                            src={g.imageUrl}
                            alt={g.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <span className="text-[10px] font-mono text-[#8E877E]">Archival Piece</span>
                        )}
                      </div>
                      <div>
                        <h5 className="font-serif text-xs font-medium text-[#111113] line-clamp-1">
                          {g.name}
                        </h5>
                        <p className="text-[10px] font-mono text-[#C2922E] mt-0.5">
                          {formatINR(g.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#746F68] font-sans py-2 text-center">
                  No purchased garments archived.
                </p>
              )}
            </div>

            {/* Mobile Fixed Bottom Sticky Action Button */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-xs border-t border-[#E5DDD1] z-30 shadow-lg">
              <button
                type="button"
                onClick={() => handleContactCustomer(selectedClientProfile)}
                className="w-full py-3 px-4 bg-[#111113] hover:bg-[#C2922E] text-white text-xs font-mono uppercase tracking-[0.16em] font-semibold rounded-[2px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Mail size={14} className="text-[#C2922E]" />
                <span>CONTACT CUSTOMER</span>
              </button>
            </div>

          </div>
        ) : (
          /* CASE B: ROOT CUSTOMER DIRECTORY LIST VIEW (MOBILE) */
          <div className="space-y-4">
            
            {/* Header */}
            <div className="space-y-2 border-b border-[#E5DDD1] pb-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (onBack) onBack();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#746F68] hover:text-[#111113] transition-colors py-1 cursor-pointer"
                >
                  <ChevronLeft size={16} className="text-[#C2922E]" />
                  <span>Customers</span>
                </button>

                {/* Send Update Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (setEmailForm && setActiveTab) {
                      setEmailForm({ target: "all", recipientEmail: "", subject: "", message: "" });
                      setActiveTab("broadcast");
                    }
                  }}
                  className="px-3 py-1.5 bg-[#111113] hover:bg-[#C2922E] text-white text-[10.5px] font-mono uppercase tracking-wider rounded-[2px] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Mail size={11} className="text-[#C2922E]" />
                  <span>+ Send Update</span>
                </button>
              </div>

              <div>
                <h2 className="text-2xl font-serif font-light text-[#111113] tracking-tight">
                  Customers
                </h2>
                <p className="text-xs text-[#746F68] font-sans mt-0.5 leading-relaxed">
                  Manage customer profiles
                </p>
              </div>
            </div>

            {/* Stats Cards: Responsive 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-3 shadow-2xs space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#8E877E] block">
                  Total Patrons
                </span>
                <span className="font-serif text-2xl font-medium text-[#111113] block">
                  {String(uniqueClientsList.length).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-mono text-[#746F68]">Verified directory</span>
              </div>

              <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-3 shadow-2xs space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#8E877E] block">
                  Orders Completed
                </span>
                <span className="font-serif text-2xl font-medium text-[#111113] block">
                  {String(totalOrdersCompleted).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-mono text-emerald-700">Fulfilled</span>
              </div>

              <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-3 shadow-2xs space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#8E877E] block">
                  Total Revenue
                </span>
                <span className="font-serif text-xl font-medium text-[#111113] block">
                  {formatINR(totalRevenueGenerated)}
                </span>
                <span className="text-[10px] font-mono text-[#C2922E]">Lifetime spend</span>
              </div>

              <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-3 shadow-2xs space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#8E877E] block">
                  Active Patrons
                </span>
                <span className="font-serif text-2xl font-medium text-[#111113] block">
                  {String(activeClientsCount).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-mono text-[#111113]">With orders</span>
              </div>
            </div>

            {/* Filter Chips: Horizontal Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 suko-scrollbar">
              {[
                { id: "all", label: "All Patrons" },
                { id: "recent", label: "Recent" },
                { id: "high_value", label: "High Value (VIP)" },
                { id: "new", label: "New" }
              ].map((tab) => {
                const isSelected = patronFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPatronFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-[2px] transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-[#111113] text-white font-semibold shadow-xs"
                        : "bg-white text-[#55514B] border border-[#E5DDD1] hover:bg-[#FAF8F5]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Mobile Search Input */}
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E877E] pointer-events-none" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Search customer name, email, city..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#E5DDD1] rounded-[2px] focus:border-[#C2922E] outline-none text-[#111113] placeholder:text-[#8E877E]"
              />
              {clientSearch && (
                <button
                  type="button"
                  onClick={() => setClientSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E877E] hover:text-[#111113]"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Customer List: Cards Format (No Table) */}
            <div className="space-y-3">
              {filteredPatrons.length > 0 ? (
                filteredPatrons.map((client, idx) => {
                  let statusLabel = "New Patron";
                  let statusStyle = "text-[#746F68] bg-[#FAF8F5] border-[#E5DDD1]";
                  if (client.totalSpent >= 25000 || client.orderCount >= 3) {
                    statusLabel = "VIP Patron";
                    statusStyle = "text-[#7A5B15] bg-[#F7F0E1] border-[#DECBA6]";
                  } else if (client.orderCount > 1) {
                    statusLabel = "Returning Client";
                    statusStyle = "text-[#111113] bg-[#EFE9DF] border-[#DDD5C7]";
                  }

                  const lastOrderFormatted = client.lastOrderDate
                    ? new Date(client.lastOrderDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })
                    : "No orders yet";

                  return (
                    <div
                      key={client.email || idx}
                      onClick={() => openClientProfile(client)}
                      className="bg-white border border-[#E5DDD1] hover:border-[#C2922E] rounded-[2px] p-4 shadow-2xs space-y-3 cursor-pointer transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-serif text-base font-normal text-[#111113] group-hover:text-[#C2922E] transition-colors">
                            {client.name}
                          </h4>
                          <p className="text-[11px] font-mono text-[#746F68]">
                            {client.email}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] border text-[9.5px] font-mono uppercase tracking-wider font-medium ${statusStyle}`}>
                          {statusLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-sans py-2 px-2.5 bg-[#FAF8F5] border border-[#ECE7DE] rounded-[2px]">
                        <div>
                          <span className="text-[9.5px] uppercase font-mono tracking-wider text-[#8E877E] block">
                            Orders
                          </span>
                          <span className="font-mono text-xs font-semibold text-[#111113]">
                            {String(client.orderCount).padStart(2, "0")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9.5px] uppercase font-mono tracking-wider text-[#8E877E] block">
                            Spent
                          </span>
                          <span className="font-serif text-xs font-semibold text-[#111113]">
                            {formatINR(client.totalSpent)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <div className="text-[11px] font-mono text-[#746F68]">
                          <span className="text-[#8E877E]">Last Order: </span>
                          <span>{lastOrderFormatted}</span>
                        </div>

                        <span className="text-xs font-mono uppercase tracking-wider text-[#111113] group-hover:text-[#C2922E] font-medium inline-flex items-center gap-1">
                          <span>View Profile</span>
                          <ArrowRight size={13} className="text-[#C2922E]" />
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-white border border-[#E5DDD1] rounded-[2px] space-y-2">
                  <User size={28} className="mx-auto text-[#C2922E]/60" />
                  <p className="font-serif text-sm text-[#111113]">No customer profiles found</p>
                  <p className="text-xs text-[#746F68]">Try searching a different name or changing filters.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ==================================================================== */}
      {/* 2. DESKTOP INTERFACE (md:)                                           */}
      {/* ==================================================================== */}
      <div className="hidden md:block space-y-8">
        
        {/* Desktop Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#E5DDD1] pb-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#746F68] font-mono block">
              CUSTOMER DIRECTORY
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#171717] tracking-tight">
              Customer Profile &amp; Orders
            </h2>
            <p className="text-xs text-[#746F68] font-light max-w-2xl font-sans pt-0.5">
              Manage customer profiles, orders and purchase history.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                if (setEmailForm && setActiveTab) {
                  setEmailForm({ target: "all", recipientEmail: "", subject: "", message: "" });
                  setActiveTab("broadcast");
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#E5DDD1] hover:border-[#171717] bg-[#FCFAF7] hover:bg-[#FAF8F5] text-[#171717] text-[10.5px] uppercase tracking-[0.16em] font-mono transition-colors cursor-pointer rounded-[2px]"
            >
              <Mail size={12} className="text-[#C2922E]" /> Send Update
            </button>
          </div>
        </div>

        {/* 4 Stats Cards Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="border border-[#E5DDD1] bg-[#FCFAF7] rounded-[4px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2">
            <span className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-normal text-[#111113] tracking-tight leading-none block">
              {String(uniqueClientsList.length).padStart(2, '0')}
            </span>
            <div>
              <span className="text-[10px] uppercase tracking-[0.16em] text-[#746F68] font-mono block">
                TOTAL PATRONS
              </span>
              <span className="text-xs text-[#746F68] font-sans font-light">
                Verified client directory
              </span>
            </div>
          </div>

          <div className="border border-[#E5DDD1] bg-[#FCFAF7] rounded-[4px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2">
            <span className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-normal text-[#111113] tracking-tight leading-none block">
              {String(totalOrdersCompleted).padStart(2, '0')}
            </span>
            <div>
              <span className="text-[10px] uppercase tracking-[0.16em] text-[#746F68] font-mono block">
                COMMISSIONS
              </span>
              <span className="text-xs text-[#746F68] font-sans font-light">
                Orders fulfilled
              </span>
            </div>
          </div>

          <div className="border border-[#E5DDD1] bg-[#FCFAF7] rounded-[4px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2">
            <span className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-normal text-[#111113] tracking-tight leading-none block">
              {formatINR(totalRevenueGenerated)}
            </span>
            <div>
              <span className="text-[10px] uppercase tracking-[0.16em] text-[#746F68] font-mono block">
                LIFETIME VALUE
              </span>
              <span className="text-xs text-[#746F68] font-sans font-light">
                Total atelier revenue
              </span>
            </div>
          </div>

          <div className="border border-[#E5DDD1] bg-[#FCFAF7] rounded-[4px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-2">
            <span className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-normal text-[#111113] tracking-tight leading-none block">
              {String(activeClientsCount).padStart(2, '0')}
            </span>
            <div>
              <span className="text-[10px] uppercase tracking-[0.16em] text-[#746F68] font-mono block">
                ACTIVE PATRONS
              </span>
              <span className="text-xs text-[#746F68] font-sans font-light">
                Patrons with orders
              </span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DDD1] pb-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 font-mono text-[10.5px] uppercase tracking-[0.14em]">
            {[
              { id: "all", label: "ALL PATRONS" },
              { id: "recent", label: "RECENT" },
              { id: "high_value", label: "HIGH VALUE" },
              { id: "new", label: "NEW" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPatronFilter(tab.id)}
                className={`py-2 px-4 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                  patronFilter === tab.id
                    ? "border-[#171717] text-[#171717] font-semibold bg-[#FAF8F5]/80"
                    : "border-transparent text-[#746F68] hover:text-[#171717] hover:border-[#C5BDB2]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Desktop Search Input */}
          <div className="relative w-full sm:w-72">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#746F68] pointer-events-none" />
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Search patron registry..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#FCFAF7] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#171717] text-[#171717] placeholder:text-[#746F68] font-sans transition-colors"
            />
            {clientSearch && (
              <button
                type="button"
                onClick={() => setClientSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#746F68] hover:text-[#171717] p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Main Customer Registry — Desktop Table View */}
        <div className="border border-[#E5DDD1] bg-[#FCFAF7] rounded-[4px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-xs">
              <thead className="bg-[#FAF8F5] text-[9.5px] uppercase tracking-[0.16em] text-[#746F68] font-mono border-b border-[#E5DDD1]">
                <tr>
                  <th className="py-4 px-6 font-medium min-w-[220px]">CLIENT</th>
                  <th className="py-4 px-5 font-medium whitespace-nowrap">STATUS</th>
                  <th className="py-4 px-5 font-medium whitespace-nowrap">ORDERS &amp; SPEND</th>
                  <th className="py-4 px-5 font-medium whitespace-nowrap">LAST ACTIVITY</th>
                  <th className="py-4 px-6 font-medium text-right whitespace-nowrap">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD1]/70 text-[#171717]">
                {filteredPatrons.map((client, idx) => {
                  let statusLabel = "New Patron";
                  let statusStyle = "text-[#746F68] bg-[#FAF8F5] border-[#E5DDD1]";
                  if (client.totalSpent >= 25000 || client.orderCount >= 3) {
                    statusLabel = "VIP Patron";
                    statusStyle = "text-[#7A5B15] bg-[#F7F0E1] border-[#DECBA6]";
                  } else if (client.orderCount > 1) {
                    statusLabel = "Returning Client";
                    statusStyle = "text-[#171717] bg-[#EFE9DF] border-[#DDD5C7]";
                  }

                  const clientSince = client.joinedDate || client.created_at || (client.orders?.[client.orders.length - 1]?.date);
                  const clientSinceFormatted = clientSince
                    ? new Date(clientSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                    : "Sep 2026";

                  return (
                    <tr
                      key={client.email || idx}
                      className="hover:bg-[#F5F0E8]/40 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <p className="font-serif text-[15px] font-medium text-[#111113] group-hover:text-[#C2922E] transition-colors leading-snug">
                            {client.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-[#746F68] font-sans">
                            <span>{client.city !== "—" ? client.city : "Atelier Client"}</span>
                            <span className="text-[#C5BDB2]">&middot;</span>
                            <span className="text-[10.5px] font-mono text-[#8C8275]">
                              Client since {clientSinceFormatted}
                            </span>
                          </div>
                          {(client.email || client.phone) && (
                            <p className="text-[10.5px] font-mono text-[#8C8275] pt-0.5 truncate max-w-xs">
                              {client.email || client.phone}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-[2px] border text-[9.5px] font-mono uppercase tracking-[0.10em] font-medium whitespace-nowrap ${statusStyle}`}>
                          {statusLabel}
                        </span>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-serif text-base font-normal text-[#111113] block leading-tight">
                            {formatINR(client.totalSpent)}
                          </span>
                          <span className="text-[10.5px] font-mono text-[#746F68] block">
                            {String(client.orderCount).padStart(2, "0")} {client.orderCount === 1 ? "Commission" : "Commissions"}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-mono text-xs text-[#111113] block">
                            {client.lastOrderDate
                              ? new Date(client.lastOrderDate).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                })
                              : "—"}
                          </span>
                          <span className="text-[11px] text-[#746F68] font-serif italic block truncate max-w-[170px]">
                            {client.purchasedGarments?.[0]?.name || (client.orderCount > 0 ? "Tailored Bespoke Piece" : "Inquiry / Registry")}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openClientProfile(client)}
                          className="whitespace-nowrap px-3.5 py-1.5 border border-[#E5DDD1] hover:border-[#C2922E] bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#111113] hover:text-[#C2922E] transition-all font-mono text-[10.5px] uppercase tracking-[0.14em] font-medium inline-flex items-center gap-1.5 cursor-pointer rounded-[2px]"
                        >
                          Open Client &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
