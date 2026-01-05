import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ShimmerButtonProps extends ButtonProps {
  shimmerEnabled?: boolean;
  shimmerColor?: string;
}

/**
 * Button with continuous shimmer effect when idle
 * Used for primary CTAs to draw attention
 */
export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  ({ shimmerEnabled = true, shimmerColor, className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          className
        )}
        {...props}
      >
        {/* Shimmer overlay */}
        {shimmerEnabled && (
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(
                90deg,
                transparent 0%,
                ${shimmerColor || 'rgba(255,255,255,0.15)'} 50%,
                transparent 100%
              )`,
              backgroundSize: '200% 100%',
              animation: 'button-shimmer 2.5s ease-in-out infinite',
            }}
          />
        )}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>

        <style>{`
          @keyframes button-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </Button>
    );
  }
);

ShimmerButton.displayName = 'ShimmerButton';
