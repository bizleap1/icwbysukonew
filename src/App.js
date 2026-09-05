import React, { useEffect, useRef, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from "react-router-dom";
import { Toaster } from "sonner";
import { ReactLenis, useLenis } from "lenis/react";
import { AnimatePresence } from "framer-motion";
import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { AuthProvider } from "./context/AuthContext";
import { ProductProvider } from "./context/ProductContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import PageWrapper from "./components/PageWrapper";
import Aurora from "./components/Aurora";

// Helper to automatically retry or reload on ChunkLoadError
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem("page_chunk_refreshed") || "false"
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem("page_chunk_refreshed", "false");
      return component;
    } catch (error) {
      if (!pageHasBeenForceRefreshed) {
        window.sessionStorage.setItem("page_chunk_refreshed", "true");
        window.location.reload();
        return { default: () => null };
      }
      throw error;
    }
  });

// Lazy-loaded routes
const Home = lazyWithRetry(() => import("./pages/Home"));
const Women = lazyWithRetry(() => import("./pages/Women"));
const Collection = lazyWithRetry(() => import("./pages/Collection"));
const NewIn = lazyWithRetry(() => import("./pages/NewIn"));
const ShopByMoment = lazyWithRetry(() => import("./pages/ShopByMoment"));
const WardrobeConcierge = lazyWithRetry(() => import("./pages/WardrobeConcierge"));
const ProductDetail = lazyWithRetry(() => import("./pages/ProductDetail"));
const About = lazyWithRetry(() => import("./pages/About"));
const Contact = lazyWithRetry(() => import("./pages/Contact"));
const Shipping = lazyWithRetry(() => import("./pages/Shipping"));
const Returns = lazyWithRetry(() => import("./pages/Returns"));
const SizeGuide = lazyWithRetry(() => import("./pages/SizeGuide"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const Terms = lazyWithRetry(() => import("./pages/Terms"));
const Checkout = lazyWithRetry(() => import("./pages/Checkout"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const Orders = lazyWithRetry(() => import("./pages/Orders"));
const Account = lazyWithRetry(() => import("./pages/Account"));
const Wishlist = lazyWithRetry(() => import("./pages/Wishlist"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center font-body">
    <div className="w-8 h-8 border-2 border-[#111113] border-t-transparent animate-spin rounded-full" />
  </div>
);

// Global In-Memory and Session Scroll Cache
const scrollPositionCache = new Map();

const ScrollToTop = () => {
  const location = useLocation();
  const navType = useNavigationType();
  const lenis = useLenis();
  const prevPathnameRef = useRef(location.pathname);

  // 1. Record current scroll position before leaving with requestAnimationFrame
  useEffect(() => {
    let ticking = false;
    const saveCurrentScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY || (lenis ? lenis.scroll : 0);
          scrollPositionCache.set(location.key, scrollY);
          scrollPositionCache.set(location.pathname + location.search, scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", saveCurrentScroll, { passive: true });
    return () => {
      const scrollY = window.scrollY || (lenis ? lenis.scroll : 0);
      scrollPositionCache.set(location.key, scrollY);
      scrollPositionCache.set(location.pathname + location.search, scrollY);
      window.removeEventListener("scroll", saveCurrentScroll);
    };
  }, [location, lenis]);

  // 2. Handle navigation: restore on POP (Back/Forward), top on PUSH only when pathname changes
  useEffect(() => {
    const isPathnameChanged = prevPathnameRef.current !== location.pathname;
    prevPathnameRef.current = location.pathname;

    // If only search params/filters changed on the same page, do not scroll
    if (!isPathnameChanged && navType !== "POP") {
      return;
    }

    const currentKey = location.key;
    const currentPath = location.pathname + location.search;

    if (navType === "POP") {
      // User clicked Back or Forward button -> restore exact previous position
      const targetY = scrollPositionCache.get(currentKey) ?? scrollPositionCache.get(currentPath) ?? 0;

      const performScroll = () => {
        if (lenis) {
          lenis.scrollTo(targetY, { immediate: true });
        } else {
          window.scrollTo({ top: targetY, behavior: "instant" });
        }
      };

      performScroll();
      const raf = requestAnimationFrame(performScroll);
      const timer = setTimeout(performScroll, 60);

      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    } else {
      // User navigated to a new page route -> scroll to top
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    }
  }, [location.pathname, location.key, navType, lenis]);

  return null;
};

const GlobalBackground = () => {
  const { isDark } = useTheme();
  if (!isDark) return null;

  return (
    <div className="fixed inset-0 z-[0] pointer-events-none overflow-hidden bg-[#0A0A0C]">
      {/* Electric Sapphire Aurora Wave */}
      <div className="absolute inset-0 opacity-85 mix-blend-screen">
        <Aurora
          key="aurora-dark-active"
          colorStops={["#1d4ed8", "#3b82f6", "#0284c7"]}
          amplitude={1.35}
          blend={0.7}
          speed={0.45}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-[#1d4ed8]/35 via-transparent to-[#1d4ed8]/20 mix-blend-screen pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-[650px] bg-gradient-to-b from-[#1d4ed8]/45 via-[#3b82f6]/20 to-transparent mix-blend-screen pointer-events-none" />
    </div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
          <Route path="/shop-by-moment" element={<PageWrapper><ShopByMoment /></PageWrapper>} />
          <Route path="/moment/:momentSlug" element={<PageWrapper><ShopByMoment /></PageWrapper>} />
          <Route path="/wardrobe-concierge" element={<PageWrapper><WardrobeConcierge /></PageWrapper>} />
          <Route path="/concierge" element={<PageWrapper><WardrobeConcierge /></PageWrapper>} />
          <Route path="/personal-styling" element={<PageWrapper><WardrobeConcierge /></PageWrapper>} />
          <Route path="/women" element={<PageWrapper><Women /></PageWrapper>} />
          <Route path="/shop" element={<PageWrapper><NewIn /></PageWrapper>} />
          <Route path="/collection" element={<PageWrapper><Collection /></PageWrapper>} />
          <Route path="/collections" element={<PageWrapper><Collection /></PageWrapper>} />
          <Route path="/new-in" element={<PageWrapper><NewIn /></PageWrapper>} />
          <Route path="/collection/:category" element={<PageWrapper><NewIn /></PageWrapper>} />
          <Route path="/product/:slug" element={<PageWrapper><ProductDetail /></PageWrapper>} />
          <Route path="/wishlist" element={<PageWrapper><Wishlist /></PageWrapper>} />
          <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
          <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
          <Route path="/shipping" element={<PageWrapper><Shipping /></PageWrapper>} />
          <Route path="/returns" element={<PageWrapper><Returns /></PageWrapper>} />
          <Route path="/returns-exchanges" element={<PageWrapper><Returns /></PageWrapper>} />
          <Route path="/size-guide" element={<PageWrapper><SizeGuide /></PageWrapper>} />
          <Route path="/privacy" element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
          <Route path="/privacy-policy" element={<PageWrapper><PrivacyPolicy /></PageWrapper>} />
          <Route path="/terms" element={<PageWrapper><Terms /></PageWrapper>} />
          <Route path="/terms-conditions" element={<PageWrapper><Terms /></PageWrapper>} />
          <Route path="/checkout" element={<PageWrapper><Checkout /></PageWrapper>} />
          <Route path="/auth" element={<PageWrapper><Auth /></PageWrapper>} />
          <Route path="/admin" element={<PageWrapper><Admin /></PageWrapper>} />
          <Route path="/admin/dashboard" element={<PageWrapper><Admin /></PageWrapper>} />
          <Route path="/orders" element={<PageWrapper><Orders /></PageWrapper>} />
          <Route path="/account" element={<PageWrapper><Account /></PageWrapper>} />
          <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

function LayoutContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  const isCheckoutPage = location.pathname === "/checkout";

  return (
    <>
      <GlobalBackground />
      <ScrollToTop />
      {!isAdminPage && !isCheckoutPage && <Navbar />}
      {!isCheckoutPage && <CartDrawer />}
      <Toaster
        position="top-center"
        duration={1800}
        visibleToasts={1}
        theme="light"
        toastOptions={{
          style: {
            background: "#FAF8F5",
            color: "#111113",
            border: "1px solid #EAE6DF",
            borderRadius: "2px",
            fontFamily: "Inter, sans-serif",
            fontSize: "12.5px",
            letterSpacing: "0.02em",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            padding: "12px 20px",
          },
        }}
      />
      <main>
        <AnimatedRoutes />
      </main>
      {!isAdminPage && !isCheckoutPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <ReactLenis root options={{ lerp: 0.08, smoothWheel: true }}>
      <div className="App relative min-h-screen bg-[#FAF8F5]">
        <ThemeProvider>
          <AuthProvider>
            <ProductProvider>
              <WishlistProvider>
                <CartProvider>
                  <BrowserRouter>
                    <LayoutContent />
                  </BrowserRouter>
                </CartProvider>
              </WishlistProvider>
            </ProductProvider>
          </AuthProvider>
        </ThemeProvider>
      </div>
    </ReactLenis>
  );
}

export default App;
