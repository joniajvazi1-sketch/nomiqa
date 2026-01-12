import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface SpotlightTooltipProps {
  id: string;
  children: React.ReactNode;
  message: string;
  position?: TooltipPosition;
  icon?: React.ReactNode;
  delay?: number;
  className?: string;
  spotlightClassName?: string;
  onDismiss?: () => void;
}

const STORAGE_KEY = 'nomiqa-first-use-hints';

/**
 * Get dismissed hints from localStorage
 */
const getDismissedHints = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Mark a hint as dismissed
 */
const dismissHint = (id: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const dismissed = getDismissedHints();
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
    }
  } catch {
    // Ignore localStorage errors
  }
};

/**
 * Check if a hint has been dismissed
 */
const isHintDismissed = (id: string): boolean => {
  return getDismissedHints().includes(id);
};

/**
 * First-use spotlight tooltip that shows once and dismisses on tap
 */
export const SpotlightTooltip: React.FC<SpotlightTooltipProps> = ({
  id,
  children,
  message,
  position = 'bottom',
  icon,
  delay = 1000,
  className,
  spotlightClassName,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    if (isHintDismissed(id)) return;

    // Show after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [id, delay]);

  const handleDismiss = () => {
    setIsVisible(false);
    dismissHint(id);
    onDismiss?.();
  };

  const positionStyles: Record<TooltipPosition, string> = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2'
  };

  const arrowStyles: Record<TooltipPosition, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-primary border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-primary border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-primary border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-primary border-y-transparent border-l-transparent'
  };

  const animationVariants = {
    top: { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } },
    bottom: { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 } },
    left: { initial: { opacity: 0, x: 10 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 } }
  };

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Spotlight glow effect */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={cn(
              'absolute inset-0 rounded-xl pointer-events-none z-40',
              spotlightClassName
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              boxShadow: [
                '0 0 0 0 rgba(0, 255, 255, 0)',
                '0 0 20px 4px rgba(0, 255, 255, 0.4)',
                '0 0 0 0 rgba(0, 255, 255, 0)'
              ]
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              duration: 0.3,
              boxShadow: { duration: 1.5, repeat: Infinity }
            }}
          />
        )}
      </AnimatePresence>

      {/* The actual element */}
      <div onClick={isVisible ? handleDismiss : undefined}>
        {children}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={cn(
              'absolute z-50 w-max max-w-[200px]',
              positionStyles[position]
            )}
            initial={animationVariants[position].initial}
            animate={animationVariants[position].animate}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div 
              className="relative bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg shadow-primary/30 cursor-pointer"
              onClick={handleDismiss}
            >
              <div className="flex items-center gap-2">
                {icon && <span className="shrink-0">{icon}</span>}
                <p className="text-xs font-medium leading-snug">{message}</p>
                <button 
                  className="shrink-0 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  onClick={handleDismiss}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
              
              {/* Arrow */}
              <div 
                className={cn(
                  'absolute w-0 h-0 border-[6px]',
                  arrowStyles[position]
                )}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Hook to check and manage first-use hints
 */
export const useFirstUseHints = () => {
  const [dismissedHints, setDismissedHints] = useState<string[]>([]);

  useEffect(() => {
    setDismissedHints(getDismissedHints());
  }, []);

  const isHintShown = (id: string) => dismissedHints.includes(id);
  
  const markHintShown = (id: string) => {
    dismissHint(id);
    setDismissedHints(prev => [...prev, id]);
  };

  const resetAllHints = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      setDismissedHints([]);
    }
  };

  return { isHintShown, markHintShown, resetAllHints };
};

/**
 * Simple pull-to-refresh hint overlay
 */
export const PullToRefreshHint: React.FC<{ onDismiss?: () => void }> = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const hintId = 'pull-to-refresh';

  useEffect(() => {
    if (isHintDismissed(hintId)) return;
    
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    dismissHint(hintId);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onClick={handleDismiss}
    >
      <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-full shadow-lg shadow-primary/30 flex items-center gap-2 cursor-pointer">
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          ↓
        </motion.span>
        <span className="text-xs font-medium">Pull down to refresh</span>
        <button 
          className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center"
          onClick={handleDismiss}
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    </motion.div>
  );
};
