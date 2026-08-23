import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Sparkles, Lock, Printer, FileText, ArrowRight, MapPin, CreditCard, ShieldCheck } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatINR } from "../data/products";
import { API_BASE_URL } from "../config/api";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placed, setPlaced] = useState(false);

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

  // Separate Billing Address States
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
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("token");
      if (token) {
        Promise.all([
          fetch(`${API_BASE_URL}/api/auth/profile`, { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE_URL}/api/addresses`, { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.ok ? r.json() : [])
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
            toast.success("Welcome back! Your saved details & primary delivery address auto-filled.");
          }
        }).catch(err => console.error(err));
      }
    }
  }, [user]);

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
    toast.success("Saved shipping address loaded!");
  };

  const applyPromoCode = async () => {
    setCouponError("");
    if (!couponCode.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/coupons/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, orderTotal: subtotal })
      });
      const data = await res.json();

      if (!res.ok) {
        setCouponError(data.error || "Invalid promo code");
        setDiscount(0);
        setAppliedCoupon(null);
        toast.error(data.error || "Invalid promo code");
      } else {
        setDiscount(data.discountAmount);
        setAppliedCoupon(data.code);
        toast.success(`Coupon ${data.code} applied! Saved ${formatINR(data.discountAmount)}`);
      }
    } catch (err) {
      setCouponError("Failed to apply promo code");
      console.error(err);
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    toast.info("Coupon removed");
  };

  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const updBilling = (k) => (e) => setBillingForm({ ...billingForm, [k]: e.target.value });

  // Auto-save address to user profile
  const autoSaveUserAddress = async (token) => {
    if (!saveToAddressBook || !token || !form.address) return;
    try {
      await fetch(`${API_BASE_URL}/api/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          line1: form.address,
          city: form.city || "Mumbai",
          state: form.state || "Maharashtra",
          pincode: form.pincode || "400050",
          phone: form.phone || "9876543210"
        })
      });
    } catch (e) {
      console.error("Auto address save background error:", e);
    }
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!form.email || !form.firstName || !form.address || !form.city || !form.pincode) {
      toast.error("Please fill all required shipping address fields.");
      return;
    }
    if (!sameAsBilling && (!billingForm.address || !billingForm.city || !billingForm.pincode)) {
      toast.error("Please fill all required billing address fields.");
      return;
    }
    if (items.length === 0) {
      toast.error("Your shopping bag is empty");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("You must sign in or create an account to proceed with checkout.");
      navigate("/auth");
      return;
    }

    // Auto-save address to profile
    autoSaveUserAddress(token);

    // Cash on Delivery Handling
    if (form.payment === "cod") {
      try {
        const orderRes = await fetch(`${API_BASE_URL}/api/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            name: `${form.firstName || ''} ${form.lastName || ''}`.trim(),
            phone: form.phone,
            email: form.email,
            items: items.map(i => ({ product_id: i.id, quantity: i.qty, size: i.size })),
            discount: discount,
            total: total
          })
        });
        if (orderRes.ok) {
          setPlaced(true);
          clearCart();
          toast.success("Cash on Delivery Order placed & address saved!");
        } else {
          toast.error("Failed to place COD order");
        }
      } catch (err) {
        toast.error(err.message);
      }
      return;
    }

    setIsInitializingPayment(true);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setIsInitializingPayment(false);
      toast.error("Razorpay SDK failed to load. Are you online?");
      return;
    }

    try {
      // 1. Create Order in Backend DB
      const orderRes = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `${form.firstName || ''} ${form.lastName || ''}`.trim(),
          phone: form.phone,
          email: form.email,
          items: items.map(i => ({ product_id: i.id, quantity: i.qty, size: i.size })),
          discount: discount,
          total: total
        })
      });
      const orderData = await orderRes.json();
      
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // 2. Create Razorpay Order
      const rzpRes = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ order_id: orderData.id })
      });
      const rzpData = await rzpRes.json();

      if (!rzpRes.ok) {
        throw new Error(rzpData.error || "Failed to initialize Razorpay");
      }

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: rzpData.key_id,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: "Suko Atelier",
        description: "Premium Bespoke Garments",
        order_id: rzpData.razorpay_order_id,
        modal: {
          ondismiss: function() {
            setIsInitializingPayment(false);
          }
        },
        handler: async function (response) {
          // 4. Verify Payment
          const verifyRes = await fetch(`${API_BASE_URL}/api/payments/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              order_id: orderData.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });
          const verifyData = await verifyRes.json();
          
          setIsInitializingPayment(false);

          if (verifyRes.ok) {
            setPlaced(true);
            clearCart();
            toast.success("Payment successful. Order confirmed!");
          } else {
            toast.error(verifyData.error || "Payment verification failed.");
          }
        },
        prefill: {
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          contact: form.phone
        },
        theme: {
          color: "#000000"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

      setTimeout(() => {
        setIsInitializingPayment(false);
      }, 1500);

    } catch (err) {
      setIsInitializingPayment(false);
      toast.error(err.message);
      console.error(err);
    }
  };

  const total = Math.max(0, subtotal - discount);

  if (placed) {
    return (
      <div data-testid="order-confirmation" className="grain pt-40 pb-32 px-6 lg:px-16 max-w-[900px] mx-auto text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
          <CheckCircle2 size={48} strokeWidth={1} className="mx-auto text-foreground/80 mb-8" />
          <span className="text-[10px] uppercase tracking-[0.4em] text-foreground/45 font-body block mb-4">— Order Confirmed</span>
          <h1 className="font-display text-5xl sm:text-6xl tracking-tighter font-medium mb-6">
            Thank you, <em className="italic font-normal text-foreground/55">{form.firstName || "Sir"}.</em>
          </h1>
          <p className="font-body text-sm text-foreground/60 max-w-md mx-auto leading-relaxed mb-10">
            Your order has been logged in the Suko Atelier ledger. A confirmation email and tax receipt have been dispatched to <strong className="text-foreground">{form.email}</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 text-[11px] uppercase tracking-[0.3em] font-body font-bold hover:bg-foreground/90 transition-all shadow-xl"
            >
              <FileText size={14} /> View Order Receipts & Invoices
            </Link>
            <Link
              to="/account"
              className="inline-flex items-center gap-2 border border-white/20 px-8 py-4 text-[11px] uppercase tracking-[0.3em] font-body hover:bg-white/5 transition-all text-white"
            >
              View Saved Addresses <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="grain pt-36 pb-32 min-h-screen relative">
      
      {/* Full-Screen Razorpay Gateway Modal */}
      <AnimatePresence>
        {isInitializingPayment && (
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
                Initializing Razorpay Gateway...
              </h3>
              <p className="text-[11px] text-foreground/50 uppercase tracking-[0.2em] font-body max-w-sm">
                Securing your atelier order of <span className="text-white font-mono font-bold">{formatINR(total)}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-16">
        <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body block mb-4">— Step 02 / Checkout</span>
        <h1 className="font-display text-4xl lg:text-5xl tracking-tighter font-medium mb-16">Checkout</h1>

        <div className="grid lg:grid-cols-12 gap-16">
          <form onSubmit={placeOrder} data-testid="checkout-form" className="lg:col-span-7 space-y-12">
            
            {/* Contact Specs */}
            <section>
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body mb-6 font-medium">— Contact</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <input
                  data-testid="checkout-email"
                  value={form.email}
                  onChange={upd("email")}
                  type="email"
                  placeholder="Email Address *"
                  className="w-full bg-transparent border-b border-white/15 focus:border-foreground outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white"
                  required
                />
                <input
                  value={form.phone}
                  onChange={upd("phone")}
                  type="tel"
                  placeholder="Contact Phone Number *"
                  className="w-full bg-transparent border-b border-white/15 focus:border-foreground outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white"
                  required
                />
              </div>
            </section>

            {/* Saved Addresses Selector */}
            {addresses.length > 0 && (
              <section>
                <h2 className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-mono mb-4">— Select From Saved Address Book</h2>
                <div className="grid sm:grid-cols-2 gap-4 mb-2">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => selectSavedAddress(addr)}
                      className={`p-4 border cursor-pointer transition-all ${selectedAddrId === addr.id ? 'border-foreground bg-white/10 shadow-lg' : 'border-white/10 hover:border-white/30 bg-white/5'}`}
                    >
                      <p className="text-xs font-body font-bold text-white flex items-center gap-1.5"><MapPin size={12} className="text-emerald-400" /> {addr.line1}</p>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-foreground/60 mt-1 font-mono">{addr.city}, {addr.state} - {addr.pincode}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SHIPPING ADDRESS SECTION */}
            <section className="space-y-6">
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body font-medium">— Shipping Address (Delivery Destination)</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <input data-testid="checkout-firstname" value={form.firstName} onChange={upd("firstName")} placeholder="First name *" className="bg-transparent border-b border-white/15 focus:border-foreground outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white" required />
                <input data-testid="checkout-lastname" value={form.lastName} onChange={upd("lastName")} placeholder="Last name *" className="bg-transparent border-b border-white/15 focus:border-foreground outline-none py-3 text-base placeholder:text-foreground/35 text-white" required />
                <input data-testid="checkout-address" value={form.address} onChange={upd("address")} placeholder="Street Address / House Line *" className="sm:col-span-2 bg-transparent border-b border-white/15 focus:border-foreground outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white" required />
                <input data-testid="checkout-city" value={form.city} onChange={upd("city")} placeholder="City *" className="bg-transparent border-b border-white/15 focus:border-foreground outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white" required />
                <input value={form.state} onChange={upd("state")} placeholder="State *" className="bg-transparent border-b border-white/15 focus:border-foreground outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white" required />
                <input data-testid="checkout-pincode" value={form.pincode} onChange={upd("pincode")} placeholder="PIN / Postal code *" className="sm:col-span-2 bg-transparent border-b border-white/15 focus:border-foreground outline-none py-3 text-base font-body placeholder:text-foreground/35 text-white font-mono" required />
              </div>

              {/* Auto Save Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={saveToAddressBook}
                  onChange={(e) => setSaveToAddressBook(e.target.checked)}
                  className="accent-emerald-400 w-4 h-4"
                />
                <span className="text-xs text-foreground/80 font-body">
                  Save this shipping address to my account profile for 1-click future checkouts
                </span>
              </label>
            </section>

            {/* BILLING ADDRESS SECTION */}
            <section className="space-y-6 pt-4 border-t border-white/10">
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body font-medium">— Billing Address</h2>
              
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-white/10 bg-white/5">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                  className="accent-amber-400 w-4 h-4"
                />
                <span className="text-xs text-white font-body font-medium">
                  Billing address is the same as my shipping address
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

            {/* PAYMENT METHOD */}
            <section>
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body mb-6">— Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: "card", label: "Credit / Debit Card (Online Razorpay)" },
                  { id: "upi", label: "UPI Instant Pay" },
                  { id: "cod", label: "Cash on Delivery (COD)" },
                ].map((p) => (
                  <label key={p.id} className={`flex items-center gap-4 border px-5 py-4 cursor-pointer transition-all ${form.payment === p.id ? "border-foreground bg-white/5" : "border-white/10 hover:border-white/30"}`}>
                    <input
                      data-testid={`payment-${p.id}`}
                      type="radio"
                      name="payment"
                      checked={form.payment === p.id}
                      onChange={() => setForm({ ...form, payment: p.id })}
                      className="accent-foreground"
                    />
                    <span className="text-sm font-body text-white font-medium">{p.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <button
              type="submit"
              data-testid="place-order-btn"
              className="w-full bg-foreground text-background py-5 text-[11px] uppercase tracking-[0.3em] font-body hover:bg-foreground/90 transition-all font-bold shadow-xl"
            >
              Place Order · {formatINR(total)}
            </button>
          </form>

          {/* Summary Sidebar */}
          <aside className="lg:col-span-5 lg:sticky lg:top-32 self-start border border-white/10 p-8 bg-[#0a0a0c]/80 backdrop-blur-md">
            <h3 className="font-display text-2xl mb-8">Your Order Summary</h3>
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

            {/* Promo Voucher Section */}
            <div className="border-t border-white/10 pt-6 mb-8">
              <label className="text-[10px] uppercase tracking-[0.2em] font-body text-foreground/50 block mb-2 font-medium">Have a Promo Coupon / Voucher?</label>
              
              {!appliedCoupon ? (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE (e.g. SUKO10)"
                      className="flex-1 bg-black/40 border border-white/15 px-3 py-2 text-xs font-mono text-white placeholder:text-foreground/35 outline-none uppercase focus:border-foreground"
                    />
                    <button
                      type="button"
                      onClick={applyPromoCode}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-[10px] uppercase tracking-[0.15em] font-body font-bold text-white transition-all"
                    >
                      Apply
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-[9px] text-foreground/40 font-mono self-center">Quick Tap Vouchers:</span>
                    {[
                      { code: "SUKO10", label: "SUKO10 (10% OFF)" },
                      { code: "WELCOME20", label: "WELCOME20 (20% OFF)" },
                      { code: "ATELIER500", label: "ATELIER500 (₹500 OFF)" }
                    ].map((v) => (
                      <button
                        key={v.code}
                        type="button"
                        onClick={() => {
                          setCouponCode(v.code);
                          setCouponError("");
                        }}
                        className="text-[9px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 hover:bg-amber-500/20 transition-all font-bold"
                      >
                        + {v.code}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 font-mono text-xs text-emerald-400">
                  <span>Voucher: <strong>{appliedCoupon}</strong> (-{formatINR(discount)})</span>
                  <button onClick={removeCoupon} className="text-red-400 hover:text-red-300 text-[10px] uppercase tracking-widest font-bold">Remove</button>
                </div>
              )}

              {couponError && (
                <p className="text-xs text-red-400 font-body mt-2">{couponError}</p>
              )}
            </div>

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
                <span className="font-mono text-lg font-bold text-emerald-400">{formatINR(total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
