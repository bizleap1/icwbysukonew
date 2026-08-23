import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

const WishlistContext = createContext(null);

const STORAGE_KEY = "suko-wishlist-v1";

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToWishlist = (product) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === product.id)) return prev;
      toast("Added to Wishlist");
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || product.image || product.image_url,
          fabric: product.fabric,
          badge: product.badge,
          sizes: product.sizes,
          category: product.category,
          categoryName: product.categoryName,
          images: product.images
        },
      ];
    });
  };

  const removeFromWishlist = (id) => {
    setItems((prev) => {
      toast("Removed from Wishlist");
      return prev.filter((i) => i.id !== id);
    });
  };

  const toggleWishlist = (product) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === product.id);
      if (exists) {
        toast("Removed from Wishlist");
        return prev.filter((i) => i.id !== product.id);
      } else {
        toast("Added to Wishlist");
        return [
          ...prev,
          {
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image: product.images?.[0] || product.image || product.image_url,
            fabric: product.fabric,
            badge: product.badge,
            sizes: product.sizes,
            category: product.category,
            categoryName: product.categoryName,
            images: product.images
          },
        ];
      }
    });
  };

  const isInWishlist = (id) => items.some((i) => i.id === id);

  const value = {
    items,
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
