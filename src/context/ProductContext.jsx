import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { PRODUCTS as DEFAULT_PRODUCTS, CATEGORIES as DEFAULT_CATEGORIES } from '../data/products';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStoreData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/products`),
        fetch(`${API_BASE_URL}/api/categories`)
      ]);

      if (prodRes.ok) {
        const rawProducts = await prodRes.json();
        const rawCategories = catRes.ok ? await catRes.json() : [];

        if (Array.isArray(rawProducts) && rawProducts.length > 0) {
          // Map categories
          const mappedCategories = rawCategories.map(c => ({
            ...c,
            slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
            tagline: `${c.name} Collection`
          }));

          // Merge live backend products with curated defaults
          const mappedProducts = rawProducts.map(bp => {
            const prodNameLower = (bp.name || '').toLowerCase();
            const defaultMatch = DEFAULT_PRODUCTS.find(dp => 
              dp.id === bp.id || 
              (dp.slug && dp.slug === bp.slug) ||
              (dp.name && dp.name.toLowerCase() === prodNameLower)
            );

            const imagesList = Array.isArray(bp.images) && bp.images.length > 0 
              ? bp.images 
              : (bp.image_url ? [bp.image_url] : (defaultMatch?.images || ['/placeholder.png']));

            return {
              ...(defaultMatch || {}),
              id: bp.id,
              backendId: bp.id,
              name: bp.name,
              slug: bp.slug || bp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
              price: Number(bp.price) || 0,
              description: bp.description || defaultMatch?.description || '',
              category: bp.category?.name?.toLowerCase() || bp.sub_category || defaultMatch?.category || 'all',
              images: imagesList,
              image_url: bp.image_url || imagesList[0] || '/placeholder.png',
              stock: typeof bp.stock !== 'undefined' ? bp.stock : (defaultMatch?.stock || 0),
              sizes: Array.isArray(bp.sizes) && bp.sizes.length > 0 ? bp.sizes : (defaultMatch?.sizes || ['XS', 'S', 'M', 'L', 'XL']),
              size_stock: bp.size_stock || defaultMatch?.size_stock || {}
            };
          });

          setCategories(mappedCategories.length > 0 ? mappedCategories : DEFAULT_CATEGORIES);
          setProducts(mappedProducts);
        }
      }
    } catch (err) {
      console.warn('Backend unavailable, using local luxury catalog:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  const getProductBySlug = useCallback((slug) => {
    if (!slug) return null;
    const cleanSlug = (s) => String(s || "").toLowerCase().replace(/^the-/, "");
    const target = cleanSlug(slug);

    const defaultMatch = DEFAULT_PRODUCTS.find(p => p.slug === slug || cleanSlug(p.slug) === target || String(p.id) === String(slug));
    const found = products.find(p => p.slug === slug || cleanSlug(p.slug) === target || String(p.id) === String(slug));
    
    if (defaultMatch && (!found || !found.images || found.images.length < defaultMatch.images.length)) {
      return { ...(found || {}), ...defaultMatch };
    }
    return found || defaultMatch;
  }, [products]);

  const getProductsByCategory = useCallback((catSlug) => {
    if (!catSlug || catSlug === 'all') return products;
    const clean = catSlug.toLowerCase();
    return products.filter(p => (p.category || '').toLowerCase() === clean);
  }, [products]);

  return (
    <ProductContext.Provider value={{
      products,
      categories,
      loading,
      error,
      getProductBySlug,
      getProductsByCategory,
      refresh: fetchStoreData,
      refreshProducts: fetchStoreData
    }}>
      {children}
    </ProductContext.Provider>
  );
};
