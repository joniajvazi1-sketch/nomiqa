import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { 
  Pause,
  Wifi,
  CloudOff,
  Zap,
  Globe,
  Map,
  Play,
  ChevronUp,
  Layers,
  Gauge,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { buttonTap, successPattern } = useEnhancedHaptics();
  const { playCoin, playSuccess } = useEnhancedSounds();
  const { checkAllMilestones, resetMilestones } = useSessionMilestones();
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPoints, setCelebrationPoints] = useState(0);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [coverageMode, setCoverageMode] = useState<CoverageMode>('global'); // Default to globe view
  const [consentGiven, setConsentGiven] = useState(() => hasDataConsent());
  const [showConsentModal, setShowConsentModal] = useState(false);
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
    formatDuration,
    triggerManualSpeedTest
  } = useNetworkContribution();

  const [isRunningSpeedTest, setIsRunningSpeedTest] = useState(false);

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
            <div className="w-full h-full flex items-center justify-center bg-[#0a0f1a]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
                <p className="text-sm text-white/60">Loading global network...</p>
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

      {/* Bottom gradient overlay for controls visibility */}
      <div className="absolute inset-0 pointer-events-none z-[1]">
        <div className="absolute bottom-0 left-0 right-0 h-[55%] bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>
      
      {/* GDPR Consent Modal - shown when user tries to start without consent */}
      {showConsentModal && !consentGiven && (
        <DataConsentModal 
          onConsentComplete={() => {
            setConsentGiven(true);
            setShowConsentModal(false);
            startContribution();
            playCoin();
          }} 
        />
      )}
      
      {/* Celebration */}
      <RewardCelebration 
        trigger={showCelebration} 
        points={celebrationPoints}
        type="session-end"
        onComplete={() => setShowCelebration(false)}
      />
      
      {/* UI Controls Layer */}
      <div 
        className="relative z-10 flex flex-col h-full pointer-events-none"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)',
          paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px) + 0.5rem)',
          minHeight: '100vh'
        }}
        {...handlers}
      >
        <PullToRefreshIndicator 
          pullDistance={pullDistance}
          pullProgress={pullProgress}
          isRefreshing={isRefreshing}
        />
        
        {/* Floating Mode Toggle - Top Right (only in personal map mode) */}
        {coverageMode === 'personal' && (
          <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}>
            <button
              onClick={handleToggleCoverageMode}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl',
                'bg-card/90 backdrop-blur-xl border border-border shadow-lg transition-all'
              )}
            >
              <Globe className="w-4 h-4 text-foreground" />
              <span className="text-sm font-medium text-foreground">Global</span>
            </button>
          </div>
        )}

        {/* Warnings - positioned below safe area */}
        {isActive && !isCellular && (
          <div className="mx-4 mt-2 pointer-events-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 p-3 backdrop-blur-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-500">Paused • WiFi Detected</p>
                <p className="text-xs text-amber-500/80">Switch to cellular data to earn points</p>
              </div>
            </div>
          </div>
        )}

        {!isOnline && (
          <div className="mx-4 mt-2 pointer-events-auto">
            <Alert className="border-amber-500/30 bg-amber-500/10 backdrop-blur-sm rounded-2xl">
              <CloudOff className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-600 dark:text-amber-500 text-sm">
                Offline mode • {offlineQueueCount} points queued
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Spacer - pushes controls to bottom */}
        <div className="flex-1" />

        {/* Bottom Control Panel - always at bottom */}
        <div className="px-4 pointer-events-auto">
          {/* Live Points Counter - when active */}
          {isActive && isCellular && (
            <div className="text-center mb-3 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/40 backdrop-blur-sm">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold text-primary tabular-nums">
                  +{stats.pointsEarned.toFixed(1)}
                </span>
                <span className="text-sm text-primary/70">pts</span>
              </div>
            </div>
          )}

          {/* Main Control Button */}
          <div className="flex justify-center mb-3">
            <div className="relative">
              {/* Subtle idle ring (RED) - modern, no ping */}
              {!isActive && user && consentGiven && (
                <div className="absolute inset-[-16px] rounded-full bg-red-500/10 border border-red-500/30" />
              )}
              
              {/* Active scanning ring (GREEN) - subtle glow, no ping */}
              {isActive && isCellular && (
                <div className="absolute inset-[-16px] rounded-full bg-green-500/10 border-2 border-green-400/50" />
              )}
              
              <button
                ref={startButtonRef}
                onClick={() => {
                  buttonTap();
                  if (isActive) {
                    handleStopContribution();
                    playSuccess();
                  } else {
                    if (!consentGiven) {
                      setShowConsentModal(true);
                      return;
                    }
                    startContribution();
                    playCoin();
                  }
                }}
                disabled={!user}
                className={cn(
                  'w-24 h-24 rounded-full relative z-10',
                  'flex flex-col items-center justify-center gap-1',
                  'shadow-2xl active:scale-95',
                  'transition-all duration-300',
                  isActive 
                    ? isPaused
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/50' 
                      : 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/50 animate-pulse' 
                    : 'bg-gradient-to-br from-red-500 to-red-600 hover:scale-105 shadow-red-500/50',
                  !user && 'opacity-40 cursor-not-allowed'
                )}
              >
                {isActive ? (
                  isPaused ? (
                    <>
                      <Wifi className="w-8 h-8 text-white drop-shadow-lg" />
                      <span className="text-[10px] font-bold text-white/90">PAUSED</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-8 h-8 text-white drop-shadow-lg" />
                      <span className="text-[10px] font-bold text-white/90">STOP</span>
                    </>
                  )
                ) : (
                  <>
                    <Play className="w-8 h-8 text-white drop-shadow-lg ml-1" />
                    <span className="text-[10px] font-bold text-white/90">START</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center mb-3">
            <p className="text-lg font-bold text-white">
              {isActive 
                ? (isPaused ? 'Paused' : 'Scanning Network...') 
                : 'Start Scanning'}
            </p>
            {!isActive && user && consentGiven && (
              <p className="text-sm text-white/60 mt-1">
                {isCellular ? 'Tap to earn points' : 'Connect to cellular'}
              </p>
            )}
            {!user && (
              <p className="text-sm text-white/60 mt-1">Sign in to start</p>
            )}
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <button
              onClick={() => {
                buttonTap();
                setShowTools(!showTools);
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl',
                'bg-white/10 backdrop-blur-xl border shadow-lg transition-all',
                showTools ? 'border-[#00d4ff]/40 text-[#00d4ff]' : 'border-white/20 text-white/70'
              )}
            >
              <Layers className="w-4 h-4" />
              <span className="text-sm font-medium">Tools</span>
              <ChevronUp className={cn(
                'w-4 h-4 transition-transform',
                showTools ? 'rotate-180' : ''
              )} />
            </button>
            
            {/* Mode toggle button */}
            <button
              onClick={handleToggleCoverageMode}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl',
                'bg-white/10 backdrop-blur-xl border shadow-lg transition-all',
                'border-white/20 text-white/70 hover:border-white/30'
              )}
            >
              {coverageMode === 'global' ? (
                <>
                  <Map className="w-4 h-4" />
                  <span className="text-sm font-medium">My Map</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">Global</span>
                </>
              )}
            </button>
          </div>

          {/* Expandable Tools */}
          {showTools && (
            <div className="flex items-center justify-center gap-2 mb-3 animate-fade-in flex-wrap">
              {/* Manual Speed Test Button */}
              <button
                onClick={async () => {
                  if (isRunningSpeedTest) return;
                  buttonTap();
                  setIsRunningSpeedTest(true);
                  try {
                    const result = await triggerManualSpeedTest();
                    if (result) {
                      playCoin();
                      successPattern();
                    }
                  } finally {
                    setIsRunningSpeedTest(false);
                  }
                }}
                disabled={!isCellular || isRunningSpeedTest}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl',
                  'bg-white/10 backdrop-blur-xl border shadow-lg transition-all',
                  isRunningSpeedTest 
                    ? 'border-amber-500/40 text-amber-400' 
                    : isCellular 
                      ? 'border-[#00ffa3]/40 text-[#00ffa3] hover:border-[#00ffa3]/60'
                      : 'border-white/10 text-white/40 cursor-not-allowed'
                )}
              >
                <Gauge className={cn("w-4 h-4", isRunningSpeedTest && "animate-pulse")} />
                <span className="text-sm font-medium">
                  {isRunningSpeedTest ? 'Testing...' : 'Run Test'}
                </span>
              </button>
              
              {/* Link to Network Stats Page */}
              <button
                onClick={() => {
                  buttonTap();
                  navigate('/app/network-stats');
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl',
                  'bg-white/10 backdrop-blur-xl border shadow-lg transition-all',
                  'border-white/20 text-white hover:border-white/30'
                )}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">Stats</span>
              </button>
            </div>
          )}

          {/* Session Stats Card - when active */}
          {isActive && (
            <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-4 shadow-xl animate-fade-in">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-white tabular-nums">
                    {formatDuration(stats.duration)}
                  </p>
                  <p className="text-[10px] text-white/50 mt-0.5 uppercase tracking-wider">Duration</p>
                </div>
                <div className="text-center border-x border-white/10">
                  <p className="text-xl font-bold text-white tabular-nums">
                    {stats.dataPointsCount}
                  </p>
                  <p className="text-[10px] text-white/50 mt-0.5 uppercase tracking-wider">Data Points</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[#00ffa3] tabular-nums">
                    +{stats.pointsEarned.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-white/50 mt-0.5 uppercase tracking-wider">Points</p>
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
