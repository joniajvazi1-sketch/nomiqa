import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
  barClassName?: string;
  delay?: number;
}

/**
 * Animated progress bar with smooth fill animation
 * Features gradient fill and glow effects
 */
export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  value,
  max,
  label,
  showPercentage = true,
  className,
  barClassName,
  delay = 0
}) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const percentage = Math.min((value / max) * 100, 100);

  useEffect(() => {
    const visibilityTimer = setTimeout(() => setIsVisible(true), delay);
    const animationTimer = setTimeout(() => {
      setAnimatedWidth(percentage);
    }, delay + 100);

    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(animationTimer);
    };
  }, [percentage, delay]);

  return (
    <div 
      className={cn(
        'space-y-2 transition-all duration-500',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        className
      )}
    >
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs">
          {label && (
            <span className="text-muted-foreground font-medium">{label}</span>
          )}
          {showPercentage && (
            <span 
              className="text-neon-cyan font-mono font-semibold"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
            >
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div 
        className={cn(
          'relative h-2 rounded-full overflow-hidden bg-white/[0.05] backdrop-blur-sm',
          barClassName
        )}
      >
        {/* Animated fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${animatedWidth}%`,
            background: 'linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--primary)))',
            boxShadow: '0 0 12px hsla(var(--neon-cyan), 0.5)',
          }}
        />
        
        {/* Shimmer effect */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            width: `${animatedWidth}%`,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              animation: 'shimmer 2s linear infinite',
              backgroundSize: '200% 100%',
            }}
          />
        </div>

        {/* End glow indicator */}
        {animatedWidth > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-neon-cyan shadow-lg transition-all duration-1000 ease-out"
            style={{
              left: `calc(${animatedWidth}% - 6px)`,
              boxShadow: '0 0 8px hsl(var(--neon-cyan)), 0 0 16px hsla(var(--neon-cyan), 0.5)',
            }}
          />
        )}
      </div>
    </div>
  );
};
