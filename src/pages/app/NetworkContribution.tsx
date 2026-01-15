import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { 
  Pause,
  Wifi,
  CloudOff,
  Zap,
  Play,
  Gauge
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNetworkContribution } from '@/hooks/useNetworkContribution';

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

// Lazy load the Three.js globe (Mapbox kept for future update)
const NetworkGlobe = lazy(() => import('@/components/app/NetworkGlobe').then(m => ({ default: m.NetworkGlobe })));

// Global-only view - showing real community data from database

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
  const [speedTestProgress, setSpeedTestProgress] = useState(0);
  const [speedTestPhase, setSpeedTestPhase] = useState<'idle' | 'latency' | 'download' | 'upload'>('idle');

  const {
    data: globalCoverageData,
    loading: globalCoverageLoading,
    refresh: refreshGlobalCoverage,
  } = useGlobalCoverage({
    autoRefresh: true,
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

  const handleRefresh = useCallback(async () => {
    await refreshGlobalCoverage(true);
  }, [refreshGlobalCoverage]);

  const { isRefreshing, pullDistance, pullProgress, handlers } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  return (
    <div className="relative w-full h-full min-h-screen bg-background overflow-hidden">
      {/* 3D Globe - Global community data from database */}
      <div className="absolute inset-0 z-0">
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
            isPersonalView={false}
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
          
          {/* Speed Test - Matching arcade glassmorphism style with progress bar */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Outer glow frame */}
              <div 
                className={cn(
                  'absolute inset-[-8px] rounded-2xl transition-all duration-500',
                  'bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm',
                  'border border-white/10'
                )}
                style={{
                  boxShadow: isRunningSpeedTest 
                    ? '0 0 30px rgba(245, 158, 11, 0.2), inset 0 0 20px rgba(245, 158, 11, 0.1)'
                    : isCellular
                      ? '0 0 30px rgba(0, 212, 255, 0.15), inset 0 0 20px rgba(0, 212, 255, 0.08)'
                      : '0 0 20px rgba(100, 100, 100, 0.1)',
                }}
              />
              
              {/* Corner accents */}
              <div className="absolute inset-[-4px] pointer-events-none">
                <div className={cn(
                  'absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full transition-colors duration-300',
                  isRunningSpeedTest ? 'bg-amber-400/60' : isCellular ? 'bg-cyan-400/60' : 'bg-gray-400/30'
                )} />
                <div className={cn(
                  'absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full transition-colors duration-300',
                  isRunningSpeedTest ? 'bg-amber-400/60' : isCellular ? 'bg-cyan-400/60' : 'bg-gray-400/30'
                )} />
              </div>
              
              <button
                onClick={async () => {
                  if (isRunningSpeedTest) return;
                  buttonTap();
                  setIsRunningSpeedTest(true);
                  setSpeedTestProgress(0);
                  setSpeedTestPhase('latency');
                  
                  // Simulate progress phases
                  const progressInterval = setInterval(() => {
                    setSpeedTestProgress(prev => {
                      if (prev < 10) {
                        setSpeedTestPhase('latency');
                        return prev + 2;
                      } else if (prev < 85) {
                        setSpeedTestPhase('download');
                        return prev + 1;
                      } else if (prev < 95) {
                        setSpeedTestPhase('upload');
                        return prev + 0.5;
                      }
                      return prev;
                    });
                  }, 100);
                  
                  try {
                    const result = await triggerManualSpeedTest();
                    clearInterval(progressInterval);
                    setSpeedTestProgress(100);
                    
                    if (result) {
                      successPattern();
                      playCoin();
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
                  } catch {
                    clearInterval(progressInterval);
                  } finally {
                    setTimeout(() => {
                      setIsRunningSpeedTest(false);
                      setSpeedTestProgress(0);
                      setSpeedTestPhase('idle');
                    }, 500);
                  }
                }}
                disabled={!isCellular || isRunningSpeedTest}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 px-6 py-3 rounded-xl min-w-[140px]',
                  'backdrop-blur-xl border transition-all duration-200',
                  'active:scale-95',
                  isRunningSpeedTest 
                    ? 'bg-amber-500/20 border-amber-400/30' 
                    : isCellular 
                      ? 'bg-cyan-500/20 border-cyan-400/30 hover:bg-cyan-500/30'
                      : 'bg-white/5 border-white/10 cursor-not-allowed'
                )}
                style={{
                  boxShadow: isRunningSpeedTest 
                    ? '0 4px 20px rgba(245, 158, 11, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
                    : isCellular
                      ? '0 4px 20px rgba(0, 212, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.15)'
                      : '0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                {/* Inner glow */}
                <div 
                  className={cn(
                    'absolute inset-0 rounded-xl opacity-40 pointer-events-none',
                    isRunningSpeedTest 
                      ? 'bg-gradient-to-b from-amber-400/20 via-transparent to-amber-600/10' 
                      : isCellular
                        ? 'bg-gradient-to-b from-cyan-400/20 via-transparent to-cyan-600/10'
                        : 'bg-gradient-to-b from-white/10 via-transparent to-transparent'
                  )}
                />
                
                {/* Top row - icon and text */}
                <div className="flex items-center gap-2 relative z-10">
                  <Gauge className={cn(
                    "w-5 h-5",
                    isRunningSpeedTest ? "text-amber-400 animate-spin" : isCellular ? "text-cyan-400" : "text-gray-500"
                  )} />
                  <span className={cn(
                    "text-sm font-semibold tracking-wide",
                    isRunningSpeedTest ? "text-amber-400" : isCellular ? "text-cyan-400" : "text-gray-500"
                  )}>
                    {isRunningSpeedTest 
                      ? speedTestPhase === 'latency' 
                        ? 'Ping...' 
                        : speedTestPhase === 'download' 
                          ? 'Downloading...' 
                          : 'Uploading...'
                      : 'Speed Test'}
                  </span>
                </div>
                
                {/* Progress bar - only visible during test */}
                {isRunningSpeedTest && (
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative z-10">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-150"
                      style={{ width: `${speedTestProgress}%` }}
                    />
                  </div>
                )}
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

          {/* Main Control Button - Modern Glassmorphism Arcade Style */}
          <div className="flex justify-center py-4">
            <div className="relative">
              {/* Outer arcade frame - hexagonal glow effect */}
              <div 
                className={cn(
                  'absolute inset-[-20px] rounded-[32px] transition-all duration-500',
                  'bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm',
                  'border border-white/10',
                  isActive && !isPaused && 'animate-[spin_12s_linear_infinite]'
                )}
                style={{
                  boxShadow: isActive 
                    ? isPaused
                      ? '0 0 40px rgba(245, 158, 11, 0.2), inset 0 0 30px rgba(245, 158, 11, 0.1)'
                      : '0 0 40px rgba(34, 197, 94, 0.2), inset 0 0 30px rgba(34, 197, 94, 0.1)'
                    : '0 0 40px rgba(239, 68, 68, 0.15), inset 0 0 30px rgba(239, 68, 68, 0.08)',
                }}
              />
              
              {/* Animated corner accents - arcade style */}
              <div className="absolute inset-[-14px] pointer-events-none">
                <div className={cn(
                  'absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full transition-colors duration-300',
                  isActive ? isPaused ? 'bg-amber-400/60' : 'bg-green-400/60' : 'bg-red-400/60'
                )} />
                <div className={cn(
                  'absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full transition-colors duration-300',
                  isActive ? isPaused ? 'bg-amber-400/60' : 'bg-green-400/60' : 'bg-red-400/60'
                )} />
                <div className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full transition-colors duration-300',
                  isActive ? isPaused ? 'bg-amber-400/60' : 'bg-green-400/60' : 'bg-red-400/60'
                )} />
                <div className={cn(
                  'absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full transition-colors duration-300',
                  isActive ? isPaused ? 'bg-amber-400/60' : 'bg-green-400/60' : 'bg-red-400/60'
                )} />
              </div>
              
              {/* Inner glowing ring */}
              <div 
                className={cn(
                  'absolute inset-[-4px] rounded-full transition-all duration-300',
                  'border-2',
                  isActive 
                    ? isPaused ? 'border-amber-400/40' : 'border-green-400/40'
                    : 'border-red-400/40'
                )}
              />
              
              {/* Pulse effect when active */}
              {isActive && !isPaused && (
                <div className="absolute inset-[-8px] rounded-full animate-ping opacity-10 bg-green-400" />
              )}
              
              {/* Main button - Glassmorphism */}
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
                  'relative w-28 h-28 rounded-full overflow-hidden',
                  'flex flex-col items-center justify-center gap-1',
                  'active:scale-95 transition-all duration-150',
                  'backdrop-blur-xl border',
                  !user && 'opacity-40 cursor-not-allowed',
                  isActive 
                    ? isPaused 
                      ? 'bg-amber-500/20 border-amber-400/30' 
                      : 'bg-green-500/20 border-green-400/30'
                    : 'bg-red-500/20 border-red-400/30'
                )}
                style={{
                  boxShadow: isActive 
                    ? isPaused
                      ? '0 8px 32px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                      : '0 8px 32px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                    : '0 8px 32px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                {/* Inner glow gradient */}
                <div 
                  className={cn(
                    'absolute inset-0 opacity-40 pointer-events-none',
                    isActive 
                      ? isPaused 
                        ? 'bg-gradient-to-b from-amber-400/30 via-transparent to-amber-600/20' 
                        : 'bg-gradient-to-b from-green-400/30 via-transparent to-green-600/20'
                      : 'bg-gradient-to-b from-red-400/30 via-transparent to-red-600/20'
                  )}
                />
                
                {/* Icon and text */}
                <div className="relative z-10 flex flex-col items-center gap-1">
                  {isActive ? (
                    isPaused ? (
                      <>
                        <Wifi className={cn('w-9 h-9 drop-shadow-lg', 'text-amber-400')} />
                        <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">Paused</span>
                      </>
                    ) : (
                      <>
                        <Pause className={cn('w-9 h-9 drop-shadow-lg', 'text-green-400')} />
                        <span className="text-xs font-bold text-green-400 tracking-widest uppercase">Stop</span>
                      </>
                    )
                  ) : (
                    <>
                      <Play className={cn('w-9 h-9 drop-shadow-lg ml-1', 'text-red-400')} />
                      <span className="text-xs font-bold text-red-400 tracking-widest uppercase">Start</span>
                    </>
                  )}
                </div>
              </button>
            </div>
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
