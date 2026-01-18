import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface FullscreenPortalProps {
  children: React.ReactNode;
}

/**
 * Renders children into document.body to avoid transform/overflow stacking-context bugs.
 * Critical for full-screen overlays inside PageTransition (framer-motion transforms).
 */
export const FullscreenPortal: React.FC<FullscreenPortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
};

export default FullscreenPortal;
