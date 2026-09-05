import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Lock,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Download,
  Printer,
  FileText,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  UploadCloud,
  AlertCircle,
  ShieldCheck,
  Clock,
  Image as ImageIcon,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { formatINR, WHATSAPP_LINK, getProductBySlug, PRODUCTS } from "../data/products";
import { apiClient } from "../config/api";
import { getThumbImage } from "../utils/mediaUtils";
import SEO from "../components/SEO";

const SESSION_KEY = "suko_active_checkout";
const MERCHANT_UPI_ID = process.env.REACT_APP_MERCHANT_UPI_ID || "9022418978-m97f@axl";
const MERCHANT_NAME = "MILES ALONG SMILES";

const Checkout = () => {
  const { items, subtotal, updateQty, removeItem, clearCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();

  const handleRemoveFromOrder = (item) => {
    removeItem(item.key);
    const fullProduct = getProductBySlug(item.slug) || {
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      image: item.image,
      color: item.color,
    };
    if (!isInWishlist(item.id)) {
      addToWishlist(fullProduct);
      toast.success(`${item.name} removed from order and saved to your Wishlist.`);
    } else {
      toast.info(`${item.name} removed from order (already in your Wishlist).`);
    }
  };

  // Enforce account creation / authentication to checkout & pay
  useEffect(() => {
    if (!loading && !user?.authenticated) {
      toast.info("Please create an account or sign in to complete your order.");
      navigate("/auth?redirect=/checkout&mode=register");
    }
  }, [user, loading, navigate]);

  // Active Order & Confirmation States
  const [placed, setPlaced] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
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

  // Manual UPI QR Payment States
  const [upiOrder, setUpiOrder] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [screenshotError, setScreenshotError] = useState("");
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [verificationSubmittedOrder, setVerificationSubmittedOrder] = useState(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

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

  // Handle Screenshot Selection and Validation (JPG, JPEG, PNG, WebP & max 5 MB)
  const handleScreenshotChange = (e) => {
    setScreenshotError("");
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setScreenshotError("Only JPG, JPEG, PNG, or WebP image formats are permitted.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setScreenshotError("Screenshot file size exceeds the 5 MB limit.");
      e.target.value = "";
      return;
    }

    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Copy Merchant UPI ID to Clipboard
  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(MERCHANT_UPI_ID);
    setCopiedUpi(true);
    toast.success("Merchant UPI ID copied to clipboard.");
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Primary Checkout Submission -> Creates pending_payment order session
  const placeOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!user?.authenticated) {
      try {
        sessionStorage.setItem("suko_checkout_form", JSON.stringify(form));
      } catch (err) {}
      toast.info("Please create an account or sign in to proceed with payment.");
      navigate("/auth?redirect=/checkout&mode=register");
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
        items: items.map((i) => {
          const catalogProd = getProductBySlug(i.slug) || (PRODUCTS || []).find((p) => p.id === i.id || p.slug === i.slug);
          const price = Number(i.price) || Number(catalogProd?.price) || 0;
          const name = i.name || catalogProd?.name || "Atelier Garment";
          const image = i.image || (catalogProd?.images && catalogProd.images[0]) || "";
          return {
            product_id: i.id || catalogProd?.id || "",
            name,
            price,
            size: i.size || "M",
            quantity: Number(i.qty) || 1,
            image_url: image,
          };
        }),
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

      setActiveOrder(orderData);
      setUpiOrder(orderData);
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          checkout_id: checkoutId,
          order_id: orderData.id,
        })
      );

      setIsInitializingPayment(false);
      toast.success("Order initiated. Please scan the QR code to complete payment.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setIsInitializingPayment(false);
      toast.error(err.message || "Failed to initiate payment.");
    }
  };

  // Submit Payment Proof for Verification
  const handleSubmitPaymentProof = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!upiOrder) return;

    const trimmedTx = transactionId.trim();
    if (!trimmedTx) {
      toast.error("Transaction ID / UTR is required.");
      return;
    }

    if (!screenshotPreview) {
      toast.error("Payment screenshot is required.");
      return;
    }

    setIsSubmittingProof(true);
    try {
      const response = await apiClient.post(`/api/orders/${upiOrder.id}/submit-payment-proof`, {
        transaction_id: trimmedTx,
        screenshot: screenshotPreview,
      });

      if (response && response.success) {
        toast.success("Payment details received for verification.");
        await clearCart();
        setVerificationSubmittedOrder(
          response.order || {
            ...upiOrder,
            transaction_id: trimmedTx,
            status: "payment_verification_pending",
          }
        );
        sessionStorage.removeItem(SESSION_KEY);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        throw new Error(response.error || "Failed to submit payment details.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to submit payment details.");
    } finally {
      setIsSubmittingProof(false);
    }
  };

  const total = Math.max(0, subtotal - discount);

  const upiDeepLink = upiOrder
    ? `upi://pay?pa=${MERCHANT_UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${upiOrder.total}&tr=SUKO-${1000 + upiOrder.id}&tn=${encodeURIComponent("Order SUKO-" + (1000 + upiOrder.id))}&cu=INR`
    : "";

  // -------------------------------------------------------------
  // 0. PAYMENT VERIFICATION PENDING VIEW (Manual UPI Workflow)
  // -------------------------------------------------------------
  if (verificationSubmittedOrder) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#111113] font-body flex flex-col justify-between">
        <SEO
          title="Payment Verification Pending | SUKO"
          description="Payment details received for verification."
        />

        {/* Minimal Header */}
        <header className="w-full bg-[#FAF8F5] border-b border-[#EAE6DF]">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
            <Link to="/" className="inline-block">
              <img src="/logo.png" alt="SUKO" className="h-5 sm:h-6 w-auto" />
            </Link>
            <span className="text-[10.5px] uppercase tracking-[0.24em] font-medium text-[#C2922E] flex items-center gap-1.5">
              <Clock size={12} />
              <span>VERIFICATION PENDING</span>
            </span>
          </div>
        </header>

        {/* Verification Acknowledgment Content */}
        <main className="max-w-[720px] mx-auto px-5 sm:px-8 py-16 sm:py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="w-12 h-12 border border-[#C2922E] flex items-center justify-center mx-auto mb-6 text-[#C2922E]">
              <Clock size={24} strokeWidth={1.5} />
            </div>

            <span className="text-[10px] uppercase tracking-[0.32em] text-[#C2922E] font-medium block mb-2">
              UPI PAYMENT ACKNOWLEDGMENT
            </span>
            <h1 className="font-quiche text-2xl sm:text-3xl md:text-4xl font-light text-[#111113] tracking-tight mb-2">
              Payment details received for verification.
            </h1>
            <p className="text-[13px] text-[#6E6E75] font-light max-w-lg mx-auto mb-8 leading-relaxed">
              Thank you, {verificationSubmittedOrder.shipping_name || form.firstName || "Client"}. Our atelier concierge is reviewing your transaction with our merchant account.
            </p>

            {/* Clean Details Box */}
            <div className="bg-[#F7F5F0] border border-[#EAE6DF] p-6 sm:p-8 text-left mb-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-[#EAE6DF] pb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] block mb-1">
                    Order Reference
                  </span>
                  <p className="font-mono font-bold text-[#111113] text-[13.5px]">
                    #SUKO-{1000 + verificationSubmittedOrder.id}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] block mb-1">
                    Transaction ID / UTR
                  </span>
                  <p className="font-mono text-[#111113] text-[13px] tracking-wider">
                    {verificationSubmittedOrder.transaction_id || transactionId}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] block mb-1">
                    Payment Status
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-800 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-medium">
                    <Clock size={11} className="text-[#C2922E]" /> Verification Pending
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] block mb-1">
                    Payable Amount
                  </span>
                  <p className="font-quiche text-lg font-normal text-[#111113]">
                    {formatINR(verificationSubmittedOrder.total)}
                  </p>
                </div>
              </div>

              {/* Delivery destination */}
              <div className="border-b border-[#EAE6DF] pb-4">
                <span className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] block mb-1">
                  Delivery Destination
                </span>
                <p className="text-[13px] text-[#111113] font-light leading-relaxed">
                  {verificationSubmittedOrder.shipping_line1 || form.address}, {verificationSubmittedOrder.shipping_city || form.city}, {verificationSubmittedOrder.shipping_state || form.state} - {verificationSubmittedOrder.shipping_pincode || form.pincode}
                </p>
                <p className="text-[11.5px] text-[#6E6E75] font-light mt-1">
                  Contact: {verificationSubmittedOrder.shipping_phone || form.phone}
                </p>
              </div>

              {/* Notice */}
              <div className="bg-white border border-[#EAE6DF] p-3.5 text-xs text-[#6E6E75] leading-relaxed">
                <p className="text-[#111113] font-medium text-[11px] uppercase tracking-wider mb-0.5">
                  Your order will be confirmed after payment verification.
                </p>
                <p className="text-[11.5px]">
                  Once our admin reconciles your payment with our merchant bank account, your order status will be updated to confirmed and an official tax invoice will be sent to your email.
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
              <Link
                to="/orders"
                className="w-full sm:w-auto bg-[#111113] hover:bg-[#C2922E] text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium transition-colors text-center"
              >
                View in My Orders
              </Link>
              <Link
                to="/collection"
                className="w-full sm:w-auto border border-[#DDD8CE] hover:border-[#111113] px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium transition-colors text-[#6E6E75] hover:text-[#111113] text-center"
              >
                Continue Browsing
              </Link>
            </div>
          </motion.div>
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-8">
              <p className="text-[12.5px] text-[#6E6E75] font-light">
                Order Reference: <span className="font-medium text-[#111113]">#SUKO-{1000 + confirmedOrder.id}</span>
              </p>
              <span className="hidden sm:inline text-[#DDD8CE]">•</span>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(true)}
                className="text-[11px] uppercase tracking-[0.18em] text-[#C2922E] hover:text-[#111113] hover:underline font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download size={13} />
                <span>Download Invoice</span>
              </button>
            </div>

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

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(true)}
                className="w-full sm:w-auto bg-[#111113] hover:bg-[#C2922E] text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Download size={14} className="text-[#C2922E]" />
                <span>Download Invoice</span>
              </button>
              <Link
                to="/orders"
                className="w-full sm:w-auto border border-[#111113] bg-transparent hover:bg-[#111113] hover:text-white text-[#111113] px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium transition-colors text-center"
              >
                View in My Orders
              </Link>
              <Link
                to="/collection"
                className="w-full sm:w-auto border border-[#DDD8CE] hover:border-[#111113] px-7 py-3.5 text-[11px] uppercase tracking-[0.22em] font-medium transition-colors text-[#6E6E75] hover:text-[#111113] text-center"
              >
                Continue Browsing
              </Link>
            </div>
          </motion.div>
        </main>

        {/* Printable Tax Invoice Modal (Mobile Responsive & SUKO Luxury Theme) */}
        {showInvoiceModal && (
          <div className="print-invoice-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
            <div className="print-invoice-modal-card bg-white text-[#111113] max-w-2xl w-full p-4 sm:p-8 md:p-10 rounded-xs relative shadow-2xl font-body space-y-5 max-h-[92vh] overflow-y-auto border border-[#EAE6DF]">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="no-print absolute top-3.5 right-3.5 text-[#8C887B] hover:text-[#111113] p-1.5 transition-colors cursor-pointer rounded-full hover:bg-[#FAF8F5]"
                aria-label="Close invoice"
              >
                <X size={18} />
              </button>

              {/* Invoice Header */}
              <div className="border-b border-[#EAE6DF] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="font-quiche text-2xl sm:text-3xl tracking-[0.24em] text-[#111113]">S U K O</h2>
                  <p className="text-[9px] uppercase tracking-[0.22em] text-[#C2922E] font-medium mt-0.5">
                    The Indian Corporate Wear &bull; Official Tax Invoice
                  </p>
                </div>
                <div className="text-left sm:text-right text-xs">
                  <p className="font-mono font-bold text-sm text-[#111113]">INVOICE #SUKO-{1000 + confirmedOrder.id}</p>
                  <p className="text-[#6E6E75] text-[11px] mt-0.5">
                    {new Date(confirmedOrder.created_at || Date.now()).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#FAF6EE] border border-[#D8C39D] text-[#8A6518] rounded-xs text-[9.5px] font-bold tracking-wider uppercase">
                    {confirmedOrder.status === "paid" ? "PAID IN FULL" : (confirmedOrder.status || "CONFIRMED").toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Billed To Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-b border-[#EAE6DF] pb-4">
                <div className="bg-[#FAF8F5] p-3.5 rounded-xs border border-[#EAE6DF]">
                  <p className="text-[9px] uppercase tracking-wider text-[#C2922E] font-bold mb-1">Billed &amp; Shipped To:</p>
                  <p className="font-bold text-sm text-[#111113]">
                    {confirmedOrder.shipping_name || `${form.firstName || ""} ${form.lastName || ""}`.trim() || user?.name || "Valued Client"}
                  </p>
                  <p className="text-[#6E6E75] text-[11.5px] mt-0.5">
                    {confirmedOrder.shipping_line1 || form.address || "Atelier Delivery Address"}
                  </p>
                  <p className="text-[#6E6E75] text-[11.5px]">
                    {confirmedOrder.shipping_city || form.city || ""}, {confirmedOrder.shipping_state || form.state || ""} - {confirmedOrder.shipping_pincode || form.pincode || ""}
                  </p>
                  <p className="text-[#6E6E75] text-[11px] font-mono mt-1">
                    Contact: {confirmedOrder.shipping_phone || form.phone || user?.phone || "Not specified"}
                  </p>
                </div>
                <div className="bg-[#FAF8F5] p-3.5 rounded-xs border border-[#EAE6DF] sm:text-right">
                  <p className="text-[9px] uppercase tracking-wider text-[#8C887B] font-bold mb-1">Atelier Details:</p>
                  <p className="font-bold text-sm text-[#111113]">SUKO Atelier Studio</p>
                  <p className="text-[#6E6E75] text-[11.5px] mt-0.5">Bandra West, Mumbai, MH</p>
                  <p className="text-[#6E6E75] text-[11.5px]">GSTIN: 27AAAAA0000A1Z5</p>
                  <p className="text-[#C2922E] text-[11.5px] mt-1">indiancorporatewearbysuko@gmail.com</p>
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
                    {confirmedOrder.items && confirmedOrder.items.length > 0 ? (
                      confirmedOrder.items.map((item, i) => (
                        <tr key={i}>
                          <td className="py-2.5 pr-2 font-medium text-[#111113]">
                            {item.product?.name || item.product_name || `Atelier Garment ${i + 1}`}
                          </td>
                          <td className="py-2.5 px-2 text-center text-[#555560]">
                            <span className="px-1.5 py-0.5 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xs text-[10px]">
                              {item.size || "STD"}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-[#555560]">{item.quantity || 1}</td>
                          <td className="py-2.5 pl-2 text-right font-mono font-bold text-[#111113]">
                            {formatINR(Number(item.price_at_purchase || item.price || 0) * (item.quantity || 1))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-2.5 font-medium text-[#111113]">Bespoke Atelier Garment</td>
                        <td className="py-2.5 text-center text-[#555560]">STD</td>
                        <td className="py-2.5 text-center font-mono text-[#555560]">1</td>
                        <td className="py-2.5 text-right font-mono font-bold text-[#111113]">{formatINR(confirmedOrder.total)}</td>
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
                    <span className="font-mono text-[#111113]">{formatINR(confirmedOrder.total)}</span>
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
                    <span className="font-mono text-base">{formatINR(confirmedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Stamp & Print */}
              <div className="border-t border-[#EAE6DF] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[8.5px] uppercase tracking-widest text-[#8C887B] text-center sm:text-left">
                  Authentic Garment Guarantee &bull; Hand-crafted Atelier
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="no-print w-full sm:w-auto bg-[#111113] hover:bg-[#C2922E] text-white px-5 py-2.5 text-xs font-medium uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs rounded-xs"
                  >
                    <Printer size={13} /> Print / Save PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInvoiceModal(false)}
                    className="no-print border border-[#DDD8CE] hover:border-[#111113] text-[#111113] px-4 py-2.5 text-xs font-medium uppercase tracking-[0.18em] transition-colors rounded-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
            <div className="flex items-center gap-3 sm:gap-5">
              <button
                type="button"
                onClick={() => navigate("/collection")}
                className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.20em] font-medium text-[#6E6E75] hover:text-[#111113] transition-colors group cursor-pointer"
                title="Return to Collection"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <span className="w-px h-4 bg-[#EAE6DF]" />
              <Link to="/" className="inline-block" aria-label="SUKO Home">
                <img src="/logo.png" alt="SUKO" className="h-5 sm:h-6 w-auto" />
              </Link>
            </div>
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

      {/* Header: Back Navigation + Logo + Continue Shopping + SECURE CHECKOUT */}
      <header className="w-full bg-[#FAF8F5] border-b border-[#EAE6DF] sticky top-0 z-30 backdrop-blur-md bg-[#FAF8F5]/95">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/collection"))}
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.20em] font-medium text-[#6E6E75] hover:text-[#111113] transition-colors group cursor-pointer"
              title="Return to previous page"
              aria-label="Return to previous page"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <span className="w-px h-4 bg-[#EAE6DF]" />
            <Link to="/" className="inline-block" aria-label="SUKO Home">
              <img src="/logo.png" alt="SUKO" className="h-5 sm:h-6 w-auto" />
            </Link>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/collection"
              className="hidden md:inline-flex items-center text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#6E6E75] hover:text-[#111113] transition-colors"
            >
              Continue Shopping
            </Link>
            <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.24em] font-medium text-[#6E6E75]">
              <Lock size={12} className="text-[#C2922E]" strokeWidth={1.8} />
              <span>SECURE CHECKOUT</span>
            </div>
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
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-quiche text-[14px] font-light text-[#111113] leading-snug">
                            {item.name}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromOrder(item)}
                            className="text-[#888894] hover:text-[#111113] hover:bg-black/5 p-1 -mr-1 -mt-1 rounded transition-colors cursor-pointer"
                            title="Remove item & save to Wishlist"
                            aria-label={`Remove ${item.name} from order`}
                          >
                            <X size={14} strokeWidth={1.4} />
                          </button>
                        </div>
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
            {upiOrder ? (
              /* --- UPI PAYMENT STEP --- */
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => setUpiOrder(null)}
                  className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.20em] text-[#6E6E75] hover:text-[#111113] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Edit Delivery Details</span>
                </button>

                <div className="border border-[#EAE6DF] bg-[#FDFBF7] p-6 sm:p-8 space-y-6">
                  {/* Header */}
                  <div className="border-b border-[#EAE6DF] pb-4">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-[#C2922E] font-medium block mb-1">
                      ORDER #SUKO-{1000 + upiOrder.id}
                    </span>
                    <h2 className="font-quiche text-2xl sm:text-3xl font-light text-[#111113]">
                      PAY VIA UPI QR
                    </h2>
                    <p className="text-[12.5px] text-[#6E6E75] font-light mt-1">
                      Scan using PhonePe, Google Pay, Paytm or any supported UPI app.
                    </p>
                  </div>

                  {/* Server-calculated Payable Amount */}
                  <div className="flex items-center justify-between bg-white border border-[#EAE6DF] p-4 sm:p-5">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.20em] text-[#6E6E75] block font-medium">
                        Amount
                      </span>
                      <span className="text-[11px] text-[#8C887B] font-light">
                        Exact server-calculated payable total
                      </span>
                    </div>
                    <span className="font-quiche text-2xl sm:text-3xl font-normal text-[#111113]">
                      {formatINR(upiOrder.total)}
                    </span>
                  </div>

                  {/* UPI QR Code Container */}
                  <div className="text-center bg-white border border-[#EAE6DF] p-5 sm:p-6">
                    <div className="inline-block bg-[#FAF8F5] p-2 border border-[#EAE6DF]">
                      <img
                        src="/upi-qr.jpg"
                        alt="SUKO UPI QR Code"
                        className="w-[240px] sm:w-[270px] md:w-[290px] h-auto mx-auto object-contain"
                      />
                    </div>
                    <p className="text-[13px] font-medium text-[#111113] mt-4">
                      Scan and complete payment using any UPI app.
                    </p>
                    <p className="text-[11.5px] text-[#6E6E75] font-light mt-0.5">
                      PhonePe &bull; Google Pay &bull; Paytm &bull; BHIM &bull; CRED &bull; Mobile Banking
                    </p>

                    {/* Deep link & Copy UPI button */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4 pt-4 border-t border-[#EAE6DF]/70">
                      <a
                        href={upiDeepLink}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#111113] hover:bg-black text-white px-5 py-2.5 text-[10.5px] uppercase tracking-[0.20em] font-medium transition-colors cursor-pointer"
                      >
                        <span>OPEN UPI APP</span>
                        <ExternalLink size={12} className="text-[#C2922E]" />
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyUpiId}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-[#DDD8CE] hover:border-[#111113] bg-transparent text-[#111113] px-4 py-2.5 text-[10.5px] uppercase tracking-[0.18em] font-medium transition-colors cursor-pointer"
                      >
                        {copiedUpi ? (
                          <>
                            <Check size={12} className="text-emerald-600" />
                            <span className="text-emerald-700 font-medium">UPI ID Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} className="text-[#8C887B]" />
                            <span>Copy UPI ID</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-[#8C887B] mt-2 select-all">
                      UPI ID: {MERCHANT_UPI_ID}
                    </p>
                  </div>

                  {/* After Payment Form */}
                  <div className="border-t border-[#EAE6DF] pt-5 space-y-5">
                    <div>
                      <h3 className="text-[11px] uppercase tracking-[0.22em] font-medium text-[#111113]">
                        AFTER PAYMENT:
                      </h3>
                      <p className="text-[12px] text-[#6E6E75] font-light mt-0.5">
                        Both Transaction ID / UTR and payment screenshot are mandatory.
                      </p>
                    </div>

                    {/* Transaction ID / UTR */}
                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#111113] block mb-1.5 font-medium">
                        TRANSACTION ID / UTR <span className="text-[#C2922E]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value.trim().toUpperCase())}
                        placeholder="Enter 12-digit UTR or Reference Number"
                        className="w-full bg-transparent border border-[#DDD8CE] focus:border-[#C2922E] focus:outline-none px-4 py-3 text-[13px] text-[#111113] placeholder-[#A3A096] rounded-none transition-colors font-mono tracking-wider"
                      />
                    </div>

                    {/* Upload Payment Screenshot */}
                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#111113] block mb-1.5 font-medium">
                        UPLOAD PAYMENT SCREENSHOT <span className="text-[#C2922E]">*</span>
                      </label>

                      {!screenshotPreview ? (
                        <label className="border-2 border-dashed border-[#DDD8CE] hover:border-[#C2922E] bg-white p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                          <UploadCloud size={24} className="text-[#8C887B] group-hover:text-[#C2922E] transition-colors mb-2" />
                          <span className="text-[12px] font-medium text-[#111113]">Choose File / Upload Screenshot</span>
                          <span className="text-[11px] text-[#8C887B] mt-1">Allowed: JPG, JPEG, PNG, WebP &bull; Max 5 MB</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleScreenshotChange}
                            className="hidden"
                          />
                        </label>
                      ) : (
                        <div className="border border-[#EAE6DF] bg-white p-3 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={screenshotPreview}
                              alt="Payment screenshot preview"
                              className="w-14 h-14 object-cover border border-[#EAE6DF]"
                            />
                            <div>
                              <p className="text-[12px] font-medium text-[#111113] truncate max-w-[200px] sm:max-w-[280px]">
                                {screenshotFile?.name || "Payment Screenshot Selected"}
                              </p>
                              <p className="text-[10.5px] text-emerald-700 flex items-center gap-1 mt-0.5">
                                <Check size={11} /> Screenshot attached ({(screenshotFile ? (screenshotFile.size / 1024 / 1024).toFixed(2) : "1.2")} MB)
                              </p>
                            </div>
                          </div>
                          <label className="text-[10.5px] uppercase tracking-wider text-[#C2922E] hover:underline cursor-pointer">
                            Change
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              onChange={handleScreenshotChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}

                      {screenshotError && (
                        <p className="text-[11px] text-rose-600 mt-1.5 flex items-center gap-1">
                          <AlertCircle size={12} /> {screenshotError}
                        </p>
                      )}

                      {/* Supporting note */}
                      <p className="text-[11.5px] text-[#6E6E75] font-light mt-2 italic leading-relaxed">
                        &ldquo;Please upload a clear payment screenshot showing the successful payment status, paid amount, and Transaction ID / UTR.&rdquo;
                      </p>
                    </div>

                    {/* Checklist */}
                    <div className="bg-[#FAF8F5] border border-[#EAE6DF] p-3.5 text-xs text-[#6E6E75] space-y-1 font-light">
                      <p className="font-medium text-[#111113] text-[10.5px] uppercase tracking-wider">
                        Make sure the screenshot clearly shows:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                        <div className="flex items-center gap-1.5 text-[#111113]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" />
                          <span>Successful payment status</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#111113]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" />
                          <span>Transaction ID / UTR</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#111113]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" />
                          <span>Paid amount ({formatINR(upiOrder.total)})</span>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="button"
                      onClick={handleSubmitPaymentProof}
                      disabled={!transactionId.trim() || !screenshotPreview || isSubmittingProof}
                      className="w-full bg-[#111113] hover:bg-black text-white py-4 px-8 text-[12px] uppercase tracking-[0.24em] font-medium flex items-center justify-center gap-3 transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed rounded-none"
                    >
                      {isSubmittingProof ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-[#C2922E]" />
                          <span>Submitting for Verification...</span>
                        </>
                      ) : (
                        <>
                          <span>SUBMIT PAYMENT FOR VERIFICATION</span>
                          <span>&rarr;</span>
                        </>
                      )}
                    </button>

                    {/* Form note below */}
                    <p className="text-[11.5px] text-[#6E6E75] text-center font-medium mt-2">
                      Your order will be confirmed after payment verification.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="mb-8 sm:mb-10">
                  <button
                    type="button"
                    onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/collection"))}
                    className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-[#6E6E75] hover:text-[#111113] transition-colors group mb-3.5 cursor-pointer font-medium"
                  >
                    <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Return to Shopping Bag</span>
                  </button>
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
                          to="/auth?redirect=/checkout&mode=register"
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
                          Mobile Phone (for delivery concierge)
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

                    {/* Saved Addresses Selector (for returning authenticated clients) */}
                    {addresses.length > 0 && (
                      <div className="mb-6 space-y-2.5">
                        <span className="text-[10.5px] uppercase tracking-[0.16em] text-[#6E6E75] block">
                          Select from Saved Addresses:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {addresses.map((addr) => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => selectSavedAddress(addr)}
                              className={`p-3.5 text-left border transition-all cursor-pointer ${
                                selectedAddrId === addr.id
                                  ? "border-[#111113] bg-[#FDFBF7]"
                                  : "border-[#EAE6DF] hover:border-[#DDD8CE] bg-white"
                              }`}
                            >
                              <p className="text-[12px] font-medium text-[#111113]">{addr.line1}</p>
                              <p className="text-[11px] text-[#6E6E75]">
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                              {addr.is_default && (
                                <span className="inline-block mt-1 text-[9.5px] uppercase tracking-wider text-[#C2922E] font-medium">
                                  Default
                                </span>
                              )}
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
                            placeholder="Aarav"
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
                            placeholder="Mehta"
                            className="w-full bg-transparent border border-[#DDD8CE] focus:border-[#C2922E] focus:outline-none px-4 py-3 text-[13.5px] text-[#111113] placeholder-[#A3A096] rounded-none transition-colors font-sans"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#6E6E75] block mb-1.5 font-sans">
                          Address (House / Flat / Street)
                        </label>
                        <input
                          type="text"
                          required
                          value={form.address}
                          onChange={upd("address")}
                          placeholder="Penthouse 4B, Pali Hill"
                          className="w-full bg-transparent border border-[#DDD8CE] focus:border-[#C2922E] focus:outline-none px-4 py-3 text-[13.5px] text-[#111113] placeholder-[#A3A096] rounded-none transition-colors font-sans"
                        />
                      </div>

                      <div>
                        <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#6E6E75] block mb-1.5 font-sans">
                          Apartment, suite, landmark (optional)
                        </label>
                        <input
                          type="text"
                          value={form.apartment}
                          onChange={upd("apartment")}
                          placeholder="Near Nargis Dutt Road"
                          className="w-full bg-transparent border border-[#DDD8CE] focus:border-[#C2922E] focus:outline-none px-4 py-3 text-[13.5px] text-[#111113] placeholder-[#A3A096] rounded-none transition-colors font-sans"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#6E6E75] block mb-1.5 font-sans">
                            City
                          </label>
                          <input
                            type="text"
                            required
                            value={form.city}
                            onChange={upd("city")}
                            placeholder="Mumbai"
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
                            placeholder="Maharashtra"
                            className="w-full bg-transparent border border-[#DDD8CE] focus:border-[#C2922E] focus:outline-none px-4 py-3 text-[13.5px] text-[#111113] placeholder-[#A3A096] rounded-none transition-colors font-sans"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] uppercase tracking-[0.18em] text-[#6E6E75] block mb-1.5 font-sans">
                            PIN Code
                          </label>
                          <input
                            type="text"
                            required
                            value={form.pincode}
                            onChange={upd("pincode")}
                            placeholder="400050"
                            className="w-full bg-transparent border border-[#DDD8CE] focus:border-[#C2922E] focus:outline-none px-4 py-3 text-[13.5px] text-[#111113] placeholder-[#A3A096] rounded-none transition-colors font-sans"
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
                            Pay via UPI QR
                          </span>
                        </div>
                        <Lock size={13} className="text-[#C2922E]" />
                      </div>
                      <p className="text-[12px] text-[#6E6E75] font-light leading-relaxed">
                        Scan using PhonePe, Google Pay, Paytm or any supported UPI app.
                      </p>
                    </div>

                    {/* Primary CTA Button */}
                    <button
                      type="submit"
                      disabled={isInitializingPayment}
                      className="w-full mt-8 bg-[#111113] hover:bg-black text-white py-4 px-8 text-[12px] uppercase tracking-[0.24em] font-medium flex items-center justify-center gap-3 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-none"
                    >
                      {isInitializingPayment ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-[#C2922E]" />
                          <span>Generating Payment Session...</span>
                        </>
                      ) : (
                        <>
                          <span>PROCEED TO PAYMENT &middot; {formatINR(total)}</span>
                          <span>&rarr;</span>
                        </>
                      )}
                    </button>
                  </section>

                </form>
              </div>
            )}
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
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-quiche text-[15px] font-light text-[#111113] leading-snug">
                              {item.name}
                            </h3>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromOrder(item)}
                              className="text-[#888894] hover:text-[#111113] hover:bg-black/5 p-1 -mr-1 -mt-0.5 rounded transition-colors cursor-pointer"
                              title="Remove item & save to Wishlist"
                              aria-label={`Remove ${item.name} from order`}
                            >
                              <X size={14} strokeWidth={1.4} />
                            </button>
                          </div>
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
