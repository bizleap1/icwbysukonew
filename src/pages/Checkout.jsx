import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Lock, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatINR, WHATSAPP_LINK } from "../data/products";
import { apiClient } from "../config/api";
import { getThumbImage } from "../utils/mediaUtils";
import SEO from "../components/SEO";

const SESSION_KEY = "suko_active_checkout";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const { items, subtotal, updateQty, removeItem } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Active Order & Confirmation States
  const [placed, setPlaced] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [checkoutId] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.checkout_id) return parsed.checkout_id;
      }
    } catch (e) {}
    return typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  });

  // UI & Loading States
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [reconcilingPayment, setReconcilingPayment] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);

  // Address & Contact Form State
  const [form, setForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem("suko_checkout_form");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      apartment: "",
      city: "",
      state: "Maharashtra",
      pincode: "",
      country: "India",
    };
  });

  const [addresses, setAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState(null);

  // Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // 1. Initial Load: Fetch Profile & Saved Addresses
  useEffect(() => {
    if (user?.authenticated && token) {
      Promise.all([
        apiClient.get("/api/auth/profile").catch(() => null),
        apiClient.get("/api/addresses").catch(() => []),
      ]).then(([prof, addrList]) => {
        const firstAddr = addrList && addrList.length > 0 ? addrList[0] : null;
        setAddresses(addrList || []);

        const userName = prof?.name || user.name || "";
        setForm((prev) => ({
          ...prev,
          email: prof?.email || user.email || prev.email,
          phone: prof?.phone || user.phone || prev.phone,
          firstName: prev.firstName || (userName ? userName.split(" ")[0] : ""),
          lastName: prev.lastName || (userName ? userName.split(" ").slice(1).join(" ") : ""),
          address: prev.address || (firstAddr ? firstAddr.line1 : ""),
          city: prev.city || (firstAddr ? firstAddr.city : ""),
          state: prev.state || (firstAddr ? firstAddr.state || "Maharashtra" : "Maharashtra"),
          pincode: prev.pincode || (firstAddr ? firstAddr.pincode : ""),
        }));

        if (firstAddr && !form.address) {
          setSelectedAddrId(firstAddr.id);
        }
      });
    }
  }, [user, token]);

  const selectSavedAddress = (addr) => {
    setSelectedAddrId(addr.id);
    setForm((prev) => ({
      ...prev,
      address: addr.line1,
      city: addr.city,
      state: addr.state || "Maharashtra",
      pincode: addr.pincode,
      phone: addr.phone || prev.phone,
    }));
    toast.success("Delivery address selected.");
  };

  const applyPromoCode = async () => {
    if (!couponCode.trim()) return;
    try {
      const data = await apiClient.post("/api/coupons/apply", {
        code: couponCode.trim().toUpperCase(),
        orderTotal: subtotal,
      });
      setDiscount(data.discountAmount || 0);
      setAppliedCoupon(data.code);
      toast.success(`Coupon ${data.code} applied.`);
    } catch (err) {
      setDiscount(0);
      setAppliedCoupon(null);
      toast.error(err.message || "Invalid promo code.");
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponCode("");
    toast.info("Coupon removed.");
  };

  const upd = (k) => (e) => {
    const next = { ...form, [k]: e.target.value };
    setForm(next);
    try {
      sessionStorage.setItem("suko_checkout_form", JSON.stringify(next));
    } catch (err) {}
  };

  // Lost Response Recovery
  const reconcileOrderStatus = async (orderId, maxAttempts = 3) => {
    setReconcilingPayment(true);
    let attempts = 0;
    while (attempts < maxAttempts) {
      attempts++;
      try {
        const checkOrder = await apiClient.get(`/api/orders/${orderId}`);
        if (checkOrder && checkOrder.status === "paid") {
          setConfirmedOrder(checkOrder);
          setPlaced(true);
          sessionStorage.removeItem(SESSION_KEY);
          setReconcilingPayment(false);
          setIsVerifyingPayment(false);
          setIsInitializingPayment(false);
          toast.success("Payment verified! Your order is confirmed.");
          return true;
        }
      } catch (e) {}
      await new Promise((r) => setTimeout(r, 2000));
    }
    setReconcilingPayment(false);
    setIsVerifyingPayment(false);
    setIsInitializingPayment(false);
    toast.info("Your order is being processed. You can check the latest status in My Orders.");
    return false;
  };

  // Primary Submission
  const placeOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!user?.authenticated) {
      try {
        sessionStorage.setItem("suko_checkout_form", JSON.stringify(form));
      } catch (err) {}
      toast.error("Please sign in to proceed with secure checkout.");
      navigate("/auth?redirect=/checkout");
      return;
    }

    if (!form.email || !form.firstName || !form.address || !form.city || !form.pincode) {
      toast.error("Please complete all required delivery address fields.");
      return;
    }

    if (items.length === 0 && !activeOrder) {
      toast.error("Your shopping bag is empty.");
      return;
    }

    setIsInitializingPayment(true);

    try {
      const cartItemIds = items.map((i) => i.cartItemId).filter(Boolean);

      const orderData = await apiClient.post("/api/orders", {
        checkout_id: checkoutId,
        address_id: selectedAddrId || undefined,
        coupon_code: appliedCoupon || undefined,
        cart_item_ids: cartItemIds.length > 0 ? cartItemIds : undefined,
        items: items.map((i) => ({
          product_id: i.id,
          size: i.size,
          quantity: i.qty,
        })),
        name: `${form.firstName || ""} ${form.lastName || ""}`.trim(),
        phone: form.phone,
        line1: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      });

      if (!orderData || !orderData.id) {
        throw new Error("Unable to create order session.");
      }

      if (orderData.status === "paid" || orderData.alreadyPaid) {
        setConfirmedOrder(orderData);
        setPlaced(true);
        sessionStorage.removeItem(SESSION_KEY);
        setIsInitializingPayment(false);
        toast.success("Order confirmed.");
        return;
      }

      setActiveOrder(orderData);
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          checkout_id: checkoutId,
          order_id: orderData.id,
          expires_at: orderData.expires_at,
        })
      );

      const rzpData = await apiClient.post("/api/payments/create-order", {
        order_id: orderData.id,
      });

      if (!rzpData || !rzpData.razorpay_order_id) {
        throw new Error("Failed to initialize payment gateway.");
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setIsInitializingPayment(false);
        throw new Error("Payment Gateway failed to load. Please check your network.");
      }

      const options = {
        key: rzpData.key_id,
        amount: rzpData.amount,
        currency: rzpData.currency || "INR",
        name: "SUKO",
        description: "Order Checkout",
        order_id: rzpData.razorpay_order_id,
        modal: {
          ondismiss: function () {
            setIsInitializingPayment(false);
            toast.info("Payment window closed.");
          },
        },
        handler: async function (response) {
          setIsInitializingPayment(false);
          setIsVerifyingPayment(true);

          try {
            const verifyData = await apiClient.post("/api/payments/verify", {
              order_id: orderData.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyData && (verifyData.order?.status === "paid" || verifyData.alreadyVerified)) {
              setConfirmedOrder(verifyData.order || orderData);
              setPlaced(true);
              sessionStorage.removeItem(SESSION_KEY);
              setIsVerifyingPayment(false);
              toast.success("Payment verified! Your order is confirmed.");
            } else {
              throw new Error(verifyData.error || "Payment verification incomplete.");
            }
          } catch (verifyErr) {
            console.warn("Payment verification response interrupted:", verifyErr.message);
            await reconcileOrderStatus(orderData.id);
          }
        },
        prefill: {
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: "#111113",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

      setTimeout(() => {
        setIsInitializingPayment(false);
      }, 1000);
    } catch (err) {
      setIsInitializingPayment(false);
      toast.error(err.message || "Failed to process checkout.");
    }
  };

  const total = Math.max(0, subtotal - discount);

  // -------------------------------------------------------------
  // 1. ORDER CONFIRMATION VIEW (Warm Ivory Luxury Layout)
  // -------------------------------------------------------------
  if (placed && confirmedOrder) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#111113] font-body flex flex-col justify-between">
        <SEO title="Order Confirmed | SUKO" description="Your SUKO order has been placed and confirmed." />

        {/* Minimal Header */}
        <header className="w-full bg-[#FAF8F5] border-b border-[#EAE6DF]">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
            <Link to="/" className="inline-block">
              <img src="/logo.png" alt="SUKO" className="h-5 sm:h-6 w-auto" />
            </Link>
            <span className="text-[10.5px] uppercase tracking-[0.24em] font-medium text-[#6E6E75]">
              CONFIRMED
            </span>
          </div>
        </header>

        {/* Confirmation Content */}
        <main className="max-w-[720px] mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="w-12 h-12 border border-[#C2922E] flex items-center justify-center mx-auto mb-6 text-[#C2922E]">
              <CheckCircle2 size={24} strokeWidth={1.5} />
            </div>

            <span className="text-[10px] uppercase tracking-[0.32em] text-[#C2922E] font-medium block mb-2">
              ORDER CONFIRMED
            </span>
            <h1 className="font-quiche text-3xl sm:text-4xl font-light text-[#111113] tracking-tight mb-2">
              Thank you, {confirmedOrder.shipping_name || form.firstName || "Client"}.
            </h1>
            <p className="text-[12.5px] text-[#6E6E75] font-light mb-8">
              Order Reference: <span className="font-medium text-[#111113]">#SUKO-{1000 + confirmedOrder.id}</span>
            </p>

            {/* Clean Details Box */}
            <div className="bg-[#F7F5F0] border border-[#EAE6DF] p-6 sm:p-8 text-left mb-10 space-y-5">
              <div className="border-b border-[#EAE6DF] pb-4">
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] block mb-1">
                  Delivery Destination
                </span>
                <p className="text-[13px] text-[#111113] font-light leading-relaxed">
                  {confirmedOrder.shipping_line1}, {confirmedOrder.shipping_city}, {confirmedOrder.shipping_state} - {confirmedOrder.shipping_pincode}
                </p>
                <p className="text-[11.5px] text-[#6E6E75] font-light mt-1">Contact: {confirmedOrder.shipping_phone}</p>
              </div>

              <div className="border-b border-[#EAE6DF] pb-4">
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] block mb-2">
                  Purchased Pieces
                </span>
                <div className="space-y-2.5">
                  {confirmedOrder.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[13px]">
                      <span className="text-[#111113] font-light">
                        {it.product?.name || `Item #${it.product_id}`} (Size: {it.size || "STD"}) × {it.quantity}
                      </span>
                      <span className="font-medium text-[#111113]">
                        {formatINR(Number(it.price_at_purchase) * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[11px] uppercase tracking-[0.20em] font-medium text-[#111113]">Total Paid</span>
                <span className="font-quiche text-lg sm:text-xl font-normal text-[#111113]">
                  {formatINR(Number(confirmedOrder.total))}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/orders"
                className="w-full sm:w-auto bg-[#111113] hover:bg-black text-white px-8 py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium transition-colors"
              >
                View in My Orders
              </Link>
              <Link
                to="/collection"
                className="w-full sm:w-auto border border-[#DDD8CE] hover:border-[#111113] px-8 py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium transition-colors text-[#111113]"
              >
                Continue Browsing
              </Link>
            </div>
          </motion.div>
        </main>

        {/* Minimal Footer */}
        <footer className="w-full border-t border-[#EAE6DF] bg-[#FAF8F5] py-8 text-center text-xs text-[#6E6E75] font-light">
          <p className="text-[11px] text-[#8C887B]">
            &copy; {new Date().getFullYear()} SUKO. All rights reserved.
          </p>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. EMPTY BAG FALLBACK
  // -------------------------------------------------------------
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#111113] font-body flex flex-col justify-between">
        <SEO title="Checkout | SUKO" description="Complete your bespoke order with SUKO." />

        {/* Minimal Header */}
        <header className="w-full bg-[#FAF8F5] border-b border-[#EAE6DF]">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
            <Link to="/" className="inline-block">
              <img src="/logo.png" alt="SUKO" className="h-5 sm:h-6 w-auto" />
            </Link>
            <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.24em] font-medium text-[#6E6E75]">
              <Lock size={12} className="text-[#C2922E]" strokeWidth={1.8} />
              <span>SECURE CHECKOUT</span>
            </div>
          </div>
        </header>

        {/* Empty State */}
        <main className="max-w-[600px] mx-auto px-6 py-24 text-center">
          <h1 className="font-quiche text-2xl sm:text-3xl font-light tracking-tight text-[#111113] mb-3">
            YOUR BAG IS EMPTY
          </h1>
          <p className="text-[13px] text-[#6E6E75] font-light leading-relaxed mb-8 max-w-md mx-auto">
            Discover our tailored suits, sculpted blazers, and versatile separates crafted for modern authority.
          </p>
          <Link
            to="/collection"
            className="inline-flex items-center gap-2.5 bg-[#111113] hover:bg-black text-white px-8 py-4 text-[11px] uppercase tracking-[0.24em] font-medium transition-colors"
          >
            <span>Explore Collection</span>
            <span>&rarr;</span>
          </Link>
        </main>

        <footer className="w-full border-t border-[#EAE6DF] bg-[#FAF8F5] py-8 text-center text-xs text-[#6E6E75] font-light">
          <p className="text-[11px] text-[#8C887B]">
            &copy; {new Date().getFullYear()} SUKO. All rights reserved.
          </p>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. MAIN CHECKOUT WORKFLOW (Distraction-Free Luxury Experience)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111113] font-body selection:bg-[#C2922E] selection:text-white flex flex-col justify-between">
      <SEO title="Checkout | SUKO" description="Secure and encrypted luxury checkout for SUKO orders." />

      {/* Simplified Header: Logo + SECURE CHECKOUT only */}
      <header className="w-full bg-[#FAF8F5] border-b border-[#EAE6DF] sticky top-0 z-30 backdrop-blur-md bg-[#FAF8F5]/95">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="inline-block" aria-label="SUKO Home">
            <img src="/logo.png" alt="SUKO" className="h-5 sm:h-6 w-auto" />
          </Link>
          <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.24em] font-medium text-[#6E6E75]">
            <Lock size={12} className="text-[#C2922E]" strokeWidth={1.8} />
            <span>SECURE CHECKOUT</span>
          </div>
        </div>
      </header>

      {/* Mobile Top Collapsible Order Summary Accordion */}
      <div className="lg:hidden border-b border-[#EAE6DF] bg-[#F7F5F0]">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          className="w-full px-4 sm:px-6 py-4 flex items-center justify-between text-left cursor-pointer select-none"
        >
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] font-medium text-[#111113]">
            <span>YOUR ORDER ({items.reduce((s, i) => s + (i.qty || 1), 0)})</span>
            <span className="text-[#8C887B] normal-case tracking-normal text-[11.5px]">
              {mobileSummaryOpen ? "Hide details −" : "View details +"}
            </span>
          </div>
          <span className="font-quiche text-base font-normal text-[#111113]">{formatINR(total)}</span>
        </button>

        <AnimatePresence>
          {mobileSummaryOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-[#EAE6DF] px-4 sm:px-6 py-4 space-y-4"
            >
              {/* Product items list */}
              <div className="divide-y divide-[#EAE6DF]/70">
                {items.map((item) => (
                  <div key={item.key || item.id} className="py-3.5 first:pt-0 last:pb-0 flex gap-3.5">
                    <div className="w-16 h-22 shrink-0 bg-[#EAE6DF] overflow-hidden">
                      <img
                        src={getThumbImage(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          if (e.currentTarget.src !== item.image) {
                            e.currentTarget.src = item.image;
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-quiche text-[14px] font-light text-[#111113] leading-snug">
                          {item.name}
                        </h3>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#6E6E75] mt-0.5">
                          {item.category === "separates" || item.subCategory ? "Tailored Separate" : "Complete Set"}
                        </p>
                        <p className="text-[11px] text-[#6E6E75] mt-0.5">
                          {item.color || "Bespoke"} &middot; Size {item.size}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[#6E6E75] text-[11px]">Qty {item.qty}</span>
                        <span className="font-medium text-[#111113]">
                          {formatINR((item.price || 0) * (item.qty || 1))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Price Breakdown */}
              <div className="border-t border-[#EAE6DF] pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-[#6E6E75]">
                  <span>Subtotal</span>
                  <span className="text-[#111113] font-medium">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#6E6E75]">
                  <span>Shipping</span>
                  <span className="text-[#111113]">Complimentary</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#C2922E]">
                    <span>Discount</span>
                    <span>− {formatINR(discount)}</span>
                  </div>
                )}
                <div className="border-t border-[#E5E0D6] pt-2 flex justify-between items-baseline font-medium text-[#111113]">
                  <span className="text-[11px] uppercase tracking-[0.20em]">Total</span>
                  <span className="font-quiche text-base">{formatINR(total)}</span>
                </div>
                <p className="text-[10.5px] text-[#8C887B] font-light">Inclusive of applicable taxes</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main 2-Column Checkout Layout */}
      <main className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-18 items-start">
          
          {/* ============================================================= */}
          {/* LEFT COLUMN: Checkout Details Form (58–62% on Desktop)         */}
          {/* ============================================================= */}
          <div className="lg:col-span-7 xl:col-span-7">
            
            {/* Header */}
            <div className="mb-8 sm:mb-10">
              <h1 className="font-quiche text-2xl sm:text-3xl lg:text-[32px] font-light text-[#111113] tracking-tight">
                CHECKOUT
              </h1>
              <p className="text-[13px] text-[#6E6E75] font-light mt-1">
                Complete your SUKO order.
              </p>
            </div>

            <form onSubmit={placeOrder} noValidate>
              
              {/* 1. CONTACT SECTION */}
              <section className="mb-8 sm:mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[11px] uppercase tracking-[0.22em] text-[#111113] font-medium">
                    CONTACT
                  </h2>
                  {!user?.authenticated && (
                    <Link
                      to="/auth?redirect=/checkout"
                      className="text-[11px] text-[#6E6E75] hover:text-[#111113] transition-colors"
                    >
                      Already have an account? <span className="underline underline-offset-2">Sign in</span>
                    </Link>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#6E6E75] block mb-1.5 font-sans">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={upd("email")}
                      placeholder="name@example.com"
                      className="w-full bg-transparent border border-[#DDD8CE] focus:border-[#C2922E] focus:outline-none px-4 py-3 text-[13.5px] text-[#111113] placeholder-[#A3A096] rounded-none transition-colors font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#6E6E75] block mb-1.5 font-sans">
                      Mobile Number (for delivery communication)
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={upd("phone")}
                      placeholder="+91 98765 43210"
                      className="w-full bg-transparent border border-[#DDD8CE] focus:border-[#C2922E] focus:outline-none px-4 py-3 text-[13.5px] text-[#111113] placeholder-[#A3A096] rounded-none transition-colors font-sans"
                    />
                  </div>
                </div>
              </section>

              <div className="border-b border-[#EAE6DF] mb-8 sm:mb-10" />

              {/* 2. DELIVERY ADDRESS SECTION */}
              <section className="mb-8 sm:mb-10">
                <h2 className="text-[11px] uppercase tracking-[0.22em] text-[#111113] font-medium mb-4">
                  DELIVERY ADDRESS
                </h2>

                {/* Saved addresses selector if authenticated user has existing addresses */}
                {addresses.length > 0 && (
                  <div className="mb-5 space-y-2">
                    <span className="text-[10.5px] uppercase tracking-[0.18em] text-[#6E6E75] block mb-2 font-sans">
                      Saved Addresses
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => selectSavedAddress(addr)}
                          className={`text-left p-3.5 border transition-all text-xs cursor-pointer ${
                            selectedAddrId === addr.id
                              ? "border-[#111113] bg-[#F7F5F0]"
                              : "border-[#EAE6DF] hover:border-[#C2922E]"
                          }`}
                        >
                          <p className="font-medium text-[#111113]">{addr.line1}</p>
                          <p className="text-[#6E6E75] mt-0.5 font-light">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#6E6E75] block mb-1.5 font-sans">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={form.firstName}
                        onChange={upd("firstName")}
                        placeholder="First name"
                        className="w-full bg-transparent border border-[#DDD8CE] focus:border-[#C2922E] focus:outline-none px-4 py-3 text-[13.5px] text-[#111113] placeholder-[#A3A096] rounded-none transition-colors font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#6E6E75] block mb-1.5 font-sans">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={form.lastName}
                        onChange={upd("lastName")}
                        placeholder="Last name"
                        className="w-full bg-transparent border border-[#DDD8CE] focus:border-[#C2922E] focus:outline-none px-4 py-3 text-[13.5px] text-[#111113] placeholder-[#A3A096] rounded-none transition-colors font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#6E6E75] block mb-1.5 font-sans">
                      Address
                    </label>
                    <input
                      type="text"
                      required
                      value={form.address}
                      onChange={upd("address")}
                      placeholder="Street address, house or building"
                      className="w-full bg-transparent border border-[#DDD8CE] focus:border-[#C2922E] focus:outline-none px-4 py-3 text-[13.5px] text-[#111113] placeholder-[#A3A096] rounded-none transition-colors font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#6E6E75] block mb-1.5 font-sans">
                      Apartment / Floor / Landmark <span className="text-[#8C887B] lowercase">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.apartment}
                      onChange={upd("apartment")}
                      placeholder="Apartment, suite, unit, floor"
                      className="w-full bg-transparent border border-[#DDD8CE] focus:border-[#C2922E] focus:outline-none px-4 py-3 text-[13.5px] text-[#111113] placeholder-[#A3A096] rounded-none transition-colors font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#6E6E75] block mb-1.5 font-sans">
                        City
                      </label>
                      <input
                        type="text"
                        required
                        value={form.city}
                        onChange={upd("city")}
                        placeholder="City"
                        className="w-full bg-transparent border border-[#DDD8CE] focus:border-[#C2922E] focus:outline-none px-4 py-3 text-[13.5px] text-[#111113] placeholder-[#A3A096] rounded-none transition-colors font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#6E6E75] block mb-1.5 font-sans">
                        State
                      </label>
                      <input
                        type="text"
                        required
                        value={form.state}
                        onChange={upd("state")}
                        placeholder="State"
                        className="w-full bg-transparent border border-[#DDD8CE] focus:border-[#C2922E] focus:outline-none px-4 py-3 text-[13.5px] text-[#111113] placeholder-[#A3A096] rounded-none transition-colors font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#6E6E75] block mb-1.5 font-sans">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={form.pincode}
                        onChange={upd("pincode")}
                        placeholder="6-digit PIN code"
                        className="w-full bg-transparent border border-[#DDD8CE] focus:border-[#C2922E] focus:outline-none px-4 py-3 text-[13.5px] text-[#111113] placeholder-[#A3A096] rounded-none transition-colors font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#6E6E75] block mb-1.5 font-sans">
                        Country / Region
                      </label>
                      <input
                        type="text"
                        disabled
                        value="India"
                        className="w-full bg-[#F5F2EB] border border-[#DDD8CE] px-4 py-3 text-[13.5px] text-[#6E6E75] rounded-none font-sans cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="border-b border-[#EAE6DF] mb-8 sm:mb-10" />

              {/* 3. DELIVERY METHOD SECTION */}
              <section className="mb-8 sm:mb-10">
                <h2 className="text-[11px] uppercase tracking-[0.22em] text-[#111113] font-medium mb-3">
                  DELIVERY
                </h2>
                <div className="border border-[#EAE6DF] p-4 sm:p-5 flex items-center justify-between bg-[#FDFBF7]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-4 h-4 rounded-full border border-[#111113] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#111113]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[#111113] tracking-wide font-body">
                        Standard Delivery
                      </p>
                      <p className="text-[11.5px] text-[#6E6E75] font-light">
                        Estimated delivery: 4–7 business days
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.20em] text-[#6E6E75] font-light">
                    Complimentary
                  </span>
                </div>
              </section>

              <div className="border-b border-[#EAE6DF] mb-8 sm:mb-10" />

              {/* 4. PAYMENT SECTION */}
              <section className="mb-8">
                <div className="mb-3">
                  <h2 className="text-[11px] uppercase tracking-[0.22em] text-[#111113] font-medium">
                    PAYMENT
                  </h2>
                  <p className="text-[12px] text-[#6E6E75] font-light mt-0.5">
                    All transactions are secure and encrypted.
                  </p>
                </div>

                <div className="border border-[#EAE6DF] bg-[#FDFBF7] p-5">
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#EAE6DF]">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border border-[#111113] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#111113]" />
                      </div>
                      <span className="text-[13px] font-medium text-[#111113]">
                        Online Payment (Razorpay Secure Gateway)
                      </span>
                    </div>
                    <Lock size={13} className="text-[#C2922E]" />
                  </div>
                  <p className="text-[12px] text-[#6E6E75] font-light leading-relaxed">
                    Supports UPI (Google Pay, PhonePe, Paytm), Credit / Debit Cards (Visa, Mastercard, RuPay, Amex), NetBanking, and EMI.
                  </p>
                </div>

                {/* Primary CTA Button */}
                <button
                  type="submit"
                  disabled={isInitializingPayment || isVerifyingPayment || reconcilingPayment}
                  className="w-full mt-8 bg-[#111113] hover:bg-black text-white py-4 px-8 text-[12px] uppercase tracking-[0.24em] font-medium flex items-center justify-center gap-3 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                >
                  {isInitializingPayment || isVerifyingPayment || reconcilingPayment ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-[#C2922E]" />
                      <span>Securing Order...</span>
                    </>
                  ) : (
                    <>
                      <span>COMPLETE ORDER &middot; {formatINR(total)}</span>
                      <span>&rarr;</span>
                    </>
                  )}
                </button>
              </section>

            </form>
          </div>

          {/* ============================================================= */}
          {/* RIGHT COLUMN: Order Summary (38–42% Desktop Sticky)            */}
          {/* ============================================================= */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-5 sticky top-28 self-start">
            <div className="bg-[#F7F5F0] border border-[#EAE6DF] p-6 sm:p-7">
              <h2 className="text-[11px] uppercase tracking-[0.24em] text-[#111113] font-medium mb-5">
                YOUR ORDER
              </h2>

              {/* Product items list */}
              <div className="divide-y divide-[#EAE6DF]">
                {items.map((item) => {
                  const garmentType =
                    item.category === "separates" || item.subCategory ? "Tailored Separate" : "Complete Set";
                  return (
                    <div key={item.key || item.id} className="py-4 first:pt-0 last:pb-4 flex gap-4">
                      <div className="w-20 h-28 shrink-0 bg-[#EAE6DF] overflow-hidden">
                        <img
                          src={getThumbImage(item.image)}
                          alt={item.name}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            if (e.currentTarget.src !== item.image) {
                              e.currentTarget.src = item.image;
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-quiche text-[15px] font-light text-[#111113] leading-snug">
                            {item.name}
                          </h3>
                          <p className="text-[10px] uppercase tracking-[0.20em] text-[#6E6E75] font-light mt-0.5">
                            {garmentType}
                          </p>
                          <p className="text-[11.5px] text-[#6E6E75] font-light mt-1">
                            {item.color || "Bespoke"} &middot; Size {item.size}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-2">
                          <div className="flex items-center gap-2 text-[#6E6E75]">
                            <span>Qty {item.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(item.key, item.qty - 1)}
                              className="w-5 h-5 border border-[#DDD8CE] flex items-center justify-center hover:border-[#111113] transition-colors cursor-pointer"
                              title="Decrease quantity"
                            >
                              −
                            </button>
                            <button
                              type="button"
                              onClick={() => updateQty(item.key, item.qty + 1)}
                              className="w-5 h-5 border border-[#DDD8CE] flex items-center justify-center hover:border-[#111113] transition-colors cursor-pointer"
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-medium text-[#111113]">
                            {formatINR((item.price || 0) * (item.qty || 1))}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Promo Code Toggle */}
              <div className="py-4 border-t border-[#EAE6DF]">
                {!showCouponInput && !appliedCoupon ? (
                  <button
                    type="button"
                    onClick={() => setShowCouponInput(true)}
                    className="text-[11px] uppercase tracking-[0.20em] text-[#6E6E75] hover:text-[#111113] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Have a promo code?</span>
                    <span className="text-[#C2922E] font-medium">+</span>
                  </button>
                ) : appliedCoupon ? (
                  <div className="flex items-center justify-between bg-[#FDFBF7] p-2.5 border border-[#EAE6DF] text-xs">
                    <span className="text-[#111113] font-mono uppercase">
                      {appliedCoupon} applied (−{formatINR(discount)})
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-[#6E6E75] hover:text-[#111113] text-[10px] uppercase tracking-wider cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter promo code"
                      className="flex-1 bg-transparent border border-[#DDD8CE] px-3 py-2 text-xs text-[#111113] placeholder-[#A3A096] focus:outline-none focus:border-[#C2922E] rounded-none"
                    />
                    <button
                      type="button"
                      onClick={applyPromoCode}
                      className="bg-[#111113] text-white px-4 py-2 text-[10px] uppercase tracking-[0.20em] hover:bg-black transition-colors rounded-none cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-[#EAE6DF] pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#6E6E75]">
                  <span>Subtotal</span>
                  <span className="text-[#111113] font-medium">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#6E6E75]">
                  <span>Shipping</span>
                  <span className="text-[#111113]">Complimentary</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#C2922E]">
                    <span>Discount</span>
                    <span>− {formatINR(discount)}</span>
                  </div>
                )}
                <div className="border-t border-[#E5E0D6] pt-3 flex justify-between items-baseline">
                  <span className="text-[11px] uppercase tracking-[0.20em] font-medium text-[#111113]">
                    TOTAL
                  </span>
                  <span className="font-quiche text-xl font-normal text-[#111113]">{formatINR(total)}</span>
                </div>
                <p className="text-[10.5px] text-[#8C887B] font-light">Inclusive of applicable taxes</p>
              </div>

              {/* Stylist Secondary Link */}
              <div className="border-t border-[#EAE6DF] mt-6 pt-5">
                <p className="text-[11.5px] text-[#6E6E75] font-light">
                  Need help before you order?
                </p>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.20em] text-[#C2922E] hover:underline underline-offset-4 mt-1 font-medium"
                >
                  <span>Chat with a SUKO Stylist &rarr;</span>
                </a>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Minimal Checkout Footer */}
      <footer className="w-full border-t border-[#EAE6DF] bg-[#FAF8F5] py-8 text-center text-xs text-[#6E6E75] font-light">
        <div className="max-w-[1360px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-[11px] tracking-wider uppercase">
            <Link to="/privacy-policy" className="hover:text-[#111113] transition-colors">
              Privacy
            </Link>
            <span>&middot;</span>
            <Link to="/terms-conditions" className="hover:text-[#111113] transition-colors">
              Terms
            </Link>
            <span>&middot;</span>
            <Link to="/shipping" className="hover:text-[#111113] transition-colors">
              Shipping &amp; Returns
            </Link>
          </div>
          <p className="text-[11px] text-[#8C887B]">
            &copy; {new Date().getFullYear()} SUKO. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Checkout;
