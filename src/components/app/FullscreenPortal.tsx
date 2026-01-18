import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface FullscreenPortalProps {
  children: React.ReactNode;
}

/**
 * Renders children outside the normal React tree to avoid transform/overflow stacking-context bugs.
 *
 * IMPORTANT: Our app theme CSS variables are scoped to `.app-theme` (set by AppLayout).
 * Portals rendered directly into `document.body` do NOT inherit those variables.
 *
 * So we render into a dedicated container that mirrors the current `.app-theme` mode (dark/light)
 * when present, ensuring overlays (Onboarding/Consent) keep the correct blue palette.
 */
export const FullscreenPortal: React.FC<FullscreenPortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = document.createElement('div');
    container.setAttribute('data-fullscreen-portal', 'true');

    // If we're inside the native app layout, mirror the theme scope onto the portal container.
    // This keeps `bg-background`, `text-primary`, etc. consistent (blue in app, not website cyan).
    const appThemeEl = document.querySelector('.app-theme');
    if (appThemeEl) {
      container.classList.add('app-theme');
      container.classList.add(appThemeEl.classList.contains('light') ? 'light' : 'dark');
    }

    document.body.appendChild(container);
    containerRef.current = container;
    setMounted(true);

    return () => {
      try {
        container.remove();
      } catch {
        // ignore
      }
      containerRef.current = null;
      setMounted(false);
    };
  }, []);

  if (!mounted || !containerRef.current) return null;
  return createPortal(children, containerRef.current);
};

export default FullscreenPortal;

