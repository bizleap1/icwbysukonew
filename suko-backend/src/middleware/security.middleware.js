/**
 * =========================================================================
 * SUKO ATELIER — PRODUCTION SECURITY SUITE
 * Enterprise-grade HTTP Security Headers, XSS Sanitization & CORS Hardening
 * =========================================================================
 */

import cors from 'cors';

/**
 * 1. HTTP SECURITY HEADERS (OWASP Best Practices)
 */
export const applySecurityHeaders = (req, res, next) => {
  // Hide server fingerprint
  res.removeHeader('X-Powered-By');

  // Prevent Clickjacking (framing protection)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Prevent MIME Type Sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable Browser Cross-Site Scripting Filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // HTTP Strict Transport Security (HSTS) - 1 Year with subdomains
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Referrer Privacy Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict sensitive browser features & APIs
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)'
  );

  // Content Security Policy (allows necessary CDNs: Unsplash, Google Fonts, Razorpay)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: blob: https: http:; " +
    "connect-src 'self' http://localhost:* http://127.0.0.1:* https://*.indiancorporatewear.com https://indiancorporatewear.com https://*.onrender.com https://*.vercel.app https://res.cloudinary.com https://api.razorpay.com https://checkout.razorpay.com; " +
    "frame-src https://api.razorpay.com https://checkout.razorpay.com;"
  );

  // Cache Control for API data
  if (req.method === 'GET' && req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

/**
 * 2. XSS & PAYLOAD SANITIZER
 * Recursively strips dangerous script tags, eval calls, and malicious handlers from request data
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '')
    .trim();
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => (typeof item === 'string' ? sanitizeString(item) : sanitizeObject(item)));
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      clean[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeObject(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const xssSanitizer = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
};

/**
 * 3. CORS WHITELIST & PROTECTION
 */
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://www.indiancorporatewear.com',
  'https://indiancorporatewear.com',
];

// Also allow Vercel preview/deploy domains and Render backend
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.onrender\.com$/,
];

export const corsSecurityOptions = cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, internal cluster calls)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGIN_PATTERNS.some(re => re.test(origin)) || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      return callback(null, true);
    }

    // In development mode, allow connection
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      return callback(null, true);
    }

    return callback(new Error('Blocked by CORS policy: Origin not allowed.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  maxAge: 86400, // 24 hours pre-flight cache
});

/**
 * 4. PARAMETER POLLUTION GUARD
 */
export const preventParameterPollution = (req, res, next) => {
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (Array.isArray(req.query[key]) && key !== 'sizes' && key !== 'categories') {
        // Take the last parameter if duplicate parameters are passed
        req.query[key] = req.query[key][req.query[key].length - 1];
      }
    }
  }
  next();
};
