import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { apiClient } from "../config/api";

const WishlistContext = createContext(null);
const STORAGE_KEY = "suko-wishlist-v1";

export const WishlistProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const hasMergedRef = useRef(false);

  const saveToLocal = (newItems) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.warn("Local storage wishlist write failed:", e);
    }
  };

  const fetchServerWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/api/wishlist');
      if (Array.isArray(data) && data.length > 0) {
        setItems(data);
        saveToLocal(data);
      }
    } catch (err) {
      console.warn("Server wishlist fetch offline, using local storage:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Merge guest wishlist on login and sync server state
  useEffect(() => {
    if (user?.authenticated && token) {
      if (!hasMergedRef.current) {
        hasMergedRef.current = true;

        let guestItems = [];
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) guestItems = JSON.parse(raw);
        } catch (e) {}

        if (guestItems.length > 0) {
          const productIds = guestItems.map(i => i.id).filter(Boolean);
          apiClient.post('/api/wishlist/merge', { product_ids: productIds })
            .then((res) => {
              if (res && res.wishlist) {
                setItems(res.wishlist);
                localStorage.removeItem(STORAGE_KEY);
              }
            })
            .catch((err) => {
              console.error("Wishlist merge error:", err.message);
              fetchServerWishlist();
            });
        } else {
          fetchServerWishlist();
        }
      }
    } else {
      // Unauthenticated / Guest state
      hasMergedRef.current = false;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setItems(raw ? JSON.parse(raw) : []);
      } catch {
        setItems([]);
      }
    }
  }, [user?.authenticated, token, fetchServerWishlist]);

  // Persist wishlist changes to localStorage
  useEffect(() => {
    saveToLocal(items);
  }, [items]);

  const toggleWishlist = async (product) => {
    if (!product || !product.id) return;
    const exists = items.some((i) => i.id === product.id);

    // 1. Immediate optimistic local toggle (guaranteed UI update & feedback)
    setItems((prev) => {
      let next;
      if (exists) {
        next = prev.filter((i) => i.id !== product.id);
        toast("Removed from wishlist.");
      } else {
        next = [...prev, product];
        toast.success("Saved to your wishlist.");
      }
      saveToLocal(next);
      return next;
    });

    // 2. Silent background server sync (never throws 'Failed to fetch' error toast)
    if (user?.authenticated && token) {
      try {
        await apiClient.post('/api/wishlist', { product_id: product.id });
      } catch (err) {
        console.warn("Server wishlist sync offline:", err.message);
      }
    }
  };

  const addToWishlist = async (product) => {
    if (!product || !product.id) return;
    if (items.some(i => i.id === product.id)) return;
    await toggleWishlist(product);
  };

  const removeFromWishlist = async (id) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveToLocal(next);
      return next;
    });
    toast("Removed from wishlist.");

    if (user?.authenticated && token) {
      try {
        await apiClient.delete(`/api/wishlist/${id}`);
      } catch (err) {
        console.warn("Server wishlist delete offline:", err.message);
      }
    }
  };

  const isInWishlist = (id) => items.some((i) => i.id === id);

  const value = {
    items,
    loading,
    toggleWishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    count: items.length,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};
