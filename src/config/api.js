// Central API configuration and hardened API client for ICW BY SUKO Frontend
import { toast } from "sonner";

export const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, '');
  }
  
  const isProd = process.env.NODE_ENV === 'production';

  // Strict Development Fallbacks (Disabled in Production)
  if (!isProd) {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return `http://${hostname}:5000`;
    }
    return 'http://localhost:5000';
  }

  // In Production: Fail clearly if REACT_APP_API_URL is missing rather than silently falling back
  throw new Error("CRITICAL CONFIGURATION ERROR: REACT_APP_API_URL environment variable is required in production builds.");
};

// Safe initialization
let apiBaseUrl = '';
try {
  apiBaseUrl = getApiBaseUrl();
} catch (err) {
  if (process.env.NODE_ENV === 'production') {
    console.error(err.message);
  }
  apiBaseUrl = '';
}

export const API_BASE_URL = apiBaseUrl;

// Global 401 Session Invalidation Handler
let unauthorizedCallback = null;
let last401ToastTime = 0;

export const setUnauthorizedHandler = (callback) => {
  unauthorizedCallback = callback;
};

/**
 * Centralized API request dispatcher
 */
async function request(endpoint, options = {}) {
  const base = API_BASE_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:5000' : '');
  if (!base && !endpoint.startsWith('http')) {
    throw new Error("API Base URL is not configured. Please set REACT_APP_API_URL.");
  }

  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` }),
    ...options.headers,
  };

  // If body is FormData, do not set Content-Type header
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const config = {
    ...options,
    headers,
  };

  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, config);
    
    // Check for 401 on protected routes (where Authorization header was supplied)
    if (res.status === 401 && headers["Authorization"] && !endpoint.includes('/api/auth/login')) {
      const now = Date.now();
      if (now - last401ToastTime > 5000) {
        last401ToastTime = now;
        toast.error("Your session has expired. Please sign in again.");
      }
      if (typeof unauthorizedCallback === 'function') {
        unauthorizedCallback();
      }
    }

    let data;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const errorMessage = (data && data.error) || (data && data.message) || `Request failed with status ${res.status}`;
      const error = new Error(errorMessage);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const apiClient = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};
