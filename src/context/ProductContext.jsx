import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
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
        const productsList = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.products || []);
        const rawCategories = catRes.ok ? await catRes.json() : [];

        // Map categories from database
        const mappedCategories = rawCategories.map(c => ({
          id: c.id || c.slug,
          name: c.name,
          slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
          tagline: c.tagline || `${c.name} Collection`
        }));

        // Map database products cleanly
        const mappedProducts = productsList.map(bp => {
          const imagesList = Array.isArray(bp.images) && bp.images.length > 0 
            ? bp.images 
            : (bp.image_url ? [bp.image_url] : ['/placeholder.png']);

          const catId = bp.category_id || bp.category?.slug || bp.category?.id || (bp.category && typeof bp.category === 'string' ? bp.category : 'suits');
          const catName = bp.category?.name || bp.categoryName || (catId.charAt(0).toUpperCase() + catId.slice(1));

          return {
            id: String(bp.id),
            backendId: bp.id,
            name: bp.name,
            slug: bp.slug || bp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
            price: Number(bp.price) || 0,
            discount_price: bp.discount_price ? Number(bp.discount_price) : null,
            description: bp.description || '',
            category: catId,
            categoryName: catName,
            category_id: catId,
            sub_category: bp.sub_category || bp.shortType || bp.setType || 'Atelier Silhouette',
            images: imagesList,
            image_url: bp.image_url || imagesList[0] || '/placeholder.png',
            stock: typeof bp.stock !== 'undefined' ? Number(bp.stock) : 10,
            sizes: Array.isArray(bp.sizes) && bp.sizes.length > 0 ? bp.sizes : ['XS', 'S', 'M', 'L', 'XL'],
            size_stock: bp.size_stock || {},
            status: bp.status || 'active',
            sku: bp.sku || `SUKO-${String(bp.id).toUpperCase()}`,
            gender: bp.gender || 'female',
            fabric: bp.fabric || '',
            created_at: bp.created_at,
            updated_at: bp.updated_at
          };
        });

        setCategories(mappedCategories);
        setProducts(mappedProducts);
        setError(null);
      } else {
        throw new Error(`Failed to load products: ${prodRes.status}`);
      }
    } catch (err) {
      console.warn('[ProductContext] Error fetching products from backend:', err.message);
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

    return products.find(p => p.slug === slug || cleanSlug(p.slug) === target || String(p.id) === String(slug)) || null;
  }, [products]);

  const getProductsByCategory = useCallback((catSlug) => {
    if (!catSlug || catSlug === 'all') return products;
    const clean = catSlug.toLowerCase();
    return products.filter(p => (p.category || '').toLowerCase() === clean || (p.category_id || '').toLowerCase() === clean);
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
