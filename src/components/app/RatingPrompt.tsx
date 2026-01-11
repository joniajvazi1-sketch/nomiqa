import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

interface RatingPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onRate: (rating: number) => void;
  onDismiss: () => void;
  triggerReason?: 'milestone' | 'session_count' | 'first_purchase' | 'achievement';
}

// Storage key for tracking rating prompts
const RATING_STORAGE_KEY = 'nomiqa_app_rating';

interface RatingState {
  hasRated: boolean;
  lastPromptDate: string | null;
  dismissCount: number;
  sessionCount: number;
}

/**
 * App store rating prompt with native-like experience
 * Triggers after milestones, sessions, or achievements
 */
export const RatingPrompt: React.FC<RatingPromptProps> = ({
  isOpen,
  onClose,
  onRate,
  onDismiss,
  triggerReason = 'milestone'
}) => {
  const { lightTap, success } = useHaptics();
  const [selectedRating, setSelectedRating] = useState(0);
  const [step, setStep] = useState<'ask' | 'rate' | 'feedback'>('ask');

  const triggerMessages = {
    milestone: "You've hit a new milestone! 🎉",
    session_count: "You're making great progress! 💪",
    first_purchase: "Thanks for your purchase! 🛍️",
    achievement: "You just unlocked an achievement! 🏆"
  };

  const handleLikeApp = () => {
    lightTap();
    setStep('rate');
  };

  const handleDislikeApp = () => {
    lightTap();
    setStep('feedback');
  };

  const handleSelectRating = (rating: number) => {
    lightTap();
    setSelectedRating(rating);
  };

  const handleSubmitRating = () => {
    success();
    onRate(selectedRating);
    onClose();
  };

  const handleSendFeedback = () => {
    lightTap();
    // In a real app, this would open email or feedback form
    onDismiss();
    onClose();
  };

  const handleNotNow = () => {
    lightTap();
    onDismiss();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
        onClick={handleNotNow}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-sm rounded-3xl bg-card border border-border/50 overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 pb-4 text-center">
            <button
              onClick={handleNotNow}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center hover:bg-muted/30 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-neon-cyan/10 flex items-center justify-center"
            >
              {step === 'ask' && <Heart className="w-8 h-8 text-primary" />}
              {step === 'rate' && <Star className="w-8 h-8 text-amber-400" />}
              {step === 'feedback' && <ThumbsDown className="w-8 h-8 text-muted-foreground" />}
            </motion.div>

            <p className="text-sm text-primary font-medium mb-1">
              {triggerMessages[triggerReason]}
            </p>
          </div>

          {/* Content based on step */}
          <div className="px-6 pb-6">
            {step === 'ask' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-bold text-foreground text-center">
                  Enjoying Nomiqa?
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  Your feedback helps us improve the app for everyone.
                </p>
                
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl"
                    onClick={handleDislikeApp}
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Not really
                  </Button>
                  <Button
                    className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90"
                    onClick={handleLikeApp}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Yes!
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'rate' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-bold text-foreground text-center">
                  Rate us on the App Store
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  Would you mind giving us a quick rating?
                </p>
                
                {/* Star rating */}
                <div className="flex justify-center gap-2 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleSelectRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          'w-10 h-10 transition-colors',
                          star <= selectedRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-muted-foreground/30'
                        )}
                      />
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    className="flex-1 h-12 rounded-xl"
                    onClick={handleNotNow}
                  >
                    Maybe later
                  </Button>
                  <Button
                    className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90"
                    onClick={handleSubmitRating}
                    disabled={selectedRating === 0}
                  >
                    Submit
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'feedback' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-bold text-foreground text-center">
                  We'd love your feedback
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  Help us make Nomiqa better by sharing what we could improve.
                </p>
                
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="ghost"
                    className="flex-1 h-12 rounded-xl"
                    onClick={handleNotNow}
                  >
                    No thanks
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl"
                    onClick={handleSendFeedback}
                  >
                    Send feedback
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Hook to manage rating prompt state and logic
 */
export const useRatingPrompt = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerReason, setTriggerReason] = useState<RatingPromptProps['triggerReason']>('milestone');

  // Load state from localStorage
  const getRatingState = useCallback((): RatingState => {
    try {
      const stored = localStorage.getItem(RATING_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return {
      hasRated: false,
      lastPromptDate: null,
      dismissCount: 0,
      sessionCount: 0
    };
  }, []);

  const saveRatingState = useCallback((state: Partial<RatingState>) => {
    try {
      const current = getRatingState();
      localStorage.setItem(RATING_STORAGE_KEY, JSON.stringify({ ...current, ...state }));
    } catch (e) {
      // Ignore storage errors
    }
  }, [getRatingState]);

  // Check if we should show the prompt
  const shouldShowPrompt = useCallback((reason: RatingPromptProps['triggerReason']): boolean => {
    const state = getRatingState();
    
    // Never show if already rated
    if (state.hasRated) return false;
    
    // Don't show too frequently (minimum 3 days between prompts)
    if (state.lastPromptDate) {
      const lastPrompt = new Date(state.lastPromptDate);
      const daysSince = (Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 3) return false;
    }
    
    // Stop showing after 3 dismissals
    if (state.dismissCount >= 3) return false;
    
    return true;
  }, [getRatingState]);

  // Trigger the rating prompt
  const triggerRatingPrompt = useCallback((reason: RatingPromptProps['triggerReason'] = 'milestone') => {
    if (shouldShowPrompt(reason)) {
      setTriggerReason(reason);
      setIsOpen(true);
      saveRatingState({ lastPromptDate: new Date().toISOString() });
    }
  }, [shouldShowPrompt, saveRatingState]);

  // Handle user rating
  const handleRate = useCallback((rating: number) => {
    saveRatingState({ hasRated: true });
    // In production, this would trigger the native app store rating API
    console.log('User rated:', rating);
  }, [saveRatingState]);

  // Handle dismissal
  const handleDismiss = useCallback(() => {
    const state = getRatingState();
    saveRatingState({ dismissCount: state.dismissCount + 1 });
  }, [getRatingState, saveRatingState]);

  // Increment session count and check if we should prompt
  const trackSession = useCallback(() => {
    const state = getRatingState();
    const newCount = state.sessionCount + 1;
    saveRatingState({ sessionCount: newCount });
    
    // Trigger after 5 sessions
    if (newCount === 5) {
      triggerRatingPrompt('session_count');
    }
  }, [getRatingState, saveRatingState, triggerRatingPrompt]);

  return {
    isOpen,
    triggerReason,
    triggerRatingPrompt,
    handleRate,
    handleDismiss,
    trackSession,
    close: () => setIsOpen(false)
  };
};

export default RatingPrompt;
