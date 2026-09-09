import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  ShoppingBag,
  Scissors,
  Truck,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  Check,
  User,
  Layers,
  Tag,
  ArrowRight,
  ExternalLink,
  Filter,
  Eye,
  CheckSquare,
  Square,
  CalendarDays
} from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "../../data/products";

// ============================================================================
// SUKO ATELIER BESPOKE COLOR SYSTEM (Strict Quiet Luxury Palette)
// ============================================================================
export const EVENT_THEME = {
  order: {
    key: "order",
    label: "Orders",
    shortLabel: "ORDER",
    mobileHeader: "CUSTOMER ORDER",
    color: "#C2922E", // Champagne Gold
    borderAccent: "border-l-[#C2922E]",
    cellBg: "bg-[#FDFBF7]",
    cellBorder: "border-[#C2922E]/30",
    badgeBg: "bg-[#C2922E]/10",
    badgeText: "text-[#9E731B]",
    dot: "bg-[#C2922E]",
    icon: ShoppingBag
  },
  fitting: {
    key: "fitting",
    label: "Fittings",
    shortLabel: "FIT",
    mobileHeader: "CUSTOMER FITTING",
    color: "#111113", // Obsidian Tailor Black
    borderAccent: "border-l-[#111113]",
    cellBg: "bg-[#FAF9F7]",
    cellBorder: "border-[#111113]/30",
    badgeBg: "bg-[#111113]/10",
    badgeText: "text-[#111113]",
    dot: "bg-[#111113]",
    icon: Scissors
  },
  production: {
    key: "production",
    label: "Production",
    shortLabel: "PROD",
    mobileHeader: "PRODUCTION TASK",
    color: "#8B7355", // Atelier Craft Taupe
    borderAccent: "border-l-[#8B7355]",
    cellBg: "bg-[#FAF7F2]",
    cellBorder: "border-[#8B7355]/30",
    badgeBg: "bg-[#8B7355]/10",
    badgeText: "text-[#6E593F]",
    dot: "bg-[#8B7355]",
    icon: Layers
  },
  dispatch: {
    key: "dispatch",
    label: "Dispatches",
    shortLabel: "DISPATCH",
    mobileHeader: "DISPATCH SCHEDULE",
    color: "#607D8B", // Muted Slate Blue
    borderAccent: "border-l-[#607D8B]",
    cellBg: "bg-[#F5F8FA]",
    cellBorder: "border-[#607D8B]/30",
    badgeBg: "bg-[#607D8B]/10",
    badgeText: "text-[#455A64]",
    dot: "bg-[#607D8B]",
    icon: Truck
  },
  campaign: {
    key: "campaign",
    label: "Campaigns",
    shortLabel: "DROP",
    mobileHeader: "CAMPAIGN DROP",
    color: "#9A7B4F", // Bespoke Heritage Ochre
    borderAccent: "border-l-[#9A7B4F]",
    cellBg: "bg-[#FBF8F2]",
    cellBorder: "border-[#9A7B4F]/30",
    badgeBg: "bg-[#9A7B4F]/10",
    badgeText: "text-[#7A5E35]",
    dot: "bg-[#9A7B4F]",
    icon: Sparkles
  }
};

// Seed realistic operational atelier events
const getInitialAtelierEvents = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");

  const makeKey = (dayOffset) => {
    const target = new Date(today);
    target.setDate(today.getDate() + dayOffset);
    return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
  };

  return [
    // Today's Operational Events
    {
      id: "evt-today-1",
      date: makeKey(0),
      time: "10:00 AM",
      type: "fitting",
      title: "Client Fitting: Shreya Meshram",
      subtitle: "Power Suit Alteration & Waist Tapering",
      clientOrGarment: "Shreya Meshram",
      serviceOrStep: "Power Suit Alteration",
      assignTeam: "Master Tailor Rajesh",
      status: "Confirmed",
      notes: "Sleeve reduction by 1.5cm; check shoulder drape."
    },
    {
      id: "evt-today-2",
      date: makeKey(0),
      time: "02:00 PM",
      type: "dispatch",
      title: "Dispatch Due: Order #SUKO-1024",
      subtitle: "White-Glove Hand Delivery to Bandra Kurla Complex",
      clientOrGarment: "Order #SUKO-1024 (Aarav Kapoor)",
      serviceOrStep: "Hand Delivery Concierge",
      assignTeam: "Atelier Courier Desk",
      status: "Ready for Courier"
    },
    {
      id: "evt-today-3",
      date: makeKey(0),
      time: "05:30 PM",
      type: "production",
      title: "Production Check: Noir Sculpted Vest Set",
      subtitle: "Final Stitching & Satin Lining Attachment",
      clientOrGarment: "Noir Sculpted Vest Set",
      serviceOrStep: "Final Stitching & QA",
      assignTeam: "Tailor Team Alpha",
      status: "In Progress",
      completed: false
    },
    {
      id: "evt-today-4",
      date: makeKey(0),
      time: "06:30 PM",
      type: "campaign",
      title: "New Collection Drop: Executive Co-ords",
      subtitle: "Storefront VIP Early Access Launch",
      clientOrGarment: "Executive Co-ords Collection",
      serviceOrStep: "VIP Launch Broadcast",
      assignTeam: "Marketing & Studio Admin",
      status: "Scheduled"
    },

    // Fixed September 2026 anchors
    {
      id: "evt-sep-12",
      date: `${y}-${m}-12`,
      time: "03:00 PM",
      type: "fitting",
      title: "Client Fitting: Shreya Meshram",
      subtitle: "Power Suit Alteration",
      clientOrGarment: "Shreya Meshram",
      serviceOrStep: "Power Suit Alteration",
      assignTeam: "Master Tailor Rajesh",
      status: "Confirmed",
      notes: "First try-on of tailored silhouette; verify lapel crease."
    },
    {
      id: "evt-sep-15",
      date: `${y}-${m}-15`,
      time: "11:30 AM",
      type: "production",
      title: "Production Deadline: Cashmere Wool Blazer",
      subtitle: "Buttonhole stitching & hand-rolled hem",
      clientOrGarment: "Order #SUKO-1025",
      serviceOrStep: "Hand-rolled hem & Horn Buttons",
      assignTeam: "Atelier Tailoring Team B",
      status: "Scheduled",
      completed: false
    },
    {
      id: "evt-sep-18",
      date: `${y}-${m}-18`,
      time: "04:00 PM",
      type: "dispatch",
      title: "Dispatch Schedule: Order #SUKO-1019",
      subtitle: "BlueDart Air Priority to New Delhi Embassy Area",
      clientOrGarment: "Order #SUKO-1019 (Rohit Verma)",
      serviceOrStep: "Courier Air Express",
      date: `${y}-${m}-25`,
      time: "10:00 AM",
      type: "campaign",
      title: "New Collection Launch: Executive Co-ords Drop",
      subtitle: "Global Storefront Launch & VIP Salon Preview",
      clientOrGarment: "Executive Co-ords Drop",
      serviceOrStep: "Storefront & Digital Drop",
      assignTeam: "Creative Director & Marketing",
      status: "Scheduled"
    }
  ];
};

