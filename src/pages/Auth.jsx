import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2, ArrowLeft, Sparkles, Mail, Lock, ShieldCheck, X, Eye, EyeOff, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { WHATSAPP_NUMBER } from "../data/products";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "/";
  const modeParam = searchParams.get("mode");

  const [authMode, setAuthMode] = useState(() => (modeParam === "register" ? "register" : "password")); // 'password' | 'register'
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Concierge Password Assistance Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  // Helper for UTF-8 byte length validation matching backend bcrypt rule
  const validatePasswordBytes = (pwd) => {
    if (!pwd) return false;
    const len = new TextEncoder().encode(pwd).length;
    return len >= 8 && len <= 72;
  };

  // Sync mode with URL param
  useEffect(() => {
    if (modeParam === "register") {
      setAuthMode("register");
    } else if (modeParam === "login") {
      setAuthMode("password");
    }
  }, [modeParam]);

  // Clear inputs when switching mode
  useEffect(() => {
    setName("");
    setPhone("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
  }, [authMode]);

  // Redirect upon authentication
  useEffect(() => {
    if (user?.authenticated) {
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate(redirectParam);
      }
    }
  }, [user, navigate, redirectParam]);

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (authMode === "register") {
      if (!name.trim()) {
        toast.error("Please enter your full name.");
        return;
      }
      if (!phone.trim()) {
        toast.error("Please provide a contact phone number for delivery updates.");
        return;
      }
      if (!email.trim()) {
        toast.error("Please enter your email address.");
        return;
      }
      if (!validatePasswordBytes(password)) {
        toast.error("Password must be between 8 and 72 characters.");
        return;
      }

      setIsLoading(true);
      try {
        const ok = await register(name, phone, email, password);
        if (ok) {
          // AuthContext sets user and token; useEffect handles redirection
        }
      } catch (err) {
        toast.error(err.message || "Registration failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!email.trim() || !password) {
        toast.error("Please enter both email and password.");
        return;
      }

      setIsLoading(true);
      try {
        const ok = await login(email, password);
        if (ok) {
          // AuthContext sets user and token; useEffect handles redirection
        }
      } catch (err) {
        toast.error(err.message || "Sign in failed. Please check your credentials.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isCheckoutFlow = redirectParam.includes("checkout");

  return (
    <div
      data-testid="auth-page"
      className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white min-h-screen flex items-center justify-center relative overflow-hidden pt-28 sm:pt-36 pb-24 sm:pb-32 transition-colors duration-300 px-4 sm:px-6"
    >
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#C2922E]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Luxury Auth Card */}
      <div className="max-w-[440px] w-full bg-[#FAF8F5] border border-[#E8E4DC] p-7 sm:p-10 relative shadow-[0_12px_40px_rgba(0,0,0,0.04)] transition-all duration-300 z-10">
        
        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#FAF8F5]/90 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center space-y-4"
            >
              <div className="relative flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="w-16 h-16 rounded-full border-2 border-transparent border-t-[#111113] border-r-[#C2922E]"
                />
                <motion.div
                  animate={{ scale: [0.8, 1.1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="absolute"
                >
                  <Sparkles className="w-5 h-5 text-[#C2922E]" />
                </motion.div>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.3em] font-body text-[#111113] font-medium animate-pulse">
                  Authenticating...
                </p>
                <p className="text-[10px] text-[#777782] uppercase tracking-[0.18em] font-body">
                  Securing SUKO Client Session
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back Link */}
        <button
          onClick={() => navigate(-1)}
          disabled={isLoading}
          className="text-[10px] uppercase tracking-[0.24em] font-medium text-[#777782] hover:text-[#C2922E] transition-colors flex items-center gap-2 mb-6 disabled:opacity-50"
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </button>

        {/* Eyebrow & Title */}
        <span className="text-[9.5px] uppercase tracking-[0.26em] text-[#C2922E] font-medium block mb-1">
          — {authMode === "register" ? "Client Registration" : "Client Sign In"}
        </span>
        <h1 className="font-quiche text-3xl sm:text-4xl font-light text-[#111113] tracking-tight mb-4">
          {authMode === "register" ? "Create Account" : "Welcome Back"}
        </h1>

        {/* Informative Checkout Prompt Banner */}
        {isCheckoutFlow && (
          <div className="mb-6 p-4 bg-[#F4EFE6] border border-[#C2922E]/30 text-left">
            <div className="flex items-center gap-2 text-[#C2922E] text-[10px] uppercase tracking-[0.22em] font-medium mb-1">
              <ShieldCheck size={14} />
              <span>Account Required for Checkout</span>
            </div>
            <p className="text-xs text-[#555560] font-light leading-relaxed">
              {authMode === "register"
                ? "Create your SUKO account below to secure your tailored garments and complete your payment."
                : "Sign in with your SUKO credentials to proceed with your payment and order."}
            </p>
          </div>
        )}

        {/* Mode Toggle Tabs (Sign In vs Create Account) */}
        <div className="flex border border-[#E8E4DC] mb-7 p-1 bg-[#F3EFE6]/70 text-[10.5px] uppercase tracking-[0.18em] font-medium">
          <button
            type="button"
            onClick={() => setAuthMode("password")}
            className={`flex-1 py-2 text-center transition-all ${
              authMode === "password"
                ? "bg-[#FAF8F5] text-[#111113] shadow-sm font-semibold"
                : "text-[#777782] hover:text-[#111113]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("register")}
            className={`flex-1 py-2 text-center transition-all ${
              authMode === "register"
                ? "bg-[#FAF8F5] text-[#111113] shadow-sm font-semibold"
                : "text-[#777782] hover:text-[#111113]"
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5 font-body">
          {/* Registration Fields */}
          {authMode === "register" && (
            <>
              <div>
                <label className="text-[10px] uppercase tracking-[0.18em] text-[#777782] block mb-1 font-medium">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elena Vance"
                  disabled={isLoading}
                  autoComplete="name"
                  className="w-full bg-transparent border-b border-[#D8D4CC] focus:border-[#C2922E] !text-[#111113] font-medium outline-none py-2 text-sm placeholder:text-[#9999A4] disabled:opacity-50 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.18em] text-[#777782] block mb-1 font-medium">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  disabled={isLoading}
                  autoComplete="tel"
                  className="w-full bg-transparent border-b border-[#D8D4CC] focus:border-[#C2922E] !text-[#111113] font-medium outline-none py-2 text-sm placeholder:text-[#9999A4] disabled:opacity-50 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.18em] text-[#777782] block mb-1 font-medium">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  disabled={isLoading}
                  autoComplete="email"
                  className="w-full bg-transparent border-b border-[#D8D4CC] focus:border-[#C2922E] !text-[#111113] font-medium outline-none py-2 text-sm placeholder:text-[#9999A4] disabled:opacity-50 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.18em] text-[#777782] block mb-1 font-medium">
                  Create Password (min. 8 characters) *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    autoComplete="new-password"
                    className="w-full bg-transparent border-b border-[#D8D4CC] focus:border-[#C2922E] !text-[#111113] font-medium outline-none py-2 text-sm placeholder:text-[#9999A4] disabled:opacity-50 transition-colors pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#777782] hover:text-[#111113] p-1 transition-colors"
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Standard Login Fields */}
          {authMode === "password" && (
            <>
              <div>
                <label className="text-[10px] uppercase tracking-[0.18em] text-[#777782] block mb-1 font-medium">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  disabled={isLoading}
                  autoComplete="email"
                  className="w-full bg-transparent border-b border-[#D8D4CC] focus:border-[#C2922E] !text-[#111113] font-medium outline-none py-2 text-sm placeholder:text-[#9999A4] disabled:opacity-50 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.18em] text-[#777782] block mb-1 font-medium">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="w-full bg-transparent border-b border-[#D8D4CC] focus:border-[#C2922E] !text-[#111113] font-medium outline-none py-2 text-sm placeholder:text-[#9999A4] disabled:opacity-50 transition-colors pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#777782] hover:text-[#111113] p-1 transition-colors"
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="text-right mt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[10px] uppercase tracking-[0.18em] text-[#777782] hover:text-[#C2922E] transition-colors font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#111113] text-white py-4 text-[11px] uppercase tracking-[0.26em] font-medium hover:bg-[#C2922E] transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-75 shadow-sm cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Processing...</span>
              </>
            ) : (
              <span>
                {authMode === "register"
                  ? isCheckoutFlow
                    ? "Create Account & Proceed to Payment"
                    : "Create Account"
                  : isCheckoutFlow
                  ? "Sign In & Proceed to Payment"
                  : "Sign In"}
              </span>
            )}
          </button>

          {/* Guest / Return Navigation */}
          {isCheckoutFlow ? (
            <button
              type="button"
              onClick={() => navigate("/collection")}
              disabled={isLoading}
              className="w-full border border-[#D8D4CC] text-[#777782] py-3 text-[10.5px] uppercase tracking-[0.22em] font-medium hover:text-[#111113] hover:border-[#111113] hover:bg-black/5 transition-all mt-2 disabled:opacity-50"
            >
              Continue Browsing Collection
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/")}
              disabled={isLoading}
              className="w-full border border-[#D8D4CC] text-[#111113] py-3.5 text-[11px] uppercase tracking-[0.24em] font-medium hover:border-[#111113] hover:bg-black/5 transition-all mt-2 disabled:opacity-50"
            >
              Continue as Guest
            </button>
          )}
        </form>

        {/* Switch Mode Prompt */}
        <p className="text-[11px] uppercase tracking-[0.18em] font-body text-center mt-7 text-[#777782]">
          {authMode === "register" ? "Already have an account? " : "New to SUKO? "}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setAuthMode(authMode === "register" ? "password" : "register");
            }}
            className="text-[#111113] hover:text-[#C2922E] ml-1 font-bold disabled:opacity-50 transition-colors underline"
          >
            {authMode === "register" ? "Sign In" : "Create Account"}
          </button>
        </p>
      </div>

      {/* CONCIERGE PASSWORD ASSISTANCE MODAL */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FAF8F5] border border-[#E8E4DC] max-w-md w-full p-7 sm:p-9 shadow-2xl relative font-body text-[#121215]"
            >
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-[#777782] hover:text-[#111113] p-1 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="mb-6">
                <span className="text-[9.5px] uppercase tracking-[0.26em] text-[#C2922E] block mb-1 font-medium">
                  — ATELIER CLIENT CARE
                </span>
                <h2 className="font-quiche text-2xl font-light text-[#111113]">Account Assistance</h2>
                <p className="text-xs text-[#555560] mt-2 font-light leading-relaxed">
                  For your security and bespoke privacy, password credentials and account recoveries are managed with personalized concierge care.
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello SUKO Atelier, I need assistance recovering my account password.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#111113] text-white py-3.5 px-4 text-[11px] uppercase tracking-[0.24em] font-medium hover:bg-[#C2922E] transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle size={15} />
                  <span>Contact WhatsApp Concierge</span>
                </a>

                <a
                  href="mailto:support@indiancorporatewear.com?subject=SUKO%20Password%20Assistance"
                  className="w-full border border-[#D8D4CC] text-[#111113] py-3.5 px-4 text-[11px] uppercase tracking-[0.24em] font-medium hover:border-[#111113] hover:bg-black/5 transition-all flex items-center justify-center gap-2"
                >
                  <Mail size={15} />
                  <span>Email Atelier Support</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-[10px] uppercase tracking-[0.18em] text-[#777782] hover:text-[#111113] block mx-auto mt-5 transition-colors"
              >
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;
