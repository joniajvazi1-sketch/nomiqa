import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { LeaderboardSection } from '@/components/app/LeaderboardSection';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranslation } from '@/contexts/TranslationContext';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/app/PullToRefreshIndicator';

export const AppLeaderboard: React.FC = () => {
  const navigate = useNavigate();
  const { lightTap } = useHaptics();
  const { t } = useTranslation();
  const { refresh } = useLeaderboard();

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const { isRefreshing, pullDistance, pullProgress, handlers } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-[hsl(220,40%,10%)] via-[hsl(220,40%,8%)] to-[hsl(220,45%,6%)] overflow-y-auto app-container momentum-scroll"
      {...handlers}
    >
      <PullToRefreshIndicator 
        isRefreshing={isRefreshing} 
        pullDistance={pullDistance} 
        pullProgress={pullProgress} 
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/5 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { lightTap(); navigate(-1); }}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">{t('app.leaderboard')}</h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6 pb-24">
        <LeaderboardSection compact={false} />
      </div>
    </div>
  );
};
