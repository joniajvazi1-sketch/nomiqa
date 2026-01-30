import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Check, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { toast } from 'sonner';

interface DailyCheckInProps {
  userId: string;
  onClose?: () => void;
}

const STREAK_REWARDS = [
  { day: 1, points: 10 },
  { day: 2, points: 15 },
  { day: 3, points: 25 },
  { day: 4, points: 30 },
  { day: 5, points: 40 },
  { day: 6, points: 50 },
  { day: 7, points: 100 },
];

export const DailyCheckIn = ({ userId, onClose }: DailyCheckInProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const { successPattern, buttonTap } = useEnhancedHaptics();
  const { playCelebration } = useEnhancedSounds();

  useEffect(() => {
    checkTodayStatus();
  }, [userId]);

  const checkTodayStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Check if already checked in today
      const { data: todayCheckIn } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('check_in_date', today)
        .maybeSingle();

      if (todayCheckIn) {
        setHasCheckedInToday(true);
        setCurrentStreak(todayCheckIn.streak_day);
        setIsLoading(false);
        return;
      }

      // Get yesterday's check-in to calculate streak
      const { data: yesterdayCheckIn } = await supabase
        .from('daily_checkins')
        .select('streak_day')
        .eq('user_id', userId)
        .eq('check_in_date', yesterday)
        .maybeSingle();

      setCurrentStreak(yesterdayCheckIn?.streak_day || 0);
      setIsOpen(true); // Auto-show for new check-in
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking daily status:', error);
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (isClaiming || hasCheckedInToday) return;

    setIsClaiming(true);
    buttonTap();

    try {
      const today = new Date().toISOString().split('T')[0];
      const newStreakDay = (currentStreak % 7) + 1;
      const bonusPoints = STREAK_REWARDS[newStreakDay - 1]?.points || 10;

      const { error } = await supabase
        .from('daily_checkins')
        .insert({
          user_id: userId,
          check_in_date: today,
          bonus_points: bonusPoints,
          streak_day: newStreakDay,
        });

      if (error) throw error;

      // Update user points
      const { data: userPoints } = await supabase
        .from('user_points')
        .select('total_points, pending_points')
        .eq('user_id', userId)
        .maybeSingle();

      if (userPoints) {
        await supabase
          .from('user_points')
          .update({
            total_points: (userPoints.total_points || 0) + bonusPoints,
            pending_points: (userPoints.pending_points || 0) + bonusPoints,
          })
          .eq('user_id', userId);
      }

      successPattern();
      playCelebration();
      setCurrentStreak(newStreakDay);
      setHasCheckedInToday(true);

      toast.success(`+${bonusPoints} points earned!`, {
        description: `Day ${newStreakDay} streak bonus claimed!`,
      });

      setTimeout(() => {
        setIsOpen(false);
        onClose?.();
      }, 1200);
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to check in. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  // Lock scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const main = document.querySelector('main') as HTMLElement | null;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevMainOverflow = main?.style.overflow ?? '';

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    if (main) main.style.overflow = 'hidden';

    const preventScroll = (e: Event) => e.preventDefault();
    const opts: AddEventListenerOptions = { passive: false, capture: true };
    document.addEventListener('touchmove', preventScroll, opts);
    document.addEventListener('wheel', preventScroll, opts);

    return () => {
      document.removeEventListener('touchmove', preventScroll, opts);
      document.removeEventListener('wheel', preventScroll, opts);
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      if (main) main.style.overflow = prevMainOverflow;
    };
  }, [isOpen]);

  if (isLoading || !isOpen) return null;

  const nextStreakDay = (currentStreak % 7) + 1;
  const todayReward = STREAK_REWARDS[nextStreakDay - 1];

  return (
    <AnimatePresence>
      {/* Fixed overlay - centered modal */}
      <motion.div
        key="daily-checkin-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
        style={{ touchAction: 'none' }}
        onClick={handleClose}
      >
        {/* Modal card - compact */}
        <motion.div
          key="daily-checkin-card"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-[260px] bg-card rounded-3xl p-5 shadow-2xl border border-border"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-3 shadow-lg"
          >
            <Gift className="w-7 h-7 text-white" />
          </motion.div>

          {/* Title */}
          <h2 className="text-lg font-bold text-center text-foreground mb-1">Daily Check-in</h2>

          {/* Streak indicator */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-muted-foreground">
              {currentStreak > 0 ? `${currentStreak} day streak` : 'Start your streak!'}
            </span>
          </div>

          {/* Today's reward - simple */}
          <div className="bg-primary/10 rounded-2xl p-4 mb-4 border border-primary/20 text-center">
            <p className="text-xs text-muted-foreground mb-1">Today's Reward</p>
            <p className="text-3xl font-bold text-primary">+{todayReward?.points}</p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>

          {/* Claim button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleCheckIn}
            disabled={isClaiming || hasCheckedInToday}
            className={`
              w-full py-3 rounded-2xl font-semibold text-base
              transition-all duration-200
              ${hasCheckedInToday
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground'
              }
              disabled:opacity-70
            `}
          >
            {isClaiming ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Claiming...
              </span>
            ) : hasCheckedInToday ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                Claimed!
              </span>
            ) : (
              'Claim Reward'
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
