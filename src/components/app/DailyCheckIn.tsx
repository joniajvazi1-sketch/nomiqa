import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Gift, Flame, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { toast } from 'sonner';

interface DailyCheckInProps {
  userId: string;
  onClose?: () => void;
}

const STREAK_REWARDS = [
  { day: 1, points: 10, label: 'D1' },
  { day: 2, points: 15, label: 'D2' },
  { day: 3, points: 25, label: 'D3' },
  { day: 4, points: 30, label: 'D4' },
  { day: 5, points: 40, label: 'D5' },
  { day: 6, points: 50, label: 'D6' },
  { day: 7, points: 100, label: 'D7' },
];

export const DailyCheckIn = ({ userId, onClose }: DailyCheckInProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const { successPattern, buttonTap } = useEnhancedHaptics();
  const { playCelebration, playCoin } = useEnhancedSounds();

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
      setIsOpen(true); // Show modal for new check-in
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
      }, 1500);
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to check in. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (isLoading || !isOpen) return null;

  const nextStreakDay = (currentStreak % 7) + 1;
  const todayReward = STREAK_REWARDS[nextStreakDay - 1];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xs bg-card rounded-2xl p-4 shadow-2xl border border-border overflow-hidden max-h-[75vh]"
        >
          {/* Background decoration */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-primary/20 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative">
            {/* Icon - smaller */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-3 shadow-lg"
            >
              <Gift className="w-7 h-7 text-white" />
            </motion.div>

            {/* Title - smaller */}
            <h2 className="text-lg font-bold text-center mb-1">Daily Check-in</h2>
            <p className="text-center text-xs text-muted-foreground mb-3">
              Claim your daily reward!
            </p>

            {/* Streak indicator - more compact */}
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold">
                {currentStreak > 0 ? `${currentStreak} day streak` : 'Start your streak!'}
              </span>
            </div>

            {/* Week progress - compact grid */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {STREAK_REWARDS.map((reward, index) => {
                const isPast = index < currentStreak % 7;
                const isCurrent = index === nextStreakDay - 1;
                const isFuture = index > nextStreakDay - 1;

                return (
                  <motion.div
                    key={reward.day}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + index * 0.03 }}
                    className={`
                      flex flex-col items-center py-1.5 rounded-lg text-center
                      ${isPast ? 'bg-green-500/20 border-green-500/50' : ''}
                      ${isCurrent ? 'bg-primary/20 border border-primary scale-105' : 'border border-border/50'}
                      ${isFuture ? 'opacity-40' : ''}
                    `}
                  >
                    {isPast ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className={`text-[9px] font-bold mt-0.5 ${isCurrent ? 'text-primary' : ''}`}>
                      +{reward.points}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Today's reward highlight - compact */}
            <div className="bg-primary/10 rounded-xl p-3 mb-3 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">Today's Reward</p>
                  <p className="text-xl font-bold text-primary">+{todayReward?.points} pts</p>
                </div>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Gift className="w-8 h-8 text-primary" />
                </motion.div>
              </div>
            </div>

            {/* Claim button - smaller */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCheckIn}
              disabled={isClaiming || hasCheckedInToday}
              className={`
                w-full py-3 rounded-xl font-semibold text-base
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
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
