import React, { ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface SwipeableDismissProps {
  children: ReactNode;
  onDismiss: () => void;
  direction?: 'down' | 'up';
  threshold?: number;
  className?: string;
}

/**
 * Swipeable wrapper that allows dismissing content by swiping
 * Used for modals and drawers in the native app
 */
export const SwipeableDismiss: React.FC<SwipeableDismissProps> = ({
  children,
  onDismiss,
  direction = 'down',
  threshold = 100,
  className = ''
}) => {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, threshold], [1, 0.5]);
  const scale = useTransform(y, [0, threshold], [1, 0.95]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const shouldDismiss = direction === 'down' 
      ? info.offset.y > threshold || info.velocity.y > 500
      : info.offset.y < -threshold || info.velocity.y < -500;
    
    if (shouldDismiss) {
      onDismiss();
    }
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: direction === 'down' ? 0 : -300, bottom: direction === 'down' ? 300 : 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      style={{ y, opacity, scale }}
      className={className}
    >
      {/* Swipe indicator handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>
      {children}
    </motion.div>
  );
};
