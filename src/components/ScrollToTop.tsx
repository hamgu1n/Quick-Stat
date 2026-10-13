import { useEffect } from "react";
import { useLocation } from "react-router";

// Stop the browser from restoring the old scroll position on reload --
// every page load should start at the top.
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

// React Router doesn't reset scroll on navigation by itself, so without
// this, moving between pages (or chapters) would land you wherever the
// previous page was scrolled to. Renders nothing; it only watches the URL.
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
