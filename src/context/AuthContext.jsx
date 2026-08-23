import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { API_BASE_URL } from "../config/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ authenticated: true, role: payload.role, userId: payload.userId, name: payload.name, phone: payload.phone, email: payload.email });
      } catch (e) {
        setUser({ authenticated: true, role: 'customer' });
      }
    } else {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      
      setToken(data.token);
      toast.success("Successfully signed in.");
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const register = async (name, phone, email, password, role = "customer") => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      
      toast.success("Account created successfully. You can now sign in.");
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const loginWithToken = (newToken) => {
    setToken(newToken);
    toast.success("Successfully signed in.");
    return true;
  };

  const logout = () => {
    setToken(null);
    toast.success("Logged out successfully.");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
