import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollToTop = () => {
  const { pathname } = useLocation();

  // Use useLayoutEffect for synchronous scroll before paint
  useLayoutEffect(() => {
    // Scroll window to top
    window.scrollTo(0, 0);
    
    // Also scroll any app main containers
    const mainElements = document.querySelectorAll('main');
    mainElements.forEach((main) => {
      main.scrollTop = 0;
    });
    
    // Also target the root element in case it scrolls
    const root = document.getElementById('root');
    if (root) {
      root.scrollTop = 0;
    }
  }, [pathname]);
};
