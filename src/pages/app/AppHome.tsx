import React, { useEffect, useState, useCallback, lazy, Suspense, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Capacitor } from '@capacitor/core';
import { 
  Settings,
  Users,
  Share2,
  Sun,
  Moon,
  Copy,
  TrendingUp,
  Clock,
  Play,
  Pause,
  Gauge,
  Zap,
  Signal,
  Wifi,
  CloudOff,
  MapPin
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAchievements } from '@/hooks/useAchievements';
import { OnboardingFlow } from '@/components/app/OnboardingFlow';
import { AnimatePresence, motion } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/app/PullToRefreshIndicator';
import { AppSpinner } from '@/components/app/AppSpinner';
import { useNativeShare } from '@/hooks/useNativeShare';
import { AppSEO } from '@/components/app/AppSEO';
import { toast } from 'sonner';
import { useNetworkContribution, requestIOSAlwaysPermission, getIOSPermissionStatus } from '@/hooks/useNetworkContribution';
import { useGlobalCoverage } from '@/hooks/useGlobalCoverage';
import { DataConsentModal, hasDataConsent } from '@/components/app/DataConsentModal';
import { BackgroundLocationRationale } from '@/components/app/BackgroundLocationRationale';
import { RewardCelebration } from '@/components/app/RewardCelebration';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { toast as toastNew } from '@/hooks/use-toast';

// Lazy load NetworkGlobe for performance
const NetworkGlobe = lazy(() => import('@/components/app/NetworkGlobe').then(m => ({ default: m.NetworkGlobe })));

// Permission status type for iOS display
type IOSPermissionStatusLabel = 'Not Determined' | 'While Using' | 'Always' | 'Denied' | 'Unknown';

