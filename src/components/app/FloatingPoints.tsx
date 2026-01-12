import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FloatingPoint {
  id: string;
  value: number;
  x: number;
  y: number;
}

interface FloatingPointsProps {
  trigger: boolean;
  points: number;
  anchorRef?: React.RefObject<HTMLElement>;
  className?: string;
  onComplete?: () => void;
}

/**
 * Floating +X points animation
 * Shows animated points floating up when earned
 */
export const FloatingPoints: React.FC<FloatingPointsProps> = ({
  trigger,
  points,
  anchorRef,
  className,
  onComplete
}) => {
  const [floatingPoints, setFloatingPoints] = useState<FloatingPoint[]>([]);

  useEffect(() => {
    if (trigger && points > 0) {
      const id = `fp-${Date.now()}`;
      // Calculate position relative to anchor or default to center
      const x = anchorRef?.current 
        ? anchorRef.current.getBoundingClientRect().left + anchorRef.current.offsetWidth / 2
        : window.innerWidth / 2;
      const y = anchorRef?.current
        ? anchorRef.current.getBoundingClientRect().top
        : window.innerHeight / 3;

      setFloatingPoints(prev => [...prev, { id, value: points, x, y }]);

      // Remove after animation
      setTimeout(() => {
        setFloatingPoints(prev => prev.filter(p => p.id !== id));
        onComplete?.();
      }, 1500);
    }
  }, [trigger, points, anchorRef, onComplete]);

  return (
    <AnimatePresence>
      {floatingPoints.map(point => (
        <motion.div
          key={point.id}
          className={cn(
            'fixed pointer-events-none z-50 font-bold text-2xl text-neon-cyan drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]',
            className
          )}
          initial={{ 
            opacity: 0, 
            scale: 0.5,
            x: point.x - 30,
            y: point.y
          }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1.2, 1, 0.8],
            y: point.y - 80,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          +{point.value}
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

/**
 * Hook to trigger floating points animation
 */
export const useFloatingPoints = () => {
  const [trigger, setTrigger] = useState(false);
  const [points, setPoints] = useState(0);

  const showPoints = (amount: number) => {
    setPoints(amount);
    setTrigger(true);
    setTimeout(() => setTrigger(false), 100);
  };

  return { trigger, points, showPoints };
};
