import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { PRODUCTS as FALLBACK_PRODUCTS, CATEGORIES as FALLBACK_CATEGORIES } from '../data/products';

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

        // Map categories from database or fallback
        const mappedCategories = rawCategories.length > 0
          ? rawCategories.map(c => ({
              id: c.id || c.slug,
              name: c.name,
              slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
              tagline: c.tagline || `${c.name} Collection`
            }))
          : FALLBACK_CATEGORIES;

        const cleanSlug = (s) => String(s || "").toLowerCase().replace(/^the-/, "");

        // Map database products cleanly
        const mappedProducts = productsList.map(bp => {
          const imagesList = Array.isArray(bp.images) && bp.images.length > 0 
            ? bp.images 
            : (bp.image_url ? [bp.image_url] : ['/placeholder.png']);

          const catId = bp.category_id || bp.category?.slug || bp.category?.id || (bp.category && typeof bp.category === 'string' ? bp.category : 'suits');
          const catName = bp.category?.name || bp.categoryName || (catId.charAt(0).toUpperCase() + catId.slice(1));

          const rawSizes = Array.isArray(bp.sizes) && bp.sizes.length > 0 ? bp.sizes : ['XS', 'S', 'M', 'L', 'XL'];
          let parsedSizeStock = bp.size_stock;
          if (typeof parsedSizeStock === 'string') {
            try { parsedSizeStock = JSON.parse(parsedSizeStock); } catch (e) { parsedSizeStock = {}; }
          }
          if (!parsedSizeStock || typeof parsedSizeStock !== 'object' || Object.keys(parsedSizeStock).length === 0) {
            const tot = typeof bp.stock !== 'undefined' ? Number(bp.stock) : 15;
            const baseQty = Math.max(1, Math.floor(tot / rawSizes.length));
            let remainder = tot - (baseQty * rawSizes.length);
            parsedSizeStock = {};
            rawSizes.forEach(sz => {
              parsedSizeStock[sz] = baseQty + (remainder > 0 ? 1 : 0);
              if (remainder > 0) remainder--;
            });
          }

          // Parse and ensure moment metadata with local fallback
          let rawMoments = bp.moments;
          if (typeof rawMoments === 'string') {
            try { rawMoments = JSON.parse(rawMoments); } catch (e) { rawMoments = null; }
          }
          if (!Array.isArray(rawMoments) || rawMoments.length === 0) {
            rawMoments = bp.moment ? [bp.moment] : [];
          }

          const matchedFallback = FALLBACK_PRODUCTS.find(fp => 
            fp.slug === bp.slug || 
            cleanSlug(fp.slug) === cleanSlug(bp.slug) ||
            String(fp.id) === String(bp.id)
          );

          const finalMoment = bp.moment || (rawMoments && rawMoments[0]) || matchedFallback?.moment || 'boardroom';
          const finalMoments = (rawMoments && rawMoments.length > 0)
            ? rawMoments
            : (matchedFallback?.moments || (matchedFallback?.moment ? [matchedFallback.moment] : [finalMoment]));
          const finalMomentName = bp.moment_name || bp.momentName || matchedFallback?.momentName || 'The Boardroom Edit';

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
            sizes: rawSizes,
            size_stock: parsedSizeStock,
            status: bp.status || 'active',
            sku: bp.sku || `SUKO-${String(bp.id).toUpperCase()}`,
            gender: bp.gender || 'female',
            fabric: bp.fabric || matchedFallback?.fabric || '',
            color: bp.color || matchedFallback?.color || '',
            fit: bp.fit || matchedFallback?.fit || '',
            silhouette: bp.silhouette || matchedFallback?.silhouette || '',
            moment: finalMoment,
            moments: finalMoments,
            momentName: finalMomentName,
            moment_name: finalMomentName,
            created_at: bp.created_at,
            updated_at: bp.updated_at
          };
        });

        // Merge any unseeded items from FALLBACK_PRODUCTS
        const existingSlugs = new Set(mappedProducts.map(p => cleanSlug(p.slug)));
        const existingIds = new Set(mappedProducts.map(p => String(p.id)));
        const mergedProducts = [...mappedProducts];

        FALLBACK_PRODUCTS.forEach(fp => {
          if (!existingSlugs.has(cleanSlug(fp.slug)) && !existingIds.has(String(fp.id))) {
            const rawSizes = Array.isArray(fp.sizes) && fp.sizes.length > 0 ? fp.sizes : ['XS', 'S', 'M', 'L', 'XL'];
            let parsedSizeStock = fp.size_stock || {};
            if (Object.keys(parsedSizeStock).length === 0) {
              const tot = typeof fp.stock !== 'undefined' ? Number(fp.stock) : 15;
              const baseQty = Math.max(1, Math.floor(tot / rawSizes.length));
              let remainder = tot - (baseQty * rawSizes.length);
              parsedSizeStock = {};
              rawSizes.forEach(sz => {
                parsedSizeStock[sz] = baseQty + (remainder > 0 ? 1 : 0);
                if (remainder > 0) remainder--;
              });
            }
            const catId = fp.category || 'suits';
            const catName = fp.categoryName || (catId.charAt(0).toUpperCase() + catId.slice(1));

            mergedProducts.push({
              id: String(fp.id),
              backendId: fp.id,
              name: fp.name,
              slug: fp.slug,
              price: Number(fp.price) || 0,
              discount_price: fp.discount_price ? Number(fp.discount_price) : null,
              description: fp.description || '',
              category: catId,
              categoryName: catName,
              category_id: catId,
              sub_category: fp.sub_category || fp.shortType || fp.setType || 'Atelier Silhouette',
              images: fp.images || (fp.image ? [fp.image] : ['/placeholder.png']),
              image_url: fp.images?.[0] || fp.image || '/placeholder.png',
              stock: typeof fp.stock !== 'undefined' ? Number(fp.stock) : 15,
              sizes: rawSizes,
              size_stock: parsedSizeStock,
              status: fp.status || 'active',
              sku: fp.sku || `SUKO-${String(fp.id).toUpperCase()}`,
              gender: fp.gender || 'female',
              fabric: fp.fabric || '',
              color: fp.color || '',
              fit: fp.fit || '',
              silhouette: fp.silhouette || '',
              moment: fp.moment || 'boardroom',
              moments: Array.isArray(fp.moments) ? fp.moments : [fp.moment || 'boardroom'],
              momentName: fp.momentName || 'The Boardroom Edit',
              moment_name: fp.momentName || 'The Boardroom Edit',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        });

        setCategories(mappedCategories);
        setProducts(mergedProducts);
        setError(null);
      } else {
        throw new Error(`Failed to load products: ${prodRes.status}`);
      }
    } catch (err) {
      console.warn('[ProductContext] Error fetching products from backend, using catalog fallback:', err.message);
      setProducts(FALLBACK_PRODUCTS.map(fp => ({
        ...fp,
        id: String(fp.id),
        categoryName: fp.categoryName || (fp.category ? fp.category.charAt(0).toUpperCase() + fp.category.slice(1) : 'Collection'),
        moment: fp.moment || 'boardroom',
        moments: Array.isArray(fp.moments) ? fp.moments : [fp.moment || 'boardroom'],
        momentName: fp.momentName || 'The Boardroom Edit',
        moment_name: fp.momentName || 'The Boardroom Edit'
      })));
      setCategories(FALLBACK_CATEGORIES);
      setError(null);
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
