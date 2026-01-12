import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Lock } from 'lucide-react';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { useAchievements } from '@/hooks/useAchievements';
import { AchievementBadge, StreakBonus } from '@/components/app/AchievementSystem';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/TranslationContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/app/PullToRefreshIndicator';
import { AnimatedCard } from '@/components/app/PageTransition';

export const AppAchievements: React.FC = () => {
  const navigate = useNavigate();
  const { buttonTap, navigationTap, achievementPattern } = useEnhancedHaptics();
  const { playCelebration, playSwoosh } = useEnhancedSounds();
  const { t } = useTranslation();
  const { 
    achievements, 
    unlockedCount, 
    totalCount, 
    streakDays,
    loading,
    refreshAchievements
  } = useAchievements();

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await refreshAchievements();
  }, [refreshAchievements]);

  const { isRefreshing, pullDistance, pullProgress, handlers } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  // Group achievements by category
  const grouped = achievements.reduce((acc, achievement) => {
    const category = achievement.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, typeof achievements>);

  const categoryLabels: Record<string, string> = {
    contribution: 'Contributions',
    streak: 'Streaks',
    referral: 'Referrals',
    milestone: 'Milestones',
    other: 'Other'
  };

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
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-5 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { navigationTap(); playSwoosh(); navigate(-1); }}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-card/80 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t('app.achievements')}</h1>
            <p className="text-sm text-muted-foreground">{unlockedCount} {t('app.achievements.of')} {totalCount} {t('app.achievements.unlocked')}</p>
          </div>
        </div>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Streak Bonus */}
        {streakDays >= 1 && (
          <StreakBonus streakDays={streakDays} isActive={true} />
        )}

        {/* Progress Overview */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{unlockedCount}</div>
                <div className="text-sm text-muted-foreground">{t('app.achievements.unlocked')}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-muted-foreground">{totalCount - unlockedCount}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                <Lock className="w-3 h-3" />
                {t('app.achievements.locked')}
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Achievement Categories */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {categoryLabels[category] || category}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {items.map((achievement, index) => (
                  <AnimatedCard key={achievement.id} delay={index * 0.05}>
                    <div 
                      className={cn(
                        "flex flex-col items-center p-3 rounded-2xl border transition-all",
                        achievement.unlocked 
                          ? "bg-white/[0.05] border-primary/20" 
                          : "bg-white/[0.02] border-white/[0.05] opacity-60"
                      )}
                      onClick={() => {
                        if (achievement.unlocked) {
                          achievementPattern();
                          playCelebration();
                        }
                      }}
                    >
                      <AchievementBadge 
                        achievement={achievement} 
                        size="md"
                        showProgress={!achievement.unlocked}
                        showDetailsOnTap={true}
                      />
                      {!achievement.unlocked && achievement.progress !== undefined && (
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {Math.round(achievement.progress)}%
                        </span>
                      )}
                    </div>
                  </AnimatedCard>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AppAchievements;
