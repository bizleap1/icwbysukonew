import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  CheckCircle2, Loader2, Sparkles, Lock, Printer, FileText, 
  ArrowRight, MapPin, CreditCard, ShieldCheck, Clock, AlertTriangle, RefreshCw, ShoppingBag 
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatINR } from "../data/products";
import { apiClient } from "../config/api";

const SESSION_KEY = "suko_active_checkout";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const { items, subtotal, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Active Order & Confirmation States
  const [placed, setPlaced] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [checkoutId, setCheckoutId] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.checkout_id) return parsed.checkout_id;
      }
    } catch (e) {}
    return (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  });

  // UI & Loading States
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [reconcilingPayment, setReconcilingPayment] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(null);

  // Address & Profile Form States
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    country: "India",
    payment: "card",
  });

  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [billingForm, setBillingForm] = useState({
    address: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
  });

  const [saveToAddressBook, setSaveToAddressBook] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState(null);

  // Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  // 1. Initial Load: Fetch Profile, Saved Addresses & Reconcile Active Session
  useEffect(() => {
    if (user?.authenticated && token) {
      // Fetch profile and addresses
      Promise.all([
        apiClient.get('/api/auth/profile').catch(() => null),
        apiClient.get('/api/addresses').catch(() => [])
      ]).then(([prof, addrList]) => {
        const firstAddr = addrList && addrList.length > 0 ? addrList[0] : null;
        setAddresses(addrList || []);

        const userName = prof?.name || user.name || "";
        setForm((prev) => ({
          ...prev,
          email: prof?.email || user.email || prev.email,
          phone: prof?.phone || user.phone || prev.phone,
          firstName: userName ? userName.split(' ')[0] : prev.firstName,
          lastName: userName ? userName.split(' ').slice(1).join(' ') : prev.lastName,
          address: firstAddr ? firstAddr.line1 : prev.address,
          city: firstAddr ? firstAddr.city : prev.city,
          state: firstAddr ? (firstAddr.state || "Maharashtra") : prev.state,
          pincode: firstAddr ? firstAddr.pincode : prev.pincode,
        }));

        if (firstAddr) {
          setSelectedAddrId(firstAddr.id);
        }
      });

      // Check existing active checkout session in sessionStorage
      try {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.order_id) {
            apiClient.get(`/api/orders/${parsed.order_id}`)
              .then((existingOrder) => {
                if (existingOrder) {
                  if (existingOrder.status === 'paid') {
                    setConfirmedOrder(existingOrder);
                    setPlaced(true);
                    sessionStorage.removeItem(SESSION_KEY);
                  } else if (existingOrder.status === 'payment_pending' && new Date(existingOrder.expires_at) > new Date()) {
                    setActiveOrder(existingOrder);
                  } else {
                    sessionStorage.removeItem(SESSION_KEY);
                  }
                }
              })
              .catch(() => {
                sessionStorage.removeItem(SESSION_KEY);
              });
          }
        }
      } catch (e) {}
    }
  }, [user, token]);

  // 2. Reservation Expiry Countdown Timer
  useEffect(() => {
    if (!activeOrder?.expires_at || placed) {
      setRemainingSeconds(null);
      return;
    }

    const targetTime = new Date(activeOrder.expires_at).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        sessionStorage.removeItem(SESSION_KEY);
        toast.error("Your 15-minute reservation window has expired. Please initiate checkout again.");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeOrder?.expires_at, placed]);

  const selectSavedAddress = (addr) => {
    setSelectedAddrId(addr.id);
    setForm((prev) => ({
      ...prev,
      address: addr.line1,
      city: addr.city,
      state: addr.state || "Maharashtra",
      pincode: addr.pincode,
      phone: addr.phone || prev.phone
    }));
    toast.success("Saved delivery address selected.");
  };

  const applyPromoCode = async () => {
    setCouponError("");
    if (!couponCode.trim()) return;

    try {
      const data = await apiClient.post('/api/coupons/apply', {
        code: couponCode.trim().toUpperCase(),
        orderTotal: subtotal
      });

      setDiscount(data.discountAmount || 0);
      setAppliedCoupon(data.code);
      toast.success(`Coupon ${data.code} applied! Saved ${formatINR(data.discountAmount)}`);
    } catch (err) {
      setCouponError(err.message || "Invalid promo code");
      setDiscount(0);
      setAppliedCoupon(null);
      toast.error(err.message || "Invalid promo code");
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast.info("Coupon removed.");
  };

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const updBilling = (k) => (e) => setBillingForm({ ...billingForm, [k]: e.target.value });

  // Auto-save address to user profile in background
  const autoSaveUserAddress = async () => {
    if (!saveToAddressBook || !user?.authenticated || !form.address) return;
    try {
      await apiClient.post('/api/addresses', {
        line1: form.address,
        city: form.city || "Mumbai",
        state: form.state || "Maharashtra",
        pincode: form.pincode || "400050",
        phone: form.phone || "9876543210"
      });
    } catch (e) {
      // Non-fatal background save
    }
  };

  // Lost Response Recovery: Bounded Order Status Reconciliation
  const reconcileOrderStatus = async (orderId, maxAttempts = 3) => {
    setReconcilingPayment(true);
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const checkOrder = await apiClient.get(`/api/orders/${orderId}`);
        if (checkOrder && checkOrder.status === 'paid') {
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

      // Wait 2 seconds before next poll
      await new Promise(r => setTimeout(r, 2000));
    }

    setReconcilingPayment(false);
    setIsVerifyingPayment(false);
    setIsInitializingPayment(false);
    toast.info("We are still confirming your payment with your bank. You can check the latest status in My Orders.");
    return false;
  };

  // Main Checkout Submission Handler
  const placeOrder = async (e) => {
    e.preventDefault();
    if (!user?.authenticated) {
      toast.error("Please sign in to proceed with checkout.");
      navigate("/auth");
      return;
    }

    if (!form.email || !form.firstName || !form.address || !form.city || !form.pincode) {
      toast.error("Please complete all required delivery address fields.");
      return;
    }
    if (!sameAsBilling && (!billingForm.address || !billingForm.city || !billingForm.pincode)) {
      toast.error("Please complete all required billing address fields.");
      return;
    }
    if (items.length === 0 && !activeOrder) {
      toast.error("Your shopping bag is empty.");
      return;
    }

    // Check if current active order has already expired
    if (remainingSeconds !== null && remainingSeconds <= 0) {
      toast.error("This payment session has expired. Please refresh your bag.");
      sessionStorage.removeItem(SESSION_KEY);
      setActiveOrder(null);
      return;
    }

    setIsInitializingPayment(true);

    // Auto-save address
    autoSaveUserAddress();

    try {
      // 1. Create or Reuse payment_pending Order on Backend
      const cartItemIds = items.map(i => i.cartItemId).filter(Boolean);

      const orderData = await apiClient.post('/api/orders', {
        checkout_id: checkoutId,
        address_id: selectedAddrId || undefined,
        coupon_code: appliedCoupon || undefined,
        cart_item_ids: cartItemIds.length > 0 ? cartItemIds : undefined,
        items: items.map(i => ({
          product_id: i.id,
          size: i.size,
          quantity: i.qty
        })),
        name: `${form.firstName || ''} ${form.lastName || ''}`.trim(),
        phone: form.phone,
        line1: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode
      });

      if (!orderData || !orderData.id) {
        throw new Error("Unable to create order session.");
      }

      // Check if already paid (idempotent replay)
      if (orderData.status === 'paid' || orderData.alreadyPaid) {
        setConfirmedOrder(orderData);
        setPlaced(true);
        sessionStorage.removeItem(SESSION_KEY);
        setIsInitializingPayment(false);
        toast.success("Order already confirmed and paid.");
        return;
      }

      // Persist active order session
      setActiveOrder(orderData);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        checkout_id: checkoutId,
        order_id: orderData.id,
        expires_at: orderData.expires_at
      }));

      // 2. Request / Reuse Razorpay Order from Backend
      const rzpData = await apiClient.post('/api/payments/create-order', {
        order_id: orderData.id
      });

      if (!rzpData || !rzpData.razorpay_order_id) {
        throw new Error("Failed to initialize payment gateway.");
      }

      // 3. Load Gateway SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setIsInitializingPayment(false);
        throw new Error("Razorpay Checkout SDK failed to load. Please check your network.");
      }

      // 4. Open Razorpay Modal with Authoritative Backend key_id
      const options = {
        key: rzpData.key_id,
        amount: rzpData.amount,
        currency: rzpData.currency || "INR",
        name: "ICW by Suko",
        description: "Order Checkout",
        order_id: rzpData.razorpay_order_id,
        modal: {
          ondismiss: function () {
            setIsInitializingPayment(false);
            toast.info("Payment window dismissed. Your 15-minute reservation is still active.");
          }
        },
        handler: async function (response) {
          setIsInitializingPayment(false);
          setIsVerifyingPayment(true);

          try {
            // 5. Verify Payment Signature Server-Side
            const verifyData = await apiClient.post('/api/payments/verify', {
              order_id: orderData.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyData && (verifyData.order?.status === 'paid' || verifyData.alreadyVerified)) {
              setConfirmedOrder(verifyData.order || orderData);
              setPlaced(true);
              sessionStorage.removeItem(SESSION_KEY);
              setIsVerifyingPayment(false);
              toast.success("Payment verified! Your bespoke order is confirmed.");
            } else {
              throw new Error(verifyData.error || "Payment verification incomplete.");
            }
          } catch (verifyErr) {
            console.warn("Payment verification response interrupted:", verifyErr.message);
            // Lost Response Recovery
            await reconcileOrderStatus(orderData.id);
          }
        },
        prefill: {
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          contact: form.phone
        },
        theme: {
          color: "#0a0a0c"
        }
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

  const formatTimer = (secs) => {
    if (secs === null || isNaN(secs)) return "";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const total = Math.max(0, subtotal - discount);

  // -------------------------------------------------------------
  // RENDER CONFIRMED ORDER SUCCESS VIEW
  // -------------------------------------------------------------
  if (placed && confirmedOrder) {
    return (
      <div data-testid="order-confirmation" className="grain pt-40 pb-32 px-6 lg:px-16 max-w-[900px] mx-auto text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}>
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          
          <span className="text-[10px] uppercase tracking-[0.4em] text-emerald-400 font-mono block mb-3 font-semibold">
            — Order Confirmed & Paid
          </span>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight font-medium mb-4 text-white">
            Thank you, <em className="italic font-normal text-foreground/80">{confirmedOrder.shipping_name || form.firstName || "Client"}.</em>
          </h1>
          <p className="font-mono text-sm text-amber-400 mb-8">
            Reference: #SUKO-{1000 + confirmedOrder.id}
          </p>

          {/* Delivery & Items Summary Card */}
          <div className="bg-[#0a0a0c]/80 border border-white/10 p-6 sm:p-8 text-left max-w-lg mx-auto mb-10 space-y-4 backdrop-blur-md">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/45 font-mono block mb-1">Destination</span>
              <p className="text-xs text-white font-body">
                {confirmedOrder.shipping_line1}, {confirmedOrder.shipping_city}, {confirmedOrder.shipping_state} - {confirmedOrder.shipping_pincode}
              </p>
              <p className="text-[11px] text-foreground/60 font-mono mt-1">Contact: {confirmedOrder.shipping_phone}</p>
            </div>

            <div className="border-b border-white/10 pb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/45 font-mono block mb-2">Purchased Creations</span>
              <div className="space-y-2">
                {confirmedOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-body text-foreground/80">
                    <span>{it.product?.name || `Item #${it.product_id}`} (Size: {it.size || "STD"}) × {it.quantity}</span>
                    <span className="font-mono text-white">{formatINR(Number(it.price_at_purchase) * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs uppercase tracking-wider font-body text-white font-medium">Total Paid</span>
              <span className="font-mono text-lg font-bold text-emerald-400">{formatINR(Number(confirmedOrder.total))}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 text-[11px] uppercase tracking-[0.3em] font-body font-bold hover:bg-white/90 transition-all shadow-xl"
            >
              <FileText size={14} /> View in My Orders
            </Link>
            <Link
              to="/collection"
              className="inline-flex items-center gap-2 border border-white/20 px-8 py-4 text-[11px] uppercase tracking-[0.3em] font-body hover:bg-white/5 transition-all text-white"
            >
              Continue Shopping <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN CHECKOUT FORM & REVIEW VIEW
  // -------------------------------------------------------------
  return (
    <div className="grain pt-36 pb-32 min-h-screen relative">
      
      {/* Payment Processing Overlay */}
      <AnimatePresence>
        {(isInitializingPayment || isVerifyingPayment || reconcilingPayment) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center space-y-6"
          >
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="w-20 h-20 rounded-full border-2 border-transparent border-t-white border-r-white/40"
              />
              <motion.div
                animate={{ scale: [0.85, 1.15, 0.85] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="absolute"
              >
                <Sparkles className="w-7 h-7 text-white" />
              </motion.div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm uppercase tracking-[0.35em] font-body text-white font-medium animate-pulse">
                {reconcilingPayment ? "Confirming Payment with Gateway..." : isVerifyingPayment ? "Verifying Signature with Atelier..." : "Initializing Razorpay Session..."}
              </h3>
              <p className="text-[11px] text-foreground/50 uppercase tracking-[0.2em] font-body max-w-sm">
                Securing order of <span className="text-white font-mono font-bold">{formatINR(activeOrder ? Number(activeOrder.total) : total)}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-16">
        
        {/* Header with Active Reservation Timer */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body block mb-2">— Step 02 / Secure Checkout</span>
            <h1 className="font-display text-4xl lg:text-5xl tracking-tight font-medium text-white">Checkout</h1>
          </div>

          {remainingSeconds !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-sm border ${remainingSeconds < 120 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
              <Clock size={16} className={remainingSeconds < 120 ? 'animate-pulse' : ''} />
              <span className="text-xs font-mono font-bold tracking-wider">
                {remainingSeconds > 0 ? `Reservation Expires in: ${formatTimer(remainingSeconds)}` : "Reservation Expired"}
              </span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-16">
          <form onSubmit={placeOrder} data-testid="checkout-form" className="lg:col-span-7 space-y-12">
            
            {/* Contact Details */}
            <section>
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body mb-6 font-medium">— Contact Information</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <input
                  data-testid="checkout-email"
                  value={form.email}
                  onChange={upd("email")}
                  type="email"
                  placeholder="Email Address *"
                  className="w-full bg-transparent border-b border-white/15 focus:border-white outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white"
                  required
                />
                <input
                  value={form.phone}
                  onChange={upd("phone")}
                  type="tel"
                  placeholder="Contact Phone Number *"
                  className="w-full bg-transparent border-b border-white/15 focus:border-white outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white"
                  required
                />
              </div>
            </section>

            {/* Saved Address Book Selection */}
            {addresses.length > 0 && (
              <section>
                <h2 className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-mono mb-4">— Select Saved Delivery Address</h2>
                <div className="grid sm:grid-cols-2 gap-4 mb-2">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => selectSavedAddress(addr)}
                      className={`p-4 border cursor-pointer transition-all ${selectedAddrId === addr.id ? 'border-white bg-white/10 shadow-lg' : 'border-white/10 hover:border-white/30 bg-white/5'}`}
                    >
                      <p className="text-xs font-body font-bold text-white flex items-center gap-1.5"><MapPin size={12} className="text-emerald-400" /> {addr.line1}</p>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-foreground/60 mt-1 font-mono">{addr.city}, {addr.state} - {addr.pincode}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Delivery Destination Form */}
            <section className="space-y-6">
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body font-medium">— Delivery Destination</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <input data-testid="checkout-firstname" value={form.firstName} onChange={upd("firstName")} placeholder="First name *" className="bg-transparent border-b border-white/15 focus:border-white outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white" required />
                <input data-testid="checkout-lastname" value={form.lastName} onChange={upd("lastName")} placeholder="Last name *" className="bg-transparent border-b border-white/15 focus:border-white outline-none py-3 text-base placeholder:text-foreground/35 text-white" required />
                <input data-testid="checkout-address" value={form.address} onChange={upd("address")} placeholder="Street Address / Residence *" className="sm:col-span-2 bg-transparent border-b border-white/15 focus:border-white outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white" required />
                <input data-testid="checkout-city" value={form.city} onChange={upd("city")} placeholder="City *" className="bg-transparent border-b border-white/15 focus:border-white outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white" required />
                <input value={form.state} onChange={upd("state")} placeholder="State *" className="bg-transparent border-b border-white/15 focus:border-white outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white" required />
                <input data-testid="checkout-pincode" value={form.pincode} onChange={upd("pincode")} placeholder="PIN Code *" className="sm:col-span-2 bg-transparent border-b border-white/15 focus:border-white outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white font-mono" required />
              </div>

              <label className="flex items-center gap-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={saveToAddressBook}
                  onChange={(e) => setSaveToAddressBook(e.target.checked)}
                  className="accent-emerald-400 w-4 h-4"
                />
                <span className="text-xs text-foreground/80 font-body">
                  Save this delivery address to my account profile
                </span>
              </label>
            </section>

            {/* Billing Address Toggle */}
            <section className="space-y-6 pt-4 border-t border-white/10">
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body font-medium">— Billing Information</h2>
              
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-white/10 bg-white/5">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                  className="accent-amber-400 w-4 h-4"
                />
                <span className="text-xs text-white font-body font-medium">
                  Billing address is identical to shipping address
                </span>
              </label>

              {!sameAsBilling && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="grid sm:grid-cols-2 gap-6 pt-4">
                  <input value={billingForm.address} onChange={updBilling("address")} placeholder="Billing Street Address *" className="sm:col-span-2 bg-transparent border-b border-white/15 focus:border-amber-400 outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white" required />
                  <input value={billingForm.city} onChange={updBilling("city")} placeholder="Billing City *" className="bg-transparent border-b border-white/15 focus:border-amber-400 outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white" required />
                  <input value={billingForm.state} onChange={updBilling("state")} placeholder="Billing State *" className="bg-transparent border-b border-white/15 focus:border-amber-400 outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white" required />
                  <input value={billingForm.pincode} onChange={updBilling("pincode")} placeholder="Billing PIN Code *" className="sm:col-span-2 bg-transparent border-b border-white/15 focus:border-amber-400 outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white font-mono" required />
                </motion.div>
              )}
            </section>

            {/* Payment Options */}
            <section>
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body mb-6 font-medium">— Payment Gateway</h2>
              <div className="border border-white/20 p-5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="text-amber-400" size={20} />
                  <div>
                    <span className="text-sm font-body text-white font-bold block">Razorpay Secure Checkout</span>
                    <span className="text-[10px] font-mono text-foreground/50 uppercase tracking-widest">Cards, UPI, Netbanking & Wallets</span>
                  </div>
                </div>
                <ShieldCheck size={20} className="text-emerald-400" />
              </div>
            </section>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isInitializingPayment || (remainingSeconds !== null && remainingSeconds <= 0)}
              data-testid="place-order-btn"
              className="w-full bg-white text-black py-5 text-[11px] uppercase tracking-[0.3em] font-body hover:bg-white/90 transition-all font-bold shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isInitializingPayment ? (
                <><Loader2 className="animate-spin" size={16} /> Initializing...</>
              ) : remainingSeconds !== null && remainingSeconds <= 0 ? (
                "Session Expired · Refresh Bag"
              ) : (
                `Proceed to Payment · ${formatINR(activeOrder ? Number(activeOrder.total) : total)}`
              )}
            </button>
          </form>

          {/* Sidebar Order Summary */}
          <aside className="lg:col-span-5 lg:sticky lg:top-32 self-start border border-white/10 p-8 bg-[#0a0a0c]/80 backdrop-blur-md">
            <h3 className="font-display text-2xl mb-8 text-white">Your Order Summary</h3>
            <ul className="space-y-6 mb-8 max-h-80 overflow-y-auto pr-2">
              {items.map((i) => (
                <li key={i.key} className="flex gap-4">
                  <img src={i.image} alt={i.name} className="w-16 h-20 object-cover rounded-sm border border-white/10" />
                  <div className="flex-1">
                    <p className="font-display text-sm text-white">{i.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/45 font-body mt-1">Size {i.size || "STD"} · Qty {i.qty}</p>
                  </div>
                  <span className="text-sm font-body text-white font-medium">{formatINR(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>

            {/* Voucher Section */}
            <div className="border-t border-white/10 pt-6 mb-8">
              <label className="text-[10px] uppercase tracking-[0.2em] font-body text-foreground/50 block mb-2 font-medium">Apply Atelier Coupon Code</label>
              
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE (e.g. SUKO10)"
                    className="flex-1 bg-black/40 border border-white/15 px-3 py-2 text-xs font-mono text-white placeholder:text-foreground/35 outline-none uppercase focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={applyPromoCode}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-[10px] uppercase tracking-[0.15em] font-body font-bold text-white transition-all"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 font-mono text-xs text-emerald-400">
                  <span>Coupon: <strong>{appliedCoupon}</strong> (-{formatINR(discount)})</span>
                  <button onClick={removeCoupon} className="text-red-400 hover:text-red-300 text-[10px] uppercase tracking-widest font-bold">Remove</button>
                </div>
              )}

              {couponError && (
                <p className="text-xs text-red-400 font-body mt-2">{couponError}</p>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="border-t border-white/10 pt-6 space-y-3 font-body text-xs">
              <div className="flex justify-between text-foreground/60">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-mono font-bold">
                  <span>Promo Discount ({appliedCoupon})</span>
                  <span>-{formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-foreground/60">
                <span>Atelier Shipping</span>
                <span className="text-emerald-400 font-mono font-bold uppercase">Complimentary</span>
              </div>
              <div className="flex justify-between text-base text-white font-medium border-t border-white/10 pt-4 mt-2">
                <span>Total Payable</span>
                <span className="font-mono text-lg font-bold text-emerald-400">
                  {formatINR(activeOrder ? Number(activeOrder.total) : total)}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
