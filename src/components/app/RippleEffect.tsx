import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface RippleEffectProps {
  children: React.ReactNode;
  className?: string;
  rippleColor?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

/**
 * Wrapper component that adds ripple effect on click
 * Used for tappable cards and interactive elements
 */
export const RippleEffect: React.FC<RippleEffectProps> = ({
  children,
  className,
  rippleColor = 'rgba(255, 255, 255, 0.3)',
  disabled = false,
  onClick
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  let rippleCount = 0;

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = {
      x,
      y,
      id: rippleCount++
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    onClick?.(e);
  }, [disabled, onClick]);

  return (
    <div 
      className={cn('relative overflow-hidden', className)}
      onClick={handleClick}
    >
      {children}
      
      {/* Ripples */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            backgroundColor: rippleColor,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      <style>{`
        @keyframes ripple-expand {
          0% {
            width: 0;
            height: 0;
            opacity: 0.5;
          }
          100% {
            width: 400px;
            height: 400px;
            opacity: 0;
          }
        }
        .animate-ripple {
          animation: ripple-expand 0.6s cubic-bezier(0, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};
