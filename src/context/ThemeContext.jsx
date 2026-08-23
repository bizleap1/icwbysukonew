import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    root.setAttribute("data-theme", "light");
    localStorage.removeItem("icw-theme");
  }, []);

  const toggleTheme = () => {};
  const isDark = false;
  const theme = "light";

  return (
    <ThemeContext.Provider value={{ theme, setTheme: () => {}, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
