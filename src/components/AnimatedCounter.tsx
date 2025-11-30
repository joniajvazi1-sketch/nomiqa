import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
  delay?: number;
}

export const AnimatedCounter = ({ 
  end, 
  duration = 2000, 
  suffix = '', 
  className = '',
  delay = 0 
}: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

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
    const endValue = end;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      if (elapsed < 0) {
        requestAnimationFrame(animate);
        return;
      }

      if (elapsed < duration) {
        const progress = elapsed / duration;
        // Ease out cubic for smooth deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(easeProgress * endValue));
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration, delay]);

  return (
    <span ref={ref} className={className}>
      {count}{suffix}
    </span>
  );
};
