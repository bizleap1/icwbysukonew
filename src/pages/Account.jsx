import React, { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  User, Phone, Mail, Lock, MapPin, Plus, Trash2, Edit2, 
  Package, Heart, Shield, ArrowRight, CheckCircle2, Clock, Key
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

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
      const headers = { "Authorization": `Bearer ${token}` };
      const [profRes, addrRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/auth/profile`, { headers }),
        fetch(`${API_BASE_URL}/api/addresses`, { headers })
      ]);

      if (profRes.ok) {
        const data = await profRes.json();
        setProfileData(data);
        setName(data.name || "");
        setPhone(data.phone || "");
      }
      if (addrRes.ok) {
        setAddresses(await addrRes.json());
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load account details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          phone,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      if (data.token) {
        loginWithToken(data.token);
      }
      toast.success("Account profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      fetchProfileAndAddresses();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setSavingAddr(true);

    try {
      const url = editingAddressId
        ? `${API_BASE_URL}/api/addresses/${editingAddressId}`
        : `${API_BASE_URL}/api/addresses`;
      const method = editingAddressId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(addrForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save address");

      toast.success(editingAddressId ? "Address updated!" : "New address added!");
      setAddrForm({ line1: "", city: "", state: "", pincode: "", phone: "" });
      setShowAddAddress(false);
      setEditingAddressId(null);
      fetchProfileAndAddresses();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingAddr(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Delete this delivery address?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/addresses/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete address");
      toast.success("Address removed");
      fetchProfileAndAddresses();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEditAddrClick = (addr) => {
    setEditingAddressId(addr.id);
    setAddrForm({
      line1: addr.line1,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      phone: addr.phone
    });
    setShowAddAddress(true);
  };

  if (!user?.authenticated) return <Navigate to="/auth" />;

  return (
    <div className="grain pt-36 pb-32 px-6 lg:px-16 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="border-b border-white/10 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <span className="text-[11px] uppercase tracking-[0.3em] text-amber-400 font-mono block mb-1">
              Hi, {user?.name || profileData?.name || "Client"} 👋
            </span>
            <h1 className="font-display text-4xl lg:text-5xl">Account Settings</h1>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex gap-3 font-body text-[11px] uppercase tracking-[0.2em]">
            <button
              onClick={() => setActiveSubTab("profile")}
              className={`py-2 px-5 border transition-all ${activeSubTab === "profile" ? "border-foreground bg-foreground text-background font-bold" : "border-white/15 text-foreground/60 hover:border-foreground"}`}
            >
              Personal Profile
            </button>
            <button
              onClick={() => setActiveSubTab("addresses")}
              className={`py-2 px-5 border transition-all ${activeSubTab === "addresses" ? "border-foreground bg-foreground text-background font-bold" : "border-white/15 text-foreground/60 hover:border-foreground"}`}
            >
              Address Book ({addresses.length})
            </button>
          </div>
        </div>

        {activeSubTab === "profile" && (
          <div className="grid lg:grid-cols-12 gap-10">
            {/* Left Column: Edit Profile & Password */}
            <div className="lg:col-span-7 space-y-8">
              <div className="border border-white/10 p-8 bg-background/50 backdrop-blur-sm space-y-6">
                <h2 className="text-xl font-display flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-400" /> Edit Personal Information
                </h2>

                <form onSubmit={handleUpdateProfile} className="space-y-6 font-body">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-2">Full Name *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full bg-transparent border-b border-white/15 focus:border-foreground py-3 pl-8 text-sm text-white outline-none"
                        required
                      />
                      <User className="w-4 h-4 text-foreground/40 absolute left-0 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-2">Phone Number *</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-transparent border-b border-white/15 focus:border-foreground py-3 pl-8 text-sm text-white outline-none"
                        required
                      />
                      <Phone className="w-4 h-4 text-foreground/40 absolute left-0 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-2">Email Address (Primary)</label>
                    <div className="relative opacity-60">
                      <input
                        type="email"
                        value={user?.email || profileData?.email || ""}
                        readOnly
                        className="w-full bg-transparent border-b border-white/10 py-3 pl-8 text-sm text-white outline-none cursor-not-allowed"
                      />
                      <Mail className="w-4 h-4 text-foreground/40 absolute left-0 top-3.5" />
                    </div>
                    <span className="text-[10px] text-foreground/40 block mt-1">Contact email linked to your orders & invoices.</span>
                  </div>

                  <hr className="border-white/10 my-6" />

                  <h3 className="text-sm font-display uppercase tracking-[0.15em] text-amber-400 flex items-center gap-2">
                    <Key size={14} /> Security & Change Password (Optional)
                  </h3>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-2">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Leave blank if not changing"
                      className="w-full bg-transparent border-b border-white/15 focus:border-foreground py-2 text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      className="w-full bg-transparent border-b border-white/15 focus:border-foreground py-2 text-sm text-white outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="w-full bg-foreground text-background py-4 text-[11px] uppercase tracking-[0.3em] font-bold hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {updatingProfile ? "Updating Account..." : "Save Profile Changes"}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Account Specs & Quick Shortcuts */}
            <div className="lg:col-span-5 space-y-6 font-body">
              {/* Account Specs Card */}
              <div className="border border-white/10 p-6 bg-background/50 backdrop-blur-sm space-y-4">
                <span className="text-[10px] uppercase tracking-[0.25em] text-amber-400 block font-mono">— ATELIER MEMBERSHIP</span>
                
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-foreground/50">Client Role:</span>
                    <span className="text-white uppercase font-bold">{user?.role || "Customer"}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-foreground/50">Total Orders:</span>
                    <span className="text-white">{profileData?.orders?.length || 0} Orders</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground/50">Member Since:</span>
                    <span className="text-white">
                      {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : "2026"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Shortcuts */}
              <div className="space-y-3">
                <Link
                  to="/orders"
                  className="p-5 border border-white/10 hover:border-foreground bg-background/40 hover:bg-white/5 transition-all flex items-center justify-between text-xs tracking-[0.15em] uppercase font-bold group"
                >
                  <span className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-emerald-400" /> Order History & Receipts
                  </span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/wishlist"
                  className="p-5 border border-white/10 hover:border-foreground bg-background/40 hover:bg-white/5 transition-all flex items-center justify-between text-xs tracking-[0.15em] uppercase font-bold group"
                >
                  <span className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-rose-400" /> Saved Wishlist Garments
                  </span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "addresses" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" /> Saved Delivery Addresses ({addresses.length})
              </h2>

              <button
                onClick={() => {
                  setEditingAddressId(null);
                  setAddrForm({ line1: "", city: "", state: "", pincode: "", phone: "" });
                  setShowAddAddress(!showAddAddress);
                }}
                className="bg-foreground text-background py-2.5 px-5 text-[10px] uppercase tracking-[0.2em] font-body font-bold hover:bg-foreground/90 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> {showAddAddress ? "Cancel" : "Add New Address"}
              </button>
            </div>

            {/* Add / Edit Address Form */}
            {showAddAddress && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-white/15 p-6 bg-background/70 backdrop-blur-md max-w-2xl"
              >
                <h3 className="text-sm font-display uppercase tracking-[0.15em] mb-4">
                  {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                </h3>

                <form onSubmit={handleAddressSubmit} className="space-y-4 font-body text-xs">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-1">Street Address / House Line *</label>
                    <input
                      type="text"
                      value={addrForm.line1}
                      onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })}
                      placeholder="e.g. Flat 402, Royal Residency, Bandra West"
                      className="w-full bg-transparent border-b border-white/20 focus:border-foreground py-2 text-white outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-1">City *</label>
                      <input
                        type="text"
                        value={addrForm.city}
                        onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                        placeholder="e.g. Mumbai"
                        className="w-full bg-transparent border-b border-white/20 focus:border-foreground py-2 text-white outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-1">State *</label>
                      <input
                        type="text"
                        value={addrForm.state}
                        onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                        placeholder="e.g. Maharashtra"
                        className="w-full bg-transparent border-b border-white/20 focus:border-foreground py-2 text-white outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-1">PIN Code *</label>
                      <input
                        type="text"
                        value={addrForm.pincode}
                        onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })}
                        placeholder="e.g. 400050"
                        className="w-full bg-transparent border-b border-white/20 focus:border-foreground py-2 text-white outline-none font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-1">Contact Phone *</label>
                      <input
                        type="tel"
                        value={addrForm.phone}
                        onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                        placeholder="e.g. +91 9876543210"
                        className="w-full bg-transparent border-b border-white/20 focus:border-foreground py-2 text-white outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex gap-4">
                    <button
                      type="submit"
                      disabled={savingAddr}
                      className="bg-foreground text-background py-3 px-6 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-foreground/90 transition-all"
                    >
                      {savingAddr ? "Saving..." : "Save Address"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Address Cards List */}
            <div className="grid sm:grid-cols-2 gap-6">
              {addresses.map((addr) => (
                <div key={addr.id} className="border border-white/10 p-6 bg-background/50 backdrop-blur-sm space-y-3 font-body relative group">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-mono flex items-center gap-1">
                      <MapPin size={12} /> Delivery Destination
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditAddrClick(addr)}
                        className="text-foreground/50 hover:text-white p-1"
                        title="Edit Address"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-red-400/70 hover:text-red-400 p-1"
                        title="Delete Address"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-white">{addr.line1}</p>
                  <p className="text-xs text-foreground/70">{addr.city}, {addr.state} — <span className="font-mono">{addr.pincode}</span></p>
                  <p className="text-xs text-foreground/50">Phone: {addr.phone}</p>
                </div>
              ))}

              {addresses.length === 0 && !showAddAddress && (
                <div className="col-span-2 border border-white/5 p-8 text-center text-foreground/50 font-body text-sm">
                  No saved delivery addresses found. Click "Add New Address" to save one for 1-click checkout!
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
