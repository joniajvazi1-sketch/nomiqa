import React, { useState, useCallback, useRef, lazy, Suspense } from 'react';
import { 
  Pause,
  Wifi,
  CloudOff,
  Zap,
  Play,
  Gauge,
  Signal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNetworkContribution } from '@/hooks/useNetworkContribution';
import { useGlobalCoverage } from '@/hooks/useGlobalCoverage';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { toast } from '@/hooks/use-toast';
import { RewardCelebration } from '@/components/app/RewardCelebration';
import { DataConsentModal, hasDataConsent } from '@/components/app/DataConsentModal';
import { cn } from '@/lib/utils';

const NetworkGlobe = lazy(() => import('@/components/app/NetworkGlobe').then(m => ({ default: m.NetworkGlobe })));

export const NetworkContribution: React.FC = () => {
  const navigate = useNavigate();
  const { buttonTap, successPattern } = useEnhancedHaptics();
  const { playCoin, playSuccess } = useEnhancedSounds();
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPoints, setCelebrationPoints] = useState(0);
  const [consentGiven, setConsentGiven] = useState(() => hasDataConsent());
  const [showConsentModal, setShowConsentModal] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  
  const {
    user,
    session,
    stats,
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
  const [liveSpeed, setLiveSpeed] = useState<{ down?: number; up?: number; latency?: number }>({});

  const { data: globalCoverageData, loading: globalCoverageLoading } = useGlobalCoverage({
    autoRefresh: true,
    refreshInterval: 60000,
  });

  const isActive = session.status === 'active';
  
  const userPosition: [number, number] | null = lastPosition 
    ? [lastPosition.coords.longitude, lastPosition.coords.latitude]
    : null;

  const handleStopContribution = useCallback(() => {
    if (stats.pointsEarned > 0) {
      setCelebrationPoints(stats.pointsEarned);
      setShowCelebration(true);
    }
    stopContribution();
  }, [stats.pointsEarned, stopContribution]);

  const getConnectionLabel = () => {
    if (!isOnline) return 'Offline';
    const connStr = String(connectionType).toLowerCase();
    if (connStr.includes('5g')) return '5G';
    if (connStr.includes('4g') || connStr.includes('lte')) return 'LTE';
    if (connStr.includes('3g')) return '3G';
    if (connStr.includes('wifi')) return 'WiFi';
    return 'Cellular';
  };

  const handleSpeedTest = async () => {
    if (isRunningSpeedTest) return;
    buttonTap();
    setIsRunningSpeedTest(true);
    setSpeedTestProgress(0);
    setSpeedTestPhase('latency');
    setLiveSpeed({});
    
    const progressInterval = setInterval(() => {
      setSpeedTestProgress(prev => {
        if (prev < 10) {
          setSpeedTestPhase('latency');
          if (prev > 5) setLiveSpeed(s => ({ ...s, latency: Math.round(20 + Math.random() * 30) }));
          return prev + 2;
        } else if (prev < 80) {
          setSpeedTestPhase('download');
          const progress = (prev - 10) / 70;
          setLiveSpeed(s => ({ ...s, down: Math.round((50 + Math.random() * 100) * progress * 10) / 10 }));
          return prev + 1.5;
        } else if (prev < 95) {
          setSpeedTestPhase('upload');
          const progress = (prev - 80) / 15;
          setLiveSpeed(s => ({ ...s, up: Math.round((20 + Math.random() * 40) * progress * 10) / 10 }));
          return prev + 0.8;
        }
        return prev;
      });
    }, 100);
    
    try {
      const result = await triggerManualSpeedTest();
      clearInterval(progressInterval);
      setSpeedTestProgress(100);
      
      if (result) {
        setLiveSpeed({ down: result.down, up: result.up, latency: result.latency });
        successPattern();
        playCoin();
        toast({
          title: "Speed Test Complete ⚡",
          description: `↓ ${result.down?.toFixed(1) ?? 'N/A'} Mbps  ↑ ${result.up?.toFixed(1) ?? 'N/A'} Mbps`,
        });
      } else {
        toast({
          title: "Speed Test Failed",
          description: "Please try again.",
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
        setLiveSpeed({});
      }, 1000);
    }
  };

  return (
    <div 
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, hsl(222 30% 7%) 0%, hsl(222 35% 12%) 100%)',
        // No paddingTop - badges handle their own safe area offsets
        paddingBottom: 'calc(72px + env(safe-area-inset-bottom))'
      }}
    >
      {/* GDPR Consent Modal */}
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

      {/* Globe Section - Takes remaining space */}
      <div className="flex-1 relative min-h-0">
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
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
        
        {/* Live Badge - Top Left - tight to safe area */}
        <div 
          className="absolute left-4 z-30"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 4px)' }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Connection Type - Top Right - tight to safe area */}
        <div 
          className="absolute right-4 z-30"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 4px)' }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <Signal className={cn("w-3.5 h-3.5", isCellular ? "text-[#00d4ff]" : "text-amber-400")} />
            <span className="text-[10px] font-medium text-white/90">{getConnectionLabel()}</span>
          </div>
        </div>

        {/* Offline Banner - closer to badges */}
        {!isOnline && (
          <div 
            className="absolute left-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 backdrop-blur-md z-30"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 36px)' }}
          >
            <CloudOff className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-300">{offlineQueueCount} points queued</span>
          </div>
        )}

        {/* WiFi Warning - Below badges */}
        {isActive && !isCellular && (
          <div 
            className="absolute left-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 backdrop-blur-md z-30"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 36px)' }}
          >
            <Wifi className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-300">Switch to cellular to earn</span>
          </div>
        )}
      </div>

      {/* Bottom Control Panel - Fixed height */}
      <div 
        className="shrink-0 px-4 pb-2 pt-4"
        style={{ background: 'linear-gradient(to top, hsl(222 30% 7%) 0%, transparent 100%)' }}
      >
        {/* Session Stats - Only when active */}
        {isActive && (
          <div className="mb-4 grid grid-cols-3 gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="text-center">
              <p className="text-lg font-bold text-white tabular-nums">{formatDuration(stats.duration)}</p>
              <p className="text-[10px] text-[#00d4ff]/70 uppercase tracking-wider">Duration</p>
            </div>
            <div className="text-center border-x border-white/10">
              <p className="text-lg font-bold text-white tabular-nums">{stats.dataPointsCount}</p>
              <p className="text-[10px] text-[#00d4ff]/70 uppercase tracking-wider">Data Points</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[#00d4ff] tabular-nums">+{stats.pointsEarned.toFixed(1)}</p>
              <p className="text-[10px] text-[#00d4ff]/70 uppercase tracking-wider">Points</p>
            </div>
          </div>
        )}

        {/* Buttons Row */}
        <div className="flex items-center justify-center gap-4">
          {/* Start/Stop Button */}
          <button
            ref={startButtonRef}
            onClick={async () => {
              buttonTap();
              if (isActive) {
                handleStopContribution();
                playSuccess();
              } else {
                if (!consentGiven) {
                  setShowConsentModal(true);
                  return;
                }
                const started = await startContribution();
                if (started) {
                  playCoin();
                  toast({
                    title: "Contribution Started ✓",
                    description: "Location permission granted. Earning points!",
                  });
                } else {
                  toast({
                    title: "Location Permission Required",
                    description: "Please enable location in Settings to earn points.",
                    variant: "destructive",
                  });
                }
              }
            }}
            disabled={!user}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 px-8 rounded-2xl min-w-[140px] h-[72px]',
              'backdrop-blur-md border-2 transition-all duration-200 active:scale-95',
              !user && 'opacity-40 cursor-not-allowed',
              isActive 
                ? isPaused 
                  ? 'bg-amber-500/20 border-amber-400/50' 
                  : 'bg-[#00d4ff]/20 border-[#00d4ff]/50'
                : 'bg-[#00d4ff]/20 border-[#00d4ff]/50 hover:bg-[#00d4ff]/30'
            )}
            style={{
              boxShadow: isActive && !isPaused
                ? '0 0 40px rgba(0, 212, 255, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                : '0 0 30px rgba(0, 212, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex items-center gap-2">
              {isActive ? (
                isPaused ? (
                  <Wifi className="w-5 h-5 text-amber-400" />
                ) : (
                  <Pause className="w-5 h-5 text-[#00d4ff]" />
                )
              ) : (
                <Play className="w-5 h-5 text-[#00d4ff] ml-0.5" />
              )}
              <span className={cn(
                "text-sm font-bold uppercase tracking-wider",
                isActive ? isPaused ? "text-amber-400" : "text-[#00d4ff]" : "text-[#00d4ff]"
              )}>
                {isActive ? (isPaused ? 'Paused' : 'Stop') : 'Start'}
              </span>
            </div>
            
            {isActive && isCellular ? (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#f0b429]" />
                <span className="text-[11px] font-bold text-[#f0b429] tabular-nums">
                  +{stats.pointsEarned.toFixed(1)} pts
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-white/50">Contribute</span>
            )}
          </button>

          {/* Speed Test Button */}
          <button
            onClick={handleSpeedTest}
            disabled={!isCellular || isRunningSpeedTest}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 px-6 rounded-2xl min-w-[120px] h-[72px]',
              'backdrop-blur-md border-2 transition-all duration-200 active:scale-95',
              isRunningSpeedTest 
                ? 'bg-amber-500/20 border-amber-400/50' 
                : isCellular 
                  ? 'bg-white/5 border-white/20 hover:bg-white/10'
                  : 'bg-white/5 border-white/10 cursor-not-allowed opacity-50'
            )}
          >
            <div className="flex items-center gap-2">
              <Gauge className={cn(
                "w-5 h-5",
                isRunningSpeedTest ? "text-amber-400 animate-spin" : "text-white/80"
              )} />
              <span className={cn(
                "text-sm font-bold uppercase tracking-wider",
                isRunningSpeedTest ? "text-amber-400" : "text-white/80"
              )}>
                {isRunningSpeedTest 
                  ? speedTestPhase === 'latency' ? 'Ping' 
                    : speedTestPhase === 'download' ? 'Down' : 'Up'
                  : 'Speed'}
              </span>
            </div>
            
            {isRunningSpeedTest ? (
              <div className="w-full space-y-0.5 px-2">
                <div className="text-center">
                  <span className="text-[11px] font-bold text-amber-400 tabular-nums">
                    {speedTestPhase === 'latency' && liveSpeed.latency 
                      ? `${liveSpeed.latency}ms`
                      : speedTestPhase === 'download' && liveSpeed.down
                        ? `${liveSpeed.down} Mbps`
                        : speedTestPhase === 'upload' && liveSpeed.up
                          ? `${liveSpeed.up} Mbps`
                          : '...'
                    }
                  </span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-100"
                    style={{ width: `${speedTestProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <span className="text-[10px] text-white/50">Test Network</span>
            )}
          </button>
        </div>

        {/* Status Text */}
        <div className="text-center mt-3">
          {!user ? (
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm text-white/60">Sign in to start earning</span>
              <button
                onClick={() => {
                  buttonTap();
                  navigate('/app/auth?mode=login');
                }}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-[#00d4ff] text-[#0a0f1a]"
              >
                Sign in
              </button>
            </div>
          ) : !isActive && consentGiven ? (
            <p className="text-sm text-white/50">
              {isCellular ? 'Tap START to earn points' : 'Connect to cellular to earn'}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default NetworkContribution;
