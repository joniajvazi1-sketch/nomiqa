import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  hapticStyle?: 'light' | 'medium' | 'heavy';
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

/**
 * Button with ripple animation and haptic feedback
 * Provides immediate tactile and visual feedback on tap
 */
export const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  className,
  variant = 'primary',
  hapticStyle = 'medium',
  onClick,
  ...props
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const { lightTap, mediumTap, heavyTap } = useHaptics();

  const addRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);

    // Trigger haptic
    switch (hapticStyle) {
      case 'heavy':
        heavyTap();
        break;
      case 'medium':
        mediumTap();
        break;
      default:
        lightTap();
    }

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  }, [hapticStyle, lightTap, mediumTap, heavyTap]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    addRipple(e);
    onClick?.(e);
  };

  const baseStyles = 'relative overflow-hidden transition-all duration-300 active:scale-[0.97]';
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-neon-cyan to-neon-cyan/80 text-background shadow-lg shadow-neon-cyan/30',
    secondary: 'bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] text-foreground hover:bg-white/[0.08]',
    ghost: 'bg-transparent text-foreground hover:bg-white/[0.05]',
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], className)}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple container */}
      <span className="absolute inset-0 overflow-hidden rounded-inherit pointer-events-none">
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute rounded-full animate-ripple pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)',
              background: variant === 'primary' 
                ? 'rgba(0, 0, 0, 0.2)' 
                : 'rgba(0, 255, 255, 0.3)',
            }}
          />
        ))}
      </span>
      
      {/* Button content */}
      <span className="relative z-10">{children}</span>
    </button>
  );
};
