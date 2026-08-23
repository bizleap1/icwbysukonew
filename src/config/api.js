// Central API configuration for ICW BY SUKO Frontend

const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, '');
  }
  
  const hostname = window.location.hostname;
  
  // Local development fallback
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // Local network IP fallback (e.g. mobile testing on 192.168.x.x)
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return `http://${hostname}:5000`;
  }
  
  // Default Live Backend
  return 'https://icw-by-suko.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();
