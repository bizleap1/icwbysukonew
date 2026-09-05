import React, { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Phone, Mail, Lock, MapPin, Plus, Trash2, Edit2, 
  Package, Heart, Shield, ArrowRight, CheckCircle2, Clock, Key,
  Sparkles, ExternalLink
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../config/api";
import SEO from "../components/SEO";

const Account = () => {
  const { user, token, loginWithToken } = useAuth();
  const navigate = useNavigate();

  const [activeSubTab, setActiveSubTab] = useState("profile"); // 'profile', 'addresses'
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Address State
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (newPassword) {
      const len = new TextEncoder().encode(newPassword).length;
      if (len < 8 || len > 72) {
        return toast.error("New password must be between 8 and 72 characters.");
      }
    }
    setUpdatingProfile(true);

    try {
      const data = await apiClient.put("/api/auth/profile", {
        name: name.trim(),
        phone: phone.trim(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });

      if (data.token) {
        loginWithToken(data.token);
      }
      toast.success(data.message || "Account profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      fetchProfileAndAddresses();
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setUpdatingProfile(false);
    }
  };

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
  };

  if (!user?.authenticated) return <Navigate to="/auth" />;

  const displayName = name || user?.name || profileData?.name || "Client";
  const displayEmail = user?.email || profileData?.email || "";
  const clientInitial = (displayName || "U").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111113] font-body pt-28 sm:pt-36 pb-24 px-4 sm:px-8 lg:px-16 selection:bg-[#C2922E] selection:text-white">
      <SEO title="Account Settings | SUKO" description="Manage your SUKO personal profile, addresses, and order history." />

      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header Banner */}
        <div className="border-b border-[#EAE6DF] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="w-4 h-[1px] bg-[#C2922E]" />
              <span className="text-[10.5px] uppercase tracking-[0.28em] text-[#C2922E] font-medium font-mono">
                CLIENT ATELIER PROFILE
              </span>
            </div>
            
            <div className="flex items-center gap-3.5 mt-1">
              <span className="w-10 h-10 rounded-full bg-[#111113] text-white flex items-center justify-center font-mono font-medium text-sm ring-2 ring-[#C2922E]/60 shadow-xs">
                {clientInitial}
              </span>
              <div>
                <h1 className="font-quiche text-3xl sm:text-4xl lg:text-[40px] font-light text-[#111113] tracking-tight leading-tight">
                  Account Settings
                </h1>
                <p className="text-xs text-[#6E6E75] font-light">
                  Signed in as <span className="font-medium text-[#111113]">{displayEmail}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex gap-2.5 font-body text-[11px] uppercase tracking-[0.20em]">
            <button
              type="button"
              onClick={() => setActiveSubTab("profile")}
              className={`py-2.5 px-6 border transition-all duration-200 cursor-pointer ${
                activeSubTab === "profile" 
                  ? "bg-[#111113] text-white border-[#111113] font-medium shadow-xs" 
                  : "bg-transparent border-[#DDD8CE] text-[#6E6E75] hover:text-[#111113] hover:border-[#111113]"
              }`}
            >
              Personal Profile
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("addresses")}
              className={`py-2.5 px-6 border transition-all duration-200 cursor-pointer ${
                activeSubTab === "addresses" 
                  ? "bg-[#111113] text-white border-[#111113] font-medium shadow-xs" 
                  : "bg-transparent border-[#DDD8CE] text-[#6E6E75] hover:text-[#111113] hover:border-[#111113]"
              }`}
            >
              Address Book ({addresses.length})
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUBTAB 1: PERSONAL PROFILE & SECURITY                                     */}
        {/* ========================================================================= */}
        {activeSubTab === "profile" && (
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            
            {/* Left Column: Edit Profile & Password Form */}
            <div className="lg:col-span-7 space-y-6">
              <div className="border border-[#EAE6DF] bg-white p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-6">
                <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
                  <h2 className="text-lg font-quiche font-light text-[#111113] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#C2922E]" />
                    <span>Personal Information</span>
                  </h2>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#8C887B]">
                    ATELIER ID: #{user?.userId || user?.id || "CLIENT"}
                  </span>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6 font-body">
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
                      Phone Number (For Order Updates) *
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

                  {/* Primary Email (Read-only) */}
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] font-medium block mb-1.5">
                      Email Address (Primary Account Identity)
                    </label>
                    <div className="relative opacity-70">
                      <input
                        type="email"
                        value={displayEmail}
                        readOnly
                        className="w-full bg-transparent border-b border-[#EAE6DF] py-2.5 pl-7 text-sm text-[#555560] outline-none cursor-not-allowed font-mono"
                      />
                      <Mail className="w-4 h-4 text-[#8C887B] absolute left-0 top-3" />
                    </div>
                    <span className="text-[10.5px] text-[#8C887B] block mt-1 font-light">
                      Linked to all order confirmations, receipts, and digital concierge notes.
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#EAE6DF] pt-6">
                    <h3 className="text-xs font-quiche tracking-[0.16em] uppercase text-[#111113] flex items-center gap-2 mb-4">
                      <Key size={13} className="text-[#C2922E]" />
                      <span>Security &amp; Change Password (Optional)</span>
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] font-medium block mb-1.5">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Leave blank if keeping current password"
                          className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2 text-sm text-[#111113] placeholder-[#A3A096] outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] font-medium block mb-1.5">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new strong password (min 8 characters)"
                          className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2 text-sm text-[#111113] placeholder-[#A3A096] outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="w-full bg-[#111113] hover:bg-black text-white py-4 text-[11px] uppercase tracking-[0.24em] font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {updatingProfile ? "Saving Profile..." : "Save Profile Changes"}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Atelier Membership Specs & Quick Shortcuts */}
            <div className="lg:col-span-5 space-y-6 font-body">
              
              {/* Atelier Membership Card */}
              <div className="border border-[#E8E4DC] p-6 sm:p-7 bg-[#F5F2EB] space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#E0D9CB]">
                  <span className="text-[10px] uppercase tracking-[0.26em] text-[#C2922E] font-medium font-mono">
                    — ATELIER MEMBERSHIP
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-[#E0D9CB]/60 pb-2.5">
                    <span className="text-[#6E6E75]">Client Role:</span>
                    <span className="text-[#111113] uppercase font-semibold">
                      {user?.role === "admin" ? "Administrator" : "Atelier Client"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#E0D9CB]/60 pb-2.5">
                    <span className="text-[#6E6E75]">Total Orders:</span>
                    <span className="text-[#111113] font-medium">{profileData?.orders?.length || 0} Orders</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6E6E75]">Member Since:</span>
                    <span className="text-[#111113] font-medium">
                      {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "2026"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Shortcuts */}
              <div className="space-y-3">
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

                <Link
                  to="/wishlist"
                  className="p-4 sm:p-5 border border-[#EAE6DF] hover:border-[#C2922E] bg-white transition-all duration-300 flex items-center justify-between text-xs tracking-[0.16em] uppercase font-medium group shadow-xs"
                >
                  <span className="flex items-center gap-3 text-[#111113]">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Saved Wishlist Pieces</span>
                  </span>
                  <ArrowRight size={14} className="text-[#8C887B] group-hover:text-[#111113] group-hover:translate-x-1 transition-all" />
                </Link>

                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="p-4 sm:p-5 border border-[#C2922E]/40 hover:border-[#C2922E] bg-[#FAF8F5] transition-all duration-300 flex items-center justify-between text-xs tracking-[0.16em] uppercase font-medium group shadow-xs"
                  >
                    <span className="flex items-center gap-3 text-[#C2922E]">
                      <Shield className="w-4 h-4 text-[#C2922E]" />
                      <span>Admin Management Dashboard</span>
                    </span>
                    <ArrowRight size={14} className="text-[#C2922E] group-hover:translate-x-1 transition-all" />
                  </Link>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 2: ADDRESS BOOK                                                    */}
        {/* ========================================================================= */}
        {activeSubTab === "addresses" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-4">
              <div>
                <h2 className="text-xl font-quiche font-light text-[#111113] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#C2922E]" />
                  <span>Saved Delivery Destinations</span>
                </h2>
                <p className="text-xs text-[#6E6E75] font-light mt-0.5">
                  Saved destinations used for rapid one-click checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingAddressId(null);
                  setAddrForm({ line1: "", city: "", state: "", pincode: "", phone: "" });
                  setShowAddAddress(!showAddAddress);
                }}
                className="bg-[#111113] hover:bg-black text-white py-2.5 px-5 text-[10.5px] uppercase tracking-[0.20em] font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus size={13} />
                <span>{showAddAddress ? "Cancel" : "Add Destination"}</span>
              </button>
            </div>

            {/* Add / Edit Address Form Modal / Box */}
            <AnimatePresence>
              {showAddAddress && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="border border-[#EAE6DF] p-6 sm:p-8 bg-white max-w-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                >
                  <h3 className="text-sm font-quiche uppercase tracking-[0.16em] text-[#111113] mb-5">
                    {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Destination"}
                  </h3>

                  <form onSubmit={handleAddressSubmit} className="space-y-4 font-body text-xs">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] font-medium block mb-1">
                        Street Address / Apartment / Suite *
                      </label>
                      <input
                        type="text"
                        value={addrForm.line1}
                        onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })}
                        placeholder="e.g. Penthouse 402, Signature Tower, Worli"
                        className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2 text-sm text-[#111113] outline-none placeholder-[#A3A096]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] font-medium block mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          value={addrForm.city}
                          onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                          placeholder="e.g. Mumbai"
                          className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2 text-sm text-[#111113] outline-none placeholder-[#A3A096]"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] font-medium block mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          value={addrForm.state}
                          onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                          placeholder="e.g. Maharashtra"
                          className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2 text-sm text-[#111113] outline-none placeholder-[#A3A096]"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] font-medium block mb-1">
                          PIN Code *
                        </label>
                        <input
                          type="text"
                          value={addrForm.pincode}
                          onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })}
                          placeholder="e.g. 400018"
                          className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2 text-sm text-[#111113] outline-none font-mono placeholder-[#A3A096]"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.22em] text-[#6E6E75] font-medium block mb-1">
                          Contact Phone *
                        </label>
                        <input
                          type="tel"
                          value={addrForm.phone}
                          onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                          placeholder="e.g. +91 9876543210"
                          className="w-full bg-transparent border-b border-[#DDD8CE] focus:border-[#C2922E] py-2 text-sm text-[#111113] outline-none placeholder-[#A3A096]"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex gap-3">
                      <button
                        type="submit"
                        disabled={savingAddr}
                        className="bg-[#111113] hover:bg-black text-white py-3 px-6 text-[10.5px] uppercase tracking-[0.22em] font-medium transition-colors cursor-pointer"
                      >
                        {savingAddr ? "Saving..." : "Save Destination"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddAddress(false)}
                        className="border border-[#DDD8CE] hover:border-[#111113] text-[#6E6E75] hover:text-[#111113] py-3 px-5 text-[10.5px] uppercase tracking-[0.22em] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Address Cards Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {addresses.map((addr) => (
                <div key={addr.id} className="border border-[#EAE6DF] hover:border-[#C2922E] p-6 bg-white space-y-3 font-body relative group transition-all duration-300 shadow-xs">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-[#C2922E] font-mono flex items-center gap-1.5 font-medium">
                      <MapPin size={11} />
                      <span>Delivery Destination</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditAddrClick(addr)}
                        className="text-[#8C887B] hover:text-[#111113] p-1.5 transition-colors cursor-pointer"
                        title="Edit Address"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-[#8C887B] hover:text-rose-600 p-1.5 transition-colors cursor-pointer"
                        title="Delete Address"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-[#111113]">{addr.line1}</p>
                  <p className="text-xs text-[#6E6E75]">
                    {addr.city}, {addr.state} &mdash; <span className="font-mono text-[#111113] font-medium">{addr.pincode}</span>
                  </p>
                  {addr.phone && (
                    <p className="text-xs text-[#8C887B] font-mono">
                      Contact: {addr.phone}
                    </p>
                  )}
                </div>
              ))}

              {addresses.length === 0 && !showAddAddress && (
                <div className="col-span-2 border border-dashed border-[#DDD8CE] bg-white p-10 text-center text-[#6E6E75] font-body text-xs leading-relaxed">
                  <MapPin size={24} className="mx-auto text-[#C2922E] mb-2 stroke-1" />
                  <p className="text-sm font-medium text-[#111113] mb-1 font-quiche">No Saved Delivery Destinations</p>
                  <p className="max-w-md mx-auto mb-4 font-light text-[12px]">
                    Add your delivery addresses to enjoy seamless one-click checkout across the atelier.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(true)}
                    className="inline-flex items-center gap-2 bg-[#111113] hover:bg-black text-white px-5 py-2.5 text-[10px] uppercase tracking-[0.22em] font-medium cursor-pointer"
                  >
                    <Plus size={12} /> Add Your First Destination
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Account;
