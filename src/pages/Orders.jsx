import React, { useState, useEffect, useMemo } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Package, Clock, CheckCircle2, Truck, AlertCircle, 
  ArrowRight, ShoppingBag, Search, RefreshCw, 
  MessageSquare, ChevronRight, XCircle, X,
  UploadCloud, QrCode, ShieldCheck, Copy, Check, Eye, 
  Download, FileText, Calendar, CreditCard, ArrowLeft, 
  HelpCircle, Sparkles, ChevronDown, ExternalLink
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatINR } from "../data/products";
import { apiClient, API_BASE_URL } from "../config/api";
import SEO from "../components/SEO";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  const datePart = d.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = d.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${datePart} · ${timePart}`;
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateOnly = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: '2-digit', month: 'short' });
};

const Orders = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [downloadingDoc, setDownloadingDoc] = useState(null);

  // Cancellation State
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState("Changed my mind / No longer needed");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Re-submit payment proof state
  const [reSubmittingOrder, setReSubmittingOrder] = useState(null);
  const [reSubmitUtr, setReSubmitUtr] = useState("");
  const [reSubmitFile, setReSubmitFile] = useState(null);
  const [reSubmitPreview, setReSubmitPreview] = useState(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  useEffect(() => {
    if (user?.authenticated && token) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/api/orders');
      if (Array.isArray(data)) setOrders(data);
    } catch (err) {
      console.error(err);
      toast.error("Could not load order history.");
    } finally {
      setLoading(false);
    }
  };

  const resolveOrderTotal = (order) => {
    const raw = Number(order?.total);
    if (raw && !isNaN(raw) && raw > 0) return raw;
    const itemsSum = (order?.items || []).reduce((acc, it) => 
      acc + (Number(it.price_at_purchase || it.product?.price || it.price || 0) * (Number(it.quantity) || 1)), 0);
    return itemsSum > 0 ? itemsSum : 4800;
  };

  const resolveItemPrice = (it, order) => {
    const raw = Number(it?.price_at_purchase || it?.product?.price || it?.price);
    if (raw && !isNaN(raw) && raw > 0) return raw;
    const orderTotal = resolveOrderTotal(order);
    const count = order?.items?.length || 1;
    return Math.round(orderTotal / count);
  };

  const handleDownloadPdf = async (orderId, type = "invoice") => {
    const key = `${orderId}_${type}`;
    setDownloadingDoc(key);
    const docName = type === "packing_slip" ? "Packing Slip" : (type === "receipt" ? "Payment Receipt" : "Tax Invoice");
    const toastId = toast.loading(`Generating official ${docName}...`);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/pdf?type=${type}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Failed to generate ${docName}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const docLabel = type === "packing_slip" ? "PackingSlip" : (type === "receipt" ? "Receipt" : "Invoice");
      a.download = `SUKO-${docLabel}-${1000 + orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${docName} downloaded successfully`, { id: toastId });
    } catch (err) {
      toast.error(err.message || "Failed to download document", { id: toastId });
    } finally {
      setDownloadingDoc(null);
    }
  };

  const handleOpenCancelModal = (order) => {
    setCancellingOrder(order);
    setCancelReasonPreset("Changed my mind / No longer needed");
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancellingOrder) return;
    setSubmittingCancel(true);
    const finalReason = cancelReasonPreset === "Other (specify below)" 
      ? (customCancelReason.trim() || "Not specified") 
      : cancelReasonPreset;
    try {
      await apiClient.patch(`/api/orders/${cancellingOrder.id}/cancel`, { reason: finalReason });
      toast.success(`Cancellation request for Order #SUKO-${1000 + cancellingOrder.id} submitted!`);
      setCancellingOrder(null);
      if (selectedOrderDetail?.id === cancellingOrder.id) {
        setSelectedOrderDetail(prev => ({ ...prev, status: "cancel_requested" }));
      }
      fetchOrders();
    } catch (err) {
      toast.error(err.message || "Failed to request cancellation.");
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleOpenReSubmitModal = (order) => {
    setReSubmittingOrder(order);
    setReSubmitUtr(order.transaction_id || "");
    setReSubmitFile(null);
    setReSubmitPreview(null);
  };

  const handleReSubmitFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast.error("Please upload a JPG, JPEG, PNG, or WebP image.");
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Screenshot file size must be under 5 MB.");
      return;
    }
    setReSubmitFile(file);
    const reader = new FileReader();
    reader.onload = () => setReSubmitPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleReSubmitProof = async (e) => {
    e.preventDefault();
    if (!reSubmittingOrder) return;
    if (!reSubmitUtr.trim()) { toast.error("Transaction ID / UTR is required"); return; }
    if (!reSubmitPreview) { toast.error("Payment screenshot is required"); return; }
    setIsSubmittingProof(true);
    try {
      await apiClient.post(`/api/orders/${reSubmittingOrder.id}/submit-payment-proof`, {
        transactionId: reSubmitUtr.trim(),
        screenshotBase64: reSubmitPreview
      });
      toast.success("Payment details submitted for concierge verification!");
      setReSubmittingOrder(null);
      setReSubmitUtr("");
      setReSubmitFile(null);
      setReSubmitPreview(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.message || "Failed to submit payment details");
    } finally {
      setIsSubmittingProof(false);
    }
  };

  if (!user?.authenticated) return <Navigate to="/auth" />;

  // Status Badge Rendering
  const getStatusBadges = (status) => {
    const st = (status || "").toLowerCase();
    if (st === "completed" || st === "delivered") {
      return (
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-medium">
            <Check size={11} className="text-emerald-600" /> Payment Verified
          </span>
          <span className="bg-[#FAF8F5] border border-[#DDD8CE] text-[#111113] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-medium">
            <CheckCircle2 size={11} className="text-[#C2922E]" /> Delivered
          </span>
        </div>
      );
    }
    if (st === "shipped" || st === "in_transit") {
      return (
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-medium">
            <Check size={11} className="text-emerald-600" /> Payment Verified
          </span>
          <span className="bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-medium">
            <Truck size={11} className="text-[#C2922E]" /> In Transit
          </span>
        </div>
      );
    }
    if (st === "processing") {
      return (
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-medium">
            <Check size={11} className="text-emerald-600" /> Payment Verified
          </span>
          <span className="bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-medium">
            <RefreshCw size={10} className="animate-spin text-[#C2922E]" /> In Production
          </span>
        </div>
      );
    }
    if (st === "paid") {
      return (
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-medium">
            <Check size={11} className="text-emerald-600" /> Payment Verified
          </span>
          <span className="bg-[#FAF8F5] border border-[#DDD8CE] text-[#111113] px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-medium">
            <Check size={11} className="text-[#C2922E]" /> Order Confirmed
          </span>
        </div>
      );
    }
    if (st === "cancelled") {
      return (
        <span className="bg-stone-100 border border-stone-200 text-stone-600 text-[10px] px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 font-medium">
          <XCircle size={11} className="text-stone-500" /> Cancelled
        </span>
      );
    }
    if (st === "cancel_requested") {
      return (
        <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 font-medium">
          <AlertCircle size={11} className="text-[#C2922E]" /> Cancellation Requested
        </span>
      );
    }
    return (
      <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 font-medium">
        <Clock size={11} className="text-[#C2922E]" /> Awaiting Payment
      </span>
    );
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const st = (o.status || "").toLowerCase();
      if (statusFilter !== "all") {
        if (statusFilter === "processing" && st !== "processing" && st !== "paid") return false;
        if (statusFilter === "delivered" && st !== "delivered" && st !== "completed") return false;
        if (statusFilter === "cancelled" && st !== "cancelled" && st !== "cancel_requested") return false;
      }
      if (dateFilter !== "all" && o.created_at) {
        const orderTime = new Date(o.created_at).getTime();
        const now = Date.now();
        if (dateFilter === "30days" && (now - orderTime) > 30 * 24 * 60 * 60 * 1000) return false;
        if (dateFilter === "3months" && (now - orderTime) > 90 * 24 * 60 * 60 * 1000) return false;
        if (dateFilter === "2026") {
          const year = new Date(o.created_at).getFullYear();
          if (year !== 2026) return false;
        }
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchId = String(o.id).includes(q) || `suko-${1000 + o.id}`.includes(q);
        const matchItems = o.items?.some(i => 
          (i.product?.name || i.product_name || "").toLowerCase().includes(q) ||
          (i.size || "").toLowerCase().includes(q) ||
          (i.color || "").toLowerCase().includes(q)
        );
        if (!matchId && !matchItems) return false;
      }
      return true;
    });
  }, [orders, statusFilter, dateFilter, searchQuery]);

  // Render Order Journey / Timeline Component
  const renderOrderJourney = (order) => {
    const st = (order.status || "").toLowerCase();
    const isCancelled = st === "cancelled" || st === "cancel_requested";
    const dateFormatted = formatDateOnly(order.created_at);

    if (isCancelled) {
      return (
        <div className="bg-stone-50 border border-stone-200 p-4 text-xs font-mono space-y-1">
          <span className="text-stone-500 uppercase tracking-widest text-[9.5px]">ORDER STATUS</span>
          <p className="font-semibold text-stone-800">
            {st === "cancel_requested" ? "Cancellation Request Under Review" : "Requisition Cancelled"}
          </p>
          <p className="text-[#8C887B] text-[11px] font-sans">
            {order.cancel_reason ? `Reason: ${order.cancel_reason}` : "Our atelier concierge will assist with reversal or alternatives."}
          </p>
        </div>
      );
    }

    const steps = [
      {
        label: "Order Placed",
        date: dateFormatted,
        done: true,
        current: false
      },
      {
        label: "Payment Confirmed",
        date: (st !== "pending_payment" && st !== "payment_verification_pending") ? dateFormatted : null,
        done: st !== "pending_payment" && st !== "payment_verification_pending",
        current: st === "pending_payment" || st === "payment_verification_pending"
      },
      {
        label: "In Production",
        date: null,
        done: st === "processing" || st === "shipped" || st === "in_transit" || st === "delivered" || st === "completed",
        current: st === "processing" || st === "paid"
      },
      {
        label: "Dispatched",
        date: null,
        done: st === "shipped" || st === "in_transit" || st === "delivered" || st === "completed",
        current: st === "shipped" || st === "in_transit"
      },
      {
        label: "Delivered",
        date: null,
        done: st === "delivered" || st === "completed",
        current: false
      }
    ];

    return (
      <div className="space-y-3">
        <span className="text-[10px] uppercase tracking-[0.24em] text-[#C2922E] font-mono font-medium block">
          — ORDER JOURNEY
        </span>

        {/* Desktop Horizontal Stepper */}
        <div className="hidden sm:grid grid-cols-5 gap-2 relative">
          <div className="absolute top-3 left-4 right-4 h-[1px] bg-[#DDD8CE] -z-0" />
          {steps.map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center space-y-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors ${
                step.done 
                  ? "bg-[#111113] text-white ring-2 ring-[#C2922E]" 
                  : (step.current ? "bg-[#C2922E] text-white animate-pulse" : "bg-white border border-[#DDD8CE] text-[#8C887B]")
              }`}>
                {step.done ? <Check size={12} /> : (step.current ? "◉" : "○")}
              </div>
              <div>
                <p className={`text-[11px] font-medium leading-tight ${step.done || step.current ? "text-[#111113]" : "text-[#8C887B]"}`}>
                  {step.label}
                </p>
                {step.date && (
                  <span className="text-[9.5px] font-mono text-[#8C887B] block mt-0.5">{step.date}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Vertical Stepper */}
        <div className="sm:hidden space-y-3 pl-2 border-l-2 border-[#DDD8CE]">
          {steps.map((step, idx) => (
            <div key={idx} className="relative pl-4">
              <div className={`absolute -left-[11px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                step.done 
                  ? "bg-[#111113] text-white ring-1 ring-[#C2922E]" 
                  : (step.current ? "bg-[#C2922E] text-white animate-pulse" : "bg-white border border-[#DDD8CE] text-[#8C887B]")
              }`}>
                {step.done ? <Check size={9} /> : (step.current ? "◉" : "○")}
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className={`text-xs font-medium ${step.done || step.current ? "text-[#111113]" : "text-[#8C887B]"}`}>
                  {step.label}
                </span>
                {step.date && (
                  <span className="text-[10px] font-mono text-[#8C887B]">{step.date}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#FAF8F5] text-[#111113] font-body selection:bg-[#C2922E] selection:text-white pt-24 sm:pt-32 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-12 min-h-screen">
      <SEO 
        title="My Orders | SUKO Atelier" 
        description="Review your bespoke garments, track delivery, and access your official GST tax invoices and payment receipts." 
      />

      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* ========================================================================= */}
        {/* 1. HEADER SECTION                                                         */}
        {/* ========================================================================= */}
        <div className="border-b border-[#EAE6DF] pb-7">
          <div className="sm:hidden mb-3">
            <Link to="/account" className="inline-flex items-center gap-1.5 text-xs text-[#6E6E75] hover:text-[#111113] font-mono transition-colors">
              <ArrowLeft size={13} />
              <span>Back to Account</span>
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2">
                <span className="w-3.5 h-[1.5px] bg-[#C2922E]" />
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#C2922E] font-medium font-mono">
                  CLIENT ATELIER CONCIERGE
                </span>
              </div>
              
              <h1 className="font-quiche text-3xl sm:text-4xl lg:text-[42px] font-light text-[#111113] tracking-tight leading-tight">
                My Orders
              </h1>
              
              <p className="text-xs sm:text-[13px] text-[#6E6E75] font-light leading-relaxed max-w-xl">
                Review your bespoke garments, track delivery and access your documents.
              </p>

              <div className="pt-2">
                <Link 
                  to="/collection" 
                  className="inline-flex items-center justify-center gap-2 bg-[#111113] hover:bg-[#C2922E] text-white px-5 py-2.5 text-[10px] sm:text-[10.5px] uppercase tracking-[0.2em] font-medium transition-all shadow-xs"
                >
                  <ShoppingBag size={13} />
                  <span>Continue Shopping</span>
                </Link>
              </div>
            </div>

            {/* Right Side: Need Assistance? Contact Concierge */}
            <div className="pt-2 md:pt-0 text-left md:text-right space-y-1 border-t md:border-t-0 border-[#EAE6DF] pt-4 md:pt-0">
              <span className="text-xs text-[#6E6E75] block">Need Assistance?</span>
              <a 
                href="https://wa.me/919370350885?text=Hi%20SUKO%20Atelier,%20I%20need%20assistance%20with%20my%20orders." 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#111113] hover:text-[#C2922E] font-medium transition-colors"
              >
                <span>Contact Concierge</span>
                <ArrowRight size={13} className="text-[#C2922E]" />
              </a>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. FILTER SECTION                                                         */}
        {/* ========================================================================= */}
        <div className="bg-white border border-[#EAE6DF] p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8C887B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders or garments..."
                className="w-full bg-[#FAF8F5] border border-[#DDD8CE] py-2 pl-9 pr-4 text-xs font-body text-[#111113] placeholder-[#8C887B] outline-none focus:border-[#C2922E] transition-colors"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-2.5 text-xs">
              {/* Status Dropdown */}
              <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#DDD8CE] px-3 py-1.5">
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)} 
                  className="bg-transparent text-[#111113] text-xs outline-none cursor-pointer font-medium"
                >
                  <option value="all">Status ▼</option>
                  <option value="processing">Processing</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date Dropdown */}
              <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#DDD8CE] px-3 py-1.5">
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)} 
                  className="bg-transparent text-[#111113] text-xs outline-none cursor-pointer font-medium"
                >
                  <option value="all">Date ▼</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="2026">2026 Editions</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-24 text-center space-y-4">
            <div className="w-8 h-8 border-2 border-[#111113] border-t-[#C2922E] rounded-full animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-[0.24em] font-mono text-[#6E6E75]">
              Retrieving your bespoke orders &amp; documents...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <div className="border border-[#EAE6DF] p-12 sm:p-16 text-center bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#F5F2EB] border border-[#EAE6DF] flex items-center justify-center mx-auto text-[#C2922E]">
              <Package size={24} strokeWidth={1.3} />
            </div>
            <h3 className="font-quiche text-2xl font-light text-[#111113]">No Orders Found</h3>
            <p className="text-xs font-body text-[#6E6E75] max-w-sm mx-auto leading-relaxed">
              {searchQuery || statusFilter !== "all" || dateFilter !== "all"
                ? "No bespoke requisitions match your active filters. Try resetting search or filter options."
                : "You have not placed any orders with SUKO Atelier yet. Explore our bespoke seasonal silhouettes."}
            </p>
            <div className="pt-2">
              <Link to="/collection" className="inline-flex items-center gap-2 bg-[#111113] hover:bg-[#C2922E] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-medium transition-all shadow-xs">
                Browse Collection <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. ORDER CARDS (MAIN LIST)                                                */}
        {/* ========================================================================= */}
        {!loading && filteredOrders.length > 0 && (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const orderTotal = resolveOrderTotal(order);
              const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
                {
                  id: "def",
                  product_name: "Savile Double-Breasted Blazer",
                  size: "M",
                  color: "Obsidian Black",
                  quantity: 1,
                  price_at_purchase: orderTotal,
                  product: {
                    name: "Savile Double-Breasted Blazer",
                    image_url: "/products/plum-sculpted-double-breasted-blazer/1.JPG",
                    color: "Obsidian Black",
                    price: orderTotal
                  }
                }
              ];
              const primaryItem = items[0];
              const additionalItemsCount = items.length - 1;

              return (
                <div 
                  key={order.id} 
                  className="border border-[#EAE6DF] hover:border-[#C2922E] bg-white transition-all duration-300 shadow-xs overflow-hidden"
                >
                  {/* DESKTOP CARD VIEW */}
                  <div className="hidden sm:block p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-6">
                      
                      {/* Left: Product Image + Garment Specs */}
                      <div className="flex items-start gap-5 lg:gap-6 min-w-0 flex-1">
                        <div className="relative w-24 h-32 lg:w-28 lg:h-36 bg-[#FAF8F5] border border-[#EAE6DF] overflow-hidden shrink-0 shadow-2xs group">
                          <img 
                            src={primaryItem.product?.image_url || primaryItem.product_image_url || "/products/plum-sculpted-double-breasted-blazer/1.JPG"} 
                            alt={primaryItem.product?.name || primaryItem.product_name || "Garment"} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {additionalItemsCount > 0 && (
                            <span className="absolute bottom-1 right-1 bg-[#111113]/90 text-white font-mono text-[9px] px-1.5 py-0.5 tracking-wider">
                              +{additionalItemsCount} more
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 min-w-0 flex-1">
                          <h3 className="font-quiche text-lg lg:text-xl text-[#111113] font-medium tracking-tight truncate">
                            {primaryItem.product?.name || primaryItem.product_name || "Savile Double-Breasted Blazer"}
                          </h3>

                          <div className="space-y-0.5 text-xs text-[#6E6E75]">
                            <p className="text-[#111113] font-medium">
                              {primaryItem.color || primaryItem.product?.color || "Obsidian Black"}
                            </p>
                            <p className="font-mono text-[11.5px]">
                              Size: <span className="text-[#111113] font-semibold">{primaryItem.size || "M"}</span>
                              <span className="mx-2 text-[#DDD8CE]">|</span>
                              Quantity: <span className="text-[#111113] font-semibold">{primaryItem.quantity || 1}</span>
                            </p>
                          </div>

                          <div className="pt-1 text-[11px] font-mono text-[#8C887B] space-y-0.5">
                            <div className="text-[#111113] font-bold tracking-wider">
                              ORDER #SUKO-{1000 + order.id}
                            </div>
                            <div>
                              Placed: <span className="text-[#44444C]">{formatDateShort(order.created_at)}</span>
                            </div>
                          </div>

                          <div className="pt-1">
                            {getStatusBadges(order.status)}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Action Buttons */}
                      <div className="flex flex-col items-end justify-between self-stretch shrink-0 pl-6 border-l border-[#EAE6DF]">
                        <div className="text-right">
                          <span className="text-[9.5px] uppercase tracking-[0.2em] font-mono text-[#8C887B] block">
                            ORDER TOTAL
                          </span>
                          <span className="font-mono text-2xl font-bold text-[#111113]">
                            {formatINR(orderTotal)}
                          </span>
                        </div>

                        <div className="space-y-2 pt-4">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetail(order)}
                            className="w-full bg-[#111113] hover:bg-[#C2922E] text-white px-5 py-2.5 text-[10.5px] uppercase tracking-[0.2em] font-medium transition-all shadow-xs cursor-pointer text-center block"
                          >
                            View Details
                          </button>
                          
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(order.id, "invoice")}
                              disabled={downloadingDoc === `${order.id}_invoice`}
                              className="bg-white hover:bg-[#FAF8F5] border border-[#DDD8CE] hover:border-[#C2922E] text-[#111113] hover:text-[#C2922E] px-3.5 py-2 text-[10px] uppercase tracking-[0.18em] font-medium transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <Download size={11} className="text-[#C2922E]" />
                              <span>Invoice PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(order.id, "receipt")}
                              disabled={downloadingDoc === `${order.id}_receipt`}
                              className="bg-white hover:bg-[#FAF8F5] border border-[#DDD8CE] hover:border-[#C2922E] text-[#111113] hover:text-[#C2922E] px-3.5 py-2 text-[10px] uppercase tracking-[0.18em] font-medium transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <FileText size={11} className="text-[#8C887B]" />
                              <span>Receipt PDF</span>
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* MOBILE CARD VIEW */}
                  <div className="sm:hidden p-4 space-y-3.5">
                    <div className="flex gap-3.5 items-start">
                      <div className="w-20 h-28 bg-[#FAF8F5] border border-[#EAE6DF] overflow-hidden shrink-0">
                        <img 
                          src={primaryItem.product?.image_url || primaryItem.product_image_url || "/products/plum-sculpted-double-breasted-blazer/1.JPG"} 
                          alt={primaryItem.product?.name || primaryItem.product_name || "Garment"} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="font-quiche text-sm font-medium text-[#111113] line-clamp-2 leading-snug">
                          {primaryItem.product?.name || primaryItem.product_name || "Savile Double-Breasted Blazer"}
                        </h3>
                        <p className="font-mono text-base font-bold text-[#111113]">
                          {formatINR(orderTotal)}
                        </p>
                        <div className="text-[10.5px] font-mono text-[#8C887B]">
                          #SUKO-{1000 + order.id} &bull; {formatDateShort(order.created_at)}
                        </div>
                        <div className="pt-0.5">
                          {getStatusBadges(order.status)}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#EAE6DF] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderDetail(order)}
                        className="text-xs font-medium uppercase tracking-[0.18em] text-[#111113] hover:text-[#C2922E] flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Order</span>
                        <ArrowRight size={13} className="text-[#C2922E]" />
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(order.id, "invoice")}
                          className="text-[10px] uppercase font-mono tracking-wider border border-[#DDD8CE] px-2.5 py-1 bg-[#FAF8F5] text-[#111113] cursor-pointer"
                        >
                          Invoice
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(order.id, "receipt")}
                          className="text-[10px] uppercase font-mono tracking-wider border border-[#DDD8CE] px-2.5 py-1 bg-[#FAF8F5] text-[#111113] cursor-pointer"
                        >
                          Receipt
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment Re-submission Banner if pending */}
                  {order.status === "pending_payment" && (
                    <div className="bg-amber-50/90 border-t border-amber-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-[#C2922E] shrink-0" />
                        <span className="text-amber-950 font-medium">Awaiting UPI Settlement &amp; UTR Verification</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenReSubmitModal(order)}
                        className="bg-[#111113] hover:bg-[#C2922E] text-white px-3 py-1 text-[9.5px] uppercase tracking-wider font-medium transition-all shadow-xs cursor-pointer"
                      >
                        Pay &amp; Upload
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. ORDER DETAILS (MODAL ON DESKTOP / FULL PAGE ON MOBILE)                   */}
        {/* ========================================================================= */}
        {selectedOrderDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto animate-fadeIn">
            <div className="bg-[#FAF8F5] w-full max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[92vh] sm:rounded-xs shadow-2xl flex flex-col overflow-hidden border border-[#EAE6DF]">
              
              {/* Modal Header */}
              <div className="bg-white px-5 sm:px-8 py-4 border-b border-[#EAE6DF] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <button 
                    type="button" 
                    onClick={() => setSelectedOrderDetail(null)} 
                    className="p-1.5 -ml-1 text-[#6E6E75] hover:text-[#111113] transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={17} />
                  </button>
                  <div>
                    <h2 className="font-quiche text-lg sm:text-2xl font-light text-[#111113]">
                      Order Details &mdash; #SUKO-{1000 + selectedOrderDetail.id}
                    </h2>
                    <p className="text-[11px] font-mono text-[#6E6E75]">
                      Placed on {formatDateTime(selectedOrderDetail.created_at)}
                    </p>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={() => setSelectedOrderDetail(null)} 
                  className="p-2 text-[#8C887B] hover:text-[#111113] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8 bg-[#FAF8F5]">
                
                {/* ORDER JOURNEY SECTION */}
                <div className="bg-white p-5 sm:p-6 border border-[#EAE6DF] shadow-xs">
                  {renderOrderJourney(selectedOrderDetail)}
                </div>

                {/* 2-COLUMN SECTION: LEFT GARMENT DETAILS | RIGHT ORDER SUMMARY */}
                <div className="grid lg:grid-cols-12 gap-6 items-start">
                  
                  {/* LEFT: GARMENT DETAILS */}
                  <div className="lg:col-span-7 bg-white p-5 sm:p-6 border border-[#EAE6DF] shadow-xs space-y-4">
                    <h3 className="font-quiche text-base font-medium text-[#111113] pb-2 border-b border-[#EAE6DF]">
                      Garment Details
                    </h3>

                    <div className="divide-y divide-[#EAE6DF]">
                      {(selectedOrderDetail.items && selectedOrderDetail.items.length > 0 ? selectedOrderDetail.items : [
                        {
                          id: "def",
                          product_name: "Savile Double-Breasted Blazer",
                          size: "M",
                          color: "Obsidian Black",
                          quantity: 1,
                          price_at_purchase: resolveOrderTotal(selectedOrderDetail),
                          product: {
                            name: "Savile Double-Breasted Blazer",
                            image_url: "/products/plum-sculpted-double-breasted-blazer/1.JPG",
                            color: "Obsidian Black"
                          }
                        }
                      ]).map((it, idx) => (
                        <div key={it.id || idx} className="py-4 flex items-start gap-4">
                          <div className="w-20 h-28 sm:w-24 sm:h-32 bg-[#FAF8F5] border border-[#EAE6DF] overflow-hidden shrink-0 shadow-2xs">
                            <img 
                              src={it.product?.image_url || it.product_image_url || "/products/plum-sculpted-double-breasted-blazer/1.JPG"} 
                              alt={it.product?.name || it.product_name} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <h4 className="font-quiche text-base text-[#111113] font-medium leading-snug">
                              {it.product?.name || it.product_name || "Savile Double-Breasted Blazer"}
                            </h4>
                            <div className="text-xs text-[#6E6E75] space-y-0.5">
                              <p><span className="text-[#8C887B]">Color:</span> <strong className="text-[#111113] font-medium">{it.color || it.product?.color || "Obsidian Black"}</strong></p>
                              <p><span className="text-[#8C887B]">Size:</span> <strong className="text-[#111113] font-medium">{it.size || "M"}</strong></p>
                              <p><span className="text-[#8C887B]">Fabric:</span> <span className="text-[#111113]">Premium Wool Blend</span></p>
                              <p><span className="text-[#8C887B]">Quantity:</span> <span className="text-[#111113] font-mono">{it.quantity || 1}</span></p>
                            </div>
                            <p className="font-mono text-sm font-bold text-[#111113] pt-1">
                              {formatINR(resolveItemPrice(it, selectedOrderDetail))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RIGHT: ORDER SUMMARY & PAYMENT */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-5 sm:p-6 border border-[#EAE6DF] shadow-xs space-y-4">
                      <h3 className="font-quiche text-base font-medium text-[#111113] pb-2 border-b border-[#EAE6DF]">
                        Order Summary
                      </h3>

                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between text-[#6E6E75]">
                          <span>Subtotal:</span>
                          <span className="font-mono text-[#111113] font-medium">{formatINR(resolveOrderTotal(selectedOrderDetail))}</span>
                        </div>
                        {Number(selectedOrderDetail.discount) > 0 && (
                          <div className="flex justify-between text-emerald-800 font-mono">
                            <span>Privilege Privilege:</span>
                            <span>-{formatINR(selectedOrderDetail.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[#6E6E75]">
                          <span>Shipping:</span>
                          <span className="text-[#C2922E] font-medium uppercase font-mono text-[10.5px]">Complimentary</span>
                        </div>
                        <div className="flex justify-between text-[#111113] font-bold text-sm border-t border-[#EAE6DF] pt-3 mt-1">
                          <span>Total:</span>
                          <span className="font-mono text-base">{formatINR(resolveOrderTotal(selectedOrderDetail))}</span>
                        </div>
                      </div>

                      {/* Payment Specs */}
                      <div className="border-t border-[#EAE6DF] pt-3 text-xs space-y-1">
                        <span className="text-[9.5px] uppercase tracking-wider font-mono text-[#8C887B] block">Payment</span>
                        <div className="flex justify-between items-center pt-0.5">
                          <span className="font-medium text-[#111113]">
                            {(selectedOrderDetail.payment_method || "UPI").toUpperCase().includes("UPI") ? "UPI Transfer" : "Online Settlement"}
                          </span>
                          <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-200 text-[10px] font-mono uppercase tracking-wider">
                            Paid
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Destination */}
                    <div className="bg-white p-5 sm:p-6 border border-[#EAE6DF] shadow-xs space-y-2">
                      <h3 className="font-quiche text-sm font-medium text-[#111113] pb-2 border-b border-[#EAE6DF]">
                        Delivery Destination
                      </h3>
                      <div className="text-xs space-y-0.5 text-[#6E6E75]">
                        <p className="font-medium text-[#111113]">{selectedOrderDetail.shipping_name || selectedOrderDetail.name || user?.name || "Valued Patron"}</p>
                        <p>{selectedOrderDetail.shipping_line1 || selectedOrderDetail.line1 || "Atelier Delivery Address"}</p>
                        <p>{[selectedOrderDetail.shipping_city || selectedOrderDetail.city, selectedOrderDetail.shipping_state || selectedOrderDetail.state, selectedOrderDetail.shipping_pincode || selectedOrderDetail.pincode].filter(Boolean).join(", ")}</p>
                        <p className="text-[#8C887B] font-mono text-[11px] pt-1">
                          Contact: {selectedOrderDetail.shipping_phone || selectedOrderDetail.phone || "On File"}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* ========================================================================= */}
                {/* 5. DOCUMENTS SECTION (3 SEPARATE CLEAN CARDS)                             */}
                {/* ========================================================================= */}
                <div className="space-y-3">
                  <div className="border-b border-[#EAE6DF] pb-2">
                    <span className="text-[10px] uppercase tracking-[0.26em] text-[#C2922E] font-mono font-medium block">
                      — ATELIER DOCUMENTS
                    </span>
                    <h3 className="font-quiche text-lg font-light text-[#111113]">
                      Official Archival Documentation
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* Card 1: Tax Invoice */}
                    <div className="bg-white border border-[#EAE6DF] hover:border-[#C2922E] p-5 shadow-xs transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#C2922E] mb-1">
                          <Download size={16} />
                          <span className="text-[9.5px] uppercase font-mono tracking-wider font-semibold">Commercial</span>
                        </div>
                        <h4 className="font-quiche text-base font-medium text-[#111113]">
                          Tax Invoice
                        </h4>
                        <p className="text-xs text-[#6E6E75] font-light">
                          Official GST tax invoice with billing particulars and tax breakdown.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(selectedOrderDetail.id, "invoice")}
                        disabled={downloadingDoc === `${selectedOrderDetail.id}_invoice`}
                        className="w-full bg-[#111113] hover:bg-[#C2922E] text-white py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Download size={11} />
                        <span>{downloadingDoc === `${selectedOrderDetail.id}_invoice` ? "Generating..." : "Download PDF"}</span>
                      </button>
                    </div>

                    {/* Card 2: Payment Receipt */}
                    <div className="bg-white border border-[#EAE6DF] hover:border-[#C2922E] p-5 shadow-xs transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#C2922E] mb-1">
                          <FileText size={16} />
                          <span className="text-[9.5px] uppercase font-mono tracking-wider font-semibold">Settlement</span>
                        </div>
                        <h4 className="font-quiche text-base font-medium text-[#111113]">
                          Payment Receipt
                        </h4>
                        <p className="text-xs text-[#6E6E75] font-light">
                          Verified payment confirmation showing transaction reference and timestamp.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(selectedOrderDetail.id, "receipt")}
                        disabled={downloadingDoc === `${selectedOrderDetail.id}_receipt`}
                        className="w-full bg-[#111113] hover:bg-[#C2922E] text-white py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Download size={11} />
                        <span>{downloadingDoc === `${selectedOrderDetail.id}_receipt` ? "Generating..." : "Download PDF"}</span>
                      </button>
                    </div>

                    {/* Card 3: Packing Slip */}
                    <div className="bg-white border border-[#EAE6DF] hover:border-[#C2922E] p-5 shadow-xs transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[#C2922E] mb-1">
                          <Package size={16} />
                          <span className="text-[9.5px] uppercase font-mono tracking-wider font-semibold">Logistics</span>
                        </div>
                        <h4 className="font-quiche text-base font-medium text-[#111113]">
                          Packing Slip
                        </h4>
                        <p className="text-xs text-[#6E6E75] font-light">
                          White-glove dispatch and transit manifest document for garment consignment.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(selectedOrderDetail.id, "packing_slip")}
                        disabled={downloadingDoc === `${selectedOrderDetail.id}_packing_slip`}
                        className="w-full bg-[#111113] hover:bg-[#C2922E] text-white py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Download size={11} />
                        <span>{downloadingDoc === `${selectedOrderDetail.id}_packing_slip` ? "Generating..." : "Download PDF"}</span>
                      </button>
                    </div>

                  </div>
                </div>

                {/* Concierge Assistance Footer Bar */}
                <div className="bg-white border border-[#EAE6DF] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="space-y-0.5">
                    <p className="font-medium text-[#111113]">Need help with this order?</p>
                    <p className="text-[#6E6E75]">Our atelier concierge is available for sizing alterations or dispatch tracking.</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <a 
                      href={`https://wa.me/919370350885?text=Hi%20SUKO%20Atelier,%20I%20need%20assistance%20regarding%20my%20Order%20%23SUKO-${1000 + selectedOrderDetail.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs font-medium uppercase tracking-[0.16em] text-[#C2922E] hover:underline flex items-center gap-1"
                    >
                      <span>Contact Concierge &rarr;</span>
                    </a>
                    {selectedOrderDetail.status !== "cancelled" && selectedOrderDetail.status !== "cancel_requested" && selectedOrderDetail.status !== "completed" && selectedOrderDetail.status !== "delivered" && (
                      <button 
                        type="button" 
                        onClick={() => handleOpenCancelModal(selectedOrderDetail)} 
                        className="text-stone-500 hover:text-rose-700 text-[10.5px] font-mono underline transition-colors cursor-pointer"
                      >
                        Cancel Requisition
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-white px-5 sm:px-8 py-3.5 border-t border-[#EAE6DF] flex justify-end">
                <button 
                  type="button" 
                  onClick={() => setSelectedOrderDetail(null)} 
                  className="bg-[#111113] hover:bg-[#C2922E] text-white px-6 py-2.5 text-xs uppercase tracking-[0.2em] font-medium transition-all cursor-pointer"
                >
                  Close Details
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CANCEL MODAL                                                              */}
        {/* ========================================================================= */}
        {cancellingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-[#FAF8F5] border border-[#EAE6DF] max-w-md w-full p-6 sm:p-8 relative shadow-2xl font-body text-[#111113]">
              <button 
                onClick={() => setCancellingOrder(null)} 
                className="absolute top-4 right-4 text-[#6E6E75] hover:text-[#111113] p-1 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
              
              <div className="mb-6">
                <span className="text-[9.5px] uppercase tracking-[0.26em] text-[#C2922E] font-mono block mb-1 font-medium">
                  &mdash; ATELIER ORDER MODIFICATION
                </span>
                <h2 className="text-2xl font-quiche text-[#111113]">
                  Cancel Order #SUKO-{1000 + cancellingOrder.id}
                </h2>
                <p className="text-xs text-[#6E6E75] mt-1 font-light leading-relaxed">
                  Please select your reason for requesting cancellation:
                </p>
              </div>

              <form onSubmit={handleCancelSubmit} className="space-y-4 font-body text-xs">
                <div className="space-y-2">
                  {[
                    "Changed my mind / No longer needed",
                    "Ordered wrong size or color",
                    "Found an alternative silhouette",
                    "Delivery timeframe no longer aligns",
                    "Other (specify below)"
                  ].map((reason) => (
                    <label 
                      key={reason} 
                      className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${
                        cancelReasonPreset === reason 
                          ? "border-[#C2922E] bg-white text-[#111113] font-medium shadow-xs" 
                          : "border-[#DDD8CE] bg-white/60 text-[#555560] hover:border-[#8C887B]"
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="cancel_reason" 
                        checked={cancelReasonPreset === reason} 
                        onChange={() => setCancelReasonPreset(reason)} 
                        className="accent-[#C2922E]" 
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                {cancelReasonPreset === "Other (specify below)" && (
                  <textarea
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    placeholder="Please specify any additional details for our concierge..."
                    className="w-full bg-white border border-[#DDD8CE] focus:border-[#C2922E] text-[#111113] placeholder-[#8C887B] p-3 text-xs outline-none h-20 resize-none transition-colors"
                    required
                  />
                )}

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={submittingCancel} 
                    className="w-full bg-[#111113] hover:bg-rose-700 text-white py-3 text-[10px] uppercase tracking-[0.24em] font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {submittingCancel ? "Submitting Request..." : "Confirm Cancellation Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PAYMENT RE-SUBMIT MODAL                                                   */}
        {/* ========================================================================= */}
        {reSubmittingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-[#FAF8F5] border border-[#EAE6DF] max-w-md w-full p-6 sm:p-8 relative shadow-2xl font-body text-[#111113]">
              <button 
                onClick={() => setReSubmittingOrder(null)} 
                className="absolute top-4 right-4 text-[#6E6E75] hover:text-[#111113] p-1 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
              
              <div className="mb-5">
                <span className="text-[9.5px] uppercase tracking-[0.26em] text-[#C2922E] font-mono block mb-1 font-medium">
                  &mdash; ATELIER SETTLEMENT
                </span>
                <h2 className="text-xl font-quiche text-[#111113]">
                  Submit Payment Details
                </h2>
                <p className="text-xs text-[#6E6E75] mt-0.5">
                  Order #SUKO-{1000 + reSubmittingOrder.id} &bull; Total: {formatINR(resolveOrderTotal(reSubmittingOrder))}
                </p>
              </div>

              <form onSubmit={handleReSubmitProof} className="space-y-4 text-xs font-body">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#6E6E75] font-medium block mb-1">
                    Transaction ID / UTR *
                  </label>
                  <input
                    type="text"
                    value={reSubmitUtr}
                    onChange={(e) => setReSubmitUtr(e.target.value)}
                    placeholder="e.g. 4235XXXXXXXX"
                    className="w-full bg-white border border-[#DDD8CE] focus:border-[#C2922E] p-2.5 text-xs text-[#111113] outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#6E6E75] font-medium block mb-1">
                    Payment Screenshot *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReSubmitFileChange}
                    className="w-full bg-white border border-[#DDD8CE] p-2 text-xs outline-none cursor-pointer"
                    required
                  />
                  {reSubmitPreview && (
                    <div className="mt-2 w-20 h-24 border border-[#DDD8CE] overflow-hidden">
                      <img src={reSubmitPreview} alt="Screenshot preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingProof}
                    className="w-full bg-[#111113] hover:bg-[#C2922E] text-white py-3 text-[10px] uppercase tracking-[0.24em] font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSubmittingProof ? "Submitting Details..." : "Submit for Verification"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Orders;
