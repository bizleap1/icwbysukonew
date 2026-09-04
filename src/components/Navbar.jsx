import React, { useEffect, useState, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ShoppingBag, Search, User, Heart, ChevronRight } from "lucide-react";
import { useLenis } from "lenis/react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import SearchModal from "./SearchModal";

export const Navbar = () => {
  const lenis = useLenis();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isCollection = location.pathname === "/collection";
  const isShopByMoment = location.pathname === "/shop-by-moment";
  const isTransparentAllowed = isHome || isCollection || isShopByMoment;
  
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

      if (currentScrollY <= 20) {
        setIsVisible(true);
        setIsScrolled(false);
      } else {
        setIsScrolled(true);

        if (currentScrollY > lastScrollY.current + 6) {
          setIsVisible(false);
          setAccountMenuOpen(false);
        } else if (currentScrollY < lastScrollY.current - 6) {
          setIsVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock scroll when mobile menu is active
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

  const isSolid = isScrolled || !isTransparentAllowed;
  const isDarkTheme = !isSolid && isHome; // Only Home transparent header uses light text/logo over dark hero media

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] font-body ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {/* Main Luxury Editorial Header */}
        <header
          data-testid="main-navbar"
          className={`w-full flex items-center transition-[height,background-color,border-color,box-shadow,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[height,background-color] ${
            isSolid
              ? "bg-[#FAF8F5] text-[#121215] border-b border-[#121215]/[0.08] shadow-[0_4px_20px_rgba(18,18,21,0.03)] h-[78px] sm:h-[82px] lg:h-[86px]"
              : `bg-transparent border-b border-transparent ${isDarkTheme ? "text-white" : "text-[#121215]"} h-[94px] sm:h-[100px] lg:h-[108px]`
          }`}
        >
          <div className="w-full mx-auto px-6 sm:px-10 lg:px-12 xl:px-14 flex items-center justify-between">
            
            {/* 1. Left: ICW / SUKO Logo (Same left position, elegant compact shift on scroll) */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
              {/* Mobile Hamburger Trigger */}
              <button
                data-testid="mobile-menu-btn"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 -ml-2 flex flex-col justify-center gap-[5px] items-start transition-all duration-300 group select-none"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                <span
                  className={`block h-[1.5px] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    mobileOpen
                      ? "w-[22px] translate-y-[3.25px] rotate-45 bg-[#121215]"
                      : `w-[22px] ${isDarkTheme ? "bg-white" : "bg-[#121215]"}`
                  }`}
                />
                <span
                  className={`block h-[1.5px] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    mobileOpen
                      ? "w-[22px] -translate-y-[3.25px] -rotate-45 bg-[#121215]"
                      : `w-[16px] ${isDarkTheme ? "bg-white" : "bg-[#121215]"}`
                  }`}
                />
              </button>

              {/* ICW / SUKO Logo */}
              <Link to="/" data-testid="nav-logo" className="flex items-center select-none group">
                <img
                  src={isDarkTheme ? "/logo-light.png" : "/logo.png"}
                  alt="SUKO — The Indian Corporate Wear"
                  className={`w-auto object-contain transition-[height,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02] ${
                    isSolid
                      ? "h-[38px] sm:h-[42px] lg:h-[48px] xl:h-[52px]"
                      : "h-[44px] sm:h-[50px] lg:h-[56px] xl:h-[60px]"
                  }`}
                />
              </Link>
            </div>

            {/* 2. Center: Minimal Spaced Editorial Navigation Links (NEW ARRIVALS | COLLECTIONS | SHOP BY MOMENT | PERSONAL STYLING | ABOUT SUKO) */}
            <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-8 mx-auto whitespace-nowrap shrink-0">
              
              {/* 1. NEW ARRIVALS */}
              <NavLink
                to="/new-in"
                className={({ isActive }) =>
                  `text-[11px] xl:text-[11.5px] uppercase tracking-[0.20em] xl:tracking-[0.22em] font-light transition-colors duration-300 relative py-1 whitespace-nowrap group ${
                    isDarkTheme
                      ? isActive ? "text-white font-normal" : "text-white/85 hover:text-white"
                      : isActive ? "text-[#121215] font-normal" : "text-[#121215]/80 hover:text-[#121215]"
                  }`
                }
              >
                NEW ARRIVALS
                <span className={`absolute bottom-0 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full ${isDarkTheme ? "bg-white" : "bg-[#121215]"}`} />
              </NavLink>

              {/* 2. COLLECTIONS (Direct Link) */}
              <NavLink
                to="/collection"
                className={({ isActive }) =>
                  `text-[11px] xl:text-[11.5px] uppercase tracking-[0.20em] xl:tracking-[0.22em] font-light transition-colors duration-300 relative py-1 whitespace-nowrap group ${
                    isDarkTheme
                      ? isActive ? "text-white font-normal" : "text-white/85 hover:text-white"
                      : isActive ? "text-[#121215] font-normal" : "text-[#121215]/80 hover:text-[#121215]"
                  }`
                }
              >
                COLLECTIONS
                <span className={`absolute bottom-0 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full ${isDarkTheme ? "bg-white" : "bg-[#121215]"}`} />
              </NavLink>

              {/* 3. SHOP BY MOMENT (Direct Link) */}
              <NavLink
                to="/shop-by-moment"
                className={({ isActive }) =>
                  `text-[11px] xl:text-[11.5px] uppercase tracking-[0.20em] xl:tracking-[0.22em] font-light transition-colors duration-300 relative py-1 whitespace-nowrap group ${
                    isDarkTheme
                      ? isActive ? "text-white font-normal" : "text-white/85 hover:text-white"
                      : isActive ? "text-[#121215] font-normal" : "text-[#121215]/80 hover:text-[#121215]"
                  }`
                }
              >
                SHOP BY MOMENT
                <span className={`absolute bottom-0 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full ${isDarkTheme ? "bg-white" : "bg-[#121215]"}`} />
              </NavLink>

              {/* 4. PERSONAL STYLING */}
              <NavLink
                to="/wardrobe-concierge"
                className={({ isActive }) =>
                  `text-[11px] xl:text-[11.5px] uppercase tracking-[0.20em] xl:tracking-[0.22em] font-light transition-colors duration-300 relative py-1 whitespace-nowrap group ${
                    isDarkTheme
                      ? isActive ? "text-white font-normal" : "text-white/85 hover:text-white"
                      : isActive ? "text-[#121215] font-normal" : "text-[#121215]/80 hover:text-[#121215]"
                  }`
                }
              >
                PERSONAL STYLING
                <span className={`absolute bottom-0 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full ${isDarkTheme ? "bg-white" : "bg-[#121215]"}`} />
              </NavLink>

              {/* 5. ABOUT SUKO */}
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `text-[11px] xl:text-[11.5px] uppercase tracking-[0.20em] xl:tracking-[0.22em] font-light transition-colors duration-300 relative py-1 whitespace-nowrap group ${
                    isDarkTheme
                      ? isActive ? "text-white font-normal" : "text-white/85 hover:text-white"
                      : isActive ? "text-[#121215] font-normal" : "text-[#121215]/80 hover:text-[#121215]"
                  }`
                }
              >
                ABOUT SUKO
                <span className={`absolute bottom-0 left-0 w-0 h-[1px] transition-all duration-300 group-hover:w-full ${isDarkTheme ? "bg-white" : "bg-[#121215]"}`} />
              </NavLink>
            </nav>

            {/* 3. Right: Clean Thin Luxury Editorial Icons (Equal Spacing, Size 19px, Thin Stroke) */}
            <div className="flex items-center justify-end shrink-0 gap-6 lg:gap-7 whitespace-nowrap">

              {/* Search (Thin Stroke 1.05, Size 19px) */}
              <button
                onClick={() => setSearchOpen(true)}
                className={`p-1 bg-transparent border-0 flex items-center justify-center transition-opacity duration-300 ${
                  isDarkTheme ? "text-white hover:opacity-75" : "text-[#121215] hover:opacity-50"
                }`}
                aria-label="Search Collection"
              >
                <Search size={19} strokeWidth={1.05} />
              </button>

              {/* Account (Thin Stroke 1.05, Size 19px) */}
              <div className="hidden lg:block">
                {user?.authenticated ? (
                  <div className="relative">
                    <button
                      onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                      className={`p-1 bg-transparent border-0 flex items-center justify-center transition-opacity duration-300 ${
                        isDarkTheme ? "text-white hover:opacity-75" : "text-[#121215] hover:opacity-50"
                      }`}
                      aria-label="Account Menu"
                    >
                      <User size={19} strokeWidth={1.05} />
                    </button>
                    {accountMenuOpen && (
                      <div className="absolute right-0 top-full mt-3 w-48 bg-[#FAF8F5] border border-[#121215]/10 shadow-xl py-2 z-50 text-[#121215] text-xs">
                        <Link
                          to="/account"
                          onClick={() => setAccountMenuOpen(false)}
                          className="block px-4 py-2 hover:bg-[#121215]/5 uppercase tracking-widest text-[10px]"
                        >
                          My Profile
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setAccountMenuOpen(false)}
                          className="block px-4 py-2 hover:bg-[#121215]/5 uppercase tracking-widest text-[10px]"
                        >
                          My Orders
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setAccountMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[#121215]/5 uppercase tracking-widest text-[10px] text-red-600 border-t border-[#121215]/10 mt-1"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/auth"
                    className={`p-1 flex items-center justify-center transition-opacity duration-300 ${
                      isDarkTheme ? "text-white hover:opacity-75" : "text-[#121215] hover:opacity-50"
                    }`}
                    aria-label="Sign In"
                  >
                    <User size={19} strokeWidth={1.05} />
                  </Link>
                )}
              </div>

              {/* Wishlist (Thin Stroke 1.05, Size 19px) */}
              <Link
                to="/wishlist"
                className={`p-1 relative flex items-center justify-center transition-opacity duration-300 ${
                  isDarkTheme ? "text-white hover:opacity-75" : "text-[#121215] hover:opacity-50"
                }`}
                aria-label="Wishlist"
              >
                <Heart size={19} strokeWidth={1.05} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-[#C2922E] text-white text-[9px] font-medium flex items-center justify-center rounded-full leading-none">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Shopping Bag (Thin Stroke 1.05, Size 19px) */}
              <button
                data-testid="cart-btn"
                onClick={openCart}
                className={`p-1 relative flex items-center justify-center transition-opacity duration-300 ${
                  isDarkTheme ? "text-white hover:opacity-75" : "text-[#121215] hover:opacity-50"
                }`}
                aria-label="Open Cart"
              >
                <ShoppingBag size={19} strokeWidth={1.05} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-[#C2922E] text-white text-[9px] font-medium flex items-center justify-center rounded-full leading-none">
                    {count}
                  </span>
                )}
              </button>

            </div>

          </div>
        </header>
      </div>

      {/* Mobile Fullscreen Navigation Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-[#FAF8F5] text-[#121215] flex flex-col justify-between p-6 sm:p-8 animate-in fade-in duration-300 overflow-y-auto font-body">
          
          {/* Top Bar inside Overlay */}
          <div className="flex items-center justify-between pb-6 border-b border-[#E8E4DC]">
            <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center">
              <img src="/logo.png" alt="SUKO" className="h-[40px] sm:h-[48px] w-auto object-contain" />
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 text-[#121215] hover:text-[#C2922E] text-sm uppercase tracking-widest font-medium"
              aria-label="Close menu"
            >
              ✕ CLOSE
            </button>
          </div>

          {/* Main Mobile Navigation */}
          <div className="py-6 flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-[0.32em] text-[#C2922E] font-medium block mb-4">
                NAVIGATION
              </span>

              {/* Main Links */}
              <nav className="flex flex-col gap-4">
                
                {/* 00. HOME */}
                <NavLink
                  to="/"
                  end
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `font-quiche text-2xl sm:text-3xl font-light tracking-wide flex items-center justify-between py-1 transition-colors ${
                      isActive ? "text-[#C2922E]" : "text-[#111113] hover:text-[#C2922E]"
                    }`
                  }
                >
                  <span>HOME</span>
                  <span className="text-[10px] font-mono text-[#C2922E] tracking-widest">00</span>
                </NavLink>

                {/* 01. NEW ARRIVALS */}
                <NavLink
                  to="/new-in"
                  onClick={() => setMobileOpen(false)}
                  className="font-quiche text-2xl sm:text-3xl font-light tracking-wide text-[#111113] hover:text-[#C2922E] flex items-center justify-between py-1"
                >
                  <span>NEW ARRIVALS</span>
                  <span className="text-[10px] font-mono text-[#C2922E] tracking-widest">01</span>
                </NavLink>

                {/* 02. COLLECTIONS */}
                <NavLink
                  to="/collection"
                  onClick={() => setMobileOpen(false)}
                  className="font-quiche text-2xl sm:text-3xl font-light tracking-wide text-[#111113] hover:text-[#C2922E] flex items-center justify-between py-1"
                >
                  <span>COLLECTIONS</span>
                  <span className="text-[10px] font-mono text-[#C2922E] tracking-widest">02</span>
                </NavLink>

                {/* 03. SHOP BY MOMENT */}
                <NavLink
                  to="/shop-by-moment"
                  onClick={() => setMobileOpen(false)}
                  className="font-quiche text-2xl sm:text-3xl font-light tracking-wide text-[#111113] hover:text-[#C2922E] flex items-center justify-between py-1"
                >
                  <span>SHOP BY MOMENT</span>
                  <span className="text-[10px] font-mono text-[#C2922E] tracking-widest">03</span>
                </NavLink>

                {/* 04. PERSONAL STYLING */}
                <NavLink
                  to="/wardrobe-concierge"
                  onClick={() => setMobileOpen(false)}
                  className="font-quiche text-2xl sm:text-3xl font-light tracking-wide text-[#111113] hover:text-[#C2922E] flex items-center justify-between py-1"
                >
                  <span>PERSONAL STYLING</span>
                  <span className="text-[10px] font-mono text-[#C2922E] tracking-widest">04</span>
                </NavLink>

                {/* 05. ABOUT SUKO */}
                <NavLink
                  to="/about"
                  onClick={() => setMobileOpen(false)}
                  className="font-quiche text-2xl sm:text-3xl font-light tracking-wide text-[#111113] hover:text-[#C2922E] flex items-center justify-between py-1"
                >
                  <span>ABOUT SUKO</span>
                  <span className="text-[10px] font-mono text-[#C2922E] tracking-widest">05</span>
                </NavLink>
              </nav>

              {/* Thin Hairline */}
              <div className="h-[1px] my-6 bg-[#E8E4DC]" />

              {/* Secondary Utility Links */}
              <div className="flex flex-col gap-3 text-[11px] uppercase tracking-[0.22em]">
                {user?.authenticated ? (
                  <Link
                    to="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 font-medium text-[#222228] hover:text-black py-1"
                  >
                    <User size={14} className="text-[#C2922E]" />
                    <span>MY ACCOUNT ({user.name || "MEMBER"})</span>
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 font-medium text-[#222228] hover:text-black py-1"
                  >
                    <User size={14} className="text-[#C2922E]" />
                    <span>ACCOUNT / SIGN IN</span>
                  </Link>
                )}

                <Link
                  to="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between font-medium text-[#222228] hover:text-black py-1"
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
                  className="flex items-center justify-between font-medium text-[#222228] hover:text-[#C2922E] py-1"
                >
                  <span>CUSTOMER CARE &amp; CONCIERGE</span>
                  <ChevronRight size={13} className="text-[#C2922E]" />
                </Link>
              </div>
            </div>

            {/* Bottom House Signature */}
            <div className="mt-8 pt-4 text-center border-t border-[#E8E4DC]">
              <span className="text-[9.5px] uppercase tracking-[0.32em] text-[#C2922E] font-medium block mb-1">
                SUKO
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-normal text-[#555560]">
                The Indian Corporate Wear &middot; @SUKOOFFICIAL
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
