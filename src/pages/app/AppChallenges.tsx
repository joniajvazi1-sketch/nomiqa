import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Calendar, Star, Trophy, Sparkles, Flame, Zap } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useChallenges } from '@/hooks/useChallenges';
import { ChallengeCard } from '@/components/app/ChallengeCard';
import { useTranslation } from '@/contexts/TranslationContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/app/PullToRefreshIndicator';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export const AppChallenges: React.FC = () => {
  const navigate = useNavigate();
  const { lightTap, heavyTap } = useHaptics();
  const { t } = useTranslation();
  const { 
    dailyChallenges, 
    weeklyChallenges,
    completedTodayCount,
    unclaimedCount,
    claimReward,
    loading,
    refreshProgress,
    dailyChallengeStreak,
    streakBonusPercent
  } = useChallenges();

  const [showCelebration, setShowCelebration] = useState(false);
  const [hasSeenCelebration, setHasSeenCelebration] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return localStorage.getItem('dailyChallengesCelebration') === today;
  });

  // Calculate progress percentage
  const dailyProgressPercent = dailyChallenges.length > 0 
    ? (completedTodayCount / dailyChallenges.length) * 100 
    : 0;

  const allDailyCompleted = dailyChallenges.length > 0 && completedTodayCount === dailyChallenges.length;

  // Get motivational message based on progress
  const motivationalMessage = useMemo(() => {
    if (dailyChallenges.length === 0) return null;
    
    if (allDailyCompleted) {
      return { text: "🎉 You crushed it today!", color: "text-green-500" };
    }
    
    if (dailyProgressPercent >= 66) {
      return { text: "🔥 Almost there! One more push!", color: "text-orange-500" };
    }
    
    if (dailyProgressPercent >= 33) {
      return { text: "💪 Great progress! Keep going!", color: "text-blue-500" };
    }
    
    if (completedTodayCount > 0) {
      return { text: "⚡ Nice start! You've got this!", color: "text-primary" };
    }
    
    return { text: "🚀 Ready to earn? Let's go!", color: "text-muted-foreground" };
  }, [dailyChallenges.length, completedTodayCount, dailyProgressPercent, allDailyCompleted]);

  // Trigger celebration when all daily challenges completed
  useEffect(() => {
    if (allDailyCompleted && !hasSeenCelebration && !loading) {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('dailyChallengesCelebration', today);
      setHasSeenCelebration(true);
      setShowCelebration(true);
      heavyTap();
      
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [allDailyCompleted, hasSeenCelebration, loading, heavyTap]);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await refreshProgress();
  }, [refreshProgress]);

  const { isRefreshing, pullDistance, pullProgress, handlers } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  return (
    <div 
      className="min-h-screen bg-background pb-28 overflow-y-auto app-container momentum-scroll"
      {...handlers}
    >
      <PullToRefreshIndicator 
        isRefreshing={isRefreshing} 
        pullDistance={pullDistance} 
        pullProgress={pullProgress} 
      />

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
              className="text-center p-8"
            >
              {/* Animated trophy */}
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 0.5, 
                  repeat: 2,
                  repeatType: "reverse"
                }}
                className="relative inline-block mb-6"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                {/* Sparkle effects */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ 
                      scale: [0, 1.5, 0],
                      opacity: [1, 1, 0],
                      x: Math.cos(i * 45 * Math.PI / 180) * 60,
                      y: Math.sin(i * 45 * Math.PI / 180) * 60
                    }}
                    transition={{ 
                      duration: 1,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                ))}
              </motion.div>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-foreground mb-2"
              >
                All Daily Challenges Complete!
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground mb-4"
              >
                You're on fire! Come back tomorrow for more.
              </motion.p>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-muted-foreground"
              >
                Tap anywhere to continue
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-5 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { lightTap(); navigate(-1); }}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-card/80 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('app.challenges')}</h1>
            <p className="text-sm text-muted-foreground">
              {unclaimedCount > 0 ? `${unclaimedCount} ${t('app.challenges.rewardsToClaim')}` : t('app.challenges.completeToEarn')}
            </p>
          </div>
        </div>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Motivational Banner */}
        {motivationalMessage && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-xl p-4 text-center border",
              allDailyCompleted 
                ? "bg-green-500/10 border-green-500/30" 
                : "bg-card/60 border-border"
            )}
          >
            <p className={cn("text-sm font-medium", motivationalMessage.color)}>
              {motivationalMessage.text}
            </p>
            {!allDailyCompleted && dailyChallenges.length > 0 && (
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${dailyProgressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* Streak Bonus Card */}
        {streakBonusPercent > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground">{dailyChallengeStreak} Day Streak</span>
                  <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 text-xs font-bold">
                    +{streakBonusPercent}% BONUS
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete all daily challenges to keep your streak!
                </p>
              </div>
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className={cn(
            "rounded-2xl border p-4 text-center transition-all",
            allDailyCompleted 
              ? "bg-green-500/10 border-green-500/30" 
              : "bg-card/80 border-border"
          )}>
            <Star className={cn(
              "w-5 h-5 mx-auto mb-2",
              allDailyCompleted ? "text-green-500" : "text-yellow-500"
            )} fill="currentColor" />
            <div className="text-xl font-bold text-foreground">{completedTodayCount}/{dailyChallenges.length}</div>
            <div className="text-xs text-muted-foreground">{t('app.challenges.dailyDone')}</div>
          </div>
          <div className={cn(
            "rounded-2xl border p-4 text-center transition-all",
            dailyChallengeStreak > 0
              ? "bg-orange-500/10 border-orange-500/30"
              : "bg-card/80 border-border"
          )}>
            <Flame className={cn(
              "w-5 h-5 mx-auto mb-2",
              dailyChallengeStreak > 0 ? "text-orange-500" : "text-muted-foreground"
            )} />
            <div className="text-xl font-bold text-foreground">{dailyChallengeStreak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Daily Challenges */}
            {dailyChallenges.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t('app.challenges.daily')}</h2>
                  <span className="text-xs text-muted-foreground ml-auto">{t('app.challenges.resetsIn24h')}</span>
                </div>
                <div className="space-y-3">
                  {dailyChallenges.map((c) => (
                    <ChallengeCard
                      key={c.id}
                      id={c.id}
                      type={c.type}
                      title={c.title}
                      description={c.description}
                      targetValue={c.target_value}
                      rewardPoints={c.reward_points}
                      bonusPoints={c.bonusPoints}
                      metricType={c.metric_type}
                      progress={c.progress}
                      isCompleted={c.isCompleted}
                      isClaimed={c.isClaimed}
                      onClaim={claimReward}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Weekly Challenges */}
            {weeklyChallenges.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t('app.challenges.weekly')}</h2>
                  <span className="text-xs text-muted-foreground ml-auto">{t('app.challenges.resetsSunday')}</span>
                </div>
                <div className="space-y-3">
                  {weeklyChallenges.map((c) => (
                    <ChallengeCard
                      key={c.id}
                      id={c.id}
                      type={c.type}
                      title={c.title}
                      description={c.description}
                      targetValue={c.target_value}
                      rewardPoints={c.reward_points}
                      metricType={c.metric_type}
                      progress={c.progress}
                      isCompleted={c.isCompleted}
                      isClaimed={c.isClaimed}
                      onClaim={claimReward}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {dailyChallenges.length === 0 && weeklyChallenges.length === 0 && (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('app.challenges.noChallenges')}</h3>
                <p className="text-sm text-muted-foreground">{t('app.challenges.checkBackLater')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AppChallenges;