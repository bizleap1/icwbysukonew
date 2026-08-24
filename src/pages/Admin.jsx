import React, { useState, useEffect, useRef } from "react";
import { Navigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { 
  Package, Users, ShoppingCart, DollarSign, Trash2, Edit2,
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  Search, Download, AlertTriangle, Clock, X, Crop, Image as ImageIcon, Star, Eye, Tag, Mail, Send, MessageSquare, ShoppingBag,
  LayoutDashboard, Layers, ShieldCheck, CheckCircle, RefreshCw
} from "lucide-react";
import { formatINR } from "../data/products";
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
  const { user, token } = useAuth();
  const { refresh: refreshGlobalProducts } = useProducts();
  const [activeTab, setActiveTab] = useState("overview");
  const addFormRef = useRef(null);
  
  // Data States
  const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0 });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
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
      setEditingOrder(null);
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

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", price: "", stock: "", category_id: "", sub_category: "", description: "", sizes: "" });
  const [editSizeStockMap, setEditSizeStockMap] = useState({});
  const [editImage, setEditImage] = useState(null);
  const [updatingProduct, setUpdatingProduct] = useState(false);

  const handleOpenEdit = (p) => {
    setEditingProduct(p);

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
      setEditingProduct(null);
      setEditImage(null);
      setEditGalleryImages([]);
      fetchDashboardData();
      refreshGlobalProducts();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingProduct(false);
    }
  };

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
      if (prodRes.ok) setProducts(await prodRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
      if (catRes.ok) setCategories(await catRes.json());
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
      toast.success(`Order #${orderId} status updated to ${newStatus}`);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.message);
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
    const catLower = (p.category?.name || "").toLowerCase();
    const nameLower = p.name.toLowerCase();

    const isWomens = catLower.includes("women") || nameLower.includes("female") || nameLower.includes("women");
    const isMens = !isWomens && (catLower.includes("men") || nameLower.includes("male") || nameLower.includes("mens"));

    if (productGenderFilter === "mens" && !isMens) return false;
    if (productGenderFilter === "womens" && !isWomens) return false;
    if (productGenderFilter === "low_stock" && p.stock >= 5) return false;

    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = selectedCategory === "all" || String(p.category_id) === String(selectedCategory);
    return matchesSearch && matchesCat;
  });

  // Filtered Orders (by Status & Date Range)
  const cancellationRequests = orders.filter(o => o.status === "cancel_requested");
  const paidOrdersList = orders.filter(o => o.status === "paid" || o.status === "completed");

  const filteredOrders = orders.filter(o => {
    // 1. Status Filter
    if (orderStatusFilter !== "all") {
      if (orderStatusFilter === "paid" && !(o.status === "paid" || o.status === "completed")) return false;
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

  // Calculate Date-filtered Revenue & Stats dynamically
  const filteredRevenue = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  const filteredDeliveredCount = filteredOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length;

  // Low stock products (< 5)
  const lowStockProducts = products.filter(p => p.stock < 5);

  if (!user?.authenticated) return <Navigate to="/auth" />;
  if (user.role !== "admin") return <Navigate to="/" />;

  return (
    <div className="grain bg-[#FAF8F5] text-[#121215] font-body selection:bg-[#C2922E] selection:text-white pt-8 pb-32 px-4 sm:px-6 lg:px-12 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Luxury Studio Control Header Bar */}
        <div className="relative bg-[#121215] text-white border border-[#E8E4DC]/20 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl rounded-2xl overflow-hidden">
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-[#C2922E]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-0 bottom-0 w-64 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Left Title & Status */}
          <div className="relative z-10 flex flex-col gap-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <img src="/logo-light.png" alt="ICW BY SUKO" className="h-10 w-auto object-contain" />
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#C2922E] font-medium px-2.5 py-0.5 rounded-full bg-[#C2922E]/10 border border-[#C2922E]/20">
                Studio Control
              </span>
              <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Live Studio
              </span>
            </div>
            <p className="text-xs text-white/60 font-body font-light tracking-wide">
              Manage inventory, atelier orders, categories, vouchers & concierge operations
            </p>
          </div>

          {/* Right Action Buttons */}
          <div className="relative z-10 flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={exportOrdersCSV}
              className="text-[11px] uppercase tracking-[0.18em] font-body font-medium py-2.5 px-4 rounded-xl border border-white/15 bg-white/[0.04] text-white hover:bg-white/10 hover:border-[#C2922E]/40 transition-all flex items-center gap-2 shadow-sm group"
            >
              <Download size={14} className="text-[#C2922E] group-hover:scale-110 transition-transform" />
              <span>Export CSV</span>
            </button>

            <Link
              to="/"
              className="text-[11px] uppercase tracking-[0.18em] font-body font-bold py-2.5 px-5 rounded-xl bg-[#C2922E] text-white hover:bg-[#a67c24] transition-all flex items-center gap-2 shadow-md active:scale-98"
            >
              <ShoppingBag size={15} className="stroke-[2.5]" />
              <span>Storefront</span>
            </Link>
          </div>
        </div>

        {/* Tab Navigation Segmented Bar */}
        <div className="w-full bg-white border border-[#E8E4DC] p-1.5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'categories', label: 'Categories & New Item', icon: Layers },
              { 
                id: 'orders', 
                label: 'Orders',
                badge: cancellationRequests.length > 0 ? `${cancellationRequests.length} Cancel Req` : null,
                icon: ShoppingCart 
              },
              { id: 'coupons', label: 'Coupons & Vouchers', icon: Tag },
              { id: 'broadcast', label: 'Broadcast Email', icon: Mail },
              { id: 'reviews', label: 'Client Reviews', icon: Star },
              { id: 'calendar', label: 'Schedule', icon: CalendarIcon }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-[11px] uppercase tracking-[0.16em] font-body py-2.5 px-4 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 font-medium shrink-0 ${
                    isActive
                      ? "bg-[#121215] text-[#C2922E] border border-[#C2922E]/30 shadow-md font-semibold"
                      : "text-[#555560] hover:text-[#121215] hover:bg-[#FAF8F5]"
                  }`}
                >
                  <Icon size={14} className={isActive ? "text-[#C2922E]" : "text-[#888890]"} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#888890] text-[10px] uppercase tracking-[0.3em] font-body flex items-center justify-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-[#121215] border-t-transparent animate-spin" />
            Loading Studio Control...
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-8">

                {/* Global Date Filter Bar */}
                <div className="bg-white border border-[#E8E4DC] p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-[#C2922E]" />
                    <span className="text-xs uppercase tracking-[0.2em] font-mono text-[#121215] font-medium">Date-Wise Analytics:</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {[
                      { id: "all", label: "All Time" },
                      { id: "today", label: "Today" },
                      { id: "7days", label: "Last 7 Days" },
                      { id: "month", label: "This Month" },
                      { id: "custom", label: "Custom Range" },
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setDatePreset(preset.id)}
                        className={`text-[10px] uppercase tracking-[0.15em] font-body px-3.5 py-1.5 rounded-xl border transition-all ${
                          datePreset === preset.id
                            ? "border-[#C2922E] bg-[#C2922E]/10 text-[#C2922E] font-bold shadow-sm"
                            : "border-[#E8E4DC] text-[#555560] hover:text-[#121215] hover:border-[#C2922E]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}

                    {datePreset === "custom" && (
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg px-2.5 py-1 text-[#121215] outline-none focus:border-[#C2922E]"
                        />
                        <span className="text-[#888890]">to</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg px-2.5 py-1 text-[#121215] outline-none focus:border-[#C2922E]"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    icon={<DollarSign size={20} />} 
                    label="Period Revenue" 
                    value={formatINR(filteredRevenue)} 
                    subText={datePreset === "all" ? "Lifetime Earnings" : `Filtered Earnings (${datePreset})`} 
                  />
                  <StatCard 
                    icon={<ShoppingCart size={20} />} 
                    label="Period Orders" 
                    value={filteredOrders.length} 
                    subText={`${filteredDeliveredCount} Delivered`} 
                  />
                  <StatCard icon={<Package size={20} />} label="Total Products" value={stats.totalProducts} subText={`${lowStockProducts.length} Low Stock Alert`} />
                  <StatCard icon={<Users size={20} />} label="Registered Clients" value={stats.totalUsers} subText="Active Accounts" />
                </div>

                {/* Dashboard Grid: Calendar + Low Stock & Recent Activity */}
                <div className="grid lg:grid-cols-12 gap-8">
                  
                  {/* Calendar Widget (Left Column) */}
                  <div className="lg:col-span-7 border border-[#E8E4DC] p-6 bg-white rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <CalendarIcon size={18} className="text-[#C2922E]" />
                        <h2 className="font-quiche text-xl font-light text-[#121215]">Schedule & Events Calendar</h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                          className="p-1.5 hover:bg-[#FAF8F5] transition-colors border border-[#E8E4DC] rounded-lg text-[#555560] hover:text-[#121215]"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs uppercase tracking-[0.2em] font-mono text-[#121215]">
                          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button 
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                          className="p-1.5 hover:bg-[#FAF8F5] transition-colors border border-[#E8E4DC] rounded-lg text-[#555560] hover:text-[#121215]"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Calendar Grid Header */}
                    <div className="grid grid-cols-7 text-center mb-2 text-[10px] uppercase tracking-widest text-[#888890] font-mono">
                      <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {getDaysInMonth().map((day, idx) => {
                        if (!day) return <div key={idx} className="h-12 border border-transparent" />;
                        const dStr = dateKey(day);
                        const isSelected = dateKey(selectedDate) === dStr;
                        const isToday = dateKey(new Date()) === dStr;
                        const dayOrders = orders.filter(o => dateKey(new Date(o.created_at)) === dStr);
                        const hasNotes = (calendarNotes[dStr] || []).length > 0;

                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedDate(day)}
                            className={`h-12 border rounded-lg p-1.5 text-left flex flex-col justify-between transition-all relative ${
                              isSelected 
                                ? "border-[#C2922E] bg-[#C2922E]/10 text-[#C2922E] font-bold" 
                                : isToday 
                                ? "border-[#121215] bg-[#121215]/5" 
                                : "border-[#E8E4DC]/60 hover:border-[#C2922E] bg-white"
                            }`}
                          >
                            <span className={`text-xs font-body ${isToday ? "font-bold text-[#121215]" : "text-[#555560]"}`}>
                              {day.getDate()}
                            </span>
                            <div className="flex gap-1 items-center">
                              {dayOrders.length > 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title={`${dayOrders.length} orders`} />
                              )}
                              {hasNotes && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" title="Notes added" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Date Details & Reminders */}
                    <div className="mt-6 pt-6 border-t border-[#E8E4DC]">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs uppercase tracking-[0.2em] font-mono text-[#555560]">
                          Notes for {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>

                      {/* Add Note Input */}
                      <div className="flex gap-2 mb-4">
                        <input 
                          type="text"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Add studio reminder or task note..."
                          onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                          className="flex-1 bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-3.5 py-2 text-xs font-body focus:border-[#C2922E] focus:bg-white outline-none"
                        />
                        <button 
                          onClick={handleAddNote}
                          className="bg-[#121215] hover:bg-[#C2922E] text-white px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-body transition-all flex items-center gap-1 font-bold shadow-sm"
                        >
                          <Plus size={14} /> Add
                        </button>
                      </div>

                      {/* Notes List */}
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {(calendarNotes[dateKey(selectedDate)] || []).map((note) => (
                          <div key={note.id} className="flex items-center justify-between p-2.5 bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg text-xs font-body">
                            <span className="text-[#121215]">{note.text}</span>
                            <button 
                              onClick={() => handleDeleteNote(dateKey(selectedDate), note.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        {(!calendarNotes[dateKey(selectedDate)] || calendarNotes[dateKey(selectedDate)].length === 0) && (
                          <p className="text-xs text-[#888890] font-body text-center py-2">No notes for this date.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Low Stock & Activity Stream (Right Column) */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Low Stock Alert */}
                    <div className="border border-[#E8E4DC] p-6 bg-white rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={18} className="text-amber-600" />
                          <h3 className="font-quiche text-lg font-light text-[#121215]">Low Stock Alerts</h3>
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          {lowStockProducts.length} Items
                        </span>
                      </div>
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {lowStockProducts.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl font-body">
                            <div className="flex items-center gap-3">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className="w-9 h-12 object-cover rounded-md border border-[#E8E4DC]" />
                              ) : (
                                <div className="w-9 h-12 bg-white flex items-center justify-center text-[9px] text-[#888890] border border-[#E8E4DC] rounded-md">N/A</div>
                              )}
                              <div>
                                <p className="text-xs font-medium text-[#121215] truncate max-w-[150px]">{p.name}</p>
                                <p className="text-[10px] text-[#888890]">{formatINR(p.price)}</p>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                              {p.stock} left
                            </span>
                          </div>
                        ))}
                        {lowStockProducts.length === 0 && (
                          <p className="text-xs text-emerald-600 font-body py-4 text-center">All product stocks are healthy!</p>
                        )}
                      </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="border border-[#E8E4DC] p-6 bg-white rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock size={18} className="text-[#C2922E]" />
                        <h3 className="font-quiche text-lg font-light text-[#121215]">Recent Orders Stream</h3>
                      </div>
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {orders.slice(0, 5).map(o => (
                          <div key={o.id} className="flex items-center justify-between p-3 bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl font-body">
                            <div>
                              <p className="text-xs font-medium text-[#121215]">Order #SUKO-{1000 + o.id}</p>
                              <p className="text-[10px] text-[#888890]">{new Date(o.created_at).toLocaleDateString("en-IN")}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-[#121215]">{formatINR(o.total)}</p>
                              <span className="text-[9px] uppercase tracking-wider font-mono text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">{o.status}</span>
                            </div>
                          </div>
                        ))}
                        {orders.length === 0 && (
                          <p className="text-xs text-[#888890] font-body py-4 text-center">No recent orders.</p>
                        )}
                      </div>
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
                    <span className="text-sm uppercase tracking-[0.2em] font-mono text-[#121215]">
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
                        className={`h-28 border rounded-xl p-2.5 text-left cursor-pointer flex flex-col justify-between transition-all ${
                          isSelected ? "border-[#C2922E] bg-[#C2922E]/10" : isToday ? "border-[#121215] bg-[#121215]/5" : "border-[#E8E4DC]/60 hover:border-[#C2922E] bg-[#FAF8F5]"
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

            {/* PRODUCTS TAB */}
            {activeTab === "products" && (
              <div className="space-y-6">
                {/* Title & Count + Add Product Button */}
                <div className="flex items-center justify-between border-b border-[#E8E4DC] pb-4">
                  <div>
                    <h2 className="text-2xl font-quiche font-light text-[#121215]">Product Catalog</h2>
                    <p className="text-xs text-[#555560] font-body">Showing {filteredProducts.length} of {products.length} products</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("categories")}
                    className="bg-[#121215] hover:bg-[#C2922E] text-white px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-[0.2em] font-body transition-all flex items-center gap-2 font-bold shadow-md"
                  >
                    <Plus size={14} /> Add New Product
                  </button>
                </div>

                {/* Mini Navigation Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-[#E8E4DC] pb-4 gap-4">
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E8E4DC] overflow-x-auto shadow-sm">
                    {[
                      { id: "all", label: "All Products" },
                      { id: "womens", label: "Womenswear" },
                      { id: "low_stock", label: "Low Stock Alert" }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setProductGenderFilter(tab.id);
                          setSelectedCategory("all");
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-[10px] uppercase tracking-[0.18em] font-body transition-all whitespace-nowrap ${
                          productGenderFilter === tab.id 
                            ? "bg-[#121215] text-[#C2922E] font-bold shadow-sm" 
                            : "text-[#555560] hover:text-[#121215] hover:bg-[#FAF8F5]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search & Category Filter */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888890]" />
                      <input
                        type="text"
                        placeholder="Search product..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full sm:w-56 bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl pl-9 pr-3 py-2 text-xs font-body focus:border-[#C2922E] focus:bg-white outline-none"
                      />
                    </div>
                    <select 
                      value={selectedCategory} 
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-3 py-2 text-xs font-body focus:border-[#C2922E] focus:bg-white outline-none text-[#121215]"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-[#E8E4DC] bg-white rounded-2xl shadow-sm">
                  <table className="w-full text-left font-body text-sm">
                    <thead className="bg-[#F6F2EA] text-[10px] uppercase tracking-[0.2em] text-[#555560] font-mono border-b border-[#E8E4DC]">
                      <tr>
                        <th className="p-4 font-normal">Image</th>
                        <th className="p-4 font-normal">Name & Details</th>
                        <th className="p-4 font-normal">Price</th>
                        <th className="p-4 font-normal">Stock & Sizes</th>
                        <th className="p-4 font-normal text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E4DC]/60 text-[#121215]">
                      {filteredProducts.map(p => (
                        <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="p-4">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-12 h-16 object-cover bg-[#FAF8F5] border border-[#E8E4DC] rounded-md" />
                            ) : (
                              <div className="w-12 h-16 bg-[#FAF8F5] rounded-md flex items-center justify-center text-[10px] text-[#888890] border border-[#E8E4DC]">N/A</div>
                            )}
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-sm text-[#121215]">{p.name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {p.category && <span className="text-[9px] uppercase tracking-wider text-[#555560] border border-[#E8E4DC] bg-[#FAF8F5] px-2 py-0.5 rounded-full">{p.category.name}</span>}
                              {p.sub_category && <span className="text-[9px] uppercase tracking-wider text-[#C2922E] border border-[#C2922E]/30 bg-[#C2922E]/10 px-2 py-0.5 rounded-full">{p.sub_category}</span>}
                              {p.sizes?.length > 0 && <span className="text-[9px] uppercase tracking-wider text-[#888890] border border-[#E8E4DC] px-2 py-0.5 rounded-full">Sizes: {p.sizes.join(', ')}</span>}
                            </div>
                          </td>
                          <td className="p-4 text-[#121215] font-medium">{formatINR(p.price)}</td>
                          <td className="p-4">
                            <span className={p.stock < 5 ? "text-amber-700 font-bold block" : "text-[#121215] block font-bold"}>
                              {p.stock} Total Items
                            </span>
                            {p.size_stock && typeof p.size_stock === 'object' && Object.keys(p.size_stock).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                                {Object.entries(p.size_stock).map(([sz, qty]) => (
                                  <span key={sz} className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${qty < 2 ? "text-amber-700 border-amber-500/30 bg-amber-500/10 font-bold" : "text-[#555560] border-[#E8E4DC] bg-[#FAF8F5]"}`}>
                                    {sz}:{qty}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => handleOpenEdit(p)} className="text-[#555560] hover:text-[#121215] hover:bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg p-2 transition-colors" title="Edit Product">
                                <Edit2 size={15} />
                              </button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 border border-[#E8E4DC] rounded-lg p-2 transition-colors" title="Delete Product">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr><td colSpan="5" className="p-8 text-center text-[#888890]">No products found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CATEGORIES & NEW PRODUCT TAB */}
            {activeTab === "categories" && (
              <div className="grid lg:grid-cols-12 gap-8">
                {/* LEFT SIDE: CATEGORIES MANAGEMENT */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#E8E4DC] pb-3">
                    <h2 className="text-xl font-quiche font-light text-[#121215]">Categories ({categories.length})</h2>
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryInline(!showAddCategoryInline)}
                      className="text-xs uppercase tracking-wider text-[#C2922E] hover:underline font-body font-bold"
                    >
                      {showAddCategoryInline ? "Cancel" : "+ Add Category"}
                    </button>
                  </div>

                  {showAddCategoryInline && (
                    <div className="p-4 border border-[#E8E4DC] bg-white rounded-2xl shadow-sm space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-[#555560] font-mono block">New Category Name</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="e.g. Footwear, Outerwear..."
                          className="flex-1 bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-3 py-2 text-sm font-body outline-none focus:border-[#C2922E]"
                        />
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          className="bg-[#121215] hover:bg-[#C2922E] text-white px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-body font-bold transition-all shadow-sm"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="border border-[#E8E4DC] bg-white rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-left font-body text-sm">
                      <thead className="bg-[#F6F2EA] text-[10px] uppercase tracking-[0.2em] text-[#555560] font-mono border-b border-[#E8E4DC]">
                        <tr>
                          <th className="p-4 font-normal">Category Name</th>
                          <th className="p-4 font-normal">Products</th>
                          <th className="p-4 font-normal text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8E4DC]/60 text-[#121215]">
                        {categories.map(cat => {
                          const linkedCount = products.filter(p => p.category_id === cat.id).length;
                          return (
                            <tr key={cat.id} className="hover:bg-[#FAF8F5] transition-colors">
                              <td className="p-4 font-medium text-[#121215]">{cat.name}</td>
                              <td className="p-4 text-[#555560]">{linkedCount} items</td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => handleDeleteCategory(cat.id)} 
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 border border-[#E8E4DC] rounded-lg p-2 transition-colors"
                                  title="Delete Category"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RIGHT SIDE: ADD NEW PRODUCT FORM */}
                <div className="lg:col-span-7">
                  <div className="border border-[#E8E4DC] bg-white rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
                    <div className="border-b border-[#E8E4DC] pb-4">
                      <span className="text-[10px] uppercase tracking-[0.25em] text-[#C2922E] font-mono block mb-1">
                        — ATELIER CATALOG ENTRY
                      </span>
                      <h2 className="text-2xl font-quiche font-light text-[#121215]">Add New Garment</h2>
                    </div>

                    <form onSubmit={handleUploadSubmit} className="space-y-5 font-body">
                      <div>
                        <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1.5">Garment Title *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g. Silk Blend Nehru Kurta"
                          required
                          className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-4 py-2.5 text-xs text-[#121215] focus:border-[#C2922E] focus:bg-white outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1.5">Price (INR) *</label>
                          <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="4990"
                            required
                            className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-4 py-2.5 text-xs text-[#121215] focus:border-[#C2922E] focus:bg-white outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1.5">Category *</label>
                          <select
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleInputChange}
                            required
                            className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-4 py-2.5 text-xs text-[#121215] focus:border-[#C2922E] focus:bg-white outline-none"
                          >
                            <option value="">Select Category</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1.5">Sub-Category Tag</label>
                          <input
                            type="text"
                            name="sub_category"
                            value={formData.sub_category}
                            onChange={handleInputChange}
                            placeholder="e.g. Luxury Velvet, Festive"
                            className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-4 py-2.5 text-xs text-[#121215] focus:border-[#C2922E] focus:bg-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1.5">Total Fallback Stock</label>
                          <input
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleInputChange}
                            placeholder="25"
                            className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-4 py-2.5 text-xs text-[#121215] focus:border-[#C2922E] focus:bg-white outline-none font-mono"
                          />
                        </div>
                      </div>

                      {/* Size Stock Distribution Map */}
                      <div className="space-y-2 border border-[#E8E4DC] p-4 rounded-xl bg-[#FAF8F5]">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase tracking-[0.2em] text-[#555560] font-mono">Exact Size Inventory Map</label>
                          <span className="text-[10px] font-mono text-[#C2922E]">
                            Total: {Object.values(sizeStockMap).reduce((a, b) => a + (Number(b) || 0), 0)} units
                          </span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {["38", "40", "42", "44", "46", "Free"].map(sz => (
                            <div key={sz} className="text-center">
                              <span className="text-[10px] font-mono block text-[#888890] mb-1">{sz}</span>
                              <input
                                type="number"
                                min="0"
                                value={sizeStockMap[sz] ?? 0}
                                onChange={(e) => setSizeStockMap({ ...sizeStockMap, [sz]: parseInt(e.target.value, 10) || 0 })}
                                className="w-full bg-white border border-[#E8E4DC] rounded-lg p-1.5 text-center text-xs font-mono text-[#121215] focus:border-[#C2922E] outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1.5">Garment Description</label>
                        <textarea
                          name="description"
                          rows={3}
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Provide garment specifications, fabric weave, styling details..."
                          className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-4 py-2.5 text-xs text-[#121215] focus:border-[#C2922E] focus:bg-white outline-none"
                        />
                      </div>

                      {/* Image Upload / Cropping Zone */}
                      <div className="space-y-3">
                        <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#555560] font-mono block">Product Imagery Gallery</label>
                        <div className="border-2 border-dashed border-[#E8E4DC] hover:border-[#C2922E] bg-[#FAF8F5] hover:bg-white rounded-2xl p-6 text-center transition-all">
                          <ImageIcon size={28} className="mx-auto text-[#C2922E] mb-2" />
                          <p className="text-xs text-[#121215] font-medium">Click or drag images to upload</p>
                          <p className="text-[10px] text-[#888890] mt-1">JPEG, PNG, WebP up to 10MB each (Auto-optimized)</p>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleAddGalleryFiles}
                            className="mt-3 text-xs text-[#555560] file:mr-3 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#121215] file:text-white hover:file:bg-[#C2922E] cursor-pointer"
                          />
                        </div>

                        {/* Gallery Preview Items */}
                        {galleryFiles.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                            {galleryFiles.map((item, idx) => (
                              <div key={idx} className="relative group border border-[#E8E4DC] rounded-xl overflow-hidden bg-white shadow-sm">
                                <img src={item.preview} alt={`Upload ${idx}`} className="w-full h-24 object-cover" />
                                {item.isPrimary && (
                                  <span className="absolute top-1 left-1 bg-[#C2922E] text-white text-[8px] font-mono uppercase px-1.5 py-0.5 rounded">
                                    Primary
                                  </span>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCropperSrc(item.preview);
                                      setCropperCallback(() => (cropped) => {
                                        setGalleryFiles(prev => prev.map((g, i) => i === idx ? { ...g, file: cropped.file, preview: cropped.preview } : g));
                                        setCropperSrc(null);
                                      });
                                    }}
                                    className="p-1 bg-white rounded text-[#121215] hover:bg-[#C2922E] hover:text-white transition-colors"
                                    title="Crop Image"
                                  >
                                    <Crop size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setGalleryFiles(prev => prev.filter((_, i) => i !== idx))}
                                    className="p-1 bg-red-600 rounded text-white hover:bg-red-700 transition-colors"
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
                        className="w-full bg-[#121215] hover:bg-[#C2922E] text-white py-3.5 px-8 rounded-xl text-xs uppercase tracking-[0.22em] font-bold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {uploading ? (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            Creating Product Entry...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={15} /> Publish to Storefront
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
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-[#E8E4DC] pb-4 gap-4">
                  <div>
                    <h2 className="text-2xl font-quiche font-light text-[#121215]">Client Orders ({filteredOrders.length})</h2>
                    <p className="text-xs text-[#555560] font-body">Real-time atelier order lifecycle & fulfillment</p>
                  </div>

                  {/* Status Filter Tabs */}
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#E8E4DC] overflow-x-auto shadow-sm">
                    {[
                      { id: "all", label: "All" },
                      { id: "paid", label: "Paid" },
                      { id: "processing", label: "Processing" },
                      { id: "cancel_requested", label: "Cancel Req" },
                      { id: "completed", label: "Completed" },
                      { id: "cancelled", label: "Cancelled" }
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setOrderStatusFilter(st.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-[0.18em] font-body transition-all whitespace-nowrap ${
                          orderStatusFilter === st.id
                            ? "bg-[#121215] text-[#C2922E] font-bold shadow-sm"
                            : "text-[#555560] hover:text-[#121215] hover:bg-[#FAF8F5]"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders Data Table */}
                <div className="overflow-x-auto border border-[#E8E4DC] bg-white rounded-2xl shadow-sm">
                  <table className="w-full text-left font-body text-sm">
                    <thead className="bg-[#F6F2EA] text-[10px] uppercase tracking-[0.2em] text-[#555560] font-mono border-b border-[#E8E4DC]">
                      <tr>
                        <th className="p-4 font-normal">Order #</th>
                        <th className="p-4 font-normal">Date</th>
                        <th className="p-4 font-normal">Customer</th>
                        <th className="p-4 font-normal">Items</th>
                        <th className="p-4 font-normal">Total</th>
                        <th className="p-4 font-normal">Status</th>
                        <th className="p-4 font-normal text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E4DC]/60 text-[#121215]">
                      {filteredOrders.map(o => (
                        <tr key={o.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="p-4 font-mono font-bold text-[#121215]">
                            #SUKO-{1000 + o.id}
                          </td>
                          <td className="p-4 text-xs text-[#555560]">
                            {new Date(o.created_at || Date.now()).toLocaleDateString("en-IN")}
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-xs text-[#121215]">{getUserDisplayName(o.user)}</p>
                            <p className="text-[10px] font-mono text-[#888890]">{o.user?.email || "Guest Client"}</p>
                          </td>
                          <td className="p-4 text-xs text-[#555560]">
                            {o.items?.length || 1} item(s)
                          </td>
                          <td className="p-4 font-bold text-xs text-[#121215]">
                            {formatINR(o.total)}
                          </td>
                          <td className="p-4">
                            <select
                              value={o.status}
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                              className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border outline-none cursor-pointer ${
                                o.status === "paid" || o.status === "completed"
                                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 font-bold"
                                  : o.status === "cancel_requested"
                                  ? "bg-rose-500/10 text-rose-700 border-rose-500/30 font-bold animate-pulse"
                                  : o.status === "cancelled"
                                  ? "bg-stone-500/10 text-stone-600 border-stone-500/20"
                                  : "bg-amber-500/10 text-amber-700 border-amber-500/30 font-medium"
                              }`}
                            >
                              <option value="payment_pending">Payment Pending</option>
                              <option value="paid">Paid</option>
                              <option value="processing">Processing</option>
                              <option value="cancel_requested">⚠️ Cancel Requested</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedOrderDetails(o)}
                                className="text-[#555560] hover:text-[#121215] hover:bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg p-2 transition-colors"
                                title="Inspect Details"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() => handleOpenEditOrder(o)}
                                className="text-[#555560] hover:text-[#121215] hover:bg-[#FAF8F5] border border-[#E8E4DC] rounded-lg p-2 transition-colors"
                                title="Edit Order"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(o.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 border border-[#E8E4DC] rounded-lg p-2 transition-colors"
                                title="Delete Order"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredOrders.length === 0 && (
                        <tr><td colSpan="7" className="p-8 text-center text-[#888890]">No orders found for this filter.</td></tr>
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
                      <span className="text-[10px] uppercase tracking-[0.25em] text-[#C2922E] font-mono block mb-1">
                        — PROMOTIONAL VOUCHERS
                      </span>
                      <h2 className="text-xl font-quiche font-light text-[#121215]">Create Coupon</h2>
                    </div>

                    <form onSubmit={handleCreateCouponSubmit} className="space-y-4 font-body">
                      <div>
                        <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1">Coupon Code *</label>
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
                          <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1">Discount %</label>
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
                          <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1">Flat Discount (₹)</label>
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
                        <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1">Min Order Value (₹)</label>
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
                        className="w-full bg-[#121215] hover:bg-[#C2922E] text-white py-3 rounded-xl text-xs uppercase tracking-[0.2em] font-bold shadow-md transition-all"
                      >
                        Create Voucher
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="border border-[#E8E4DC] bg-white rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-left font-body text-sm">
                      <thead className="bg-[#F6F2EA] text-[10px] uppercase tracking-[0.2em] text-[#555560] font-mono border-b border-[#E8E4DC]">
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
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#C2922E] font-mono block mb-1">
                    — CONCIERGE EMAIL DISPATCHER
                  </span>
                  <h2 className="text-2xl font-quiche font-light text-[#121215]">Client Broadcast Notification</h2>
                  <p className="text-xs text-[#555560] font-body mt-1">Send official updates, invitations, and promotional notices to registered clients.</p>
                </div>

                <form onSubmit={handleSendEmailSubmit} className="space-y-4 font-body">
                  <div>
                    <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1">Target Audience</label>
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
                      <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1">Recipient Email *</label>
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
                    <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1">Subject Header *</label>
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
                    <label className="text-[10.5px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1">Message Body *</label>
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
                    className="w-full bg-[#121215] hover:bg-[#C2922E] text-white py-3.5 rounded-xl text-xs uppercase tracking-[0.22em] font-bold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
                    <thead className="bg-[#F6F2EA] text-[10px] uppercase tracking-[0.2em] text-[#555560] font-mono border-b border-[#E8E4DC]">
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

          </div>
        )}

        {/* IMAGE CROPPER MODAL */}
        {cropperSrc && (
          <ImageCropperModal
            imageSrc={cropperSrc}
            onSave={(cropped) => {
              if (cropperCallback) cropperCallback(cropped);
            }}
            onCancel={() => setCropperSrc(null)}
          />
        )}

        {/* EDIT PRODUCT MODAL */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white border border-[#E8E4DC] max-w-2xl w-full p-6 sm:p-8 rounded-2xl relative shadow-2xl space-y-5 text-[#121215]">
              <button
                onClick={() => setEditingProduct(null)}
                className="absolute top-5 right-5 text-[#888890] hover:text-[#121215] p-1.5 rounded-lg hover:bg-[#FAF8F5] transition-all"
              >
                <X size={18} />
              </button>

              <div className="border-b border-[#E8E4DC] pb-3">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#C2922E] font-mono block mb-1">
                  — ATELIER EDIT ENTRY
                </span>
                <h2 className="text-2xl font-quiche font-light text-[#121215]">
                  Edit "{editingProduct.name}"
                </h2>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 font-body text-xs">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1">Garment Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-3.5 py-2 text-xs text-[#121215] focus:border-[#C2922E] outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1">Price (INR)</label>
                    <input
                      type="number"
                      value={editFormData.price}
                      onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-3.5 py-2 text-xs text-[#121215] focus:border-[#C2922E] outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1">Category</label>
                    <select
                      value={editFormData.category_id}
                      onChange={(e) => setEditFormData({ ...editFormData, category_id: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-3.5 py-2 text-xs text-[#121215] focus:border-[#C2922E] outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Size Stock Distribution */}
                <div className="space-y-2 border border-[#E8E4DC] p-3 rounded-xl bg-[#FAF8F5]">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#555560] font-mono block">Exact Size Inventory</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {["38", "40", "42", "44", "46", "Free"].map(sz => (
                      <div key={sz} className="text-center">
                        <span className="text-[10px] font-mono block text-[#888890] mb-1">{sz}</span>
                        <input
                          type="number"
                          min="0"
                          value={editSizeStockMap[sz] ?? 0}
                          onChange={(e) => setEditSizeStockMap({ ...editSizeStockMap, [sz]: parseInt(e.target.value, 10) || 0 })}
                          className="w-full bg-white border border-[#E8E4DC] rounded-lg p-1.5 text-center text-xs font-mono text-[#121215] focus:border-[#C2922E] outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#555560] font-mono block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-3.5 py-2 text-xs text-[#121215] focus:border-[#C2922E] outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 py-3 border border-[#E8E4DC] rounded-xl text-[10px] uppercase tracking-[0.2em] font-body text-[#555560] hover:text-[#121215] hover:bg-[#FAF8F5] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingProduct}
                    className="flex-1 py-3 bg-[#121215] hover:bg-[#C2922E] text-white font-bold text-[10px] uppercase tracking-[0.2em] font-body rounded-xl shadow-md transition-all"
                  >
                    {updatingProduct ? "Saving..." : "Save Product Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* INSPECT ORDER DETAILS MODAL */}
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div ref={inspectModalRef} className="bg-white border border-[#E8E4DC] max-w-xl w-full p-6 sm:p-8 rounded-2xl relative shadow-2xl space-y-5 text-[#121215]">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="absolute top-5 right-5 text-[#888890] hover:text-[#121215] p-1.5 rounded-lg hover:bg-[#FAF8F5] transition-all"
              >
                <X size={18} />
              </button>

              <div className="border-b border-[#E8E4DC] pb-3">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#C2922E] font-mono block mb-1">
                  — ORDER AUDIT INSPECTOR
                </span>
                <h2 className="text-2xl font-quiche font-light text-[#121215]">
                  Order #SUKO-{1000 + selectedOrderDetails.id}
                </h2>
              </div>

              {/* Client Info Grid */}
              <div className="grid grid-cols-2 gap-4 bg-[#FAF8F5] border border-[#E8E4DC] p-4 rounded-xl text-xs font-body">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-mono text-[#888890]">Client Name</p>
                  <p className="font-bold text-[#121215]">{getUserDisplayName(selectedOrderDetails.user)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-mono text-[#888890]">Client Email</p>
                  <p className="font-mono text-[#121215]">{selectedOrderDetails.user?.email || "Guest Client"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-mono text-[#888890]">Phone</p>
                  <p className="font-mono text-[#121215]">{getUserPhone(selectedOrderDetails.user)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-mono text-[#888890]">Order Status</p>
                  <span className="inline-block mt-0.5 text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 font-bold">
                    {selectedOrderDetails.status}
                  </span>
                </div>
              </div>

              {/* Items Purchased List */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#555560] font-mono">PURCHASED GARMENT ITEMS ({selectedOrderDetails.items?.length || 1})</p>
                <div className="divide-y divide-[#E8E4DC]/60 border-t border-b border-[#E8E4DC]">
                  {selectedOrderDetails.items?.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs font-body">
                      <div className="flex items-center gap-3">
                        {item.product?.image_url && (
                          <img src={item.product.image_url} alt={item.product.name} className="w-10 h-14 object-cover border border-[#E8E4DC] rounded-md" />
                        )}
                        <div>
                          <p className="text-[#121215] font-bold text-sm">{item.product?.name || "Atelier Garment"}</p>
                          <p className="text-[#888890] text-[10px]">Category: {item.product?.category?.name || "Atelier"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[#C2922E] bg-[#C2922E]/10 px-2 py-0.5 border border-[#C2922E]/30 rounded font-mono font-bold block mb-1 text-[10px]">
                          Size: {item.size || "STD"} (Qty: {item.quantity})
                        </span>
                        <span className="text-[#121215] font-bold font-mono">{formatINR(item.price_at_purchase || item.product?.price || 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="flex justify-between items-center pt-2 font-mono text-sm border-t border-[#E8E4DC]">
                <span className="text-[#555560] uppercase tracking-widest text-xs">Total Amount Paid:</span>
                <span className="text-emerald-700 font-bold text-xl">{formatINR(selectedOrderDetails.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* EDIT / MODIFY ORDER MODAL */}
        {editingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div ref={editModalRef} className="bg-white border border-[#E8E4DC] max-w-md w-full p-6 sm:p-8 rounded-2xl relative shadow-2xl space-y-5 text-[#121215]">
              <button
                onClick={() => setEditingOrder(null)}
                className="absolute top-5 right-5 text-[#888890] hover:text-[#121215] p-1.5 rounded-lg hover:bg-[#FAF8F5] transition-all"
              >
                <X size={18} />
              </button>

              <div className="border-b border-[#E8E4DC] pb-3">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#C2922E] font-mono block mb-1">
                  — MODIFY ORDER SPECS
                </span>
                <h2 className="text-2xl font-quiche font-light text-[#121215]">
                  Edit Order #SUKO-{1000 + editingOrder.id}
                </h2>
              </div>

              <form onSubmit={handleSaveEditedOrder} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#555560] block mb-1">Order Total Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editOrderForm.total}
                    onChange={(e) => setEditOrderForm({ ...editOrderForm, total: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-3.5 py-2 text-xs font-mono text-[#121215] focus:border-[#C2922E] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#555560] block mb-1">Order Status *</label>
                  <select
                    value={editOrderForm.status}
                    onChange={(e) => setEditOrderForm({ ...editOrderForm, status: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-3.5 py-2 text-xs font-mono text-[#121215] focus:border-[#C2922E] outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="processing">Processing</option>
                    <option value="cancel_requested">⚠️ Cancel Requested</option>
                    <option value="completed">Completed / Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-[#555560] block mb-1">Modification Note</label>
                  <textarea
                    rows={3}
                    value={editOrderForm.cancel_reason}
                    onChange={(e) => setEditOrderForm({ ...editOrderForm, cancel_reason: e.target.value })}
                    placeholder="Optional Admin note or reason..."
                    className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-3.5 py-2 text-xs font-body text-[#121215] focus:border-[#C2922E] outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="flex-1 py-3 border border-[#E8E4DC] rounded-xl text-[10px] uppercase tracking-[0.2em] font-body text-[#555560] hover:text-[#121215] hover:bg-[#FAF8F5] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#121215] hover:bg-[#C2922E] text-white font-bold text-[10px] uppercase tracking-[0.2em] font-body rounded-xl shadow-md transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subText }) => (
  <div className="border border-[#E8E4DC] p-6 bg-white rounded-2xl shadow-sm hover:border-[#C2922E]/50 transition-all flex items-start gap-4">
    <div className="w-11 h-11 rounded-xl bg-[#C2922E]/10 text-[#C2922E] flex items-center justify-center shrink-0 mt-0.5">
      {icon}
    </div>
    <div>
      <p className="text-[10.5px] uppercase tracking-[0.22em] text-[#888890] font-mono mb-1">{label}</p>
      <p className="font-quiche text-3xl font-light text-[#121215] tracking-tight">{value}</p>
      {subText && <p className="text-[11px] text-[#555560] font-body mt-1">{subText}</p>}
    </div>
  </div>
);

export default Admin;
