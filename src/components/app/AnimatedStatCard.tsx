import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface AnimatedStatCardProps {
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  delay?: number;
  className?: string;
}

/**
 * Stat card with animated counting effect
 */
export const AnimatedStatCard: React.FC<AnimatedStatCardProps> = ({
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/20',
  label,
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  delay = 0,
  className
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now() + delay;
    const duration = 1500;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      if (elapsed < 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      if (elapsed < duration) {
        const progress = elapsed / duration;
        // Ease out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(easeProgress * value);
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, value, delay]);

  const formattedValue = decimals > 0 
    ? displayValue.toFixed(decimals) 
    : Math.floor(displayValue).toString();

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3 p-4',
        'bg-card/50 rounded-xl border border-border/50',
        'transform transition-all duration-500',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', iconBg)}>
        <Icon className={cn('w-5 h-5', iconColor)} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground tabular-nums">
          {prefix}{formattedValue}{suffix}
        </p>
      </div>
    </div>
  );
};
