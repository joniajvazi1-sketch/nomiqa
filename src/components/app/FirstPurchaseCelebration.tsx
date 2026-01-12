import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Sparkles, PartyPopper, X } from 'lucide-react';
import { Confetti } from '@/components/Confetti';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';

interface FirstPurchaseCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
}

const STORAGE_KEY = 'nomiqa-first-purchase-celebrated';

/**
 * Full-screen celebration for first purchase
 */
export const FirstPurchaseCelebration: React.FC<FirstPurchaseCelebrationProps> = ({
  isOpen,
  onClose,
  productName = 'your eSIM'
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const { playCelebration } = useEnhancedSounds();
  const { successPattern } = useEnhancedHaptics();

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
              <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-green-400 to-emerald-600" />
              
              {/* Animated background */}
              <motion.div
                className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 -translate-x-1/2 -translate-y-1/2 blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              <div className="relative z-10">
                {/* Party icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                  className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-2xl mb-4"
                >
                  <PartyPopper className="w-10 h-10 text-white" />
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-4"
                >
                  <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-semibold uppercase tracking-wider">First Purchase!</span>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Welcome to Nomiqa!
                  </h2>
                </motion.div>

                {/* Message */}
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground mb-6"
                >
                  You just got {productName}. Check your email for setup instructions!
                </motion.p>

                {/* Bonus info */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="bg-white/5 rounded-2xl p-4 mb-6 flex items-center justify-center gap-3"
                >
                  <ShoppingBag className="w-6 h-6 text-green-400" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Bonus earned</p>
                    <p className="text-lg font-bold text-green-400">+100 pts</p>
                  </div>
                </motion.div>

                {/* Continue button */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-semibold text-white shadow-lg bg-gradient-to-r from-green-400 to-emerald-600"
                  whileTap={{ scale: 0.98 }}
                >
                  Let's Go!
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
 * Hook to manage first purchase celebration
 */
export const useFirstPurchaseCelebration = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [productName, setProductName] = useState<string | undefined>();

  const checkAndTrigger = (purchasedProductName?: string) => {
    if (typeof window === 'undefined') return false;
    
    const hasBeenCelebrated = localStorage.getItem(STORAGE_KEY) === 'true';
    if (!hasBeenCelebrated) {
      setProductName(purchasedProductName);
      setIsOpen(true);
      localStorage.setItem(STORAGE_KEY, 'true');
      return true;
    }
    return false;
  };

  const close = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    productName,
    checkAndTrigger,
    close
  };
};
