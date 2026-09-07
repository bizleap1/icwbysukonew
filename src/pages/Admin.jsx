import React, { useState, useEffect, useRef } from "react";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import {
  Package, Users, ShoppingCart, DollarSign, Trash2, Edit2,
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, Plus,
  Search, Download, AlertTriangle, Clock, X, Crop, Image as ImageIcon, Star, Eye, Tag, Mail, Send, MessageSquare, ShoppingBag,
  LayoutDashboard, Layers, ShieldCheck, CheckCircle, RefreshCw, Copy, Check,
  Menu, Bell, ArrowUpRight, TrendingUp, LogOut, MoreHorizontal
} from "lucide-react";
import { formatINR, PRODUCTS as DEFAULT_PRODUCTS, CATEGORIES as DEFAULT_CATEGORIES } from "../data/products";
import { useProducts } from "../context/ProductContext";
import ImageCropperModal from "../components/ImageCropperModal";
import { apiClient, API_BASE_URL } from "../config/api";

const dataURLtoFile = (dataurl, filename) => {
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch (e) {
    return null;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  const datePart = d.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = d.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${datePart} · ${timePart}`;
};

const getUserDisplayName = (user) => {
  if (!user) return "Valued Client";
  if (user.name && user.name.trim() !== "" && user.name.toLowerCase() !== "guest client") {
    return user.name.trim();
  }
  return "Valued Client";
};

const getUserPhone = (user) => {
  if (!user) return "No Phone Registered";
  if (user.phone && user.phone.trim() !== "") return user.phone;
  if (user.addresses && user.addresses.length > 0 && user.addresses[0].phone) {
    return user.addresses[0].phone;
  }
  return "No Phone Registered";
};

const formatStatus = (status) => {
  const map = {
    pending_payment: "Pending Payment",
    payment_verification_pending: "Awaiting Verification",
    paid: "Settled",
    payment_verification_failed: "Review Required",
    processing: "In Atelier",
    cancel_requested: "Cancel Requested",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return map[status] || (status ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—");
};

const ORDER_STATUS_CONFIG = [
  { value: "pending_payment", label: "Pending Payment", dotColor: "bg-[#8E877E]" },
  { value: "payment_verification_pending", label: "Awaiting Verification", dotColor: "bg-[#A77B1E]" },
  { value: "paid", label: "Settled", dotColor: "bg-[#111113]" },
  { value: "payment_verification_failed", label: "Review Required", dotColor: "bg-[#8B3A3A]" },
  { value: "processing", label: "In Atelier", dotColor: "bg-[#A77B1E]" },
  { value: "cancel_requested", label: "Cancel Requested", dotColor: "bg-[#8B3A3A]" },
  { value: "completed", label: "Completed", dotColor: "bg-[#3B6E4C]" },
  { value: "cancelled", label: "Cancelled", dotColor: "bg-[#746F68]" },
];

const renderStatusIndicator = (status) => {
  const label = formatStatus(status);
  const upper = label.toUpperCase();

  if (status === "paid" || status === "completed") {
    return (
      <span className="inline-block text-[9px] sm:text-[9.5px] font-mono tracking-[0.14em] text-[#111113] px-1.5 py-0.5 border border-[#E5DDD1] bg-transparent rounded-[2px] font-medium whitespace-nowrap">
        [ {upper} ]
      </span>
    );
  }
  if (status === "payment_verification_pending") {
    return (
      <span className="inline-block text-[9px] sm:text-[9.5px] font-mono tracking-[0.14em] text-[#8F6517] px-1.5 py-0.5 border border-[#D4B26F] bg-transparent rounded-[2px] font-medium whitespace-nowrap">
        [ {upper} ]
      </span>
    );
  }
  if (status === "payment_verification_failed" || status === "cancelled" || status === "cancel_requested") {
    return (
      <span className="inline-block text-[9px] sm:text-[9.5px] font-mono tracking-[0.14em] text-[#8B3A3A] px-1.5 py-0.5 border border-[#D9A4A4] bg-transparent rounded-[2px] font-medium whitespace-nowrap">
        [ {upper} ]
      </span>
    );
  }
  return (
    <span className="inline-block text-[9px] sm:text-[9.5px] font-mono tracking-[0.14em] text-[#746F68] px-1.5 py-0.5 border border-[#E5DDD1] bg-transparent rounded-[2px] font-medium whitespace-nowrap">
      [ {upper} ]
    </span>
  );
};

const formatPaymentMethod = (method) => {
  const map = {
    upi_qr: "UPI QR",
    razorpay: "Online Payment",
    online: "Online Payment",
    card: "Card Payment",
    netbanking: "Net Banking",
    cod: "Cash on Delivery",
  };
  return map[method] || (method ? method.replace(/_/g, " ").toUpperCase() : "UPI QR");
};

const compressAndResizeImage = (file) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      resolve({ file, preview: URL.createObjectURL(file), originalSize: file.size, compressedSize: file.size });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const maxW = 1200;
        const maxH = 1600;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ file, preview: URL.createObjectURL(file), originalSize: file.size, compressedSize: file.size });
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + "-opt.jpg", {
              type: "image/jpeg",
              lastModified: Date.now()
            });

            resolve({
              file: compressedFile,
              preview: URL.createObjectURL(compressedFile),
              originalSize: file.size,
              compressedSize: compressedFile.size
            });
          },
          "image/jpeg",
          0.85
        );
      };
      img.onerror = () => resolve({ file, preview: URL.createObjectURL(file), originalSize: file.size, compressedSize: file.size });
    };
    reader.onerror = () => resolve({ file, preview: URL.createObjectURL(file), originalSize: file.size, compressedSize: file.size });
  });
};

const Admin = () => {
  const { user, token, logout } = useAuth();
  const { refresh: refreshGlobalProducts } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const VALID_TABS = [
    "overview",
    "orders",
    "payments",
    "products",
    "categories",
    "customers",
    "reviews",
    "coupons",
    "broadcast",
    "calendar"
  ];
  const rawTab = (searchParams.get("tab") || "").toLowerCase();
  const activeTab = VALID_TABS.includes(rawTab) ? rawTab : "overview";

  // Modal Navigation & History Stack (for Browser Back Button & ESC Support)
  const modalStackRef = useRef([]);
  const isClosingViaCodeRef = useRef(false);

  const setActiveTab = (newTab, options = {}) => {
    const normalizedTab = VALID_TABS.includes(newTab?.toLowerCase()) ? newTab.toLowerCase() : "overview";
    if (normalizedTab === activeTab && !options.force) return;

    if (modalStackRef.current.length > 0) {
      modalStackRef.current.forEach(m => executeModalClose(m));
      modalStackRef.current = [];
    }

    const nextParams = new URLSearchParams(searchParams);
    if (normalizedTab === "overview") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", normalizedTab);
    }
    setSearchParams(nextParams, { replace: options.replace ?? false });
  };
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const addFormRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setSystemHealth(data?.status === "ok" ? "online" : "offline"))
      .catch(() => setSystemHealth("offline"));
  }, []);

  // Data States
  const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0 });
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [productGenderFilter, setProductGenderFilter] = useState("all");

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddCategoryInline, setShowAddCategoryInline] = useState(false);

  // Multiple Images & Cropping States
  const [galleryFiles, setGalleryFiles] = useState([]); // [{ file, preview, isPrimary }]
  const [editGalleryImages, setEditGalleryImages] = useState([]); // [{ url, file, preview, isPrimary }]
  const [cropperSrc, setCropperSrc] = useState(null);
  const [cropperCallback, setCropperCallback] = useState(null);
  const [demoActiveIndex, setDemoActiveIndex] = useState(0);

  // Calendar States
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarNotes, setCalendarNotes] = useState(() => {
    try {
      const saved = localStorage.getItem("admin_calendar_notes");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [noteInput, setNoteInput] = useState("");

  // Form State
  const [formData, setFormData] = useState({ name: "", price: "", stock: "", description: "", category_id: "", sub_category: "", sizes: "" });
  const [sizeStockMap, setSizeStockMap] = useState({ "38": 10, "40": 10, "42": 5 });
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Coupons State
  const [couponsList, setCouponsList] = useState([]);
  const [newCouponForm, setNewCouponForm] = useState({ code: "", discount_percent: "", discount_flat: "", min_order_value: "" });
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [zoomedScreenshot, setZoomedScreenshot] = useState(null);
  const [verifyingOrderId, setVerifyingOrderId] = useState(null);
  const [rejectingOrderId, setRejectingOrderId] = useState(null);
  const inspectModalRef = useRef(null);

  useEffect(() => {
    if (selectedOrderDetails) {
      if (inspectModalRef.current) {
        inspectModalRef.current.scrollTop = 0;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedOrderDetails]);

  // Date Filtering State
  const [datePreset, setDatePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Edit Order Modal State
  const [editingOrder, setEditingOrder] = useState(null);
  const [editOrderForm, setEditOrderForm] = useState({ total: "", status: "pending", cancel_reason: "" });
  const editModalRef = useRef(null);

  // Orders Table Custom Dropdown & Action Popover States
  const [openStatusDropdownOrderId, setOpenStatusDropdownOrderId] = useState(null);
  const [openActionMenuOrderId, setOpenActionMenuOrderId] = useState(null);

  useEffect(() => {
    const handleClosePopovers = () => {
      setOpenStatusDropdownOrderId(null);
      setOpenActionMenuOrderId(null);
    };
    window.addEventListener("click", handleClosePopovers);
    return () => window.removeEventListener("click", handleClosePopovers);
  }, []);

  useEffect(() => {
    if (editingOrder) {
      if (editModalRef.current) {
        editModalRef.current.scrollTop = 0;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [editingOrder]);

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to permanently delete Order #SUKO-${1000 + orderId}? This action cannot be undone.`)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      let data = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { error: text || "Failed to delete order" };
      }

      if (!res.ok) throw new Error(data.error || "Failed to delete order");

      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success(`Order #SUKO-${1000 + orderId} deleted successfully!`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleOpenEditOrder = (o) => {
    setEditingOrder(o);
    setEditOrderForm({
      total: o.total || 0,
      status: o.status || "pending",
      cancel_reason: o.cancel_reason || ""
    });
    pushModalState("editingOrder");
  };

  const handleSaveEditedOrder = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/orders/${editingOrder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(editOrderForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update order");

      setOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...o, ...data.order } : o));
      closeEditingOrder();
      toast.success(`Order #SUKO-${1000 + editingOrder.id} modified successfully!`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Email Dispatcher State
  const [emailForm, setEmailForm] = useState({ target: "single", recipientEmail: "", subject: "", message: "" });
  const [sendingEmail, setSendingEmail] = useState(false);

  // Reviews Moderation State
  const [adminReviewsList, setAdminReviewsList] = useState([]);

  // Edit Product / Garment Detail Drawer State
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDrawerInEditMode, setIsDrawerInEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: "", price: "", stock: "", category_id: "", sub_category: "", description: "", sizes: "" });
  const [editSizeStockMap, setEditSizeStockMap] = useState({});
  const [editImage, setEditImage] = useState(null);
  const [updatingProduct, setUpdatingProduct] = useState(false);

  const handleOpenEdit = (p, startInEdit = false) => {
    setEditingProduct(p);
    setIsDrawerInEditMode(startInEdit);

    let initialMap = {};
    if (p.size_stock && typeof p.size_stock === 'object' && Object.keys(p.size_stock).length > 0) {
      initialMap = p.size_stock;
    } else if (p.sizes && p.sizes.length > 0) {
      const perSize = Math.max(1, Math.floor((p.stock || 10) / p.sizes.length));
      p.sizes.forEach(s => { initialMap[s] = perSize; });
    } else {
      initialMap = { "Standard": p.stock || 10 };
    }

    setEditFormData({
      name: p.name || "",
      price: p.price || "",
      category_id: p.category_id || "",
      sub_category: p.sub_category || "",
      description: p.description || ""
    });
    setEditSizeStockMap(initialMap);

    // Set existing gallery images
    const existingList = Array.isArray(p.images) && p.images.length > 0
      ? p.images.map(url => ({ url, preview: url, isPrimary: url === p.image_url }))
      : p.image_url ? [{ url: p.image_url, preview: p.image_url, isPrimary: true }] : [];

    setEditGalleryImages(existingList);
    setEditImage(null);
    pushModalState("editingProduct");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setUpdatingProduct(true);

    try {
      const data = new FormData();
      data.append("name", editFormData.name);
      data.append("price", editFormData.price);
      data.append("description", editFormData.description);
      if (editFormData.category_id) data.append("category_id", editFormData.category_id);
      if (editFormData.sub_category) data.append("sub_category", editFormData.sub_category);
      data.append("size_stock", JSON.stringify(editSizeStockMap));

      const existingUrls = editGalleryImages.filter(g => g.url && !g.file).map(g => g.url);
      data.append("existing_images", JSON.stringify(existingUrls));

      const primaryItem = editGalleryImages.find(g => g.isPrimary && g.file);
      if (primaryItem) {
        data.append("image", primaryItem.file);
      } else if (editImage) {
        data.append("image", editImage);
      }

      editGalleryImages.forEach(g => {
        if (g.file && g !== primaryItem) {
          data.append("images", g.file);
        }
      });

      const res = await fetch(`${API_BASE_URL}/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: data
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.message || "Failed to update product");

      toast.success(`"${editFormData.name}" updated successfully!`);
      closeEditingProduct();
      fetchDashboardData();
      refreshGlobalProducts();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingProduct(false);
    }
  };

  // Modal Execution & History Interceptors (Enables Browser Back Button for Modals)
  function executeModalClose(modalId) {
    switch (modalId) {
      case "zoomedScreenshot":
        setZoomedScreenshot(null);
        break;
      case "orderDetails":
        setSelectedOrderDetails(null);
        break;
      case "editingOrder":
        setEditingOrder(null);
        break;
      case "editingProduct":
        setEditingProduct(null);
        setEditGalleryImages([]);
        setEditImage(null);
        break;
      case "cropper":
        setCropperSrc(null);
        setCropperCallback(null);
        break;
      case "mobileSidebar":
        setIsMobileSidebarOpen(false);
        break;
      default:
        break;
    }
  }

  const pushModalState = (modalId) => {
    modalStackRef.current.push(modalId);
    window.history.pushState({ sukoAdminModal: modalId }, "");
  };

  const closeModal = (modalId) => {
    const index = modalStackRef.current.lastIndexOf(modalId);
    if (index !== -1) {
      modalStackRef.current.splice(index, 1);
      isClosingViaCodeRef.current = true;
      window.history.back();
    }
    executeModalClose(modalId);
  };

  const openOrderDetails = (order) => {
    setSelectedOrderDetails(order);
    pushModalState("orderDetails");
  };
  const closeOrderDetails = () => closeModal("orderDetails");

  const openZoomedScreenshot = (url) => {
    setZoomedScreenshot(url);
    pushModalState("zoomedScreenshot");
  };
  const closeZoomedScreenshot = () => closeModal("zoomedScreenshot");

  const closeEditingOrder = () => closeModal("editingOrder");
  const closeEditingProduct = () => {
    setIsDrawerInEditMode(false);
    closeModal("editingProduct");
  };

  const openMobileSidebar = () => {
    setIsMobileSidebarOpen(true);
    pushModalState("mobileSidebar");
  };
  const closeMobileSidebar = (withoutHistory = false) => {
    if (withoutHistory) {
      modalStackRef.current = modalStackRef.current.filter(m => m !== "mobileSidebar");
      setIsMobileSidebarOpen(false);
    } else {
      closeModal("mobileSidebar");
    }
  };

  // Listen for Browser Back Button (popstate) & Escape Key
  useEffect(() => {
    const handlePopState = () => {
      if (isClosingViaCodeRef.current) {
        isClosingViaCodeRef.current = false;
        return;
      }

      if (modalStackRef.current.length > 0) {
        const topModal = modalStackRef.current.pop();
        executeModalClose(topModal);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (modalStackRef.current.length > 0) {
          const topModal = modalStackRef.current[modalStackRef.current.length - 1];
          closeModal(topModal);
        } else if (isProfileDropdownOpen) {
          setIsProfileDropdownOpen(false);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileDropdownOpen]);

  useEffect(() => {
    if (user?.authenticated && user.role === "admin" && token) {
      fetchDashboardData();
    }
  }, [user, token]);

  // Form Handlers
  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddGalleryFiles = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = Array.from(e.target.files);

    const toastId = toast.loading(`Optimizing ${selected.length} image(s)...`);
    const compressedResults = await Promise.all(selected.map(file => compressAndResizeImage(file)));

    const newItems = compressedResults.map((res, idx) => ({
      file: res.file,
      preview: res.preview,
      originalSize: res.originalSize,
      compressedSize: res.compressedSize,
      isPrimary: galleryFiles.length === 0 && idx === 0
    }));

    setGalleryFiles(prev => [...prev, ...newItems]);
    toast.dismiss(toastId);
    toast.success("Images optimized for high-speed luxury catalog view!");
  };

  const handleEditAddGalleryFiles = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = Array.from(e.target.files);

    const toastId = toast.loading(`Optimizing ${selected.length} image(s)...`);
    const compressedResults = await Promise.all(selected.map(file => compressAndResizeImage(file)));

    const newItems = compressedResults.map((res, idx) => ({
      file: res.file,
      preview: res.preview,
      originalSize: res.originalSize,
      compressedSize: res.compressedSize,
      isPrimary: editGalleryImages.length === 0 && idx === 0
    }));

    setEditGalleryImages(prev => [...prev, ...newItems]);
    toast.dismiss(toastId);
    toast.success("Images optimized!");
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("price", formData.price);
      data.append("stock", formData.stock);
      data.append("description", formData.description);
      if (formData.category_id) data.append("category_id", formData.category_id);
      if (formData.sub_category) data.append("sub_category", formData.sub_category);
      data.append("size_stock", JSON.stringify(sizeStockMap));

      const primaryItem = galleryFiles.find(g => g.isPrimary) || galleryFiles[0];
      if (primaryItem && primaryItem.file) {
        data.append("image", primaryItem.file);
      } else if (image) {
        data.append("image", image);
      } else {
        throw new Error("Please select at least 1 image for the product");
      }

      galleryFiles.forEach(g => {
        if (g.file && g !== primaryItem) {
          data.append("images", g.file);
        }
      });

      const res = await fetch(`${API_BASE_URL}/api/products/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: data
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || result.error || "Failed to upload product");

      toast.success("Product successfully created in catalog!");
      setFormData({ name: "", price: "", stock: "", description: "", category_id: "", sub_category: "", sizes: "" });
      setSizeStockMap({ "38": 10, "40": 10, "42": 5 });
      setImage(null);
      setGalleryFiles([]);
      e.target.reset();
      fetchDashboardData();
      refreshGlobalProducts();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("admin_calendar_notes", JSON.stringify(calendarNotes));
  }, [calendarNotes]);

  useEffect(() => {
    const el = addFormRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const isScrollable = scrollHeight > clientHeight;

      if (isScrollable) {
        el.scrollTop += e.deltaY;
        e.preventDefault();
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [activeTab]);

  const handleCreateCategory = async (e) => {
    if (e) e.preventDefault();
    if (!newCategoryName.trim()) return toast.error("Category name is required");
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create category");
      toast.success(`Category "${data.name}" created!`);
      setNewCategoryName("");
      setShowAddCategoryInline(false);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete category");
      toast.success("Category deleted");
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = { "Authorization": `Bearer ${token}` };

      const [statsRes, prodRes, ordRes, catRes, couponRes, reviewRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/stats`, { headers }),
        fetch(`${API_BASE_URL}/api/products`, { headers }),
        fetch(`${API_BASE_URL}/api/orders/all`, { headers }),
        fetch(`${API_BASE_URL}/api/categories`, { headers }),
        fetch(`${API_BASE_URL}/api/coupons`, { headers }),
        fetch(`${API_BASE_URL}/api/reviews/all`, { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (prodRes.ok) {
        const pData = await prodRes.json();
        const pList = Array.isArray(pData) ? pData : (pData?.products || []);
        if (pList.length > 0) {
          setProducts(pList);
        }
      }
      if (ordRes.ok) setOrders(await ordRes.json());
      if (catRes.ok) {
        const cData = await catRes.json();
        if (Array.isArray(cData) && cData.length > 0) {
          setCategories(cData);
        }
      }
      if (couponRes.ok) setCouponsList(await couponRes.json());
      if (reviewRes.ok) setAdminReviewsList(await reviewRes.json());
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCouponSubmit = async (e) => {
    e.preventDefault();
    if (!newCouponForm.code.trim()) return toast.error("Coupon code required");
    try {
      const res = await fetch(`${API_BASE_URL}/api/coupons`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newCouponForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create coupon");
      toast.success(`Coupon ${data.code} created successfully!`);
      setNewCouponForm({ code: "", discount_percent: "", discount_flat: "", min_order_value: "" });
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Delete this promo coupon?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/coupons/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete coupon");
      toast.success("Coupon deleted!");
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSendEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailForm.message.trim()) return toast.error("Message body is required");
    setSendingEmail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/send-email`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(emailForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");
      toast.success(data.message || "Email sent successfully!");
      setEmailForm({ target: "single", recipientEmail: "", subject: "", message: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm("Delete this customer review?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete review");
      toast.success("Review deleted");
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Failed to delete product");
      toast.success("Product deleted successfully");
      fetchDashboardData();
      refreshGlobalProducts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(`Order #${orderId} status updated to ${formatStatus(newStatus)}`);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleVerifyPayment = async (orderId) => {
    if (!window.confirm(`Verify and approve UPI Payment for Order #SUKO-${1000 + orderId}?\n\nThis will confirm the payment, mark the order as PAID, and dispatch the official tax invoice to the client.`)) return;
    setVerifyingOrderId(orderId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/verify-payment`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify payment");
      toast.success(`Payment verified for Order #SUKO-${1000 + orderId}! Official tax invoice dispatched.`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "paid" } : o));
      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails(prev => ({ ...prev, status: "paid" }));
      }
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setVerifyingOrderId(null);
    }
  };

  const handleRejectPayment = async (orderId) => {
    const reason = window.prompt("Reason for rejecting payment proof (will be shown to the client):", "Payment not reflected in merchant bank account / UTR mismatch");
    if (reason === null) return;
    setRejectingOrderId(orderId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/reject-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reason.trim() || "Payment verification failed" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject payment");
      toast.warning(`Order #SUKO-${1000 + orderId} payment marked as rejected. Customer can re-submit.`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "payment_verification_failed", cancel_reason: reason.trim() } : o));
      if (selectedOrderDetails && selectedOrderDetails.id === orderId) {
        setSelectedOrderDetails(prev => ({ ...prev, status: "payment_verification_failed", cancel_reason: reason.trim() }));
      }
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRejectingOrderId(null);
    }
  };

  // Export CSV
  const exportOrdersCSV = () => {
    if (!orders || orders.length === 0) {
      toast.error("No orders available to export");
      return;
    }
    const headers = ["Order ID", "Date", "Customer Email", "Total Amount (INR)", "Status", "Items Count"];
    const rows = orders.map(o => [
      `SUKO-${1000 + o.id}`,
      new Date(o.created_at || Date.now()).toLocaleDateString("en-IN"),
      o.user?.email || "Guest Client",
      o.total,
      o.status,
      o.items?.length || 1
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Suko_Orders_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders CSV exported successfully!");
  };

  // Calendar Helpers
  const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const key = dateKey(selectedDate);
    const currentNotes = calendarNotes[key] || [];
    setCalendarNotes({
      ...calendarNotes,
      [key]: [...currentNotes, { id: Date.now(), text: noteInput }]
    });
    setNoteInput("");
    toast.success("Note added for " + selectedDate.toLocaleDateString());
  };

  const handleDeleteNote = (dateStr, noteId) => {
    const currentNotes = calendarNotes[dateStr] || [];
    const updated = currentNotes.filter(n => n.id !== noteId);
    setCalendarNotes({
      ...calendarNotes,
      [dateStr]: updated
    });
  };

  // Days in current month grid
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const catName = typeof p.category === 'object' ? (p.category?.name || "") : (p.categoryName || p.category || "");
    const catLower = catName.toLowerCase();
    const nameLower = (p.name || "").toLowerCase();

    const isWomens = p.gender === "female" || catLower.includes("women") || nameLower.includes("female") || nameLower.includes("women") || true;
    const isMens = p.gender === "male" || (!isWomens && (catLower.includes("men") || nameLower.includes("male") || nameLower.includes("mens")));

    if (productGenderFilter === "mens" && !isMens) return false;
    if (productGenderFilter === "womens" && !isWomens) return false;
    if (productGenderFilter === "low_stock" && p.stock >= 5) return false;

    const matchesSearch = nameLower.includes(productSearch.toLowerCase()) || catLower.includes(productSearch.toLowerCase());
    const matchesCat = selectedCategory === "all" || 
      String(p.category_id) === String(selectedCategory) ||
      String(p.category?.id) === String(selectedCategory) ||
      String(p.category?.slug) === String(selectedCategory) ||
      String(p.category) === String(selectedCategory);
    return matchesSearch && matchesCat;
  });

  // Filtered Orders (by Status & Date Range)
  const cancellationRequests = orders.filter(o => o.status === "cancel_requested");
  const verificationRequests = orders.filter(o => o.status === "payment_verification_pending");
  const failedVerificationOrders = orders.filter(o => o.status === "payment_verification_failed" || (o.cancel_reason && o.cancel_reason.toLowerCase().includes("payment")) || (o.cancel_reason && o.cancel_reason.toLowerCase().includes("bank")));
  const pendingVerificationAmount = verificationRequests.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  const paidOrdersList = orders.filter(o => o.status === "paid" || o.status === "completed");

  // Safeguard #2: Financially valid paid status check (excludes pending, verification pending, failed, cancelled)
  const isFinanciallyPaid = (status) => {
    const s = (status || "").toLowerCase();
    return s === "paid" || s === "completed" || s === "processing" || s === "delivered";
  };

  const allPaidOrders = orders.filter(o => isFinanciallyPaid(o.status));

  const filteredOrders = orders.filter(o => {
    // 1. Status Filter
    if (orderStatusFilter !== "all") {
      if (orderStatusFilter === "paid" && !isFinanciallyPaid(o.status)) return false;
      if (orderStatusFilter !== "paid" && o.status !== orderStatusFilter) return false;
    }

    // 2. Date Filter
    const orderDate = new Date(o.created_at || Date.now());
    const now = new Date();

    if (datePreset === "today") {
      if (orderDate.toDateString() !== now.toDateString()) return false;
    } else if (datePreset === "7days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      if (orderDate < sevenDaysAgo) return false;
    } else if (datePreset === "month") {
      if (orderDate.getMonth() !== now.getMonth() || orderDate.getFullYear() !== now.getFullYear()) return false;
    } else if (datePreset === "custom") {
      if (startDate) {
        const s = new Date(startDate);
        if (orderDate < s) return false;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        if (orderDate > e) return false;
      }
    }

    return true;
  });

  // Safeguard #2: Calculate Date-filtered Revenue from legitimate paid orders only
  const filteredPaidOrders = filteredOrders.filter(o => isFinanciallyPaid(o.status));
  const filteredRevenue = filteredPaidOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  const filteredDeliveredCount = filteredOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length;

  // Low stock products (< 5)
  const lowStockProducts = products.filter(p => p.stock < 5);

  // Safeguard #4: Real SVG chart data grouped strictly from filteredPaidOrders
  const trendMap = {};
  filteredPaidOrders.forEach(o => {
    const d = new Date(o.created_at || Date.now());
    const dateKey = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    if (!trendMap[dateKey]) {
      trendMap[dateKey] = { label: dateKey, revenue: 0, count: 0, rawDate: d.getTime() };
    }
    trendMap[dateKey].revenue += (parseFloat(o.total) || 0);
    trendMap[dateKey].count += 1;
  });
  const chartData = Object.values(trendMap).sort((a, b) => a.rawDate - b.rawDate);

  // Helper for luxury formatted date range label
  const getActiveDateRangeLabel = () => {
    const now = new Date();
    const opts = { day: "2-digit", month: "short", year: "numeric" };
    if (datePreset === "today") {
      return now.toLocaleDateString("en-IN", opts);
    }
    if (datePreset === "7days") {
      const past = new Date();
      past.setDate(now.getDate() - 6);
      return `${past.toLocaleDateString("en-IN", opts)} — ${now.toLocaleDateString("en-IN", opts)}`;
    }
    if (datePreset === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return `${start.toLocaleDateString("en-IN", opts)} — ${now.toLocaleDateString("en-IN", opts)}`;
    }
    if (datePreset === "custom") {
      if (startDate && endDate) {
        return `${new Date(startDate).toLocaleDateString("en-IN", opts)} — ${new Date(endDate).toLocaleDateString("en-IN", opts)}`;
      }
      if (startDate) return `From ${new Date(startDate).toLocaleDateString("en-IN", opts)}`;
      if (endDate) return `Until ${new Date(endDate).toLocaleDateString("en-IN", opts)}`;
      return "Select Date Range";
    }
    return `Fiscal ${now.getFullYear()} · All Records`;
  };

  // Continuous timeline for Financial Chart (ensures elegant multi-point curve)
  const getContinuousTimeline = () => {
    if (chartData.length >= 4) return chartData;

    const days = 7;
    const timeline = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      const fullDate = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

      let rev = 0;
      let count = 0;
      filteredPaidOrders.forEach(o => {
        const od = new Date(o.created_at || Date.now());
        if (od.toDateString() === d.toDateString()) {
          rev += (parseFloat(o.total) || 0);
          count += 1;
        }
      });

      timeline.push({
        label,
        date: fullDate,
        revenue: rev,
        count,
        rawDate: d.getTime()
      });
    }

    if (filteredRevenue > 0 && timeline.every(t => t.revenue === 0) && chartData.length > 0) {
      return chartData;
    }

    return timeline;
  };

  const activeChartData = getContinuousTimeline();

  // Safeguard #6: Top Selling Products derived from real paid order line items
  const topSellingMap = {};
  allPaidOrders.forEach(order => {
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach(item => {
      const key = item.product_id || item.product_name || item.name || "garment";
      if (!topSellingMap[key]) {
        topSellingMap[key] = {
          id: item.product_id,
          name: item.product_name || item.name || "Tailored Garment",
          image: item.product_image_url || item.image_url || "",
          qty: 0,
          revenue: 0,
          category: item.category_name || ""
        };
      }
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price_at_purchase || item.price) || 0;
      topSellingMap[key].qty += qty;
      topSellingMap[key].revenue += (price * qty);
    });
  });

  const topSellingPieces = Object.values(topSellingMap)
    .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
    .slice(0, 5)
    .map(ts => {
      const matchedProd = products.find(p => p.id === ts.id || p.name === ts.name);
      return {
        ...ts,
        image: matchedProd?.image_url || (matchedProd?.images && matchedProd.images[0]) || ts.image || "",
        category: ts.category || matchedProd?.category?.name || matchedProd?.sub_category || ""
      };
    });

  // Safeguards #1 & #6: Authentic SUKO taxonomy & Category Performance from actual catalogue & paid orders
  const validCategories = (categories && categories.length > 0)
    ? categories.map(c => c.name)
    : ["Power Suits & Sets", "Blazers", "Trousers", "Vests & Co-ords", "Signature Pieces"];

  const categoryPerformance = validCategories.map(catName => {
    const target = catName.toLowerCase();
    const prodsInCat = products.filter(p => {
      const pCat = (p.category?.name || p.sub_category || p.category || "").toLowerCase();
      return pCat === target || pCat.includes(target) || target.includes(pCat);
    });

    let catRevenue = 0;
    let catOrdersCount = 0;
    allPaidOrders.forEach(order => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach(item => {
        const iCat = (item.category_name || "").toLowerCase();
        const matchedProd = products.find(p => p.id === item.product_id);
        const pCat = (matchedProd?.category?.name || matchedProd?.sub_category || "").toLowerCase();
        if (iCat === target || pCat === target || iCat.includes(target) || pCat.includes(target)) {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price_at_purchase || item.price) || 0;
          catRevenue += (price * qty);
          catOrdersCount += qty;
        }
      });
    });

    return {
      name: catName,
      productCount: prodsInCat.length,
      revenue: catRevenue,
      soldCount: catOrdersCount
    };
  });

  // Real client directory derived from actual orders (Safeguard #5)
  const clientMap = {};
  orders.forEach(o => {
    const email = o.email || o.user?.email || `client-${o.user_id || o.id}@client.suko`;
    if (!clientMap[email]) {
      clientMap[email] = {
        name: o.name || o.shipping_name || o.user?.name || "Client",
        email: email,
        phone: o.phone || o.shipping_phone || o.user?.phone || "—",
        city: o.city || o.shipping_city || "—",
        totalSpent: 0,
        ordersCount: 0,
        lastOrderDate: o.created_at,
        lastStatus: o.status
      };
    }
    clientMap[email].ordersCount += 1;
    if (isFinanciallyPaid(o.status)) {
      clientMap[email].totalSpent += (parseFloat(o.total) || 0);
    }
    if (new Date(o.created_at) > new Date(clientMap[email].lastOrderDate)) {
      clientMap[email].lastOrderDate = o.created_at;
      clientMap[email].lastStatus = o.status;
    }
  });

  const uniqueClientsList = Object.values(clientMap).sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate));

  if (!user?.authenticated) return <Navigate to="/auth" />;
  if (user.role !== "admin") return <Navigate to="/" />;

  return (
    <div
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      data-lenis-prevent-touch="true"
      className="h-screen w-full bg-[#F7F3ED] text-[#171717] flex flex-col md:flex-row font-body selection:bg-[#C2922E] selection:text-white relative overflow-hidden"
    >

      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={closeMobileSidebar}
        />
      )}

      {/* ============================================================= */}
      {/* 1. FIXED LEFT SIDEBAR NAVIGATION (270px)                      */}
      {/* ============================================================= */}
      {/* ============================================================= */}
      {/* 1. FIXED LEFT SIDEBAR NAVIGATION (3-ZONE ARCHITECTURE)        */}
      {/* ============================================================= */}
      <aside
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        className={`fixed md:relative inset-y-0 left-0 h-screen w-[270px] min-w-[270px] max-w-[270px] shrink-0 bg-[#F7F3ED] border-r border-[#E5DDD1] flex flex-col z-40 transition-transform duration-300 overflow-hidden ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >
        {/* Zone 1: Fixed Brand Header */}
        <div className="shrink-0 p-4.5 sm:p-5 pb-4 border-b border-[#E5DDD1] bg-[#F7F3ED] relative">
          <div className="flex items-start justify-between">
            <Link to="/" className="inline-block group" onClick={() => closeMobileSidebar(true)}>
              <img
                src="/logo.png"
                alt="SUKO Atelier"
                className="h-[56px] sm:h-[60px] w-auto max-w-[145px] object-contain object-left transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </Link>
            <button
              type="button"
              onClick={closeMobileSidebar}
              className="md:hidden p-1 text-[#746F68] hover:text-[#171717] cursor-pointer"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-2.5 space-y-1">
            <span className="font-serif text-[14px] tracking-[0.14em] uppercase text-[#171717] font-medium block leading-none">
              SUKO ATELIER
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-[#A77B1E] font-mono font-medium block leading-none">
              STUDIO CONTROL
            </span>
          </div>
        </div>

        {/* Zone 2: Scrollable Navigation Area */}
        <nav
          data-lenis-prevent="true"
          className="flex-1 overflow-y-auto overscroll-contain suko-scrollbar px-4.5 sm:px-5 py-3 space-y-3"
        >
          {/* ATELIER CHAPTER */}
          <div>
            <span className="text-[9px] uppercase tracking-[0.10em] text-[#8E877E] font-mono font-semibold px-2 block mb-1">
              ATELIER
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => { setActiveTab("overview"); closeMobileSidebar(true); }}
                className={`w-full text-[12.5px] tracking-[0.02em] py-1.5 px-2.5 rounded-r-[4px] rounded-l-none flex items-center justify-between transition-all cursor-pointer ${activeTab === "overview"
                    ? "bg-[#EFE9DF]/55 text-[#111113] font-medium border-l-[2.5px] border-[#C2922E]"
                    : "text-[#3D3A35] hover:text-[#111113] hover:bg-[#EFE9DF]/40 border-l-[2.5px] border-transparent font-normal sm:font-medium"
                  }`}
              >
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("orders"); closeMobileSidebar(true); }}
                className={`w-full text-[12.5px] tracking-[0.02em] py-1.5 px-2.5 rounded-r-[4px] rounded-l-none flex items-center justify-between transition-all cursor-pointer ${activeTab === "orders"
                    ? "bg-[#EFE9DF]/55 text-[#111113] font-medium border-l-[2.5px] border-[#C2922E]"
                    : "text-[#3D3A35] hover:text-[#111113] hover:bg-[#EFE9DF]/40 border-l-[2.5px] border-transparent font-normal sm:font-medium"
                  }`}
              >
                <span>Orders</span>
                {cancellationRequests.length > 0 && (
                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-[2px] bg-transparent text-[#8B3A3A] border border-[#D9A4A4]">
                    {cancellationRequests.length} Cancel
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("payments"); closeMobileSidebar(true); }}
                className={`w-full text-[12.5px] tracking-[0.02em] py-1.5 px-2.5 rounded-r-[4px] rounded-l-none flex items-center justify-between transition-all cursor-pointer ${activeTab === "payments"
                    ? "bg-[#EFE9DF]/55 text-[#111113] font-medium border-l-[2.5px] border-[#C2922E]"
                    : "text-[#3D3A35] hover:text-[#111113] hover:bg-[#EFE9DF]/40 border-l-[2.5px] border-transparent font-normal sm:font-medium"
                  }`}
              >
                <span>Payments Desk</span>
                {verificationRequests.length > 0 && (
                  <span className="text-[9.5px] font-mono text-amber-900 font-semibold bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                    {verificationRequests.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* CATALOGUE CHAPTER */}
          <div>
            <span className="text-[9px] uppercase tracking-[0.10em] text-[#8E877E] font-mono font-semibold px-2 block mb-1">
              CATALOGUE
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => { setActiveTab("products"); closeMobileSidebar(true); }}
                className={`w-full text-[12.5px] tracking-[0.02em] py-1.5 px-2.5 rounded-r-[4px] rounded-l-none flex items-center justify-between transition-all cursor-pointer ${activeTab === "products"
                    ? "bg-[#EFE9DF]/55 text-[#111113] font-medium border-l-[2.5px] border-[#C2922E]"
                    : "text-[#3D3A35] hover:text-[#111113] hover:bg-[#EFE9DF]/40 border-l-[2.5px] border-transparent font-normal sm:font-medium"
                  }`}
              >
                <span>Garment Archive</span>
                {lowStockProducts.length > 0 && (
                  <span className="text-[10px] font-mono text-amber-800 font-medium">
                    ({lowStockProducts.length})
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("categories"); closeMobileSidebar(true); }}
                className={`w-full text-[12.5px] tracking-[0.02em] py-1.5 px-2.5 rounded-r-[4px] rounded-l-none flex items-center justify-between transition-all cursor-pointer ${activeTab === "categories"
                    ? "bg-[#EFE9DF]/55 text-[#111113] font-medium border-l-[2.5px] border-[#C2922E]"
                    : "text-[#3D3A35] hover:text-[#111113] hover:bg-[#EFE9DF]/40 border-l-[2.5px] border-transparent font-normal sm:font-medium"
                  }`}
              >
                <span>Collection Structure</span>
              </button>
            </div>
          </div>

          {/* CLIENTS CHAPTER */}
          <div>
            <span className="text-[9px] uppercase tracking-[0.10em] text-[#8E877E] font-mono font-semibold px-2 block mb-1">
              CLIENTS
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => { setActiveTab("customers"); closeMobileSidebar(true); }}
                className={`w-full text-[12.5px] tracking-[0.02em] py-1.5 px-2.5 rounded-r-[4px] rounded-l-none flex items-center justify-between transition-all cursor-pointer ${activeTab === "customers"
                    ? "bg-[#EFE9DF]/55 text-[#111113] font-medium border-l-[2.5px] border-[#C2922E]"
                    : "text-[#3D3A35] hover:text-[#111113] hover:bg-[#EFE9DF]/40 border-l-[2.5px] border-transparent font-normal sm:font-medium"
                  }`}
              >
                <span>Customers</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("reviews"); closeMobileSidebar(true); }}
                className={`w-full text-[12.5px] tracking-[0.02em] py-1.5 px-2.5 rounded-r-[4px] rounded-l-none flex items-center justify-between transition-all cursor-pointer ${activeTab === "reviews"
                    ? "bg-[#EFE9DF]/55 text-[#111113] font-medium border-l-[2.5px] border-[#C2922E]"
                    : "text-[#3D3A35] hover:text-[#111113] hover:bg-[#EFE9DF]/40 border-l-[2.5px] border-transparent font-normal sm:font-medium"
                  }`}
              >
                <span>Reviews</span>
              </button>
            </div>
          </div>

          {/* DISPATCH CHAPTER */}
          <div>
            <span className="text-[9px] uppercase tracking-[0.10em] text-[#8E877E] font-mono font-semibold px-2 block mb-1">
              DISPATCH
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => { setActiveTab("coupons"); closeMobileSidebar(true); }}
                className={`w-full text-[12.5px] tracking-[0.02em] py-1.5 px-2.5 rounded-r-[4px] rounded-l-none flex items-center justify-between transition-all cursor-pointer ${activeTab === "coupons"
                    ? "bg-[#EFE9DF]/55 text-[#111113] font-medium border-l-[2.5px] border-[#C2922E]"
                    : "text-[#3D3A35] hover:text-[#111113] hover:bg-[#EFE9DF]/40 border-l-[2.5px] border-transparent font-normal sm:font-medium"
                  }`}
              >
                <span>Coupons</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("broadcast"); closeMobileSidebar(true); }}
                className={`w-full text-[12.5px] tracking-[0.02em] py-1.5 px-2.5 rounded-r-[4px] rounded-l-none flex items-center justify-between transition-all cursor-pointer ${activeTab === "broadcast"
                    ? "bg-[#EFE9DF]/55 text-[#111113] font-medium border-l-[2.5px] border-[#C2922E]"
                    : "text-[#3D3A35] hover:text-[#111113] hover:bg-[#EFE9DF]/40 border-l-[2.5px] border-transparent font-normal sm:font-medium"
                  }`}
              >
                <span>Broadcast</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("calendar"); closeMobileSidebar(true); }}
                className={`w-full text-[12.5px] tracking-[0.02em] py-1.5 px-2.5 rounded-r-[4px] rounded-l-none flex items-center justify-between transition-all cursor-pointer ${activeTab === "calendar"
                    ? "bg-[#EFE9DF]/55 text-[#111113] font-medium border-l-[2.5px] border-[#C2922E]"
                    : "text-[#3D3A35] hover:text-[#111113] hover:bg-[#EFE9DF]/40 border-l-[2.5px] border-transparent font-normal sm:font-medium"
                  }`}
              >
                <span>Schedule</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Zone 3: Fixed Footer Controls */}
        <div className="shrink-0 p-4.5 sm:p-5 pt-3.5 pb-4.5 border-t border-[#E5DDD1] bg-[#F7F3ED] space-y-2.5">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              to="/"
              onClick={() => closeMobileSidebar(true)}
              className="py-2 px-2.5 rounded-[4px] bg-[#FAF8F5] hover:bg-[#EFE9DF] border border-[#E5DDD1] text-[11px] text-[#171717] font-medium transition-colors flex items-center justify-between group cursor-pointer"
              title="Open Storefront"
            >
              <span>Storefront</span>
              <ArrowUpRight size={12} className="text-[#78726A] group-hover:text-[#171717]" />
            </Link>

            <button
              type="button"
              onClick={exportOrdersCSV}
              className="py-2 px-2.5 rounded-[4px] bg-[#FAF8F5] hover:bg-[#EFE9DF] border border-[#E5DDD1] text-[11px] text-[#171717] font-medium transition-colors flex items-center justify-between group cursor-pointer"
              title="Export Orders CSV"
            >
              <span>Export CSV</span>
              <Download size={12} className="text-[#A77B1E]" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              closeMobileSidebar(true);
              if (logout) logout();
            }}
            className="w-full py-1.5 px-2.5 text-[11px] text-[#746F68] hover:text-[#171717] hover:bg-[#EFE9DF]/50 rounded-[4px] transition-colors flex items-center justify-between cursor-pointer font-medium"
          >
            <span>Sign Out</span>
            <LogOut size={12} className="text-[#746F68]" />
          </button>
        </div>
      </aside>

      {/* ============================================================= */}
      {/* 2. MAIN ATELIER CONTENT AREA                                  */}
      {/* ============================================================= */}
      <div
        data-lenis-prevent="true"
        data-lenis-prevent-wheel="true"
        data-lenis-prevent-touch="true"
        className="flex-1 min-w-0 bg-[#F7F3ED] flex flex-col h-screen overflow-y-auto overscroll-contain suko-scrollbar"
      >

        {/* Atelier Top Header Bar (Sleek ~54px) */}
        <header className="h-13 sm:h-14 bg-[#F7F3ED]/95 backdrop-blur-md border-b border-[#E5DDD1] px-5 sm:px-8 lg:px-10 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={isMobileSidebarOpen ? closeMobileSidebar : openMobileSidebar}
              className="md:hidden p-1.5 text-[#171717] hover:bg-[#EFE9DF] rounded transition-colors cursor-pointer"
              aria-label="Toggle navigation drawer"
            >
              <Menu size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-base sm:text-[17px] font-normal text-[#171717] tracking-tight leading-none">
                  {activeTab === "overview" && "Studio Control"}
                  {activeTab === "products" && "Garment Archive"}
                  {activeTab === "categories" && "Collection Structure"}
                  {activeTab === "orders" && "Atelier Orders"}
                  {activeTab === "payments" && "Payment Reconciliation Desk"}
                  {activeTab === "coupons" && "Coupons & Vouchers"}
                  {activeTab === "customers" && "Client Directory"}
                  {activeTab === "reviews" && "Client Reviews Moderation"}
                  {activeTab === "broadcast" && "Concierge Broadcast"}
                  {activeTab === "calendar" && "Schedule & Calendar"}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {/* Restrained Quick Text Action */}
            <button
              type="button"
              onClick={() => { setActiveTab("categories"); setShowAddCategoryInline(false); }}
              className="hidden sm:inline-flex items-center gap-1 text-xs text-[#55514B] hover:text-[#171717] transition-colors cursor-pointer font-medium tracking-normal"
            >
              <span>+ New Piece</span>
            </button>

            {/* Notifications Bell for UPI verifications */}
            <button
              type="button"
              onClick={() => setActiveTab("payments")}
              className="relative p-1.5 text-[#55514B] hover:text-[#171717] hover:bg-[#EFE9DF]/50 rounded transition-colors cursor-pointer"
              title={verificationRequests.length > 0 ? `${verificationRequests.length} pending UPI verifications` : "No pending verifications"}
            >
              <Bell size={16} />
              {verificationRequests.length > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#C2922E]" />
              )}
            </button>

            {/* Minimal Studio Admin Profile Trigger & Popover */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-1.5 text-xs text-[#171717] hover:text-[#C2922E] font-medium cursor-pointer transition-colors select-none py-1.5 px-2 rounded hover:bg-[#EFE9DF]/50"
                aria-expanded={isProfileDropdownOpen}
                aria-haspopup="true"
              >
                <span>Studio Admin</span>
                <ChevronDown
                  size={12}
                  className={`text-[#8E877E] transition-transform duration-200 ${isProfileDropdownOpen ? "rotate-180 text-[#C2922E]" : ""}`}
                />
              </button>

              {/* Profile Dropdown Popover */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-[#FAF8F5] border border-[#E5DDD1] shadow-lg rounded-[2px] py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* Account Header */}
                  <div className="px-3.5 py-2.5 border-b border-[#E5DDD1]">
                    <span className="text-[9px] uppercase tracking-[0.14em] text-[#C2922E] font-mono font-medium block mb-1">
                      ADMINISTRATION
                    </span>
                    <p className="font-serif text-sm font-normal text-[#171717] truncate">
                      {user?.name || "Studio Administrator"}
                    </p>
                    <p className="text-[11px] text-[#55514B] font-mono truncate">
                      {user?.email || "admin@indiancorporatewear.com"}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#EFE9DF] text-[9.5px] font-mono text-[#171717] uppercase tracking-wider">
                      <ShieldCheck size={11} className="text-[#C2922E]" />
                      <span>{user?.role === "admin" ? "Master Admin" : "Studio Admin"}</span>
                    </div>
                  </div>

                  {/* Quick Atelier Actions */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => { setActiveTab("overview"); setIsProfileDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs text-[#55514B] hover:text-[#171717] hover:bg-[#EFE9DF]/60 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>Studio Overview</span>
                      <span className="text-[10px] font-mono text-[#8E877E]">&rarr;</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveTab("orders"); setIsProfileDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs text-[#55514B] hover:text-[#171717] hover:bg-[#EFE9DF]/60 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>All Orders</span>
                      <span className="text-[10px] font-mono text-[#8E877E]">{orders.length}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveTab("payments"); setIsProfileDropdownOpen(false); }}
                      className="w-full px-3.5 py-2 text-left text-xs text-[#55514B] hover:text-[#171717] hover:bg-[#EFE9DF]/60 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>Payment Verifications</span>
                      {verificationRequests.length > 0 && (
                        <span className="text-[10px] font-mono text-amber-900 bg-amber-500/20 px-1 rounded">
                          {verificationRequests.length}
                        </span>
                      )}
                    </button>

                    <Link
                      to="/"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="w-full px-3.5 py-2 text-left text-xs text-[#55514B] hover:text-[#171717] hover:bg-[#EFE9DF]/60 transition-colors flex items-center justify-between"
                    >
                      <span>View Storefront</span>
                      <ArrowUpRight size={12} className="text-[#8E877E]" />
                    </Link>
                  </div>

                  {/* Sign Out Section */}
                  <div className="pt-1 mt-1 border-t border-[#E5DDD1]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        if (logout) logout();
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs text-rose-900/80 hover:text-rose-900 hover:bg-rose-500/10 transition-colors flex items-center justify-between cursor-pointer font-medium"
                    >
                      <span>Sign Out</span>
                      <span className="text-[10px] font-mono">&times;</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Storefront Link */}
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-[#55514B] hover:text-[#171717] transition-colors tracking-normal font-medium"
            >
              <span>Storefront</span>
              <ArrowUpRight size={12} className="text-[#8E877E]" />
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 space-y-4 sm:space-y-5 max-w-[1440px] w-full">
          {loading ? (
            <div className="text-center py-16 text-[#746F68] text-xs flex items-center justify-center gap-3 font-light">
              <div className="w-4 h-4 rounded-full border-2 border-[#171717] border-t-transparent animate-spin" />
              <span>Loading Studio Control...</span>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">

              {/* ============================================================= */}
              {/* OVERVIEW TAB (Private Luxury Atelier Operational Registry)    */}
              {/* ============================================================= */}
              {activeTab === "overview" && (
                <div className="space-y-6">

                  {/* 1. ATELIER OPERATIONS HEADER */}
                  <div className="pb-4 border-b border-[#E5DDD1] flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-[0.14em] text-[#C2922E] font-mono font-medium">
                          Maison Performance &middot; {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <span className="text-[9.5px] font-mono text-[#78726A] border border-[#E5DDD1] px-1.5 py-0.2 rounded-[2px] bg-[#FAF8F5]">
                          INR (&#8377;)
                        </span>
                      </div>
                      <h2 className="font-serif text-2xl sm:text-3xl lg:text-[32px] font-normal text-[#171717] tracking-tight leading-tight">
                        Atelier Operations
                      </h2>
                      <p className="text-xs text-[#55514B] font-normal max-w-lg">
                        A private view of orders, collections and client activity.
                      </p>
                    </div>

                    {/* Filter Presets */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 tracking-normal self-end text-xs">
                      {[
                        { id: "all", label: "All Records" },
                        { id: "today", label: "Today" },
                        { id: "7days", label: "This Week" },
                        { id: "month", label: "This Month" },
                        { id: "custom", label: "Custom" },
                      ].map((preset, idx, arr) => (
                        <React.Fragment key={preset.id}>
                          <button
                            type="button"
                            onClick={() => setDatePreset(preset.id)}
                            className={`pb-0.5 transition-all cursor-pointer font-medium text-xs ${datePreset === preset.id
                                ? "border-b-2 border-[#171717] text-[#171717] font-semibold"
                                : "border-b-2 border-transparent text-[#55514B] hover:text-[#171717]"
                              }`}
                          >
                            {preset.label}
                          </button>
                          {idx < arr.length - 1 && <span className="text-[#C5BDB2] select-none text-xs">|</span>}
                        </React.Fragment>
                      ))}

                      {datePreset === "custom" && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] ml-1 bg-[#FAF8F5] border border-[#E5DDD1] px-2 py-0.5 rounded-[2px]">
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-[#171717] outline-none text-[11px] cursor-pointer"
                          />
                          <span className="text-[#78726A]">&mdash;</span>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-[#171717] outline-none text-[11px] cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. ATELIER PERFORMANCE LEDGER (Direct Hero Impact) */}
                  <div className="border-b border-[#E5DDD1] pb-6 pt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E5DDD1]">

                    {/* Folio 1: Revenue Generated */}
                    <div className="py-3 sm:py-2 sm:px-6 first:pl-0 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-[0.08em] text-[#66615B] font-mono font-semibold">
                          REVENUE GENERATED
                        </span>
                        <span className="text-[10px] font-mono text-[#78726A] border border-[#E5DDD1] px-1.5 py-0.5 rounded-[2px] bg-[#FAF8F5]">
                          &#8377; INR
                        </span>
                      </div>
                      <div className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#111113] tracking-tight truncate leading-none my-3.5">
                        {formatINR(filteredRevenue)}
                      </div>
                      <p className="text-xs text-[#55514B] font-normal truncate">
                        {datePreset === "all" ? "Verified settlements" : `Settlements in ${datePreset === "today" ? "Today" : datePreset === "7days" ? "This Week" : datePreset === "month" ? "This Month" : "Selected Period"}`}
                      </p>
                    </div>

                    {/* Folio 2: Orders Completed */}
                    <div className="py-3 sm:py-2 sm:px-6 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-[0.08em] text-[#66615B] font-mono font-semibold">
                          ORDERS COMPLETED
                        </span>
                        {verificationRequests.length > 0 && (
                          <span className="text-[9.5px] font-mono text-amber-900 font-semibold bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                            {verificationRequests.length} Pending
                          </span>
                        )}
                      </div>
                      <div className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#111113] tracking-tight leading-none my-3.5">
                        {String(filteredPaidOrders.length).padStart(2, '0')}
                      </div>
                      <p className="text-xs text-[#55514B] font-normal truncate">
                        {filteredPaidOrders.length} Reconciled &middot; {verificationRequests.length} Pending
                      </p>
                    </div>

                    {/* Folio 3: Active Pieces */}
                    <div className="py-3 sm:py-2 sm:px-6 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-[0.08em] text-[#66615B] font-mono font-semibold">
                          ACTIVE PIECES
                        </span>
                        {lowStockProducts.length > 0 && (
                          <span className="text-[9.5px] font-mono text-amber-900 font-semibold bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                            {lowStockProducts.length} Low
                          </span>
                        )}
                      </div>
                      <div className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#111113] tracking-tight leading-none my-3.5">
                        {String(stats.totalProducts).padStart(2, '0')}
                      </div>
                      <p className="text-xs text-[#55514B] font-normal truncate">
                        {lowStockProducts.length > 0 ? `${lowStockProducts.length} Pieces low in stock` : "Inventory healthy"}
                      </p>
                    </div>

                    {/* Folio 4: Registered Clients */}
                    <div className="py-3 sm:py-2 sm:px-6 last:pr-0 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-[0.08em] text-[#66615B] font-mono font-semibold">
                          REGISTERED CLIENTS
                        </span>
                        <span className="text-[10px] font-mono text-[#78726A] border border-[#E5DDD1] px-1.5 py-0.5 rounded-[2px] bg-[#FAF8F5]">
                          Directory
                        </span>
                      </div>
                      <div className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#111113] tracking-tight leading-none my-3.5">
                        {String(stats.totalUsers).padStart(2, '0')}
                      </div>
                      <p className="text-xs text-[#55514B] font-normal truncate">
                        Client accounts on record
                      </p>
                    </div>
                  </div>

                  {/* 4. FINANCIAL LEDGER & RECENT ORDERS (Open 2-Column Spread with Vertical Hairline) */}
                  <div className="border-b border-[#E5DDD1] pb-6 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E5DDD1] gap-6 lg:gap-0 items-start">

                    {/* LEFT: Financial Ledger (7 cols) */}
                    <div className="lg:col-span-7 lg:pr-8 space-y-4">
                      <div className="flex items-end justify-between border-b border-[#E5DDD1] pb-3.5">
                        <div>
                          <h3 className="font-serif text-2xl sm:text-[26px] lg:text-[28px] font-medium text-[#111113] tracking-tight leading-none">
                            Revenue Overview
                          </h3>
                          <p className="text-xs sm:text-[12.5px] text-[#746F68] font-sans font-normal mt-1.5">
                            Settlement timeline &middot; {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-serif text-2xl sm:text-[28px] font-normal text-[#111113] block leading-none">
                            {formatINR(filteredRevenue)}
                          </span>
                          <span className="text-[10.5px] font-mono text-[#746F68] block mt-1.5">
                            {filteredPaidOrders.length} {filteredPaidOrders.length === 1 ? "Settled Order" : "Settled Orders"}
                          </span>
                        </div>
                      </div>

                      {/* Continuous Trend SVG Chart or Calm Snapshot */}
                      {filteredPaidOrders.length === 0 ? (
                        <div className="py-10 text-center space-y-1.5 border border-dashed border-[#E5DDD1] rounded-[2px] bg-[#FAF8F5]/40">
                          <CalendarIcon size={20} className="mx-auto text-[#78726A] stroke-[1.3]" />
                          <p className="text-xs text-[#171717] font-medium tracking-wide">No Settled Order Activity</p>
                          <p className="text-[11px] text-[#55514B] font-normal max-w-sm mx-auto">
                            No verified customer transactions recorded for the selected period.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="h-44 sm:h-48 w-full relative pt-1">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#C2922E" stopOpacity="0.25" />
                                  <stop offset="100%" stopColor="#C2922E" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              {/* Horizontal guidelines */}
                              <line x1="0" y1="20" x2="500" y2="20" stroke="#E5DDD1" strokeDasharray="3 3" strokeWidth="0.8" />
                              <line x1="0" y1="70" x2="500" y2="70" stroke="#E5DDD1" strokeDasharray="3 3" strokeWidth="0.8" />
                              <line x1="0" y1="120" x2="500" y2="120" stroke="#E5DDD1" strokeDasharray="3 3" strokeWidth="0.8" />

                              {(() => {
                                const dataToRender = activeChartData.length > 0 ? activeChartData : chartData;
                                const nonZeroDays = dataToRender.filter(d => d.revenue > 0);
                                const isLowData = nonZeroDays.length < 3;

                                if (isLowData) {
                                  // Calm baseline presentation for low data density
                                  const baselineY = 90;
                                  return (
                                    <g>
                                      {/* Soft ambient zone */}
                                      <rect x="0" y={baselineY} width="500" height="45" fill="url(#goldGradient)" opacity="0.3" />
                                      {/* Subtle horizontal baseline */}
                                      <line
                                        x1="0"
                                        y1={baselineY}
                                        x2="500"
                                        y2={baselineY}
                                        stroke="#C2922E"
                                        strokeWidth="1.2"
                                        strokeDasharray="4 4"
                                      />
                                      {/* Discrete transaction pins */}
                                      {dataToRender.map((d, i) => {
                                        const x = dataToRender.length > 1 ? (i / (dataToRender.length - 1)) * 460 + 20 : 250;
                                        if (d.revenue <= 0) return null;
                                        return (
                                          <g key={i} className="group cursor-pointer">
                                            <line x1={x} y1={baselineY} x2={x} y2={baselineY - 32} stroke="#C2922E" strokeWidth="1.2" />
                                            <circle
                                              cx={x}
                                              cy={baselineY - 32}
                                              r="5"
                                              fill="#171717"
                                              stroke="#C2922E"
                                              strokeWidth="1.5"
                                              className="transition-transform group-hover:scale-125"
                                            />
                                            <circle cx={x} cy={baselineY - 32} r="2" fill="#C2922E" />
                                            <title>{`${d.label || d.date}: ₹${(d.revenue || 0).toLocaleString('en-IN')} (${d.count} orders)`}</title>
                                          </g>
                                        );
                                      })}
                                    </g>
                                  );
                                }

                                const maxRev = Math.max(...dataToRender.map(d => d.revenue), 1000) * 1.15;
                                const points = dataToRender.map((d, i) => {
                                  const x = dataToRender.length > 1 ? (i / (dataToRender.length - 1)) * 480 + 10 : 250;
                                  const y = 125 - (d.revenue / maxRev) * 105;
                                  return { x, y, ...d };
                                });
                                const pathPoints = points.map(p => `${p.x},${p.y}`).join(" ");
                                const firstX = points[0].x;
                                const lastX = points[points.length - 1].x;
                                const areaPoints = `${firstX},135 ${pathPoints} ${lastX},135`;

                                return (
                                  <g>
                                    <polygon points={areaPoints} fill="url(#goldGradient)" />
                                    <polyline
                                      fill="none"
                                      stroke="#C2922E"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      points={pathPoints}
                                    />
                                    {points.map((p, idx) => (
                                      <g key={idx} className="group cursor-pointer">
                                        <circle
                                          cx={p.x}
                                          cy={p.y}
                                          r={dataToRender.length > 15 ? 2.5 : 4}
                                          fill="#171717"
                                          stroke="#C2922E"
                                          strokeWidth="1.5"
                                          className="transition-transform group-hover:scale-150"
                                        />
                                        <title>{`${p.label || p.date}: ₹${(p.revenue || 0).toLocaleString('en-IN')}`}</title>
                                      </g>
                                    ))}
                                  </g>
                                );
                              })()}
                            </svg>

                            {/* Low-data quiet indicator */}
                            {(() => {
                              const dataToRender = activeChartData.length > 0 ? activeChartData : chartData;
                              const nonZeroDays = dataToRender.filter(d => d.revenue > 0);
                              if (nonZeroDays.length < 3 && filteredPaidOrders.length > 0) {
                                return (
                                  <div className="absolute top-3.5 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                                    <span className="text-xs text-[#746F68] font-sans font-normal italic">
                                      Revenue activity will appear as transactions accumulate.
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          {/* Date markers on X axis */}
                          <div className="flex justify-between items-center text-[10.5px] font-mono text-[#55514B] pt-1.5 border-t border-[#E5DDD1]">
                            <span>{activeChartData[0]?.label || "Start"}</span>
                            {activeChartData.length > 2 && (
                              <span>{activeChartData[Math.floor(activeChartData.length / 2)]?.label}</span>
                            )}
                            <span>{activeChartData[activeChartData.length - 1]?.label || "End"}</span>
                          </div>

                          {/* 3-Stat Financial Summary Strip */}
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E5DDD1]/60 text-xs">
                            <div className="bg-[#FAF8F5] border border-[#E5DDD1] p-2.5 rounded-[2px]">
                              <span className="text-[9px] uppercase tracking-[0.08em] text-[#78726A] font-mono block">
                                Avg Order Value
                              </span>
                              <span className="font-serif text-base text-[#171717] font-normal block mt-0.5">
                                {formatINR(filteredPaidOrders.length ? Math.round(filteredRevenue / filteredPaidOrders.length) : 0)}
                              </span>
                            </div>
                            <div className="bg-[#FAF8F5] border border-[#E5DDD1] p-2.5 rounded-[2px]">
                              <span className="text-[9px] uppercase tracking-[0.08em] text-[#78726A] font-mono block">
                                Reconciliation
                              </span>
                              <span className="font-mono text-xs text-[#171717] font-semibold block mt-1">
                                {filteredPaidOrders.length > 0 ? "100% Verified" : "—"}
                              </span>
                            </div>
                            <div className="bg-[#FAF8F5] border border-[#E5DDD1] p-2.5 rounded-[2px]">
                              <span className="text-[9px] uppercase tracking-[0.08em] text-[#78726A] font-mono block">
                                Settlement Channel
                              </span>
                              <span className="font-mono text-xs text-[#171717] font-semibold block mt-1 truncate">
                                Direct UPI Audit
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Recent Orders (5 cols) */}
                    <div className="lg:col-span-5 lg:pl-8 space-y-4 pt-6 lg:pt-0">
                      <div className="flex items-end justify-between border-b border-[#E5DDD1] pb-3.5">
                        <div>
                          <h3 className="font-serif text-2xl sm:text-[26px] lg:text-[28px] font-medium text-[#111113] tracking-tight leading-none">
                            Recent Orders
                          </h3>
                          <p className="text-xs sm:text-[12.5px] text-[#746F68] font-sans font-normal mt-1.5">
                            Latest verified transactions
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("orders")}
                          className="text-xs tracking-normal text-[#171717] hover:text-[#C2922E] hover:underline cursor-pointer font-medium pb-0.5"
                        >
                          View All &rarr;
                        </button>
                      </div>

                      <div className="divide-y divide-[#E5DDD1]/60">
                        {orders.slice(0, 5).map(o => {
                          const orderItems = Array.isArray(o.items) ? o.items : [];
                          let pieceName = "";
                          if (orderItems.length > 0) {
                            const item = orderItems[0];
                            pieceName = item.product_name || item.name || item.title || "";
                            if (!pieceName && item.product_id) {
                              const matched = products.find(p => p.id === item.product_id);
                              if (matched) pieceName = matched.name;
                            }
                          }
                          if (!pieceName) {
                            pieceName = "Tailored Bespoke Piece";
                          }
                          const extraCount = orderItems.length > 1 ? orderItems.length - 1 : 0;

                          return (
                            <div
                              key={o.id}
                              onClick={() => setActiveTab("orders")}
                              className="py-2.5 px-1 flex items-center justify-between gap-3 hover:bg-[#FAF8F5] transition-all cursor-pointer group rounded-[2px]"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5 font-mono text-xs">
                                  <span className="font-semibold text-[#171717] group-hover:text-[#C2922E] transition-colors">
                                    #SUKO-{1000 + o.id}
                                  </span>
                                  <span className="text-[#C5BDB2]">&middot;</span>
                                  <span className="text-[#55514B] truncate max-w-[120px] sm:max-w-[150px] font-sans">
                                    {o.name || o.shipping_name || o.user?.name || "Client"}
                                  </span>
                                </div>
                                <p className="font-serif text-[12.5px] text-[#171717] italic truncate group-hover:text-[#111113]">
                                  {pieceName}
                                  {extraCount > 0 && (
                                    <span className="font-sans not-italic text-[10px] text-[#78726A] ml-1.5 font-normal">
                                      (+{extraCount} more)
                                    </span>
                                  )}
                                </p>
                              </div>

                              <div className="text-right space-y-0.5 shrink-0">
                                <span className="font-mono text-xs font-semibold text-[#171717] block">
                                  {formatINR(o.total)}
                                </span>
                                <div>
                                  {renderStatusIndicator(o.status)}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {orders.length === 0 && (
                          <div className="py-7 px-4 text-center border border-[#E5DDD1] bg-[#FAF8F5]/80 my-1 rounded-[2px]">
                            <p className="font-serif text-sm text-[#171717] font-normal mb-1">
                              No orders recorded yet
                            </p>
                            <p className="text-xs text-[#55514B] font-normal">
                              New tailoring transactions will reflect here in real time.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* 5. INVENTORY & PRODUCT INSIGHTS (3 Open Columns with Vertical Hairlines) */}
                  <div className="border-b border-[#E5DDD1] pb-6 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E5DDD1] gap-6 md:gap-0 items-start">

                    {/* A) Low Stock Alert */}
                    <div className="md:pr-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-[#E5DDD1] pb-2.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-[#8B3A3A] stroke-[1.5]" />
                          <h4 className="font-serif text-[19px] sm:text-[20px] font-normal text-[#111113] tracking-tight">Low Stock Alert</h4>
                        </div>
                        {lowStockProducts.length === 0 ? (
                          <span className="text-[10px] font-mono text-[#746F68] px-1.5 py-0.5 rounded-[2px] border border-[#E5DDD1]">
                            0 Items
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#8B3A3A] font-semibold px-1.5 py-0.5 rounded-[2px] border border-[#D9A4A4] bg-transparent">
                            {lowStockProducts.length} {lowStockProducts.length === 1 ? "Item" : "Items"}
                          </span>
                        )}
                      </div>

                      <div className="divide-y divide-[#E5DDD1]/50 max-h-56 overflow-y-auto pr-1">
                        {lowStockProducts.slice(0, 4).map(p => (
                          <div key={p.id} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-9 rounded-[2px] border border-[#E5DDD1] bg-[#FAF8F5] overflow-hidden flex items-center justify-center shrink-0">
                                {p.image_url ? (
                                  <img
                                    src={p.image_url}
                                    alt={p.name}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      if (e.currentTarget.nextElementSibling) {
                                        e.currentTarget.nextElementSibling.style.display = 'flex';
                                      }
                                    }}
                                    className="w-full h-full object-cover"
                                  />
                                ) : null}
                                <div
                                  style={{ display: p.image_url ? 'none' : 'flex' }}
                                  className="w-full h-full bg-[#EFE9DF] items-center justify-center font-serif text-[10px] text-[#171717] font-medium"
                                >
                                  {(p.name || 'P').charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-[#171717] truncate max-w-[130px]">{p.name}</p>
                                {p.sizes && <p className="text-[10px] text-[#55514B]">Sizes: {p.sizes}</p>}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#8B3A3A]">
                              {p.stock} left
                            </span>
                          </div>
                        ))}

                        {lowStockProducts.length === 0 && (
                          <p className="text-xs text-[#746F68] py-5 text-center font-sans italic">
                            All garment inventory is healthy.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* B) Top Selling Pieces (Derived strictly from real paid orders) */}
                    <div className="md:px-6 space-y-3 pt-6 md:pt-0">
                      <div className="flex items-center justify-between border-b border-[#E5DDD1] pb-2.5">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={14} className="text-[#746F68] stroke-[1.5]" />
                          <h4 className="font-serif text-[19px] sm:text-[20px] font-normal text-[#111113] tracking-tight">Top Selling Pieces</h4>
                        </div>
                        <span className="text-[10px] font-mono text-[#746F68]">
                          Paid Orders
                        </span>
                      </div>

                      <div className="divide-y divide-[#E5DDD1]/50 max-h-56 overflow-y-auto pr-1">
                        {topSellingPieces.slice(0, 4).map((ts, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-9 rounded-[2px] border border-[#E5DDD1] bg-[#FAF8F5] overflow-hidden flex items-center justify-center shrink-0">
                                {ts.image ? (
                                  <img
                                    src={ts.image}
                                    alt={ts.name}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      if (e.currentTarget.nextElementSibling) {
                                        e.currentTarget.nextElementSibling.style.display = 'flex';
                                      }
                                    }}
                                    className="w-full h-full object-cover"
                                  />
                                ) : null}
                                <div
                                  style={{ display: ts.image ? 'none' : 'flex' }}
                                  className="w-full h-full bg-[#EFE9DF] items-center justify-center font-serif text-[10px] text-[#171717] font-medium"
                                >
                                  {(ts.name || 'P').charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-[#171717] truncate max-w-[130px]">{ts.name}</p>
                                <p className="text-[10px] text-[#55514B] font-mono">{ts.qty} pieces ordered</p>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-[#171717]">
                              {formatINR(ts.revenue)}
                            </span>
                          </div>
                        ))}

                        {topSellingPieces.length === 0 && (
                          <p className="text-xs text-[#746F68] py-5 text-center font-sans italic">
                            Top pieces will appear as orders are fulfilled.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* C) Collection Performance */}
                    <div className="md:pl-6 space-y-3 pt-6 md:pt-0">
                      <div className="flex items-center justify-between border-b border-[#E5DDD1] pb-2.5">
                        <div className="flex items-center gap-2">
                          <Layers size={14} className="text-[#746F68] stroke-[1.5]" />
                          <h4 className="font-serif text-[19px] sm:text-[20px] font-normal text-[#111113] tracking-tight">Collection Performance</h4>
                        </div>
                        <span className="text-[10px] font-mono text-[#746F68]">
                          Collections
                        </span>
                      </div>

                      {categoryPerformance.filter(cp => cp.soldCount > 0 || cp.revenue > 0).length === 0 ? (
                        <div className="py-5 text-center">
                          <p className="text-xs text-[#746F68] font-sans italic">
                            Collection performance will update as pieces are ordered.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[#E5DDD1]/50 pr-1">
                          {categoryPerformance
                            .filter(cp => cp.soldCount > 0 || cp.revenue > 0)
                            .map((cp, idx) => (
                              <div key={idx} className="py-2 space-y-0.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-medium text-[#171717] truncate max-w-[140px]">{cp.name}</span>
                                  <span className="font-mono font-bold text-[#171717]">{formatINR(cp.revenue)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-[#55514B] font-mono">
                                  <span>{cp.productCount} Pieces</span>
                                  <span>{cp.soldCount} Sold</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* 6. CLIENT EXPERIENCE SECTION */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E5DDD1] gap-6 lg:gap-0 items-start pb-4">

                    {/* Client Directory (7 cols) */}
                    <div className="lg:col-span-7 lg:pr-8 space-y-3.5">
                      <div className="flex items-end justify-between border-b border-[#E5DDD1] pb-3.5">
                        <div>
                          <h3 className="font-serif text-2xl sm:text-[26px] lg:text-[28px] font-medium text-[#111113] tracking-tight leading-none">
                            Client Directory
                          </h3>
                          <p className="text-xs sm:text-[12.5px] text-[#746F68] font-sans font-normal mt-1.5">
                            Active studio clientele on record
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("customers")}
                          className="text-xs tracking-normal text-[#171717] hover:text-[#C2922E] hover:underline cursor-pointer font-medium pb-0.5"
                        >
                          Directory &rarr;
                        </button>
                      </div>

                      {/* Vertical Editorial Client Rows */}
                      <div className="divide-y divide-[#E5DDD1]/60">
                        {uniqueClientsList.slice(0, 4).map((cl, i) => (
                          <div
                            key={i}
                            onClick={() => setActiveTab("customers")}
                            className="py-3 px-1 flex items-center justify-between hover:bg-[#FAF8F5] transition-all cursor-pointer group rounded-[2px]"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <span className="font-serif text-[15px] font-medium text-[#111113] group-hover:text-[#C2922E] transition-colors block leading-snug truncate">
                                {cl.name}
                              </span>
                              <span className="text-xs text-[#746F68] font-sans font-normal block leading-none">
                                {cl.city || "Mumbai"}
                              </span>
                            </div>
                            <div className="text-right space-y-0.5 shrink-0">
                              <span className="font-mono text-xs font-semibold text-[#111113] block leading-snug">
                                {String(cl.ordersCount).padStart(2, '0')} {cl.ordersCount === 1 ? 'Order' : 'Orders'}
                              </span>
                              <span className="text-xs text-[#746F68] font-mono block leading-none">
                                {formatINR(cl.totalSpent)} Lifetime
                              </span>
                            </div>
                          </div>
                        ))}

                        {uniqueClientsList.length === 0 && (
                          <div className="py-6 text-center">
                            <p className="text-xs text-[#746F68] font-sans italic">
                              Client profiles will populate automatically upon checkout.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Latest Client Reviews (5 cols) */}
                    <div className="lg:col-span-5 lg:pl-8 space-y-3.5 pt-6 lg:pt-0">
                      <div className="flex items-end justify-between border-b border-[#E5DDD1] pb-3.5">
                        <div>
                          <h3 className="font-serif text-2xl sm:text-[26px] lg:text-[28px] font-medium text-[#111113] tracking-tight leading-none">
                            Client Reviews
                          </h3>
                          <p className="text-xs sm:text-[12.5px] text-[#746F68] font-sans font-normal mt-1.5">
                            Verified buyer testimonials &amp; feedback
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("reviews")}
                          className="text-xs tracking-normal text-[#171717] hover:text-[#C2922E] hover:underline cursor-pointer font-medium pb-0.5"
                        >
                          All ({adminReviewsList.length}) &rarr;
                        </button>
                      </div>

                      <div className="divide-y divide-[#E5DDD1]/60 max-h-72 overflow-y-auto pr-1">
                        {adminReviewsList.slice(0, 3).map((r) => (
                          <div key={r.id} className="py-2.5 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-[#171717]">{r.user?.name || "Client"}</span>
                              <div className="flex items-center text-[#C2922E]">
                                {[...Array(r.rating || 5)].map((_, i) => (
                                  <Star key={i} size={11} fill="#C2922E" />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-[#55514B] font-light leading-relaxed italic">
                              "{r.comment}"
                            </p>
                          </div>
                        ))}

                        {adminReviewsList.length === 0 && (
                          <div className="py-6 text-center">
                            <p className="text-xs text-[#746F68] font-sans italic leading-relaxed max-w-[280px] mx-auto">
                              Client feedback and tailoring reviews will appear here once verified patrons submit their experience.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* CALENDAR TAB FULL */}
              {activeTab === "calendar" && (
                <div className="border border-[#E8E4DC] p-8 bg-white rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="font-quiche text-3xl font-light text-[#121215]">Full Calendar & Scheduler</h2>
                      <p className="text-xs text-[#555560] font-body mt-1">Manage events, track daily sales highlights & add studio tasks.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                        className="p-2 border border-[#E8E4DC] rounded-xl hover:border-[#C2922E] transition-all text-[#555560] hover:text-[#121215]"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span className="text-sm uppercase tracking-[0.12em] font-mono text-[#121215]">
                        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                        className="p-2 border border-[#E8E4DC] rounded-xl hover:border-[#C2922E] transition-all text-[#555560] hover:text-[#121215]"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-7 text-center mb-3 text-xs uppercase tracking-widest text-[#888890] font-mono">
                    <span>Sunday</span><span>Monday</span><span>Tuesday</span><span>Wednesday</span><span>Thursday</span><span>Friday</span><span>Saturday</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {getDaysInMonth().map((day, idx) => {
                      if (!day) return <div key={idx} className="h-28 border border-transparent" />;
                      const dStr = dateKey(day);
                      const isSelected = dateKey(selectedDate) === dStr;
                      const isToday = dateKey(new Date()) === dStr;
                      const dayOrders = orders.filter(o => dateKey(new Date(o.created_at)) === dStr);
                      const notes = calendarNotes[dStr] || [];

                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedDate(day)}
                          className={`h-28 border rounded-xl p-2.5 text-left cursor-pointer flex flex-col justify-between transition-all ${isSelected ? "border-[#C2922E] bg-[#C2922E]/10" : isToday ? "border-[#121215] bg-[#121215]/5" : "border-[#E8E4DC]/60 hover:border-[#C2922E] bg-[#FAF8F5]"
                            }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`text-xs font-body ${isToday ? "font-bold text-[#121215]" : "text-[#555560]"}`}>
                              {day.getDate()}
                            </span>
                            {dayOrders.length > 0 && (
                              <span className="text-[9px] uppercase tracking-wider bg-emerald-500/10 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                                {dayOrders.length} orders
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 max-h-16 overflow-y-auto">
                            {notes.map(n => (
                              <div key={n.id} className="text-[9px] bg-white border border-[#E8E4DC] px-1.5 py-0.5 rounded truncate text-[#555560]">
                                • {n.text}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PRODUCTS TAB (GARMENT ARCHIVE) */}
              {activeTab === "products" && (
                <div className="space-y-6">
                  {/* Title & Count + Add Garment Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DDD1] pb-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-[#C2922E] font-mono font-medium block mb-0.5">
                        ATELIER CURATION &middot; INVENTORY ARCHIVE
                      </span>
                      <h2 className="text-2xl font-serif font-medium text-[#111113] tracking-tight">
                        Garment Archive
                      </h2>
                      <p className="text-xs text-[#746F68] font-sans mt-0.5">
                        Showing {filteredProducts.length} of {products.length} archival garments in showroom registry.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setActiveTab("categories"); setShowAddCategoryInline(false); }}
                      className="group bg-[#111113] hover:bg-[#C2922E] text-white px-4 py-2 rounded-[2px] text-[10.5px] uppercase tracking-[0.14em] font-mono font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
                    >
                      <Plus size={13} className="text-[#C2922E] group-hover:text-white transition-colors" />
                      <span>Add New Garment</span>
                    </button>
                  </div>

                  {/* TOP EDITORIAL SUMMARY STRIP */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF8F5] border border-[#E5DDD1] p-4 rounded-[2px]">
                    <div>
                      <span className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-[#C2922E] block font-medium">Archive Holdings</span>
                      <p className="font-serif text-xl font-medium text-[#111113] mt-0.5">{products.length} Active Pieces</p>
                      <span className="text-[10px] text-[#746F68] font-mono">{filteredProducts.length} Currently Visible</span>
                    </div>
                    <div>
                      <span className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-[#746F68] block font-medium">Collections</span>
                      <p className="font-serif text-xl font-medium text-[#111113] mt-0.5">{categories.length} Silhouettes</p>
                      <span className="text-[10px] text-[#746F68] font-mono">Taxonomy Structure</span>
                    </div>
                    <div>
                      <span className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-[#746F68] block font-medium">Inventory Allocation</span>
                      <p className="font-serif text-xl font-medium text-[#111113] mt-0.5">
                        {lowStockProducts.length > 0 ? (
                          <span className="text-amber-800">{lowStockProducts.length} Low Allocation</span>
                        ) : (
                          <span className="text-[#111113]">Healthy Stock</span>
                        )}
                      </p>
                      <span className="text-[10px] text-[#746F68] font-mono">&lt; 5 units remaining</span>
                    </div>
                    <div>
                      <span className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-[#746F68] block font-medium">Registry Status</span>
                      <p className="font-serif text-xl font-medium text-[#111113] mt-0.5">Live Atelier</p>
                      <span className="text-[10px] text-[#746F68] font-mono">Updated Today</span>
                    </div>
                  </div>

                  {/* Mini Navigation Bar & Filters */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-[#E5DDD1] pb-4 gap-4">
                    <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-[2px] border border-[#E5DDD1] overflow-x-auto">
                      {[
                        { id: "all", label: "All Silhouettes" },
                        { id: "womens", label: "Womenswear" },
                        { id: "low_stock", label: "Low Allocation (< 5)" }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setProductGenderFilter(tab.id);
                            setSelectedCategory("all");
                          }}
                          className={`px-3 py-1.5 rounded-[2px] text-[10px] uppercase tracking-[0.14em] font-mono transition-colors whitespace-nowrap cursor-pointer ${productGenderFilter === tab.id
                              ? "bg-[#111113] text-[#FAF8F5] font-medium"
                              : "text-[#746F68] hover:text-[#111113] hover:bg-[#EFE9DF]"
                            }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Search & Category Filter */}
                    <div className="flex items-center gap-2.5">
                      <div className="relative flex-1 sm:flex-initial">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#746F68]" />
                        <input
                          type="text"
                          placeholder="Search garment name..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full sm:w-56 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] pl-8 pr-3 py-1.5 text-xs font-sans text-[#111113] focus:border-[#C2922E] focus:bg-white outline-none"
                        />
                      </div>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] px-3 py-1.5 text-xs font-mono focus:border-[#C2922E] focus:bg-white outline-none text-[#111113] cursor-pointer"
                      >
                        <option value="all">All Silhouettes</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Garment Archive Table */}
                  <div className="border border-[#E5DDD1] bg-[#FAF8F5] rounded-[2px] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-body text-xs">
                        <thead className="bg-[#F7F3ED] text-[9.5px] uppercase tracking-[0.16em] text-[#746F68] font-mono font-medium border-b border-[#E5DDD1]">
                          <tr>
                            <th className="p-3.5 font-normal">Garment</th>
                            <th className="p-3.5 font-normal">Silhouette &amp; Line</th>
                            <th className="p-3.5 font-normal">Pricing</th>
                            <th className="p-3.5 font-normal">Inventory Allocation</th>
                            <th className="p-3.5 font-normal text-right">Inspection</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5DDD1] text-[#111113]">
                          {filteredProducts.map(p => (
                            <tr key={p.id} className="hover:bg-white/80 transition-colors">
                              {/* Thumbnail (Increased to 56-64px portrait ratio) */}
                              <td className="p-3.5">
                                <div 
                                  onClick={() => handleOpenEdit(p, false)}
                                  className="w-14 h-18 sm:w-16 sm:h-20 bg-white border border-[#E5DDD1] rounded-[2px] overflow-hidden shadow-xs cursor-pointer group relative flex items-center justify-center"
                                  title="Click to inspect garment"
                                >
                                  {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  ) : (
                                    <div className="w-full h-full bg-[#FAF8F5] flex items-center justify-center text-[10px] text-[#746F68] font-mono">N/A</div>
                                  )}
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#C2922E]">
                                    <Eye size={15} />
                                  </div>
                                </div>
                              </td>

                              {/* Garment Title & Details */}
                              <td className="p-3.5">
                                <p 
                                  onClick={() => handleOpenEdit(p, false)}
                                  className="font-medium text-sm text-[#111113] hover:text-[#C2922E] cursor-pointer transition-colors"
                                >
                                  {p.name}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                  {p.category && (
                                    <span className="text-[9px] uppercase tracking-wider font-mono text-[#C2922E] border border-[#C2922E]/30 bg-[#C2922E]/10 px-2 py-0.5 rounded-[2px]">
                                      {typeof p.category === 'object' ? p.category.name : (p.categoryName || p.category)}
                                    </span>
                                  )}
                                  {p.sub_category && (
                                    <span className="text-[9px] uppercase tracking-wider font-mono text-[#746F68] border border-[#E5DDD1] bg-white px-2 py-0.5 rounded-[2px]">
                                      {p.sub_category}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Pricing */}
                              <td className="p-3.5 font-mono font-medium text-sm text-[#111113]">
                                {formatINR(p.price)}
                              </td>

                              {/* Stock & Size Variants */}
                              <td className="p-3.5">
                                <span className={`font-mono text-xs font-medium block ${p.stock < 5 ? "text-amber-800" : "text-[#111113]"}`}>
                                  Available {String(p.stock).padStart(2, '0')} pieces
                                </span>
                                {p.size_stock && typeof p.size_stock === 'object' && Object.keys(p.size_stock).length > 0 ? (
                                  <div className="flex flex-wrap gap-1 mt-1 max-w-[220px]">
                                    {Object.entries(p.size_stock).map(([sz, qty]) => (
                                      <span key={sz} className={`text-[9px] font-mono px-1.5 py-0.5 rounded-[1px] border ${qty < 2 ? "text-amber-800 border-amber-500/30 bg-amber-500/10 font-medium" : "text-[#746F68] border-[#E5DDD1] bg-white"}`}>
                                        {sz}:{qty}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  p.sizes?.length > 0 && (
                                    <span className="text-[9.5px] font-mono text-[#746F68] block mt-0.5">
                                      Sizes: {p.sizes.join(', ')}
                                    </span>
                                  )
                                )}
                              </td>

                              {/* Action: Inspect */}
                              <td className="p-3.5 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(p, false)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E5DDD1] hover:border-[#111113] bg-[#FAF8F5] hover:bg-[#111113] text-[#111113] hover:text-[#FAF8F5] rounded-[2px] text-[10px] uppercase tracking-[0.14em] font-mono font-medium transition-all cursor-pointer shadow-xs"
                                    title="Inspect Garment Details"
                                  >
                                    <span>Inspect</span>
                                    <ArrowUpRight size={11} className="text-[#C2922E]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="p-1.5 text-[#746F68] hover:text-rose-800 hover:bg-rose-50 border border-[#E5DDD1] rounded-[2px] transition-colors cursor-pointer"
                                    title="Delete Garment"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredProducts.length === 0 && (
                            <tr>
                              <td colSpan="5" className="p-8 text-center text-[#746F68] font-light">
                                No archival garments found matching filter criteria.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORIES & NEW PRODUCT TAB (COLLECTION STRUCTURE) */}
              {activeTab === "categories" && (
                <div className="grid lg:grid-cols-12 gap-8">
                  {/* LEFT SIDE: COLLECTION STRUCTURE */}
                  <div className="lg:col-span-5 space-y-5">
                    <div className="flex items-center justify-between border-b border-[#E5DDD1] pb-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[#C2922E] font-mono font-medium block mb-0.5">
                          ATELIER TAXONOMY
                        </span>
                        <h2 className="text-xl font-serif font-medium text-[#111113] tracking-tight">
                          Collection Structure ({categories.length})
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddCategoryInline(!showAddCategoryInline)}
                        className="text-[10px] uppercase tracking-wider text-[#C2922E] hover:underline font-mono font-medium cursor-pointer"
                      >
                        {showAddCategoryInline ? "Cancel" : "+ Create Collection"}
                      </button>
                    </div>

                    {/* Step-based / Compact Create Collection box */}
                    {showAddCategoryInline && (
                      <div className="p-4 border border-[#E5DDD1] bg-[#FAF8F5] rounded-[2px] space-y-3 shadow-xs">
                        <span className="text-[9.5px] uppercase tracking-[0.16em] text-[#C2922E] font-mono font-medium block">
                          Create Collection
                        </span>
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Collection Name (e.g. Power Suits & Tailored Sets)"
                            className="w-full bg-white border border-[#E5DDD1] rounded-[2px] px-3.5 py-2 text-xs font-mono text-[#111113] outline-none focus:border-[#C2922E]"
                          />
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleCreateCategory}
                              className="flex-1 bg-[#111113] hover:bg-[#C2922E] text-white px-4 py-2 rounded-[2px] text-[10px] uppercase tracking-widest font-mono font-medium transition-colors cursor-pointer"
                            >
                              Create Collection
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddCategoryInline(false)}
                              className="border border-[#E5DDD1] hover:bg-[#EFE9DF] text-[#746F68] px-3.5 py-2 rounded-[2px] text-[10px] uppercase tracking-widest font-mono transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Editorial Numbered Collection List */}
                    <div className="border border-[#E5DDD1] bg-[#FAF8F5] rounded-[2px] divide-y divide-[#E5DDD1]">
                      {categories.map((cat, idx) => {
                        const linkedCount = products.filter(p => 
                          String(p.category_id) === String(cat.id) || 
                          String(p.category_id) === String(cat.slug) || 
                          String(p.category) === String(cat.slug) || 
                          String(p.category) === String(cat.id) ||
                          String(p.category?.id) === String(cat.id) ||
                          String(p.category?.slug) === String(cat.slug) ||
                          (p.categoryName && p.categoryName.toLowerCase() === cat.name?.toLowerCase()) ||
                          (typeof p.category === 'object' && p.category?.name?.toLowerCase() === cat.name?.toLowerCase())
                        ).length;
                        return (
                          <div key={cat.id} className="p-4 hover:bg-white/80 transition-colors flex items-center justify-between gap-3">
                            <div className="flex items-start gap-3.5">
                              <span className="text-xs font-mono font-medium text-[#C2922E] mt-0.5 shrink-0">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              <div>
                                <h4 className="font-serif text-base text-[#111113] font-medium tracking-tight">
                                  {cat.name}
                                </h4>
                                <p className="text-[10.5px] text-[#746F68] font-mono mt-0.5">
                                  {linkedCount === 1 ? "01 Active Piece" : `${String(linkedCount).padStart(2, '0')} Active Pieces`} &middot; Silhouette Line
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCategory(cat.id);
                                  setActiveTab("products");
                                }}
                                className="text-[10px] uppercase font-mono tracking-wider text-[#111113] hover:text-[#C2922E] px-2.5 py-1 border border-[#E5DDD1] rounded-[2px] hover:border-[#111113] bg-white transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <span>Pieces</span>
                                <span>&rarr;</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1.5 text-[#746F68] hover:text-rose-800 hover:bg-rose-50 border border-[#E5DDD1] rounded-[2px] transition-colors cursor-pointer"
                                title="Delete Collection"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {categories.length === 0 && (
                        <div className="p-6 text-center text-[#746F68] font-mono text-xs">
                          No silhouettes registered yet. Click &quot;+ Create Collection&quot; above.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT SIDE: ADD NEW GARMENT FORM */}
                  <div className="lg:col-span-7">
                    <div className="border border-[#E5DDD1] bg-[#FAF8F5] rounded-[2px] shadow-xs p-6 sm:p-7 space-y-5">
                      <div className="border-b border-[#E5DDD1] pb-3">
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[#C2922E] font-mono font-medium block mb-0.5">
                          ATELIER CATALOG ENTRY
                        </span>
                        <h2 className="text-2xl font-serif font-medium text-[#111113] tracking-tight">
                          Add New Garment
                        </h2>
                        <p className="text-xs text-[#746F68] font-sans mt-0.5">
                          Publish a bespoke silhouette piece to the SUKO showroom and inventory ledger.
                        </p>
                      </div>

                      <form onSubmit={handleUploadSubmit} className="space-y-4 font-body">
                        <div>
                          <label className="text-[10px] uppercase tracking-[0.14em] text-[#746F68] font-mono block mb-1">Garment Title *</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="e.g. Silk Blend Tailored Suit"
                            required
                            className="w-full bg-white border border-[#E5DDD1] rounded-[2px] px-3.5 py-2 text-xs text-[#111113] focus:border-[#C2922E] outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="text-[10px] uppercase tracking-[0.14em] text-[#746F68] font-mono block mb-1">Price (INR) *</label>
                            <input
                              type="number"
                              name="price"
                              value={formData.price}
                              onChange={handleInputChange}
                              placeholder="4990"
                              required
                              className="w-full bg-white border border-[#E5DDD1] rounded-[2px] px-3.5 py-2 text-xs text-[#111113] focus:border-[#C2922E] outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-[0.14em] text-[#746F68] font-mono block mb-1">Collection / Silhouette *</label>
                            <select
                              name="category_id"
                              value={formData.category_id}
                              onChange={handleInputChange}
                              required
                              className="w-full bg-white border border-[#E5DDD1] rounded-[2px] px-3.5 py-2 text-xs text-[#111113] focus:border-[#C2922E] outline-none cursor-pointer"
                            >
                              <option value="">Select Collection</option>
                              {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="text-[10px] uppercase tracking-[0.14em] text-[#746F68] font-mono block mb-1">Sub-Category Line Tag</label>
                            <input
                              type="text"
                              name="sub_category"
                              value={formData.sub_category}
                              onChange={handleInputChange}
                              placeholder="e.g. Luxury Wool, Corporate Formal"
                              className="w-full bg-white border border-[#E5DDD1] rounded-[2px] px-3.5 py-2 text-xs text-[#111113] focus:border-[#C2922E] outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-[0.14em] text-[#746F68] font-mono block mb-1">Fallback Total Stock</label>
                            <input
                              type="number"
                              name="stock"
                              value={formData.stock}
                              onChange={handleInputChange}
                              placeholder="25"
                              className="w-full bg-white border border-[#E5DDD1] rounded-[2px] px-3.5 py-2 text-xs text-[#111113] focus:border-[#C2922E] outline-none font-mono"
                            />
                          </div>
                        </div>

                        {/* Size Stock Distribution Map */}
                        <div className="space-y-2 border border-[#E5DDD1] p-3.5 rounded-[2px] bg-[#FAF8F5]">
                          <div className="flex items-center justify-between">
                            <label className="text-[9.5px] uppercase tracking-[0.14em] text-[#746F68] font-mono font-medium">Exact Size Allocation Map</label>
                            <span className="text-[10px] font-mono text-[#C2922E] font-medium">
                              Total: {Object.values(sizeStockMap).reduce((a, b) => a + (Number(b) || 0), 0)} units
                            </span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {["38", "40", "42", "44", "46", "Free"].map(sz => (
                              <div key={sz} className="text-center">
                                <span className="text-[9.5px] font-mono block text-[#746F68] mb-0.5">{sz}</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={sizeStockMap[sz] ?? 0}
                                  onChange={(e) => setSizeStockMap({ ...sizeStockMap, [sz]: parseInt(e.target.value, 10) || 0 })}
                                  className="w-full bg-white border border-[#E5DDD1] rounded-[2px] p-1.5 text-center text-xs font-mono text-[#111113] focus:border-[#C2922E] outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-[0.14em] text-[#746F68] font-mono block mb-1">Garment Narrative &amp; Weave</label>
                          <textarea
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Provide garment specifications, fabric blend weave, silhouette cuts..."
                            className="w-full bg-white border border-[#E5DDD1] rounded-[2px] px-3.5 py-2 text-xs text-[#111113] focus:border-[#C2922E] outline-none"
                          />
                        </div>

                        {/* Image Upload Zone */}
                        <div className="space-y-2.5">
                          <label className="text-[10px] uppercase tracking-[0.14em] text-[#746F68] font-mono block">Garment Imagery</label>
                          <div className="border border-dashed border-[#E5DDD1] hover:border-[#C2922E] bg-white rounded-[2px] p-5 text-center transition-colors">
                            <ImageIcon size={24} className="mx-auto text-[#C2922E] mb-1.5" />
                            <p className="text-xs text-[#111113] font-medium">Click or drag portrait lookbook imagery</p>
                            <p className="text-[10px] text-[#746F68] mt-0.5 font-mono">JPEG, PNG, WebP up to 10MB (Auto-optimized)</p>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleAddGalleryFiles}
                              className="mt-2.5 text-xs text-[#746F68] font-mono file:mr-3 file:py-1 file:px-3 file:rounded-[2px] file:border file:border-[#E5DDD1] file:text-[10px] file:font-mono file:uppercase file:tracking-wider file:bg-[#FAF8F5] file:text-[#111113] hover:file:bg-[#111113] hover:file:text-white cursor-pointer"
                            />
                          </div>

                          {/* Gallery Preview Items */}
                          {galleryFiles.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pt-1">
                              {galleryFiles.map((item, idx) => (
                                <div key={idx} className="relative group border border-[#E5DDD1] rounded-[2px] overflow-hidden bg-white shadow-xs">
                                  <img src={item.preview} alt={`Upload ${idx}`} className="w-full h-20 object-cover" />
                                  {item.isPrimary && (
                                    <span className="absolute top-1 left-1 bg-[#111113] text-[#C2922E] text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-[1px]">
                                      Cover
                                    </span>
                                  )}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCropperSrc(item.preview);
                                        pushModalState("cropper");
                                        setCropperCallback(() => (cropped) => {
                                          setGalleryFiles(prev => prev.map((g, i) => i === idx ? { ...g, file: cropped.file, preview: cropped.preview } : g));
                                          closeModal("cropper");
                                        });
                                      }}
                                      className="p-1 bg-white rounded-[2px] text-[#111113] hover:bg-[#C2922E] hover:text-white transition-colors cursor-pointer"
                                      title="Crop Image"
                                    >
                                      <Crop size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setGalleryFiles(prev => prev.filter((_, i) => i !== idx))}
                                      className="p-1 bg-rose-600 rounded-[2px] text-white hover:bg-rose-700 transition-colors cursor-pointer"
                                      title="Remove"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={uploading}
                          className="group w-full bg-[#111113] hover:bg-[#C2922E] text-white py-3 px-6 rounded-[2px] text-[10.5px] uppercase tracking-[0.14em] font-mono font-medium shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {uploading ? (
                            <>
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              <span>Registering Garment...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={14} className="text-[#C2922E] group-hover:text-white transition-colors" />
                              <span>Publish to Atelier Showroom</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* ORDERS TAB */}
              {activeTab === "orders" && (
                <div className="space-y-6">
                  <div className="space-y-4 border-b border-[#E5DDD1] pb-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[#C2922E] font-mono font-medium block mb-1">
                          ATELIER OPERATIONS &middot; ORDER MANAGEMENT
                        </span>
                        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#111113] tracking-tight leading-tight">
                          Atelier Orders
                        </h2>
                        <p className="text-xs sm:text-[12.5px] text-[#746F68] font-sans font-normal mt-1">
                          Client purchases, payment verification and fulfilment.
                        </p>
                      </div>
                    </div>

                    {/* Status Filter Tabs (Editorial Underline Standard - Hidden Scrollbar) */}
                    <div className="flex items-center gap-5 sm:gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overscroll-y-auto -mb-px pt-2">
                      {[
                        { id: "all", label: "All" },
                        { id: "payment_verification_pending", label: `Awaiting${verificationRequests.length > 0 ? ` (${verificationRequests.length})` : ''}` },
                        { id: "pending_payment", label: "Pending" },
                        { id: "paid", label: "Settled" },
                        { id: "payment_verification_failed", label: "Review" },
                        { id: "processing", label: "Atelier" },
                        { id: "cancel_requested", label: "Cancel Requests" },
                        { id: "completed", label: "Completed" },
                        { id: "cancelled", label: "Cancelled" }
                      ].map(st => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setOrderStatusFilter(st.id)}
                          className={`pb-2.5 text-xs uppercase tracking-[0.08em] font-mono transition-all whitespace-nowrap cursor-pointer border-b-2 ${orderStatusFilter === st.id
                              ? "border-[#111113] text-[#111113] font-semibold"
                              : "border-transparent text-[#746F68] hover:text-[#111113] hover:border-[#C5BDB2] font-normal"
                            }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orders Data Table */}
                  <div className="overflow-x-auto border border-[#E5DDD1] bg-[#FAF8F5] rounded-[2px] suko-scrollbar min-h-[360px] overscroll-y-auto">
                    <table className="w-full text-left font-body text-sm table-auto">
                      <thead className="bg-[#F7F3ED] text-[10px] uppercase tracking-[0.08em] text-[#746F68] font-mono border-b border-[#E5DDD1]">
                        <tr>
                          <th className="py-2.5 px-3 font-normal whitespace-nowrap">Order #</th>
                          <th className="py-2.5 px-3 font-normal whitespace-nowrap">Date</th>
                          <th className="py-2.5 px-3 font-normal">Customer</th>
                          <th className="py-2.5 px-3 font-normal">Items</th>
                          <th className="py-2.5 px-3 font-normal whitespace-nowrap">Total</th>
                          <th className="py-2.5 px-3 font-normal">Payment &amp; UTR</th>
                          <th className="py-2.5 px-3 font-normal whitespace-nowrap">Status</th>
                          <th className="py-2.5 px-3 font-normal text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5DDD1]/70 text-[#111113]">
                        {filteredOrders.map(o => (
                          <tr key={o.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                            <td className="py-2.5 px-3 align-top whitespace-nowrap">
                              <div className="space-y-0.5">
                                <span className="font-mono text-xs font-semibold text-[#111113] block">
                                  #SUKO-{1000 + o.id}
                                </span>
                                <span className="text-[10px] text-[#746F68] font-serif italic block">
                                  Atelier Client
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 align-top whitespace-nowrap">
                              <div className="space-y-0.5">
                                <span className="text-xs text-[#111113] font-mono block">
                                  {new Date(o.created_at || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </span>
                                <span className="text-[10px] text-[#746F68] font-mono block">
                                  {new Date(o.created_at || Date.now()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase()}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 align-top max-w-[170px]">
                              <div className="space-y-0.5 max-w-[165px]">
                                <p className="font-medium text-xs text-[#111113] truncate">{getUserDisplayName(o.user)}</p>
                                <p className="text-[10.5px] text-[#746F68] font-sans truncate">{o.city || o.shipping_city || "India"}</p>
                                <p className="text-[9px] sm:text-[9.5px] font-mono text-[#A8A196] truncate" title={o.user?.email || o.email || ""}>
                                  {o.user?.email || o.email || "—"}
                                </p>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 align-top max-w-[140px]">
                              <div className="space-y-0.5 max-w-[135px]">
                                <span className="text-xs font-serif text-[#111113] block truncate" title={o.items?.[0]?.product_name || o.items?.[0]?.name}>
                                  {o.items?.[0]?.product_name || o.items?.[0]?.name || "Tailored Garment"}
                                </span>
                                <span className="text-[10px] text-[#746F68] font-mono block">
                                  {o.items?.length || 1} {o.items?.length === 1 ? "piece" : "pieces"}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 align-top whitespace-nowrap">
                              <div className="space-y-0.5">
                                <span className="font-serif text-sm font-medium text-[#111113] block">
                                  {formatINR(o.total)}
                                </span>
                                <span className="text-[10px] text-[#746F68] font-mono block">
                                  {isFinanciallyPaid(o.status) ? "Settled" : "Pending"}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 align-top max-w-[145px]">
                              <div className="space-y-1 max-w-[140px]">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-sans text-[#111113]">
                                    {formatPaymentMethod(o.payment_method)}
                                  </span>
                                  {o.payment_screenshot_url && (
                                    <button
                                      type="button"
                                      onClick={() => openZoomedScreenshot(`${API_BASE_URL}/api/orders/${o.id}/payment-proof?token=${encodeURIComponent(token)}`)}
                                      className="text-[9px] font-mono uppercase tracking-wider text-[#A77B1E] hover:text-[#111113] hover:underline flex items-center gap-0.5 cursor-pointer"
                                      title="View Payment Proof Screenshot"
                                    >
                                      [Proof &nearr;]
                                    </button>
                                  )}
                                </div>
                                <div>
                                  <span className="text-[8.5px] uppercase tracking-[0.08em] text-[#746F68] font-mono block leading-none mb-0.5">
                                    UTR
                                  </span>
                                  {o.transaction_id ? (
                                    <p className="font-mono text-[10.5px] text-[#111113] font-medium tracking-wide select-all leading-none truncate" title={o.transaction_id}>
                                      {o.transaction_id}
                                    </p>
                                  ) : (
                                    <span className="text-[10px] text-[#A8A196] font-mono italic block leading-none">Not submitted</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 align-top whitespace-nowrap">
                              {o.status === "payment_verification_pending" ? (
                                <div className="space-y-1.5 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#8F6517] font-medium bg-transparent border border-[#D4B26F] px-2 py-0.5 rounded-[2px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" /> Awaiting Verification
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleVerifyPayment(o.id)}
                                      disabled={verifyingOrderId === o.id}
                                      className="text-[9.5px] font-mono font-medium bg-[#111113] hover:bg-[#C2922E] text-white px-2 py-0.5 rounded-[2px] transition-colors disabled:opacity-50 cursor-pointer"
                                      title="Verify & Confirm Payment"
                                    >
                                      {verifyingOrderId === o.id ? "..." : "Approve"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectPayment(o.id)}
                                      disabled={rejectingOrderId === o.id}
                                      className="text-[9.5px] font-mono font-medium text-[#8B3A3A] hover:text-[#111113] border border-[#D9A4A4] px-2 py-0.5 rounded-[2px] transition-colors disabled:opacity-50 cursor-pointer bg-transparent hover:bg-[#D9A4A4]/15"
                                      title="Reject Payment Proof"
                                    >
                                      {rejectingOrderId === o.id ? "..." : "Reject"}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="relative inline-block text-left whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => setOpenStatusDropdownOrderId(openStatusDropdownOrderId === o.id ? null : o.id)}
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border border-[#E5DDD1] bg-[#FAF8F5] hover:bg-[#EFE9DF] text-[10px] font-mono tracking-[0.08em] uppercase text-[#111113] font-medium transition-colors cursor-pointer whitespace-nowrap"
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${ORDER_STATUS_CONFIG.find(s => s.value === o.status)?.dotColor || "bg-[#8E877E]"}`} />
                                    <span>{formatStatus(o.status)}</span>
                                    <ChevronDown size={10} className={`text-[#746F68] transition-transform ${openStatusDropdownOrderId === o.id ? "rotate-180" : ""}`} />
                                  </button>

                                  {openStatusDropdownOrderId === o.id && (
                                    <div className="absolute left-0 mt-1 w-48 bg-[#FAF8F5] border border-[#E5DDD1] shadow-xl rounded-[2px] py-1 z-30 divide-y divide-[#E5DDD1]/40 animate-in fade-in duration-100">
                                      {ORDER_STATUS_CONFIG.map(opt => (
                                        <button
                                          key={opt.value}
                                          type="button"
                                          onClick={() => {
                                            handleUpdateOrderStatus(o.id, opt.value);
                                            setOpenStatusDropdownOrderId(null);
                                          }}
                                          className={`w-full px-3 py-1.5 text-left text-[10.5px] font-mono flex items-center justify-between hover:bg-[#EFE9DF]/60 transition-colors cursor-pointer ${o.status === opt.value ? "font-semibold text-[#111113] bg-[#EFE9DF]/30" : "text-[#55514B]"
                                            }`}
                                        >
                                          <span className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${opt.dotColor}`} />
                                            <span>{opt.label}</span>
                                          </span>
                                          {o.status === opt.value && <Check size={11} className="text-[#C2922E]" />}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 align-top text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => openOrderDetails(o)}
                                  className="text-xs text-[#111113] hover:text-[#C2922E] font-medium transition-colors cursor-pointer flex items-center gap-0.5 group"
                                >
                                  <span>View</span>
                                  <span className="transition-transform group-hover:translate-x-0.5 text-[#C2922E]">&rarr;</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditOrder(o)}
                                  className="text-xs text-[#746F68] hover:text-[#111113] transition-colors cursor-pointer"
                                >
                                  Edit
                                </button>
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setOpenActionMenuOrderId(openActionMenuOrderId === o.id ? null : o.id)}
                                    className="p-1 text-[#746F68] hover:text-[#111113] hover:bg-[#EFE9DF]/60 rounded-[2px] transition-colors cursor-pointer leading-none font-bold"
                                    title="More Actions"
                                  >
                                    <MoreHorizontal size={14} />
                                  </button>
                                  {openActionMenuOrderId === o.id && (
                                    <div className="absolute right-0 mt-1 w-44 bg-[#FAF8F5] border border-[#E5DDD1] shadow-xl rounded-[2px] py-1 z-30 divide-y divide-[#E5DDD1]/40">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionMenuOrderId(null);
                                          openOrderDetails(o);
                                        }}
                                        className="w-full px-3 py-1.5 text-left text-xs text-[#111113] hover:bg-[#EFE9DF]/60 transition-colors flex items-center justify-between cursor-pointer"
                                      >
                                        <span>Inspect Invoice</span>
                                        <ArrowUpRight size={11} className="text-[#8E877E]" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenActionMenuOrderId(null);
                                          handleDeleteOrder(o.id);
                                        }}
                                        className="w-full px-3 py-1.5 text-left text-xs text-[#8B3A3A] hover:bg-[#D9A4A4]/15 transition-colors flex items-center justify-between cursor-pointer font-medium"
                                      >
                                        <span>Delete Order</span>
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                          <tr><td colSpan="8" className="p-8 text-center text-[#746F68] font-sans italic">No orders found for this filter.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* COUPONS TAB */}
              {activeTab === "coupons" && (
                <div className="grid lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5">
                    <div className="border border-[#E8E4DC] bg-white rounded-2xl shadow-sm p-6 space-y-5">
                      <div className="border-b border-[#E8E4DC] pb-3">
                        <span className="text-[10px] uppercase tracking-[0.14em] text-[#C2922E] font-mono block mb-1">
                          — PROMOTIONAL VOUCHERS
                        </span>
                        <h2 className="text-xl font-quiche font-light text-[#121215]">Create Coupon</h2>
                      </div>

                      <form onSubmit={handleCreateCouponSubmit} className="space-y-4 font-body">
                        <div>
                          <label className="text-[10.5px] uppercase tracking-[0.12em] text-[#555560] font-mono block mb-1">Coupon Code *</label>
                          <input
                            type="text"
                            value={newCouponForm.code}
                            onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })}
                            placeholder="e.g. SUKO10, FESTIVE500"
                            required
                            className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-3.5 py-2 text-xs font-mono uppercase text-[#121215] focus:border-[#C2922E] outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10.5px] uppercase tracking-[0.12em] text-[#555560] font-mono block mb-1">Discount %</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={newCouponForm.discount_percent}
                              onChange={(e) => setNewCouponForm({ ...newCouponForm, discount_percent: e.target.value })}
                              placeholder="10"
                              className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-3.5 py-2 text-xs font-mono text-[#121215] focus:border-[#C2922E] outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10.5px] uppercase tracking-[0.12em] text-[#555560] font-mono block mb-1">Flat Discount (₹)</label>
                            <input
                              type="number"
                              value={newCouponForm.discount_flat}
                              onChange={(e) => setNewCouponForm({ ...newCouponForm, discount_flat: e.target.value })}
                              placeholder="500"
                              className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-3.5 py-2 text-xs font-mono text-[#121215] focus:border-[#C2922E] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10.5px] uppercase tracking-[0.12em] text-[#555560] font-mono block mb-1">Min Order Value (₹)</label>
                          <input
                            type="number"
                            value={newCouponForm.min_order_value}
                            onChange={(e) => setNewCouponForm({ ...newCouponForm, min_order_value: e.target.value })}
                            placeholder="2000"
                            className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-3.5 py-2 text-xs font-mono text-[#121215] focus:border-[#C2922E] outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-[#121215] hover:bg-[#C2922E] text-white py-3 rounded-xl text-xs uppercase tracking-[0.14em] font-bold shadow-md transition-all"
                        >
                          Create Voucher
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="lg:col-span-7">
                    <div className="border border-[#E8E4DC] bg-white rounded-2xl shadow-sm overflow-hidden">
                      <table className="w-full text-left font-body text-sm">
                        <thead className="bg-[#F6F2EA] text-[10px] uppercase tracking-[0.12em] text-[#555560] font-mono border-b border-[#E8E4DC]">
                          <tr>
                            <th className="p-4 font-normal">Code</th>
                            <th className="p-4 font-normal">Discount</th>
                            <th className="p-4 font-normal">Min Order</th>
                            <th className="p-4 font-normal text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8E4DC]/60 text-[#121215]">
                          {couponsList.map(c => (
                            <tr key={c.id} className="hover:bg-[#FAF8F5] transition-colors">
                              <td className="p-4 font-mono font-bold text-[#121215]">{c.code}</td>
                              <td className="p-4 text-xs font-mono text-[#C2922E]">
                                {c.discount_percent ? `${c.discount_percent}% OFF` : `₹${c.discount_flat} Flat`}
                              </td>
                              <td className="p-4 text-xs text-[#555560]">₹{c.min_order_value || 0}</td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleDeleteCoupon(c.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 border border-[#E8E4DC] rounded-lg p-2 transition-colors"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {couponsList.length === 0 && (
                            <tr><td colSpan="4" className="p-8 text-center text-[#888890]">No active coupons found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* BROADCAST EMAIL TAB */}
              {activeTab === "broadcast" && (
                <div className="border border-[#E8E4DC] bg-white rounded-2xl shadow-sm p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
                  <div className="border-b border-[#E8E4DC] pb-4">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-[#C2922E] font-mono block mb-1">
                      — CONCIERGE EMAIL DISPATCHER
                    </span>
                    <h2 className="text-2xl font-quiche font-light text-[#121215]">Client Broadcast Notification</h2>
                    <p className="text-xs text-[#555560] font-body mt-1">Send official updates, invitations, and promotional notices to registered clients.</p>
                  </div>

                  <form onSubmit={handleSendEmailSubmit} className="space-y-4 font-body">
                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.12em] text-[#555560] font-mono block mb-1">Target Audience</label>
                      <select
                        value={emailForm.target}
                        onChange={(e) => setEmailForm({ ...emailForm, target: e.target.value })}
                        className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-4 py-2.5 text-xs text-[#121215] focus:border-[#C2922E] outline-none"
                      >
                        <option value="single">Single Client Email</option>
                        <option value="all">All Registered Clients ({stats.totalUsers})</option>
                      </select>
                    </div>

                    {emailForm.target === "single" && (
                      <div>
                        <label className="text-[10.5px] uppercase tracking-[0.12em] text-[#555560] font-mono block mb-1">Recipient Email *</label>
                        <input
                          type="email"
                          value={emailForm.recipientEmail}
                          onChange={(e) => setEmailForm({ ...emailForm, recipientEmail: e.target.value })}
                          placeholder="client@luxury.com"
                          required
                          className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-4 py-2.5 text-xs text-[#121215] focus:border-[#C2922E] outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.12em] text-[#555560] font-mono block mb-1">Subject Header *</label>
                      <input
                        type="text"
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                        placeholder="e.g. Exclusive Preview: Festive Couture Collection"
                        required
                        className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-4 py-2.5 text-xs text-[#121215] focus:border-[#C2922E] outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] uppercase tracking-[0.12em] text-[#555560] font-mono block mb-1">Message Body *</label>
                      <textarea
                        rows={5}
                        value={emailForm.message}
                        onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                        placeholder="Compose your personalized message to the client..."
                        required
                        className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-4 py-2.5 text-xs text-[#121215] focus:border-[#C2922E] outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={sendingEmail}
                      className="w-full bg-[#121215] hover:bg-[#C2922E] text-white py-3.5 rounded-xl text-xs uppercase tracking-[0.14em] font-bold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {sendingEmail ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Transmitting Email...
                        </>
                      ) : (
                        <>
                          <Send size={15} /> Dispatch Email
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* CLIENT REVIEWS TAB */}
              {activeTab === "reviews" && (
                <div className="space-y-6">
                  <div className="border-b border-[#E8E4DC] pb-4">
                    <h2 className="text-2xl font-quiche font-light text-[#121215]">Client Reviews ({adminReviewsList.length})</h2>
                    <p className="text-xs text-[#555560] font-body">Moderate and manage published client reviews.</p>
                  </div>

                  <div className="border border-[#E8E4DC] bg-white rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-left font-body text-sm">
                      <thead className="bg-[#F6F2EA] text-[10px] uppercase tracking-[0.12em] text-[#555560] font-mono border-b border-[#E8E4DC]">
                        <tr>
                          <th className="p-4 font-normal">Client</th>
                          <th className="p-4 font-normal">Rating</th>
                          <th className="p-4 font-normal">Feedback</th>
                          <th className="p-4 font-normal text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E4DC]/60 text-[#121215]">
                        {adminReviewsList.map(r => (
                          <tr key={r.id} className="hover:bg-[#FAF8F5] transition-colors">
                            <td className="p-4 font-medium text-xs">{r.user?.name || "Client"}</td>
                            <td className="p-4">
                              <div className="flex items-center text-[#C2922E]">
                                {[...Array(r.rating || 5)].map((_, i) => (
                                  <Star key={i} size={13} fill="#C2922E" />
                                ))}
                              </div>
                            </td>
                            <td className="p-4 text-xs text-[#555560] max-w-md">"{r.comment}"</td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleDeleteReview(r.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 border border-[#E8E4DC] rounded-lg p-2 transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {adminReviewsList.length === 0 && (
                          <tr><td colSpan="4" className="p-8 text-center text-[#888890]">No reviews submitted yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* PAYMENTS TAB (Dedicated UPI QR Verification & UTR Audit)      */}
              {/* ============================================================= */}
              {activeTab === "payments" && (
                <div className="space-y-8">
                  {/* Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DDD1] pb-5">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.14em] text-[#C2922E] font-mono block mb-1">
                        — AUDIT & RECONCILIATION
                      </span>
                      <h2 className="text-2xl font-quiche font-light text-[#171717]">
                        UPI Payments & UTR Verification
                      </h2>
                      <p className="text-xs text-[#746F68] font-light mt-1">
                        Review manual QR payments, verify customer UTR reference codes, and approve orders.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10.5px] font-mono uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-800 border border-amber-500/30 font-semibold">
                        {verificationRequests.length} Pending Verification
                      </span>
                    </div>
                  </div>

                  {/* 1. PENDING VERIFICATION QUEUE */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm uppercase tracking-[0.16em] font-semibold text-[#171717] flex items-center gap-2">
                        <ShieldCheck size={16} className="text-[#C2922E]" />
                        Pending Approval Queue
                      </h3>
                      <span className="text-xs font-mono text-[#746F68]">
                        Awaiting administrative reconciliation
                      </span>
                    </div>

                    {verificationRequests.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {verificationRequests.map((order) => {
                          const clientName = order.user?.name || (order.shipping_address ? `${order.shipping_address.first_name || ""} ${order.shipping_address.last_name || ""}`.trim() : "Private Client");
                          const clientEmail = order.user?.email || order.shipping_address?.email || "No email";
                          const clientPhone = order.shipping_address?.phone || getUserPhone(order.user);

                          return (
                            <div
                              key={order.id}
                              className="bg-[#FCFAF7] border-2 border-amber-500/30 rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5"
                            >
                              {/* Card Header */}
                              <div className="flex items-start justify-between border-b border-[#E5DDD1] pb-4">
                                <div>
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                                    Verification Required
                                  </span>
                                  <h4 className="font-quiche text-xl text-[#171717] font-normal mt-2">
                                    Order #SUKO-{1000 + order.id}
                                  </h4>
                                  <p className="text-[11px] text-[#746F68] font-mono mt-0.5">
                                    Ordered on {new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] uppercase tracking-[0.14em] text-[#746F68] font-mono block">
                                    Order Total
                                  </span>
                                  <span className="font-quiche text-2xl font-normal text-[#171717]">
                                    {formatINR(order.total)}
                                  </span>
                                </div>
                              </div>

                              {/* Client & Payment Info Grid */}
                              <div className="grid grid-cols-2 gap-4 text-xs font-body">
                                <div className="space-y-1">
                                  <span className="text-[10px] uppercase tracking-wider text-[#746F68] font-mono block">Client</span>
                                  <p className="font-medium text-[#171717]">{clientName}</p>
                                  <p className="text-[11px] text-[#746F68] truncate">{clientEmail}</p>
                                  <p className="text-[11px] font-mono text-[#746F68]">{clientPhone}</p>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[10px] uppercase tracking-wider text-[#746F68] font-mono block">Payment Mode</span>
                                  <p className="font-medium text-[#171717]">UPI QR Transfer</p>
                                  <div className="pt-1">
                                    <span className="text-[10px] uppercase tracking-wider text-[#746F68] font-mono block">UTR / Transaction ID</span>
                                    {order.payment_transaction_id ? (
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="font-mono text-xs font-bold text-[#171717] bg-white border border-[#E5DDD1] px-2 py-0.5 rounded select-all">
                                          {order.payment_transaction_id}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(order.payment_transaction_id);
                                            toast.success("UTR copied to clipboard");
                                          }}
                                          className="p-1 text-[#746F68] hover:text-[#171717] border border-[#E5DDD1] rounded bg-white"
                                          title="Copy UTR"
                                        >
                                          <Copy size={11} />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-rose-600 font-mono italic">Not provided</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Screenshot Preview */}
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-[#746F68] font-mono block mb-2">
                                  Customer Payment Screenshot
                                </span>
                                {order.payment_screenshot_url ? (
                                  <div className="flex items-center gap-3 p-3 bg-white border border-[#E5DDD1] rounded-xl">
                                    <a
                                      href={order.payment_screenshot_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="group relative block w-16 h-16 rounded-lg overflow-hidden border border-[#E5DDD1] shrink-0 bg-[#FAF8F5]"
                                    >
                                      <img
                                        src={order.payment_screenshot_url}
                                        alt="Payment Screenshot"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Eye size={14} />
                                      </div>
                                    </a>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium text-[#171717]">Transfer Proof Attached</p>
                                      <p className="text-[11px] text-[#746F68] mt-0.5 font-light">Verify that bank name, UTR, and amount match.</p>
                                      <a
                                        href={order.payment_screenshot_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10.5px] uppercase tracking-wider text-[#C2922E] font-medium hover:underline inline-flex items-center gap-1 mt-1"
                                      >
                                        Open High-Res Proof <ArrowUpRight size={11} />
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl text-xs text-rose-700 font-light flex items-center gap-2">
                                    <AlertTriangle size={14} className="shrink-0" />
                                    <span>No screenshot uploaded with this submission. Verify bank statement manually using UTR.</span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#E5DDD1]">
                                <button
                                  type="button"
                                  onClick={() => handleVerifyPayment(order.id)}
                                  disabled={verifyingOrderId === order.id}
                                  className="flex-1 min-w-[140px] bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-4 rounded-xl text-[10.5px] uppercase tracking-[0.16em] font-semibold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                  {verifyingOrderId === order.id ? (
                                    <>
                                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                      Approving...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle size={14} /> Approve & Confirm
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRejectPayment(order.id)}
                                  disabled={rejectingOrderId === order.id}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-2.5 px-4 rounded-xl text-[10.5px] uppercase tracking-[0.16em] font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                  {rejectingOrderId === order.id ? "Rejecting..." : "Reject Proof"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openOrderDetails(order)}
                                  className="p-2.5 text-[#746F68] hover:text-[#171717] bg-white border border-[#E5DDD1] hover:border-[#171717] rounded-xl transition-colors cursor-pointer"
                                  title="Inspect Full Order"
                                >
                                  <Eye size={15} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-[#FCFAF7] border border-[#E5DDD1] rounded-2xl p-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
                          <Check size={20} />
                        </div>
                        <h4 className="font-quiche text-lg text-[#171717]">All UPI Payments Reconciled</h4>
                        <p className="text-xs text-[#746F68] font-light max-w-md mx-auto">
                          No pending payment verification requests. New customer UPI transfers will immediately appear here for your review.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 2. RECENT RECONCILED TRANSACTIONS TABLE */}
                  <div className="space-y-4 pt-6 border-t border-[#E5DDD1]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm uppercase tracking-[0.16em] font-semibold text-[#171717]">
                          Reconciled Paid Orders ({filteredPaidOrders.length})
                        </h3>
                        <p className="text-xs text-[#746F68] font-light mt-0.5">
                          Historical orders with verified payment settlements.
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#171717]">
                        Total Settled: {formatINR(filteredRevenue)}
                      </span>
                    </div>

                    <div className="border border-[#E5DDD1] bg-[#FCFAF7] rounded-2xl overflow-hidden shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-body text-xs">
                          <thead className="bg-[#FAF8F5] text-[9.5px] uppercase tracking-[0.18em] text-[#746F68] font-mono border-b border-[#E5DDD1]">
                            <tr>
                              <th className="p-4 font-medium">Order ID</th>
                              <th className="p-4 font-medium">Client</th>
                              <th className="p-4 font-medium">Amount</th>
                              <th className="p-4 font-medium">Method</th>
                              <th className="p-4 font-medium">UTR / Transaction ID</th>
                              <th className="p-4 font-medium">Settled Date</th>
                              <th className="p-4 font-medium text-right">Audit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5DDD1]/60 text-[#171717]">
                            {filteredPaidOrders.slice(0, 15).map((o) => {
                              const clientName = o.user?.name || (o.shipping_address ? `${o.shipping_address.first_name || ""} ${o.shipping_address.last_name || ""}`.trim() : "Client");
                              return (
                                <tr key={o.id} className="hover:bg-white transition-colors">
                                  <td className="p-4 font-mono font-bold text-[#171717]">
                                    #SUKO-{1000 + o.id}
                                  </td>
                                  <td className="p-4">
                                    <p className="font-medium text-[#171717]">{clientName}</p>
                                    <p className="text-[10px] text-[#746F68] truncate max-w-[150px]">{o.user?.email || "—"}</p>
                                  </td>
                                  <td className="p-4 font-mono font-bold text-[#171717]">
                                    {formatINR(o.total)}
                                  </td>
                                  <td className="p-4 font-mono text-[11px] text-[#746F68]">
                                    {formatPaymentMethod(o.payment_method)}
                                  </td>
                                  <td className="p-4 font-mono text-[11px] text-[#171717]">
                                    {o.payment_transaction_id || "Reconciled"}
                                  </td>
                                  <td className="p-4 font-mono text-[11px] text-[#746F68]">
                                    {new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                  </td>
                                  <td className="p-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => openOrderDetails(o)}
                                      className="p-1.5 text-[#746F68] hover:text-[#171717] border border-[#E5DDD1] rounded-lg hover:bg-[#FAF8F5] transition-colors"
                                      title="View Order Details"
                                    >
                                      <Eye size={13} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredPaidOrders.length === 0 && (
                              <tr>
                                <td colSpan="7" className="p-8 text-center text-[#746F68] font-light">
                                  No verified paid orders recorded in this date range.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* CLIENTS TAB (Registered Client Directory & Patron Profiles)    */}
              {/* ============================================================= */}
              {activeTab === "customers" && (
                <div className="space-y-8">
                  {/* Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DDD1] pb-5">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.14em] text-[#C2922E] font-mono block mb-1">
                        — PATRON DIRECTORY
                      </span>
                      <h2 className="text-2xl font-quiche font-light text-[#171717]">
                        Registered Clients ({uniqueClientsList.length})
                      </h2>
                      <p className="text-xs text-[#746F68] font-light mt-1">
                        Client accounts on record, placed orders, and lifetime atelier spend.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailForm({ target: "all", recipientEmail: "", subject: "", message: "" });
                        setActiveTab("broadcast");
                      }}
                      className="bg-[#171717] hover:bg-[#C2922E] text-white px-5 py-2.5 rounded-full text-[10px] uppercase tracking-[0.14em] font-medium transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                    >
                      <Mail size={13} /> Client Broadcast
                    </button>
                  </div>

                  {/* Client Metrics Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 bg-[#FCFAF7] border border-[#E5DDD1] rounded-2xl">
                      <span className="text-[10px] uppercase tracking-[0.12em] text-[#746F68] font-mono block mb-1">
                        Registered Clients
                      </span>
                      <span className="font-quiche text-3xl font-light text-[#171717]">
                        {uniqueClientsList.length}
                      </span>
                      <p className="text-[11px] text-[#746F68] font-light mt-1">Total patron accounts on record</p>
                    </div>

                    <div className="p-5 bg-[#FCFAF7] border border-[#E5DDD1] rounded-2xl">
                      <span className="text-[10px] uppercase tracking-[0.12em] text-[#746F68] font-mono block mb-1">
                        Paying Clients
                      </span>
                      <span className="font-quiche text-3xl font-light text-[#171717]">
                        {uniqueClientsList.filter(c => c.orderCount > 0).length}
                      </span>
                      <p className="text-[11px] text-[#746F68] font-light mt-1">Clients with verified orders</p>
                    </div>

                    <div className="p-5 bg-[#FCFAF7] border border-[#E5DDD1] rounded-2xl">
                      <span className="text-[10px] uppercase tracking-[0.12em] text-[#746F68] font-mono block mb-1">
                        Total Paid Volume
                      </span>
                      <span className="font-quiche text-3xl font-light text-[#171717]">
                        {formatINR(uniqueClientsList.reduce((acc, c) => acc + c.totalSpent, 0))}
                      </span>
                      <p className="text-[11px] text-[#746F68] font-light mt-1">Reconciled patron spend</p>
                    </div>
                  </div>

                  {/* Search & Filter Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FCFAF7] border border-[#E5DDD1] p-3 sm:p-4 rounded-xl">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#746F68]" />
                      <input
                        type="text"
                        placeholder="Search clients by name, email, phone or city..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="w-full bg-white border border-[#E5DDD1] rounded-lg pl-9 pr-4 py-2 text-xs text-[#171717] outline-none focus:border-[#C2922E]"
                      />
                    </div>
                    {clientSearch && (
                      <button
                        type="button"
                        onClick={() => setClientSearch("")}
                        className="text-[10.5px] uppercase tracking-wider text-[#746F68] hover:text-[#171717] font-mono px-2 py-1"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Client Directory Table */}
                  <div className="border border-[#E5DDD1] bg-[#FCFAF7] rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-body text-xs">
                        <thead className="bg-[#FAF8F5] text-[9.5px] uppercase tracking-[0.12em] text-[#746F68] font-mono border-b border-[#E5DDD1]">
                          <tr>
                            <th className="p-4 font-medium">Patron Name</th>
                            <th className="p-4 font-medium">Contact Details</th>
                            <th className="p-4 font-medium">Location</th>
                            <th className="p-4 font-medium">Orders Placed</th>
                            <th className="p-4 font-medium">Lifetime Spend</th>
                            <th className="p-4 font-medium">Last Order Date</th>
                            <th className="p-4 font-medium text-right">Concierge Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E5DDD1]/60 text-[#171717]">
                          {uniqueClientsList
                            .filter((c) => {
                              if (!clientSearch) return true;
                              const q = clientSearch.toLowerCase();
                              return (
                                c.name.toLowerCase().includes(q) ||
                                c.email.toLowerCase().includes(q) ||
                                c.phone.toLowerCase().includes(q) ||
                                c.city.toLowerCase().includes(q)
                              );
                            })
                            .map((client, idx) => (
                              <tr key={idx} className="hover:bg-white transition-colors">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#EFE5D2] text-[#C2922E] flex items-center justify-center font-serif text-xs font-bold shrink-0">
                                      {client.name.charAt(0).toUpperCase() || "C"}
                                    </div>
                                    <div>
                                      <p className="font-medium text-[#171717]">{client.name}</p>
                                      <p className="text-[10px] text-[#746F68] font-mono">Patron #{idx + 1}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <p className="text-xs text-[#171717]">{client.email || "—"}</p>
                                  <p className="text-[11px] text-[#746F68] font-mono">{client.phone}</p>
                                </td>
                                <td className="p-4 font-mono text-[11px] text-[#746F68]">
                                  {client.city}
                                </td>
                                <td className="p-4 font-mono text-xs">
                                  <span className="px-2 py-0.5 rounded bg-white border border-[#E5DDD1] font-semibold">
                                    {client.orderCount} {client.orderCount === 1 ? "order" : "orders"}
                                  </span>
                                </td>
                                <td className="p-4 font-mono font-bold text-xs text-[#171717]">
                                  {formatINR(client.totalSpent)}
                                </td>
                                <td className="p-4 font-mono text-[11px] text-[#746F68]">
                                  {client.lastOrderDate
                                    ? new Date(client.lastOrderDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                    : "—"}
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEmailForm({ target: "single", recipientEmail: client.email, subject: "", message: "" });
                                      setActiveTab("broadcast");
                                    }}
                                    className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] font-medium text-[#171717] hover:text-[#C2922E] border border-[#E5DDD1] hover:border-[#C2922E] px-2.5 py-1.5 rounded-lg bg-white transition-colors cursor-pointer"
                                    title="Send direct email"
                                  >
                                    <Mail size={12} /> Contact
                                  </button>
                                </td>
                              </tr>
                            ))}
                          {uniqueClientsList.length === 0 && (
                            <tr>
                              <td colSpan="7" className="p-8 text-center text-[#746F68] font-light">
                                No registered clients found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>

        {/* IMAGE CROPPER MODAL */}
        {cropperSrc && (
          <ImageCropperModal
            imageSrc={cropperSrc}
            onSave={(cropped) => {
              if (cropperCallback) cropperCallback(cropped);
            }}
            onCancel={() => closeModal("cropper")}
          />
        )}

        {/* PRODUCT DETAIL DRAWER (ATELIER GARMENT SPECIFICATION) */}
        {editingProduct && (
          <div
            className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={closeEditingProduct}
          >
            <div
              className="bg-[#FAF8F5] border-l border-[#E5DDD1] w-full max-w-lg h-full shadow-2xl flex flex-col text-[#111113] animate-in slide-in-from-right duration-250 ease-out overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* FIXED / STICKY DRAWER HEADER */}
              <div className="shrink-0 px-6 py-4 border-b border-[#E5DDD1] bg-[#FAF8F5] flex items-center justify-between sticky top-0 z-20">
                <div>
                  <span className="text-[9.5px] uppercase tracking-[0.16em] text-[#C2922E] font-mono font-medium block mb-0.5">
                    ATELIER ARCHIVE &middot; {isDrawerInEditMode ? "EDIT SPECIFICATIONS" : "GARMENT INSPECTION"}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-serif font-medium text-[#111113] tracking-tight leading-snug">
                    {editingProduct.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeEditingProduct}
                  className="p-1.5 text-[#746F68] hover:text-[#111113] hover:bg-[#EFE9DF] rounded-[2px] border border-[#E5DDD1] transition-colors cursor-pointer"
                  title="Close Drawer (Esc)"
                >
                  <X size={18} />
                </button>
              </div>

              {/* SCROLLABLE DRAWER BODY */}
              <div className="overflow-y-auto suko-scrollbar p-6 space-y-5 flex-1 font-body">
                {!isDrawerInEditMode ? (
                  /* INSPECTION MODE (CHANEL/DIOR ATELIER ARCHIVE VIEW) */
                  <div className="space-y-5">
                    {/* Portrait Lookbook Image */}
                    <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-3 text-center">
                      {editingProduct.image_url ? (
                        <img
                          src={editingProduct.image_url}
                          alt={editingProduct.name}
                          className="max-h-[280px] w-auto mx-auto object-contain rounded-[1px] shadow-xs"
                        />
                      ) : (
                        <div className="h-44 flex items-center justify-center text-xs font-mono text-[#746F68]">
                          No archival photograph uploaded
                        </div>
                      )}
                    </div>

                    {/* Pricing & Allocation Card */}
                    <div className="grid grid-cols-2 gap-3 bg-white border border-[#E5DDD1] p-4 rounded-[2px]">
                      <div>
                        <span className="text-[9.5px] font-mono uppercase tracking-wider text-[#746F68] block">Atelier Pricing</span>
                        <p className="font-serif text-2xl font-medium text-[#111113] mt-0.5">{formatINR(editingProduct.price)}</p>
                      </div>
                      <div>
                        <span className="text-[9.5px] font-mono uppercase tracking-wider text-[#746F68] block">Inventory Status</span>
                        <p className="font-serif text-xl font-medium text-[#111113] mt-0.5">
                          {String(editingProduct.stock).padStart(2, '0')} Available
                        </p>
                        <span className="text-[10px] text-[#746F68] font-mono">Showroom Allocation</span>
                      </div>
                      <div className="col-span-2 pt-2.5 border-t border-[#E5DDD1] flex flex-wrap gap-2">
                        <span className="text-[9.5px] uppercase font-mono tracking-wider text-[#C2922E] bg-[#C2922E]/10 border border-[#C2922E]/25 px-2 py-0.5 rounded-[2px]">
                          Collection: {typeof editingProduct.category === 'object' ? (editingProduct.category?.name || "Atelier Silhouette") : (categories.find(c => c.id === editingProduct.category_id || c.slug === editingProduct.category_id)?.name || editingProduct.categoryName || "Atelier Silhouette")}
                        </span>
                        {editingProduct.sub_category && (
                          <span className="text-[9.5px] uppercase font-mono tracking-wider text-[#746F68] bg-[#FAF8F5] border border-[#E5DDD1] px-2 py-0.5 rounded-[2px]">
                            Line: {editingProduct.sub_category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Size Allocation Map (Variants) */}
                    <div className="bg-white border border-[#E5DDD1] p-4 rounded-[2px] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-[#C2922E] font-medium block">
                          SIZE ALLOCATION VARIANTS
                        </span>
                        <span className="text-[10px] font-mono text-[#746F68]">
                          {Object.values(editingProduct.size_stock || {}).reduce((a, b) => a + (Number(b) || 0), 0) || editingProduct.stock} Total Units
                        </span>
                      </div>
                      {editingProduct.size_stock && typeof editingProduct.size_stock === 'object' && Object.keys(editingProduct.size_stock).length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {Object.entries(editingProduct.size_stock).map(([sz, qty]) => (
                            <div key={sz} className="text-center p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px]">
                              <span className="text-[9.5px] font-mono text-[#746F68] block">{sz}</span>
                              <span className="font-serif text-base font-medium text-[#111113] block mt-0.5">{qty}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] text-xs font-mono text-[#746F68]">
                          Standard allocation across silhouette sizes ({editingProduct.sizes?.join(', ') || "Free Size"}).
                        </div>
                      )}
                    </div>

                    {/* Fabric Weave & Description */}
                    <div className="bg-white border border-[#E5DDD1] p-4 rounded-[2px] space-y-1.5">
                      <span className="text-[9.5px] font-mono uppercase tracking-[0.16em] text-[#746F68] font-medium block">
                        FABRIC WEAVE &amp; SPECIFICATIONS
                      </span>
                      <p className="text-xs text-[#55514B] font-sans leading-relaxed">
                        {editingProduct.description || "Bespoke SUKO Atelier tailored garment. Handcrafted with bespoke Indian corporate wear standards, structured cuts, and premium suiting fabrics."}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* EDIT MODE (SPECIFICATION MODIFICATION FORM) */
                  <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-body">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.14em] text-[#746F68] font-mono block mb-1">Garment Title *</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full bg-white border border-[#E5DDD1] rounded-[2px] px-3.5 py-2 text-xs text-[#111113] focus:border-[#C2922E] outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.14em] text-[#746F68] font-mono block mb-1">Price (INR) *</label>
                        <input
                          type="number"
                          value={editFormData.price}
                          onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                          className="w-full bg-white border border-[#E5DDD1] rounded-[2px] px-3.5 py-2 text-xs text-[#111113] focus:border-[#C2922E] outline-none font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.14em] text-[#746F68] font-mono block mb-1">Silhouette Collection *</label>
                        <select
                          value={editFormData.category_id}
                          onChange={(e) => setEditFormData({ ...editFormData, category_id: e.target.value })}
                          className="w-full bg-white border border-[#E5DDD1] rounded-[2px] px-3.5 py-2 text-xs text-[#111113] focus:border-[#C2922E] outline-none cursor-pointer"
                        >
                          <option value="">Select Collection</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-[0.14em] text-[#746F68] font-mono block mb-1">Sub-Category Line Tag</label>
                      <input
                        type="text"
                        value={editFormData.sub_category}
                        onChange={(e) => setEditFormData({ ...editFormData, sub_category: e.target.value })}
                        placeholder="e.g. Luxury Wool, Corporate Festive"
                        className="w-full bg-white border border-[#E5DDD1] rounded-[2px] px-3.5 py-2 text-xs text-[#111113] focus:border-[#C2922E] outline-none"
                      />
                    </div>

                    {/* Size Stock Distribution */}
                    <div className="space-y-2 border border-[#E5DDD1] p-3.5 rounded-[2px] bg-white">
                      <label className="text-[9.5px] uppercase tracking-[0.14em] text-[#746F68] font-mono font-medium block">
                        Exact Size Allocation Map
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {["38", "40", "42", "44", "46", "Free"].map(sz => (
                          <div key={sz} className="text-center">
                            <span className="text-[9.5px] font-mono block text-[#746F68] mb-0.5">{sz}</span>
                            <input
                              type="number"
                              min="0"
                              value={editSizeStockMap[sz] ?? 0}
                              onChange={(e) => setEditSizeStockMap({ ...editSizeStockMap, [sz]: parseInt(e.target.value, 10) || 0 })}
                              className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] p-1.5 text-center text-xs font-mono text-[#111113] focus:border-[#C2922E] outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-[0.14em] text-[#746F68] font-mono block mb-1">Garment Narrative &amp; Weave</label>
                      <textarea
                        rows={3}
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        className="w-full bg-white border border-[#E5DDD1] rounded-[2px] px-3.5 py-2 text-xs text-[#111113] focus:border-[#C2922E] outline-none"
                      />
                    </div>
                  </form>
                )}
              </div>

              {/* FIXED / STICKY DRAWER FOOTER */}
              <div className="shrink-0 px-6 py-3.5 border-t border-[#E5DDD1] bg-[#FAF8F5] flex items-center justify-between gap-3 sticky bottom-0 z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
                {!isDrawerInEditMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsDrawerInEditMode(true)}
                      className="group flex-1 bg-[#111113] hover:bg-[#C2922E] text-white py-2.5 px-4 rounded-[2px] text-[10.5px] uppercase tracking-[0.14em] font-mono font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Edit2 size={13} className="text-[#C2922E] group-hover:text-white transition-colors" />
                      <span>Edit Garment Specs</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteProduct(editingProduct.id);
                        closeEditingProduct();
                      }}
                      className="p-2.5 text-[#746F68] hover:text-rose-800 hover:bg-rose-50 border border-[#E5DDD1] rounded-[2px] transition-colors cursor-pointer"
                      title="Delete Garment"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsDrawerInEditMode(false)}
                      className="flex-1 py-2.5 border border-[#E5DDD1] rounded-[2px] text-[10.5px] uppercase tracking-[0.14em] font-mono text-[#746F68] hover:text-[#111113] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleEditSubmit}
                      disabled={updatingProduct}
                      className="flex-1 bg-[#111113] hover:bg-[#C2922E] text-white py-2.5 px-4 rounded-[2px] text-[10.5px] uppercase tracking-[0.14em] font-mono font-medium shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {updatingProduct ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* INSPECT ORDER DETAILS MODAL */}
        {selectedOrderDetails && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={closeOrderDetails}
          >
            <div
              ref={inspectModalRef}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FAF8F5] border border-[#E5DDD1] max-w-2xl w-full rounded-[2px] shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden text-[#111113]"
            >
              {/* FIXED / STICKY HEADER - NEVER SCROLLS AWAY */}
              <div className="shrink-0 px-5 py-4 border-b border-[#E5DDD1] bg-[#FAF8F5] flex items-center justify-between sticky top-0 z-20">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#C2922E] font-mono font-medium block mb-0.5">
                    ATELIER OPERATIONS &middot; ORDER AUDIT
                  </span>
                  <h2 className="text-xl sm:text-2xl font-serif font-medium text-[#111113] tracking-tight leading-snug">
                    Order #SUKO-{1000 + selectedOrderDetails.id}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeOrderDetails}
                  className="p-1.5 text-[#746F68] hover:text-[#111113] hover:bg-[#EFE9DF] rounded-[2px] border border-[#E5DDD1] transition-colors cursor-pointer"
                  title="Close Inspector (Esc)"
                >
                  <X size={18} />
                </button>
              </div>

              {/* SCROLLABLE BODY */}
              <div className="overflow-y-auto suko-scrollbar p-5 sm:p-6 space-y-5 flex-1">
                {/* Client Info Grid */}
                <div className="grid grid-cols-2 gap-4 bg-[#F7F3ED] border border-[#E5DDD1] p-4 rounded-[2px] text-xs font-body">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-mono text-[#746F68]">Client Name</p>
                    <p className="font-medium text-[#111113]">{getUserDisplayName(selectedOrderDetails.user)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-mono text-[#746F68]">Client Email</p>
                    <p className="font-mono text-[#111113]">{selectedOrderDetails.user?.email || "Guest Client"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-mono text-[#746F68]">Phone</p>
                    <p className="font-mono text-[#111113]">{getUserPhone(selectedOrderDetails.user)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-mono text-[#746F68]">Order Status</p>
                    <div className="mt-1">
                      {renderStatusIndicator(selectedOrderDetails.status)}
                    </div>
                  </div>
                </div>

                {/* Dedicated Payment Verification & Audit Card */}
                <div className="bg-[#F7F3ED] border border-[#E5DDD1] p-5 rounded-[2px] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5DDD1] pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-[#C2922E]" />
                      <span className="text-[11px] uppercase tracking-[0.1em] font-mono font-medium text-[#111113]">
                        Payment Verification &amp; UTR Audit
                      </span>
                    </div>
                    <div>
                      {renderStatusIndicator(selectedOrderDetails.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-body">
                    {/* Left Column: Details & Checklist */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-mono text-[#746F68]">Order Payable Amount</p>
                        <p className="font-mono text-base font-semibold text-[#111113]">{formatINR(selectedOrderDetails.total)}</p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-mono text-[#746F68]">Customer Transaction ID / UTR</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="font-mono font-semibold text-xs bg-[#FAF8F5] px-2.5 py-1.5 rounded-[2px] border border-[#E5DDD1] text-[#111113] select-all tracking-wider">
                            {selectedOrderDetails.transaction_id || "Not submitted yet"}
                          </code>
                          {selectedOrderDetails.transaction_id && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedOrderDetails.transaction_id);
                                toast.success("UTR copied to clipboard!");
                              }}
                              className="text-[10px] uppercase tracking-widest font-mono text-[#C2922E] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Copy size={12} /> Copy
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-mono text-[#746F68]">Payment Method</p>
                        <p className="font-mono text-xs text-[#111113] font-medium">{formatPaymentMethod(selectedOrderDetails.payment_method)}</p>
                      </div>

                      {selectedOrderDetails.cancel_reason && (
                        <div className="p-3 bg-[#FAF8F5] border border-[#E5DDD1] border-l-2 border-l-[#8B3A3A] rounded-[2px] text-[11.5px] text-[#111113] space-y-1">
                          <span className="text-[9.5px] uppercase tracking-[0.14em] font-mono text-[#8B3A3A] font-medium block">
                            PAYMENT STATUS NOTE
                          </span>
                          <p className="font-sans leading-relaxed text-[#55514B]">
                            {selectedOrderDetails.cancel_reason}
                          </p>
                        </div>
                      )}

                      <div className="bg-[#FAF8F5] border border-[#E5DDD1] p-3.5 rounded-[2px] space-y-2 text-[11px]">
                        <span className="font-mono uppercase text-[9.5px] tracking-[0.16em] text-[#C2922E] font-medium block">
                          VERIFICATION CHECKLIST
                        </span>
                        <ul className="space-y-1.5 font-mono text-[11px] text-[#55514B]">
                          <li className="flex items-center gap-2">
                            <span className="text-[10px] text-[#A8A196] font-medium">01</span>
                            <span>Amount matches order total ({formatINR(selectedOrderDetails.total)})</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[10px] text-[#A8A196] font-medium">02</span>
                            <span>UTR matches payment proof ({selectedOrderDetails.transaction_id || "entered UTR"})</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[10px] text-[#A8A196] font-medium">03</span>
                            <span>Payment received in merchant account</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Right Column: Screenshot */}
                    <div className="space-y-2 flex flex-col">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wider font-mono text-[#746F68]">Uploaded Payment Screenshot</p>
                        {selectedOrderDetails.payment_screenshot_url && (
                          <span className="text-[9.5px] font-mono text-[#A77B1E] uppercase tracking-wider">
                            Click to inspect &nearr;
                          </span>
                        )}
                      </div>
                      {selectedOrderDetails.payment_screenshot_url ? (
                        <div
                          onClick={() => openZoomedScreenshot(`${API_BASE_URL}/api/orders/${selectedOrderDetails.id}/payment-proof?token=${encodeURIComponent(token)}`)}
                          className="relative group border border-[#E5DDD1] rounded-[2px] overflow-hidden bg-white flex-1 min-h-[240px] max-h-[300px] flex items-center justify-center cursor-pointer shadow-sm transition-all hover:border-[#C2922E]"
                        >
                          <img
                            src={`${API_BASE_URL}/api/orders/${selectedOrderDetails.id}/payment-proof?token=${encodeURIComponent(token)}`}
                            alt="Customer Payment Proof"
                            className="w-full h-full max-h-[260px] object-contain p-2 transition-transform duration-200 group-hover:scale-[1.02]"
                          />
                          <div
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-150 cursor-pointer text-white gap-2 backdrop-blur-[1px]"
                          >
                            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-[#C2922E]">
                              <Eye size={18} />
                            </div>
                            <span className="text-xs font-mono uppercase tracking-[0.14em] font-medium">
                              View Full Proof
                            </span>
                            <span className="text-[10px] text-white/70 font-sans">
                              Click to inspect receipt
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-[#E5DDD1] rounded-[2px] flex-1 min-h-[220px] flex flex-col items-center justify-center text-[#746F68] text-xs p-6 text-center bg-[#FAF8F5]">
                          <ImageIcon size={28} className="text-[#746F68]/40 mb-2" />
                          <p className="font-mono text-xs">No screenshot uploaded</p>
                          <p className="text-[10px] text-[#A8A196] mt-1">Garment order awaiting client slip</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verification Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-[#E5DDD1]">
                    {selectedOrderDetails.status === "paid" ? (
                      <div className="flex-1 py-2.5 px-4 bg-[#EFE9DF] border border-[#E5DDD1] text-[#111113] rounded-[2px] text-center font-mono text-[10.5px] uppercase tracking-[0.14em] font-medium flex items-center justify-center gap-2">
                        <CheckCircle size={15} className="text-[#A77B1E]" />
                        <span>Payment Verified &middot; Official Invoice Dispatched</span>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleVerifyPayment(selectedOrderDetails.id)}
                          disabled={selectedOrderDetails.status === "paid" || verifyingOrderId === selectedOrderDetails.id}
                          className="group flex-1 bg-[#111113] hover:bg-[#C2922E] disabled:opacity-40 text-[#FAF8F5] font-medium text-[10.5px] uppercase tracking-[0.14em] font-mono py-2.5 px-4 rounded-[2px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          <CheckCircle size={15} className="text-[#C2922E] group-hover:text-white transition-colors" />
                          {verifyingOrderId === selectedOrderDetails.id ? "VERIFYING..." : "VERIFY PAYMENT"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectPayment(selectedOrderDetails.id)}
                          disabled={selectedOrderDetails.status === "paid" || rejectingOrderId === selectedOrderDetails.id}
                          className="flex-1 bg-transparent hover:bg-rose-500/10 text-rose-800 hover:text-rose-900 border border-rose-300 disabled:opacity-40 font-medium text-[10.5px] uppercase tracking-[0.14em] font-mono py-2.5 px-4 rounded-[2px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <AlertTriangle size={15} />
                          {rejectingOrderId === selectedOrderDetails.id ? "REJECTING..." : "MARK AS ISSUE"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Items Purchased List */}
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[#746F68] font-mono">PURCHASED GARMENT ITEMS ({selectedOrderDetails.items?.length || 1})</p>
                  <div className="divide-y divide-[#E5DDD1] border-t border-b border-[#E5DDD1]">
                    {selectedOrderDetails.items?.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs font-body">
                        <div className="flex items-center gap-3">
                          {item.product?.image_url && (
                            <img src={item.product.image_url} alt={item.product.name} className="w-10 h-14 object-cover border border-[#E5DDD1] rounded-[2px]" />
                          )}
                          <div>
                            <p className="text-[#111113] font-medium text-xs">{item.product?.name || "Atelier Garment"}</p>
                            <p className="text-[#746F68] text-[10px] font-mono">Category: {item.product?.category?.name || "Atelier"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[#A77B1E] bg-[#A77B1E]/10 px-2 py-0.5 border border-[#A77B1E]/30 rounded-[2px] font-mono font-medium block mb-1 text-[10px]">
                            Size: {item.size || "STD"} (Qty: {item.quantity})
                          </span>
                          <span className="text-[#111113] font-medium font-mono">{formatINR(item.price_at_purchase || item.product?.price || 0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Summary */}
                <div className="flex justify-between items-center pt-2 font-mono text-sm border-t border-[#E5DDD1]">
                  <span className="text-[#746F68] uppercase tracking-widest text-xs">Total Amount Paid:</span>
                  <span className="text-[#111113] font-serif font-medium text-xl">{formatINR(selectedOrderDetails.total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ENLARGED PAYMENT SCREENSHOT MODAL */}
        {zoomedScreenshot && (
          <div
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
            onClick={closeZoomedScreenshot}
          >
            {/* Header Eyebrow */}
            <div className="text-center mb-4 space-y-1" onClick={(e) => e.stopPropagation()}>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C2922E] font-mono font-medium block">
                ATELIER OPERATIONS &middot; PAYMENT PROOF
              </span>
              <h3 className="text-lg sm:text-xl font-serif text-[#FAF8F5] tracking-tight">
                Customer Payment Verification
              </h3>
            </div>

            {/* Image Container Card */}
            <div
              className="bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] p-3 sm:p-4 shadow-2xl max-w-lg w-full max-h-[75vh] min-h-[350px] flex items-center justify-center overflow-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={zoomedScreenshot}
                alt="Customer Payment Proof Large"
                className="max-h-[68vh] w-auto max-w-full object-contain rounded-[1px] shadow-sm"
              />
            </div>

            {/* Bottom Close Action */}
            <button
              type="button"
              onClick={closeZoomedScreenshot}
              className="mt-4 px-6 py-2 border border-white/20 text-white/80 hover:text-white hover:border-white text-xs font-mono uppercase tracking-[0.16em] rounded-[2px] transition-colors flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10"
            >
              <span>Close</span>
              <span>&times;</span>
            </button>
          </div>
        )}

        {/* EDIT / MODIFY ORDER MODAL */}
        {editingOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={closeEditingOrder}
          >
            <div
              ref={editModalRef}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FAF8F5] border border-[#E5DDD1] max-w-md w-full rounded-[2px] shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden text-[#111113]"
            >
              {/* FIXED / STICKY HEADER - NEVER SCROLLS AWAY */}
              <div className="shrink-0 px-5 py-4 border-b border-[#E5DDD1] bg-[#FAF8F5] flex items-center justify-between sticky top-0 z-20">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[#C2922E] font-mono font-medium block mb-0.5">
                    ATELIER OPERATIONS &middot; ORDER MANAGEMENT
                  </span>
                  <h2 className="text-xl sm:text-2xl font-serif font-medium text-[#111113] tracking-tight leading-snug">
                    Edit Order #SUKO-{1000 + editingOrder.id}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeEditingOrder}
                  className="p-1.5 text-[#746F68] hover:text-[#111113] hover:bg-[#EFE9DF] rounded-[2px] border border-[#E5DDD1] transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X size={18} />
                </button>
              </div>

              {/* SCROLLABLE BODY */}
              <div className="overflow-y-auto suko-scrollbar p-5 sm:p-6 flex-1">
                <form onSubmit={handleSaveEditedOrder} className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.12em] text-[#746F68] block mb-1 font-mono">Order Total Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editOrderForm.total}
                      onChange={(e) => setEditOrderForm({ ...editOrderForm, total: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] px-3.5 py-2 text-xs font-mono text-[#111113] focus:border-[#C2922E] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.12em] text-[#746F68] block mb-1 font-mono">Order Status *</label>
                    <select
                      value={editOrderForm.status}
                      onChange={(e) => setEditOrderForm({ ...editOrderForm, status: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] px-3.5 py-2 text-xs font-mono text-[#111113] focus:border-[#C2922E] outline-none cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Settled / Paid</option>
                      <option value="processing">In Atelier / Processing</option>
                      <option value="cancel_requested">⚠️ Cancel Requested</option>
                      <option value="completed">Completed / Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.12em] text-[#746F68] block mb-1 font-mono">Modification Note</label>
                    <textarea
                      rows={3}
                      value={editOrderForm.cancel_reason}
                      onChange={(e) => setEditOrderForm({ ...editOrderForm, cancel_reason: e.target.value })}
                      placeholder="Optional Admin note or reason..."
                      className="w-full bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] px-3.5 py-2 text-xs font-sans text-[#111113] focus:border-[#C2922E] outline-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeEditingOrder}
                      className="flex-1 py-2.5 border border-[#E5DDD1] rounded-[2px] text-[10px] uppercase tracking-[0.14em] font-mono text-[#746F68] hover:text-[#111113] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#111113] hover:bg-[#C2922E] text-white font-medium text-[10px] uppercase tracking-[0.14em] font-mono rounded-[2px] transition-colors cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
