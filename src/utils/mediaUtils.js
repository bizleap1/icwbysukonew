/**
 * Utility functions for responsive image delivery and fallback handling
 * Preserves 100% backward compatibility with existing image paths.
 * Brand assets (logos, favicons, brand marks) are strictly preserved.
 */

const BRAND_FILES = ['logo.png', 'logo-light.png', 'favicon.ico', 'about_suko_brand.png'];

export const isBrandAsset = (url) => {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase();
  return BRAND_FILES.some((b) => lower.includes(b));
};

export const getCardImage = (url) => {
  if (!url || typeof url !== 'string') return url || '/placeholder.png';
  if (isBrandAsset(url)) return url;
  if (/\.(png|jpe?g)$/i.test(url)) {
    return url.replace(/\.(png|jpe?g)$/i, '-800w.webp');
  }
  return url;
};

export const getThumbImage = (url) => {
  if (!url || typeof url !== 'string') return url || '/placeholder.png';
  if (isBrandAsset(url)) return url;
  if (/\.(png|jpe?g)$/i.test(url)) {
    return url.replace(/\.(png|jpe?g)$/i, '-thumb.webp');
  }
  return url;
};

export const getHighResImage = (url) => {
  if (!url || typeof url !== 'string') return url || '/placeholder.png';
  if (isBrandAsset(url)) return url;
  if (/\.(png|jpe?g)$/i.test(url)) {
    return url.replace(/\.(png|jpe?g)$/i, '.webp');
  }
  return url;
};

export const getImageSrcSet = (url) => {
  if (!url || typeof url !== 'string' || isBrandAsset(url)) return undefined;
  if (/\.(png|jpe?g)$/i.test(url)) {
    const card800 = url.replace(/\.(png|jpe?g)$/i, '-800w.webp');
    const fullWebp = url.replace(/\.(png|jpe?g)$/i, '.webp');
    return `${card800} 800w, ${fullWebp} 1600w`;
  }
  return undefined;
};
