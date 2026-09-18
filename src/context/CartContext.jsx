import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { apiClient } from "../config/api";

const CartContext = createContext(null);
const GUEST_STORAGE_KEY = "suko-guest-cart-v1";
const LEGACY_STORAGE_KEY = "suko-cart-v1";

// Helper to sanitize quantity to a finite positive integer bounded by maxStock
export const sanitizeQuantity = (qty, maxStock = 10) => {
  const parsed = parseInt(qty, 10);
  if (isNaN(parsed) || !Number.isFinite(parsed) || parsed < 1) return 1;
  const limit = Math.max(1, maxStock || 10);
  return Math.min(limit, parsed);
};

// Helper to resolve available stock for a product / variant
export const resolveItemStock = (itemOrProduct) => {
  if (!itemOrProduct) return 10;
  const size = itemOrProduct.size;
  if (itemOrProduct.size_stock && typeof itemOrProduct.size_stock === "object" && size && itemOrProduct.size_stock[size] !== undefined) {
    const s = Number(itemOrProduct.size_stock[size]);
    if (!isNaN(s) && s >= 0) return Math.max(1, s);
  }
  if (itemOrProduct.stock !== undefined) {
    const s = Number(itemOrProduct.stock);
    if (!isNaN(s) && s >= 0) return Math.max(1, s);
  }
  return 10;
};

