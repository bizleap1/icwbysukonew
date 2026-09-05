import React, { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Package, Clock, CheckCircle2, Truck, AlertCircle, 
  Printer, ArrowRight, ShoppingBag, Search, RefreshCw, 
  MessageSquare, ChevronRight, XCircle, X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatINR } from "../data/products";
import { apiClient } from "../config/api";
import SEO from "../components/SEO";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  const datePart = d.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = d.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${datePart} · ${timePart}`;
};

const Orders = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // Cancellation Modal States
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState("Changed my mind / No longer needed");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

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
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load order history.");
    } finally {
      setLoading(false);
    }
  };

  if (!user?.authenticated) return <Navigate to="/auth" />;

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "delivered":
        return (
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 font-medium">
            <CheckCircle2 size={11} className="text-emerald-600" /> Delivered
          </span>
        );
      case "processing":
        return (
          <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[9.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 font-medium">
            <RefreshCw size={11} className="animate-spin text-[#C2922E]" /> Processing
          </span>
        );
      case "paid":
        return (
          <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[9.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 font-medium">
            <CheckCircle2 size={11} className="text-blue-600" /> Order Confirmed
          </span>
        );
      case "shipped":
      case "in_transit":
        return (
          <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[9.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 font-medium">
            <Truck size={11} className="text-[#C2922E]" /> Shipped
          </span>
        );
      case "cancel_requested":
        return (
          <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[9.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 font-medium">
            <AlertCircle size={11} className="text-[#C2922E]" /> Cancellation Requested
          </span>
        );
      case "cancelled":
        return (
          <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[9.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 font-medium">
            <XCircle size={11} className="text-rose-600" /> Cancelled
          </span>
        );
      case "expired":
      case "payment_failed":
        return (
          <span className="bg-stone-100 border border-stone-200 text-stone-600 text-[9.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 font-medium">
            <Clock size={11} /> Session Expired
          </span>
        );
      case "payment_pending":
      case "pending":
      default:
        return (
          <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[9.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1.5 font-medium">
            <Clock size={11} className="text-[#C2922E]" /> Awaiting Payment
          </span>
        );
    }
  };

  const handleOpenCancelModal = (order) => {
    setCancellingOrder(order);
    setCancelReasonPreset("Changed my mind / No longer needed");
    setCustomCancelReason("");
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancellingOrder) return;
    setSubmittingCancel(true);

    const finalReason = cancelReasonPreset === "Other (specify below)"
      ? (customCancelReason.trim() || "Not specified")
      : cancelReasonPreset;

    try {
      await apiClient.patch(`/api/orders/${cancellingOrder.id}/cancel`, {
        reason: finalReason
      });

      toast.success(`Cancellation request for Order #SUKO-${1000 + cancellingOrder.id} submitted!`);
      setCancellingOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.message || "Failed to request cancellation.");
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) {
      toast.error("No items found to re-order");
      return;
    }
    order.items.forEach(item => {
      if (item.product) {
        addToCart(item.product, item.product.sizes?.[0] || "38");
      }
    });
    toast.success("Items re-added to your cart!");
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === "all" || o.status?.toLowerCase() === statusFilter;
    const matchesSearch = searchQuery === "" || 
      String(o.id).includes(searchQuery) ||
      o.items?.some(i => i.product?.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="bg-[#FAF8F5] text-[#111113] font-body selection:bg-[#C2922E] selection:text-white pt-28 sm:pt-36 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-16 min-h-screen">
      <SEO title="Order History & Receipts | SUKO" description="Track your SUKO tailored garments and view official tax invoices." />

      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-[#EAE6DF] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="w-4 h-[1px] bg-[#C2922E]" />
              <span className="text-[10px] uppercase tracking-[0.28em] text-[#C2922E] font-medium font-mono">
                CLIENT ATELIER CONCIERGE
              </span>
            </div>
            <h1 className="font-quiche text-3xl sm:text-4xl lg:text-[40px] font-light text-[#111113] tracking-tight leading-tight">
              Order History &amp; Receipts
            </h1>
            <p className="text-xs text-[#6E6E75] font-light mt-1">
              Review and manage your bespoke orders, track fulfillment stages, and access official tax invoices.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchOrders}
              className="p-2.5 bg-white border border-[#DDD8CE] hover:border-[#C2922E] text-[#111113] transition-colors rounded-sm shadow-xs cursor-pointer"
              title="Refresh Orders"
            >
              <RefreshCw size={15} className={loading ? "animate-spin text-[#C2922E]" : ""} />
            </button>
            <Link
              to="/collection"
              className="bg-[#111113] text-white py-2.5 px-5 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-[#C2922E] transition-all flex items-center gap-2 rounded-sm shadow-xs"
            >
              <ShoppingBag size={13} /> Explore Collection
            </Link>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 border border-[#EAE6DF] shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8C887B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order # or Garment Name..."
              className="w-full bg-[#FAF8F5] border border-[#DDD8CE] py-2 pl-9 pr-4 text-xs font-body text-[#111113] placeholder-[#8C887B] outline-none focus:border-[#C2922E] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2.5 font-body text-xs">
            <span className="text-[#6E6E75] text-[10px] uppercase tracking-wider font-medium">Status Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#FAF8F5] border border-[#DDD8CE] text-[#111113] py-2 px-3 text-xs outline-none focus:border-[#C2922E] transition-colors cursor-pointer"
            >
              <option value="all">All Orders ({orders.length})</option>
              <option value="processing">⚙️ Processing</option>
              <option value="paid">💳 Paid</option>
              <option value="shipped">Shipped in Transit</option>
              <option value="delivered">Delivered</option>
              <option value="cancel_requested">Cancellation Requested</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-4">
            <div className="w-8 h-8 border-2 border-[#111113] border-t-[#C2922E] rounded-full animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-[0.2em] font-body text-[#6E6E75]">Fetching your Atelier orders &amp; invoices...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <div className="border border-[#EAE6DF] p-12 text-center bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#F5F2EB] border border-[#EAE6DF] flex items-center justify-center mx-auto text-[#C2922E]">
              <Package size={24} strokeWidth={1.3} />
            </div>
            <h3 className="font-quiche text-2xl font-light text-[#111113]">No Orders Found</h3>
            <p className="text-xs font-body text-[#6E6E75] max-w-sm mx-auto leading-relaxed">
              {searchQuery || statusFilter !== "all" 
                ? "No orders match your filter criteria. Try clearing or changing your search filters."
                : "You haven't placed any orders with SUKO yet. Discover our handcrafted architectural silhouettes."}
            </p>
            <Link
              to="/collection"
              className="inline-flex items-center gap-2 bg-[#111113] hover:bg-[#C2922E] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-medium transition-all shadow-xs rounded-sm"
            >
              Browse Collection <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Orders List */}
        {!loading && filteredOrders.length > 0 && (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="border border-[#EAE6DF] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300 hover:border-[#C2922E]/50">
                {/* Order Header */}
                <div className="bg-[#FAF8F5] p-5 sm:p-6 border-b border-[#EAE6DF] flex flex-wrap items-center justify-between gap-4 font-body">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold tracking-wider text-[#111113]">
                        #SUKO-{1000 + order.id}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-[11px] text-[#6E6E75] font-mono">
                      Placed on <span className="text-[#111113] font-medium">{formatDateTime(order.created_at)}</span>
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end gap-2">
                    <div>
                      <span className="text-[9.5px] uppercase tracking-[0.2em] text-[#8C887B] block">Total Amount</span>
                      <span className="font-mono text-lg font-bold text-[#111113]">{formatINR(order.total)}</span>
                    </div>
                    {order.status !== "cancelled" && order.status !== "cancel_requested" && order.status !== "completed" && (
                      <button
                        type="button"
                        onClick={() => handleOpenCancelModal(order)}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[9px] uppercase tracking-[0.18em] font-body transition-all flex items-center gap-1.5 cursor-pointer rounded-xs"
                      >
                        <XCircle size={11} /> Request Cancellation
                      </button>
                    )}
                  </div>
                </div>

                {/* Garment Items List */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="divide-y divide-[#EAE6DF]">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div key={item.id || idx} className="py-3 flex items-center justify-between gap-4 font-body">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-14 h-16 sm:w-16 sm:h-20 bg-[#F5F2EB] border border-[#EAE6DF] overflow-hidden flex-shrink-0 rounded-xs">
                              {item.product?.image_url ? (
                                <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#8C887B]"><Package size={16} /></div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-quiche text-sm sm:text-base text-[#111113] font-medium truncate">
                                {item.product?.name || "Bespoke Garment"}
                              </h4>
                              <p className="text-[10.5px] font-mono text-[#6E6E75] mt-0.5">
                                Qty: {item.quantity} &middot; Size: {item.size || item.product?.sizes?.[0] || "38"}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs sm:text-sm font-mono font-semibold text-[#111113]">
                              {formatINR(item.price_at_purchase || item.product?.price || 0)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-16 sm:w-16 sm:h-20 bg-[#F5F2EB] border border-[#EAE6DF] overflow-hidden flex-shrink-0 rounded-xs flex items-center justify-center text-[#8C887B]">
                            <Package size={20} />
                          </div>
                          <div>
                            <h4 className="font-quiche text-sm text-[#111113]">Bespoke Atelier Garment Order</h4>
                            <p className="text-[10px] font-mono text-[#6E6E75] mt-0.5">Qty: 1 &middot; Standard Atelier Fit</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-mono font-semibold text-[#111113]">{formatINR(order.total)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Card Footer Actions */}
                <div className="bg-[#FAF8F5]/80 px-5 sm:px-6 py-4 border-t border-[#EAE6DF] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'instant' });
                        setSelectedInvoiceOrder(order);
                      }}
                      className="px-4 py-2 bg-white border border-[#DDD8CE] hover:border-[#C2922E] text-[#111113] hover:text-[#C2922E] text-[9.5px] uppercase tracking-[0.2em] font-medium transition-all flex items-center gap-1.5 shadow-xs cursor-pointer rounded-xs"
                    >
                      <Printer size={12} className="text-[#C2922E]" /> Official Receipt &amp; Tax Invoice
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReorder(order)}
                      className="px-4 py-2 bg-[#111113] hover:bg-[#C2922E] text-white text-[9.5px] uppercase tracking-[0.2em] font-medium transition-all flex items-center gap-1.5 shadow-xs cursor-pointer rounded-xs"
                    >
                      <ShoppingBag size={12} /> Re-Order Garments
                    </button>
                  </div>

                  <a
                    href={`https://wa.me/919370350885?text=Hi%20SUKO%20Atelier,%20I%20need%20assistance%20regarding%20my%20Order%20%23SUKO-${1000 + order.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] uppercase tracking-[0.18em] text-[#6E6E75] hover:text-[#C2922E] font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare size={12} className="text-[#C2922E]" /> Order Concierge Help <ChevronRight size={11} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancellation Reason Modal */}
        {cancellingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-[#FAF8F5] border border-[#EAE6DF] max-w-md w-full p-6 sm:p-8 rounded-sm relative shadow-2xl font-body text-[#111113]">
              <button
                onClick={() => setCancellingOrder(null)}
                className="absolute top-4 right-4 text-[#6E6E75] hover:text-[#111113] p-1 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="mb-6">
                <span className="text-[9.5px] uppercase tracking-[0.26em] text-rose-600 font-mono block mb-1 font-medium">
                  — ORDER CANCELLATION REQUEST
                </span>
                <h2 className="text-2xl font-quiche text-[#111113]">
                  Cancel Order #SUKO-{1000 + cancellingOrder.id}
                </h2>
                <p className="text-xs text-[#6E6E75] mt-1 font-light leading-relaxed">
                  Please specify your reason for cancelling this bespoke garment order:
                </p>
              </div>

              <form onSubmit={handleCancelSubmit} className="space-y-4 font-body text-xs">
                <div className="space-y-2">
                  {[
                    "Changed my mind / No longer needed",
                    "Ordered wrong size or color",
                    "Found a better price elsewhere",
                    "Shipping / Delivery time is too long",
                    "Other (specify below)"
                  ].map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center gap-3 p-3 border cursor-pointer transition-all rounded-xs ${
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
                    placeholder="Please type your cancellation reason here..."
                    className="w-full bg-white border border-[#DDD8CE] focus:border-[#C2922E] text-[#111113] placeholder-[#8C887B] p-3 text-xs outline-none h-20 resize-none transition-colors"
                    required
                  />
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingCancel}
                    className="w-full bg-rose-600 text-white py-3.5 text-[10px] uppercase tracking-[0.24em] font-medium hover:bg-rose-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {submittingCancel ? "Submitting Request..." : "Confirm & Send Cancellation Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Printable Tax Invoice Modal (Mobile Responsive & SUKO Luxury Theme) */}
        {selectedInvoiceOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white text-[#111113] max-w-2xl w-full p-4 sm:p-8 md:p-10 rounded-xs relative shadow-2xl font-body space-y-5 max-h-[92vh] overflow-y-auto border border-[#EAE6DF]">
              <button
                type="button"
                onClick={() => setSelectedInvoiceOrder(null)}
                className="absolute top-3.5 right-3.5 text-[#8C887B] hover:text-[#111113] p-1.5 transition-colors cursor-pointer rounded-full hover:bg-[#FAF8F5]"
                aria-label="Close invoice"
              >
                <X size={18} />
              </button>

              {/* Invoice Header */}
              <div className="border-b border-[#EAE6DF] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="font-quiche text-2xl sm:text-3xl tracking-[0.24em] text-[#111113]">S U K O</h2>
                  <p className="text-[9px] uppercase tracking-[0.22em] text-[#C2922E] font-medium mt-0.5">
                    The Indian Corporate Wear &bull; Tax Invoice
                  </p>
                </div>
                <div className="text-left sm:text-right text-xs">
                  <p className="font-mono font-bold text-sm text-[#111113]">INVOICE #SUKO-{1000 + selectedInvoiceOrder.id}</p>
                  <p className="text-[#6E6E75] text-[11px] mt-0.5">
                    {new Date(selectedInvoiceOrder.created_at || Date.now()).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#FAF6EE] border border-[#D8C39D] text-[#8A6518] rounded-xs text-[9.5px] font-bold tracking-wider uppercase">
                    {selectedInvoiceOrder.status === "paid" ? "PAID IN FULL" : selectedInvoiceOrder.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Billed To Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-b border-[#EAE6DF] pb-4">
                <div className="bg-[#FAF8F5] p-3.5 rounded-xs border border-[#EAE6DF]">
                  <p className="text-[9px] uppercase tracking-wider text-[#C2922E] font-bold mb-1">Billed &amp; Shipped To:</p>
                  <p className="font-bold text-sm text-[#111113]">{selectedInvoiceOrder.shipping_name || user?.name || "Valued Client"}</p>
                  <p className="text-[#6E6E75] text-[11.5px] mt-0.5">{selectedInvoiceOrder.shipping_line1 || selectedInvoiceOrder.address?.line1 || "Atelier Delivery Address"}</p>
                  <p className="text-[#6E6E75] text-[11.5px]">
                    {selectedInvoiceOrder.shipping_city || selectedInvoiceOrder.address?.city || ""}, {selectedInvoiceOrder.shipping_state || selectedInvoiceOrder.address?.state || ""} {selectedInvoiceOrder.shipping_pincode || selectedInvoiceOrder.address?.pincode || ""}
                  </p>
                  <p className="text-[#6E6E75] text-[11px] font-mono mt-1">Contact: {selectedInvoiceOrder.shipping_phone || user?.phone || "Not specified"}</p>
                </div>
                <div className="bg-[#FAF8F5] p-3.5 rounded-xs border border-[#EAE6DF] sm:text-right">
                  <p className="text-[9px] uppercase tracking-wider text-[#8C887B] font-bold mb-1">Atelier Details:</p>
                  <p className="font-bold text-sm text-[#111113]">SUKO Atelier Studio</p>
                  <p className="text-[#6E6E75] text-[11.5px] mt-0.5">Bandra West, Mumbai, MH</p>
                  <p className="text-[#6E6E75] text-[11.5px]">GSTIN: 27AAAAA0000A1Z5</p>
                  <p className="text-[#C2922E] text-[11.5px] mt-1">support@indiancorporatewear.com</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto -mx-1 sm:mx-0">
                <table className="w-full text-left text-xs border-collapse min-w-[290px]">
                  <thead>
                    <tr className="border-b border-[#EAE6DF] text-[9px] uppercase tracking-widest text-[#7A7A85]">
                      <th className="py-2 pr-2 font-medium">Garment Item</th>
                      <th className="py-2 px-2 text-center font-medium">Size</th>
                      <th className="py-2 px-2 text-center font-medium">Qty</th>
                      <th className="py-2 pl-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EFE6]">
                    {selectedInvoiceOrder.items && selectedInvoiceOrder.items.length > 0 ? (
                      selectedInvoiceOrder.items.map((item, i) => (
                        <tr key={i}>
                          <td className="py-2.5 pr-2 font-medium text-[#111113]">
                            {item.product?.name || item.product_name || "Atelier Garment"}
                          </td>
                          <td className="py-2.5 px-2 text-center text-[#555560]">
                            <span className="px-1.5 py-0.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xs text-[10px]">
                              {item.size || "38"}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-[#555560]">{item.quantity}</td>
                          <td className="py-2.5 pl-2 text-right font-mono font-bold text-[#111113]">
                            {formatINR(item.price_at_purchase || item.product?.price || 0)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2.5 font-medium text-[#111113]">Custom Bespoke Atelier Garment</td>
                        <td className="py-2.5 text-center text-[#555560]">38</td>
                        <td className="py-2.5 text-center font-mono text-[#555560]">1</td>
                        <td className="py-2.5 text-right font-mono font-bold text-[#111113]">{formatINR(selectedInvoiceOrder.total)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="border-t border-[#EAE6DF] pt-3 flex flex-col items-end gap-1 text-xs">
                <div className="w-full sm:w-72 bg-[#FAF6EE] border border-[#C2922E]/40 p-3.5 rounded-xs space-y-1.5">
                  <div className="flex justify-between text-[#6E6E75]">
                    <span>Subtotal:</span>
                    <span className="font-mono text-[#111113]">{formatINR(selectedInvoiceOrder.total)}</span>
                  </div>
                  <div className="flex justify-between text-[#6E6E75]">
                    <span>GST Taxes:</span>
                    <span className="text-[#111113]">Inclusive</span>
                  </div>
                  <div className="flex justify-between text-[#6E6E75]">
                    <span>Atelier Delivery:</span>
                    <span className="text-[#C2922E] font-bold text-[10.5px] uppercase tracking-wider">Complimentary</span>
                  </div>
                  <div className="flex justify-between text-[#111113] font-bold text-sm border-t border-[#C2922E]/30 pt-2 mt-1">
                    <span>Total Amount:</span>
                    <span className="font-mono text-base">{formatINR(selectedInvoiceOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Stamp & Print */}
              <div className="border-t border-[#EAE6DF] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[8.5px] uppercase tracking-widest text-[#8C887B] text-center sm:text-left">
                  Authentic Garment Guarantee &bull; Hand-crafted Atelier
                </span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto bg-[#111113] hover:bg-[#C2922E] text-white px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs rounded-xs"
                >
                  <Printer size={13} /> Print Receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
