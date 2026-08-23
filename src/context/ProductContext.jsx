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

          const mappedProducts = rawProducts.map(p => {
            const cat = mappedCategories.find(c => c.id === p.category_id);
            const catName = cat ? cat.name : (p.category?.name || 'uncategorized');
            const catLower = catName.toLowerCase();
            const prodNameLower = (p.name || '').toLowerCase();
            const descLower = (p.description || '').toLowerCase();

            let derivedGender = 'female';
            if (catLower.includes('women') || prodNameLower.includes('women') || prodNameLower.includes('female') || descLower.includes('women')) {
              derivedGender = 'female';
            } else if (catLower.includes("men's") || catLower.includes("mens") || prodNameLower.includes("men") || prodNameLower.includes("male") || /\bmen\b/.test(catLower)) {
              derivedGender = 'male';
            }
            
            // Match with curated default product dataset to retain full 5-image photoshoot
            const defaultMatch = DEFAULT_PRODUCTS.find(dp => 
              dp.id === p.id || 
              dp.name.toLowerCase() === prodNameLower || 
              dp.slug === p.slug ||
              dp.slug === `${prodNameLower.replace(/[^a-z0-9]+/g, '-')}`
            );

            const galleryImages = (defaultMatch && Array.isArray(defaultMatch.images) && defaultMatch.images.length > 0)
              ? defaultMatch.images
              : (Array.isArray(p.images) && p.images.length > 0)
                ? p.images
                : p.image_url ? [p.image_url] : ['/placeholder.png'];

            return {
              ...p,
              slug: defaultMatch ? defaultMatch.slug : `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${p.id}`,
              images: galleryImages,
              category: defaultMatch ? defaultMatch.category : cat ? cat.slug : 'uncategorized',
              categoryName: catName,
              fabric: defaultMatch?.fabric || catName,
              gender: defaultMatch?.gender || derivedGender,
              badge: p.stock < 5 && p.stock > 0 ? 'Low Stock' : p.stock === 0 ? 'Sold Out' : defaultMatch?.badge || null,
              sizes: defaultMatch?.sizes || (p.sizes && p.sizes.length > 0 ? p.sizes : ['XS', 'S', 'M', 'L', 'XL'])
            };
          });

          // If backend has products, merge or set
          setCategories(mappedCategories.length > 0 ? mappedCategories : DEFAULT_CATEGORIES);
          setProducts(mappedProducts.length > 0 ? mappedProducts : DEFAULT_PRODUCTS);
        }
      }
    } catch (err) {
      // Gracefully maintain curated default catalog
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
