import React, { useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  /** Unique key for AnimatePresence transitions */
  transitionKey?: string;
  /** Transition variant: 'fade' | 'slide' | 'scale' | 'spring' */
  variant?: 'fade' | 'slide' | 'scale' | 'spring' | 'instant';
}

// GPU-optimized spring config (compositor-only properties)
const springConfig = {
  type: 'spring' as const,
  stiffness: 400, // Higher stiffness = faster response
  damping: 35,    // Higher damping = less oscillation
  mass: 0.8,      // Lower mass = snappier
};

// Ultra-fast tween for instant feel
const instantTween = {
  type: 'tween' as const,
  duration: 0.15,
  ease: [0.32, 0.72, 0, 1] as [number, number, number, number], // Custom easing for perceived speed
};

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15, ease: 'easeOut' as const },
  },
  slide: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
    transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] as const },
  },
  scale: {
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.99 },
    transition: { duration: 0.15, ease: 'easeOut' as const },
  },
  spring: {
    initial: { opacity: 0, y: 10, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -4, scale: 1 },
    transition: springConfig,
  },
  instant: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: instantTween,
  },
};

/**
 * Enhanced page transition wrapper with spring physics
 * Provides smooth enter/exit animations for native app screens
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className,
  transitionKey,
  variant = 'spring',
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  // Use instant variant if user prefers reduced motion
  const activeVariant = prefersReducedMotion ? 'instant' : variant;
  const config = variants[activeVariant];

  return (
    <motion.div
      key={transitionKey}
      initial={config.initial}
      animate={config.animate}
      exit={config.exit}
      transition={config.transition}
      className={cn('transform-gpu', className)}
      style={{ 
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Staggered children animation wrapper
 * Animates child elements with delay based on index
 */
interface StaggeredListProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  className,
  staggerDelay = 0.03, // Faster stagger for smoother feel
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Skip animation entirely for reduced motion
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className}>
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'tween',
            duration: 0.2,
            ease: [0.32, 0.72, 0, 1],
            delay: index * staggerDelay,
          }}
          style={{ 
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

/**
 * Card entrance animation wrapper
 * For individual cards that need premium entrance effects
 */
interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  delay = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();

  // Skip animation for reduced motion
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'tween',
        duration: 0.2,
        ease: [0.32, 0.72, 0, 1],
        delay,
      }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      className={cn('transform-gpu', className)}
      style={{ 
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
      }}
    >
      {children}
    </motion.div>
  );
};
