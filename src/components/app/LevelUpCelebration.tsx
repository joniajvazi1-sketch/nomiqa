import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, ArrowUp, X } from 'lucide-react';
import { Confetti } from '@/components/Confetti';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { cn } from '@/lib/utils';

interface TierInfo {
  name: string;
  level: number;
  color: string;
  gradient: string;
  icon: React.ReactNode;
}

const TIERS: Record<number, TierInfo> = {
  1: {
    name: 'Starter',
    level: 1,
    color: 'text-slate-400',
    gradient: 'from-slate-400 to-slate-500',
    icon: <Star className="w-8 h-8" />
  },
  2: {
    name: 'Traveler',
    level: 2,
    color: 'text-blue-400',
    gradient: 'from-blue-400 to-blue-600',
    icon: <Star className="w-8 h-8" />
  },
  3: {
    name: 'Explorer',
    level: 3,
    color: 'text-purple-400',
    gradient: 'from-purple-400 to-purple-600',
    icon: <Trophy className="w-8 h-8" />
  },
  4: {
    name: 'Pioneer',
    level: 4,
    color: 'text-amber-400',
    gradient: 'from-amber-400 to-amber-600',
    icon: <Trophy className="w-8 h-8" />
  },
  5: {
    name: 'Legend',
    level: 5,
    color: 'text-rose-400',
    gradient: 'from-rose-400 to-rose-600',
    icon: <Sparkles className="w-8 h-8" />
  }
};

interface LevelUpCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  previousTier: number;
  newTier: number;
  bonusPoints?: number;
}

/**
 * Full-screen level-up celebration modal
 */
export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({
  isOpen,
  onClose,
  previousTier,
  newTier,
  bonusPoints = 500
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const { playCelebration } = useEnhancedSounds();
  const { successPattern } = useEnhancedHaptics();

  const newTierInfo = TIERS[newTier] || TIERS[1];
  const previousTierInfo = TIERS[previousTier] || TIERS[1];

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      playCelebration();
      successPattern();
    }
  }, [isOpen, playCelebration, successPattern]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Confetti */}
          <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />

          {/* Modal content */}
          <motion.div
            className="relative z-10 w-full max-w-sm"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center z-20 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="bg-card rounded-3xl p-6 text-center overflow-hidden relative">
              {/* Background glow */}
              <div className={cn(
                'absolute inset-0 opacity-20 bg-gradient-to-br',
                newTierInfo.gradient
              )} />
              
              {/* Animated background circles */}
              <motion.div
                className={cn(
                  'absolute top-1/2 left-1/2 w-40 h-40 rounded-full bg-gradient-to-br -translate-x-1/2 -translate-y-1/2 blur-3xl',
                  newTierInfo.gradient
                )}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              <div className="relative z-10">
                {/* Level up indicator */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center gap-2 mb-4"
                >
                  <ArrowUp className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-semibold text-sm uppercase tracking-wider">
                    Level Up!
                  </span>
                  <ArrowUp className="w-5 h-5 text-green-400" />
                </motion.div>

                {/* Tier icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: 'spring', damping: 10 }}
                  className={cn(
                    'w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-2xl mb-4',
                    newTierInfo.gradient
                  )}
                >
                  <div className="text-white">
                    {newTierInfo.icon}
                  </div>
                </motion.div>

                {/* Tier transition */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-4"
                >
                  <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground mb-2">
                    <span className={previousTierInfo.color}>{previousTierInfo.name}</span>
                    <ArrowUp className="w-4 h-4 text-green-400 rotate-90" />
                    <span className={cn('font-bold', newTierInfo.color)}>{newTierInfo.name}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    You're now a {newTierInfo.name}!
                  </h2>
                </motion.div>

                {/* Bonus points */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="bg-white/5 rounded-2xl p-4 mb-6"
                >
                  <p className="text-xs text-muted-foreground mb-1">Bonus Reward</p>
                  <p className="text-3xl font-bold text-primary">
                    +{bonusPoints.toLocaleString()} pts
                  </p>
                </motion.div>

                {/* Benefits */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-muted-foreground mb-6"
                >
                  <p>Unlocked: Higher earning rates, exclusive challenges</p>
                </motion.div>

                {/* Continue button */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  onClick={onClose}
                  className={cn(
                    'w-full py-3 rounded-xl font-semibold text-white shadow-lg bg-gradient-to-r',
                    newTierInfo.gradient
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  Awesome!
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Hook to track tier changes and trigger celebration
 */
export const useLevelUpCelebration = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tierChange, setTierChange] = useState<{ previous: number; new: number } | null>(null);

  const triggerLevelUp = (previousTier: number, newTier: number) => {
    if (newTier > previousTier) {
      setTierChange({ previous: previousTier, new: newTier });
      setIsOpen(true);
    }
  };

  const close = () => {
    setIsOpen(false);
    setTierChange(null);
  };

  return {
    isOpen,
    previousTier: tierChange?.previous || 1,
    newTier: tierChange?.new || 1,
    triggerLevelUp,
    close
  };
};
