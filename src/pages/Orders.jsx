import React, { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Package, Clock, CheckCircle2, Truck, AlertCircle, 
  Printer, ArrowRight, ShoppingBag, Search, ExternalLink, RefreshCw, MessageSquare, ShieldCheck, ChevronRight, XCircle, AlertTriangle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatINR } from "../data/products";
import { API_BASE_URL, apiClient } from "../config/api";

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
        return <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5"><CheckCircle2 size={12} /> Delivered</span>;
      case "processing":
        return <span className="bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.15)]"><RefreshCw size={12} className="animate-spin text-amber-400" /> Processing</span>;
      case "paid":
        return <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5"><CheckCircle2 size={12} /> Order Confirmed</span>;
      case "shipped":
      case "in_transit":
        return <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5"><Truck size={12} /> Shipped</span>;
      case "cancel_requested":
        return <span className="bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5"><AlertCircle size={12} /> Cancellation Requested</span>;
      case "cancelled":
        return <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5"><XCircle size={12} /> Cancelled</span>;
      case "expired":
      case "payment_failed":
        return <span className="bg-zinc-500/15 border border-zinc-500/30 text-zinc-400 text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5"><Clock size={12} /> Payment Session Expired</span>;
      case "payment_pending":
      case "pending":
      default:
        return <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5"><Clock size={12} /> Awaiting Payment</span>;
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
    <div className="grain pt-36 pb-32 px-6 lg:px-16 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-white/10 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body block mb-2">— Atelier Concierge</span>
            <h1 className="font-display text-4xl lg:text-5xl">Order History & Receipts</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              className="p-3 border border-white/15 hover:border-foreground transition-colors text-foreground/70 hover:text-white"
              title="Refresh Orders"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <Link
              to="/collection"
              className="bg-foreground text-background py-3 px-6 text-[10px] uppercase tracking-[0.2em] font-body font-bold hover:bg-foreground/90 transition-all flex items-center gap-2"
            >
              <ShoppingBag size={14} /> Explore Atelier Collection
            </Link>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white/5 p-4 border border-white/10 backdrop-blur-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-foreground/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID or Garment Name..."
              className="w-full bg-black/40 border border-white/10 py-2 pl-9 pr-4 text-xs font-body text-white placeholder:text-foreground/40 outline-none focus:border-foreground"
            />
          </div>

          <div className="flex items-center gap-2 font-body text-xs">
            <span className="text-foreground/50 text-[10px] uppercase tracking-wider">Status Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black/60 border border-white/15 text-white py-2 px-3 text-xs outline-none focus:border-foreground"
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
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-[0.2em] font-body text-foreground/50">Fetching your Atelier invoices...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <div className="border border-white/10 p-12 text-center bg-background/40 backdrop-blur-sm space-y-4">
            <Package className="w-12 h-12 text-foreground/30 mx-auto" strokeWidth={1} />
            <h3 className="font-display text-xl">No Orders Found</h3>
            <p className="text-xs font-body text-foreground/50 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all" 
                ? "No orders match your filter criteria. Try clearing search filters."
                : "You haven't placed any orders with Suko yet. Explore our handcrafted collection."}
            </p>
            <Link
              to="/collection"
              className="inline-flex items-center gap-2 border border-white/20 px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-body hover:bg-white hover:text-black transition-all"
            >
              Browse Garments <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Orders List */}
        {!loading && filteredOrders.length > 0 && (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="border border-white/10 bg-background/50 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-white/20">
                {/* Order Header */}
                <div className="bg-white/5 p-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 font-body">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold tracking-wider text-foreground">
                        #SUKO-{1000 + order.id}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-[11px] text-foreground/50 font-mono">
                      Placed on <span className="text-foreground/80 font-medium">{formatDateTime(order.created_at)}</span>
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end gap-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/45 block">Total Order Amount</span>
                      <span className="font-mono text-lg font-bold text-foreground">{formatINR(order.total)}</span>
                    </div>
                    {order.status !== "cancelled" && order.status !== "cancel_requested" && order.status !== "completed" && (
                      <button
                        type="button"
                        onClick={() => handleOpenCancelModal(order)}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-[9px] uppercase tracking-[0.2em] font-body transition-all flex items-center gap-1.5"
                      >
                        <XCircle size={12} /> Request Cancellation
                      </button>
                    )}
                  </div>
                </div>

                {/* Garment Items List */}
                <div className="p-6 space-y-4">
                  <div className="divide-y divide-white/5">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div key={item.id || idx} className="py-3 flex items-center justify-between gap-4 font-body">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-16 bg-black border border-white/15 overflow-hidden flex-shrink-0 rounded-sm">
                              {item.product?.image_url ? (
                                <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-foreground/30"><Package size={16} /></div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-display text-sm text-foreground">{item.product?.name || "Bespoke Garment"}</h4>
                              <p className="text-[10px] font-mono text-foreground/50 mt-0.5">
                                Qty: {item.quantity} • Size: {item.size || item.product?.sizes?.[0] || "38"}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-mono font-semibold text-foreground">
                              {formatINR(item.price_at_purchase || item.product?.price || 0)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-16 bg-black border border-white/15 overflow-hidden flex-shrink-0 rounded-sm flex items-center justify-center text-foreground/40">
                            <Package size={20} />
                          </div>
                          <div>
                            <h4 className="font-display text-sm text-foreground">Bespoke Atelier Garment Order</h4>
                            <p className="text-[10px] font-mono text-foreground/50 mt-0.5">Qty: 1 • Standard Atelier Fit</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-semibold text-foreground">{formatINR(order.total)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Card Footer Actions */}
                <div className="bg-white/5 px-6 py-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'instant' });
                        setSelectedInvoiceOrder(order);
                      }}
                      className="px-4 py-2 border border-white/20 text-[9px] uppercase tracking-[0.2em] font-body hover:bg-white hover:text-black transition-all flex items-center gap-1.5"
                    >
                      <Printer size={12} /> Official Receipt & Tax Invoice
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReorder(order)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[9px] uppercase tracking-[0.2em] font-body transition-all flex items-center gap-1.5"
                    >
                      <ShoppingBag size={12} /> Re-Order Garments
                    </button>

                  </div>

                  <a
                    href={`https://wa.me/917666168147?text=Hi%20SUKO%20Atelier,%20I%20need%20assistance%20regarding%20my%20Order%20%23SUKO-${1000 + order.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] uppercase tracking-[0.2em] text-foreground/50 hover:text-white font-body flex items-center gap-1 transition-colors"
                  >
                    <MessageSquare size={12} /> Order Concierge Help <ChevronRight size={10} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancellation Reason Modal */}
        {cancellingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#121218] border border-white/15 max-w-md w-full p-8 rounded-sm relative shadow-2xl font-body">
              <button
                onClick={() => setCancellingOrder(null)}
                className="absolute top-4 right-4 text-foreground/50 hover:text-white"
              >
                <XCircle size={18} />
              </button>

              <div className="mb-6">
                <span className="text-[10px] uppercase tracking-[0.3em] text-red-400 font-mono block mb-1">
                  — ORDER CANCELLATION REQUEST
                </span>
                <h2 className="text-2xl font-display text-white">
                  Cancel Order #SUKO-{1000 + cancellingOrder.id}
                </h2>
                <p className="text-xs text-foreground/60 mt-1">
                  Please specify your reason for cancelling this order:
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
                      className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${
                        cancelReasonPreset === reason
                          ? "border-amber-400 bg-amber-400/10 text-white font-bold"
                          : "border-white/10 text-foreground/70 hover:border-white/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancel_reason"
                        checked={cancelReasonPreset === reason}
                        onChange={() => setCancelReasonPreset(reason)}
                        className="accent-amber-400"
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
                    className="w-full bg-transparent border border-white/15 focus:border-amber-400 text-white p-3 text-xs outline-none h-20 resize-none"
                    required
                  />
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={submittingCancel}
                    className="w-full bg-red-500 text-white py-3.5 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                  >
                    {submittingCancel ? "Submitting Request..." : "Confirm & Send Cancellation Reason"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Printable Tax Invoice Modal */}
        {selectedInvoiceOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-white text-black max-w-2xl w-full p-8 rounded-sm relative shadow-2xl font-body space-y-6 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedInvoiceOrder(null)}
                className="absolute top-4 right-4 text-black/50 hover:text-black font-bold text-xl"
              >
                ✕
              </button>

              {/* Invoice Header */}
              <div className="border-b-2 border-black pb-4 flex justify-between items-start">
                <div>
                  <h2 className="font-display text-3xl tracking-wider">SUKO ATELIER</h2>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-black/60 font-mono">
                    High Fashion Luxury Apparel • Tax Invoice / Receipt
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <p className="font-bold text-sm">INVOICE #SUKO-{1000 + selectedInvoiceOrder.id}</p>
                  <p className="text-black/60">{new Date(selectedInvoiceOrder.created_at || Date.now()).toLocaleDateString()}</p>
                  <p className="text-emerald-700 font-bold uppercase mt-1">[PAID IN FULL]</p>
                </div>
              </div>

              {/* Billed To Specs */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-black/10 pb-4">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-black/50 font-bold mb-1">Billed & Shipped To:</p>
                  <p className="font-bold text-sm">{user?.name || "Client"}</p>
                  <p className="text-black/70">{user?.email}</p>
                  <p className="text-black/70">{user?.phone || "+91 9876543210"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider text-black/50 font-bold mb-1">Atelier Details:</p>
                  <p className="font-bold">SUKO Atelier Studio</p>
                  <p className="text-black/70">Bandra West, Mumbai, MH</p>
                  <p className="text-black/70">GSTIN: 27AAAAA0000A1Z5</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black text-[9px] uppercase tracking-widest text-black/60">
                    <th className="py-2">Garment Item</th>
                    <th className="py-2 text-center">Size</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {selectedInvoiceOrder.items && selectedInvoiceOrder.items.length > 0 ? (
                    selectedInvoiceOrder.items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2.5 font-semibold">{item.product?.name || "Atelier Garment"}</td>
                        <td className="py-2.5 text-center">{item.size || "38"}</td>
                        <td className="py-2.5 text-center">{item.quantity}</td>
                        <td className="py-2.5 text-right font-bold">{formatINR(item.price_at_purchase || item.product?.price || 0)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2.5 font-semibold">Custom Bespoke Atelier Garment</td>
                      <td className="py-2.5 text-center">38</td>
                      <td className="py-2.5 text-center">1</td>
                      <td className="py-2.5 text-right font-bold">{formatINR(selectedInvoiceOrder.total)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Total Summary */}
              <div className="border-t-2 border-black/40 pt-3 flex flex-col items-end gap-0.5 font-mono text-xs">
                <div className="flex justify-between w-64 text-black/70">
                  <span>Subtotal:</span>
                  <span>{formatINR(selectedInvoiceOrder.total)}</span>
                </div>
                <div className="flex justify-between w-64 text-black/70">
                  <span>GST Tax (Included):</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between w-64 text-black/70">
                  <span>Atelier Delivery:</span>
                  <span className="text-emerald-700 font-bold">COMPLIMENTARY</span>
                </div>
                <div className="flex justify-between w-64 text-black font-bold text-sm border-t border-black/20 pt-1.5 mt-1">
                  <span>Total Paid:</span>
                  <span>{formatINR(selectedInvoiceOrder.total)}</span>
                </div>
              </div>

              {/* Footer Stamp & Print */}
              <div className="border-t border-black/20 pt-3 flex items-center justify-between">
                <span className="text-[8px] uppercase tracking-widest text-black/50 font-mono">
                  Authentic Garment Guarantee • Hand-crafted Atelier
                </span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-black text-white px-5 py-2 text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-black/80 transition-all"
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
