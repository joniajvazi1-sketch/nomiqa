import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Hand } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'nomiqa-gesture-hints-shown';

interface GestureHint {
  id: string;
  message: string;
  icon?: 'swipe-left' | 'swipe-right' | 'long-press' | 'pull-down';
}

const getShownHints = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const markHintShown = (id: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const shown = getShownHints();
    if (!shown.includes(id)) {
      shown.push(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shown));
    }
  } catch {
    // Ignore
  }
};

/**
 * Swipe indicator for product cards
 */
interface SwipeHintProps {
  id: string;
  direction?: 'left' | 'right';
  message?: string;
  className?: string;
  delay?: number;
}

export const SwipeHint: React.FC<SwipeHintProps> = ({
  id,
  direction = 'left',
  message = 'Swipe for details',
  className,
  delay = 2000
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const shownHints = getShownHints();
    if (shownHints.includes(id)) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [id, delay]);

  const handleDismiss = () => {
    setIsVisible(false);
    markHintShown(id);
  };

  if (!isVisible) return null;

  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none',
          direction === 'left' ? 'left-4' : 'right-4',
          className
        )}
        initial={{ opacity: 0, x: direction === 'left' ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        onClick={handleDismiss}
      >
        <motion.div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white/90"
          animate={{ x: direction === 'left' ? [-5, 5, -5] : [5, -5, 5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {direction === 'left' && <Icon className="w-4 h-4" />}
          <span className="text-xs font-medium">{message}</span>
          {direction === 'right' && <Icon className="w-4 h-4" />}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Long press hint indicator
 */
interface LongPressHintProps {
  id: string;
  message?: string;
  className?: string;
  delay?: number;
}

export const LongPressHint: React.FC<LongPressHintProps> = ({
  id,
  message = 'Hold for options',
  className,
  delay = 3000
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const shownHints = getShownHints();
    if (shownHints.includes(id)) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
      
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setIsVisible(false);
        markHintShown(id);
      }, 4000);
    }, delay);

    return () => clearTimeout(timer);
  }, [id, delay]);

  if (!isVisible) return null;

  return (
    <motion.div
      className={cn(
        'absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20',
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border shadow-lg">
        <motion.div
          animate={{ scale: [1, 0.9, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Hand className="w-4 h-4 text-primary" />
        </motion.div>
        <span className="text-xs font-medium text-foreground">{message}</span>
      </div>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-r border-b border-border rotate-45 -mt-1" />
    </motion.div>
  );
};

/**
 * Hook to manage gesture hints
 */
export const useGestureHints = () => {
  const [shownHints, setShownHints] = useState<string[]>([]);

  useEffect(() => {
    setShownHints(getShownHints());
  }, []);

  const isHintShown = (id: string) => shownHints.includes(id);
  
  const showHint = (id: string) => {
    if (!shownHints.includes(id)) {
      markHintShown(id);
      setShownHints(prev => [...prev, id]);
    }
  };

  const resetAllHints = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      setShownHints([]);
    }
  };

  return { isHintShown, showHint, resetAllHints };
};

/**
 * Wrapper that adds swipe hint to children
 */
interface WithSwipeHintProps {
  hintId: string;
  children: React.ReactNode;
  direction?: 'left' | 'right';
  message?: string;
  className?: string;
}

export const WithSwipeHint: React.FC<WithSwipeHintProps> = ({
  hintId,
  children,
  direction = 'left',
  message,
  className
}) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      <SwipeHint id={hintId} direction={direction} message={message} />
    </div>
  );
};
