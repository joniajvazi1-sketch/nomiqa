import React from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Page transition wrapper for native app pages
 * Provides smooth enter animations for content
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn('animate-page-enter', className)}>
      {children}
    </div>
  );
};
