import React from 'react';
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

/**
 * Animated gradient border wrapper
 * Creates a rotating gradient border effect around content
 */
export const AnimatedGradientBorder: React.FC<AnimatedGradientBorderProps> = ({
  children,
  className = '',
  borderWidth = 2,
  borderRadius = 28,
  gradientColors = ['hsl(var(--primary))', 'hsl(var(--neon-cyan))', 'hsl(var(--primary))'],
  animationDuration = 3,
  glowIntensity = 'subtle'
}) => {
  const glowStyles = {
    none: '',
    subtle: 'shadow-lg shadow-primary/20',
    medium: 'shadow-xl shadow-primary/30',
    strong: 'shadow-2xl shadow-primary/40'
  };

  return (
    <div 
      className={cn('relative group', className)}
      style={{ borderRadius }}
    >
      {/* Animated gradient border */}
      <div 
        className={cn(
          'absolute -inset-px rounded-[inherit] opacity-60 group-hover:opacity-100 transition-opacity',
          glowStyles[glowIntensity]
        )}
        style={{
          background: `linear-gradient(var(--gradient-angle, 0deg), ${gradientColors.join(', ')})`,
          borderRadius: borderRadius + 1,
          animation: `gradient-rotate ${animationDuration}s linear infinite`
        }}
      />
      
      {/* Inner content container */}
      <div 
        className="relative bg-background/95 backdrop-blur-xl rounded-[inherit]"
        style={{ 
          margin: borderWidth,
          borderRadius: borderRadius - borderWidth 
        }}
      >
        {children}
      </div>
      
      {/* CSS for gradient rotation */}
      <style>{`
        @property --gradient-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        
        @keyframes gradient-rotate {
          0% { --gradient-angle: 0deg; }
          100% { --gradient-angle: 360deg; }
        }
      `}</style>
    </div>
  );
};

export default AnimatedGradientBorder;
