import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { 
  Pause,
  Wifi,
  CloudOff,
  Zap,
  Globe,
  Map,
  Play,
  Gauge
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
import { toast } from '@/hooks/use-toast';

import { RewardCelebration } from '@/components/app/RewardCelebration';
import { PullToRefreshIndicator } from '@/components/app/PullToRefreshIndicator';
import { DataConsentModal, hasDataConsent } from '@/components/app/DataConsentModal';
import { cn } from '@/lib/utils';

// Lazy load the Mapbox globe
const MapboxGlobe = lazy(() => import('@/components/app/MapboxGlobe'));

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
  const [coverageMode, setCoverageMode] = useState<CoverageMode>('global');
  const [consentGiven, setConsentGiven] = useState(() => hasDataConsent());
  const [showConsentModal, setShowConsentModal] = useState(false);
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
    ? [lastPosition.coords.longitude, lastPosition.coords.latitude]
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
      {/* 3D Globe - starts zoomed in for "My Map", zoomed out for "Global" */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center bg-[#0a0f1a]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
              <p className="text-sm text-white/60">
                {coverageMode === 'personal' ? 'Loading your coverage...' : 'Loading global network...'}
              </p>
            </div>
          </div>
        }>
          <MapboxGlobe 
            coverageData={
              coverageMode === 'personal' 
                ? heatmapPoints.map(p => ({
                    lat: p.lat,
                    lng: p.lng,
                    intensity: p.intensity,
                    network: 'lte' as const,
                    count: 1
                  }))
                : (globalCoverageData?.cells || [])
            }
            loading={coverageMode === 'personal' ? false : globalCoverageLoading}
            totalDataPoints={
              coverageMode === 'personal' 
                ? heatmapPoints.length 
                : (globalCoverageData?.totalDataPoints || 0)
            }
            uniqueLocations={
              coverageMode === 'personal' 
                ? heatmapPoints.length 
                : (globalCoverageData?.uniqueLocations || 0)
            }
            isPersonalView={coverageMode === 'personal'}
            userPosition={userPosition}
          />
        </Suspense>
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
        
        {/* Mode toggle moved to bottom bar - no duplicate at top */}

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

        {/* Bottom Control Panel */}
        <div className="px-4 pointer-events-auto space-y-3">
          
          {/* Speed Test - Prominent at top */}
          <div className="flex justify-center">
            <button
              onClick={async () => {
                if (isRunningSpeedTest) return;
                buttonTap();
                setIsRunningSpeedTest(true);
                try {
                  const result = await triggerManualSpeedTest();
                  if (result) {
                    // Haptic feedback for completion
                    successPattern();
                    playCoin();
                    
                    // Show toast with results
                    toast({
                      title: "Speed Test Complete ⚡",
                      description: `↓ ${result.down?.toFixed(1) ?? 'N/A'} Mbps  ↑ ${result.up?.toFixed(1) ?? 'N/A'} Mbps  ${result.latency ? `${result.latency.toFixed(0)}ms` : ''}`,
                    });
                  } else {
                    toast({
                      title: "Speed Test Failed",
                      description: "Unable to complete speed test. Please try again.",
                      variant: "destructive",
                    });
                  }
                } finally {
                  setIsRunningSpeedTest(false);
                }
              }}
              disabled={!isCellular || isRunningSpeedTest}
              className={cn(
                'flex items-center gap-2.5 px-6 py-3 rounded-2xl',
                'backdrop-blur-xl border shadow-lg transition-all',
                isRunningSpeedTest 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
                  : isCellular 
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30'
                    : 'bg-card/60 border-border text-muted-foreground/50 cursor-not-allowed'
              )}
            >
              <Gauge className={cn("w-5 h-5", isRunningSpeedTest && "animate-pulse")} />
              <span className="text-sm font-semibold">
                {isRunningSpeedTest ? 'Running Speed Test...' : 'Run Speed Test'}
              </span>
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-card/60 backdrop-blur-xl border border-border">
              <button
                onClick={() => {
                  buttonTap();
                  setCoverageMode('personal');
                  refreshHeatmap();
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  coverageMode === 'personal' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Map className="w-4 h-4" />
                My Map
              </button>
              <button
                onClick={() => {
                  buttonTap();
                  setCoverageMode('global');
                  refreshGlobalCoverage(true);
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  coverageMode === 'global' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Globe className="w-4 h-4" />
                Global
              </button>
            </div>
          </div>

          {/* Live Points Counter - when active */}
          {isActive && isCellular && (
            <div className="flex justify-center animate-fade-in">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary/15 border border-primary/40 backdrop-blur-sm">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold text-primary tabular-nums">
                  +{stats.pointsEarned.toFixed(1)}
                </span>
                <span className="text-sm text-primary/70">pts</span>
              </div>
            </div>
          )}

          {/* Main Control Button - Clean design */}
          <div className="flex justify-center py-2">
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
                'relative w-28 h-28 rounded-full',
                'flex flex-col items-center justify-center gap-1.5',
                'shadow-2xl active:scale-95',
                'transition-all duration-300',
                !user && 'opacity-40 cursor-not-allowed'
              )}
              style={{
                background: isActive 
                  ? isPaused
                    ? 'linear-gradient(145deg, #f59e0b, #d97706)'
                    : 'linear-gradient(145deg, #22c55e, #16a34a)'
                  : 'linear-gradient(145deg, #ef4444, #dc2626)',
                boxShadow: isActive 
                  ? isPaused
                    ? '0 0 40px rgba(245, 158, 11, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)'
                    : '0 0 40px rgba(34, 197, 94, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)'
                  : '0 0 40px rgba(239, 68, 68, 0.4), inset 0 2px 4px rgba(255,255,255,0.2)',
              }}
            >
              {/* Outer ring */}
              <div 
                className={cn(
                  'absolute inset-[-8px] rounded-full border-2',
                  isActive 
                    ? isPaused ? 'border-amber-500/40' : 'border-green-500/40'
                    : 'border-red-500/40'
                )}
              />
              
              {isActive ? (
                isPaused ? (
                  <>
                    <Wifi className="w-9 h-9 text-white drop-shadow-lg" />
                    <span className="text-xs font-bold text-white/90 tracking-wide">PAUSED</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-9 h-9 text-white drop-shadow-lg" />
                    <span className="text-xs font-bold text-white/90 tracking-wide">STOP</span>
                  </>
                )
              ) : (
                <>
                  <Play className="w-9 h-9 text-white drop-shadow-lg ml-1" />
                  <span className="text-xs font-bold text-white/90 tracking-wide">START</span>
                </>
              )}
            </button>
          </div>

          {/* Status Text - Clean and minimal */}
          <div className="text-center pb-1">
            {!user ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm text-muted-foreground">Sign in to start earning</span>
                <button
                  onClick={() => {
                    buttonTap();
                    navigate('/app/auth?mode=login');
                  }}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground"
                >
                  Sign in
                </button>
              </div>
            ) : !isActive && consentGiven ? (
              <p className="text-sm text-muted-foreground">
                {isCellular ? 'Tap START to earn points' : 'Connect to cellular to earn'}
              </p>
            ) : isActive && !isCellular ? (
              <p className="text-sm text-amber-500">Switch to cellular to continue earning</p>
            ) : null}
          </div>

          {/* Session Stats Card - when active */}
          {isActive && (
            <div className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border p-4 shadow-xl animate-fade-in">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {formatDuration(stats.duration)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Duration</p>
                </div>
                <div className="text-center border-x border-border">
                  <p className="text-xl font-bold text-foreground tabular-nums">
                    {stats.dataPointsCount}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Data Points</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-green-500 tabular-nums">
                    +{stats.pointsEarned.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Points</p>
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
