import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Capacitor } from '@capacitor/core';
import { 
  Settings,
  Users,
  Share2,
  Sun,
  Moon,
  ChevronRight,
  CheckCircle2,
  Copy,
  Gift,
  TrendingUp,
  Clock,
  Play,
  Pause,
  Gauge,
  Zap
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
import { formatPoints } from '@/utils/tokenomics';
import { useNativeShare } from '@/hooks/useNativeShare';
import { AppSEO } from '@/components/app/AppSEO';
import { toast } from 'sonner';
import { useContributionPersistence } from '@/hooks/useContributionPersistence';
import { useNetworkContribution } from '@/hooks/useNetworkContribution';
import { useGlobalCoverage } from '@/hooks/useGlobalCoverage';
import { DataConsentModal, hasDataConsent } from '@/components/app/DataConsentModal';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { toast as toastNew } from '@/hooks/use-toast';

// Lazy load NetworkGlobe for performance
const NetworkGlobe = lazy(() => import('@/components/app/NetworkGlobe').then(m => ({ default: m.NetworkGlobe })));

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
  
  // Use client-side persistence for accurate contribution state
  const { isContributionEnabled } = useContributionPersistence();
  
  // Network contribution hook for controlling scanning
  const {
    user,
    session,
    stats,
    lastPosition,
    isCellular,
    isPaused,
    startContribution,
    stopContribution,
    formatDuration,
    triggerManualSpeedTest
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
  
  // Speed test state
  const [isRunningSpeedTest, setIsRunningSpeedTest] = useState(false);
  const [speedTestProgress, setSpeedTestProgress] = useState(0);
  const [speedTestPhase, setSpeedTestPhase] = useState<'idle' | 'latency' | 'download' | 'upload'>('idle');
  const [liveSpeed, setLiveSpeed] = useState<{ down?: number; up?: number; latency?: number }>({});
  
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

  const loadData = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (currentUser) {
        // Load profile (using _safe view to exclude sensitive fields)
        const { data: profileData } = await supabase
          .from('profiles_safe')
          .select('username')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        if (profileData?.username) {
          setUsername(profileData.username);
        }

        // Load points
        const { data: pointsData } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        if (pointsData) {
          setPoints(pointsData);
        }

        // Load referral count from affiliate data (using _safe view)
        const { data: affiliateData } = await supabase
          .from('affiliates_safe')
          .select('total_registrations')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        if (affiliateData?.total_registrations) {
          setReferralCount(affiliateData.total_registrations);
        }

        // Calculate today's earnings
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

  const { isRefreshing, pullDistance, pullProgress, handlers } = usePullToRefresh({
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

  // Handle start/stop contribution
  const handleToggleContribution = async () => {
    buttonTap();
    if (isActive) {
      stopContribution();
      playSuccess();
      if (stats.pointsEarned > 0) {
        toast.success(`Session ended! +${stats.pointsEarned.toFixed(1)} pts`);
      }
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

  // Speed test handler
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AppSpinner size="lg" />
      </div>
    );
  }

  const displayName = username || 'there';
  const totalPoints = points?.total_points || 0;

  // Get greeting based on time
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

      {/* Immersive Dark Background with Globe */}
      <div
        className="min-h-screen relative"
        {...handlers}
      >
        {/* Full-Screen Globe Background - Visible */}
        <div className="fixed inset-0 z-0">
          <Suspense fallback={null}>
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

        <PullToRefreshIndicator 
          pullDistance={pullDistance}
          pullProgress={pullProgress}
          isRefreshing={isRefreshing}
        />

        {/* Content Layer - Pushed down to show globe */}
        <div className="relative z-10 pb-28" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
          
          {/* Live Badge - Top Left */}
          <div className="absolute top-3 left-4 z-30" style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/40 border border-emerald-500/50 backdrop-blur-xl shadow-lg">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
            </div>
          </div>

          {/* Globe Viewing Area */}
          <div className="h-[42vh] min-h-[280px] max-h-[380px]" />

          {/* Warm Welcome Header - Transparent Glassmorphism */}
          <header className="px-4 mb-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-black/50 backdrop-blur-2xl border border-white/20 p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-amber-400 font-medium">{greeting} 👋</p>
                  <h1 className="text-2xl font-bold text-white">{displayName}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { lightTap(); setTheme(isDark ? 'light' : 'dark'); }}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 active:scale-95 transition-transform"
                  >
                    {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-white/80" />}
                  </button>
                  <button 
                    onClick={() => { lightTap(); navigate('/app/profile'); }}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 active:scale-95 transition-transform"
                  >
                    <Settings className="w-5 h-5 text-white/70" />
                  </button>
                </div>
              </div>

              {/* Points Display - Warm Gradient */}
              <div className="rounded-2xl bg-gradient-to-br from-amber-500/25 via-orange-500/20 to-rose-500/15 border border-amber-500/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-300 font-medium mb-1">Your Earnings</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white tabular-nums">
                        {totalPoints.toLocaleString()}
                      </span>
                      <span className="text-sm text-white/60">points</span>
                    </div>
                    {totalPoints > 0 && (
                      <p className="text-xs text-emerald-400 mt-1">Keep it up! 🎉</p>
                    )}
                  </div>
                  <div className="flex gap-5">
                    <div className="text-center">
                      <p className="text-[10px] text-white/60 uppercase tracking-wider mb-0.5">Today</p>
                      <p className="text-lg font-bold text-emerald-400">+{todayEarnings}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-white/60 uppercase tracking-wider mb-0.5">Team</p>
                      <p className="text-lg font-bold text-white">{referralCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </header>

          {/* Floating Action Buttons - Centered */}
          <div className="flex justify-center gap-6 mb-6 px-5">
            {/* Start/Stop Contribution Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              onClick={handleToggleContribution}
              disabled={!user}
              className={cn(
                "w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1",
                "backdrop-blur-xl border-2 transition-all duration-200 active:scale-95",
                !user && 'opacity-40 cursor-not-allowed',
                isActive 
                  ? isPaused 
                    ? 'bg-amber-500/20 border-amber-400/60' 
                    : 'bg-green-500/20 border-green-500/60'
                  : 'bg-red-500/20 border-red-500/60'
              )}
              style={{
                boxShadow: isActive && !isPaused
                  ? '0 0 40px rgba(34, 197, 94, 0.4)'
                  : '0 0 35px rgba(239, 68, 68, 0.4)',
              }}
            >
              {isActive ? (
                isPaused ? (
                  <Play className="w-7 h-7 text-amber-400" />
                ) : (
                  <Pause className="w-7 h-7 text-green-400" />
                )
              ) : (
                <Play className="w-7 h-7 text-red-400 ml-0.5" />
              )}
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider",
                isActive ? isPaused ? "text-amber-400" : "text-green-400" : "text-red-400"
              )}>
                {isActive ? (isPaused ? 'Resume' : 'Stop') : 'Start'}
              </span>
            </motion.button>

            {/* Speed Test Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              onClick={handleSpeedTest}
              disabled={!isCellular || isRunningSpeedTest}
              className={cn(
                "w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 relative",
                "backdrop-blur-xl border-2 transition-all duration-200 active:scale-95",
                isRunningSpeedTest 
                  ? 'bg-amber-500/20 border-amber-400/60' 
                  : isCellular 
                    ? 'bg-white/10 border-white/30'
                    : 'bg-white/5 border-white/10 cursor-not-allowed opacity-50'
              )}
            >
              <Gauge className={cn(
                "w-7 h-7",
                isRunningSpeedTest ? "text-amber-400 animate-spin" : "text-white/80"
              )} />
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider",
                isRunningSpeedTest ? "text-amber-400" : "text-white/70"
              )}>
                {isRunningSpeedTest 
                  ? speedTestPhase === 'latency' ? 'Ping' 
                    : speedTestPhase === 'download' ? 'Down' : 'Up'
                  : 'Speed'}
              </span>
              {isRunningSpeedTest && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-100"
                    style={{ width: `${speedTestProgress}%` }}
                  />
                </div>
              )}
            </motion.button>
          </div>

          {/* Session Stats (when active) */}
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mb-5"
            >
              <div className="flex items-center gap-4 px-5 py-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 shadow-xl">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-white/70" />
                  <span className="text-sm font-medium text-white tabular-nums">{formatDuration(stats.duration)}</span>
                </div>
                <div className="w-px h-5 bg-white/20" />
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-amber-400 tabular-nums">+{stats.pointsEarned.toFixed(1)}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Floating Cards Container */}
          <div className="px-4 space-y-4">

            {/* Referral Section - Transparent Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl bg-black/40 backdrop-blur-xl border border-white/20 p-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/40 to-orange-500/30 flex items-center justify-center border border-amber-500/50 shadow-lg shadow-amber-500/20">
                  <Gift className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white">Grow Together 🌱</h3>
                  <p className="text-sm text-white/70">Invite friends & earn 5% of their points</p>
                </div>
              </div>

              {/* Referral Link Display */}
              <div className="bg-black/30 rounded-xl p-3 flex items-center gap-2 mb-4 border border-white/15">
                <span className="flex-1 text-sm text-white/70 truncate font-mono">
                  nomiqa.com/{username || 'invite'}
                </span>
                <button
                  onClick={() => { lightTap(); handleCopyLink(); }}
                  className="p-2.5 rounded-lg bg-amber-500/25 hover:bg-amber-500/35 transition-colors border border-amber-500/50 active:scale-95"
                >
                  <Copy className="w-4 h-4 text-amber-400" />
                </button>
              </div>

              <button
                onClick={() => { mediumTap(); handleShareReferral(); }}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-amber-500/30"
              >
                <Share2 className="w-4 h-4" />
                Share Your Link
              </button>

              {referralCount > 0 && (
                <p className="text-center text-xs text-amber-400 mt-3">
                  🎊 {referralCount} friend{referralCount !== 1 ? 's' : ''} earning with you!
                </p>
              )}
            </motion.div>

            {/* Leaderboard Card - Transparent Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <button
                onClick={() => { lightTap(); navigate('/app/leaderboard'); }}
                className="w-full rounded-2xl bg-black/40 backdrop-blur-xl border border-white/20 p-4 flex items-center gap-4 active:scale-[0.98] transition-transform shadow-2xl"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/40 to-purple-500/30 flex items-center justify-center border border-violet-500/50 shadow-lg shadow-violet-500/20">
                  <TrendingUp className="w-6 h-6 text-violet-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-white">Leaderboard</p>
                  <p className="text-xs text-white/60">See top earners this week</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/50" />
              </button>
            </motion.div>

            {/* How It Works - Transparent Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-3xl bg-black/40 backdrop-blur-xl border border-white/20 p-5 shadow-2xl"
            >
              <h3 className="text-base font-semibold text-white mb-1">How You Earn ✨</h3>
              <p className="text-xs text-white/60 mb-4">It's simple, passive, and rewarding</p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/40 to-cyan-500/30 flex items-center justify-center flex-shrink-0 border border-sky-500/50 shadow-lg shadow-sky-500/20">
                    <span className="text-sm font-bold text-sky-400">1</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-medium text-white">App runs quietly in background</p>
                    <p className="text-xs text-white/60 mt-0.5">Uses less than 3% battery daily — you won't even notice</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/40 to-indigo-500/30 flex items-center justify-center flex-shrink-0 border border-blue-500/50 shadow-lg shadow-blue-500/20">
                    <span className="text-sm font-bold text-blue-400">2</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-medium text-white">Share anonymous network data</p>
                    <p className="text-xs text-white/60 mt-0.5">Help improve coverage for everyone, completely private</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/40 to-violet-500/30 flex items-center justify-center flex-shrink-0 border border-indigo-500/50 shadow-lg shadow-indigo-500/20">
                    <span className="text-sm font-bold text-indigo-400">3</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-medium text-white">Watch your points grow</p>
                    <p className="text-xs text-white/60 mt-0.5">Redeem for real rewards whenever you're ready</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Encouraging Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-center py-6"
            >
              <p className="text-sm text-white/80">
                You're part of something big 🌍
              </p>
              <p className="text-xs text-white/60 mt-1">
                Every contribution helps build a better network
              </p>
            </motion.div>

          </div>
        </div>
      </div>
    </>
  );
};

export default AppHome;
