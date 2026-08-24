import React, { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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

// Lazy-loaded routes
const Home = lazy(() => import("./pages/Home"));
const Women = lazy(() => import("./pages/Women"));
const Collection = lazy(() => import("./pages/Collection"));
const NewIn = lazy(() => import("./pages/NewIn"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Returns = lazy(() => import("./pages/Returns"));
const SizeGuide = lazy(() => import("./pages/SizeGuide"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const Orders = lazy(() => import("./pages/Orders"));
const Account = lazy(() => import("./pages/Account"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-[#111113] border-t-transparent animate-spin rounded-full" />
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const lenis = useLenis();
  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [pathname, lenis]);
  return null;
};

const GlobalBackground = () => {
  const { isDark } = useTheme();
  if (!isDark) return null;

  return (
    <div className="fixed inset-0 z-[0] pointer-events-none overflow-hidden bg-[#0A0A0C]">
      {/* Full-Height Electric Sapphire Aurora Wave */}
      <div className="absolute inset-0 opacity-85 mix-blend-screen">
        <Aurora
          key="aurora-dark-active"
          colorStops={["#1d4ed8", "#3b82f6", "#0284c7"]}
          amplitude={1.35}
          blend={0.7}
          speed={0.45}
        />
      </div>

      {/* Top Navbar Matching Sapphire Gradient Overlays */}
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
          <Route path="/women" element={<PageWrapper><Women /></PageWrapper>} />
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

  return (
    <>
      <GlobalBackground />
      <ScrollToTop />
      {!isAdminPage && <Navbar />}
      <CartDrawer />
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#15151a",
            color: "#F6F6F0",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 0,
            fontFamily: "Outfit, sans-serif",
          },
        }}
      />
      <main>
        <AnimatedRoutes />
      </main>
      {!isAdminPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <ReactLenis root options={{ lerp: 0.08, smoothWheel: true }}>
      <div className="App relative min-h-screen">
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
