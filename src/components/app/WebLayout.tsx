import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

interface WebLayoutProps {
  children: React.ReactNode;
}

/**
 * Standard Website Layout - Used only when accessed via browser
 * Includes header (Navbar) and footer
 * Uses fixed positioning with overflow-y-auto to enable scrolling
 * while respecting the global overflow:hidden on html/body (for native app)
 */
export const WebLayout: React.FC<WebLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isCheckoutPage = location.pathname.includes('/checkout');
  const isAuthPage = location.pathname.includes('/auth');
  const isPrivacyPolicy = location.pathname === '/privacy-policy';
  const [ready, setReady] = useState(false);
  const prevPath = useRef(location.pathname);

  // Scroll to top on route change
  useEffect(() => {
    const scrollContainer = document.querySelector('.web-scroll-root');
    if (scrollContainer) {
      scrollContainer.scrollTo(0, 0);
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Smooth fade-in on mount and route changes
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      setReady(false);
      prevPath.current = location.pathname;
    }
    // Use rAF to ensure paint before animation starts
    const raf = requestAnimationFrame(() => {
      setReady(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [location.pathname]);

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-background web-scroll-root">
      <div className="min-h-full flex flex-col">
        {!isAdminPage && !isCheckoutPage && !isAuthPage && <Navbar />}
        <main 
          className="flex-1"
          style={{
            opacity: ready ? 1 : 0,
            transform: ready ? 'none' : 'translateY(6px)',
            transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
            willChange: 'opacity',
          }}
        >
          {children}
        </main>
        {!isAdminPage && !isCheckoutPage && !isAuthPage && <Footer />}
      </div>
    </div>
  );
};
