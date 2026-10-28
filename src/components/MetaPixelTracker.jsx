import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/*
  Meta (Facebook) Pixel page-view tracking for client-side navigation.

  The pixel itself is loaded once from public/index.html, which also sends the PageView for the first page
  load. This component sends an additional PageView every time the visitor moves to another page inside the
  site (the browser doesn't reload on those moves, so the pixel wouldn't see them otherwise).
  The admin area is never tracked.
*/
const isAdminPath = (pathname) => /^\/admin(\/|$)/.test(pathname);

const MetaPixelTracker = () => {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false; // first load is already counted by the snippet in index.html
      return;
    }
    if (isAdminPath(pathname)) return;
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname]);

  return null;
};

export default MetaPixelTracker;
