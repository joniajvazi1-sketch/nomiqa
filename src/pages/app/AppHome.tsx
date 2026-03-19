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
  MapPin,
  Flame,
  BarChart3,
  Activity,
  Sparkles,
  Video,
  Phone,
  Gamepad2,
  Globe
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

import { AnimatePresence, motion } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/app/PullToRefreshIndicator';
import { AppSpinner } from '@/components/app/AppSpinner';
import { useNativeShare } from '@/hooks/useNativeShare';
import { AppSEO } from '@/components/app/AppSEO';
import { toast } from 'sonner';
import { useNetworkContribution, requestIOSAlwaysPermission, getIOSPermissionStatus } from '@/hooks/useNetworkContribution';
import { useGlobalCoverage } from '@/hooks/useGlobalCoverage';
import { hasDataConsent } from '@/components/app/DataConsentModal';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { toast as toastNew } from '@/hooks/use-toast';
import { StreakCalendar } from '@/components/app/StreakCalendar';

// Lazy load NetworkGlobe for performance
const NetworkGlobe = lazy(() => import('@/components/app/NetworkGlobe').then(m => ({ default: m.NetworkGlobe })));

// Lazy load conditional modals/overlays — they're heavy and rarely shown together
const OnboardingFlow = lazy(() => import('@/components/app/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })));
const DataConsentModal = lazy(() => import('@/components/app/DataConsentModal').then(m => ({ default: m.DataConsentModal })));
const BackgroundLocationRationale = lazy(() => import('@/components/app/BackgroundLocationRationale').then(m => ({ default: m.BackgroundLocationRationale })));
const RewardCelebration = lazy(() => import('@/components/app/RewardCelebration').then(m => ({ default: m.RewardCelebration })));

// Permission status type for iOS display
type IOSPermissionStatusLabel = 'Not Determined' | 'While Using' | 'Always' | 'Denied' | 'Unknown';

export const AppHome: React.FC = () => {
  const navigate = useNavigate();
  const { mediumTap, lightTap } = useHaptics();
  const { buttonTap, successPattern } = useEnhancedHaptics();
  const { playCoin, playSuccess } = useEnhancedSounds();
  const { isOnline } = useNetworkStatus();
  const [streakDays, setStreakDays] = useState(0);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [checkinHistory, setCheckinHistory] = useState<{ date: string; points: number }[]>([]);
  const [miningBoost, setMiningBoost] = useState(0);

  // Network intelligence state
  const [carriers, setCarriers] = useState<{ carrier_name: string; country_code: string; avg_download_mbps: number; avg_upload_mbps: number; avg_latency_ms: number; coverage_score: number }[]>([]);
  const [recentFeed, setRecentFeed] = useState<any[]>([]);
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
    getSpeedTestDataEstimate,
    getRewardedTestsRemaining,
    dailySpeedTestLimit,
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
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayBreakdown, setTodayBreakdown] = useState<{ contribution: number; speedTest: number; rewards: number; friends: number }>({ contribution: 0, speedTest: 0, rewards: 0, friends: 0 });
  
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const pointsRef = useRef(points);
  useEffect(() => { pointsRef.current = points; }, [points]);
  const todayEarningsRef = useRef(todayEarnings);
  useEffect(() => { todayEarningsRef.current = todayEarnings; }, [todayEarnings]);

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
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Parallelize ALL queries for speed
        const [profileRes, pointsRes, affiliateRes, dailyLimitRes, checkinRes, socialRes, challengeRes, speedTestRes, checkinHistoryRes] = await Promise.all([
          supabase.from('profiles_safe').select('username').eq('user_id', currentUser.id).maybeSingle(),
          supabase.from('user_points').select('*').eq('user_id', currentUser.id).maybeSingle(),
          supabase.from('affiliates_safe').select('id, total_registrations, miner_boost_percentage, affiliate_code, username').eq('user_id', currentUser.id).maybeSingle(),
          supabase.from('user_daily_limits').select('points_earned').eq('user_id', currentUser.id).eq('limit_date', todayStr).maybeSingle(),
          supabase.from('daily_checkins').select('bonus_points').eq('user_id', currentUser.id).eq('check_in_date', todayStr),
          supabase.from('social_task_claims').select('points_awarded').eq('user_id', currentUser.id).gte('claimed_at', todayStr),
          supabase.from('user_challenge_progress').select('challenge_id').eq('user_id', currentUser.id).not('claimed_at', 'is', null).gte('period_start', todayStr),
          supabase.from('speed_test_results').select('id').eq('user_id', currentUser.id).gte('recorded_at', todayStr),
          supabase.from('daily_checkins').select('check_in_date, bonus_points').eq('user_id', currentUser.id).order('check_in_date', { ascending: false }).limit(90),
        ]);

        if (profileRes.data?.username) setUsername(profileRes.data.username);
        if (pointsRes.data) {
          setPoints(pointsRes.data);
          setStreakDays(pointsRes.data.contribution_streak_days || 0);
        }
        
        // Load mining boost from affiliate data
        if (affiliateRes.data?.miner_boost_percentage) {
          setMiningBoost(affiliateRes.data.miner_boost_percentage);
        }
        // Set referral code from affiliate data (same logic as Profile/Invite screens)
        if (affiliateRes.data) {
          setReferralCode(affiliateRes.data.affiliate_code || affiliateRes.data.username || null);
        }
        
        // Load checkin history for streak calendar
        if (checkinHistoryRes.data) {
          setCheckinHistory(checkinHistoryRes.data.map((c: any) => ({ date: c.check_in_date, points: c.bonus_points })));
        }
        // Real referral count from affiliate_referrals (safety net against cached total_registrations drift)
        if (affiliateRes.data?.id) {
          const { count } = await supabase
            .from('affiliate_referrals')
            .select('id', { count: 'exact', head: true })
            .eq('affiliate_id', affiliateRes.data.id)
            .not('registered_user_id', 'is', null);
          setReferralCount(count ?? affiliateRes.data.total_registrations ?? 0);
        }

        // Calculate today's breakdown
        const contributionPts = dailyLimitRes.data?.points_earned || 0;
        const checkinPts = (checkinRes.data || []).reduce((sum, r) => sum + (r.bonus_points || 0), 0);
        const socialPts = (socialRes.data || []).reduce((sum, r) => sum + (r.points_awarded || 0), 0);
        const speedTestCount = (speedTestRes.data || []).length;
        // Speed tests earn 10-25 pts depending on connection; estimate conservatively
        const speedTestPts = Math.min(speedTestCount, 3) * 15; // average estimate
        const challengeCount = (challengeRes.data || []).length;
        
        // Get referral commission points earned today
        const { data: commissionRes } = await supabase
          .from('referral_commissions')
          .select('commission_points')
          .eq('referrer_user_id', currentUser.id)
          .gte('created_at', todayStr);
        const commissionPts = (commissionRes || []).reduce((sum, r) => sum + (r.commission_points || 0), 0);
        
        // Contribution points from daily_limits includes scanning + speed test points (capped at 200)
        // Rewards (checkins, social, challenges) bypass daily limits
        const rewardPts = checkinPts + socialPts;
        
        setTodayBreakdown({
          contribution: contributionPts, // all capped contribution (scanning + speed tests)
          speedTest: 0, // folded into contribution since both are capped
          rewards: rewardPts,
          friends: commissionPts,
        });
        setTodayEarnings(contributionPts + rewardPts + commissionPts);
      }

      // Load network intelligence (carriers + live feed) - non-blocking
      const [carriersRes, feedRes] = await Promise.all([
        supabase.from('carrier_benchmarks' as any).select('*').order('coverage_score', { ascending: false }).limit(6),
        supabase.from('signal_logs')
          .select('id, network_generation, carrier_name, country_code, speed_test_down, recorded_at')
          .not('carrier_name', 'is', null)
          .not('speed_test_down', 'is', null)
          .order('recorded_at', { ascending: false })
          .limit(5),
      ]);
      if (carriersRes.data) setCarriers(carriersRes.data as any);
      if (feedRes.data) setRecentFeed(feedRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refetch when user returns to the app/tab (e.g. after claiming points)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    const handlePointsUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const currentPoints = pointsRef.current;
      
      // Optimistic total points update
      if (detail?.newTotal != null && currentPoints) {
        setPoints(prev => prev ? { ...prev, total_points: detail.newTotal } : prev);
      } else if (detail?.pointsAdded != null && detail.pointsAdded > 0 && currentPoints) {
        setPoints(prev => prev ? { ...prev, total_points: prev.total_points + detail.pointsAdded } : prev);
      }
      
      // Optimistic today earnings update
      if (detail?.pointsAdded != null && detail.pointsAdded > 0) {
        setTodayEarnings(prev => prev + detail.pointsAdded);
      }
      
      // Always do a full refresh in background for consistency
      loadData();
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    window.addEventListener('points-updated', handlePointsUpdated);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      window.removeEventListener('points-updated', handlePointsUpdated);
    };
  }, [loadData]);

  const { isRefreshing, pullDistance, pullProgress, containerRef } = usePullToRefresh({
    onRefresh: loadData
  });

  const handleShareReferral = async () => {
    const code = referralCode || username || 'nomiqa';
    await share({
      title: 'Join Nomiqa',
      text: `Earn by contributing to the network. Join me on Nomiqa! Use my referral code: ${code} when you sign up.`,
      url: 'https://nomiqa-depin.com/download'
    });
  };

  const handleCopyLink = async () => {
    const code = referralCode || username || '';
    if (!code) {
      toast.error('No referral code available');
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      lightTap();
      toast.success('Referral code copied!');
    } catch {
      toast.error('Could not copy code');
    }
  };

  // Handle stop contribution with celebration
  const handleStopContribution = useCallback(async () => {
    const earnedThisSession = stats.pointsEarned;
    if (earnedThisSession > 0) {
      setCelebrationPoints(earnedThisSession);
      setShowCelebration(true);
    }
    await stopContribution();
    // Dispatch with pointsAdded so all screens can optimistically update
    window.dispatchEvent(new CustomEvent('points-updated', { detail: { pointsAdded: earnedThisSession } }));
  }, [stats.pointsEarned, stopContribution]);

  // Handle start/stop contribution - wrapped in try/catch to prevent app crash
  const handleToggleContribution = async () => {
    try {
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
    } catch (error) {
      console.error('[AppHome] Contribution toggle error:', error);
      toastNew({
        title: "Something went wrong",
        description: "Please try again. If the issue persists, restart the app.",
        variant: "destructive",
      });
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
        // Instantly refresh earnings after speed test
        window.dispatchEvent(new CustomEvent('points-updated', { detail: { pointsAdded: 25 } }));
        toastNew({
          title: "Speed Test Complete ⚡",
          description: `↓ ${result.down?.toFixed(1) ?? 'N/A'} Mbps  ↑ ${result.up?.toFixed(1) ?? 'N/A'} Mbps`,
        });
      } else {
        toastNew({
          title: "Speed Test Unavailable",
          description: "Couldn't connect. Don't worry — background earning continues normally!",
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
        <AppSpinner size="lg" rotatingLabel />
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
      
      <Suspense fallback={null}>
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
      </Suspense>

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
                  This speed test will use approximately <span className="font-bold text-amber-500">3–25 MB</span> of your cellular data.
                </p>
                <p className="text-sm text-foreground mt-2">
                  Running all 3 daily tests on cellular could use up to <span className="font-bold text-amber-500">~75 MB</span> total.
                </p>
                <p className="text-sm text-emerald-400 font-semibold mt-2">
                  🎉 Cellular tests earn <span className="font-bold">25 pts</span> (vs 10 pts on Wi-Fi)!
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Cellular data helps map real network coverage — that's why it's worth more!
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
        className={cn("relative", "bg-background")}
        style={{ 
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
          minHeight: 'calc(var(--vh, 1vh) * 100 + 200px)'
        }}
        ref={containerRef}
      >
        {/* Uniform background overlay - uses CSS variable for consistency */}
        {isDark && (
          <div 
            className="fixed inset-0 pointer-events-none bg-background"
            style={{ zIndex: 0 }}
          />
        )}
        <PullToRefreshIndicator 
          pullDistance={pullDistance}
          pullProgress={pullProgress}
          isRefreshing={isRefreshing}
        />

        {/* Safe area top padding */}
        <div className="relative z-10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />

        {/* 1. Header with Greeting, Theme Toggle, Settings */}
        <header className="relative z-20 flex items-center justify-between px-4 pt-3 pb-2 bg-transparent">
          <div className={cn("flex items-center gap-2.5 px-3 py-2 rounded-2xl backdrop-blur-md border", isDark ? "bg-background/40 border-border/30" : "bg-card/80 border-border")}>
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <div>
              <p className={cn("text-[10px] font-medium uppercase tracking-wide", isDark ? "text-amber-400" : "text-primary")}>{greeting}</p>
              <h1 className="text-base font-bold text-foreground">{displayName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { lightTap(); setTheme(isDark ? 'light' : 'dark'); toast.success(`Theme set to ${isDark ? 'light' : 'dark'} mode`); }}
              className={cn("w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border transition-colors", isDark ? "bg-background/40 border-border/30 hover:bg-muted/20" : "bg-card/80 border-border hover:bg-muted")}
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
            </button>
            <button 
              onClick={() => { lightTap(); navigate('/app/profile?tab=settings'); }}
              className={cn("w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border transition-colors", isDark ? "bg-background/40 border-border/30 hover:bg-muted/20" : "bg-card/80 border-border hover:bg-muted")}
            >
              <Settings className={cn("w-5 h-5", isDark ? "text-white/80" : "text-muted-foreground")} />
            </button>
          </div>
        </header>

        {/* 2. Earnings Card */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 px-4 mb-3"
        >
          <div className={cn("rounded-2xl backdrop-blur-xl border p-4", isDark ? "bg-background/40 border-border/30" : "bg-card/80 border-border")}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className={cn("text-[10px] font-medium uppercase tracking-wide mb-1", isDark ? "text-amber-400" : "text-primary")}>Your Earnings</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground tabular-nums">
                    {totalPoints.toLocaleString()}
                  </span>
                  <span className={cn("text-sm font-medium", isDark ? "text-amber-400" : "text-primary")}>pts</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
            
            {/* Micro-feedback: active session earning indicator */}
            {isActive && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg", isDark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-50 border border-emerald-200")}
              >
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-emerald-500">Background still earning</span>
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-xs font-bold text-emerald-400 ml-auto"
                >
                  +{stats.pointsEarned.toFixed(1)} pts
                </motion.span>
              </motion.div>
            )}
            
            {/* Today total */}
            <div className={cn("flex items-center justify-between px-3 py-2 rounded-xl mb-2", isDark ? "bg-white/5" : "bg-muted/40")}>
              <span className={cn("text-xs font-medium", isDark ? "text-white/60" : "text-muted-foreground")}>Today</span>
              <span className="text-sm font-bold text-foreground tabular-nums">
                +{todayBreakdown.contribution + todayBreakdown.rewards + todayBreakdown.friends} pts
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Contributing */}
              <div className={cn("rounded-xl p-2.5 border", isDark ? "bg-white/5 border-white/5" : "bg-muted/50 border-border")}>
                <p className={cn("text-[8px] uppercase tracking-wide mb-0.5 truncate", isDark ? "text-white/50" : "text-muted-foreground")}>📡 Contributing</p>
                <p className="text-sm font-bold text-emerald-400 tabular-nums">+{todayBreakdown.contribution}</p>
                <span className={cn("text-[7px] block mt-1 truncate", isDark ? "text-white/30" : "text-muted-foreground/70")}>Scanning + Speed</span>
              </div>

              {/* Friends */}
              <div className={cn("rounded-xl p-2.5 border", isDark ? "bg-white/5 border-white/5" : "bg-muted/50 border-border")}>
                <p className={cn("text-[8px] uppercase tracking-wide mb-0.5 truncate", isDark ? "text-white/50" : "text-muted-foreground")}>👥 Friends</p>
                <p className="text-sm font-bold text-sky-400 tabular-nums">+{todayBreakdown.friends}</p>
                <span className={cn("text-[7px] block mt-1 truncate", isDark ? "text-white/30" : "text-muted-foreground/70")}>{referralCount} team members</span>
              </div>

              {/* Bonuses */}
              <div className={cn("rounded-xl p-2.5 border", isDark ? "bg-white/5 border-white/5" : "bg-muted/50 border-border")}>
                <p className={cn("text-[8px] uppercase tracking-wide mb-0.5 truncate", isDark ? "text-white/50" : "text-muted-foreground")}>🎁 Bonuses</p>
                <p className="text-sm font-bold text-amber-400 tabular-nums">+{todayBreakdown.rewards}</p>
                <span className={cn("text-[7px] block mt-1 truncate", isDark ? "text-white/30" : "text-muted-foreground/70")}>Check-ins, tasks</span>
              </div>
            </div>

            {/* Streak indicator */}
            {streakDays >= 2 && (
              <div className={cn("flex items-center justify-center gap-1 mt-1.5", isDark ? "text-white/40" : "text-muted-foreground")}>
                <span className="text-[10px]">🔥 {streakDays} day streak</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* 3. Globe Section - centered between stats bar and buttons */}
        <div 
          className="relative z-10 w-full -mb-2 mt-14"
          style={{ height: '50vh', minHeight: '300px', maxHeight: '480px', contain: 'strict', pointerEvents: 'none', touchAction: 'pan-y' }}
        >
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
              allTimeCities={globalCoverageData?.allTimeCities || 0}
              totalContributors={globalCoverageData?.totalContributors || 0}
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
            className={cn("relative z-10 mx-4 mb-4 grid grid-cols-3 gap-3 p-3 rounded-2xl backdrop-blur-xl border", isDark ? "bg-background/40 border-border/30" : "bg-card/80 border-border")}
          >
            <div className="text-center">
              <p className="text-lg font-bold text-foreground tabular-nums">{formatDuration(stats.duration)}</p>
              <p className={cn("text-[10px] uppercase tracking-wider", isDark ? "text-[#00d4ff]/70" : "text-primary/70")}>Duration</p>
            </div>
            <div className={cn("text-center border-x", isDark ? "border-white/10" : "border-border")}>
              <p className="text-lg font-bold text-foreground tabular-nums">{stats.dataPointsCount}</p>
              <p className={cn("text-[10px] uppercase tracking-wider", isDark ? "text-[#00d4ff]/70" : "text-primary/70")}>Data Points</p>
            </div>
            <div className="text-center">
              <p className={cn("text-lg font-bold tabular-nums", isDark ? "text-[#00d4ff]" : "text-primary")}>+{stats.pointsEarned.toFixed(1)}</p>
              <p className={cn("text-[10px] uppercase tracking-wider", isDark ? "text-[#00d4ff]/70" : "text-primary/70")}>Points</p>
            </div>
          </motion.div>
        )}

        {/* 5. Control Buttons Row */}
        <div className="relative z-10 flex items-center justify-center gap-4 px-4 mb-4 mt-0">
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
                  <span className={cn("text-[10px]", isDark ? "text-white/50" : "text-muted-foreground")}>{isActive ? '' : 'Tap to start'}</span>
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
                : isDark ? 'bg-white/5 border-white/20 hover:bg-white/10' : 'bg-muted/50 border-border hover:bg-muted'
                )}
              >
                <div className="flex items-center gap-2">
                  <Gauge className={cn(
                    "w-5 h-5",
                    isRunningSpeedTest ? "text-amber-400 animate-spin" : isDark ? "text-white/80" : "text-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-bold uppercase tracking-wider",
                    isRunningSpeedTest ? "text-amber-400" : isDark ? "text-white/80" : "text-foreground"
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
                    <div className={cn("w-full h-1 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-muted")}>
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-100"
                        style={{ width: `${speedTestProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className={cn("text-[10px]", isDark ? "text-white/50" : "text-muted-foreground")}>Test Network</span>
                    <span className={cn("text-[10px] font-bold tabular-nums", getRewardedTestsRemaining() > 0 ? "text-amber-400" : isDark ? "text-white/30" : "text-muted-foreground/60")}>
                      {dailySpeedTestLimit - getRewardedTestsRemaining()}/{dailySpeedTestLimit} 🎁
                    </span>
                  </div>
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
                        : isDark ? "bg-white/10 border-white/20" : "bg-muted/50 border-border"
                  )}
                >
                  <MapPin className={cn(
                    "w-4 h-4",
                    iosPermissionLabel === 'While Using' ? "text-amber-400" : iosPermissionLabel === 'Denied' ? "text-red-400" : isDark ? "text-white/60" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-xs font-semibold",
                    iosPermissionLabel === 'While Using' ? "text-amber-400" : iosPermissionLabel === 'Denied' ? "text-red-400" : isDark ? "text-white/60" : "text-muted-foreground"
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
                <div className={cn("flex items-center justify-center gap-3 p-3 rounded-xl backdrop-blur-md border", isDark ? "bg-background/40 border-border/30" : "bg-card/80 border-border")}>
                  <span className={cn("text-sm", isDark ? "text-white/60" : "text-muted-foreground")}>Sign in to start earning</span>
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

              {/* Invite & Earn Section */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={cn("rounded-2xl backdrop-blur-xl border p-4", isDark ? "bg-background/40 border-border/30" : "bg-card/80 border-border")}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-foreground">Invite & Earn</h3>
                    <p className={cn("text-xs", isDark ? "text-white/60" : "text-muted-foreground")}>Get 10% of your team's points — forever</p>
                  </div>
                </div>

                {/* Tappable referral code */}
                <button
                  onClick={() => { lightTap(); handleCopyLink(); }}
                  className={cn("w-full rounded-xl p-3 flex items-center gap-2 mb-3 border text-left active:scale-[0.98] transition-transform", isDark ? "bg-white/5 border-white/10 hover:bg-white/8" : "bg-muted/50 border-border hover:bg-muted")}
                >
                  <span className="flex-1 text-sm text-foreground truncate font-mono">
                    {referralCode || username || 'No code yet'}
                  </span>
                  <Copy className="w-4 h-4 text-violet-400 flex-shrink-0" />
                </button>

                <button
                  onClick={() => { mediumTap(); handleShareReferral(); }}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg"
                >
                  <Share2 className="w-4 h-4" />
                  Invite Friends
                </button>

                {referralCount > 0 && (
                  <div className={cn("flex items-center justify-center gap-2 mt-3 px-3 py-2 rounded-lg", isDark ? "bg-violet-500/10 border border-violet-500/20" : "bg-violet-50 border border-violet-200")}>
                    <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                    <span className={cn("text-xs font-semibold", isDark ? "text-violet-300" : "text-violet-600")}>
                      {referralCount} team member{referralCount !== 1 ? 's' : ''} contributing
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Quick Actions - Streak, Challenges & Team */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid grid-cols-3 gap-2"
              >
                <button
                  onClick={() => { lightTap(); setShowStreakPopup(true); }}
                  className={cn("rounded-2xl backdrop-blur-xl border p-3 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform", isDark ? "bg-background/40 border-border/30" : "bg-card/80 border-border")}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-foreground">{streakDays > 0 ? `${streakDays}-Day` : 'Streak'}</p>
                    <p className={cn("text-[10px]", isDark ? "text-orange-400" : "text-primary")}>{miningBoost > 0 ? `+${miningBoost}%` : 'Calendar'}</p>
                  </div>
                </button>

                <button
                  onClick={() => { lightTap(); navigate('/app/challenges'); }}
                  className={cn("rounded-2xl backdrop-blur-xl border p-3 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform", isDark ? "bg-background/40 border-border/30" : "bg-card/80 border-border")}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-foreground">Challenges</p>
                    <p className={cn("text-[10px]", isDark ? "text-purple-400" : "text-primary")}>Earn bonus</p>
                  </div>
                </button>

                <button
                  onClick={() => { lightTap(); navigate('/app/invite'); }}
                  className={cn("rounded-2xl backdrop-blur-xl border p-3 flex flex-col items-center gap-2 active:scale-[0.98] transition-transform", isDark ? "bg-background/40 border-border/30" : "bg-card/80 border-border")}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-foreground">My Team</p>
                    <p className={cn("text-[10px]", isDark ? "text-cyan-400" : "text-primary")}>{referralCount > 0 ? `${referralCount} members` : 'Invite'}</p>
                  </div>
                </button>
              </motion.div>

              {/* Network Intelligence Section */}
              {(carriers.length > 0 || recentFeed.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={cn("rounded-2xl backdrop-blur-xl border p-4 space-y-4", isDark ? "bg-background/40 border-border/30" : "bg-card/80 border-border")}
                >
                  <div className="flex items-center gap-2">
                    <Signal className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-bold text-foreground">Coverage Insights</h3>
                  </div>

                  {/* Network Capability Scores */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className={cn("text-xs font-semibold", isDark ? "text-white/70" : "text-muted-foreground")}>What Your Network Supports</span>
                    </div>
                    <p className={cn("text-[10px] mb-2 ml-5", isDark ? "text-white/30" : "text-muted-foreground/70")}>Estimated from average carrier speeds in your area — not from your usage</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(() => {
                        const avgDown = carriers.length ? carriers.reduce((s, c) => s + (c.avg_download_mbps || 0), 0) / carriers.length : 0;
                        const avgLatency = carriers.length ? carriers.reduce((s, c) => s + (c.avg_latency_ms || 100), 0) / carriers.length : 100;
                        const qoeItems = [
                          { icon: Video, label: 'HD Streaming', score: avgDown >= 25 ? 'Excellent' : avgDown >= 10 ? 'Good' : avgDown >= 5 ? 'Fair' : 'Poor' },
                          { icon: Phone, label: 'Video Calls', score: avgDown >= 15 ? 'Excellent' : avgDown >= 5 ? 'Good' : avgDown >= 2 ? 'Fair' : 'Poor' },
                          { icon: Gamepad2, label: 'Low Latency', score: avgLatency <= 30 ? 'Excellent' : avgLatency <= 60 ? 'Good' : avgLatency <= 100 ? 'Fair' : 'Poor' },
                          { icon: Globe, label: 'General Use', score: avgDown >= 5 ? 'Excellent' : avgDown >= 2 ? 'Good' : avgDown >= 1 ? 'Fair' : 'Poor' },
                        ];
                        const colorMap: Record<string, string> = { Excellent: 'text-emerald-400', Good: 'text-primary', Fair: 'text-amber-400', Poor: 'text-destructive' };
                        return qoeItems.map(({ icon: Icon, label, score }) => (
                          <div key={label} className={cn("p-2.5 rounded-xl flex items-center gap-2.5 border", isDark ? "bg-white/5 border-white/5" : "bg-muted/50 border-border")}>
                            <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                              <div className={cn("text-[10px]", isDark ? "text-white/50" : "text-muted-foreground")}>{label}</div>
                              <div className={`text-xs font-bold ${colorMap[score]}`}>{score}</div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Top Carriers */}
                  {carriers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className={cn("text-xs font-semibold", isDark ? "text-white/70" : "text-muted-foreground")}>Top Carriers</span>
                      </div>
                      <p className={cn("text-[10px] mb-2", isDark ? "text-white/30" : "text-muted-foreground/70")}>Based on community data</p>
                      <div className="space-y-1.5">
                        {carriers.slice(0, 4).map((c, i) => {
                          const emoji = c.country_code?.length === 2
                            ? String.fromCodePoint(...c.country_code.toUpperCase().split('').map(ch => 127397 + ch.charCodeAt(0)))
                            : '🌍';
                          return (
                            <div key={i} className={cn("flex items-center justify-between px-3 py-2 rounded-xl border", isDark ? "bg-white/5 border-white/5" : "bg-muted/50 border-border")}>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{emoji}</span>
                                <span className="text-xs font-medium text-foreground">{c.carrier_name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-primary tabular-nums">{c.avg_download_mbps?.toFixed(0)} Mbps</span>
                                <div className="flex items-center gap-1">
                                  <div className={cn("w-8 h-1.5 rounded-full overflow-hidden", isDark ? "bg-white/10" : "bg-muted")}>
                                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.min(c.coverage_score || 0, 100)}%` }} />
                                  </div>
                                  <span className="text-[10px] font-bold text-foreground tabular-nums">{c.coverage_score?.toFixed(0)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Community Stats */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className={cn("text-xs font-semibold", isDark ? "text-white/70" : "text-muted-foreground")}>Network Trends</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={cn("p-3 rounded-xl border text-center", isDark ? "bg-white/5 border-white/5" : "bg-muted/50 border-border")}>
                        <p className={cn("text-[10px]", isDark ? "text-white/50" : "text-muted-foreground")}>Samples Today</p>
                        <p className="text-sm font-bold text-foreground tabular-nums">{recentFeed.length > 0 ? recentFeed.length : '—'}</p>
                      </div>
                      <div className={cn("p-3 rounded-xl border text-center", isDark ? "bg-white/5 border-white/5" : "bg-muted/50 border-border")}>
                        <p className={cn("text-[10px]", isDark ? "text-white/50" : "text-muted-foreground")}>Coverage Areas</p>
                        <p className="text-sm font-bold text-foreground tabular-nums">
                          {recentFeed.length > 0
                            ? new Set(recentFeed.map((f: any) => f.country_code).filter(Boolean)).size
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* How It Works */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={cn("rounded-2xl backdrop-blur-xl border p-4", isDark ? "bg-background/40 border-border/30" : "bg-card/80 border-border")}
              >
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-base font-bold text-foreground">3 Steps to Earn</h3>
                </div>
                
                <div className="space-y-3">
                  {[
                    { num: '1', title: 'Tap Contribute', desc: 'Runs quietly — less than 3% battery', gradient: 'from-emerald-400 to-teal-500' },
                    { num: '2', title: 'Walk, commute, or chill', desc: 'Your phone maps signal quality anonymously', gradient: 'from-teal-400 to-cyan-500' },
                    { num: '3', title: 'Collect points daily', desc: 'Convert to $NOMIQA tokens at network launch', gradient: 'from-cyan-400 to-blue-500' },
                  ].map((step) => (
                    <div key={step.num} className="flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-md", step.gradient)}>
                        <span className="text-xs font-bold text-white">{step.num}</span>
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm font-semibold text-foreground">{step.title}</p>
                        <p className={cn("text-xs mt-0.5", isDark ? "text-white/50" : "text-muted-foreground")}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

        </div>
      </div>

      {/* Streak Calendar Popup */}
      <AnimatePresence>
        {showStreakPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowStreakPopup(false)}
          >
            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[320px] space-y-3">
              <StreakCalendar
                checkins={checkinHistory}
                currentStreak={streakDays}
                onClose={() => setShowStreakPopup(false)}
              />
              {/* Mining Boost Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl border border-border p-4 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-foreground">Mining Boost</span>
                  </div>
                  <span className="text-lg font-bold text-primary">{miningBoost.toFixed(1)}%</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {miningBoost > 0 
                    ? 'Earned from your referral network' 
                    : 'Invite friends to unlock mining boost'}
                </p>
                {streakDays >= 7 && (
                  <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Streak multiplier</span>
                    <span className="text-sm font-bold text-orange-500">
                      {streakDays >= 30 ? '2.0x' : `${(1.1 + (0.9 * (streakDays - 7) / 23)).toFixed(1)}x`}
                    </span>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AppHome;
