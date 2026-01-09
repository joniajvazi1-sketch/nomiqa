import React, { useEffect } from 'react';
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

  // Scroll to top on route change
  useEffect(() => {
    // Scroll the container to top
    const scrollContainer = document.querySelector('.fixed.inset-0.overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTo(0, 0);
    }
    // Also scroll window just in case
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-background">
      <div className="min-h-full flex flex-col">
        {!isAdminPage && <Navbar />}
        <main className="flex-1">
          {children}
        </main>
        {!isAdminPage && <Footer />}
      </div>
    </div>
  );
};
