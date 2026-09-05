import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Loader2, ArrowLeft, Sparkles, Mail, Lock, ShieldCheck, 
  X, Eye, EyeOff, MessageCircle, CheckCircle2, RotateCw, Edit3, KeyRound
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { WHATSAPP_NUMBER } from "../data/products";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\s\-()]{7,20}$/;

const Auth = () => {
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "/";
  const modeParam = searchParams.get("mode");

  const [authMode, setAuthMode] = useState(() => (modeParam === "register" ? "register" : "password")); // 'password' | 'register'
  
  // Registration Multi-Step State: 1 = Details, 2 = Verify OTP, 3 = Password & Confirm
  const [registerStep, setRegisterStep] = useState(1);

  // Form Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification States
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Concierge Password Assistance Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user, login, register, sendRegisterOtp, verifyRegisterOtp } = useAuth();
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

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Clear inputs when switching mode
  const handleModeSwitch = (newMode) => {
    setAuthMode(newMode);
    setRegisterStep(1);
    setOtp("");
    setVerificationToken("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

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

  // =========================================================================
  // STEP 1: SEND REGISTER OTP
  // =========================================================================
  const handleSendOtp = async (isResend = false) => {
    if (!name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!phone.trim() || !PHONE_REGEX.test(phone.trim())) {
      toast.error("Please provide a valid contact phone number.");
      return;
    }
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendRegisterOtp(name, phone, email);
      if (res?.success) {
        setResendCooldown(res.resendCooldown || 30);
        if (isResend) {
          toast.success("New verification code dispatched to your email.");
        } else {
          toast.success(`Verification code sent to ${email.trim()}.`);
          setRegisterStep(2);
        }
      }
    } catch (err) {
      toast.error(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // STEP 2: VERIFY REGISTER OTP
  // =========================================================================
  const handleVerifyOtp = async (e) => {
    e?.preventDefault?.();
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyRegisterOtp(email, cleanOtp);
      if (res?.success && res.verificationToken) {
        setVerificationToken(res.verificationToken);
        toast.success("Email verified successfully! Please set your password.");
        setRegisterStep(3);
      }
    } catch (err) {
      toast.error(err.message || "Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // STEP 3: COMPLETE REGISTRATION (CREATE & CONFIRM PASSWORD)
  // =========================================================================
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    if (!validatePasswordBytes(password)) {
      toast.error("Password must be between 8 and 72 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match. Please re-check.");
      return;
    }
    if (!verificationToken) {
      toast.error("Email verification is required. Please verify your email first.");
      setRegisterStep(2);
      return;
    }

    setIsLoading(true);
    try {
      await register(name, phone, email, password, verificationToken);
      // Redirection handled by useEffect once user state updates
    } catch (err) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // SIGN IN SUBMISSION
  // =========================================================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      toast.error(err.message || "Sign in failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
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
      <div className="max-w-[460px] w-full bg-[#FAF8F5] border border-[#E8E4DC] p-7 sm:p-10 relative shadow-[0_12px_40px_rgba(0,0,0,0.04)] transition-all duration-300 z-10">
        
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
                  {authMode === "register" && registerStep === 1 ? "Sending Authorization Code..." : 
                   authMode === "register" && registerStep === 2 ? "Verifying Authorization Code..." :
                   authMode === "register" && registerStep === 3 ? "Creating Atelier Account..." :
                   "Authenticating..."}
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
          onClick={() => {
            if (authMode === "register" && registerStep > 1) {
              setRegisterStep(registerStep - 1);
            } else {
              navigate(-1);
            }
          }}
          disabled={isLoading}
          className="text-[10px] uppercase tracking-[0.24em] font-medium text-[#777782] hover:text-[#C2922E] transition-colors flex items-center gap-2 mb-6 disabled:opacity-50 cursor-pointer"
        >
          <ArrowLeft className="w-3 h-3" /> {authMode === "register" && registerStep > 1 ? "Previous Step" : "Back"}
        </button>

        {/* Eyebrow & Title */}
        <span className="text-[9.5px] uppercase tracking-[0.26em] text-[#C2922E] font-medium block mb-1">
          — {authMode === "register" ? "Client Atelier Registration" : "Client Sign In"}
        </span>
        <h1 className="font-quiche text-3xl sm:text-4xl font-light text-[#111113] tracking-tight mb-4">
          {authMode === "register" 
            ? registerStep === 1 ? "Create Account" : registerStep === 2 ? "Verify Email" : "Set Password"
            : "Welcome Back"}
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
        <div className="flex border border-[#E8E4DC] mb-6 p-1 bg-[#F3EFE6]/70 text-[10.5px] uppercase tracking-[0.18em] font-medium">
          <button
            type="button"
            onClick={() => handleModeSwitch("password")}
            className={`flex-1 py-2 text-center transition-all cursor-pointer ${
              authMode === "password"
                ? "bg-[#FAF8F5] text-[#111113] shadow-sm font-semibold"
                : "text-[#777782] hover:text-[#111113]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("register")}
            className={`flex-1 py-2 text-center transition-all cursor-pointer ${
              authMode === "register"
                ? "bg-[#FAF8F5] text-[#111113] shadow-sm font-semibold"
                : "text-[#777782] hover:text-[#111113]"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 3-STEP REGISTRATION STEP INDICATOR                                        */}
        {/* ========================================================================= */}
        {authMode === "register" && (
          <div className="mb-6 flex items-center justify-between border-b border-[#EAE6DF] pb-3 text-center">
            <div className={`flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.16em] font-mono transition-colors ${
              registerStep === 1 ? "text-[#C2922E] font-bold" : registerStep > 1 ? "text-[#111113] font-medium" : "text-[#A3A096]"
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                registerStep >= 1 ? "bg-[#111113] text-white" : "bg-[#DDD8CE] text-[#777782]"
              }`}>1</span>
              <span>Details</span>
            </div>

            <div className="w-6 h-[1px] bg-[#EAE6DF]" />

            <div className={`flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.16em] font-mono transition-colors ${
              registerStep === 2 ? "text-[#C2922E] font-bold" : registerStep > 2 ? "text-[#111113] font-medium" : "text-[#A3A096]"
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                registerStep >= 2 ? "bg-[#111113] text-white" : "bg-[#DDD8CE] text-[#777782]"
              }`}>2</span>
              <span>Verify OTP</span>
            </div>

            <div className="w-6 h-[1px] bg-[#EAE6DF]" />

            <div className={`flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.16em] font-mono transition-colors ${
              registerStep === 3 ? "text-[#C2922E] font-bold" : "text-[#A3A096]"
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                registerStep === 3 ? "bg-[#111113] text-white" : "bg-[#DDD8CE] text-[#777782]"
              }`}>3</span>
              <span>Password</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CREATE ACCOUNT: STEP 1 (NAME, PHONE, EMAIL)                               */}
        {/* ========================================================================= */}
        {authMode === "register" && registerStep === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); handleSendOtp(false); }} className="space-y-5 font-body">
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
                Phone Number (For Delivery Updates) *
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
                Email Address (Verification Code Destination) *
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#111113] text-white py-4 text-[11px] uppercase tracking-[0.26em] font-medium hover:bg-[#C2922E] transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-75 shadow-sm cursor-pointer mt-2"
            >
              <span>Send Verification Code</span>
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* CREATE ACCOUNT: STEP 2 (OTP VERIFICATION + RESEND WITH TIMER)             */}
        {/* ========================================================================= */}
        {authMode === "register" && registerStep === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 font-body">
            <div className="bg-[#F5F2EB] p-3.5 border border-[#EAE6DF] rounded-xs text-left">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[9.5px] uppercase tracking-[0.20em] text-[#C2922E] font-medium">
                  VERIFICATION CODE SENT
                </span>
                <button
                  type="button"
                  onClick={() => setRegisterStep(1)}
                  className="text-[10px] text-[#111113] hover:text-[#C2922E] underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Edit3 size={11} /> Edit Email
                </button>
              </div>
              <p className="text-xs text-[#111113] font-medium truncate font-mono">
                {email}
              </p>
              <p className="text-[11px] text-[#6E6E75] font-light mt-1">
                Please check your inbox or spam folder for the 6-digit authorization code.
              </p>
            </div>

            {/* 6-Digit OTP Input */}
            <div>
              <label className="text-[10px] uppercase tracking-[0.22em] text-[#777782] block mb-2 font-medium text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                autoFocus
                disabled={isLoading}
                className="w-full bg-white border border-[#DDD8CE] focus:border-[#C2922E] !text-[#111113] font-mono font-bold tracking-[0.45em] text-center text-2xl py-3 rounded-xs outline-none transition-colors shadow-xs"
                required
              />
            </div>

            {/* Resend OTP Row with Live Countdown Timer */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#EAE6DF]">
              <span className="text-[11px] text-[#6E6E75]">Didn't receive code?</span>
              {resendCooldown > 0 ? (
                <span className="text-[10.5px] font-mono text-[#8C887B] flex items-center gap-1">
                  <RotateCw size={11} className="animate-spin text-[#C2922E]" />
                  Resend in <span className="font-bold text-[#111113]">{resendCooldown}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp(true)}
                  disabled={isLoading}
                  className="text-[10.5px] uppercase tracking-[0.16em] font-medium text-[#C2922E] hover:underline cursor-pointer disabled:opacity-50"
                >
                  Resend Code
                </button>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={isLoading || otp.trim().length !== 6}
                className="w-full bg-[#111113] text-white py-4 text-[11px] uppercase tracking-[0.26em] font-medium hover:bg-[#C2922E] transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-50 shadow-sm cursor-pointer"
              >
                <span>Verify &amp; Proceed</span>
              </button>

              <button
                type="button"
                onClick={() => setRegisterStep(1)}
                disabled={isLoading}
                className="w-full text-center py-2.5 text-[10px] uppercase tracking-[0.20em] text-[#777782] hover:text-[#111113] transition-colors"
              >
                Back to Details
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* CREATE ACCOUNT: STEP 3 (CREATE PASSWORD & CONFIRM PASSWORD)               */}
        {/* ========================================================================= */}
        {authMode === "register" && registerStep === 3 && (
          <form onSubmit={handleCompleteRegistration} className="space-y-5 font-body">
            {/* Verified Email Banner */}
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xs">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-medium">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                <span className="truncate max-w-[240px] font-mono">{email}</span>
              </div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                Verified
              </span>
            </div>

            {/* Create Password */}
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#777782] hover:text-[#111113] p-1 transition-colors cursor-pointer"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-[10px] uppercase tracking-[0.18em] text-[#777782] block mb-1 font-medium">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="w-full bg-transparent border-b border-[#D8D4CC] focus:border-[#C2922E] !text-[#111113] font-medium outline-none py-2 text-sm placeholder:text-[#9999A4] disabled:opacity-50 transition-colors pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#777782] hover:text-[#111113] p-1 transition-colors cursor-pointer"
                  title={showConfirmPassword ? "Hide Password" : "Show Password"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              {/* Match Feedback Indicator */}
              {confirmPassword && (
                <div className="text-[10.5px] mt-1.5 flex items-center gap-1 font-medium">
                  {password === confirmPassword ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Passwords match perfectly
                    </span>
                  ) : (
                    <span className="text-rose-600">
                      ✗ Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || password !== confirmPassword}
              className="w-full bg-[#111113] text-white py-4 text-[11px] uppercase tracking-[0.26em] font-medium hover:bg-[#C2922E] transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-50 shadow-sm cursor-pointer mt-3"
            >
              <span>
                {isCheckoutFlow
                  ? "Activate Account & Proceed to Payment"
                  : "Complete Atelier Registration"}
              </span>
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* SIGN IN VIEW                                                              */}
        {/* ========================================================================= */}
        {authMode === "password" && (
          <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-5 font-body">
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#777782] hover:text-[#111113] p-1 transition-colors cursor-pointer"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[10px] uppercase tracking-[0.18em] text-[#777782] hover:text-[#C2922E] transition-colors font-medium cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#111113] text-white py-4 text-[11px] uppercase tracking-[0.26em] font-medium hover:bg-[#C2922E] transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-75 shadow-sm cursor-pointer"
            >
              <span>{isCheckoutFlow ? "Sign In & Proceed to Payment" : "Sign In"}</span>
            </button>
          </form>
        )}

        {/* Guest / Return Navigation */}
        <div className="mt-4">
          {isCheckoutFlow ? (
            <button
              type="button"
              onClick={() => navigate("/collection")}
              disabled={isLoading}
              className="w-full border border-[#D8D4CC] text-[#777782] py-3 text-[10.5px] uppercase tracking-[0.22em] font-medium hover:text-[#111113] hover:border-[#111113] hover:bg-black/5 transition-all disabled:opacity-50 cursor-pointer"
            >
              Continue Browsing Collection
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/")}
              disabled={isLoading}
              className="w-full border border-[#D8D4CC] text-[#111113] py-3.5 text-[11px] uppercase tracking-[0.24em] font-medium hover:border-[#111113] hover:bg-black/5 transition-all disabled:opacity-50 cursor-pointer"
            >
              Continue as Guest
            </button>
          )}
        </div>

        {/* Switch Mode Prompt */}
        <p className="text-[11px] uppercase tracking-[0.18em] font-body text-center mt-7 text-[#777782]">
          {authMode === "register" ? "Already have an account? " : "New to SUKO? "}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              handleModeSwitch(authMode === "register" ? "password" : "register");
            }}
            className="text-[#111113] hover:text-[#C2922E] ml-1 font-bold disabled:opacity-50 transition-colors underline cursor-pointer"
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
                className="absolute top-4 right-4 text-[#777782] hover:text-[#111113] p-1 transition-colors cursor-pointer"
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
                className="text-[10px] uppercase tracking-[0.18em] text-[#777782] hover:text-[#111113] block mx-auto mt-5 transition-colors cursor-pointer"
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