export const AppHome: React.FC = () => {
  const navigate = useNavigate();
  const { mediumTap, lightTap } = useHaptics();
  const { buttonTap, successPattern } = useEnhancedHaptics();
  const { playCoin, playSuccess } = useEnhancedSounds();
  const { isOnline } = useNetworkStatus();
  const { streakDays } = useAchievements();
  const { share } = useNativeShare();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark' || theme === 'dark';
  const isIOS = Capacitor.getPlatform() === 'ios';
  
  // Network contribution hook for controlling scanning
  const {
    user,
    session,
    stats,
    lastPosition,
    isCellular,
    isPaused,
    connectionType,
    offlineQueueCount,
    startContribution,
    stopContribution,
    formatDuration,
    triggerManualSpeedTest,
    getSpeedTestDataEstimate
  } = useNetworkContribution();

  // Global coverage data for the globe
  const { data: globalCoverageData, loading: globalCoverageLoading } = useGlobalCoverage({
    autoRefresh: true,
    refreshInterval: 60000,
  });

  const isActive = session.status === 'active';
  
  const userPosition: [number, number] | null = lastPosition 
    ? [lastPosition.coords.longitude, lastPosition.coords.latitude]
    : null;
  
  // Consent state
  const [consentGiven, setConsentGiven] = useState(() => hasDataConsent());
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showBackgroundRationale, setShowBackgroundRationale] = useState(false);
  
  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationPoints, setCelebrationPoints] = useState(0);
  
  // iOS permission status for visibility
  const [iosPermissionLabel, setIosPermissionLabel] = useState<IOSPermissionStatusLabel>('Unknown');
  
  // Speed test state
  const [isRunningSpeedTest, setIsRunningSpeedTest] = useState(false);
  const [speedTestProgress, setSpeedTestProgress] = useState(0);
  const [speedTestPhase, setSpeedTestPhase] = useState<'idle' | 'latency' | 'download' | 'upload'>('idle');
  const [liveSpeed, setLiveSpeed] = useState<{ down?: number; up?: number; latency?: number }>({});
  const [showCellularDataWarning, setShowCellularDataWarning] = useState(false);
  
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('hasSeenOnboarding') !== 'true';
  });
  
  const [username, setUsername] = useState<string | null>(null);
  const [points, setPoints] = useState<{
    total_points: number;
    total_distance_meters: number;
    contribution_streak_days: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralCount, setReferralCount] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  
  const startButtonRef = useRef<HTMLButtonElement>(null);

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
        console.error('[AppHome] Failed to check iOS permission:', e);
        setIosPermissionLabel('Unknown');
      }
    };
    
    checkPermissionStatus();
    
    const handleResume = () => {
      checkPermissionStatus();
    };
    
    import('@capacitor/app').then(({ App }) => {
      App.addListener('appStateChange', ({ isActive: isAppActive }) => {
        if (isAppActive) handleResume();
      });
    }).catch(() => {});
  }, [isIOS, isActive]);

  const loadData = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser) {
        const { data: profileData } = await supabase
          .from('profiles_safe')
          .select('username')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        if (profileData?.username) {
          setUsername(profileData.username);
        }

        const { data: pointsData } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        if (pointsData) {
          setPoints(pointsData);
        }

        const { data: affiliateData } = await supabase
          .from('affiliates_safe')
          .select('total_registrations')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        if (affiliateData?.total_registrations) {
          setReferralCount(affiliateData.total_registrations);
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const { data: sessionsData } = await supabase
          .from('contribution_sessions')
          .select('total_points_earned, started_at')
          .eq('user_id', currentUser.id)
          .gte('started_at', todayStr);

        if (sessionsData) {
          const todayTotal = sessionsData.reduce((sum, s) => sum + (s.total_points_earned || 0), 0);
          setTodayEarnings(todayTotal);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { isRefreshing, pullDistance, pullProgress, containerRef } = usePullToRefresh({
    onRefresh: loadData
  });

  const handleShareReferral = async () => {
    const referralLink = username 
      ? `https://nomiqa.com/${username}` 
      : 'https://nomiqa.com/download';
    
    await share({
      title: 'Join Nomiqa',
      text: 'Earn by contributing to the network. Join me on Nomiqa!',
      url: referralLink
    });
  };

  const handleCopyLink = async () => {
    const referralLink = username 
      ? `https://nomiqa.com/${username}` 
      : 'https://nomiqa.com/download';
    
    try {
      await navigator.clipboard.writeText(referralLink);
      lightTap();
      toast.success('Link copied!');
    } catch {
      toast.error('Could not copy link');
    }
  };

  // Handle stop contribution with celebration
  const handleStopContribution = useCallback(() => {
    if (stats.pointsEarned > 0) {
      setCelebrationPoints(stats.pointsEarned);
      setShowCelebration(true);
    }
    stopContribution();
  }, [stats.pointsEarned, stopContribution]);

  // Handle start/stop contribution
  const handleToggleContribution = async () => {
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
        toastNew({
          title: "Contribution Started ✓",
          description: "Contributing network data!",
        });
      } else {
        toastNew({
          title: "Location Permission Required",
          description: isIOS
            ? "Enable Location: Settings → Privacy & Security → Location Services → Nomiqa."
            : "Please enable location in Settings to contribute.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle iOS "Always" permission request
  const handleRequestAlwaysPermission = async () => {
    setShowBackgroundRationale(false);
    const granted = await requestIOSAlwaysPermission();
    if (granted) {
      toastNew({
        title: "Background Location Enabled ✓",
        description: "You can now contribute with your screen locked!",
      });
    } else {
      toastNew({
        title: "Background Location Not Enabled",
        description: "You can still contribute while the app is open.",
        variant: "destructive",
      });
    }
  };

  // Speed test handler with cellular data warning
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
        toastNew({
          title: "Speed Test Complete ⚡",
          description: `↓ ${result.down?.toFixed(1) ?? 'N/A'} Mbps  ↑ ${result.up?.toFixed(1) ?? 'N/A'} Mbps`,
        });
      } else {
        toastNew({
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

  const getConnectionLabel = () => {
    if (!isOnline) return 'Offline';
    const connStr = String(connectionType).toLowerCase();
    if (connStr.includes('5g')) return '5G';
    if (connStr.includes('4g') || connStr.includes('lte')) return 'LTE';
    if (connStr.includes('3g')) return '3G';
    if (connStr.includes('wifi')) return 'WiFi';
    return 'Cellular';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AppSpinner size="lg" />
      </div>
    );
  }

  const displayName = username || 'there';
  const totalPoints = points?.total_points || 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <AppSEO />
      
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>

      {/* GDPR Consent Modal */}
      {showConsentModal && !consentGiven && (
        <DataConsentModal 
          onConsentComplete={async (accepted) => {
            setShowConsentModal(false);

            if (!accepted) {
              setConsentGiven(false);
              toastNew({
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
              toastNew({
                title: "Contribution Started ✓",
                description: "Location permission granted. Contributing data!",
              });
            } else {
              toastNew({
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
      <AnimatePresence>
        {showCellularDataWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowCellularDataWarning(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="relative bg-[#050a12]"
        style={{ 
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
          minHeight: 'calc(var(--vh, 1vh) * 100 + 200px)'
        }}
        ref={containerRef}
      >
        {/* Seamless gradient background - extends full height */}
        <div 
          className="fixed inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, #0a0f1a 0%, #050a12 30%, #030608 60%, #020406 100%)',
            zIndex: 0
          }}
        />
        <PullToRefreshIndicator 
          pullDistance={pullDistance}
          pullProgress={pullProgress}
          isRefreshing={isRefreshing}
        />

        {/* Safe area top padding */}
        <div className="relative z-10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />

        {/* 1. Header with Greeting, Theme Toggle, Settings */}
        <header className="relative z-20 flex items-center justify-between px-4 pt-3 pb-2 bg-transparent">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <div>
              <p className="text-[10px] text-amber-400 font-medium uppercase tracking-wide">{greeting}</p>
              <h1 className="text-base font-bold text-white">{displayName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { lightTap(); setTheme(isDark ? 'light' : 'dark'); }}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 transition-colors hover:bg-white/10"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-white/80" />}
            </button>
            <button 
              onClick={() => { lightTap(); navigate('/app/profile'); }}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 transition-colors hover:bg-white/10"
            >
              <Settings className="w-5 h-5 text-white/80" />
            </button>
          </div>
        </header>

        {/* 2. Earnings Card */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 px-4 mb-3"
        >
          <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] text-amber-400 font-medium uppercase tracking-wide mb-1">Your Earnings</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white tabular-nums">
                    {totalPoints.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-amber-400">pts</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl bg-white/5 p-2.5 border border-white/5">
                <p className="text-[9px] text-white/50 uppercase tracking-wide mb-0.5">Today</p>
                <p className="text-base font-bold text-emerald-400">+{todayEarnings}</p>
              </div>
              <div className="flex-1 rounded-xl bg-white/5 p-2.5 border border-white/5">
                <p className="text-[9px] text-white/50 uppercase tracking-wide mb-0.5">Team</p>
                <p className="text-base font-bold text-white">{referralCount}</p>
              </div>
              {streakDays >= 2 && (
                <div className="flex-1 rounded-xl bg-white/5 p-2.5 border border-white/5">
                  <p className="text-[9px] text-white/50 uppercase tracking-wide mb-0.5">Streak</p>
                  <p className="text-base font-bold text-orange-400">🔥 {streakDays}d</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* 3. Globe Section - Fullscreen style */}
        <div 
          className="relative z-10 w-full"
          style={{ height: '45vh', minHeight: '300px', maxHeight: '400px' }}
        >
          <Suspense fallback={
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
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

        {/* 4. Session Stats - Only when active */}
        {isActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 mx-4 mb-4 grid grid-cols-3 gap-3 p-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10"
          >
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
          </motion.div>
        )}

        {/* 5. Control Buttons Row */}
        <div className="relative z-10 flex items-center justify-center gap-4 px-4 mb-4">
              {/* Start/Stop Button */}
              <button
                ref={startButtonRef}
                onClick={handleToggleContribution}
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

            {/* iOS Permission Indicator */}
            {isIOS && iosPermissionLabel !== 'Always' && (
              <div className="px-4 mb-4">
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
                          toastNew({ title: 'Location Enabled ✓', description: 'You can now start scanning.' });
                        } else {
                          toastNew({ title: 'Location Permission Required', description: "Enable in Settings → Privacy → Location Services → Nomiqa.", variant: 'destructive' });
                        }
                        return;
                      }
                      if (iosPermissionLabel === 'Denied') {
                        await BackgroundLocation.openAppSettings();
                        toastNew({ title: 'Enable Location', description: "Settings → Privacy → Location Services → Nomiqa." });
                      }
                    } catch { /* ignore */ }
                  }}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl backdrop-blur-md border transition-colors",
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
              </div>
            )}

            {/* Sign in prompt for logged out users */}
            {!user && (
              <div className="px-4 mb-4">
                <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
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
              </div>
            )}

        {/* 7. Content Cards Below */}
        <div className="relative z-10 px-4 space-y-4 pb-8 mt-4">

              {/* Grow Together Section */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/8 p-4"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white">Grow Together 🌱</h3>
                    <p className="text-xs text-white/60">Earn 5% of your team's earnings</p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2 mb-4 border border-white/5">
                  <span className="flex-1 text-sm text-white truncate font-mono">
                    nomiqa.com/{username || 'invite'}
                  </span>
                  <button
                    onClick={() => { lightTap(); handleCopyLink(); }}
                    className="p-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 transition-colors"
                  >
                    <Copy className="w-4 h-4 text-violet-400" />
                  </button>
                </div>

                <button
                  onClick={() => { mediumTap(); handleShareReferral(); }}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg"
                >
                  <Share2 className="w-4 h-4" />
                  Share & Grow Your Team
                </button>

                {referralCount > 0 && (
                  <p className="text-center text-xs text-violet-300 mt-3">
                    🎉 {referralCount} friend{referralCount !== 1 ? 's' : ''} earning with you!
                  </p>
                )}
              </motion.div>

              {/* Quick Actions - Challenges & Team */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid grid-cols-2 gap-3"
              >
                <button
                  onClick={() => { lightTap(); navigate('/app/challenges'); }}
                  className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/8 p-4 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">Challenges</p>
                    <p className="text-[10px] text-amber-400">Earn bonus</p>
                  </div>
                </button>

                <button
                  onClick={() => { lightTap(); navigate('/app/invite'); }}
                  className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/8 p-4 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">My Team</p>
                    <p className="text-[10px] text-cyan-400">See activity</p>
                  </div>
                </button>
              </motion.div>

              {/* How It Works */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/8 p-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-base font-bold text-white">How You Earn</h3>
                  <span className="text-sm">✨</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-xs font-bold text-white">1</span>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm font-semibold text-white">App runs in background</p>
                      <p className="text-xs text-white/50 mt-0.5">Uses less than 3% battery</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-xs font-bold text-white">2</span>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm font-semibold text-white">Contribute network data</p>
                      <p className="text-xs text-white/50 mt-0.5">100% anonymous signal quality info</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-xs font-bold text-white">3</span>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm font-semibold text-white">Earn points automatically</p>
                      <p className="text-xs text-white/50 mt-0.5">Redeem for real rewards 🎁</p>
                    </div>
                  </div>
                </div>
              </motion.div>

        </div>
      </div>
    </>
  );
};

export default AppHome;
