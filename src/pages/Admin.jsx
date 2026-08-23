import React, { useState, useEffect, useRef } from "react";
import { Navigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { 
  Package, Users, ShoppingCart, DollarSign, Trash2, Edit2,
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, 
  Search, Download, AlertTriangle, Clock, X, Crop, Image as ImageIcon, Star, Eye, Tag, Mail, Send, MessageSquare, ShoppingBag,
  LayoutDashboard, Layers
} from "lucide-react";
import { formatINR } from "../data/products";
import { useProducts } from "../context/ProductContext";
import ImageCropperModal from "../components/ImageCropperModal";
import { API_BASE_URL } from "../config/api";

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
      const data = await res.json();
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
    
    const toastId = toast.loading(`Auto-optimizing ${selected.length} image(s)...`);
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
    toast.success("Images auto-compressed for high-speed loading!");
  };

  const handleEditAddGalleryFiles = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = Array.from(e.target.files);
    
    const toastId = toast.loading(`Auto-optimizing ${selected.length} image(s)...`);
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
    toast.success("Images auto-compressed!");
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

      toast.success("Product successfully created!");
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
    <div className="grain pt-8 pb-32 px-6 lg:px-12 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Revamped Luxury Header Bar */}
        <div className="relative bg-gradient-to-r from-stone-950 via-zinc-900 to-stone-950 border border-white/10 p-5 px-6 md:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl rounded-2xl overflow-hidden">
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-0 bottom-0 w-64 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Left Title & Status */}
          <div className="relative z-10 flex flex-col gap-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <img src="/logo-light.png" alt="ICW BY SUKO" className="h-10 w-auto object-contain" />
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-400/90 font-medium px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                Control Panel
              </span>
              <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Live Production
              </span>
            </div>
            <p className="text-xs text-foreground/50 font-body font-light tracking-wide">
              Manage inventory, client orders, categories, and studio operations
            </p>
          </div>

          {/* Right Action Buttons */}
          <div className="relative z-10 flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={exportOrdersCSV}
              className="text-[11px] uppercase tracking-[0.18em] font-body font-medium py-2.5 px-4 rounded-xl border border-white/15 bg-white/[0.04] text-white hover:bg-white/10 hover:border-amber-400/40 transition-all flex items-center gap-2 shadow-sm group"
            >
              <Download size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Export CSV</span>
            </button>

            <Link
              to="/"
              className="text-[11px] uppercase tracking-[0.18em] font-body font-bold py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.25)] hover:shadow-[0_6px_24px_rgba(245,158,11,0.35)] active:scale-98"
            >
              <ShoppingBag size={15} className="stroke-[2.5]" />
              <span>Storefront</span>
            </Link>
          </div>
        </div>

        {/* Tab Navigation Segmented Bar */}
        <div className="w-full bg-stone-900/60 backdrop-blur-2xl border border-white/10 p-1.5 rounded-2xl shadow-2xl">
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
                  className={`text-[11px] uppercase tracking-[0.15em] font-body py-2.5 px-4 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 font-medium shrink-0 ${
                    isActive
                      ? "bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-600/20 border border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-semibold"
                      : "border border-transparent text-foreground/60 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon size={14} className={isActive ? "text-amber-400" : "text-foreground/50"} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-foreground/50 text-[10px] uppercase tracking-[0.3em] font-body flex items-center justify-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
            Loading Control Panel...
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-8">

                {/* Global Date Filter Bar */}
                <div className="bg-white/5 border border-white/10 p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-emerald-400" />
                    <span className="text-xs uppercase tracking-[0.2em] font-body text-white font-medium">Date-Wise Analytics Filter:</span>
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
                        className={`text-[10px] uppercase tracking-[0.15em] font-body px-3 py-1.5 border transition-all ${
                          datePreset === preset.id
                            ? "border-emerald-400 bg-emerald-500/10 text-emerald-400 font-bold shadow-md"
                            : "border-white/15 text-foreground/60 hover:text-white hover:border-white/40"
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
                          className="bg-black/50 border border-white/20 px-2 py-1 text-white outline-none focus:border-emerald-400"
                        />
                        <span className="text-foreground/40">to</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="bg-black/50 border border-white/20 px-2 py-1 text-white outline-none focus:border-emerald-400"
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
                  <StatCard icon={<Users size={20} />} label="Registered Users" value={stats.totalUsers} subText="Active Accounts" />
                </div>

                {/* Dashboard Grid: Calendar + Low Stock & Recent Activity */}
                <div className="grid lg:grid-cols-12 gap-8">
                  
                  {/* Calendar Widget (Left Column) */}
                  <div className="lg:col-span-7 border border-white/10 p-6 bg-background/50 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <CalendarIcon size={18} className="text-foreground/70" />
                        <h2 className="font-display text-xl">Schedule & Events Calendar</h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                          className="p-1.5 hover:bg-white/10 transition-colors border border-white/10"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs uppercase tracking-[0.2em] font-body">
                          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button 
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                          className="p-1.5 hover:bg-white/10 transition-colors border border-white/10"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Calendar Grid Header */}
                    <div className="grid grid-cols-7 text-center mb-2 text-[10px] uppercase tracking-widest text-foreground/40 font-body">
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
                            className={`h-12 border p-1 text-left flex flex-col justify-between transition-all relative ${
                              isSelected 
                                ? "border-foreground bg-white/10" 
                                : isToday 
                                ? "border-white/40 bg-white/5" 
                                : "border-white/5 hover:border-white/20"
                            }`}
                          >
                            <span className={`text-xs font-body ${isToday ? "font-bold text-foreground" : "text-foreground/70"}`}>
                              {day.getDate()}
                            </span>
                            <div className="flex gap-1 items-center">
                              {dayOrders.length > 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title={`${dayOrders.length} orders`} />
                              )}
                              {hasNotes && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Notes added" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Date Details & Reminders */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs uppercase tracking-[0.2em] font-body text-foreground/70">
                          Notes for {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>

                      {/* Add Note Input */}
                      <div className="flex gap-2 mb-4">
                        <input 
                          type="text"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Add event reminder or note..."
                          onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                          className="flex-1 bg-transparent border border-white/15 px-3 py-2 text-xs font-body focus:border-foreground outline-none"
                        />
                        <button 
                          onClick={handleAddNote}
                          className="bg-foreground text-background px-4 py-2 text-[10px] uppercase tracking-widest font-body hover:bg-foreground/90 transition-all flex items-center gap-1"
                        >
                          <Plus size={14} /> Add
                        </button>
                      </div>

                      {/* Notes List */}
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {(calendarNotes[dateKey(selectedDate)] || []).map((n) => (
                          <div key={n.id} className="flex items-center justify-between p-2.5 bg-white/5 border border-white/5 text-xs font-body">
                            <span className="text-foreground/90">{n.text}</span>
                            <button 
                              onClick={() => handleDeleteNote(dateKey(selectedDate), n.id)} 
                              className="text-foreground/40 hover:text-red-400"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        {(calendarNotes[dateKey(selectedDate)] || []).length === 0 && (
                          <p className="text-[11px] text-foreground/40 italic font-body">No notes scheduled for this date.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Low Stock Alerts & Quick Orders */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Low Stock Alert Box */}
                    <div className="border border-white/10 p-6 bg-background/50 backdrop-blur-md">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-amber-400">
                          <AlertTriangle size={18} />
                          <h3 className="font-display text-lg text-foreground">Low Stock Inventory</h3>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.2em] font-body bg-amber-400/10 text-amber-400 px-2 py-0.5 border border-amber-400/20">
                          {lowStockProducts.length} Items
                        </span>
                      </div>

                      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                        {lowStockProducts.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5">
                            <div>
                              <p className="text-xs font-medium font-body">{p.name}</p>
                              <p className="text-[10px] text-foreground/50">{formatINR(p.price)}</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-1 border border-amber-400/20">
                              {p.stock} left
                            </span>
                          </div>
                        ))}
                        {lowStockProducts.length === 0 && (
                          <p className="text-xs text-foreground/50 font-body py-4 text-center">All product stocks are healthy!</p>
                        )}
                      </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="border border-white/10 p-6 bg-background/50 backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock size={18} className="text-foreground/70" />
                        <h3 className="font-display text-lg">Recent Order Stream</h3>
                      </div>
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {orders.slice(0, 5).map(o => (
                          <div key={o.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 font-body">
                            <div>
                              <p className="text-xs font-medium">Order #{o.id}</p>
                              <p className="text-[10px] text-foreground/50">{new Date(o.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium">{formatINR(o.total)}</p>
                              <span className="text-[9px] uppercase tracking-wider text-emerald-400">{o.status}</span>
                            </div>
                          </div>
                        ))}
                        {orders.length === 0 && (
                          <p className="text-xs text-foreground/50 font-body py-4 text-center">No recent orders.</p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* CALENDAR TAB FULL */}
            {activeTab === "calendar" && (
              <div className="border border-white/10 p-8 bg-background/50 backdrop-blur-md">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-display text-3xl">Full Calendar & Scheduler</h2>
                    <p className="text-xs text-foreground/50 font-body mt-1">Manage events, track daily sales highlights & add admin tasks.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                      className="p-2 border border-white/15 hover:border-foreground transition-all"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm uppercase tracking-[0.2em] font-body">
                      {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button 
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                      className="p-2 border border-white/15 hover:border-foreground transition-all"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 text-center mb-3 text-xs uppercase tracking-widest text-foreground/50 font-body">
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
                        className={`h-28 border p-2 text-left cursor-pointer flex flex-col justify-between transition-all ${
                          isSelected ? "border-foreground bg-white/10" : isToday ? "border-white/40 bg-white/5" : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-body ${isToday ? "font-bold text-foreground" : "text-foreground/70"}`}>
                            {day.getDate()}
                          </span>
                          {dayOrders.length > 0 && (
                            <span className="text-[9px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1 py-0.5 border border-emerald-500/30">
                              {dayOrders.length} orders
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 max-h-16 overflow-y-auto">
                          {notes.map(n => (
                            <div key={n.id} className="text-[9px] bg-white/10 px-1.5 py-0.5 truncate text-foreground/80">
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
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-2xl font-display">Product Catalog</h2>
                    <p className="text-xs text-foreground/50 font-body">Showing {filteredProducts.length} of {products.length} products</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("categories")}
                    className="bg-foreground text-background px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-body hover:bg-foreground/90 transition-all flex items-center gap-2 font-bold"
                  >
                    <Plus size={14} /> Add New Product
                  </button>
                </div>

                {/* Mini Navigation Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-white/10 pb-4 gap-4">
                  <div className="flex items-center gap-1.5 bg-white/5 p-1 border border-white/10 overflow-x-auto">
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
                        className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] font-body transition-all whitespace-nowrap ${
                          productGenderFilter === tab.id 
                            ? "bg-foreground text-background font-bold shadow" 
                            : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Search & Category Filter */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                      <input
                        type="text"
                        placeholder="Search product..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full sm:w-56 bg-transparent border border-white/15 pl-9 pr-3 py-1.5 text-xs font-body focus:border-foreground outline-none"
                      />
                    </div>
                    <select 
                      value={selectedCategory} 
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-transparent border border-white/15 px-3 py-1.5 text-xs font-body focus:border-foreground outline-none [&>option]:bg-background"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-white/5 bg-background/50 backdrop-blur-sm">
                  <table className="w-full text-left font-body text-sm">
                    <thead className="bg-white/5 text-[10px] uppercase tracking-[0.2em] text-foreground/60 border-b border-white/10">
                      <tr>
                        <th className="p-4 font-normal">Image</th>
                        <th className="p-4 font-normal">Name & Details</th>
                        <th className="p-4 font-normal">Price</th>
                        <th className="p-4 font-normal">Stock & Sizes</th>
                        <th className="p-4 font-normal text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredProducts.map(p => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-12 h-16 object-cover bg-white/10 border border-white/10" />
                            ) : (
                              <div className="w-12 h-16 bg-white/10 flex items-center justify-center text-[10px] text-white/30">N/A</div>
                            )}
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-base">{p.name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {p.category && <span className="text-[9px] uppercase tracking-wider text-foreground/60 border border-white/10 px-1.5 py-0.5">{p.category.name}</span>}
                              {p.sub_category && <span className="text-[9px] uppercase tracking-wider text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5">{p.sub_category}</span>}
                              {p.sizes?.length > 0 && <span className="text-[9px] uppercase tracking-wider text-foreground/40 border border-white/5 px-1.5 py-0.5">Sizes: {p.sizes.join(', ')}</span>}
                            </div>
                          </td>
                          <td className="p-4 text-foreground/90 font-medium">{formatINR(p.price)}</td>
                          <td className="p-4">
                            <span className={p.stock < 5 ? "text-amber-400 font-bold block" : "text-foreground/80 block font-bold"}>
                              {p.stock} Total Items
                            </span>
                            {p.size_stock && typeof p.size_stock === 'object' && Object.keys(p.size_stock).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                                {Object.entries(p.size_stock).map(([sz, qty]) => (
                                  <span key={sz} className={`text-[9px] font-mono px-1.5 py-0.5 border ${qty < 2 ? "text-amber-400 border-amber-500/30 bg-amber-500/10 font-bold" : "text-foreground/60 border-white/10"}`}>
                                    {sz}:{qty}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right flex items-center justify-end gap-1">
                            <button onClick={() => handleOpenEdit(p)} className="text-foreground/60 hover:text-foreground transition-colors p-2" title="Edit Product">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="text-red-400/80 hover:text-red-400 transition-colors p-2" title="Delete Product">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr><td colSpan="5" className="p-8 text-center text-foreground/50">No products found.</td></tr>
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
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h2 className="text-xl font-display">Categories ({categories.length})</h2>
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryInline(!showAddCategoryInline)}
                      className="text-xs uppercase tracking-wider text-emerald-400 hover:underline font-body font-bold"
                    >
                      {showAddCategoryInline ? "Cancel" : "+ Add Category"}
                    </button>
                  </div>

                  {showAddCategoryInline && (
                    <div className="p-4 border border-white/15 bg-white/5 space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-body block">New Category Name</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="e.g. Footwear, Outerwear..."
                          className="flex-1 bg-transparent border-b border-white/20 px-2 py-1.5 text-sm font-body outline-none focus:border-foreground"
                        />
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          className="bg-foreground text-background px-4 py-1.5 text-[10px] uppercase tracking-widest font-body font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="border border-white/10 bg-background/50 backdrop-blur-sm overflow-hidden">
                    <table className="w-full text-left font-body text-sm">
                      <thead className="bg-white/5 text-[10px] uppercase tracking-[0.2em] text-foreground/60 border-b border-white/10">
                        <tr>
                          <th className="p-4 font-normal">Category Name</th>
                          <th className="p-4 font-normal">Products</th>
                          <th className="p-4 font-normal text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {categories.map(cat => {
                          const linkedCount = products.filter(p => p.category_id === cat.id).length;
                          return (
                            <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-4 font-medium text-foreground">{cat.name}</td>
                              <td className="p-4 text-foreground/70">{linkedCount} items</td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => handleDeleteCategory(cat.id)} 
                                  className="text-red-400/80 hover:text-red-400 p-2 transition-colors"
                                  title="Delete Category"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {categories.length === 0 && (
                          <tr><td colSpan="3" className="p-8 text-center text-foreground/50">No custom categories added yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RIGHT SIDE: ADD NEW PRODUCT FORM */}
                <div className="lg:col-span-7">
                  <div className="border border-white/10 p-6 sm:p-8 bg-background/50 backdrop-blur-sm">
                    <h2 className="text-xl font-display mb-6">— Add New Product</h2>
                    <form onSubmit={handleUploadSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-body">Product Name *</label>
                        <input name="name" value={formData.name} onChange={handleInputChange} required className="w-full bg-transparent border-b border-white/15 focus:border-foreground outline-none py-2 text-sm font-body" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-body">Price (₹) *</label>
                        <input name="price" type="number" value={formData.price} onChange={handleInputChange} required className="w-full bg-transparent border-b border-white/15 focus:border-foreground outline-none py-2 text-sm font-body" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* CATEGORY (MAIN) */}
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-body">Category *</label>
                          <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="w-full bg-transparent border-b border-white/15 focus:border-foreground outline-none py-2 text-sm font-body [&>option]:bg-background">
                            <option value="">Select Category</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* SUB CATEGORY */}
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-body">Sub Category</label>
                          <select name="sub_category" value={formData.sub_category} onChange={handleInputChange} className="w-full bg-transparent border-b border-white/15 focus:border-foreground outline-none py-2 text-sm font-body [&>option]:bg-background">
                            <option value="">No Sub Category</option>
                            <option value="Womens">Womens</option>
                          </select>
                        </div>
                      </div>

                      {/* SIZE-WISE STOCK MANAGER */}
                      <div className="space-y-3 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-body">Size-Wise Stock Inventory *</label>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20">
                            Total Stock: {Object.values(sizeStockMap).reduce((a, b) => a + (Number(b) || 0), 0)}
                          </span>
                        </div>

                        {/* Quick Preset Toggles */}
                        <div className="flex flex-wrap gap-1.5 bg-white/5 p-2 border border-white/10 items-center">
                          <span className="text-[9px] uppercase tracking-wider text-foreground/40 self-center mr-1">Presets:</span>
                          {["38", "40", "42", "44", "46", "S", "M", "L", "XL"].map(sz => {
                            const isActive = sz in sizeStockMap;
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => {
                                  if (isActive) {
                                    const updated = { ...sizeStockMap };
                                    delete updated[sz];
                                    setSizeStockMap(updated);
                                  } else {
                                    setSizeStockMap({ ...sizeStockMap, [sz]: 5 });
                                  }
                                }}
                                className={`px-2 py-0.5 text-[10px] font-mono border transition-all ${
                                  isActive 
                                    ? "bg-foreground text-background font-bold border-foreground" 
                                    : "text-foreground/60 border-white/15 hover:border-white/40"
                                }`}
                              >
                                {isActive ? `✓ ${sz}` : `+ ${sz}`}
                              </button>
                            );
                          })}

                          <button
                            type="button"
                            onClick={() => {
                              const customName = window.prompt("Enter custom size (e.g. 48, XXL, Free Size):");
                              if (customName && customName.trim()) {
                                const key = customName.trim();
                                setSizeStockMap(prev => ({ ...prev, [key]: prev[key] || 5 }));
                              }
                            }}
                            className="px-2 py-0.5 text-[10px] font-mono border border-emerald-400/50 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 font-bold transition-all ml-auto"
                          >
                            + Custom
                          </button>
                        </div>

                        {/* Active Sizes Input List */}
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {Object.entries(sizeStockMap).map(([sz, qty]) => (
                            <div key={sz} className="flex items-center justify-between gap-3 p-2 bg-white/5 border border-white/10 text-xs">
                              <span className="font-mono font-bold text-foreground">Size {sz}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-foreground/50">Stock:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={qty}
                                  onChange={(e) => setSizeStockMap({ ...sizeStockMap, [sz]: parseInt(e.target.value) || 0 })}
                                  className="w-16 bg-black/40 border border-white/20 px-2 py-1 text-center font-mono outline-none focus:border-white text-foreground text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = { ...sizeStockMap };
                                    delete updated[sz];
                                    setSizeStockMap(updated);
                                  }}
                                  className="text-foreground/40 hover:text-red-400 p-1"
                                  title="Remove size"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* MULTIPLE IMAGE UPLOAD & GALLERY */}
                      <div className="space-y-3 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-body">Product Gallery Images ({galleryFiles.length}) *</label>
                          <span className="text-[9px] text-foreground/50 font-body">Select multiple & crop</span>
                        </div>

                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleAddGalleryFiles}
                          className="w-full bg-transparent border border-white/15 py-2 px-3 text-xs font-body cursor-pointer file:mr-4 file:py-1 file:px-3 file:border-0 file:text-[10px] file:uppercase file:tracking-[0.2em] file:bg-foreground file:text-background font-semibold"
                        />

                        {galleryFiles.length > 0 && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2 bg-white/5 p-2 border border-white/10 max-h-56 overflow-y-auto">
                              {galleryFiles.map((item, idx) => (
                                <div key={idx} className="relative group border border-white/10 bg-black/40 overflow-hidden rounded-sm">
                                  <img src={item.preview} alt={`Upload ${idx}`} className="w-full h-24 object-cover" />
                                  
                                  {item.isPrimary && (
                                    <span className="absolute top-1 left-1 bg-amber-400 text-black font-bold text-[8px] uppercase tracking-wider px-1 py-0.5 shadow flex items-center gap-1">
                                      <Star size={8} fill="black" /> Main
                                    </span>
                                  )}

                                  {item.originalSize && item.compressedSize && item.originalSize > item.compressedSize && (
                                    <span className="absolute bottom-1 right-1 bg-emerald-500 text-black font-bold text-[8px] font-mono px-1 py-0.5 shadow">
                                      -{(100 - (item.compressedSize / item.originalSize) * 100).toFixed(0)}% Auto-Opt
                                    </span>
                                  )}

                                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-1 p-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCropperSrc(item.preview);
                                        setCropperCallback(() => (croppedUrl) => {
                                          const file = dataURLtoFile(croppedUrl, `cropped-${idx}.jpg`);
                                          setGalleryFiles(prev => {
                                            const copy = [...prev];
                                            copy[idx] = { ...copy[idx], file, preview: croppedUrl };
                                            return copy;
                                          });
                                        });
                                      }}
                                      className="bg-white/20 hover:bg-white/40 text-white text-[9px] uppercase tracking-wider px-2 py-1 w-full flex items-center justify-center gap-1"
                                    >
                                      <Crop size={10} /> Adjust Crop
                                    </button>

                                    {!item.isPrimary && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setGalleryFiles(prev => prev.map((g, i) => ({ ...g, isPrimary: i === idx })));
                                        }}
                                        className="bg-amber-500/30 hover:bg-amber-500/50 text-amber-300 text-[9px] uppercase tracking-wider px-2 py-1 w-full text-center"
                                      >
                                        Make Main
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setGalleryFiles(prev => prev.filter((_, i) => i !== idx));
                                      }}
                                      className="bg-red-500/30 hover:bg-red-500/50 text-red-300 text-[9px] uppercase tracking-wider px-2 py-1 w-full text-center"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* LIVE STOREFRONT DEMO PREVIEW & STORAGE METER */}
                            <div className="p-3 border border-emerald-500/30 bg-emerald-950/20 space-y-3 rounded-sm">
                              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-body font-bold flex items-center gap-1.5">
                                  ✨ Storefront Customer View Demo
                                </span>
                                <span className="text-[9px] font-mono text-emerald-300">
                                  {galleryFiles.length} Images • ~{galleryFiles.reduce((acc, curr) => acc + (curr.file?.size || 350000), 0) > 1024*1024 ? (galleryFiles.reduce((acc, curr) => acc + (curr.file?.size || 350000), 0)/(1024*1024)).toFixed(2) + " MB" : Math.round(galleryFiles.reduce((acc, curr) => acc + (curr.file?.size || 350000), 0)/1024) + " KB"}
                                </span>
                              </div>

                              <div className="flex gap-3 items-center bg-black/60 p-2.5 border border-white/10 rounded-sm">
                                <div className="w-20 h-28 relative border border-white/15 bg-black overflow-hidden flex-shrink-0">
                                  <img
                                    src={galleryFiles[demoActiveIndex]?.preview || galleryFiles[0]?.preview}
                                    alt="Live Demo"
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                <div className="flex-1 space-y-1.5 overflow-hidden">
                                  <p className="text-xs font-bold text-foreground truncate">{formData.name || "Product Name Preview"}</p>
                                  <p className="text-xs font-mono text-emerald-400 font-bold">{formData.price ? formatINR(formData.price) : "₹0.00"}</p>
                                  
                                  <div className="flex flex-wrap gap-1 pt-1">
                                    {galleryFiles.map((g, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setDemoActiveIndex(idx)}
                                        className={`w-7 h-9 border transition-all overflow-hidden ${
                                          demoActiveIndex === idx ? "border-emerald-400 scale-105" : "border-white/20 opacity-50 hover:opacity-100"
                                        }`}
                                      >
                                        <img src={g.preview} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <button type="submit" disabled={uploading} className="w-full bg-foreground text-background py-4 text-[11px] uppercase tracking-[0.3em] font-body hover:bg-foreground/90 transition-all disabled:opacity-50 mt-4 font-bold">
                        {uploading ? "Uploading..." : "Publish Product"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                {/* PENDING CANCELLATION REQUESTS PANEL */}
                {cancellationRequests.length > 0 && (
                  <div className="border border-amber-500/40 bg-amber-500/10 p-6 rounded-sm space-y-4 mb-6">
                    <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
                      <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
                        <AlertTriangle size={16} /> Pending Order Cancellation Requests ({cancellationRequests.length})
                      </div>
                      <span className="text-[10px] text-amber-300/80 font-body uppercase tracking-wider">Requires Admin Approval</span>
                    </div>

                    <div className="divide-y divide-amber-500/20">
                      {cancellationRequests.map((reqOrder) => (
                        <div key={reqOrder.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="font-mono text-sm font-bold text-white">Order #SUKO-{1000 + reqOrder.id} · <span className="text-amber-300">{formatINR(reqOrder.total)}</span></p>
                            <p className="text-xs text-foreground/75 font-body mt-1">
                              Customer: <strong className="text-white font-medium">{getUserDisplayName(reqOrder.user)}</strong> · Date & Time: <span className="text-amber-300 font-mono font-medium">{formatDateTime(reqOrder.created_at)}</span>
                            </p>
                            {reqOrder.cancel_reason && (
                              <p className="text-xs text-amber-300 font-mono mt-1 bg-black/40 px-2.5 py-1 border border-amber-500/30 inline-block rounded-sm">
                                Reason: "{reqOrder.cancel_reason}"
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(reqOrder.id, "cancelled")}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-body font-bold rounded-sm shadow transition-all flex items-center gap-1.5"
                            >
                              Approve Cancellation
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(reqOrder.id, "processing")}
                              className="border border-white/20 hover:bg-white/10 text-white px-4 py-2 text-[10px] uppercase tracking-[0.2em] font-body rounded-sm transition-all"
                            >
                              Reject Request
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-xl font-display">Manage Customer Orders</h2>
                  
                  {/* Status Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 font-body">Filter Status:</span>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-transparent border border-white/15 px-3 py-1.5 text-xs font-body focus:border-foreground outline-none [&>option]:bg-background"
                    >
                      <option value="all">All Statuses ({orders.length})</option>
                      <option value="cancel_requested">⚠️ Cancellation Requests ({cancellationRequests.length})</option>
                      <option value="paid">💳 Paid Orders ({paidOrdersList.length})</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed / Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-white/5 bg-background/50 backdrop-blur-sm">
                  <table className="w-full text-left font-body text-sm">
                    <thead className="bg-white/5 text-[10px] uppercase tracking-[0.2em] text-foreground/60 border-b border-white/10">
                      <tr>
                        <th className="p-4 font-normal">Order ID</th>
                        <th className="p-4 font-normal">Customer Details (Name / Phone / Email)</th>
                        <th className="p-4 font-normal">Garments & Sizes</th>
                        <th className="p-4 font-normal">Date & Time</th>
                        <th className="p-4 font-normal">Status Action</th>
                        <th className="p-4 font-normal text-right">Amount / Info</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredOrders.map(o => (
                        <tr key={o.id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="p-4 font-medium font-mono">
                            <span className="text-white font-bold">#SUKO-{1000 + o.id}</span>
                            {o.cancel_reason && (
                              <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 block mt-1 font-mono">
                                ⚠️ Cancel Req
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-white text-sm">{getUserDisplayName(o.user)}</p>
                            <p className="text-xs text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                              📞 {getUserPhone(o.user)}
                            </p>
                            <p className="text-xs text-foreground/60 mt-0.5">{o.user?.email || "No Email"}</p>
                            {o.user?.addresses?.[0] && (
                              <p className="text-[10px] text-foreground/50 bg-white/5 p-1.5 mt-1 border border-white/5 font-mono truncate max-w-[220px]" title={`${o.user.addresses[0].line1}, ${o.user.addresses[0].city}, ${o.user.addresses[0].state} - ${o.user.addresses[0].pincode}`}>
                                🏠 {o.user.addresses[0].line1}, {o.user.addresses[0].city}
                              </p>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="space-y-1.5">
                              {o.items && o.items.length > 0 ? (
                                o.items.map((item, idx) => (
                                  <div key={idx} className="text-xs flex items-center gap-2">
                                    <span className="font-medium text-white">{item.product?.name || "Atelier Garment"}</span>
                                    <span className="text-[9px] font-mono text-amber-300 border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5">
                                      Size: {item.size || "38"} (x{item.quantity})
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-xs text-foreground/50">Custom Garment Order</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-xs font-mono text-emerald-400/90 whitespace-nowrap">
                            {formatDateTime(o.created_at)}
                          </td>
                          <td className="p-4">
                            <select
                              value={o.status}
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                              className={`bg-transparent border px-2 py-1 text-xs font-body focus:border-foreground outline-none [&>option]:bg-background cursor-pointer ${
                                o.status === 'cancel_requested' ? 'border-amber-400 text-amber-400 font-bold' :
                                o.status === 'paid' || o.status === 'completed' ? 'border-emerald-400 text-emerald-400 font-bold' :
                                'border-white/20'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="processing">Processing</option>
                              <option value="cancel_requested">⚠️ Cancel Requested</option>
                              <option value="completed">Completed / Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-4 text-right">
                            <p className="font-bold text-white font-mono text-sm">{formatINR(o.total)}</p>
                            
                            <div className="flex items-center justify-end gap-2 mt-1.5 font-mono">
                              <button
                                type="button"
                                onClick={() => setSelectedOrderDetails(o)}
                                className="text-[9px] uppercase tracking-[0.1em] text-emerald-400 hover:underline font-bold"
                              >
                                Inspect →
                              </button>
                              <span className="text-white/20">|</span>
                              <button
                                type="button"
                                onClick={() => handleOpenEditOrder(o)}
                                className="text-[9px] uppercase tracking-[0.1em] text-amber-400 hover:underline font-bold flex items-center gap-0.5"
                              >
                                <Edit2 size={10} /> Edit
                              </button>
                              <span className="text-white/20">|</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(o.id)}
                                className="text-[9px] uppercase tracking-[0.1em] text-red-400 hover:underline font-bold flex items-center gap-0.5"
                              >
                                <Trash2 size={10} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredOrders.length === 0 && (
                        <tr><td colSpan="6" className="p-8 text-center text-foreground/50">No orders found matching criteria.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* COUPONS TAB */}
            {activeTab === "coupons" && (
              <div className="grid lg:grid-cols-12 gap-8">
                {/* Left: Create Coupon Form */}
                <div className="lg:col-span-5">
                  <div className="border border-white/10 p-6 bg-background/50 backdrop-blur-sm space-y-6">
                    <h2 className="text-xl font-display flex items-center gap-2">
                      <Tag className="w-5 h-5 text-emerald-400" /> Create Promo Voucher
                    </h2>

                    <form onSubmit={handleCreateCouponSubmit} className="space-y-4 font-body">
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-1">Coupon Code *</label>
                        <input
                          type="text"
                          value={newCouponForm.code}
                          onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value })}
                          placeholder="e.g. FESTIVE20, SUKO500"
                          className="w-full bg-transparent border-b border-white/15 focus:border-foreground outline-none py-2 text-sm uppercase text-white font-mono"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-1">Discount (%)</label>
                          <input
                            type="number"
                            value={newCouponForm.discount_percent}
                            onChange={(e) => setNewCouponForm({ ...newCouponForm, discount_percent: e.target.value })}
                            placeholder="e.g. 15"
                            className="w-full bg-transparent border-b border-white/15 focus:border-foreground outline-none py-2 text-sm text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-1">Flat Discount (₹)</label>
                          <input
                            type="number"
                            value={newCouponForm.discount_flat}
                            onChange={(e) => setNewCouponForm({ ...newCouponForm, discount_flat: e.target.value })}
                            placeholder="e.g. 500"
                            className="w-full bg-transparent border-b border-white/15 focus:border-foreground outline-none py-2 text-sm text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-1">Min Order Total (₹)</label>
                        <input
                          type="number"
                          value={newCouponForm.min_order_value}
                          onChange={(e) => setNewCouponForm({ ...newCouponForm, min_order_value: e.target.value })}
                          placeholder="e.g. 2000"
                          className="w-full bg-transparent border-b border-white/15 focus:border-foreground outline-none py-2 text-sm text-white"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-foreground text-background py-3 text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-foreground/90 transition-all mt-4"
                      >
                        Publish Coupon
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right: Active Coupons List */}
                <div className="lg:col-span-7">
                  <div className="border border-white/10 bg-background/50 backdrop-blur-sm p-6">
                    <h2 className="text-xl font-display mb-6">Active Vouchers & Promo Codes ({couponsList.length})</h2>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-body text-sm">
                        <thead className="bg-white/5 text-[10px] uppercase tracking-[0.2em] text-foreground/60 border-b border-white/10">
                          <tr>
                            <th className="p-3 font-normal">Code</th>
                            <th className="p-3 font-normal">Discount</th>
                            <th className="p-3 font-normal">Min Order</th>
                            <th className="p-3 font-normal text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {couponsList.map((c) => (
                            <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-3 font-mono font-bold text-amber-400">{c.code}</td>
                              <td className="p-3 text-white">
                                {c.discount_percent ? `${c.discount_percent}% OFF` : c.discount_flat ? `${formatINR(c.discount_flat)} OFF` : 'Special Discount'}
                              </td>
                              <td className="p-3 text-foreground/70">{formatINR(c.min_order_value || 0)}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleDeleteCoupon(c.id)}
                                  className="text-red-400/80 hover:text-red-400 p-1.5 transition-colors"
                                  title="Delete Coupon"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {couponsList.length === 0 && (
                            <tr><td colSpan="4" className="p-6 text-center text-foreground/50">No coupons active. Create one using the form.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BROADCAST EMAIL DISPATCHER TAB */}
            {activeTab === "broadcast" && (
              <div className="max-w-3xl mx-auto border border-white/10 bg-background/50 backdrop-blur-sm p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-display flex items-center gap-2">
                    <Mail className="w-6 h-6 text-emerald-400" /> Direct Client Email Dispatcher
                  </h2>
                  <p className="text-xs font-body text-foreground/60 mt-1">
                    Send custom announcements, tracking updates, or exclusive invitations via Gmail SMTP (<code className="text-emerald-400">bizleap1@gmail.com</code>).
                  </p>
                </div>

                <form onSubmit={handleSendEmailSubmit} className="space-y-6 font-body">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-2">Recipient Audience *</label>
                      <select
                        value={emailForm.target}
                        onChange={(e) => setEmailForm({ ...emailForm, target: e.target.value })}
                        className="w-full bg-transparent border border-white/15 px-3 py-2 text-xs font-body focus:border-foreground outline-none [&>option]:bg-background text-white"
                      >
                        <option value="single">Single Specific Client Email</option>
                        <option value="all">Broadcast to ALL Registered Clients</option>
                      </select>
                    </div>

                    {emailForm.target === "single" && (
                      <div>
                        <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-2">Client Email Address *</label>
                        <input
                          type="email"
                          value={emailForm.recipientEmail}
                          onChange={(e) => setEmailForm({ ...emailForm, recipientEmail: e.target.value })}
                          placeholder="client@gmail.com"
                          className="w-full bg-transparent border border-white/15 px-3 py-2 text-xs font-body text-white outline-none focus:border-foreground"
                          required={emailForm.target === "single"}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-2">Email Subject Line *</label>
                    <input
                      type="text"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                      placeholder="e.g. Exclusive Private Invitation / Order Update"
                      className="w-full bg-transparent border border-white/15 px-3 py-2 text-xs font-body text-white outline-none focus:border-foreground"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-2">Message Body *</label>
                    <textarea
                      rows={6}
                      value={emailForm.message}
                      onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                      placeholder="Type your bespoke message here..."
                      className="w-full bg-transparent border border-white/15 p-3 text-xs font-body text-white outline-none focus:border-foreground placeholder:text-foreground/30"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="w-full bg-foreground text-background py-4 text-[11px] uppercase tracking-[0.3em] font-bold hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {sendingEmail ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-background border-t-transparent animate-spin" /> Dispatching Emails...
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Send Email Broadcast
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* REVIEWS MODERATION TAB */}
            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-400" /> Customer Product Reviews Moderation ({adminReviewsList.length})
                  </h2>
                </div>

                <div className="overflow-x-auto border border-white/5 bg-background/50 backdrop-blur-sm">
                  <table className="w-full text-left font-body text-sm">
                    <thead className="bg-white/5 text-[10px] uppercase tracking-[0.2em] text-foreground/60 border-b border-white/10">
                      <tr>
                        <th className="p-4 font-normal">Garment</th>
                        <th className="p-4 font-normal">Client</th>
                        <th className="p-4 font-normal">Rating</th>
                        <th className="p-4 font-normal">Comment</th>
                        <th className="p-4 font-normal text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {adminReviewsList.map((rev) => (
                        <tr key={rev.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-medium text-white flex items-center gap-3">
                            {rev.product?.images?.[0] && (
                              <img src={rev.product.images[0]} alt="" className="w-10 h-12 object-cover rounded-sm" />
                            )}
                            <span>{rev.product?.name || "Garment"}</span>
                          </td>
                          <td className="p-4 text-foreground/80">{rev.user?.email || rev.user?.name || "Client"}</td>
                          <td className="p-4 font-mono font-bold text-amber-400">⭐ {rev.rating}/5</td>
                          <td className="p-4 text-foreground/90 max-w-md italic">"{rev.comment}"</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteReview(rev.id)}
                              className="text-red-400/80 hover:text-red-400 p-2 transition-colors"
                              title="Delete Review"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {adminReviewsList.length === 0 && (
                        <tr><td colSpan="5" className="p-8 text-center text-foreground/50">No customer reviews submitted yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
          </div>
        )}

        {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-start justify-center pt-24 pb-8 px-4 overflow-y-auto">
          <div className="max-w-[480px] w-full border border-white/20 p-6 sm:p-8 bg-[#121214] text-foreground shadow-2xl relative rounded-sm my-auto sm:my-0">
            <button 
              type="button"
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 text-foreground/60 hover:text-foreground p-1 transition-colors bg-white/5 rounded-full"
            >
              <X size={18} />
            </button>

            <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-body block mb-1">— Product Editor</span>
            <h2 className="font-display text-2xl mb-6">Edit Item Details</h2>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-body">Product Name *</label>
                <input 
                  type="text" 
                  value={editFormData.name} 
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} 
                  required 
                  className="w-full bg-black/40 border-b border-white/20 focus:border-white outline-none py-2 px-2 text-sm font-body text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-body">Price (₹) *</label>
                <input 
                  type="number" 
                  value={editFormData.price} 
                  onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })} 
                  required 
                  className="w-full bg-black/40 border-b border-white/20 focus:border-white outline-none py-2 px-2 text-sm font-body text-foreground"
                />
              </div>

              {/* EDIT SIZE-WISE STOCK MANAGER */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-body">Size-Wise Stock Inventory *</label>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20">
                    Total: {Object.values(editSizeStockMap).reduce((a, b) => a + (Number(b) || 0), 0)} items
                  </span>
                </div>

                {/* Quick Preset Toggles */}
                <div className="flex flex-wrap gap-1.5 bg-white/5 p-2 border border-white/10 items-center">
                  <span className="text-[9px] uppercase tracking-wider text-foreground/40 self-center mr-1">Presets:</span>
                  {["38", "40", "42", "44", "46", "S", "M", "L", "XL"].map(sz => {
                    const isActive = sz in editSizeStockMap;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            const updated = { ...editSizeStockMap };
                            delete updated[sz];
                            setEditSizeStockMap(updated);
                          } else {
                            setEditSizeStockMap({ ...editSizeStockMap, [sz]: 5 });
                          }
                        }}
                        className={`px-2 py-0.5 text-[10px] font-mono border transition-all ${
                          isActive 
                            ? "bg-foreground text-background font-bold border-foreground" 
                            : "text-foreground/60 border-white/15 hover:border-white/40"
                        }`}
                      >
                        {isActive ? `✓ ${sz}` : `+ ${sz}`}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      const customName = window.prompt("Enter custom size (e.g. 48, XXL, Free Size):");
                      if (customName && customName.trim()) {
                        const key = customName.trim();
                        setEditSizeStockMap(prev => ({ ...prev, [key]: prev[key] || 5 }));
                      }
                    }}
                    className="px-2 py-0.5 text-[10px] font-mono border border-emerald-400/50 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 font-bold transition-all ml-auto"
                  >
                    + Custom
                  </button>
                </div>

                {/* Active Sizes Input List */}
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {Object.entries(editSizeStockMap).map(([sz, qty]) => (
                    <div key={sz} className="flex items-center justify-between gap-3 p-2 bg-white/5 border border-white/10 text-xs">
                      <span className="font-mono font-bold text-foreground">Size {sz}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-foreground/50">Stock:</span>
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={(e) => setEditSizeStockMap({ ...editSizeStockMap, [sz]: parseInt(e.target.value) || 0 })}
                          className="w-16 bg-black/40 border border-white/20 px-2 py-1 text-center font-mono outline-none focus:border-white text-foreground text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...editSizeStockMap };
                            delete updated[sz];
                            setEditSizeStockMap(updated);
                          }}
                          className="text-foreground/40 hover:text-red-400 p-1"
                          title="Remove size"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-body">Category</label>
                  <select 
                    value={editFormData.category_id} 
                    onChange={(e) => setEditFormData({ ...editFormData, category_id: e.target.value })} 
                    className="w-full bg-black/40 border-b border-white/20 focus:border-white outline-none py-2 px-2 text-sm font-body text-foreground [&>option]:bg-neutral-900"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-body">Sub Category</label>
                  <select 
                    value={editFormData.sub_category} 
                    onChange={(e) => setEditFormData({ ...editFormData, sub_category: e.target.value })} 
                    className="w-full bg-black/40 border-b border-white/20 focus:border-white outline-none py-2 px-2 text-sm font-body text-foreground [&>option]:bg-neutral-900"
                  >
                    <option value="">No Sub Category</option>
                    <option value="Womens">Womens</option>
                  </select>
                </div>
              </div>

                      {/* MULTIPLE IMAGE GALLERY IN EDIT MODAL */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-body">Product Gallery Images ({editGalleryImages.length})</label>
                    <span className="text-[9px] text-foreground/50 font-body">Add more / crop existing</span>
                  </div>

                  <input 
                    type="file" 
                    multiple
                    accept="image/*" 
                    onChange={handleEditAddGalleryFiles} 
                    className="w-full bg-black/40 border border-white/20 py-2 px-3 text-xs font-body cursor-pointer file:mr-3 file:py-1 file:px-2 file:border-0 file:text-[9px] file:uppercase file:tracking-[0.2em] file:bg-white file:text-black font-semibold"
                  />

                  {editGalleryImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 bg-white/5 p-2 border border-white/10 max-h-56 overflow-y-auto">
                      {editGalleryImages.map((item, idx) => (
                        <div key={idx} className="relative group border border-white/10 bg-black/40 overflow-hidden rounded-sm">
                          <img src={item.preview} alt={`Edit Gallery ${idx}`} className="w-full h-24 object-cover" />
                          
                          {item.isPrimary && (
                            <span className="absolute top-1 left-1 bg-amber-400 text-black font-bold text-[8px] uppercase tracking-wider px-1 py-0.5 shadow flex items-center gap-1">
                              <Star size={8} fill="black" /> Main Cover
                            </span>
                          )}

                          <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-1 p-1">
                            <button
                              type="button"
                              onClick={() => {
                                setCropperSrc(item.preview);
                                setCropperCallback(() => (croppedUrl) => {
                                  const file = dataURLtoFile(croppedUrl, `edit-cropped-${idx}.jpg`);
                                  setEditGalleryImages(prev => {
                                    const copy = [...prev];
                                    copy[idx] = { ...copy[idx], file, preview: croppedUrl };
                                    return copy;
                                  });
                                });
                              }}
                              className="bg-white/20 hover:bg-white/40 text-white text-[9px] uppercase tracking-wider px-2 py-1 w-full flex items-center justify-center gap-1"
                            >
                              <Crop size={10} /> Crop
                            </button>

                            {!item.isPrimary && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditGalleryImages(prev => prev.map((g, i) => ({ ...g, isPrimary: i === idx })));
                                }}
                                className="bg-amber-500/30 hover:bg-amber-500/50 text-amber-300 text-[9px] uppercase tracking-wider px-2 py-1 w-full text-center"
                              >
                                Set Cover
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setEditGalleryImages(prev => prev.filter((_, i) => i !== idx));
                              }}
                              className="bg-red-500/30 hover:bg-red-500/50 text-red-300 text-[9px] uppercase tracking-wider px-2 py-1 w-full text-center"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 border border-white/20 py-3 text-[10px] uppercase tracking-[0.2em] font-body hover:bg-white/10 transition-all text-foreground"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={updatingProduct}
                    className="flex-1 bg-white text-black py-3 text-[10px] uppercase tracking-[0.2em] font-body hover:bg-white/90 font-bold transition-all disabled:opacity-50"
                  >
                    {updatingProduct ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FULL ORDER INSPECTION MODAL */}
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 md:pt-14 bg-black/85 backdrop-blur-md overflow-y-auto">
            <div ref={inspectModalRef} className="bg-[#121218] border border-white/15 max-w-2xl w-full p-8 rounded-xl relative shadow-2xl font-body space-y-6 max-h-[85vh] overflow-y-auto my-auto md:my-0">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="absolute top-4 right-4 text-foreground/50 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="border-b border-white/10 pb-4">
                <span className="text-[10px] uppercase tracking-[0.3em] text-emerald-400 font-mono block mb-1">
                  — FULL CLIENT & ORDER INSPECTION
                </span>
                <h2 className="text-2xl font-display text-white">
                  Order #SUKO-{1000 + selectedOrderDetails.id}
                </h2>
                <p className="text-xs text-foreground/60 mt-1 font-mono">
                  Placed on: <span className="text-emerald-400 font-bold">{formatDateTime(selectedOrderDetails.created_at)}</span>
                </p>
              </div>

              {/* Customer Full Specs */}
              <div className="grid sm:grid-cols-2 gap-6 bg-white/5 p-4 border border-white/10 text-xs">
                <div className="space-y-1.5 font-mono">
                  <p className="text-[10px] uppercase tracking-wider text-amber-400 font-bold mb-2">👤 CLIENT INFORMATION</p>
                  <p className="text-white text-sm font-bold">{getUserDisplayName(selectedOrderDetails.user)}</p>
                  <p className="text-emerald-400">📞 Phone: {getUserPhone(selectedOrderDetails.user)}</p>
                  <p className="text-foreground/70">✉️ Email: {selectedOrderDetails.user?.email || "N/A"}</p>
                  <p className="text-foreground/50 text-[10px]">User Account ID: #{selectedOrderDetails.user?.id || selectedOrderDetails.user_id}</p>
                </div>

                <div className="space-y-1.5 font-mono">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-2">🏠 SHIPPING ADDRESS</p>
                  {selectedOrderDetails.user?.addresses?.[0] ? (
                    <>
                      <p className="text-white font-medium">{selectedOrderDetails.user.addresses[0].line1}</p>
                      <p className="text-foreground/70">{selectedOrderDetails.user.addresses[0].city}, {selectedOrderDetails.user.addresses[0].state}</p>
                      <p className="text-foreground/70">PIN Code: {selectedOrderDetails.user.addresses[0].pincode}</p>
                      <p className="text-foreground/50">Contact Phone: {selectedOrderDetails.user.addresses[0].phone}</p>
                    </>
                  ) : (
                    <p className="text-foreground/40 italic">No delivery address saved on profile.</p>
                  )}
                </div>
              </div>

              {/* Cancellation Reason alert if present */}
              {selectedOrderDetails.cancel_reason && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 font-mono text-xs text-amber-300">
                  <p className="font-bold text-[10px] uppercase tracking-widest mb-1 text-amber-400">⚠️ CANCELLATION REASON SUBMITTED BY CLIENT:</p>
                  <p className="text-sm">"{selectedOrderDetails.cancel_reason}"</p>
                </div>
              )}

              {/* Items Purchased List */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-mono">PURCHASED GARMENT ITEMS ({selectedOrderDetails.items?.length || 1})</p>
                <div className="divide-y divide-white/10 border-t border-b border-white/10">
                  {selectedOrderDetails.items?.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-3">
                        {item.product?.image_url && (
                          <img src={item.product.image_url} alt={item.product.name} className="w-10 h-12 object-cover border border-white/15" />
                        )}
                        <div>
                          <p className="text-white font-bold text-sm">{item.product?.name || "Atelier Garment"}</p>
                          <p className="text-foreground/50 text-[10px]">Category: {item.product?.category_id ? "Atelier" : "Custom"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-300 bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 font-bold block mb-1">
                          Size: {item.size || "38"} (Qty: {item.quantity})
                        </span>
                        <span className="text-white font-bold">{formatINR(item.price_at_purchase || item.product?.price || 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="flex justify-between items-center pt-2 font-mono text-sm border-t border-white/10">
                <span className="text-foreground/60 uppercase tracking-widest text-xs">Total Amount Paid:</span>
                <span className="text-emerald-400 font-bold text-xl">{formatINR(selectedOrderDetails.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* EDIT / MODIFY ORDER MODAL */}
        {editingOrder && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 md:pt-14 bg-black/85 backdrop-blur-md overflow-y-auto">
            <div ref={editModalRef} className="bg-[#121218] border border-white/15 max-w-md w-full p-6 rounded-xl relative shadow-2xl font-body space-y-5 my-auto md:my-0">
              <button
                onClick={() => setEditingOrder(null)}
                className="absolute top-4 right-4 text-foreground/50 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="border-b border-white/10 pb-3">
                <span className="text-[10px] uppercase tracking-[0.3em] text-amber-400 font-mono block mb-1">
                  — MODIFY ORDER SPECS
                </span>
                <h2 className="text-xl font-display text-white">
                  Edit Order #SUKO-{1000 + editingOrder.id}
                </h2>
              </div>

              <form onSubmit={handleSaveEditedOrder} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-1">Order Total Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editOrderForm.total}
                    onChange={(e) => setEditOrderForm({ ...editOrderForm, total: e.target.value })}
                    className="w-full bg-black/50 border border-white/15 p-2.5 text-white outline-none focus:border-amber-400 text-sm font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-1">Order Status *</label>
                  <select
                    value={editOrderForm.status}
                    onChange={(e) => setEditOrderForm({ ...editOrderForm, status: e.target.value })}
                    className="w-full bg-black/50 border border-white/15 p-2.5 text-white outline-none focus:border-amber-400 [&>option]:bg-background"
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
                  <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 block mb-1">Cancellation / Modification Note</label>
                  <textarea
                    rows={3}
                    value={editOrderForm.cancel_reason}
                    onChange={(e) => setEditOrderForm({ ...editOrderForm, cancel_reason: e.target.value })}
                    placeholder="Optional Admin note or reason..."
                    className="w-full bg-black/50 border border-white/15 p-2.5 text-white outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="flex-1 border border-white/20 py-2.5 text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 text-foreground transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-amber-400 hover:bg-amber-300 text-black py-2.5 text-[10px] uppercase tracking-[0.2em] font-bold transition-all shadow"
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
  <div className="border border-white/10 p-6 bg-background/50 backdrop-blur-sm flex items-start gap-4">
    <div className="text-foreground/40 mt-1">{icon}</div>
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 font-body mb-1">{label}</p>
      <p className="font-display text-3xl font-medium">{value}</p>
      {subText && <p className="text-[10px] text-foreground/40 font-body mt-1">{subText}</p>}
    </div>
  </div>
);

export default Admin;
