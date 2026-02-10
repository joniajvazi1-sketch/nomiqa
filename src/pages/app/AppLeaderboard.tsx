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

  const { isRefreshing, pullDistance, pullProgress, containerRef } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  return (
    <div 
      className="bg-background app-container"
      style={{ paddingBottom: '140px', touchAction: 'pan-y' }}
      ref={containerRef}
    >
      <PullToRefreshIndicator 
        isRefreshing={isRefreshing} 
        pullDistance={pullDistance} 
        pullProgress={pullProgress} 
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { lightTap(); navigate(-1); }}
            className="w-10 h-10 rounded-full bg-muted backdrop-blur-sm border border-border flex items-center justify-center hover:bg-muted/80 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{t('app.leaderboard')}</h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6" style={{ paddingBottom: '140px' }}>
        <LeaderboardSection compact={false} />
      </div>
    </div>
  );
};
