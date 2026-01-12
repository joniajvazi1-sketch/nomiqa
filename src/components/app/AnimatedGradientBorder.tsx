import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedGradientBorderProps {
  children: React.ReactNode;
  className?: string;
  borderRadius?: number;
}

/**
 * Simplified static border wrapper - no animations
 * Professional, clean appearance without visual noise
 */
export const AnimatedGradientBorder: React.FC<AnimatedGradientBorderProps> = ({
  children,
  className = '',
  borderRadius = 20,
}) => {
  return (
    <div 
      className={cn(
        'relative rounded-2xl border border-border bg-card overflow-hidden',
        className
      )}
      style={{ borderRadius }}
    >
      {children}
    </div>
  );
};

export default AnimatedGradientBorder;
