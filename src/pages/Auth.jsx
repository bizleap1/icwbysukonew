import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2, ArrowLeft, Sparkles, KeyRound, Mail, Lock, ShieldCheck, X, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { API_BASE_URL } from "../config/api";

const Auth = () => {
  const [authMode, setAuthMode] = useState("password"); // 'password', 'otp', 'register'
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP States for Passwordless Login
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // OTP States for Registration Verification
  const [regOtpCode, setRegOtpCode] = useState("");
  const [regOtpSent, setRegOtpSent] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP + New Password

  const [isLoading, setIsLoading] = useState(false);
  
  const { user, login, register, loginWithToken } = useAuth();
  const navigate = useNavigate();

  // Clear all form inputs on mount & mode change
  useEffect(() => {
    setName("");
    setPhone("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setOtpCode("");
    setRegOtpCode("");
    setOtpSent(false);
    setRegOtpSent(false);
  }, [authMode]);

  useEffect(() => {
    if (user?.authenticated) {
      if (user.role === 'admin') navigate("/admin");
      else navigate("/");
    }
  }, [user, navigate]);

  // Handle Standard Password Login / Register (with OTP) / OTP Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (authMode === "register") {
        if (!regOtpSent) {
          if (!password || password.length < 4) {
            throw new Error("Password must be at least 4 characters long");
          }
          // Step 1: Send Registration OTP
          const res = await fetch(`${API_BASE_URL}/api/auth/send-register-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, phone, email, password })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to send registration OTP");
          toast.success(`6-digit verification OTP sent to ${email}! Check your Gmail inbox.`);
          setRegOtpSent(true);
        } else {
          // Step 2: Verify Registration OTP
          const res = await fetch(`${API_BASE_URL}/api/auth/verify-register-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp: regOtpCode })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Invalid OTP code");

          loginWithToken(data.token);
          toast.success(`Welcome to Suko Atelier, ${data.user.name}! Account verified & created.`);
        }
      } else if (authMode === "password") {
        await login(email, password);
      } else if (authMode === "otp") {
        if (!otpSent) {
          // Request Login OTP
          const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), purpose: "Login Passcode" })
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Unable to send OTP. Please check your email or create an account.");
          }
          toast.success(`6-digit OTP passcode sent to ${email}! Check your inbox/spam folder.`);
          setOtpSent(true);
        } else {
          // Verify Login OTP
          const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), otp: otpCode.trim() })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Invalid OTP code");

          loginWithToken(data.token);
          toast.success(`Welcome back, ${data.user?.name || "Client"}!`);
        }
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password: Request OTP
  const handleForgotRequestOTP = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return toast.error("Please enter your registered email");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, purpose: "Password Reset" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset code");
      toast.success(`Password reset OTP sent to ${forgotEmail}`);
      setForgotStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password: Reset Password with OTP
  const handleForgotResetSubmit = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim() || !forgotNewPassword.trim()) {
      return toast.error("OTP and New Password are required");
    }
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          otp: forgotOtp,
          newPassword: forgotNewPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      loginWithToken(data.token);
      setShowForgotModal(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
                  Securing ICW Client Session
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
          — {authMode === "register" ? "Create Account" : authMode === "otp" ? "Passwordless OTP" : "Client Sign In"}
        </span>
        <h1 className="font-quiche text-3xl sm:text-4xl font-light text-[#111113] tracking-tight mb-6">
          {authMode === "register" ? "Join ICW Atelier" : authMode === "otp" ? "Instant Access" : "Welcome Back"}
        </h1>

        {/* Login Mode Toggle Tabs */}
        {authMode !== "register" && (
          <div className="flex border border-[#E8E4DC] mb-7 p-1 bg-[#F3EFE6]/70 text-[10.5px] uppercase tracking-[0.18em] font-medium">
            <button
              type="button"
              onClick={() => { setAuthMode("password"); setOtpSent(false); }}
              className={`flex-1 py-2 text-center transition-all ${
                authMode === "password" 
                  ? "bg-[#FAF8F5] text-[#111113] shadow-sm font-semibold" 
                  : "text-[#777782] hover:text-[#111113]"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("otp"); setOtpSent(false); }}
              className={`flex-1 py-2 text-center transition-all flex items-center justify-center gap-1.5 ${
                authMode === "otp" 
                  ? "bg-[#FAF8F5] text-[#111113] shadow-sm font-semibold" 
                  : "text-[#777782] hover:text-[#111113]"
              }`}
            >
              <KeyRound size={12} /> Instant OTP
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5 font-body">
          {/* Registration Form Step 1 */}
          {authMode === "register" && !regOtpSent && (
            <>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name (e.g. Elena Vance)"
                disabled={isLoading}
                autoComplete="new-password"
                className="w-full bg-transparent border-b border-[#D8D4CC] focus:border-[#C2922E] text-[#111113] outline-none py-2.5 text-sm placeholder:text-[#9999A4] disabled:opacity-50 transition-colors"
                required
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number (e.g. +91 98765 43210)"
                disabled={isLoading}
                autoComplete="new-password"
                className="w-full bg-transparent border-b border-[#D8D4CC] focus:border-[#C2922E] text-[#111113] outline-none py-2.5 text-sm placeholder:text-[#9999A4] disabled:opacity-50 transition-colors"
                required
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                disabled={isLoading}
                autoComplete="new-password"
                className="w-full bg-transparent border-b border-[#D8D4CC] focus:border-[#C2922E] text-[#111113] outline-none py-2.5 text-sm placeholder:text-[#9999A4] disabled:opacity-50 transition-colors"
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create Password *"
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="w-full bg-transparent border-b border-[#D8D4CC] focus:border-[#C2922E] text-[#111113] outline-none py-2.5 text-sm placeholder:text-[#9999A4] disabled:opacity-50 transition-colors pr-10"
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
            </>
          )}

          {/* Registration Form Step 2 (OTP Verification) */}
          {authMode === "register" && regOtpSent && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-[#F3EFE6] border border-[#E8E4DC] p-3 text-xs text-[#555560]">
                <span>Verification code sent to </span>
                <strong className="text-[#C2922E] font-mono block mt-1">{email}</strong>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-[#C2922E] block mb-2 font-mono">
                  Enter 6-Digit Email OTP *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={regOtpCode}
                  onChange={(e) => setRegOtpCode(e.target.value)}
                  placeholder="e.g. 583921"
                  disabled={isLoading}
                  autoComplete="off"
                  className="w-full bg-transparent border-b border-[#C2922E] text-[#111113] outline-none py-2 text-xl font-mono tracking-[0.4em] text-center placeholder:text-[#C2922E]/40 font-bold"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setRegOtpSent(false)}
                className="text-[10px] uppercase tracking-[0.18em] text-[#777782] hover:text-[#C2922E] mt-2 block mx-auto transition-colors"
              >
                Change Details / Resend Code
              </button>
            </motion.div>
          )}

          {/* Standard Login Fields */}
          {authMode === "password" && (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                disabled={isLoading}
                autoComplete="off"
                className="w-full bg-transparent border-b border-[#D8D4CC] focus:border-[#C2922E] text-[#111113] outline-none py-2.5 text-sm placeholder:text-[#9999A4] disabled:opacity-50 transition-colors"
                required
              />
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    disabled={isLoading}
                    autoComplete="new-password"
                    className="w-full bg-transparent border-b border-[#D8D4CC] focus:border-[#C2922E] text-[#111113] outline-none py-2.5 text-sm placeholder:text-[#9999A4] disabled:opacity-50 transition-colors pr-10"
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
                    onClick={() => { setShowForgotModal(true); setForgotStep(1); setForgotEmail(email); }}
                    className="text-[10px] uppercase tracking-[0.18em] text-[#777782] hover:text-[#C2922E] transition-colors font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Passwordless OTP Login Fields */}
          {authMode === "otp" && (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                disabled={isLoading || otpSent}
                autoComplete="off"
                className="w-full bg-transparent border-b border-[#D8D4CC] focus:border-[#C2922E] text-[#111113] outline-none py-2.5 text-sm placeholder:text-[#9999A4] disabled:opacity-50 transition-colors"
                required
              />
              {otpSent && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#C2922E] block mb-2 font-mono">
                    Enter 6-Digit Email OTP *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="e.g. 849201"
                    disabled={isLoading}
                    autoComplete="off"
                    className="w-full bg-transparent border-b border-[#C2922E] text-[#111113] outline-none py-2 text-xl font-mono tracking-[0.4em] text-center placeholder:text-[#C2922E]/40 font-bold"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-[10px] uppercase tracking-[0.18em] text-[#777782] hover:text-[#C2922E] mt-2 block mx-auto transition-colors"
                  >
                    Change Email / Resend Code
                  </button>
                </motion.div>
              )}
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
                  ? regOtpSent ? "Verify OTP & Complete Account" : "Send Verification OTP"
                  : authMode === "otp"
                  ? otpSent ? "Verify OTP & Sign In" : "Send 6-Digit OTP"
                  : "Sign In"}
              </span>
            )}
          </button>
          
          {/* Guest Button */}
          <button
            type="button"
            onClick={() => navigate("/")}
            disabled={isLoading}
            className="w-full border border-[#D8D4CC] text-[#111113] py-3.5 text-[11px] uppercase tracking-[0.24em] font-medium hover:border-[#111113] hover:bg-black/5 transition-all mt-2 disabled:opacity-50"
          >
            Continue as Guest
          </button>
        </form>

        {/* Switch Mode Prompt */}
        <p className="text-[11px] uppercase tracking-[0.18em] font-body text-center mt-7 text-[#777782]">
          {authMode === "register" ? "Already have an account? " : "New to ICW? "}
          <button 
            type="button"
            disabled={isLoading}
            onClick={() => {
              if (authMode === "register") {
                setAuthMode("password");
              } else {
                setAuthMode("register");
              }
            }} 
            className="text-[#111113] hover:text-[#C2922E] ml-1 font-bold disabled:opacity-50 transition-colors underline"
          >
            {authMode === "register" ? "Sign In" : "Create Account"}
          </button>
        </p>
      </div>

      {/* FORGOT PASSWORD MODAL */}
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
                  — SECURITY VERIFICATION
                </span>
                <h2 className="font-quiche text-2xl font-light text-[#111113]">Reset Password</h2>
                <p className="text-xs text-[#555560] mt-1 font-light leading-relaxed">
                  {forgotStep === 1
                    ? "Enter your registered email to receive a 6-digit verification code."
                    : "Enter the code received in your email along with your new password."}
                </p>
              </div>

              {forgotStep === 1 ? (
                <form onSubmit={handleForgotRequestOTP} autoComplete="off" className="space-y-5">
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Registered Email Address"
                    autoComplete="off"
                    className="w-full bg-transparent border-b border-[#D8D4CC] focus:border-[#C2922E] text-[#111113] outline-none py-2.5 text-sm placeholder:text-[#9999A4]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#111113] text-white py-4 text-[11px] uppercase tracking-[0.26em] font-medium hover:bg-[#C2922E] transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin text-white" /> : "Send Security OTP"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotResetSubmit} autoComplete="off" className="space-y-5">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#C2922E] block mb-1 font-mono">6-Digit OTP Code *</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="e.g. 948102"
                      autoComplete="off"
                      className="w-full bg-transparent border-b border-[#C2922E] text-[#111113] outline-none py-2 text-xl font-mono text-center tracking-[0.4em] font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#555560] block mb-1 font-medium">New Password *</label>
                    <div className="relative">
                      <input
                        type={showForgotNewPassword ? "text" : "password"}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        className="w-full bg-transparent border-b border-[#D8D4CC] focus:border-[#C2922E] text-[#111113] outline-none py-2 text-sm pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#777782] hover:text-[#111113] p-1 transition-colors"
                      >
                        {showForgotNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#111113] text-white py-4 text-[11px] uppercase tracking-[0.26em] font-medium hover:bg-[#C2922E] transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin text-white" /> : "Reset Password & Sign In"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-[10px] uppercase tracking-[0.18em] text-[#777782] hover:text-[#C2922E] block mx-auto mt-2 transition-colors"
                  >
                    Resend Code
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;
