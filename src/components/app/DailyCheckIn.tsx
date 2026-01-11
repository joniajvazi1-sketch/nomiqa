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
  { day: 1, points: 10, label: 'Day 1' },
  { day: 2, points: 15, label: 'Day 2' },
  { day: 3, points: 25, label: 'Day 3' },
  { day: 4, points: 30, label: 'Day 4' },
  { day: 5, points: 40, label: 'Day 5' },
  { day: 6, points: 50, label: 'Day 6' },
  { day: 7, points: 100, label: 'Day 7' },
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
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm bg-card rounded-3xl p-6 shadow-2xl border border-border overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/20 to-transparent" />
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-lg"
            >
              <Gift className="w-10 h-10 text-white" />
            </motion.div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center mb-2">Daily Check-in</h2>
            <p className="text-center text-muted-foreground mb-6">
              Claim your daily reward!
            </p>

            {/* Streak indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-lg font-semibold">
                {currentStreak > 0 ? `${currentStreak} day streak` : 'Start your streak!'}
              </span>
            </div>

            {/* Week progress */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {STREAK_REWARDS.map((reward, index) => {
                const isPast = index < currentStreak % 7;
                const isCurrent = index === nextStreakDay - 1;
                const isFuture = index > nextStreakDay - 1;

                return (
                  <motion.div
                    key={reward.day}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className={`
                      flex flex-col items-center p-2 rounded-xl text-center
                      ${isPast ? 'bg-green-500/20 border-green-500/50' : ''}
                      ${isCurrent ? 'bg-primary/20 border-2 border-primary scale-110' : 'border border-border'}
                      ${isFuture ? 'opacity-50' : ''}
                    `}
                  >
                    {isPast ? (
                      <Check className="w-4 h-4 text-green-500 mb-1" />
                    ) : (
                      <Calendar className="w-4 h-4 text-muted-foreground mb-1" />
                    )}
                    <span className="text-[10px] text-muted-foreground">{reward.label}</span>
                    <span className={`text-xs font-bold ${isCurrent ? 'text-primary' : ''}`}>
                      +{reward.points}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Today's reward highlight */}
            <div className="bg-primary/10 rounded-2xl p-4 mb-6 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Reward</p>
                  <p className="text-2xl font-bold text-primary">+{todayReward?.points} pts</p>
                </div>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Gift className="w-10 h-10 text-primary" />
                </motion.div>
              </div>
            </div>

            {/* Claim button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCheckIn}
              disabled={isClaiming || hasCheckedInToday}
              className={`
                w-full py-4 rounded-2xl font-semibold text-lg
                transition-all duration-200
                ${hasCheckedInToday
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg'
                }
                disabled:opacity-70
              `}
            >
              {isClaiming ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Claiming...
                </span>
              ) : hasCheckedInToday ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
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
