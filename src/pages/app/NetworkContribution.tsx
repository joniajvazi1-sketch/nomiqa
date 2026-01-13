import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Signal, 
  Pause,
  Wifi,
  CloudOff,
  Radio,
  Zap,
  Loader2,
  Activity
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNetworkContribution } from '@/hooks/useNetworkContribution';
import { useContributionHeatmap } from '@/hooks/useContributionHeatmap';
import { useGlobalCoverage } from '@/hooks/useGlobalCoverage';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { useSessionMilestones } from '@/hooks/useSessionMilestones';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { ContributionMap } from '@/components/app/ContributionMap';
import { RewardCelebration } from '@/components/app/RewardCelebration';
import { PullToRefreshIndicator } from '@/components/app/PullToRefreshIndicator';
import { SpeedTest } from '@/components/app/SpeedTest';
import { CarrierComparison } from '@/components/app/CarrierComparison';
import { cn } from '@/lib/utils';

type CoverageMode = 'personal' | 'global';

/**
 * Network Contribution - Clean Full-Screen Map Experience
 * Matches NATIX Drive& style: full-screen map with minimal overlays
 */
export const NetworkContribution: React.FC = () => {
  const { buttonTap, successPattern, pointsEarnedPattern } = useEnhancedHaptics();
  const { playCoin, playSuccess, playError } = useEnhancedSounds();
  const { checkAllMilestones, resetMilestones } = useSessionMilestones();
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPoints, setCelebrationPoints] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [coverageMode, setCoverageMode] = useState<CoverageMode>('personal');
  const [showSpeedTest, setShowSpeedTest] = useState(false);
  const [showCarrierComparison, setShowCarrierComparison] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  
  const {
    user,
    session,
    stats,
    isTracking,
    hasPermission,
    geoError,
    isOnline,
    connectionType,
    offlineQueueCount,
    lastPosition,
    isCellular,
    isPaused,
    startContribution,
    stopContribution,
    formatDuration
  } = useNetworkContribution();

  const { 
    points: heatmapPoints, 
    refresh: refreshHeatmap
  } = useContributionHeatmap();

  const {
    data: globalCoverageData,
    loading: globalCoverageLoading,
    refresh: refreshGlobalCoverage,
    networkFilter,
    setNetworkFilter,
  } = useGlobalCoverage({
    autoRefresh: coverageMode === 'global',
    refreshInterval: 60000,
  });

  const isActive = session.status === 'active';
  
  const userPosition: [number, number] | null = lastPosition 
    ? [lastPosition.coords.latitude, lastPosition.coords.longitude]
    : null;

  // Check milestones during active session
  useEffect(() => {
    if (isActive && isCellular) {
      const elapsedMinutes = stats.duration / 60;
      const estimatedDistanceMeters = stats.dataPointsCount * 10;
      checkAllMilestones(stats.pointsEarned, elapsedMinutes, estimatedDistanceMeters);
    }
  }, [isActive, isCellular, stats.pointsEarned, stats.duration, stats.dataPointsCount, checkAllMilestones]);

  useEffect(() => {
    if (!isActive) {
      resetMilestones();
    }
  }, [isActive, resetMilestones]);

  const handleStopContribution = useCallback(() => {
    if (stats.pointsEarned > 0) {
      setCelebrationPoints(stats.pointsEarned);
      setShowCelebration(true);
    }
    stopContribution();
    resetMilestones();
  }, [stats.pointsEarned, stopContribution, resetMilestones]);

  const getConnectionLabel = () => {
    if (!isOnline) return 'Offline';
    const connStr = String(connectionType).toLowerCase();
    if (connStr.includes('5g')) return '5G';
    if (connStr.includes('4g') || connStr.includes('lte')) return 'LTE';
    if (connStr.includes('3g')) return '3G';
    if (connStr.includes('wifi')) return 'WiFi';
    return 'Cellular';
  };

  const handleToggleHeatmap = useCallback(() => {
    buttonTap();
    setShowHeatmap(prev => !prev);
    if (!showHeatmap) refreshHeatmap();
  }, [showHeatmap, buttonTap, refreshHeatmap]);

  const handleToggleCoverageMode = useCallback(() => {
    buttonTap();
    setCoverageMode(prev => {
      const next = prev === 'personal' ? 'global' : 'personal';
      if (next === 'global') refreshGlobalCoverage(true);
      return next;
    });
  }, [buttonTap, refreshGlobalCoverage]);

  const handleNetworkFilterChange = useCallback((filter: '5g' | 'lte' | '3g' | null) => {
    buttonTap();
    setNetworkFilter(filter);
  }, [buttonTap, setNetworkFilter]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshHeatmap(), refreshGlobalCoverage(true)]);
  }, [refreshHeatmap, refreshGlobalCoverage]);

  const { isRefreshing, pullDistance, pullProgress, handlers } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  return (
    <div className="relative w-full h-full min-h-screen bg-background">
      {/* Full-screen map */}
      <div className="absolute inset-0 z-0">
        <ContributionMap 
          userPosition={userPosition} 
          isActive={isActive && isCellular}
          heatmapPoints={heatmapPoints}
          showHeatmap={showHeatmap}
          onToggleHeatmap={handleToggleHeatmap}
          globalCoverage={globalCoverageData?.cells || []}
          coverageMode={coverageMode}
          onToggleCoverageMode={handleToggleCoverageMode}
          globalCoverageLoading={globalCoverageLoading}
          networkFilter={networkFilter}
          onNetworkFilterChange={handleNetworkFilterChange}
        />
      </div>
      
      {/* Celebration */}
      <RewardCelebration 
        trigger={showCelebration} 
        points={celebrationPoints}
        type="session-end"
        onComplete={() => setShowCelebration(false)}
      />
      
      {/* Minimal UI overlay */}
      <div 
        className="relative z-10 flex flex-col min-h-screen"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
          paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 0.5rem)'
        }}
        {...handlers}
      >
        <PullToRefreshIndicator 
          pullDistance={pullDistance}
          pullProgress={pullProgress}
          isRefreshing={isRefreshing}
        />
        
        {/* Top Status Bar - Floating capsule */}
        <div className="px-4 flex items-center justify-between mb-2">
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full border',
            'bg-card/90 backdrop-blur-md shadow-sm',
            isActive && isCellular ? 'border-primary/30' : 'border-border'
          )}>
            <div className={cn(
              'w-2 h-2 rounded-full',
              isActive && isCellular ? 'bg-primary animate-pulse' : 
              isActive ? 'bg-amber-500 animate-pulse' : 'bg-muted-foreground'
            )} />
            
            <span className={cn(
              'text-xs font-medium',
              isActive && isCellular ? 'text-primary' : 'text-foreground'
            )}>
              {getConnectionLabel()}
            </span>
            
            {isActive && (
              <>
                <div className="w-px h-3 bg-border" />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatDuration(stats.duration)}
                </span>
              </>
            )}
          </div>
          
          {/* Compact Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                buttonTap();
                setShowSpeedTest(prev => !prev);
                if (!showSpeedTest) setShowCarrierComparison(false);
              }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border',
                'bg-card/90 backdrop-blur-md shadow-sm transition-colors',
                showSpeedTest ? 'border-primary/50 text-primary' : 'border-border text-muted-foreground'
              )}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Speed</span>
            </button>
            <button
              onClick={() => {
                buttonTap();
                setShowCarrierComparison(prev => !prev);
                if (!showCarrierComparison) setShowSpeedTest(false);
              }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border',
                'bg-card/90 backdrop-blur-md shadow-sm transition-colors',
                showCarrierComparison ? 'border-primary/50 text-primary' : 'border-border text-muted-foreground'
              )}
            >
              <Signal className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium">Carriers</span>
            </button>
          </div>
        </div>

        {/* WiFi Warning - Compact banner */}
        {isActive && !isCellular && (
          <div className="mx-4 rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 mb-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-amber-500" />
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-600">Paused - WiFi detected</p>
                <p className="text-[10px] text-amber-500/80">Switch to cellular to earn</p>
              </div>
            </div>
          </div>
        )}

        {/* Offline Warning */}
        {!isOnline && (
          <Alert className="mx-4 border-amber-500/30 bg-amber-500/10 mb-3">
            <CloudOff className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-600 text-xs">
              Offline • {offlineQueueCount} points queued
            </AlertDescription>
          </Alert>
        )}

        {/* Speed Test Panel */}
        {showSpeedTest && (
          <div className="mx-4 mb-3 animate-fade-in">
            <SpeedTest
              latitude={lastPosition?.coords.latitude}
              longitude={lastPosition?.coords.longitude}
              networkType={String(connectionType)}
              carrier={undefined}
              onPointsEarned={(pts) => {
                playCoin();
              }}
            />
          </div>
        )}

        {/* Carrier Comparison Panel */}
        {showCarrierComparison && (
          <div className="mx-4 mb-3 animate-fade-in">
            <CarrierComparison
              latitude={lastPosition?.coords.latitude}
              longitude={lastPosition?.coords.longitude}
              radiusKm={15}
            />
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Control Area - Fixed at bottom, centered */}
        <div className="px-4">
          {/* Pre-scan encouragement */}
          {!isActive && user && (
            <div className="text-center mb-4 animate-fade-in">
              <p className="text-base font-medium text-foreground mb-0.5">Ready when you are</p>
              <p className="text-xs text-muted-foreground">
                {isCellular ? 'Tap to start earning points' : 'Connect to cellular to earn'}
              </p>
            </div>
          )}

          {/* Center Points Display - Large and prominent */}
          {isActive && isCellular && (
            <div className="text-center mb-4 animate-fade-in">
              <div className="text-4xl font-bold text-primary tabular-nums">
                +{stats.pointsEarned.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">points earned</p>
            </div>
          )}

          {/* Main Button - Centered, prominent */}
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="relative">
              {/* Pulse ring when not active */}
              {!isActive && user && isCellular && (
                <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
              )}
              
              <button
                ref={startButtonRef}
                onClick={() => {
                  buttonTap();
                  if (isActive) {
                    handleStopContribution();
                    playSuccess();
                  } else {
                    startContribution();
                    playCoin();
                  }
                }}
                disabled={!user}
                className={cn(
                  'w-16 h-16 rounded-full relative z-10',
                  'flex items-center justify-center',
                  'shadow-lg active:scale-95',
                  'border-2 transition-all duration-200',
                  isActive 
                    ? isPaused
                      ? 'bg-amber-500/20 border-amber-400/50' 
                      : 'bg-primary/20 border-primary/50' 
                    : 'bg-primary/10 border-primary/30',
                  !user && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isActive ? (
                  isPaused ? (
                    <Wifi className="w-6 h-6 text-amber-400" />
                  ) : (
                    <Pause className="w-6 h-6 text-primary" />
                  )
                ) : (
                  <Radio className="w-6 h-6 text-primary" />
                )}
              </button>
            </div>

            <p className={cn(
              'text-xs font-medium',
              isActive && isCellular ? 'text-primary' : 'text-muted-foreground'
            )}>
              {isActive ? (isPaused ? 'Paused' : 'Scanning...') : 'Tap to Start'}
            </p>
            
            {!user && (
              <p className="text-[10px] text-muted-foreground">Sign in required</p>
            )}
          </div>

          {/* Session Stats - Compact card */}
          {isActive && (
            <div className="rounded-xl bg-card/90 backdrop-blur-md border border-border p-3 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-foreground">Session</span>
                </div>
                <span className="text-xs font-bold text-primary tabular-nums">
                  +{stats.pointsEarned.toFixed(1)} pts
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <div className="text-center py-1.5 px-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground block">Time</span>
                  <span className="font-medium text-foreground">+{stats.timePoints.toFixed(1)}</span>
                </div>
                <div className="text-center py-1.5 px-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground block">Distance</span>
                  <span className="font-medium text-foreground">+{stats.distancePoints.toFixed(1)}</span>
                </div>
                <div className="text-center py-1.5 px-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground block">Data</span>
                  <span className="font-medium text-foreground">{stats.dataPointsCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Geo Error */}
        {geoError && (
          <Alert className="mx-4 border-red-500/30 bg-red-500/10 mt-2">
            <AlertDescription className="text-red-500 text-xs">{geoError}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default NetworkContribution;
