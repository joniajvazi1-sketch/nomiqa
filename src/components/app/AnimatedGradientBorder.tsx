import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedGradientBorderProps {
  children: React.ReactNode;
  className?: string;
  borderWidth?: number;
  borderRadius?: number;
  gradientColors?: string[];
  animationDuration?: number;
  glowIntensity?: 'none' | 'subtle' | 'medium' | 'strong';
}

// Check for reduced motion preference
const prefersReducedMotion = () => 
  typeof window !== 'undefined' && 
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * GPU-optimized animated gradient border wrapper
 * Uses CSS custom properties for smooth rotation
 */
export const AnimatedGradientBorder: React.FC<AnimatedGradientBorderProps> = ({
  children,
  className = '',
  borderWidth = 2,
  borderRadius = 28,
  gradientColors = ['hsl(var(--primary))', 'hsl(var(--neon-cyan))', 'hsl(var(--primary))'],
  animationDuration = 4, // Slower = less GPU work
  glowIntensity = 'subtle'
}) => {
  const glowStyles = {
    none: '',
    subtle: 'shadow-lg shadow-primary/15',
    medium: 'shadow-xl shadow-primary/20',
    strong: 'shadow-2xl shadow-primary/30'
  };

  // Memoize gradient string
  const gradientStyle = useMemo(() => ({
    background: `conic-gradient(from var(--gradient-angle, 0deg), ${gradientColors.join(', ')})`,
    borderRadius: borderRadius + 1,
    // GPU acceleration
    transform: 'translateZ(0)',
    WebkitTransform: 'translateZ(0)',
    willChange: prefersReducedMotion() ? 'auto' : 'transform',
    animation: prefersReducedMotion() ? 'none' : `gradient-rotate ${animationDuration}s linear infinite`,
  }), [gradientColors, borderRadius, animationDuration]);

  const innerStyle = useMemo(() => ({
    margin: borderWidth,
    borderRadius: borderRadius - borderWidth,
  }), [borderWidth, borderRadius]);

  return (
    <div 
      className={cn('relative group transform-gpu', className)}
      style={{ borderRadius }}
    >
      {/* GPU-accelerated animated gradient border */}
      <div 
        className={cn(
          'absolute -inset-px rounded-[inherit] opacity-50 group-hover:opacity-80 transition-opacity duration-300',
          glowStyles[glowIntensity]
        )}
        style={gradientStyle}
      />
      
      {/* Inner content container */}
      <div 
        className="relative bg-background/95 backdrop-blur-xl rounded-[inherit] transform-gpu"
        style={innerStyle}
      >
        {children}
      </div>
      
      {/* CSS for gradient rotation - using conic-gradient for smoother animation */}
      <style>{`
        @property --gradient-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        
        @keyframes gradient-rotate {
          to { --gradient-angle: 360deg; }
        }
      `}</style>
    </div>
  );
};

export default AnimatedGradientBorder;
