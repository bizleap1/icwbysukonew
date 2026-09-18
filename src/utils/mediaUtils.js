/**
 * Utility functions for responsive image delivery and fallback handling
 * Preserves 100% backward compatibility with existing image paths.
 * Brand assets (logos, favicons, brand marks) are strictly preserved.
 * Cloudinary URLs receive native cloud transformations and NEVER have
 * static suffixes (-800w.webp) incorrectly appended.
 */

const BRAND_FILES = ['logo.png', 'logo-light.png', 'favicon.ico', 'about_suko_brand.png'];

export const isBrandAsset = (url) => {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase();
  return BRAND_FILES.some((b) => lower.includes(b));
};

export const isCloudinaryUrl = (url) => {
  return typeof url === 'string' && url.includes('cloudinary.com');
};

export const isRemoteUrl = (url) => {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:'));
};

/**
 * Generates Cloudinary transformation URL safely
 */
export const getCloudinaryTransformedUrl = (url, transform) => {
  if (!isCloudinaryUrl(url)) return url;
  if (!transform) return url;
  if (url.includes(`/${transform}/`)) return url;
  return url.replace('/upload/', `/upload/${transform}/`);
};

export const getCardImage = (url) => {
  if (!url || typeof url !== 'string') return url || '/placeholder.png';
  if (isBrandAsset(url)) return url;
  if (isCloudinaryUrl(url)) {
    return getCloudinaryTransformedUrl(url, 'c_fill,w_800,q_auto,f_auto');
  }
  if (isRemoteUrl(url)) return url;
  if (/\.(png|jpe?g)$/i.test(url)) {
    return url.replace(/\.(png|jpe?g)$/i, '-800w.webp');
  }
  return url;
};

export const getThumbImage = (url) => {
  if (!url || typeof url !== 'string') return url || '/placeholder.png';
  if (isBrandAsset(url)) return url;
  if (isCloudinaryUrl(url)) {
    return getCloudinaryTransformedUrl(url, 'c_fill,w_300,q_auto,f_auto');
  }
  if (isRemoteUrl(url)) return url;
  if (/\.(png|jpe?g)$/i.test(url)) {
    return url.replace(/\.(png|jpe?g)$/i, '-thumb.webp');
  }
  return url;
};

export const getHighResImage = (url) => {
  if (!url || typeof url !== 'string') return url || '/placeholder.png';
  if (isBrandAsset(url)) return url;
  if (isCloudinaryUrl(url)) {
    return getCloudinaryTransformedUrl(url, 'q_auto:best,f_auto');
  }
  if (isRemoteUrl(url)) return url;
  if (/\.(png|jpe?g)$/i.test(url)) {
    return url.replace(/\.(png|jpe?g)$/i, '.webp');
  }
  return url;
};

export const getImageSrcSet = (url) => {
  if (!url || typeof url !== 'string' || isBrandAsset(url)) return undefined;
  if (isCloudinaryUrl(url)) {
    const card800 = getCloudinaryTransformedUrl(url, 'c_fill,w_800,q_auto,f_auto');
    const full1600 = getCloudinaryTransformedUrl(url, 'c_fill,w_1600,q_auto,f_auto');
    return `${card800} 800w, ${full1600} 1600w`;
  }
  if (isRemoteUrl(url)) return undefined;
  if (/\.(png|jpe?g)$/i.test(url)) {
    const card800 = url.replace(/\.(png|jpe?g)$/i, '-800w.webp');
    const fullWebp = url.replace(/\.(png|jpe?g)$/i, '.webp');
    return `${card800} 800w, ${fullWebp} 1600w`;
  }
  return undefined;
};
