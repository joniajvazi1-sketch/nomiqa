import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Flame, Calendar, Star } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useChallenges } from '@/hooks/useChallenges';
import { ChallengeCard } from '@/components/app/ChallengeCard';
import { useTranslation } from '@/contexts/TranslationContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/app/PullToRefreshIndicator';

export const AppChallenges: React.FC = () => {
  const navigate = useNavigate();
  const { lightTap } = useHaptics();
  const { t } = useTranslation();
  const { 
    dailyChallenges, 
    weeklyChallenges, 
    specialChallenges,
    completedTodayCount,
    unclaimedCount,
    claimReward,
    loading,
    refreshProgress
  } = useChallenges();

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
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-card/80 border border-border p-4 text-center">
            <Star className="w-5 h-5 text-yellow-500 mx-auto mb-2" fill="currentColor" />
            <div className="text-xl font-bold text-foreground">{completedTodayCount}</div>
            <div className="text-xs text-muted-foreground">{t('app.challenges.dailyDone')}</div>
          </div>
          <div className="rounded-2xl bg-card/80 border border-border p-4 text-center">
            <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-foreground">{weeklyChallenges.length}</div>
            <div className="text-xs text-muted-foreground">{t('app.challenges.weekly')}</div>
          </div>
          <div className="rounded-2xl bg-card/80 border border-border p-4 text-center">
            <Star className="w-5 h-5 text-purple-500 mx-auto mb-2" />
            <div className="text-xl font-bold text-foreground">{specialChallenges.length}</div>
            <div className="text-xs text-muted-foreground">{t('app.challenges.special')}</div>
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

            {/* Special Challenges */}
            {specialChallenges.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-purple-500" />
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t('app.challenges.special')}</h2>
                </div>
                <div className="space-y-3">
                  {specialChallenges.map((c) => (
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
            {dailyChallenges.length === 0 && weeklyChallenges.length === 0 && specialChallenges.length === 0 && (
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