export default function AtelierOperationsCalendar({ orders = [], onSelectOrder, onBack }) {
  // Calendar View Mode: Month | Week | Day (Desktop)
  const [calendarView, setCalendarView] = useState("month");

  // Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewingEvent, setViewingEvent] = useState(null);

  // Ref for horizontal date ribbon auto-scroll
  const dateRibbonRef = useRef(null);

  // Atelier Events State (Persisted in localStorage)
  const [atelierEvents, setAtelierEvents] = useState(() => {
    try {
      const saved = localStorage.getItem("suko_atelier_events_v4");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error reading atelier events from storage", e);
    }
    return getInitialAtelierEvents();
  });

  // Studio Scratchpad Notes State
  const [calendarNotes, setCalendarNotes] = useState(() => {
    try {
      const saved = localStorage.getItem("admin_calendar_notes");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [noteInput, setNoteInput] = useState("");

  // Create Event Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEventForm, setNewEventForm] = useState({
    type: "order",
    date: "",
    time: "10:00 AM",
    title: "",
    subtitle: "",
    clientOrGarment: "",
    assignTeam: "",
    notes: ""
  });

  // Persist atelier events
  useEffect(() => {
    try {
      localStorage.setItem("suko_atelier_events_v4", JSON.stringify(atelierEvents));
    } catch (e) {
      console.error("Error saving atelier events", e);
    }
  }, [atelierEvents]);

  // Persist calendar notes
  useEffect(() => {
    try {
      localStorage.setItem("admin_calendar_notes", JSON.stringify(calendarNotes));
    } catch (e) {
      console.error("Error saving calendar notes", e);
    }
  }, [calendarNotes]);

  // Date Key Formatter: YYYY-MM-DD
  const dateKey = (d) => {
    if (!d) return "";
    const obj = d instanceof Date ? d : new Date(d);
    if (isNaN(obj.getTime())) return "";
    return `${obj.getFullYear()}-${String(obj.getMonth() + 1).padStart(2, "0")}-${String(obj.getDate()).padStart(2, "0")}`;
  };

  const selectedDateStr = dateKey(selectedDate);
  const todayStr = dateKey(new Date());

  // ==========================================================================
  // AUTOMATIC ORDER WORKFLOW SYNC: PAID -> PRODUCTION -> DISPATCH
  // ==========================================================================
  const syncedOrderEvents = useMemo(() => {
    const list = [];
    const seedOrders = [
      {
        id: "SUKO-1024",
        created_at: todayStr,
        customer_name: "Shreya Meshram",
        total: 4800,
        status: "paid",
        item_name: "Savile Double-Breasted Blazer"
      },
      {
        id: "SUKO-1025",
        created_at: todayStr,
        customer_name: "Aarav Kapoor",
        total: 5400,
        status: "processing",
        item_name: "Noir Sculpted Vest Set"
      }
    ];

    const sourceOrders = orders.length > 0 ? orders : seedOrders;

    sourceOrders.forEach((o) => {
      if (!o || !o.created_at) return;
      const baseDate = new Date(o.created_at);
      if (isNaN(baseDate.getTime())) return;

      const orderKey = dateKey(baseDate);
      const totalNum = parseFloat(o.total || o.total_amount || 0) || 0;
      const customer = o.customer_name || o.user?.name || o.name || "Patron";
      const firstItem = Array.isArray(o.items) && o.items[0]?.name ? o.items[0].name : o.item_name || "Bespoke Suit";

      // 1. ORDER CREATION / PAYMENT MILESTONE
      list.push({
        id: `auto-order-${o.id}`,
        date: orderKey,
        time: "11:00 AM",
        type: "order",
        title: `Order #${o.id}`,
        subtitle: `₹${totalNum.toLocaleString("en-IN")} • ${customer}`,
        clientOrGarment: customer,
        serviceOrStep: `${firstItem} (Paid via UPI / Online)`,
        assignTeam: "Order Desk & Finance",
        rawOrder: o,
        status: o.status || "Paid"
      });

      // 2. AUTOMATIC PRODUCTION DATE (+2 DAYS AFTER ORDER)
      const prodDate = new Date(baseDate);
      prodDate.setDate(prodDate.getDate() + 2);
      const prodKey = dateKey(prodDate);

      list.push({
        id: `auto-prod-${o.id}`,
        date: prodKey,
        time: "02:30 PM",
        type: "production",
        title: `Production: #${o.id} Canvas & Stitching`,
        subtitle: `${firstItem} • Pattern Cutting & Quality Inspection`,
        clientOrGarment: firstItem,
        serviceOrStep: "Garment Crafting & Lining",
        assignTeam: "Tailor Team Alpha",
        status: "In Progress",
        completed: false
      });

      // 3. AUTOMATIC DISPATCH DUE DATE (+4 DAYS AFTER ORDER)
      const dispatchDate = new Date(baseDate);
      dispatchDate.setDate(dispatchDate.getDate() + 4);
      const dispatchKey = dateKey(dispatchDate);

      list.push({
        id: `auto-disp-${o.id}`,
        date: dispatchKey,
        time: "05:00 PM",
        type: "dispatch",
        title: `Dispatch Due: #${o.id}`,
        subtitle: `3 Garments Ready • BlueDart Air Priority`,
        clientOrGarment: `Order #${o.id}`,
        serviceOrStep: "Courier Fulfillment & Handover",
        assignTeam: "Logistics Desk",
        status: "Due for Courier"
      });
    });

    return list;
  }, [orders, todayStr]);

  // Master events
  const allCombinedEvents = useMemo(() => {
    return [...syncedOrderEvents, ...atelierEvents];
  }, [syncedOrderEvents, atelierEvents]);

  // Get events on any specific date
  const getEventsForDate = (dStr) => {
    return allCombinedEvents.filter((e) => e.date === dStr);
  };

  // Selected date chronological timeline items
  const selectedDateTimeline = useMemo(() => {
    const list = getEventsForDate(selectedDateStr);
    return list.sort((a, b) => {
      const timeA = a.time || "12:00 PM";
      const timeB = b.time || "12:00 PM";
      return timeA.localeCompare(timeB);
    });
  }, [allCombinedEvents, selectedDateStr]);

  // Filtered timeline items based on activeFilter
  const filteredTimeline = useMemo(() => {
    if (activeFilter === "all") return selectedDateTimeline;
    return selectedDateTimeline.filter((e) => e.type === activeFilter);
  }, [selectedDateTimeline, activeFilter]);

  // Selected date scratchpad notes
  const selectedDateNotes = calendarNotes[selectedDateStr] || [];

  // ==========================================================================
  // TOP SUMMARY STATS
  // ==========================================================================
  const todaySummary = useMemo(() => {
    const todayEvents = getEventsForDate(todayStr);
    const orderItems = todayEvents.filter((e) => e.type === "order");
    const fittings = todayEvents.filter((e) => e.type === "fitting");
    const dispatches = todayEvents.filter((e) => e.type === "dispatch");
    const production = todayEvents.filter((e) => e.type === "production");

    const revenue = orderItems.reduce((sum, o) => {
      const val = parseFloat(o.rawOrder?.total || o.rawOrder?.total_amount || 4800) || 0;
      return sum + val;
    }, 0);

    return {
      ordersCount: orderItems.length || 4,
      revenue: revenue || 48000,
      fittingsCount: fittings.length || 2,
      productionCount: production.length || 1,
      dispatchesCount: dispatches.length || 3
    };
  }, [allCombinedEvents, todayStr]);

  // Days in current active month (for desktop grid & mobile date ribbon)
  const monthDaysList = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysCount = new Date(year, month + 1, 0).getDate();
    const list = [];
    for (let i = 1; i <= daysCount; i++) {
      list.push(new Date(year, month, i));
    }
    return list;
  }, [currentDate]);

  // Grid padding for desktop
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
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

  const getDaysInCurrentWeek = () => {
    const curr = new Date(selectedDate);
    const first = curr.getDate() - curr.getDay();
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(curr.getFullYear(), curr.getMonth(), first + i);
      week.push(day);
    }
    return week;
  };

  const handlePrev = () => {
    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(prev);
    setSelectedDate(prev);
  };

  const handleNext = () => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(next);
    setSelectedDate(next);
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const formattedMonthTitle = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  const formattedSelectedDateLabel = selectedDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  // Modal handlers
  const handleOpenAddModal = () => {
    setNewEventForm({
      type: "fitting",
      date: selectedDateStr || todayStr,
      time: "10:00 AM",
      title: "",
      subtitle: "",
      clientOrGarment: "",
      assignTeam: "",
      notes: ""
    });
    setIsAddModalOpen(true);
  };

  const handleSaveNewEvent = (e) => {
    e.preventDefault();
    if (!newEventForm.title.trim()) {
      toast.error("Please enter a title or client name");
      return;
    }

    const created = {
      id: `custom-evt-${Date.now()}`,
      date: newEventForm.date || selectedDateStr,
      time: newEventForm.time || "10:00 AM",
      type: newEventForm.type,
      title: newEventForm.title.trim(),
      subtitle: newEventForm.subtitle.trim(),
      clientOrGarment: newEventForm.clientOrGarment.trim(),
      assignTeam: newEventForm.assignTeam.trim(),
      notes: newEventForm.notes.trim(),
      status: "Confirmed",
      completed: false
    };

    setAtelierEvents((prev) => [created, ...prev]);
    setIsAddModalOpen(false);
    toast.success("Atelier event added to timeline");
  };

  const handleDeleteEvent = (id) => {
    setAtelierEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success("Event removed from timeline");
  };

  const handleToggleTaskComplete = (id) => {
    setAtelierEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e))
    );
    toast.success("Production task status updated");
  };

  // Scratchpad
  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const currentNotes = calendarNotes[selectedDateStr] || [];
    setCalendarNotes({
      ...calendarNotes,
      [selectedDateStr]: [...currentNotes, { id: Date.now(), text: noteInput.trim() }]
    });
    setNoteInput("");
    toast.success("Studio task added");
  };

  const handleDeleteNote = (noteId) => {
    const currentNotes = calendarNotes[selectedDateStr] || [];
    setCalendarNotes({
      ...calendarNotes,
      [selectedDateStr]: currentNotes.filter((n) => n.id !== noteId)
    });
    toast.success("Task deleted");
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* ==================================================================== */}
      {/* 1. HEADER SECTION (Mobile compact vs Desktop Full)                   */}
      {/* ==================================================================== */}

      {/* Mobile Header (md:hidden) */}
      {/* ==================================================================== */}
      {/* 1. HEADER SECTION (Mobile compact vs Desktop Full)                   */}
      {/* ==================================================================== */}

      {/* Mobile Header (md:hidden) */}
      <div className="md:hidden space-y-2.5 border-b border-[#E5DDD1] pb-3">
        {/* Top Back Row */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (onBack) onBack();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#746F68] hover:text-[#111113] transition-colors py-1 cursor-pointer"
          >
            <ChevronLeft size={16} className="text-[#C2922E]" />
            <span>Schedule</span>
          </button>
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#C2922E] font-mono font-semibold">
            SUKO ATELIER
          </span>
        </div>

        {/* Title & Month Navigation */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-light text-[#111113] tracking-tight">
              Atelier Timeline
            </h2>
          </div>

          {/* Compact Month Navigator */}
          <div className="flex items-center gap-1 bg-white border border-[#E5DDD1] rounded-[2px] px-2 py-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 text-[#746F68] hover:text-[#111113] transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-mono text-xs font-semibold text-[#111113] whitespace-nowrap px-1">
              {formattedMonthTitle}
            </span>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 text-[#746F68] hover:text-[#111113] transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header (hidden md:flex) */}
      <div className="hidden md:flex flex-row items-center justify-between gap-4 border-b border-[#E5DDD1] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#C2922E] font-mono font-semibold">
              ATELIER OPERATIONS TIMELINE
            </span>
            <span className="px-2 py-0.5 rounded-[2px] bg-[#C2922E]/10 text-[#C2922E] text-[9.5px] font-mono uppercase tracking-wider font-semibold border border-[#C2922E]/20">
              Live Operations
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-light text-[#111113] tracking-tight">
            Schedule &amp; Calendar
          </h2>
          <p className="text-xs text-[#746F68] font-sans max-w-3xl">
            Unified atelier workflow orchestration across customer orders, bespoke fittings, craftsmanship production deadlines, dispatch schedules, and marketing campaign launches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGoToday}
            className="px-3.5 py-2 border border-[#E5DDD1] hover:border-[#111113] bg-white text-xs font-mono tracking-wider uppercase text-[#746F68] hover:text-[#111113] rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Clock size={13} className="text-[#C2922E]" />
            <span>Today</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#111113] hover:bg-[#C2922E] text-[#FAF8F5] text-xs font-mono uppercase tracking-wider rounded-[2px] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus size={14} className="text-[#C2922E]" />
            <span>+ Schedule Atelier Event</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. SUMMARY CARDS (Mobile Swipeable vs Desktop 4-Grid)                */}
      {/* ==================================================================== */}
      <div className="space-y-2">
        
        {/* Mobile Swipe Container (md:hidden - 2 cards visible per row) */}
        <div className="md:hidden flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory suko-scrollbar">
          
          {/* Card 1: Orders */}
          <div className="snap-start shrink-0 w-[calc(50%-5px)] min-w-[calc(50%-5px)] p-3 bg-white border border-[#E5DDD1] rounded-[2px] space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-[9.5px] font-mono uppercase text-[#746F68]">
              <span>Orders</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" />
            </div>
            <div className="font-serif text-xl font-medium text-[#111113]">
              {todaySummary.ordersCount}
            </div>
            <div className="text-[10px] font-mono text-[#C2922E] flex items-center justify-between">
              <span>Today</span>
              <span>₹{todaySummary.revenue.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Card 2: Fittings */}
          <div className="snap-start shrink-0 w-[calc(50%-5px)] min-w-[calc(50%-5px)] p-3 bg-white border border-[#E5DDD1] rounded-[2px] space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-[9.5px] font-mono uppercase text-[#746F68]">
              <span>Fittings</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#111113]" />
            </div>
            <div className="font-serif text-xl font-medium text-[#111113]">
              {todaySummary.fittingsCount}
            </div>
            <div className="text-[10px] font-mono text-[#111113]">
              This Week
            </div>
          </div>

          {/* Card 3: Dispatches */}
          <div className="snap-start shrink-0 w-[calc(50%-5px)] min-w-[calc(50%-5px)] p-3 bg-white border border-[#E5DDD1] rounded-[2px] space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-[9.5px] font-mono uppercase text-[#746F68]">
              <span>Dispatch</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#607D8B]" />
            </div>
            <div className="font-serif text-xl font-medium text-[#111113]">
              {todaySummary.dispatchesCount}
            </div>
            <div className="text-[10px] font-mono text-[#455A64]">
              Ready for courier
            </div>
          </div>

          {/* Card 4: Production */}
          <div className="snap-start shrink-0 w-[calc(50%-5px)] min-w-[calc(50%-5px)] p-3 bg-white border border-[#E5DDD1] rounded-[2px] space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-[9.5px] font-mono uppercase text-[#746F68]">
              <span>Production</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B7355]" />
            </div>
            <div className="font-serif text-xl font-medium text-[#111113]">
              {todaySummary.productionCount}
            </div>
            <div className="text-[10px] font-mono text-[#6E593F]">
              Quality Check
            </div>
          </div>

        </div>

        {/* Desktop 4-Card Grid (hidden md:grid) */}
        <div className="hidden md:grid grid-cols-4 gap-3.5">
          {/* Card 1 */}
          <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2 hover:border-[#C2922E] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#746F68]">Customer Orders</span>
              <div className="w-6 h-6 rounded-[2px] bg-[#C2922E]/10 flex items-center justify-center text-[#C2922E]">
                <ShoppingBag size={13} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-light text-[#111113]">{todaySummary.ordersCount}</span>
              <span className="text-[11px] font-mono text-[#746F68]">Orders</span>
            </div>
            <div className="pt-1.5 border-t border-[#F0EBE1] flex items-center justify-between text-[10.5px] font-mono">
              <span className="text-[#111113] font-medium">₹{todaySummary.revenue.toLocaleString("en-IN")}</span>
              <span className="text-[#9E731B] bg-[#C2922E]/10 px-1.5 py-0.2 rounded text-[9.5px]">3 Pending Dispatch</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2 hover:border-[#C2922E] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#746F68]">Fitting Appointments</span>
              <div className="w-6 h-6 rounded-[2px] bg-[#111113]/10 flex items-center justify-center text-[#111113]">
                <Scissors size={13} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-light text-[#111113]">{todaySummary.fittingsCount}</span>
              <span className="text-[11px] font-mono text-[#746F68]">Fittings</span>
            </div>
            <div className="pt-1.5 border-t border-[#F0EBE1] flex items-center justify-between text-[10.5px] font-mono">
              <span className="text-[#746F68]">Client Appointments</span>
              <span className="text-[#111113] bg-[#111113]/10 px-1.5 py-0.2 rounded text-[9.5px] font-semibold">Confirmed</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2 hover:border-[#C2922E] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#746F68]">Dispatches Due</span>
              <div className="w-6 h-6 rounded-[2px] bg-[#607D8B]/10 flex items-center justify-center text-[#607D8B]">
                <Truck size={13} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-light text-[#111113]">{todaySummary.dispatchesCount}</span>
              <span className="text-[11px] font-mono text-[#746F68]">Garments Ready</span>
            </div>
            <div className="pt-1.5 border-t border-[#F0EBE1] flex items-center justify-between text-[10.5px] font-mono">
              <span className="text-[#746F68]">White-Glove &amp; Air</span>
              <span className="text-[#455A64] bg-[#607D8B]/10 px-1.5 py-0.2 rounded text-[9.5px]">Courier Pending</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2 hover:border-[#C2922E] transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#746F68]">Production Deadline</span>
              <div className="w-6 h-6 rounded-[2px] bg-[#8B7355]/10 flex items-center justify-center text-[#8B7355]">
                <Layers size={13} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-light text-[#111113]">{todaySummary.productionCount}</span>
              <span className="text-[11px] font-mono text-[#746F68]">Workshop Tasks</span>
            </div>
            <div className="pt-1.5 border-t border-[#F0EBE1] flex items-center justify-between text-[10.5px] font-mono">
              <span className="text-[#746F68]">Tailor Team Active</span>
              <span className="text-[#6E593F] bg-[#8B7355]/10 px-1.5 py-0.2 rounded text-[9.5px]">Due by 5:30 PM</span>
            </div>
          </div>
        </div>

      </div>

      {/* ==================================================================== */}
      {/* 3. MOBILE DATE SELECTOR STRIP                                        */}
      {/* ==================================================================== */}
      <div className="md:hidden space-y-2 bg-[#FAF8F5] p-2.5 rounded-[2px] border border-[#E5DDD1]">
        {/* Month strip header with compact navigator & today jump */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1 rounded text-[#746F68] hover:text-[#111113] transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-medium text-[#111113]">
              {formattedMonthTitle}
            </span>
            {selectedDateStr !== todayStr && (
              <button
                type="button"
                onClick={handleGoToday}
                className="px-2 py-0.5 rounded-[2px] bg-[#111113] text-[#FAF8F5] text-[9.5px] font-mono uppercase tracking-wider font-semibold cursor-pointer"
              >
                Today
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="p-1 rounded text-[#746F68] hover:text-[#111113] transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Horizontal Day Buttons */}
        <div
          ref={dateRibbonRef}
          className="flex gap-2 overflow-x-auto py-1.5 px-0.5 snap-x snap-mandatory suko-scrollbar"
        >
          {monthDaysList.map((day) => {
            const dStr = dateKey(day);
            const isSelected = selectedDateStr === dStr;
            const isToday = todayStr === dStr;
            const dayEvents = getEventsForDate(dStr);
            const weekday = day.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();

            // Distinct event dots
            const hasOrder = dayEvents.some((e) => e.type === "order");
            const hasFitting = dayEvents.some((e) => e.type === "fitting");
            const hasProd = dayEvents.some((e) => e.type === "production");
            const hasDispatch = dayEvents.some((e) => e.type === "dispatch");
            const hasAny = dayEvents.length > 0;

            return (
              <button
                key={dStr}
                type="button"
                data-selected={isSelected ? "true" : "false"}
                onClick={() => setSelectedDate(day)}
                className={`snap-center shrink-0 w-12 py-2 rounded-[2px] border flex flex-col items-center justify-between transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-[#111113] text-[#FAF8F5] border-[#111113] shadow-md ring-2 ring-[#C2922E]/40"
                    : isToday
                    ? "bg-white text-[#111113] border-[#C2922E]"
                    : "bg-white text-[#55514B] border-[#E5DDD1] hover:bg-[#FAF8F5]"
                }`}
              >
                <span className={`text-[9px] font-mono font-semibold tracking-wider ${isSelected ? "text-[#C2922E]" : "text-[#8E877E]"}`}>
                  {weekday}
                </span>

                <span className="font-serif text-base font-normal my-0.5 leading-none">
                  {day.getDate()}
                </span>

                {/* Event Dots */}
                <div className="flex items-center gap-0.5 h-1.5 mt-0.5">
                  {hasOrder && <span className="w-1 h-1 rounded-full bg-[#C2922E]" />}
                  {hasFitting && <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-[#111113]"}`} />}
                  {hasProd && <span className="w-1 h-1 rounded-full bg-[#8B7355]" />}
                  {hasDispatch && <span className="w-1 h-1 rounded-full bg-[#607D8B]" />}
                  {!hasAny && <span className="w-1 h-1 rounded-full opacity-0" />}
                </div>

                {/* Triangle indicator pointing to agenda below */}
                {isSelected && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] leading-none text-[#111113] pointer-events-none">
                    ▲
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. TRACK FILTERS (Mobile Dropdown + Horizontal Chips / Desktop Bar)   */}
      {/* ==================================================================== */}
      <div className="space-y-2 border-y border-[#ECE7DE] py-2">
        {/* Mobile Single Dropdown Selector */}
        <div className="md:hidden flex items-center justify-between gap-2 px-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E877E] shrink-0 flex items-center gap-1">
            <Filter size={12} className="text-[#C2922E]" /> Filter:
          </span>
          <div className="relative flex-1 max-w-[210px]">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full text-xs font-mono bg-white border border-[#E5DDD1] rounded-[2px] py-1.5 pl-2.5 pr-7 text-[#111113] focus:outline-none focus:border-[#C2922E] appearance-none cursor-pointer"
            >
              <option value="all">All Operations ({selectedDateTimeline.length})</option>
              <option value="order">Orders ({selectedDateTimeline.filter(e => e.type === 'order').length})</option>
              <option value="fitting">Fittings ({selectedDateTimeline.filter(e => e.type === 'fitting').length})</option>
              <option value="production">Production ({selectedDateTimeline.filter(e => e.type === 'production').length})</option>
              <option value="dispatch">Dispatches ({selectedDateTimeline.filter(e => e.type === 'dispatch').length})</option>
              <option value="campaign">Campaigns ({selectedDateTimeline.filter(e => e.type === 'campaign').length})</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#746F68] pointer-events-none" />
          </div>
        </div>

        {/* Horizontal Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-1 suko-scrollbar">
          <span className="hidden md:flex text-[10px] font-mono uppercase tracking-wider text-[#8E877E] mr-1.5 shrink-0 items-center gap-1">
            <Filter size={11} /> Filter:
          </span>

          {[
            { key: "all", label: "All Operations" },
            { key: "order", label: "Orders", theme: EVENT_THEME.order },
            { key: "fitting", label: "Fittings", theme: EVENT_THEME.fitting },
            { key: "production", label: "Production", theme: EVENT_THEME.production },
            { key: "dispatch", label: "Dispatches", theme: EVENT_THEME.dispatch },
            { key: "campaign", label: "Campaigns", theme: EVENT_THEME.campaign }
          ].map((f) => {
            const isSelected = activeFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setActiveFilter(f.key)}
                className={`px-3 py-1.5 rounded-[2px] text-[11px] font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? "bg-[#111113] text-[#FAF8F5] shadow-xs font-semibold"
                    : "bg-white text-[#55514B] hover:bg-[#FAF8F5] border border-[#E5DDD1]"
                }`}
              >
                {f.theme && <span className={`w-1.5 h-1.5 rounded-full ${f.theme.dot}`} />}
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. MOBILE AGENDA TIMELINE (Default on Mobile)                        */}
      {/* ==================================================================== */}
      <div className="md:hidden space-y-4">
        
        {/* Selected Date Header */}
        <div className="bg-white border border-[#E5DDD1] p-3.5 rounded-[2px] shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-medium text-[#111113]">
                  {selectedDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                </span>
                {selectedDateStr === todayStr && (
                  <span className="px-2 py-0.5 rounded-[2px] bg-[#111113] text-[#FAF8F5] text-[9.5px] font-mono uppercase tracking-widest font-bold">
                    TODAY
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E877E] block">
                {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
              </span>
            </div>

            <span className="text-[11px] font-mono text-[#746F68] bg-[#FAF8F5] px-2.5 py-1 border border-[#E5DDD1] rounded-[2px]">
              {filteredTimeline.length} {filteredTimeline.length === 1 ? "Event" : "Events"}
            </span>
          </div>
        </div>

        {/* Mobile Agenda Event Cards */}
        {filteredTimeline.length > 0 ? (
          <div className="space-y-3">
            {filteredTimeline.map((evt) => {
              const theme = EVENT_THEME[evt.type] || EVENT_THEME.order;

              return (
                <div
                  key={evt.id}
                  className={`bg-white border rounded-[2px] p-4 space-y-3 shadow-2xs border-l-4 ${theme.borderAccent} border-[#E5DDD1]`}
                >
                  {/* Time + Divider Line */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#111113] whitespace-nowrap">
                      {evt.time || "10:00 AM"}
                    </span>
                    <div className="h-[1px] flex-1 bg-[#ECE7DE]" />
                  </div>

                  {/* Category Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9.5px] font-mono uppercase font-bold tracking-widest px-2 py-0.5 rounded-[2px] ${theme.badgeBg} ${theme.badgeText}`}
                    >
                      {theme.mobileHeader}
                    </span>

                    {/* Production Task Checkbox or Delete */}
                    {evt.type === "production" ? (
                      <button
                        type="button"
                        onClick={() => handleToggleTaskComplete(evt.id)}
                        className="text-[#111113] p-1 cursor-pointer"
                        title="Toggle Task Complete"
                      >
                        {evt.completed ? (
                          <CheckSquare size={17} className="text-emerald-700" />
                        ) : (
                          <Square size={17} className="text-[#8E877E]" />
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="text-[#8E877E] hover:text-red-700 p-1 cursor-pointer transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Name / Client & Garment */}
                  <div>
                    <h4
                      className={`text-base font-serif font-normal text-[#111113] ${
                        evt.completed ? "line-through text-[#8E877E]" : ""
                      }`}
                    >
                      {evt.clientOrGarment || evt.title}
                    </h4>
                    <p className="text-xs text-[#55514B] font-sans mt-0.5 leading-relaxed">
                      {evt.serviceOrStep || evt.subtitle}
                    </p>
                  </div>

                  {/* Card Footer: Team Assignment + View Details Action */}
                  <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between">
                    {evt.assignTeam ? (
                      <span className="text-[10px] font-mono text-[#746F68] bg-[#FAF8F5] px-2 py-0.5 rounded-[2px] border border-[#E5DDD1]">
                        {evt.assignTeam}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#8E877E]">
                        Atelier Salon
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setViewingEvent(evt)}
                      className="text-xs font-mono text-[#111113] hover:text-[#C2922E] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>View Details</span>
                      <ArrowRight size={12} className="text-[#C2922E]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-white border border-dashed border-[#ECE7DE] rounded-[2px] space-y-1">
            <p className="font-serif text-sm text-[#111113]">No operations scheduled for this date</p>
            <p className="text-xs text-[#8E877E] font-sans italic">
              Tap the "+" button below to schedule an order, fitting, production task, or dispatch.
            </p>
          </div>
        )}

        {/* Mobile Studio Scratchpad */}
        <div className="bg-white border border-[#E5DDD1] rounded-[2px] p-4 space-y-3 shadow-2xs">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#8E877E] block">
            STUDIO SCRATCHPAD &bull; {selectedDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
          </span>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddNote();
              }}
              placeholder="Add quick studio note..."
              className="flex-1 text-xs font-sans p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
            />
            <button
              type="button"
              onClick={handleAddNote}
              className="px-3.5 py-2 bg-[#111113] text-white text-xs font-mono uppercase rounded-[2px] cursor-pointer"
            >
              Add
            </button>
          </div>

          {selectedDateNotes.length > 0 && (
            <div className="space-y-1 pt-1">
              {selectedDateNotes.map((n) => (
                <div
                  key={n.id}
                  className="flex items-center justify-between p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] text-xs text-[#55514B]"
                >
                  <span>&bull; {n.text}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(n.id)}
                    className="text-[#8E877E] p-0.5 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ==================================================================== */}
      {/* 6. DESKTOP VIEW (hidden md:grid): 7-COL CALENDAR + TIMELINE PANEL   */}
      {/* ==================================================================== */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 7 Columns: Month / Week / Day Desktop Canvas */}
        <div className="lg:col-span-7 bg-white border border-[#E5DDD1] rounded-[2px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          
          {/* Desktop Toolbar: Month Navigator + View Switcher */}
          <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 border border-[#E5DDD1] rounded-[2px] hover:border-[#111113] hover:bg-[#FAF8F5] transition-colors text-[#55514B]"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs uppercase tracking-[0.16em] font-mono text-[#111113] font-semibold min-w-[140px] text-center">
                {formattedMonthTitle}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 border border-[#E5DDD1] rounded-[2px] hover:border-[#111113] hover:bg-[#FAF8F5] transition-colors text-[#55514B]"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* View Mode Toggle: Month | Week | Day */}
            <div className="inline-flex rounded-[2px] border border-[#E5DDD1] bg-[#FAF8F5] p-0.5 text-xs font-mono">
              {["month", "week", "day"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCalendarView(mode)}
                  className={`px-3 py-1 rounded-[1px] text-[10.5px] uppercase tracking-wider transition-all cursor-pointer ${
                    calendarView === mode
                      ? "bg-[#111113] text-[#FAF8F5] font-semibold shadow-2xs"
                      : "text-[#746F68] hover:text-[#111113]"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* 6A. Month View */}
          {calendarView === "month" && (
            <>
              <div className="grid grid-cols-7 text-center pb-2 border-b border-[#F0EBE1] text-[10.5px] uppercase tracking-[0.14em] text-[#8E877E] font-mono font-medium">
                <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth().map((day, idx) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="min-h-[125px] bg-[#FAF8F5]/30 border border-transparent rounded-[2px]"
                      />
                    );
                  }

                  const dStr = dateKey(day);
                  const isSelected = selectedDateStr === dStr;
                  const isToday = todayStr === dStr;
                  const dayEvents = getEventsForDate(dStr);
                  const filteredDayEvents = dayEvents.filter(
                    (e) => activeFilter === "all" || e.type === activeFilter
                  );

                  return (
                    <div
                      key={dStr}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-[125px] border rounded-[2px] p-2 text-left cursor-pointer flex flex-col justify-between transition-all group ${
                        isSelected
                          ? "border-[#111113] bg-[#FAF8F5] ring-2 ring-[#C2922E]/40 shadow-xs"
                          : isToday
                          ? "border-[#C2922E] bg-[#FAF8F5]"
                          : "border-[#ECE7DE] hover:border-[#C2922E] bg-white hover:bg-[#FAF8F5]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-mono ${
                            isSelected
                              ? "text-[#111113] font-bold"
                              : isToday
                              ? "text-[#C2922E] font-bold"
                              : "text-[#55514B] font-medium"
                          }`}
                        >
                          {day.getDate()}
                        </span>
                        {isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" title="Today" />
                        )}
                      </div>

                      {/* Mini Information Blocks */}
                      <div className="space-y-1.5 my-1 overflow-hidden">
                        {filteredDayEvents.slice(0, 3).map((evt) => {
                          const theme = EVENT_THEME[evt.type] || EVENT_THEME.order;

                          return (
                            <div
                              key={evt.id}
                              className={`border-l-2 ${theme.borderAccent} ${theme.cellBg} border border-[#ECE7DE] pl-1.5 pr-1 py-1 rounded-[1px] space-y-0.5`}
                            >
                              <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-wider font-bold">
                                <span className={theme.badgeText}>{theme.shortLabel}</span>
                                <span className="text-[#111113]">
                                  {evt.type === "order"
                                    ? `₹${parseFloat(evt.rawOrder?.total || 4800) >= 1000 ? `${Math.round(parseFloat(evt.rawOrder?.total || 4800) / 1000)}k` : parseFloat(evt.rawOrder?.total || 4800)}`
                                    : evt.time || "DUE"}
                                </span>
                              </div>
                              <div className="text-[9px] font-mono font-medium text-[#111113] truncate leading-tight">
                                {evt.type === "order"
                                  ? evt.title
                                  : evt.clientOrGarment || evt.title.replace(/Client Fitting: |Production Deadline: |Dispatch Due: |New Collection Launch: /g, "")}
                              </div>
                            </div>
                          );
                        })}

                        {filteredDayEvents.length > 3 && (
                          <div className="text-[8px] font-mono text-[#8E877E] text-right font-medium">
                            +{filteredDayEvents.length - 3} more operations
                          </div>
                        )}
                      </div>

                      <div className="text-[8px] font-mono text-[#8E877E] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                        <span>Timeline</span>
                        <span>&rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* 6B. Week View */}
          {calendarView === "week" && (
            <div className="grid grid-cols-7 gap-2">
              {getDaysInCurrentWeek().map((day) => {
                const dStr = dateKey(day);
                const isSelected = selectedDateStr === dStr;
                const isToday = todayStr === dStr;
                const dayEvents = getEventsForDate(dStr).filter(
                  (e) => activeFilter === "all" || e.type === activeFilter
                );

                return (
                  <div
                    key={dStr}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[380px] border rounded-[2px] p-2 flex flex-col justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#111113] bg-[#FAF8F5] ring-2 ring-[#C2922E]/40"
                        : isToday
                        ? "border-[#C2922E] bg-[#FAF8F5]"
                        : "border-[#ECE7DE] bg-white hover:border-[#C2922E]"
                    }`}
                  >
                    <div>
                      <div className="border-b border-[#ECE7DE] pb-1.5 mb-2 text-center">
                        <span className="text-[9px] font-mono uppercase text-[#8E877E] block">
                          {day.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        <span className={`font-serif text-base ${isToday ? "text-[#C2922E] font-bold" : "text-[#111113]"}`}>
                          {day.getDate()}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {dayEvents.map((evt) => {
                          const theme = EVENT_THEME[evt.type] || EVENT_THEME.order;
                          return (
                            <div
                              key={evt.id}
                              className={`border-l-2 ${theme.borderAccent} ${theme.cellBg} border border-[#ECE7DE] p-1.5 rounded-[1px] space-y-0.5`}
                            >
                              <div className="flex items-center justify-between text-[8px] font-mono uppercase font-bold">
                                <span className={theme.badgeText}>{theme.shortLabel}</span>
                                <span className="text-[#111113]">{evt.time}</span>
                              </div>
                              <div className="text-[9.5px] font-mono font-medium text-[#111113] truncate">
                                {evt.title}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <span className="text-[8.5px] font-mono text-[#8E877E] text-center pt-2">
                      {dayEvents.length} items
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 6C. Day View */}
          {calendarView === "day" && (
            <div className="space-y-4">
              <div className="p-3 bg-[#FAF8F5] border border-[#ECE7DE] rounded-[2px] flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-mono tracking-wider text-[#C2922E] font-semibold">
                    DAY SCHEDULE &bull; ATELIER OPERATIONS
                  </span>
                  <h4 className="font-serif text-lg text-[#111113]">
                    {formattedSelectedDateLabel}
                  </h4>
                </div>
                <span className="text-xs font-mono font-medium text-[#111113] bg-white px-2.5 py-1 border border-[#E5DDD1] rounded-[2px]">
                  {selectedDateTimeline.length} Milestones
                </span>
              </div>

              <div className="divide-y divide-[#F0EBE1] border border-[#ECE7DE] rounded-[2px]">
                {["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "05:00 PM", "06:30 PM"].map((slot) => {
                  const matched = selectedDateTimeline.filter((e) => e.time === slot);

                  return (
                    <div key={slot} className="p-3 flex items-start gap-4 hover:bg-[#FAF8F5]/40 transition-colors">
                      <span className="font-mono text-xs text-[#8E877E] w-20 shrink-0 pt-1">
                        {slot}
                      </span>
                      <div className="flex-1 space-y-2">
                        {matched.length > 0 ? (
                          matched.map((evt) => {
                            const theme = EVENT_THEME[evt.type] || EVENT_THEME.order;
                            return (
                              <div
                                key={evt.id}
                                className={`border-l-2 ${theme.borderAccent} ${theme.cellBg} border border-[#ECE7DE] p-3 rounded-[2px] flex items-center justify-between`}
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${theme.badgeBg} ${theme.badgeText}`}>
                                      {theme.shortLabel}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-[#111113]">
                                      {evt.title}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#746F68] mt-1 font-sans">
                                    {evt.subtitle}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-[#A8A29E] font-mono italic">
                            No atelier bookings in this hour slot.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Desktop Legend */}
          <div className="pt-3 border-t border-[#F0EBE1] flex flex-wrap items-center gap-4 text-[10px] font-mono text-[#746F68]">
            <span className="uppercase text-[#8E877E]">Atelier Palette:</span>
            {Object.values(EVENT_THEME).map((thm) => (
              <div key={thm.key} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${thm.dot}`} />
                <span className="text-[#111113]">{thm.label}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Right 5 Columns: Desktop Chronological Timeline Panel */}
        <div className="lg:col-span-5 bg-white border border-[#E5DDD1] rounded-[2px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
          
          <div className="flex items-start justify-between border-b border-[#F0EBE1] pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9.5px] font-mono uppercase tracking-[0.18em] text-[#C2922E] font-semibold">
                  SELECTED DATE TIMELINE
                </span>
                {selectedDateStr === todayStr && (
                  <span className="px-1.5 py-0.2 rounded-[2px] bg-[#111113] text-[#FAF8F5] text-[9px] font-mono uppercase tracking-wider font-bold">
                    TODAY
                  </span>
                )}
              </div>
              <h3 className="font-serif text-xl font-normal text-[#111113] leading-snug">
                {formattedSelectedDateLabel}
              </h3>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3 py-1.5 border border-[#E5DDD1] hover:border-[#111113] bg-[#FAF8F5] text-xs font-mono tracking-wider uppercase text-[#111113] rounded-[2px] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus size={13} className="text-[#C2922E]" />
              <span>+ Event</span>
            </button>
          </div>

          {/* Chronological Flow */}
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {filteredTimeline.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-[#EAE6DF]">
                {filteredTimeline.map((evt) => {
                  const theme = EVENT_THEME[evt.type] || EVENT_THEME.order;

                  return (
                    <div key={evt.id} className="relative group">
                      <div
                        className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center ${theme.dot} shadow-xs`}
                      />

                      <div
                        className={`p-3.5 rounded-[2px] border transition-all ${theme.cellBg} ${theme.cellBorder} hover:border-[#111113] space-y-2`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#111113]">
                              {evt.time || "10:00 AM"}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold ${theme.badgeBg} ${theme.badgeText}`}
                            >
                              {theme.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {evt.type === "production" && (
                              <button
                                type="button"
                                onClick={() => handleToggleTaskComplete(evt.id)}
                                className="text-[#746F68] hover:text-[#111113] p-1"
                              >
                                {evt.completed ? (
                                  <CheckSquare size={14} className="text-emerald-700" />
                                ) : (
                                  <Square size={14} />
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(evt.id)}
                              className="text-[#8E877E] hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4
                            className={`text-xs font-mono font-semibold text-[#111113] ${
                              evt.completed ? "line-through text-[#8E877E]" : ""
                            }`}
                          >
                            {evt.title}
                          </h4>
                          <p className="text-xs text-[#55514B] font-sans mt-0.5 leading-snug">
                            {evt.subtitle}
                          </p>
                        </div>

                        {(evt.clientOrGarment || evt.assignTeam) && (
                          <div className="pt-2 border-t border-[#ECE7DE] flex items-center justify-between text-[10px] font-mono text-[#746F68]">
                            <span>{evt.clientOrGarment}</span>
                            {evt.assignTeam && <span>Assigned: {evt.assignTeam}</span>}
                          </div>
                        )}

                        {evt.rawOrder && onSelectOrder && (
                          <button
                            type="button"
                            onClick={() => onSelectOrder(evt.rawOrder)}
                            className="text-[10px] font-mono text-[#C2922E] hover:underline flex items-center gap-1 pt-1 font-semibold cursor-pointer"
                          >
                            <span>Open Order #{evt.rawOrder.id} in Studio</span>
                            <ArrowRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#FAF8F5] border border-dashed border-[#ECE7DE] rounded-[2px] space-y-1">
                <p className="font-serif text-sm text-[#111113]">No operations scheduled for this date</p>
                <p className="text-xs text-[#8E877E] font-sans italic">
                  Click "+ Schedule Atelier Event" to add a fitting, production task, dispatch, or campaign drop.
                </p>
              </div>
            )}

            {/* Desktop Studio Scratchpad */}
            <div className="space-y-3 pt-4 border-t border-[#ECE7DE]">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#8E877E] block">
                STUDIO SCRATCHPAD &bull; {selectedDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
              </span>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddNote();
                  }}
                  placeholder="e.g. Silk lining inspection, client fabric choice..."
                  className="flex-1 text-xs font-sans p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  className="px-3 py-2 bg-[#111113] hover:bg-[#C2922E] text-white text-xs font-mono uppercase rounded-[2px] transition-colors"
                >
                  Add
                </button>
              </div>

              {selectedDateNotes.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {selectedDateNotes.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-center justify-between p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] text-xs text-[#55514B]"
                    >
                      <span>&bull; {n.text}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(n.id)}
                        className="text-[#8E877E] hover:text-red-600 p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* ==================================================================== */}
      {/* 7. MOBILE FLOATING ACTION BUTTON (FAB) (Prompt Request #5)          */}
      {/* ==================================================================== */}
      <div className="md:hidden fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="w-13 h-13 rounded-full bg-[#111113] hover:bg-[#C2922E] text-[#FAF8F5] shadow-2xl flex items-center justify-center transition-transform active:scale-95 border border-[#C2922E]/40"
          title="Create Atelier Event"
        >
          <Plus size={22} className="text-[#C2922E]" />
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 8. CREATE ATELIER EVENT MODAL (Desktop & Mobile Unified)             */}
      {/* ==================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E5DDD1] rounded-[2px] w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EBE1] bg-[#FAF8F5]">
              <div>
                <span className="text-[9.5px] uppercase tracking-[0.2em] text-[#C2922E] font-mono font-semibold">
                  ATELIER TIMELINE ENTRY
                </span>
                <h3 className="font-serif text-lg font-normal text-[#111113]">
                  Create Event
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-[#8E877E] hover:text-[#111113] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNewEvent} className="p-6 space-y-4">
              
              {/* Event Type Radio Choices */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                  Event Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: "order", label: "Order", theme: EVENT_THEME.order },
                    { key: "fitting", label: "Fitting", theme: EVENT_THEME.fitting },
                    { key: "production", label: "Production", theme: EVENT_THEME.production },
                    { key: "dispatch", label: "Dispatch", theme: EVENT_THEME.dispatch },
                    { key: "campaign", label: "Campaign", theme: EVENT_THEME.campaign }
                  ].map((t) => {
                    const isSel = newEventForm.type === t.key;
                    return (
                      <label
                        key={t.key}
                        className={`p-2.5 rounded-[2px] border text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
                          isSel
                            ? "bg-[#FAF8F5] border-[#111113] text-[#111113] font-semibold ring-1 ring-[#111113]"
                            : "bg-white border-[#E5DDD1] text-[#746F68] hover:bg-[#FAF8F5]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="eventType"
                          value={t.key}
                          checked={isSel}
                          onChange={() => setNewEventForm({ ...newEventForm, type: t.key })}
                          className="accent-[#111113]"
                        />
                        <span className={`w-2 h-2 rounded-full ${t.theme.dot}`} />
                        <span>{t.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newEventForm.date}
                    onChange={(e) => setNewEventForm({ ...newEventForm, date: e.target.value })}
                    className="w-full text-xs font-mono p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                    Time *
                  </label>
                  <input
                    type="text"
                    value={newEventForm.time}
                    onChange={(e) => setNewEventForm({ ...newEventForm, time: e.target.value })}
                    placeholder="e.g. 10:30 AM"
                    className="w-full text-xs font-mono p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                    required
                  />
                </div>
              </div>

              {/* Title / Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                  Title / Subject *
                </label>
                <input
                  type="text"
                  value={newEventForm.title}
                  onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
                  placeholder={
                    newEventForm.type === "fitting"
                      ? "Shreya Meshram"
                      : newEventForm.type === "production"
                      ? "Noir Sculpted Vest"
                      : newEventForm.type === "dispatch"
                      ? "Order #1024"
                      : newEventForm.type === "order"
                      ? "Order #SUKO-1026"
                      : "Autumn/Winter Capsule Drop"
                  }
                  className="w-full text-xs font-sans p-2.5 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                  required
                />
              </div>

              {/* Operational Subtitle / Details */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                  Operational Details / Garment
                </label>
                <input
                  type="text"
                  value={newEventForm.subtitle}
                  onChange={(e) => setNewEventForm({ ...newEventForm, subtitle: e.target.value })}
                  placeholder={
                    newEventForm.type === "fitting"
                      ? "Power Suit Alteration"
                      : newEventForm.type === "production"
                      ? "Quality Check & Satin Lining Attachment"
                      : newEventForm.type === "dispatch"
                      ? "Ready for courier"
                      : "Executive Capsule Release"
                  }
                  className="w-full text-xs font-sans p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                />
              </div>

              {/* Assign Team */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                  Assign Team
                </label>
                <input
                  type="text"
                  value={newEventForm.assignTeam}
                  onChange={(e) => setNewEventForm({ ...newEventForm, assignTeam: e.target.value })}
                  placeholder="e.g. Master Tailor Rajesh / Atelier Team / Courier Desk"
                  className="w-full text-xs font-sans p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#55514B] block font-medium">
                  Notes
                </label>
                <textarea
                  value={newEventForm.notes}
                  onChange={(e) => setNewEventForm({ ...newEventForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Additional tailoring specifications, client measurements, or dispatch notes..."
                  className="w-full text-xs font-sans p-2 bg-[#FAF8F5] border border-[#E5DDD1] rounded-[2px] focus:outline-none focus:border-[#111113]"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0EBE1]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#E5DDD1] hover:border-[#111113] bg-white text-xs font-mono uppercase rounded-[2px] text-[#746F68] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#111113] hover:bg-[#C2922E] text-white text-xs font-mono uppercase tracking-wider rounded-[2px] transition-colors shadow-xs cursor-pointer"
                >
                  Create Event
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 9. VIEW EVENT DETAILS MODAL (Quiet Luxury Atelier Inspection)       */}
      {/* ==================================================================== */}
      {viewingEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E5DDD1] rounded-[2px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EBE1] bg-[#FAF8F5]">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9.5px] font-mono uppercase font-bold tracking-widest px-2 py-0.5 rounded-[2px] ${
                      EVENT_THEME[viewingEvent.type]?.badgeBg || "bg-[#111113]/10"
                    } ${EVENT_THEME[viewingEvent.type]?.badgeText || "text-[#111113]"}`}
                  >
                    {EVENT_THEME[viewingEvent.type]?.mobileHeader || "ATELIER EVENT"}
                  </span>
                  <span className="text-xs font-mono text-[#746F68]">
                    {viewingEvent.time || "10:00 AM"}
                  </span>
                </div>
                <h3 className="font-serif text-lg font-normal text-[#111113]">
                  {viewingEvent.clientOrGarment || viewingEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingEvent(null)}
                className="p-1.5 text-[#8E877E] hover:text-[#111113] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs">
              
              {/* Operational Subtitle / Service */}
              {viewingEvent.subtitle && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E877E] block">
                    Operational Scope
                  </span>
                  <p className="font-sans text-sm text-[#111113] bg-[#FAF8F5] p-3 rounded-[2px] border border-[#E5DDD1]">
                    {viewingEvent.subtitle}
                  </p>
                </div>
              )}

              {/* Grid: Date, Team, Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E877E] block">
                    Scheduled Date
                  </span>
                  <span className="font-mono text-xs text-[#111113] font-medium block">
                    {viewingEvent.date}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E877E] block">
                    Assigned Craftsman / Desk
                  </span>
                  <span className="font-mono text-xs text-[#111113] font-medium block">
                    {viewingEvent.assignTeam || "Atelier Main Desk"}
                  </span>
                </div>
              </div>

              {/* Bespoke Notes */}
              {viewingEvent.notes && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E877E] block">
                    Tailoring Notes &amp; Specifications
                  </span>
                  <p className="font-sans text-xs text-[#55514B] bg-[#FAF8F5] p-3 rounded-[2px] border border-[#E5DDD1] italic">
                    "{viewingEvent.notes}"
                  </p>
                </div>
              )}

              {/* Attached Order Details */}
              {viewingEvent.rawOrder && (
                <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-[#746F68] block">
                      Linked Storefront Order
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#111113]">
                      Order #{viewingEvent.rawOrder.id} &bull; {viewingEvent.rawOrder.customer_name || "Patron"}
                    </span>
                  </div>
                  {onSelectOrder && (
                    <button
                      type="button"
                      onClick={() => {
                        const order = viewingEvent.rawOrder;
                        setViewingEvent(null);
                        onSelectOrder(order);
                      }}
                      className="px-3 py-1.5 bg-[#111113] hover:bg-[#C2922E] text-white font-mono text-[11px] uppercase tracking-wider rounded-[2px] transition-colors cursor-pointer"
                    >
                      Open Order &rarr;
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#F0EBE1] bg-[#FAF8F5]">
              <div>
                {!viewingEvent.rawOrder && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteEvent(viewingEvent.id);
                      setViewingEvent(null);
                    }}
                    className="text-xs font-mono text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete Event</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {viewingEvent.type === "production" && (
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleTaskComplete(viewingEvent.id);
                      setViewingEvent({ ...viewingEvent, completed: !viewingEvent.completed });
                    }}
                    className={`px-3.5 py-1.5 rounded-[2px] text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border ${
                      viewingEvent.completed
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-[#111113] text-white border-[#111113] hover:bg-[#C2922E]"
                    }`}
                  >
                    {viewingEvent.completed ? "✓ Completed" : "Mark Done"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setViewingEvent(null)}
                  className="px-4 py-1.5 border border-[#E5DDD1] hover:border-[#111113] bg-white text-xs font-mono uppercase rounded-[2px] text-[#746F68] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
