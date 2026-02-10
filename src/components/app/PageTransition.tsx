import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Skip entrance animation on the very first render (cold start optimization)
let isFirstRender = true;

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  /** Unique key for AnimatePresence transitions */
  transitionKey?: string;
  /** Transition variant: 'fade' | 'slide' | 'scale' | 'spring' */
  variant?: 'fade' | 'slide' | 'scale' | 'spring' | 'instant';
  /** Disable all transforms (helps WebGL/canvas render reliably on some devices) */
  disableTransform?: boolean;
}

// Fast spring config - optimized for perceived speed on mobile
const springConfig = {
  type: 'tween' as const,
  duration: 0.12,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

// Ultra-fast for instant transitions
const instantTween = {
  type: 'tween' as const,
  duration: 0.08,
  ease: 'easeOut' as const,
};

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.1, ease: 'easeOut' as const },
  },
  slide: {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: { duration: 0.12, ease: [0.25, 0.1, 0.25, 1] as const },
  },
  scale: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.1, ease: 'easeOut' as const },
  },
  spring: {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
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
  disableTransform = false,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [animationDone, setAnimationDone] = useState(false);
  
  // Skip entrance animation on cold start
  const skipAnimation = useRef(isFirstRender);
  useEffect(() => {
    if (isFirstRender) isFirstRender = false;
  }, []);
  
  // Avoid transforms entirely when requested (WebGL/canvas safety)
  const activeVariant = disableTransform || skipAnimation.current
    ? 'instant'
    : (prefersReducedMotion ? 'instant' : variant);

  const config = variants[activeVariant];

  // Remove GPU hints after animation completes to avoid scroll interference on Android
  useEffect(() => {
    const timer = setTimeout(() => setAnimationDone(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      key={transitionKey}
      initial={skipAnimation.current ? false : config.initial}
      animate={config.animate}
      exit={config.exit}
      transition={config.transition}
      className={cn(
        // Remove transform-gpu after animation to avoid Android scroll issues
        !disableTransform && !animationDone ? 'transform-gpu' : undefined,
        className
      )}
      style={
        disableTransform || animationDone
          ? undefined
          : {
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }
      }
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
