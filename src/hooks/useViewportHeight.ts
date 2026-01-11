import { useState, useEffect } from 'react';

/**
 * Hook that returns safe content height excluding bottom navigation
 * Useful for viewport-aware modal/content sizing
 */
export const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(0);
  const [safeAreaBottom, setSafeAreaBottom] = useState(0);
  const [safeAreaTop, setSafeAreaTop] = useState(0);
  
  useEffect(() => {
    const updateHeight = () => {
      // Get viewport height
      const vh = window.innerHeight;
      setViewportHeight(vh);
      
      // Try to get safe area insets from CSS environment variables
      const computedStyle = getComputedStyle(document.documentElement);
      const bottom = parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0', 10);
      const top = parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0', 10);
      
      setSafeAreaBottom(bottom || 0);
      setSafeAreaTop(top || 0);
    };
    
    updateHeight();
    
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    
    // Also listen for visual viewport changes (keyboard, etc.)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
    }
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
      }
    };
  }, []);
  
  // Bottom nav is roughly 80px (64px + padding)
  const BOTTOM_NAV_HEIGHT = 80;
  
  return {
    // Full viewport height
    viewportHeight,
    // Height excluding bottom nav
    contentHeight: viewportHeight - BOTTOM_NAV_HEIGHT,
    // Safe content height (excluding safe areas and bottom nav)
    safeContentHeight: viewportHeight - BOTTOM_NAV_HEIGHT - safeAreaBottom - safeAreaTop,
    // Safe area insets
    safeAreaBottom,
    safeAreaTop,
    // Useful CSS values
    cssVars: {
      '--vh': `${viewportHeight}px`,
      '--content-height': `${viewportHeight - BOTTOM_NAV_HEIGHT}px`,
      '--safe-content-height': `${viewportHeight - BOTTOM_NAV_HEIGHT - safeAreaBottom - safeAreaTop}px`,
    } as React.CSSProperties,
  };
};

export default useViewportHeight;