export const CartProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [items, setItems] = useState(() => {
    try {
      // Purge any corrupted legacy storage keys
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((it) => ({
            ...it,
            qty: sanitizeQuantity(it.qty || it.quantity || 1, it.stock || 10),
          }));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper to persist only guest cart items when unauthenticated
  const saveGuestCart = useCallback((guestItems) => {
    try {
      if (!user?.authenticated) {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestItems));
      }
    } catch (e) {
      console.warn("Guest cart save error:", e);
    }
  }, [user?.authenticated]);

  // Helper to map a backend CartItem record to frontend cart line format
  const mapBackendItem = useCallback((backendItem) => {
    const product = backendItem.product || {};
    const chosenImage = (product.images && product.images[0]) || product.image || product.image_url || "/placeholder.png";
    const maxStock = resolveItemStock({ ...product, size: backendItem.size });
    return {
      key: `${backendItem.product_id}__${backendItem.size || "default"}`,
      cartItemId: backendItem.id,
      id: backendItem.product_id,
      slug: product.slug,
      name: product.name || backendItem.product_name || "Atelier Silhouette",
      price: Number(product.price) || 0,
      image: typeof chosenImage === "string" ? chosenImage : (chosenImage.url || "/placeholder.png"),
      size: backendItem.size,
      qty: sanitizeQuantity(backendItem.quantity, maxStock),
      stock: maxStock,
      size_stock: product.size_stock,
      color: product.color,
      garmentLabel: product.garmentLabel,
    };
  }, []);

  // Fetch cart from backend for authenticated user
  const fetchServerCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get("/api/cart");
      if (Array.isArray(data)) {
        setItems(data.map(mapBackendItem));
      }
    } catch (err) {
      console.error("Fetch server cart error:", err.message);
    } finally {
      setLoading(false);
    }
  }, [mapBackendItem]);

  // Synchronize and merge guest cart when customer logs in
  useEffect(() => {
    // Purge legacy storage key on every mount
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {}

    if (user?.authenticated && token) {
      let guestItems = [];
      try {
        const raw = localStorage.getItem(GUEST_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            guestItems = parsed.map((i) => ({
              product_id: i.id,
              size: i.size,
              quantity: sanitizeQuantity(i.qty || i.quantity || 1, i.stock || 10),
            }));
          }
        }
      } catch (e) {
        console.warn("Error reading guest cart:", e);
      }

      // Crucial: Clear guest storage immediately upon reading so it NEVER re-merges on refresh
      try {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      } catch {}

      if (guestItems.length > 0) {
        const mergeId = `merge_${user.userId || "usr"}_${Date.now()}`;
        apiClient
          .post("/api/cart/merge", {
            merge_id: mergeId,
            items: guestItems,
          })
          .then((res) => {
            if (res && res.cart) {
              setItems(res.cart.map(mapBackendItem));
            }
          })
          .catch((err) => {
            console.error("Cart merge error:", err.message);
            fetchServerCart();
          });
      } else {
        // Normal page load while authenticated: directly fetch server cart, NO merge call!
        fetchServerCart();
      }
    } else {
      // Unauthenticated / Guest state: load guest items
      try {
        const raw = localStorage.getItem(GUEST_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setItems(
              parsed.map((it) => ({
                ...it,
                qty: sanitizeQuantity(it.qty || it.quantity || 1, it.stock || 10),
              }))
            );
            return;
          }
        }
      } catch {}
      setItems([]);
    }
  }, [user?.authenticated, token, fetchServerCart, mapBackendItem]);

  const addItem = async (product, size, qty = 1) => {
    if (!product || !product.id) return;
    const rawImg = (product.images && product.images[0]) || product.image || product.image_url || "/placeholder.png";
    const chosenImage = typeof rawImg === "string" ? rawImg : rawImg.url || "/placeholder.png";
    const key = `${product.id}__${size || "default"}`;
    const itemStock = resolveItemStock({ ...product, size });
    const addQty = sanitizeQuantity(qty, itemStock);

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.key === key);
      let next;
      if (idx >= 0) {
        next = [...prev];
        const currentQty = sanitizeQuantity(next[idx].qty, itemStock);
        const newQty = Math.min(itemStock, currentQty + addQty);
        next[idx] = { ...next[idx], qty: newQty, stock: itemStock };
      } else {
        next = [
          ...prev,
          {
            key,
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: Number(product.price) || 0,
            image: chosenImage,
            size,
            qty: Math.min(itemStock, addQty),
            stock: itemStock,
            color: product.color,
            garmentLabel: product.garmentLabel,
          },
        ];
      }
      if (!user?.authenticated) {
        saveGuestCart(next);
      }
      return next;
    });

    setIsOpen(true);
    toast.success("Added to your shopping bag.");

    // Server sync if authenticated
    if (user?.authenticated && token) {
      try {
        await apiClient.post("/api/cart", {
          product_id: product.id,
          size: size || null,
          quantity: addQty,
        });
      } catch (err) {
        console.warn("Server cart sync offline, using local bag:", err.message);
      }
    }
  };

  const removeItem = async (keyOrCartItemId) => {
    const targetItem = items.find((i) => i.key === keyOrCartItemId || i.cartItemId === keyOrCartItemId);
    setItems((prev) => {
      const next = prev.filter((i) => i.key !== keyOrCartItemId && i.cartItemId !== keyOrCartItemId);
      if (!user?.authenticated) {
        saveGuestCart(next);
      }
      return next;
    });
    toast("Removed from bag.");

    if (user?.authenticated && token && targetItem?.cartItemId) {
      try {
        await apiClient.delete(`/api/cart/${targetItem.cartItemId}`);
      } catch (err) {
        console.warn("Server cart delete offline:", err.message);
      }
    }
  };

  const updateQty = async (keyOrCartItemId, qty) => {
    const parsedQty = parseInt(qty, 10);
    // If quantity is decreased to 0 or negative, remove item
    if (isNaN(parsedQty) || parsedQty < 1) {
      return removeItem(keyOrCartItemId);
    }

    const targetItem = items.find((i) => i.key === keyOrCartItemId || i.cartItemId === keyOrCartItemId);
    const itemStock = targetItem ? resolveItemStock(targetItem) : 10;
    const safeQty = sanitizeQuantity(parsedQty, itemStock);

    setItems((prev) => {
      const next = prev.map((i) =>
        i.key === keyOrCartItemId || i.cartItemId === keyOrCartItemId ? { ...i, qty: safeQty } : i
      );
      if (!user?.authenticated) {
        saveGuestCart(next);
      }
      return next;
    });

    if (user?.authenticated && token && targetItem?.cartItemId) {
      try {
        await apiClient.put(`/api/cart/${targetItem.cartItemId}`, { quantity: safeQty });
      } catch (err) {
        console.warn("Server cart update offline:", err.message);
      }
    }
  };

  const clearCart = async () => {
    const currentItems = [...items];
    setItems([]);
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {}

    if (user?.authenticated && token) {
      for (const item of currentItems) {
        if (item.cartItemId) {
          try {
            await apiClient.delete(`/api/cart/${item.cartItemId}`);
          } catch {}
        }
      }
    }
  };

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = Number(item.price);
      const safePrice = !isNaN(price) && price > 0 ? price : 0;
      const safeQty = sanitizeQuantity(item.qty, item.stock || 10);
      return sum + safePrice * safeQty;
    }, 0);
  }, [items]);

  const count = useMemo(() => {
    return items.reduce((sum, item) => {
      const safeQty = sanitizeQuantity(item.qty, item.stock || 10);
      return sum + safeQty;
    }, 0);
  }, [items]);

  const value = {
    items,
    isOpen,
    loading,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem,
    removeItem,
    updateQty,
    clearCart,
    subtotal,
    count,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
