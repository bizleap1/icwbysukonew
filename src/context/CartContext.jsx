import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { apiClient } from "../config/api";

const CartContext = createContext(null);
const STORAGE_KEY = "suko-cart-v1";

export const CartProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasMergedRef = useRef(false);

  // Helper to map a backend CartItem record to frontend cart line format
  const mapBackendItem = useCallback((backendItem) => {
    const product = backendItem.product || {};
    const chosenImage = (product.images && product.images[0]) || product.image || product.image_url || "/placeholder.png";
    return {
      key: `${backendItem.product_id}__${backendItem.size || 'default'}`,
      cartItemId: backendItem.id,
      id: backendItem.product_id,
      slug: product.slug,
      name: product.name,
      price: Number(product.price) || 0,
      image: chosenImage,
      size: backendItem.size,
      qty: backendItem.quantity,
      stock: product.stock
    };
  }, []);

  // Fetch cart from backend for authenticated user
  const fetchServerCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/api/cart');
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
    if (user?.authenticated && token) {
      if (!hasMergedRef.current) {
        hasMergedRef.current = true;
        
        let guestItems = [];
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) guestItems = JSON.parse(raw);
        } catch (e) {}

        if (guestItems.length > 0) {
          // Generate a unique merge session identifier for idempotency
          const mergeId = `merge_${user.userId || 'usr'}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

          // Perform Idempotent Bulk Merge
          apiClient.post('/api/cart/merge', {
            merge_id: mergeId,
            items: guestItems.map(i => ({
              product_id: i.id,
              size: i.size,
              quantity: i.qty || i.quantity || 1
            }))
          })
            .then((res) => {
              if (res && res.cart) {
                setItems(res.cart.map(mapBackendItem));
                localStorage.removeItem(STORAGE_KEY); // Cleared ONLY after successful merge
                
                // Restrained, polite notifications for merge adjustments
                if (res.warnings && res.warnings.length > 0) {
                  const hasUnavailable = res.warnings.some(w => w.reason?.includes('no longer available') || w.reason?.includes('out of stock'));
                  const hasAdjusted = res.warnings.some(w => w.reason?.includes('adjusted'));
                  
                  if (hasUnavailable && hasAdjusted) {
                    toast.info("Your bag was updated with current atelier inventory and availability.");
                  } else if (hasUnavailable) {
                    toast.info("Some items from your previous session were out of stock and removed.");
                  } else if (hasAdjusted) {
                    toast.info("Some quantities in your bag were adjusted to match available stock.");
                  }
                }
              }
            })
            .catch((err) => {
              console.error("Cart merge error:", err.message);
              // Do NOT clear localStorage on network failure; load server cart
              fetchServerCart();
            });
        } else {
          fetchServerCart();
        }
      }
    } else {
      // Unauthenticated / Guest state: reset merge lock and load local storage
      hasMergedRef.current = false;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setItems(raw ? JSON.parse(raw) : []);
      } catch {
        setItems([]);
      }
    }
  }, [user?.authenticated, token, fetchServerCart, mapBackendItem]);

  // Persist guest cart to localStorage when unauthenticated
  useEffect(() => {
    if (!user?.authenticated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, user?.authenticated]);

  const addItem = async (product, size, qty = 1) => {
    const chosenImage = (product.images && product.images[0]) || product.image || product.image_url || "/placeholder.png";

    if (user?.authenticated && token) {
      try {
        await apiClient.post('/api/cart', {
          product_id: product.id,
          size: size || null,
          quantity: qty
        });
        await fetchServerCart();
        setIsOpen(true);
        toast.success("Added to your shopping bag.");
      } catch (err) {
        toast.error(err.message || "Could not add item to bag.");
      }
    } else {
      // Guest Cart Operation
      setItems((prev) => {
        const key = `${product.id}__${size || 'default'}`;
        const idx = prev.findIndex((i) => i.key === key);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], qty: next[idx].qty + qty };
          return next;
        }
        return [
          ...prev,
          {
            key,
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: Number(product.price) || 0,
            image: chosenImage,
            size,
            qty,
            stock: product.stock
          },
        ];
      });
      setIsOpen(true);
      toast.success("Added to your shopping bag.");
    }
  };

  const removeItem = async (keyOrCartItemId) => {
    const targetItem = items.find(i => i.key === keyOrCartItemId || i.cartItemId === keyOrCartItemId);
    
    if (user?.authenticated && token && targetItem?.cartItemId) {
      try {
        await apiClient.delete(`/api/cart/${targetItem.cartItemId}`);
        setItems((prev) => prev.filter((i) => i.cartItemId !== targetItem.cartItemId));
      } catch (err) {
        toast.error(err.message || "Failed to remove item.");
      }
    } else {
      setItems((prev) => prev.filter((i) => i.key !== keyOrCartItemId && i.cartItemId !== keyOrCartItemId));
    }
  };

  const updateQty = async (keyOrCartItemId, qty) => {
    const safeQty = Math.max(1, qty);
    const targetItem = items.find(i => i.key === keyOrCartItemId || i.cartItemId === keyOrCartItemId);

    if (user?.authenticated && token && targetItem?.cartItemId) {
      try {
        await apiClient.put(`/api/cart/${targetItem.cartItemId}`, { quantity: safeQty });
        setItems((prev) => prev.map((i) => i.cartItemId === targetItem.cartItemId ? { ...i, qty: safeQty } : i));
      } catch (err) {
        toast.error(err.message || "Failed to update quantity.");
      }
    } else {
      setItems((prev) => prev.map((i) => (i.key === keyOrCartItemId || i.cartItemId === keyOrCartItemId) ? { ...i, qty: safeQty } : i));
    }
  };

  const clearCart = async () => {
    if (user?.authenticated && token) {
      for (const item of items) {
        if (item.cartItemId) {
          try {
            await apiClient.delete(`/api/cart/${item.cartItemId}`);
          } catch (e) {}
        }
      }
    }
    setItems([]);
    if (!user?.authenticated) {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const subtotal = useMemo(() => items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + (Number(i.qty) || 1), 0), [items]);

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
