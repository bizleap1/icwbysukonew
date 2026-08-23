import React, { useEffect, useState, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ShoppingBag, Search, User, Menu, X, Heart } from "lucide-react";
import { useLenis } from "lenis/react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import SearchModal from "./SearchModal";

const navLinks = [
  { to: "/new-in", label: "NEW IN" },
  { to: "/women", label: "WOMEN" },
  { to: "/collection", label: "COLLECTIONS" },
];

const Navbar = () => {
  const lenis = useLenis();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { openCart, count } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Top of page: transparent hero navbar
      if (currentScrollY <= 20) {
        setIsVisible(true);
        setIsScrolled(false);
      } else {
        setIsScrolled(true);

        if (currentScrollY > lastScrollY.current + 4) {
          // Scrolling DOWN -> hide Navbar (Filter Bar moves to top-0)
          setIsVisible(false);
          setAccountMenuOpen(false);
        } else if (currentScrollY < lastScrollY.current - 4) {
          // Scrolling UP -> show Navbar (Filter Bar sits directly below it)
          setIsVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock background body scroll and Lenis when mobile hamburger menu is open
  useEffect(() => {
    if (mobileOpen) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.body.style.overflow = "";
    }
    return () => {
      lenis?.start();
      document.body.style.overflow = "";
    };
  }, [mobileOpen, lenis]);

  // Determine navbar appearance (solid ivory or solid charcoal when scrolled or on interior pages)
  const isSolid = isScrolled || !isHome;

  return (
    <>
      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] font-body ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Main Luxury Navbar */}
        <header
          data-testid="main-navbar"
          className={`w-full flex items-center transition-all duration-400 ${
            isSolid
              ? "bg-[#FAF8F5] text-[#111113] border-b border-[#E8E4DC] shadow-[0_2px_15px_rgba(0,0,0,0.03)] min-h-[66px] lg:min-h-[70px]"
              : "bg-gradient-to-b from-black/75 via-black/25 to-transparent text-white min-h-[76px] lg:min-h-[80px]"
          }`}
        >
          <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-14 xl:px-16 py-3 lg:py-3.5 flex items-center justify-between">
            
            {/* 1. Left (Desktop: Nav Links | Mobile: 2-Line Minimalist Fashion Hamburger) */}
            <div className="flex items-center flex-1 lg:flex-1 justify-start">
              {/* Custom 2-Line Minimalist Fashion Hamburger */}
              <button
                data-testid="mobile-menu-btn"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-1.5 -ml-1 flex flex-col justify-center gap-[5.5px] items-start transition-all duration-300 group select-none"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                <span
                  className={`block h-[1.3px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    mobileOpen
                      ? "w-[21px] translate-y-[3.4px] rotate-45 bg-white"
                      : `w-[21px] ${isSolid ? "bg-[#18181B]" : "bg-white"}`
                  }`}
                />
                <span
                  className={`block h-[1.3px] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    mobileOpen
                      ? "w-[21px] -translate-y-[3.4px] -rotate-45 bg-white"
                      : `w-[15px] ${isSolid ? "bg-[#18181B]" : "bg-white"}`
                  }`}
                />
              </button>

              {/* Desktop Navigation Links */}
              <nav className="hidden lg:flex items-center gap-8 xl:gap-11">
                {navLinks.map((l, idx) => (
                  <NavLink
                    key={idx}
                    to={l.to}
                    data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g, '-')}-link`}
                    className={({ isActive }) =>
                      `text-[11.5px] uppercase tracking-[0.16em] font-normal transition-all duration-300 relative py-1 group ${
                        isSolid
                          ? isActive && l.to !== "/collection"
                            ? "text-[#111113] font-medium"
                            : "text-[#3A3A40] hover:text-[#111113]"
                          : isActive && l.to !== "/collection"
                          ? "text-white font-medium"
                          : "text-white/85 hover:text-white"
                      }`
                    }
                  >
                    {l.label}
                    {/* Underline indicator */}
                    <span
                      className={`absolute bottom-0 left-0 w-0 h-[1.5px] transition-all duration-300 group-hover:w-full ${
                        isSolid ? "bg-[#C2922E]" : "bg-white"
                      }`}
                    />
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* 2. Center: Brand Logo (Always perfectly centered, refined mobile size) */}
            <div className="flex items-center justify-center shrink-0">
              <Link to="/" data-testid="nav-logo" className="flex items-center select-none group">
                <img
                  src={isSolid ? "/logo.png" : "/logo-light.png"}
                  alt="ICW BY SUKO"
                  className="h-[27px] sm:h-[31px] lg:h-12 xl:h-[50px] w-auto object-contain transition-all duration-300 group-hover:scale-105"
                />
              </Link>
            </div>

            {/* 3. Right: Icons (Mobile: Search + Bag | Desktop: Search + Account + Wishlist + Bag) */}
            <div className="flex items-center justify-end flex-1 gap-3 sm:gap-5 lg:gap-7">
              {/* Search Button (Mobile & Desktop) */}
              <button
                onClick={() => setSearchOpen(true)}
                className={`transition-colors p-1 ${
                  isSolid
                    ? "text-[#18181B] hover:text-black"
                    : "text-white/90 hover:text-white"
                }`}
                aria-label="Search"
              >
                <Search size={18} strokeWidth={1.3} />
              </button>

              {/* Account Menu (Desktop Only) */}
              <div className="hidden lg:block">
                {user?.authenticated ? (
                  <div className="relative">
                    <button
                      onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                      className={`relative p-1 transition-colors flex items-center ${
                        isSolid
                          ? "text-[#18181B] hover:text-black"
                          : "text-white/90 hover:text-white"
                      }`}
                      aria-label="Account Menu"
                    >
                      <User size={18} strokeWidth={1.3} />
                      <span className="absolute top-0 right-0 w-2 h-2 bg-[#C2922E] rounded-full border border-white" />
                    </button>

                    {accountMenuOpen && (
                      <div className="absolute top-full right-0 mt-3 w-52 bg-[#0F0F11] border border-white/10 p-2 flex flex-col gap-1 z-50 shadow-2xl rounded-none text-white">
                        <div className="px-3 py-2.5 text-[9px] uppercase tracking-[0.22em] text-[#C2922E] border-b border-white/10 mb-1">
                          {user.role === "admin" ? "Admin Access" : "My Account"}
                        </div>
                        {user.role === "admin" && (
                          <Link
                            to="/admin"
                            onClick={() => setAccountMenuOpen(false)}
                            className="px-3 py-2 text-[12px] text-white/80 hover:text-white hover:bg-white/5 text-left transition-colors"
                          >
                            Dashboard
                          </Link>
                        )}
                        <Link
                          to="/account"
                          onClick={() => setAccountMenuOpen(false)}
                          className="px-3 py-2 text-[12px] text-white/80 hover:text-white hover:bg-white/5 text-left transition-colors"
                        >
                          Profile & Settings
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setAccountMenuOpen(false)}
                          className="px-3 py-2 text-[12px] text-white/80 hover:text-white hover:bg-white/5 text-left transition-colors"
                        >
                          Orders & Invoices
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setAccountMenuOpen(false);
                          }}
                          className="px-3 py-2 text-[12px] text-[#ff6b6b] hover:bg-red-500/10 text-left transition-colors mt-1 border-t border-white/10 pt-2"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/auth"
                    className={`p-1 transition-colors block ${
                      isSolid
                        ? "text-[#18181B] hover:text-black"
                        : "text-white/90 hover:text-white"
                    }`}
                    aria-label="Account"
                  >
                    <User size={18} strokeWidth={1.3} />
                  </Link>
                )}
              </div>

              {/* Wishlist Link (Desktop Only) */}
              <Link
                to="/wishlist"
                className={`hidden lg:block relative p-1 transition-colors ${
                  isSolid
                    ? "text-[#18181B] hover:text-black"
                    : "text-white/90 hover:text-white"
                }`}
                aria-label="Wishlist"
              >
                <Heart size={18} strokeWidth={1.3} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[8.5px] bg-[#C2922E] text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-semibold">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Shopping Bag (Mobile & Desktop) */}
              <button
                onClick={openCart}
                className={`relative p-1 transition-colors ${
                  isSolid
                    ? "text-[#18181B] hover:text-black"
                    : "text-white/90 hover:text-white"
                }`}
                aria-label="Cart"
              >
                <ShoppingBag size={18} strokeWidth={1.3} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 text-[8.5px] bg-[#C2922E] text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-semibold">
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Full-Screen Luxury Fashion-House Drawer */}
      {mobileOpen && (
        <div
          data-testid="mobile-menu-drawer"
          data-lenis-prevent="true"
          className="fixed inset-0 z-[999] flex flex-col font-body transition-all duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] bg-[#FAF8F5] text-[#111113]"
        >
          {/* Top Header inside Drawer */}
          <div className="flex items-center justify-between px-5 sm:px-6 h-[66px] sm:h-20 border-b shrink-0 border-[#E8E4DC]">
            {/* Left: Morphing close trigger */}
            <button
              data-testid="mobile-menu-close-btn"
              onClick={() => setMobileOpen(false)}
              className="p-1.5 -ml-1 flex flex-col justify-center gap-[5.5px] items-start group select-none"
              aria-label="Close menu"
            >
              <span className="block h-[1.3px] w-[21px] translate-y-[3.4px] rotate-45 bg-[#111113]" />
              <span className="block h-[1.3px] w-[21px] -translate-y-[3.4px] -rotate-45 bg-[#111113]" />
            </button>

            {/* Center: Logo */}
            <Link to="/" onClick={() => setMobileOpen(false)} className="select-none flex items-center justify-center">
              <img
                src="/logo.png"
                alt="ICW BY SUKO"
                className="h-[27px] sm:h-[31px] w-auto object-contain"
              />
            </Link>

            {/* Right: Search / Bag */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setSearchOpen(true);
                }}
                className="p-1 text-[#111113]/80 hover:text-black"
                aria-label="Search"
              >
                <Search size={18} strokeWidth={1.3} />
              </button>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  openCart();
                }}
                className="relative p-1 text-[#111113]/80 hover:text-black"
                aria-label="Cart"
              >
                <ShoppingBag size={18} strokeWidth={1.3} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 text-[8.5px] bg-[#C2922E] text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-semibold">
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Main Drawer Scroll Content */}
          <div className="flex-1 overflow-y-auto px-7 py-8 sm:py-10 flex flex-col justify-between" data-lenis-prevent="true">
            <div>
              {/* Main Primary Navigation (NEW IN, WOMEN, MEN, COLLECTIONS) */}
              <nav className="flex flex-col gap-5 sm:gap-6 pt-2">
                {navLinks.map((l, idx) => (
                  <NavLink
                    key={idx}
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `font-quiche text-3xl sm:text-4xl font-light tracking-wide transition-colors flex items-center justify-between ${
                        isActive
                          ? "text-[#111113] font-normal"
                          : "text-[#111113]/80 hover:text-[#C2922E]"
                      }`
                    }
                  >
                    <span>{l.label}</span>
                    <span className="text-xs font-mono text-[#C2922E]/80 tracking-widest">0{idx + 1}</span>
                  </NavLink>
                ))}
              </nav>

              {/* Thin Hairline Divider */}
              <div className="h-[1px] my-7 sm:my-8 bg-[#E8E4DC]" />

              {/* Secondary Utility Links */}
              <div className="flex flex-col gap-4 text-[11px] uppercase tracking-[0.24em]">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setSearchOpen(true);
                  }}
                  className="flex items-center gap-3 text-left transition-colors font-medium text-[#222228] hover:text-black"
                >
                  <Search size={14} className="text-[#C2922E]" />
                  <span>SEARCH COLLECTION</span>
                </button>

                {user?.authenticated ? (
                  <Link
                    to="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 transition-colors font-medium text-[#222228] hover:text-black"
                  >
                    <User size={14} className="text-[#C2922E]" />
                    <span>MY ACCOUNT ({user.name || "MEMBER"})</span>
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 transition-colors font-medium text-[#222228] hover:text-black"
                  >
                    <User size={14} className="text-[#C2922E]" />
                    <span>ACCOUNT / SIGN IN</span>
                  </Link>
                )}

                <Link
                  to="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between transition-colors font-medium text-[#222228] hover:text-black"
                >
                  <div className="flex items-center gap-3">
                    <Heart size={14} className="text-[#C2922E]" />
                    <span>WISHLIST</span>
                  </div>
                  {wishlistCount > 0 && (
                    <span className="text-[10px] bg-[#C2922E] text-white px-2 py-0.5 rounded-full font-medium">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 transition-colors font-medium text-[#222228] hover:text-black"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]" />
                  <span>CUSTOMER CARE &amp; CONCIERGE</span>
                </Link>

                <Link
                  to="/about"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 transition-colors font-medium text-[#222228] hover:text-black"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C2922E]/60" />
                  <span>THE ATELIER &amp; HERITAGE</span>
                </Link>
              </div>
            </div>

            {/* Bottom Fashion House Signature */}
            <div className="mt-10 pt-6 text-center border-t border-[#E8E4DC]">
              <span className="text-[10px] uppercase tracking-[0.34em] text-[#C2922E] font-medium block mb-1.5">
                ICW BY SUKO
              </span>
              <span className="text-[10.5px] uppercase tracking-[0.22em] font-normal text-[#4A4A54]">
                EXECUTIVE ATELIER &middot; @ICWBYSUKO
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Navbar;
