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

      <div
        className="min-h-screen bg-background"
        {...handlers}
      >
        <PullToRefreshIndicator 
          pullDistance={pullDistance}
          pullProgress={pullProgress}
          isRefreshing={isRefreshing}
        />

        <div className="pb-28" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
          
          {/* Warm Header with personality */}
          <header className="flex items-center justify-between px-5 mb-4">
            <div>
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">{greeting} ☀️</p>
              <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { lightTap(); setTheme(isDark ? 'light' : 'dark'); }}
                className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 transition-colors hover:bg-amber-500/15"
              >
                {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-amber-600" />}
              </button>
              <button 
                onClick={() => { lightTap(); navigate('/app/profile'); }}
                className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center border border-border transition-colors hover:bg-muted"
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </header>

          {/* Earnings Card - Warm & Encouraging */}
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-5 mb-5"
          >
            <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/5 border border-amber-500/20 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wide mb-1">Your Earnings</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground tabular-nums">
                      {totalPoints.toLocaleString()}
                    </span>
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">points</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex-1 rounded-xl bg-white/50 dark:bg-white/5 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Today</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{todayEarnings}</p>
                </div>
                <div className="flex-1 rounded-xl bg-white/50 dark:bg-white/5 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Team</p>
                  <p className="text-lg font-bold text-foreground">{referralCount} <span className="text-xs font-normal text-muted-foreground">members</span></p>
                </div>
              </div>
              
              {streakDays >= 2 && (
                <p className="text-xs text-amber-700 dark:text-amber-400 text-center mt-3">
                  🔥 {streakDays} day streak — you're on fire!
                </p>
              )}
            </div>
          </motion.div>

          {/* Globe Map Section with Floating Circular Buttons - FULL EXPANDED */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative mx-3 rounded-3xl overflow-hidden border border-border/50"
            style={{ 
              height: '52vh',
              minHeight: '340px',
              maxHeight: '480px',
              background: 'linear-gradient(180deg, hsl(222 30% 7%) 0%, hsl(222 35% 12%) 100%)'
            }}
          >
            {/* Globe */}
            <Suspense fallback={
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
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

            {/* Live Badge - Top Left */}
            <div className="absolute top-3 left-3 z-30">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
            </div>

            {/* Session Stats - Bottom Center (only when active) */}
            {isActive && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30">
                <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-white/60" />
                    <span className="text-xs font-medium text-white tabular-nums">{formatDuration(stats.duration)}</span>
                  </div>
                  <div className="w-px h-4 bg-white/20" />
                  <div className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-[#f0b429]" />
                    <span className="text-xs font-bold text-[#f0b429] tabular-nums">+{stats.pointsEarned.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* LEFT Floating Button - Start/Stop Contribution */}
            <button
              onClick={handleToggleContribution}
              disabled={!user}
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 z-30",
                "w-16 h-16 rounded-full flex flex-col items-center justify-center gap-0.5",
                "backdrop-blur-md border-2 transition-all duration-200 active:scale-95",
                !user && 'opacity-40 cursor-not-allowed',
                isActive 
                  ? isPaused 
                    ? 'bg-amber-500/30 border-amber-400/60' 
                    : 'bg-green-500/30 border-green-500/60'
                  : 'bg-red-500/30 border-red-500/60'
              )}
              style={{
                boxShadow: isActive && !isPaused
                  ? '0 0 30px rgba(34, 197, 94, 0.4)'
                  : '0 0 25px rgba(239, 68, 68, 0.4)',
              }}
            >
              {isActive ? (
                isPaused ? (
                  <Play className="w-6 h-6 text-amber-400" />
                ) : (
                  <Pause className="w-6 h-6 text-green-400" />
                )
              ) : (
                <Play className="w-6 h-6 text-red-400 ml-0.5" />
              )}
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-wider",
                isActive ? isPaused ? "text-amber-400" : "text-green-400" : "text-red-400"
              )}>
                {isActive ? (isPaused ? 'Resume' : 'Stop') : 'Start'}
              </span>
            </button>

            {/* RIGHT Floating Button - Speed Test */}
            <button
              onClick={handleSpeedTest}
              disabled={!isCellular || isRunningSpeedTest}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 z-30",
                "w-16 h-16 rounded-full flex flex-col items-center justify-center gap-0.5",
                "backdrop-blur-md border-2 transition-all duration-200 active:scale-95",
                isRunningSpeedTest 
                  ? 'bg-amber-500/30 border-amber-400/60' 
                  : isCellular 
                    ? 'bg-white/10 border-white/30'
                    : 'bg-white/5 border-white/10 cursor-not-allowed opacity-50'
              )}
            >
              <Gauge className={cn(
                "w-6 h-6",
                isRunningSpeedTest ? "text-amber-400 animate-spin" : "text-white/80"
              )} />
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-wider",
                isRunningSpeedTest ? "text-amber-400" : "text-white/70"
              )}>
                {isRunningSpeedTest 
                  ? speedTestPhase === 'latency' ? 'Ping' 
                    : speedTestPhase === 'download' ? 'Down' : 'Up'
                  : 'Speed'}
              </span>
              {isRunningSpeedTest && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-100"
                    style={{ width: `${speedTestProgress}%` }}
                  />
                </div>
              )}
            </button>

            {/* Expand to full map - Top Right */}
            <button
              onClick={() => { lightTap(); navigate('/app/map'); }}
              className="absolute top-3 right-3 z-30 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white/80 active:scale-95 transition-transform"
            >
              Expand
            </button>
          </motion.div>

          {/* Content below the map */}
          <div className="px-5 mt-4 space-y-4">

            {/* Grow Together Section - Warm & Inviting */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/5 border border-violet-500/20 p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">Grow Together 🌱</h3>
                  <p className="text-sm text-muted-foreground">Earn 5% of your team's earnings</p>
                </div>
              </div>

              {/* Referral Link Display */}
              <div className="bg-white/50 dark:bg-white/5 rounded-xl p-3 flex items-center gap-2 mb-4 border border-border">
                <span className="flex-1 text-sm text-foreground truncate font-mono">
                  nomiqa.com/{username || 'invite'}
                </span>
                <button
                  onClick={() => { lightTap(); handleCopyLink(); }}
                  className="p-2 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-colors"
                >
                  <Copy className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </button>
              </div>

              <button
                onClick={() => { mediumTap(); handleShareReferral(); }}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg"
              >
                <Share2 className="w-4 h-4" />
                Share & Grow Your Team
              </button>

              {referralCount > 0 && (
                <p className="text-center text-xs text-violet-700 dark:text-violet-300 mt-3">
                  🎉 {referralCount} friend{referralCount !== 1 ? 's' : ''} earning with you!
                </p>
              )}
            </motion.div>

            {/* Quick Actions - Rewards & Leaderboard */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 gap-3"
            >
              <button
                onClick={() => { lightTap(); navigate('/app/rewards'); }}
                className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 p-4 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">Rewards</p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400">Claim gifts</p>
                </div>
              </button>

              <button
                onClick={() => { lightTap(); navigate('/app/leaderboard'); }}
                className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 p-4 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">Leaderboard</p>
                  <p className="text-[10px] text-blue-700 dark:text-blue-400">Top earners</p>
                </div>
              </button>
            </motion.div>

            {/* How It Works - Warm & Friendly */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/5 border border-emerald-500/20 p-5"
            >
              <div className="flex items-center gap-2 mb-5">
                <h3 className="text-lg font-bold text-foreground">How You Earn</h3>
                <span className="text-sm">✨</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-sm font-bold text-white">1</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-semibold text-foreground">App runs in background</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Uses less than 3% battery — you won't even notice</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-sm font-bold text-white">2</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-semibold text-foreground">Contribute network data</p>
                    <p className="text-xs text-muted-foreground mt-0.5">100% anonymous signal quality info</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-sm font-bold text-white">3</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-semibold text-foreground">Earn points automatically</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Redeem for real rewards anytime 🎁</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </>
  );
};

export default AppHome;
