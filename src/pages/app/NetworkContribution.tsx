import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { 
  Signal, 
  Pause,
  Wifi,
  CloudOff,
  Radio,
  Zap,
  Activity,
  Globe,
  Map,
  Play,
  ChevronUp,
  Layers,
  RefreshCw
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
import { DataConsentModal, hasDataConsent } from '@/components/app/DataConsentModal';
import { cn } from '@/lib/utils';

// Lazy load the 3D globe
const NetworkGlobe = lazy(() => import('@/components/app/NetworkGlobe'));

type CoverageMode = 'personal' | 'global';

/**
 * Network Contribution - Premium Map Experience
 * Clean, immersive full-screen design
 */
export const NetworkContribution: React.FC = () => {
  const { buttonTap, successPattern } = useEnhancedHaptics();
  const { playCoin, playSuccess } = useEnhancedSounds();
  const { checkAllMilestones, resetMilestones } = useSessionMilestones();
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPoints, setCelebrationPoints] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [coverageMode, setCoverageMode] = useState<CoverageMode>('personal');
  const [showSpeedTest, setShowSpeedTest] = useState(false);
  const [showCarrierComparison, setShowCarrierComparison] = useState(false);
  const [consentGiven, setConsentGiven] = useState(() => hasDataConsent());
  const [showTools, setShowTools] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  
  const {
    user,
    session,
    stats,
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
    <div className="relative w-full h-full min-h-screen bg-background overflow-hidden">
      {/* Full-screen map/globe */}
      <div className="absolute inset-0 z-0">
        {coverageMode === 'global' ? (
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-background">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Loading global network...</p>
              </div>
            </div>
          }>
            <NetworkGlobe 
              coverageData={globalCoverageData?.cells || []}
              loading={globalCoverageLoading}
              totalDataPoints={globalCoverageData?.totalDataPoints || 0}
              uniqueLocations={globalCoverageData?.uniqueLocations || 0}
              coverageAreaKm2={globalCoverageData?.coverageAreaKm2 || 0}
            />
          </Suspense>
        ) : (
          <ContributionMap 
            userPosition={userPosition} 
            isActive={isActive && isCellular}
            heatmapPoints={heatmapPoints}
            showHeatmap={showHeatmap}
            onToggleHeatmap={handleToggleHeatmap}
            globalCoverage={[]}
            coverageMode={coverageMode}
            onToggleCoverageMode={handleToggleCoverageMode}
            globalCoverageLoading={false}
            networkFilter={networkFilter}
            onNetworkFilterChange={handleNetworkFilterChange}
          />
        )}
      </div>

      {/* Gradient overlay for better text visibility */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/70 to-transparent" />
      </div>
      
      {/* GDPR Consent Modal */}
      {!consentGiven && (
        <DataConsentModal onConsentComplete={() => setConsentGiven(true)} />
      )}
      
      {/* Celebration */}
      <RewardCelebration 
        trigger={showCelebration} 
        points={celebrationPoints}
        type="session-end"
        onComplete={() => setShowCelebration(false)}
      />
      
      {/* UI overlay */}
      <div 
        className="relative z-10 flex flex-col h-full"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
          paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 1rem)',
          minHeight: '100vh'
        }}
        {...handlers}
      >
        <PullToRefreshIndicator 
          pullDistance={pullDistance}
          pullProgress={pullProgress}
          isRefreshing={isRefreshing}
        />
        
        {/* Top Bar - Clean floating style */}
        <div className="px-4 flex items-center justify-between">
          {/* Left: Connection Status */}
          <div className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-2xl',
            'bg-card/80 backdrop-blur-xl border shadow-lg',
            isActive && isCellular ? 'border-primary/40' : 'border-white/10'
          )}>
            <div className={cn(
              'w-2.5 h-2.5 rounded-full',
              isActive && isCellular ? 'bg-primary animate-pulse shadow-lg shadow-primary/50' : 
              isActive ? 'bg-amber-500 animate-pulse' : 'bg-muted-foreground/50'
            )} />
            <span className={cn(
              'text-sm font-semibold',
              isActive && isCellular ? 'text-primary' : 'text-foreground'
            )}>
              {getConnectionLabel()}
            </span>
            {isActive && (
              <>
                <div className="w-px h-4 bg-border/50" />
                <span className="text-sm font-mono text-muted-foreground">
                  {formatDuration(stats.duration)}
                </span>
              </>
            )}
          </div>
          
          {/* Right: Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleCoverageMode}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-2xl',
                'bg-card/80 backdrop-blur-xl border shadow-lg transition-all',
                coverageMode === 'global' 
                  ? 'border-primary/40 text-primary' 
                  : 'border-white/10 text-foreground hover:border-white/20'
              )}
            >
              {coverageMode === 'global' ? (
                <Globe className="w-4 h-4" />
              ) : (
                <Map className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {coverageMode === 'global' ? 'Global' : 'My Map'}
              </span>
            </button>
            
            <button
              onClick={() => {
                buttonTap();
                handleRefresh();
              }}
              disabled={isRefreshing}
              className={cn(
                'p-2 rounded-xl bg-card/80 backdrop-blur-xl border border-white/10 shadow-lg',
                'transition-all hover:border-white/20',
                isRefreshing && 'animate-spin'
              )}
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Warnings */}
        {isActive && !isCellular && (
          <div className="mx-4 mt-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 p-3 backdrop-blur-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-600">Paused • WiFi Detected</p>
                <p className="text-xs text-amber-500/80">Switch to cellular data to earn points</p>
              </div>
            </div>
          </div>
        )}

        {!isOnline && (
          <div className="mx-4 mt-3">
            <Alert className="border-amber-500/30 bg-amber-500/10 backdrop-blur-sm rounded-2xl">
              <CloudOff className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-600 text-sm">
                Offline mode • {offlineQueueCount} points queued
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Tool Panels */}
        {showSpeedTest && (
          <div className="mx-4 mt-3 animate-fade-in">
            <SpeedTest
              latitude={lastPosition?.coords.latitude}
              longitude={lastPosition?.coords.longitude}
              networkType={String(connectionType)}
              carrier={undefined}
              onPointsEarned={() => playCoin()}
            />
          </div>
        )}

        {showCarrierComparison && (
          <div className="mx-4 mt-3 animate-fade-in">
            <CarrierComparison
              latitude={lastPosition?.coords.latitude}
              longitude={lastPosition?.coords.longitude}
              radiusKm={15}
            />
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom Control Panel */}
        <div className="px-4">
          {/* Live Points Counter - when active */}
          {isActive && isCellular && (
            <div className="text-center mb-4 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm">
                <Zap className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-2xl font-bold text-primary tabular-nums">
                  +{stats.pointsEarned.toFixed(1)}
                </span>
                <span className="text-sm text-primary/70">pts</span>
              </div>
            </div>
          )}

          {/* Main Control Button */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              {/* Outer glow ring */}
              {!isActive && user && consentGiven && (
                <div className="absolute inset-[-16px] rounded-full">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-2 rounded-full border-2 border-primary/30 animate-pulse" />
                </div>
              )}
              
              {isActive && isCellular && (
                <div className="absolute inset-[-16px] rounded-full">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-[ping_1.5s_ease-out_infinite]" />
                  <div className="absolute inset-4 rounded-full border border-primary/30 animate-[ping_1.5s_ease-out_infinite_0.5s]" />
                </div>
              )}
              
              <button
                ref={startButtonRef}
                onClick={() => {
                  buttonTap();
                  if (isActive) {
                    handleStopContribution();
                    playSuccess();
                  } else {
                    if (!consentGiven) return;
                    startContribution();
                    playCoin();
                  }
                }}
                disabled={!user || (!consentGiven && !isActive)}
                className={cn(
                  'w-20 h-20 rounded-full relative z-10',
                  'flex items-center justify-center',
                  'shadow-2xl active:scale-95',
                  'transition-all duration-300',
                  isActive 
                    ? isPaused
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30' 
                      : 'bg-gradient-to-br from-primary to-primary/80 shadow-primary/40' 
                    : 'bg-gradient-to-br from-primary to-primary/80 hover:scale-105 shadow-primary/30',
                  !user && 'opacity-40 cursor-not-allowed'
                )}
              >
                {isActive ? (
                  isPaused ? (
                    <Wifi className="w-8 h-8 text-white drop-shadow-lg" />
                  ) : (
                    <Pause className="w-8 h-8 text-white drop-shadow-lg" />
                  )
                ) : (
                  <Play className="w-8 h-8 text-white drop-shadow-lg ml-1" />
                )}
              </button>
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center mb-4">
            <p className="text-lg font-bold text-foreground">
              {isActive 
                ? (isPaused ? 'Paused' : 'Scanning Network...') 
                : 'Start Scanning'}
            </p>
            {!isActive && user && consentGiven && (
              <p className="text-sm text-muted-foreground mt-1">
                {isCellular ? 'Tap to earn points' : 'Connect to cellular'}
              </p>
            )}
            {!user && (
              <p className="text-sm text-muted-foreground mt-1">Sign in to start</p>
            )}
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              onClick={() => {
                buttonTap();
                setShowTools(!showTools);
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl',
                'bg-card/80 backdrop-blur-xl border shadow-lg transition-all',
                showTools ? 'border-primary/40 text-primary' : 'border-white/10 text-muted-foreground'
              )}
            >
              <Layers className="w-4 h-4" />
              <span className="text-sm font-medium">Tools</span>
              <ChevronUp className={cn(
                'w-4 h-4 transition-transform',
                showTools ? 'rotate-180' : ''
              )} />
            </button>
          </div>

          {/* Expandable Tools */}
          {showTools && (
            <div className="flex items-center justify-center gap-2 mb-4 animate-fade-in">
              <button
                onClick={() => {
                  buttonTap();
                  setShowSpeedTest(prev => !prev);
                  if (!showSpeedTest) setShowCarrierComparison(false);
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl',
                  'bg-card/80 backdrop-blur-xl border shadow-lg transition-all',
                  showSpeedTest ? 'border-primary/40 text-primary' : 'border-white/10 text-foreground'
                )}
              >
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">Speed Test</span>
              </button>
              
              <button
                onClick={() => {
                  buttonTap();
                  setShowCarrierComparison(prev => !prev);
                  if (!showCarrierComparison) setShowSpeedTest(false);
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl',
                  'bg-card/80 backdrop-blur-xl border shadow-lg transition-all',
                  showCarrierComparison ? 'border-primary/40 text-primary' : 'border-white/10 text-foreground'
                )}
              >
                <Signal className="w-4 h-4" />
                <span className="text-sm font-medium">Compare</span>
              </button>
            </div>
          )}

          {/* Session Stats Card - when active */}
          {isActive && (
            <div className="rounded-2xl bg-card/80 backdrop-blur-xl border border-white/10 p-4 shadow-xl animate-fade-in">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {formatDuration(stats.duration)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Duration</p>
                </div>
                <div className="text-center border-x border-border/50">
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {stats.dataPointsCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Data Points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary tabular-nums">
                    +{stats.pointsEarned.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Points</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Geo Error */}
        {geoError && (
          <div className="px-4 mt-3">
            <Alert className="border-red-500/30 bg-red-500/10 backdrop-blur-sm rounded-2xl">
              <AlertDescription className="text-red-400 text-sm">{geoError}</AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkContribution;
