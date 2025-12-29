import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

interface WebLayoutProps {
  children: React.ReactNode;
}

/**
 * Standard Website Layout - Used only when accessed via browser
 * Includes header (Navbar) and footer
 */
export const WebLayout: React.FC<WebLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};
