import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  /** Unique key for AnimatePresence transitions */
  transitionKey?: string;
  /** Transition variant: 'fade' | 'slide' | 'scale' | 'spring' */
  variant?: 'fade' | 'slide' | 'scale' | 'spring';
}

// Spring-based animation configurations
const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 1,
};

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
  slide: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.25, ease: [0, 0, 0.2, 1] as const },
  },
  scale: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
  spring: {
    initial: { opacity: 0, y: 16, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8, scale: 0.99 },
    transition: springConfig,
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
  const config = variants[variant];

  return (
    <motion.div
      key={transitionKey}
      initial={config.initial}
      animate={config.animate}
      exit={config.exit}
      transition={config.transition}
      className={cn('will-change-transform', className)}
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
  staggerDelay = 0.05,
}) => {
  return (
    <motion.div className={className}>
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            ...springConfig,
            delay: index * staggerDelay,
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        ...springConfig,
        delay,
      }}
      whileTap={{ scale: 0.98 }}
      className={cn('will-change-transform', className)}
    >
      {children}
    </motion.div>
  );
};
