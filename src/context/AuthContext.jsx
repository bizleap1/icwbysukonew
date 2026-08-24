import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { apiClient, setUnauthorizedHandler } from "../config/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return null;
    try {
      const payload = JSON.parse(atob(savedToken.split('.')[1]));
      return {
        authenticated: true,
        userId: payload.userId,
        role: payload.role || 'customer',
        name: payload.name || '',
        phone: payload.phone || '',
        email: payload.email || ''
      };
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    toast.success("Logged out successfully.");
  }, []);

  // Register global 401 session expiry handler
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
    });
  }, []);

  // Sync token state and verify profile against backend
  useEffect(() => {
    let isMounted = true;
    if (token) {
      localStorage.setItem("token", token);
      
      // Decode JWT for immediate optimistic UI
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (isMounted) {
          setUser({
            authenticated: true,
            userId: payload.userId,
            role: payload.role || 'customer',
            name: payload.name || '',
            phone: payload.phone || '',
            email: payload.email || ''
          });
        }
      } catch (e) {
        if (isMounted) setUser({ authenticated: true, role: 'customer' });
      }

      // Fetch fresh profile from backend
      apiClient.get('/api/auth/profile')
        .then((profile) => {
          if (isMounted && profile) {
            setUser({
              authenticated: true,
              userId: profile.id,
              role: profile.role || 'customer',
              name: profile.name || '',
              phone: profile.phone || '',
              email: profile.email || ''
            });
          }
        })
        .catch((err) => {
          console.warn("Profile fetch warning:", err.message);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      localStorage.removeItem("token");
      if (isMounted) {
        setUser(null);
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (email, password) => {
    try {
      const data = await apiClient.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password
      });
      
      setToken(data.token);
      toast.success("Successfully signed in.");
      return true;
    } catch (err) {
      toast.error(err.message || "Invalid email or password.");
      return false;
    }
  };

  const register = async (name, phone, email, password) => {
    try {
      const data = await apiClient.post('/api/auth/register', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password
      });

      if (data.token) {
        setToken(data.token);
        toast.success(`Welcome to SUKO Atelier, ${data.user?.name || ''}!`);
      } else {
        toast.success("Account created successfully. You can now sign in.");
      }
      return true;
    } catch (err) {
      toast.error(err.message || "Registration failed.");
      return false;
    }
  };

  const loginWithToken = (newToken) => {
    setToken(newToken);
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
