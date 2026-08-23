import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { PRODUCTS as DEFAULT_PRODUCTS, CATEGORIES as DEFAULT_CATEGORIES } from '../data/products';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStoreData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/products`),
        fetch(`${API_BASE_URL}/api/categories`)
      ]);

      if (prodRes.ok && catRes.ok) {
        const rawProducts = await prodRes.json();
        const rawCategories = await catRes.json();

        if (Array.isArray(rawProducts) && rawProducts.length > 0) {
          const mappedCategories = rawCategories.map(c => ({
            ...c,
            slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
            tagline: `${c.name} Collection`
          }));

          // Map authentic curated products with live backend attributes if available
          const mappedProducts = DEFAULT_PRODUCTS.map((dp, idx) => {
            const prodNameLower = dp.name.toLowerCase();
            const backendMatch = rawProducts.find(p => 
              p.id === dp.id || 
              p.slug === dp.slug ||
              (p.name && p.name.toLowerCase() === prodNameLower)
            );

            if (backendMatch) {
              return {
                ...dp,
                price: backendMatch.price ? Number(backendMatch.price) : dp.price,
                stock: typeof backendMatch.stock !== 'undefined' ? backendMatch.stock : (dp.stock || 20),
                backendId: backendMatch.id
              };
            }
            return dp;
          });

          setCategories(mappedCategories.length > 0 ? mappedCategories : DEFAULT_CATEGORIES);
          setProducts(mappedProducts.length > 0 ? mappedProducts : DEFAULT_PRODUCTS);
        }
      }
    } catch (err) {
      console.warn('Backend unavailable, using curated luxury catalog:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, []);

  const getProductBySlug = (slug) => {
    const cleanSlug = (s) => (s || "").toLowerCase().replace(/^the-/, "");
    const target = cleanSlug(slug);

    const defaultMatch = DEFAULT_PRODUCTS.find(p => p.slug === slug || cleanSlug(p.slug) === target || p.id === slug);
    const found = products.find(p => p.slug === slug || cleanSlug(p.slug) === target || p.id === slug);
    if (defaultMatch && (!found || !found.images || found.images.length < defaultMatch.images.length)) {
      return { ...(found || {}), ...defaultMatch };
    }
    return found || defaultMatch;
  };

  const getProductsByCategory = (catSlug) => products.filter(p => p.category === catSlug);

  return (
    <ProductContext.Provider value={{ products, categories, loading, error, getProductBySlug, getProductsByCategory, refresh: fetchStoreData }}>
      {children}
    </ProductContext.Provider>
  );
};
