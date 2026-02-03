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
        className="min-h-screen relative bg-[hsl(222,30%,8%)]"
        {...handlers}
      >
        {/* Dark background */}
        <div className="fixed inset-0 z-0 bg-[hsl(222,30%,8%)]" />

        <PullToRefreshIndicator 
          pullDistance={pullDistance}
          pullProgress={pullProgress}
          isRefreshing={isRefreshing}
        />

        {/* Content Layer */}
        <div className="relative z-10 pb-28" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          
          {/* Live Badge - Top Left */}
          <div className="px-4 pt-3 mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/50 border border-emerald-500/40 backdrop-blur-xl">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
            </div>
          </div>

          {/* Greeting Card */}
          <header className="px-4 mb-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/15 p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-white/70 font-medium">{greeting} 👋</p>
                  <h1 className="text-xl font-bold text-white">{displayName}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { lightTap(); setTheme(isDark ? 'light' : 'dark'); }}
                    className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 active:scale-95 transition-transform"
                  >
                    {isDark ? <Sun className="w-4 h-4 text-white/80" /> : <Moon className="w-4 h-4 text-white/80" />}
                  </button>
                  <button 
                    onClick={() => { lightTap(); navigate('/app/profile'); }}
                    className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 active:scale-95 transition-transform"
                  >
                    <Settings className="w-4 h-4 text-white/70" />
                  </button>
                </div>
              </div>

              {/* Points Display - Clean white/emerald theme */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-white/50 font-medium mb-0.5 uppercase tracking-wider">Your Earnings</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-white tabular-nums">
                        {totalPoints.toLocaleString()}
                      </span>
                      <span className="text-xs text-white/50">points</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-[9px] text-white/50 uppercase tracking-wider mb-0.5">Today</p>
                      <p className="text-base font-bold text-emerald-400">+{todayEarnings}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-white/50 uppercase tracking-wider mb-0.5">Team</p>
                      <p className="text-base font-bold text-white">{referralCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </header>

          {/* Action Buttons */}
          <div className="flex justify-center gap-5 mb-3 px-4">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              onClick={handleToggleContribution}
              disabled={!user}
              className={cn(
                "w-16 h-16 rounded-full flex flex-col items-center justify-center gap-0.5",
                "backdrop-blur-xl border-2 transition-all duration-200 active:scale-95",
                !user && 'opacity-40 cursor-not-allowed',
                isActive 
                  ? isPaused 
                    ? 'bg-white/10 border-white/30' 
                    : 'bg-emerald-500/20 border-emerald-500/60'
                  : 'bg-white/10 border-white/30'
              )}
              style={{
                boxShadow: isActive && !isPaused
                  ? '0 0 30px rgba(16, 185, 129, 0.4)'
                  : '0 0 20px rgba(255, 255, 255, 0.1)',
              }}
            >
              {isActive ? (
                isPaused ? <Play className="w-6 h-6 text-white/80" /> : <Pause className="w-6 h-6 text-emerald-400" />
              ) : (
                <Play className="w-6 h-6 text-white/80 ml-0.5" />
              )}
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-wider",
                isActive ? isPaused ? "text-white/70" : "text-emerald-400" : "text-white/70"
              )}>
                {isActive ? (isPaused ? 'Resume' : 'Stop') : 'Start'}
              </span>
            </motion.button>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              onClick={handleSpeedTest}
              disabled={!isCellular || isRunningSpeedTest}
              className={cn(
                "w-16 h-16 rounded-full flex flex-col items-center justify-center gap-0.5 relative",
                "backdrop-blur-xl border-2 transition-all duration-200 active:scale-95",
                isRunningSpeedTest 
                  ? 'bg-cyan-500/20 border-cyan-400/60' 
                  : isCellular 
                    ? 'bg-white/10 border-white/30'
                    : 'bg-white/5 border-white/10 cursor-not-allowed opacity-50'
              )}
            >
              <Gauge className={cn("w-6 h-6", isRunningSpeedTest ? "text-cyan-400 animate-spin" : "text-white/80")} />
              <span className={cn("text-[8px] font-bold uppercase tracking-wider", isRunningSpeedTest ? "text-cyan-400" : "text-white/70")}>
                {isRunningSpeedTest ? speedTestPhase === 'latency' ? 'Ping' : speedTestPhase === 'download' ? 'Down' : 'Up' : 'Speed'}
              </span>
              {isRunningSpeedTest && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${speedTestProgress}%` }} />
                </div>
              )}
            </motion.button>
          </div>

          {/* Session Stats (when active) */}
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mb-3"
            >
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/50 backdrop-blur-xl border border-white/15">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-xs font-medium text-white tabular-nums">{formatDuration(stats.duration)}</span>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <div className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 tabular-nums">+{stats.pointsEarned.toFixed(1)}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Globe Section - Inline between buttons and cards */}
          <div className="relative w-full h-[32vh] min-h-[200px] max-h-[280px] my-2">
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

          {/* Cards Section */}
          <div className="px-4 space-y-3">

            {/* Referral Section - Clean theme */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 p-4 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Gift className="w-5 h-5 text-white/80" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">Grow Together 🌱</h3>
                  <p className="text-xs text-white/60">Invite friends & earn 5% of their points</p>
                </div>
              </div>

              <div className="bg-black/40 rounded-lg p-2.5 flex items-center gap-2 mb-3 border border-white/10">
                <span className="flex-1 text-xs text-white/60 truncate font-mono">
                  nomiqa.com/{username || 'invite'}
                </span>
                <button
                  onClick={() => { lightTap(); handleCopyLink(); }}
                  className="p-2 rounded-lg bg-white/10 border border-white/20 active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5 text-white/70" />
                </button>
              </div>

              <button
                onClick={() => { mediumTap(); handleShareReferral(); }}
                className="w-full h-10 rounded-lg bg-white/15 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share Your Link
              </button>

              {referralCount > 0 && (
                <p className="text-center text-[11px] text-emerald-400 mt-2">
                  🎊 {referralCount} friend{referralCount !== 1 ? 's' : ''} earning with you!
                </p>
              )}
            </motion.div>

            {/* Leaderboard Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <button
                onClick={() => { lightTap(); navigate('/app/leaderboard'); }}
                className="w-full rounded-xl bg-black/60 backdrop-blur-xl border border-white/15 p-3 flex items-center gap-3 active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/20 flex items-center justify-center border border-violet-500/40">
                  <TrendingUp className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-white">Leaderboard</p>
                  <p className="text-[11px] text-white/50">See top earners this week</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40" />
              </button>
            </motion.div>

            {/* How It Works */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 p-4 shadow-xl"
            >
              <h3 className="text-sm font-semibold text-white mb-0.5">How You Earn ✨</h3>
              <p className="text-[11px] text-white/50 mb-3">It's simple, passive, and rewarding</p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500/30 to-cyan-500/20 flex items-center justify-center flex-shrink-0 border border-sky-500/40">
                    <span className="text-xs font-bold text-sky-400">1</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-xs font-medium text-white">App runs quietly in background</p>
                    <p className="text-[11px] text-white/50">Uses less than 3% battery daily</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/30 to-indigo-500/20 flex items-center justify-center flex-shrink-0 border border-blue-500/40">
                    <span className="text-xs font-bold text-blue-400">2</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-xs font-medium text-white">Share anonymous network data</p>
                    <p className="text-[11px] text-white/50">Help improve coverage for everyone</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/30 to-violet-500/20 flex items-center justify-center flex-shrink-0 border border-indigo-500/40">
                    <span className="text-xs font-bold text-indigo-400">3</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-xs font-medium text-white">Watch your points grow</p>
                    <p className="text-[11px] text-white/50">Redeem for real rewards</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-center py-4"
            >
              <p className="text-xs text-white/70">You're part of something big 🌍</p>
              <p className="text-[11px] text-white/50 mt-0.5">Every contribution helps build a better network</p>
            </motion.div>

          </div>
        </div>
      </div>
    </>
  );
};

export default AppHome;
