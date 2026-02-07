import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { Capacitor } from '@capacitor/core';
import { 
  Pause,
  Wifi,
  CloudOff,
  Zap,
  Play,
  Gauge,
  Signal,
  MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNetworkContribution, requestIOSAlwaysPermission, getIOSPermissionStatus } from '@/hooks/useNetworkContribution';
import { useGlobalCoverage } from '@/hooks/useGlobalCoverage';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { toast } from '@/hooks/use-toast';
import { RewardCelebration } from '@/components/app/RewardCelebration';
import { DataConsentModal, hasDataConsent } from '@/components/app/DataConsentModal';
import { BackgroundLocationRationale } from '@/components/app/BackgroundLocationRationale';
import { IOSPermissionBanner, IOSPermissionIndicator } from '@/components/app/IOSPermissionBanner';
import { cn } from '@/lib/utils';

const NetworkGlobe = lazy(() => import('@/components/app/NetworkGlobe').then(m => ({ default: m.NetworkGlobe })));

// Permission status type for iOS display
type IOSPermissionStatusLabel = 'Not Determined' | 'While Using' | 'Always' | 'Denied' | 'Unknown';

export const NetworkContribution: React.FC = () => {
  const navigate = useNavigate();
  const { buttonTap, successPattern } = useEnhancedHaptics();
  const { playCoin, playSuccess } = useEnhancedSounds();
  const isIOS = Capacitor.getPlatform() === 'ios';
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPoints, setCelebrationPoints] = useState(0);
  const [consentGiven, setConsentGiven] = useState(() => hasDataConsent());
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showBackgroundRationale, setShowBackgroundRationale] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  
  // iOS permission status for visibility
  const [iosPermissionLabel, setIosPermissionLabel] = useState<IOSPermissionStatusLabel>('Unknown');
  
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
    triggerManualSpeedTest,
    getSpeedTestDataEstimate
  } = useNetworkContribution();

  const [isRunningSpeedTest, setIsRunningSpeedTest] = useState(false);
  const [speedTestProgress, setSpeedTestProgress] = useState(0);
  const [speedTestPhase, setSpeedTestPhase] = useState<'idle' | 'latency' | 'download' | 'upload'>('idle');
  const [liveSpeed, setLiveSpeed] = useState<{ down?: number; up?: number; latency?: number }>({});
  const [showCellularDataWarning, setShowCellularDataWarning] = useState(false);

  const { data: globalCoverageData, loading: globalCoverageLoading } = useGlobalCoverage({
    autoRefresh: true,
    refreshInterval: 60000,
  });

  const isActive = session.status === 'active';
  
  const userPosition: [number, number] | null = lastPosition 
    ? [lastPosition.coords.longitude, lastPosition.coords.latitude]
    : null;

  // Track iOS permission status for display
  useEffect(() => {
    if (!isIOS) return;
    
    const checkPermissionStatus = async () => {
      try {
        const status = await getIOSPermissionStatus();
        if (status.backgroundGranted) {
          setIosPermissionLabel('Always');
        } else if (status.foregroundGranted) {
          setIosPermissionLabel('While Using');
        } else {
          // Check native status for "not determined" vs "denied"
          const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
          const nativeStatus = await BackgroundLocation.getPermissionStatus();
          if (nativeStatus.foregroundStatus === 'not_determined') {
            setIosPermissionLabel('Not Determined');
          } else if (nativeStatus.foregroundStatus === 'denied') {
            setIosPermissionLabel('Denied');
          } else {
            setIosPermissionLabel('Unknown');
          }
        }
      } catch (e) {
        console.error('[NetworkContribution] Failed to check iOS permission:', e);
        setIosPermissionLabel('Unknown');
      }
    };
    
    checkPermissionStatus();
    
    // Re-check when app resumes
    const handleResume = () => {
      checkPermissionStatus();
    };
    
    import('@capacitor/app').then(({ App }) => {
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) handleResume();
      });
    }).catch(() => {});
  }, [isIOS, isActive]);

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

  const handleSpeedTest = async (confirmed = false) => {
    if (isRunningSpeedTest) return;
    
    // Check if on cellular and show warning if not confirmed
    const dataEstimate = getSpeedTestDataEstimate();
    if (dataEstimate.isCellular && !confirmed) {
      setShowCellularDataWarning(true);
      return;
    }
    
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
      const result = await triggerManualSpeedTest(true); // Skip warning since we already showed it
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
  
  // Confirm cellular data usage for speed test
  const confirmCellularSpeedTest = () => {
    setShowCellularDataWarning(false);
    handleSpeedTest(true);
  };

  // Handle iOS "Always" permission request
  const handleRequestAlwaysPermission = async () => {
    setShowBackgroundRationale(false);
    const granted = await requestIOSAlwaysPermission();
    if (granted) {
      toast({
        title: "Background Location Enabled ✓",
        description: "You can now contribute with your screen locked!",
      });
    } else {
      toast({
        title: "Background Location Not Enabled",
        description: "You can still contribute while the app is open.",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, hsl(222 30% 7%) 0%, hsl(222 35% 12%) 100%)',
        paddingBottom: 'calc(72px + env(safe-area-inset-bottom))'
      }}
    >
      {/* GDPR Consent Modal */}
      {showConsentModal && !consentGiven && (
        <DataConsentModal 
          onConsentComplete={async (accepted) => {
            setShowConsentModal(false);

            if (!accepted) {
              setConsentGiven(false);
              toast({
                title: "Consent required",
                description: "Accept data collection to enable scanning and earn points.",
                variant: "destructive",
              });
              return;
            }

            setConsentGiven(true);
            const started = await startContribution();
            if (started) {
              playCoin();
              toast({
                title: "Contribution Started ✓",
                description: "Location permission granted. Contributing data!",
              });
            } else {
              toast({
                title: "Location Permission Required",
                description: isIOS
                  ? "Enable Location: Settings → Privacy & Security → Location Services → Nomiqa."
                  : "Please enable location in Settings to contribute.",
                variant: "destructive",
              });
            }
          }}
        />
      )}

      {/* iOS Background Location Rationale */}
      <BackgroundLocationRationale
        isOpen={showBackgroundRationale}
        onRequestAlways={handleRequestAlwaysPermission}
        onSkip={() => setShowBackgroundRationale(false)}
        onClose={() => setShowBackgroundRationale(false)}
      />
      
      {/* Celebration */}
      <RewardCelebration 
        trigger={showCelebration} 
        points={celebrationPoints}
        type="session-end"
        onComplete={() => setShowCelebration(false)}
      />

      {/* Cellular Data Warning for Speed Test */}
      {showCellularDataWarning && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowCellularDataWarning(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Signal className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Cellular Data Warning</h3>
                <p className="text-sm text-muted-foreground">Speed test uses data</p>
              </div>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
              <p className="text-sm text-foreground">
                This speed test will use approximately <span className="font-bold text-amber-500">3-25 MB</span> of your cellular data.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Tip: Run speed tests on WiFi for free!
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCellularDataWarning(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-muted text-foreground font-medium active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={confirmCellularSpeedTest}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium active:scale-95 transition-transform"
              >
                Run Test
              </button>
            </div>
          </div>
        </div>
      )}

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
        
        {/* Live Badge - Top Left - with more spacing from top */}
        <div 
          className="absolute left-4 z-30"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Connection Type - Top Right (iOS permission moved to bottom panel) */}
        <div 
          className="absolute right-4 z-30"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <Signal className={cn("w-3.5 h-3.5", isCellular ? "text-[#00d4ff]" : "text-amber-400")} />
            <span className="text-[10px] font-medium text-white/90">{getConnectionLabel()}</span>
          </div>
        </div>

        {/* Offline Banner - with more spacing */}
        {!isOnline && (
          <div 
            className="absolute left-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 backdrop-blur-md z-30"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 48px)' }}
          >
            <CloudOff className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-300">{offlineQueueCount} points queued</span>
          </div>
        )}

        {/* WiFi Warning - Below badges with more spacing */}
        {isActive && !isCellular && (
          <div 
            className="absolute left-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 backdrop-blur-md z-30"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 48px)' }}
          >
            <Wifi className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-300">Switch to cellular to contribute network data</span>
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
                    description: "Location permission granted. Contributing data!",
                  });
                } else {
                  toast({
                    title: "Location Permission Required",
                    description: isIOS
                      ? "Enable Location: Settings → Privacy & Security → Location Services → Nomiqa."
                      : "Please enable location in Settings to contribute.",
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
                  : 'bg-green-500/20 border-green-500/50'
                : 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30'
            )}
            style={{
              boxShadow: isActive && !isPaused
                ? '0 0 40px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                : '0 0 30px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex items-center gap-2">
              {isActive ? (
                isPaused ? (
                  <Wifi className="w-5 h-5 text-amber-400" />
                ) : (
                  <Pause className="w-5 h-5 text-green-400" />
                )
              ) : (
                <Play className="w-5 h-5 text-red-400 ml-0.5" />
              )}
              <span className={cn(
                "text-sm font-bold uppercase tracking-wider",
                isActive ? isPaused ? "text-amber-400" : "text-green-400" : "text-red-400"
              )}>
                {isActive ? (isPaused ? 'Paused' : 'Contributing') : 'Contribute'}
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
              <span className="text-[10px] text-white/50">{isActive ? '' : 'Tap to start'}</span>
            )}
          </button>

          {/* Speed Test Button */}
          <button
            onClick={() => handleSpeedTest()}
            disabled={isRunningSpeedTest}
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

        {/* iOS Permission Indicator - In Bottom Panel */}
        {isIOS && iosPermissionLabel !== 'Always' && (
          <button
            onClick={async () => {
              if (iosPermissionLabel === 'While Using') {
                setShowBackgroundRationale(true);
                return;
              }
              try {
                const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
                if (iosPermissionLabel === 'Not Determined' || iosPermissionLabel === 'Unknown') {
                  const res = await BackgroundLocation.requestForegroundPermission();
                  if (res.granted) {
                    toast({ title: 'Location Enabled ✓', description: 'You can now start scanning.' });
                  } else {
                    toast({ title: 'Location Permission Required', description: "Enable in Settings → Privacy → Location Services → Nomiqa.", variant: 'destructive' });
                  }
                  return;
                }
                if (iosPermissionLabel === 'Denied') {
                  await BackgroundLocation.openAppSettings();
                  toast({ title: 'Enable Location', description: "Settings → Privacy → Location Services → Nomiqa." });
                }
              } catch { /* ignore */ }
            }}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl backdrop-blur-md border transition-colors mt-3",
              iosPermissionLabel === 'While Using'
                ? "bg-amber-500/20 border-amber-500/40"
                : iosPermissionLabel === 'Denied'
                  ? "bg-red-500/20 border-red-500/40"
                  : "bg-white/10 border-white/20"
            )}
          >
            <MapPin className={cn(
              "w-4 h-4",
              iosPermissionLabel === 'While Using' ? "text-amber-400" : iosPermissionLabel === 'Denied' ? "text-red-400" : "text-white/60"
            )} />
            <span className={cn(
              "text-xs font-semibold",
              iosPermissionLabel === 'While Using' ? "text-amber-400" : iosPermissionLabel === 'Denied' ? "text-red-400" : "text-white/60"
            )}>
              {iosPermissionLabel === 'While Using' 
                ? 'Tap to enable background location' 
                : iosPermissionLabel === 'Denied'
                  ? 'Location denied - tap to fix in Settings'
                  : 'Tap to enable location'}
            </span>
          </button>
        )}

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
              {isCellular ? 'Tap CONTRIBUTE to earn points' : 'Connect to cellular to earn'}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default NetworkContribution;
