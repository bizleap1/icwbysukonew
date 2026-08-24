import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { apiClient } from "../config/api";

const WishlistContext = createContext(null);
const STORAGE_KEY = "suko-wishlist-v1";

export const WishlistProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const hasMergedRef = useRef(false);

  const fetchServerWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/api/wishlist');
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (err) {
      console.error("Fetch server wishlist error:", err.message);
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

  // Persist guest wishlist to localStorage when unauthenticated
  useEffect(() => {
    if (!user?.authenticated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, user?.authenticated]);

  const toggleWishlist = async (product) => {
    const exists = items.some((i) => i.id === product.id);

    if (user?.authenticated && token) {
      try {
        const res = await apiClient.post('/api/wishlist', { product_id: product.id });
        if (res.inWishlist) {
          setItems(prev => [...prev, product]);
          toast.success("Saved to your wishlist.");
        } else {
          setItems(prev => prev.filter(i => i.id !== product.id));
          toast("Removed from wishlist.");
        }
      } catch (err) {
        toast.error(err.message || "Failed to update wishlist.");
      }
    } else {
      // Guest Toggle
      setItems((prev) => {
        if (exists) {
          toast("Removed from wishlist.");
          return prev.filter((i) => i.id !== product.id);
        } else {
          toast.success("Saved to your wishlist.");
          return [...prev, product];
        }
      });
    }
  };

  const addToWishlist = async (product) => {
    if (items.some(i => i.id === product.id)) return;
    await toggleWishlist(product);
  };

  const removeFromWishlist = async (id) => {
    if (user?.authenticated && token) {
      try {
        await apiClient.delete(`/api/wishlist/${id}`);
        setItems((prev) => prev.filter((i) => i.id !== id));
        toast("Removed from wishlist.");
      } catch (err) {
        toast.error(err.message || "Failed to remove item.");
      }
    } else {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast("Removed from wishlist.");
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
