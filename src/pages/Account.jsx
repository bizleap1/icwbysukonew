import React, { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Phone, Mail, Lock, MapPin, Plus, Trash2, Edit2, 
  Package, Heart, ArrowRight, CheckCircle2, Key,
  ArrowLeft, ChevronRight, Eye, EyeOff, Sparkles, MessageSquare, LogOut
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { apiClient } from "../config/api";
import SEO from "../components/SEO";

const Account = () => {
  const { user, token, refreshUser, logout } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();

  // Active Tab: 'profile', 'addresses', 'security'
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile Edit State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Security / Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [signingOutSessions, setSigningOutSessions] = useState(false);

  // Address Book State
  const [addresses, setAddresses] = useState([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addrForm, setAddrForm] = useState({ line1: "", city: "", state: "", pincode: "", phone: "" });
  const [savingAddr, setSavingAddr] = useState(false);

  useEffect(() => {
    if (token) {
      fetchProfileAndAddresses();
    }
  }, [token]);

  const fetchProfileAndAddresses = async () => {
    setLoading(true);
    try {
      const [profData, addrData] = await Promise.all([
        apiClient.get("/api/auth/profile").catch(() => null),
        apiClient.get("/api/addresses").catch(() => [])
      ]);

      if (profData) {
        setProfileData(profData);
        setName(profData.name || "");
        setPhone(profData.phone || "");
      }
      if (Array.isArray(addrData)) {
        setAddresses(addrData);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load account details.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Handle Profile Update (Single Clear CTA)
  const handleUpdateProfile = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!name.trim()) {
      return toast.error("Please enter your full name.");
    }
    setUpdatingProfile(true);

    try {
      const data = await apiClient.put("/api/auth/profile", {
        name: name.trim(),
        phone: phone.trim()
      });

      toast.success(data.message || "Your profile changes have been saved.");
      if (refreshUser) await refreshUser();
      fetchProfileAndAddresses();
    } catch (err) {
      toast.error(err.message || "Failed to save profile changes.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  // 2. Handle Password Change in Security Tab
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      return toast.error("Please enter your current password.");
    }
    if (!newPassword || newPassword.length < 8) {
      return toast.error("New password must be at least 8 characters long.");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match.");
    }

    setUpdatingPassword(true);
    try {
      const data = await apiClient.post("/api/auth/change-password", {
        currentPassword,
        newPassword
      });

      toast.success(data.message || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // 3. Handle Sign Out of Other Sessions
  const handleSignOutOtherSessions = () => {
    setSigningOutSessions(true);
    setTimeout(() => {
      setSigningOutSessions(false);
      toast.success("All other device sessions have been revoked.");
    }, 600);
  };

  // 4. Handle Address Save / Update
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setSavingAddr(true);

    try {
      if (editingAddressId) {
        await apiClient.put(`/api/addresses/${editingAddressId}`, addrForm);
        toast.success("Delivery address updated successfully.");
      } else {
        await apiClient.post("/api/addresses", addrForm);
        toast.success("New delivery address saved.");
      }
      setShowAddAddress(false);
      setEditingAddressId(null);
      setAddrForm({ line1: "", city: "", state: "", pincode: "", phone: "" });
      fetchProfileAndAddresses();
    } catch (err) {
      toast.error(err.message || "Failed to save address.");
    } finally {
      setSavingAddr(false);
    }
  };

  // 5. Handle Address Delete
  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to remove this delivery address?")) return;
    try {
      await apiClient.delete(`/api/addresses/${id}`);
      toast.success("Delivery address removed.");
      fetchProfileAndAddresses();
    } catch (err) {
      toast.error(err.message || "Failed to delete address.");
    }
  };

  const handleEditAddrClick = (addr) => {
    setEditingAddressId(addr.id);
    setAddrForm({
      line1: addr.line1,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      phone: addr.phone || ""
    });
    setShowAddAddress(true);
    setActiveTab("addresses");
  };

  if (!user?.authenticated) return <Navigate to="/auth" />;

  // Display computation
  const rawName = name || user?.name || profileData?.name || "Client";
  const displayEmail = user?.email || profileData?.email || "";
  const clientInitial = (rawName || "U").trim().charAt(0).toUpperCase();

  // Metrics
  const clientSinceYear = profileData?.created_at 
    ? new Date(profileData.created_at).getFullYear() 
    : "2026";
  const totalOrdersCount = profileData?.orderCount ?? (Array.isArray(profileData?.orders) ? profileData.orders.length : 0);
  const formattedOrders = String(totalOrdersCount).padStart(2, "0");
  const savedPiecesCount = String(wishlistItems?.length || 0).padStart(2, "0");

  // Primary Default Address
  const primaryAddress = addresses.length > 0 ? addresses[0] : null;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111113] font-body pt-24 sm:pt-32 pb-28 sm:pb-24 px-4 sm:px-8 lg:px-16 selection:bg-[#C2922E] selection:text-white">
      <SEO title="My Account | SUKO Atelier" description="Manage your personal atelier details, addresses, and account security." />

      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10">

        {/* ========================================================================= */}
        {/* MOBILE TOP NAVIGATION                                                     */}
        {/* ========================================================================= */}
        <div className="sm:hidden flex items-center justify-between pb-1">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#6E6E75] hover:text-[#111113] tracking-wider uppercase font-medium"
          >
            <ArrowLeft size={14} />
            <span>Storefront</span>
          </Link>
          <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#C2922E] font-medium">
            CLIENT PROFILE
          </span>
        </div>

        {/* ========================================================================= */}
        {/* HEADER SECTION                                                            */}
        {/* ========================================================================= */}
        <div className="border-b border-[#EAE6DF] pb-6 sm:pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="w-3.5 h-[1.5px] bg-[#C2922E]" />
              <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.28em] text-[#C2922E] font-medium font-mono">
                CLIENT PROFILE
              </span>
            </div>
            
            <div className="flex items-center gap-3.5 mt-1">
              <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#111113] text-white flex items-center justify-center font-mono font-medium text-base sm:text-lg ring-2 ring-[#C2922E]/60 shadow-xs shrink-0">
                {clientInitial}
              </span>
              <div>
                <h1 className="font-quiche text-3xl sm:text-4xl lg:text-[40px] font-light text-[#111113] tracking-tight leading-tight">
                  My Account
                </h1>
                <p className="text-xs sm:text-sm text-[#6E6E75] font-light mt-0.5">
                  Manage your personal details, addresses and account security.
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden sm:flex gap-2 font-body text-[11px] uppercase tracking-[0.20em]">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`py-2.5 px-5 border transition-all duration-200 cursor-pointer ${
                activeTab === "profile" 
                  ? "bg-white text-[#111113] border-[#C2922E] font-medium shadow-xs ring-1 ring-[#C2922E]/20" 
                  : "bg-[#F5F2EB]/60 border-[#DDD8CE] text-[#6E6E75] hover:text-[#111113] hover:border-[#111113]"
              }`}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("addresses")}
              className={`py-2.5 px-5 border transition-all duration-200 cursor-pointer ${
                activeTab === "addresses" 
                  ? "bg-white text-[#111113] border-[#C2922E] font-medium shadow-xs ring-1 ring-[#C2922E]/20" 
                  : "bg-[#F5F2EB]/60 border-[#DDD8CE] text-[#6E6E75] hover:text-[#111113] hover:border-[#111113]"
              }`}
            >
              Address Book ({addresses.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`py-2.5 px-5 border transition-all duration-200 cursor-pointer ${
                activeTab === "security" 
                  ? "bg-white text-[#111113] border-[#C2922E] font-medium shadow-xs ring-1 ring-[#C2922E]/20" 
                  : "bg-[#F5F2EB]/60 border-[#DDD8CE] text-[#6E6E75] hover:text-[#111113] hover:border-[#111113]"
              }`}
            >
              Security
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE TOP COMPACT PROFILE SUMMARY CARD                                   */}
        {/* ========================================================================= */}
        <div className="sm:hidden border border-[#E8E4DC] bg-[#F5F2EB] p-4 shadow-xs flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-full bg-[#111113] text-white flex items-center justify-center font-mono font-medium text-base ring-1 ring-[#C2922E] shrink-0">
            {clientInitial}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-quiche text-base font-medium text-[#111113] truncate">
              {rawName}
            </h3>
            <p className="text-[11px] text-[#6E6E75] font-mono">
              Member since {clientSinceYear} &bull; {formattedOrders} Orders
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE HORIZONTAL TABS                                                    */}
        {/* ========================================================================= */}
        <div className="sm:hidden flex overflow-x-auto gap-2 pb-1 text-xs uppercase tracking-[0.16em] no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`py-2 px-4 whitespace-nowrap border shrink-0 font-medium transition-colors ${
              activeTab === "profile"
                ? "bg-[#111113] text-white border-[#111113]"
                : "bg-white text-[#6E6E75] border-[#DDD8CE]"
            }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("addresses")}
            className={`py-2 px-4 whitespace-nowrap border shrink-0 font-medium transition-colors ${
              activeTab === "addresses"
                ? "bg-[#111113] text-white border-[#111113]"
                : "bg-white text-[#6E6E75] border-[#DDD8CE]"
            }`}
          >
            Address ({addresses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`py-2 px-4 whitespace-nowrap border shrink-0 font-medium transition-colors ${
              activeTab === "security"
                ? "bg-[#111113] text-white border-[#111113]"
                : "bg-white text-[#6E6E75] border-[#DDD8CE]"
            }`}
          >
            Security
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MAIN LAYOUT (2 Columns on Desktop, Single Column on Mobile)               */}
        {/* ========================================================================= */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* ======================================================================= */}
          {/* LEFT COLUMN: ACTIVE TAB CONTENT                                         */}
          {/* ======================================================================= */}
          <div className="lg:col-span-7 space-y-6">

            {/* ----------------- TAB: PROFILE ----------------- */}
            {activeTab === "profile" && (
              <form onSubmit={handleUpdateProfile} className="space-y-6 font-body">
                
                {/* Personal Details Card */}
                <div className="border border-[#EAE6DF] bg-white p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-5">
                  <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
                    <h2 className="text-base sm:text-lg font-quiche font-light text-[#111113] flex items-center gap-2">
                      <User className="w-4 h-4 text-[#C2922E]" />
                      <span>Personal Details</span>
                    </h2>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#8C887B]">
                      MEMBER SINCE {clientSinceYear}
                    </span>
                  </div>

                  <div className="space-y-5">
                    {/* Full Name */}
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] font-medium block mb-1.5">
                        Full Name *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2.5 pl-7 text-sm text-[#111113] placeholder-[#A3A096] outline-none transition-colors"
                          required
                        />
                        <User className="w-4 h-4 text-[#8C887B] absolute left-0 top-3" />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] font-medium block mb-1.5">
                        Phone Number (For Order Updates &amp; Delivery Alerts) *
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2.5 pl-7 text-sm text-[#111113] placeholder-[#A3A096] outline-none transition-colors"
                          required
                        />
                        <Phone className="w-4 h-4 text-[#8C887B] absolute left-0 top-3" />
                      </div>
                    </div>

                    {/* Email (Primary Identity - Locked) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] font-medium">
                          Email Address
                        </label>
                        <span className="text-[9.5px] uppercase tracking-wider text-[#8C887B] bg-[#FAF8F5] border border-[#DDD8CE] px-2 py-0.5 font-mono flex items-center gap-1">
                          <Lock size={10} className="text-[#C2922E]" />
                          Primary Identity · Locked
                        </span>
                      </div>
                      <div className="relative opacity-85">
                        <input
                          type="email"
                          value={displayEmail}
                          readOnly
                          className="w-full bg-transparent border-b border-[#EAE6DF] py-2.5 pl-7 text-sm text-[#333339] outline-none cursor-not-allowed font-mono"
                        />
                        <Mail className="w-4 h-4 text-[#8C887B] absolute left-0 top-3" />
                      </div>
                      <span className="text-[10.5px] text-[#8C887B] block mt-1.5 font-light">
                        Official communications and order invoices are delivered to this verified account address.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Default Address Preview inside Profile */}
                <div className="border border-[#EAE6DF] bg-white p-6 sm:p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3">
                    <h3 className="text-sm font-quiche uppercase tracking-[0.16em] text-[#111113] flex items-center gap-2">
                      <MapPin size={14} className="text-[#C2922E]" />
                      <span>Default Delivery Address</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("addresses")}
                      className="text-xs uppercase tracking-[0.18em] text-[#C2922E] hover:text-[#111113] font-medium transition-colors cursor-pointer"
                    >
                      {primaryAddress ? "Edit →" : "+ Add →"}
                    </button>
                  </div>

                  {primaryAddress ? (
                    <div className="text-xs text-[#6E6E75] space-y-0.5">
                      <p className="text-[#111113] font-medium">{primaryAddress.line1}</p>
                      <p>{primaryAddress.city}, {primaryAddress.state} &mdash; <span className="font-mono">{primaryAddress.pincode}</span></p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#8C887B] font-light">
                      No delivery address saved yet. Add an address for seamless checkout.
                    </p>
                  )}
                </div>

                {/* Desktop Save Changes CTA */}
                <div className="hidden sm:block">
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="w-full bg-[#111113] hover:bg-black text-white py-4 text-[11px] uppercase tracking-[0.24em] font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {updatingProfile ? "Saving Changes..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {/* ----------------- TAB: ADDRESS BOOK ----------------- */}
            {activeTab === "addresses" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
                  <div>
                    <h2 className="text-xl font-quiche font-light text-[#111113] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#C2922E]" />
                      <span>Address Book</span>
                    </h2>
                    <p className="text-xs text-[#6E6E75] font-light mt-0.5">
                      Manage your saved delivery destinations for effortless checkout.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddressId(null);
                      setAddrForm({ line1: "", city: "", state: "", pincode: "", phone: "" });
                      setShowAddAddress(!showAddAddress);
                    }}
                    className="bg-[#111113] hover:bg-black text-white py-2.5 px-4 text-[10.5px] uppercase tracking-[0.18em] font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>{showAddAddress ? "Cancel" : "Add Address"}</span>
                  </button>
                </div>

                {/* Add / Edit Inline Form */}
                <AnimatePresence>
                  {showAddAddress && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="border border-[#EAE6DF] p-6 bg-white shadow-sm space-y-4"
                    >
                      <h3 className="text-sm font-quiche uppercase tracking-[0.16em] text-[#111113]">
                        {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                      </h3>

                      <form onSubmit={handleAddressSubmit} className="space-y-4 text-xs font-body">
                        <div>
                          <label className="text-[10px] uppercase tracking-[0.2em] text-[#6E6E75] font-medium block mb-1">
                            Street Address / Apartment *
                          </label>
                          <input
                            type="text"
                            value={addrForm.line1}
                            onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })}
                            placeholder="e.g. Penthouse 402, Signature Tower, Worli"
                            className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2 text-sm text-[#111113] outline-none"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] uppercase tracking-[0.2em] text-[#6E6E75] font-medium block mb-1">
                              City *
                            </label>
                            <input
                              type="text"
                              value={addrForm.city}
                              onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                              placeholder="e.g. Mumbai"
                              className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2 text-sm text-[#111113] outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-[0.2em] text-[#6E6E75] font-medium block mb-1">
                              State *
                            </label>
                            <input
                              type="text"
                              value={addrForm.state}
                              onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                              placeholder="e.g. Maharashtra"
                              className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2 text-sm text-[#111113] outline-none"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] uppercase tracking-[0.2em] text-[#6E6E75] font-medium block mb-1">
                              PIN Code *
                            </label>
                            <input
                              type="text"
                              value={addrForm.pincode}
                              onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })}
                              placeholder="e.g. 400018"
                              className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2 text-sm text-[#111113] outline-none font-mono"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-[0.2em] text-[#6E6E75] font-medium block mb-1">
                              Contact Phone *
                            </label>
                            <input
                              type="tel"
                              value={addrForm.phone}
                              onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                              placeholder="e.g. +91 9876543210"
                              className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2 text-sm text-[#111113] outline-none"
                              required
                            />
                          </div>
                        </div>

                        <div className="pt-2 flex gap-3">
                          <button
                            type="submit"
                            disabled={savingAddr}
                            className="bg-[#111113] hover:bg-black text-white py-2.5 px-5 text-[10.5px] uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer"
                          >
                            {savingAddr ? "Saving..." : "Save Address"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddAddress(false)}
                            className="border border-[#DDD8CE] text-[#6E6E75] py-2.5 px-4 text-[10.5px] uppercase tracking-[0.2em] transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Saved Address Cards */}
                <div className="space-y-4">
                  {addresses.map((addr, idx) => (
                    <div key={addr.id} className="border border-[#EAE6DF] hover:border-[#C2922E] p-5 sm:p-6 bg-white shadow-xs space-y-2 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-[#C2922E] font-medium flex items-center gap-1.5">
                          <MapPin size={11} />
                          <span>{idx === 0 ? "Default Destination" : "Additional Destination"}</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditAddrClick(addr)}
                            className="text-[#8C887B] hover:text-[#111113] p-1.5 transition-colors cursor-pointer"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-[#8C887B] hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-[#111113]">{addr.line1}</p>
                      <p className="text-xs text-[#6E6E75]">{addr.city}, {addr.state} &mdash; <span className="font-mono text-[#111113]">{addr.pincode}</span></p>
                      {addr.phone && (
                        <p className="text-xs text-[#8C887B] font-mono">Contact: {addr.phone}</p>
                      )}
                    </div>
                  ))}

                  {addresses.length === 0 && !showAddAddress && (
                    <div className="border border-dashed border-[#DDD8CE] bg-white p-10 text-center text-xs text-[#6E6E75] space-y-3">
                      <MapPin size={22} className="mx-auto text-[#C2922E]" />
                      <p className="font-medium text-[#111113]">No Saved Delivery Destinations</p>
                      <p className="font-light max-w-sm mx-auto">
                        Save your delivery address for one-click ordering and expedited white-glove dispatch.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddAddress(true)}
                        className="inline-flex items-center gap-1.5 bg-[#111113] hover:bg-black text-white px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-medium cursor-pointer"
                      >
                        <Plus size={12} /> Add First Address
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ----------------- TAB: SECURITY ----------------- */}
            {activeTab === "security" && (
              <div className="space-y-6">
                
                {/* Password Update Card */}
                <div className="border border-[#EAE6DF] bg-white p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-6">
                  <div className="border-b border-[#EAE6DF] pb-4">
                    <h2 className="text-xl font-quiche font-light text-[#111113] flex items-center gap-2">
                      <Key className="w-4 h-4 text-[#C2922E]" />
                      <span>Security</span>
                    </h2>
                    <p className="text-xs text-[#6E6E75] font-light mt-1">
                      Manage your password and protect your atelier client account.
                    </p>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-5">
                    {/* Current Password */}
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] font-medium block mb-1.5">
                        Current Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPw ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2.5 pl-7 pr-8 text-sm text-[#111113] placeholder-[#A3A096] outline-none transition-colors"
                          required
                        />
                        <Lock className="w-4 h-4 text-[#8C887B] absolute left-0 top-3" />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute right-1 top-2.5 text-[#8C887B] hover:text-[#111113] cursor-pointer"
                        >
                          {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] font-medium block mb-1.5">
                        New Password (Min 8 Characters) *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPw ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2.5 pl-7 pr-8 text-sm text-[#111113] placeholder-[#A3A096] outline-none transition-colors"
                          required
                        />
                        <Key className="w-4 h-4 text-[#8C887B] absolute left-0 top-3" />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-1 top-2.5 text-[#8C887B] hover:text-[#111113] cursor-pointer"
                        >
                          {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] font-medium block mb-1.5">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPw ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2.5 pl-7 text-sm text-[#111113] placeholder-[#A3A096] outline-none transition-colors"
                          required
                        />
                        <Key className="w-4 h-4 text-[#8C887B] absolute left-0 top-3" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={updatingPassword}
                      className="w-full bg-[#111113] hover:bg-black text-white py-3.5 text-[10.5px] uppercase tracking-[0.22em] font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {updatingPassword ? "Updating Password..." : "Update Password"}
                    </button>
                  </form>
                </div>

                {/* Session Security Card */}
                <div className="border border-[#EAE6DF] bg-white p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-quiche uppercase tracking-[0.14em] text-[#111113]">
                      Active Sessions
                    </h3>
                    <p className="text-xs text-[#6E6E75] font-light">
                      Sign out of all other browsers and mobile devices.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOutOtherSessions}
                    disabled={signingOutSessions}
                    className="border border-[#DDD8CE] hover:border-[#111113] text-[#111113] py-2.5 px-4 text-[10.5px] uppercase tracking-[0.18em] font-medium transition-colors cursor-pointer shrink-0"
                  >
                    {signingOutSessions ? "Revoking..." : "Sign Out of Other Sessions"}
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* ======================================================================= */}
          {/* RIGHT COLUMN: ACCOUNT OVERVIEW & QUICK LINKS                            */}
          {/* ======================================================================= */}
          <div className="lg:col-span-5 space-y-6 font-body">
            
            {/* Account Overview Card */}
            <div className="border border-[#E8E4DC] p-6 bg-[#F5F2EB] space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E0D9CB]">
                <span className="text-[10px] uppercase tracking-[0.26em] text-[#C2922E] font-medium font-mono">
                  ACCOUNT OVERVIEW
                </span>
                <span className="text-[10px] font-mono text-[#8C887B]">
                  SINCE {clientSinceYear}
                </span>
              </div>
              
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-[#E0D9CB]/60 pb-2.5">
                  <span className="text-[#6E6E75]">Orders:</span>
                  <span className="text-[#111113] font-medium">{formattedOrders} Orders</span>
                </div>
                
                <div className="flex justify-between border-b border-[#E0D9CB]/60 pb-2.5">
                  <span className="text-[#6E6E75]">Saved Pieces:</span>
                  <span className="text-[#111113] font-medium">{savedPiecesCount} Saved</span>
                </div>

                <div className="space-y-1 pt-0.5">
                  <div className="flex justify-between text-[#6E6E75]">
                    <span>Default Address:</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("addresses")}
                      className="text-[#C2922E] hover:underline font-sans text-[11px]"
                    >
                      {primaryAddress ? "Manage" : "Add"}
                    </button>
                  </div>
                  <p className="text-[#111113] font-sans text-xs line-clamp-2">
                    {primaryAddress 
                      ? `${primaryAddress.line1}, ${primaryAddress.city} (${primaryAddress.pincode})`
                      : "No default address saved"}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="space-y-3">
              <div className="px-1 text-[10px] uppercase font-mono tracking-[0.24em] text-[#8C887B]">
                Quick Links
              </div>

              {/* Link 1: Order History & Receipts */}
              <Link
                to="/orders"
                className="p-4 sm:p-5 border border-[#EAE6DF] hover:border-[#C2922E] bg-white transition-all duration-300 flex items-center justify-between text-xs tracking-[0.16em] uppercase font-medium group shadow-xs"
              >
                <span className="flex items-center gap-3 text-[#111113]">
                  <Package className="w-4 h-4 text-[#C2922E]" />
                  <span>Order History &amp; Receipts</span>
                </span>
                <ArrowRight size={14} className="text-[#8C887B] group-hover:text-[#111113] group-hover:translate-x-1 transition-all" />
              </Link>

              {/* Link 2: Wishlist */}
              <Link
                to="/wishlist"
                className="p-4 sm:p-5 border border-[#EAE6DF] hover:border-[#C2922E] bg-white transition-all duration-300 flex items-center justify-between text-xs tracking-[0.16em] uppercase font-medium group shadow-xs"
              >
                <span className="flex items-center gap-3 text-[#111113]">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Wishlist ({savedPiecesCount})</span>
                </span>
                <ArrowRight size={14} className="text-[#8C887B] group-hover:text-[#111113] group-hover:translate-x-1 transition-all" />
              </Link>

              {/* Link 3: Address Book */}
              <button
                type="button"
                onClick={() => setActiveTab("addresses")}
                className="w-full p-4 sm:p-5 border border-[#EAE6DF] hover:border-[#C2922E] bg-white transition-all duration-300 flex items-center justify-between text-xs tracking-[0.16em] uppercase font-medium group shadow-xs cursor-pointer text-left"
              >
                <span className="flex items-center gap-3 text-[#111113]">
                  <MapPin className="w-4 h-4 text-[#C2922E]" />
                  <span>Address Book ({addresses.length})</span>
                </span>
                <ArrowRight size={14} className="text-[#8C887B] group-hover:text-[#111113] group-hover:translate-x-1 transition-all" />
              </button>

              {/* Link 4: Contact Concierge */}
              <a
                href="https://wa.me/919370350885?text=Hi%20SUKO%20Atelier,%20I%20need%20concierge%20support%20with%20my%20account."
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 sm:p-5 border border-[#EAE6DF] hover:border-[#C2922E] bg-white transition-all duration-300 flex items-center justify-between text-xs tracking-[0.16em] uppercase font-medium group shadow-xs"
              >
                <span className="flex items-center gap-3 text-[#111113]">
                  <MessageSquare className="w-4 h-4 text-[#C2922E]" />
                  <span>Contact Concierge</span>
                </span>
                <ArrowRight size={14} className="text-[#8C887B] group-hover:text-[#111113] group-hover:translate-x-1 transition-all" />
              </a>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MOBILE STICKY SAVE BUTTON                                                 */}
      {/* ========================================================================= */}
      {activeTab === "profile" && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[#EAE6DF] z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <button
            type="button"
            onClick={handleUpdateProfile}
            disabled={updatingProfile}
            className="w-full bg-[#111113] active:bg-black text-white py-3.5 text-[11px] uppercase tracking-[0.24em] font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {updatingProfile ? "Saving Changes..." : "SAVE CHANGES"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Account;
