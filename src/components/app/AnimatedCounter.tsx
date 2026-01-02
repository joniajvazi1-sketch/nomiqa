import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  onMilestone?: (value: number) => void;
  milestoneThreshold?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  decimals = 1,
  duration = 500,
  className,
  suffix = '',
  prefix = '',
  onMilestone,
  milestoneThreshold = 10
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const animationRef = useRef<number>();
  const lastMilestone = useRef(Math.floor(value / milestoneThreshold) * milestoneThreshold);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    // Check for milestone
    const currentMilestone = Math.floor(endValue / milestoneThreshold) * milestoneThreshold;
    if (currentMilestone > lastMilestone.current && onMilestone) {
      onMilestone(currentMilestone);
      lastMilestone.current = currentMilestone;
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(animate);
    previousValue.current = value;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, onMilestone, milestoneThreshold]);

  return (
    <span 
      className={cn(
        'tabular-nums transition-colors',
        className
      )}
      style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
    >
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
};
