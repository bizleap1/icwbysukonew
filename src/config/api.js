// Central API configuration and hardened API client for ICW BY SUKO Frontend
import { toast } from "sonner";

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // 1. If running on a live deployed domain (e.g. indiancorporatewear.com, Vercel, etc.)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // If a valid remote API URL is explicitly configured, use it
      if (
        process.env.REACT_APP_API_URL &&
        !process.env.REACT_APP_API_URL.includes('localhost') &&
        !process.env.REACT_APP_API_URL.includes('127.0.0.1')
      ) {
        return process.env.REACT_APP_API_URL.replace(/\/$/, '');
      }
      // Production live backend default
      return 'https://icwbysukonew.onrender.com';
    }

    // 2. If running locally in browser (localhost / 127.0.0.1)
    if (process.env.REACT_APP_API_URL && !process.env.REACT_APP_API_URL.includes('onrender.com')) {
      return process.env.REACT_APP_API_URL.replace(/\/$/, '');
    }
    return 'http://localhost:5000';
  }

  // Fallback for SSR or build time
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, '');
  }

  return process.env.NODE_ENV === 'production'
    ? 'https://icwbysukonew.onrender.com'
    : 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

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
