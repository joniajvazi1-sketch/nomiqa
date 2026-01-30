import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
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
  Radio
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
import { DailyCheckIn } from '@/components/app/DailyCheckIn';
import { WeeklySummaryModal } from '@/components/app/WeeklySummaryModal';
import { pointsToUsd } from '@/utils/tokenomics';
import { useNativeShare } from '@/hooks/useNativeShare';
import { AppSEO } from '@/components/app/AppSEO';
import { toast } from 'sonner';
import { useContributionPersistence } from '@/hooks/useContributionPersistence';

export const AppHome: React.FC = () => {
  const navigate = useNavigate();
  const { mediumTap, lightTap } = useHaptics();
  const { isOnline } = useNetworkStatus();
  const { streakDays } = useAchievements();
  const { share } = useNativeShare();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark' || theme === 'dark';
  
  // Use client-side persistence for accurate contribution state
  const { isContributionEnabled } = useContributionPersistence();
  
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('hasSeenOnboarding') !== 'true';
  });
  
  const [user, setUser] = useState<any>(null);
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
      setUser(currentUser);

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

        // Note: Active contribution state is now handled by useContributionPersistence hook
        // which uses localStorage - more reliable than DB query

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <AppSpinner size="lg" />
      </div>
    );
  }

  const displayName = username || 'there';
  const totalPoints = points?.total_points || 0;
  const totalUSD = pointsToUsd(totalPoints);

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

      <div
        className="min-h-screen bg-background"
        {...handlers}
      >
        <PullToRefreshIndicator 
          pullDistance={pullDistance}
          pullProgress={pullProgress}
          isRefreshing={isRefreshing}
        />

        <div className="px-5 pb-28" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}>
          
          {/* Clean Header */}
          <header className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground">{greeting}</p>
              <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { lightTap(); setTheme(isDark ? 'light' : 'dark'); }}
                className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
              >
                {isDark ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
              </button>
              <button 
                onClick={() => { lightTap(); navigate('/app/profile'); }}
                className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
              >
                <Settings className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </header>

          {/* Status Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-6"
          >
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              isOnline ? "bg-green-500" : "bg-muted-foreground"
            )} />
            <span className="text-sm text-muted-foreground">
              {isOnline ? 'Earning in background' : 'Offline'}
            </span>
            {isOnline && <CheckCircle2 className="w-4 h-4 text-green-500" />}
          </motion.div>

          {/* Contribution Status Card */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => { mediumTap(); navigate('/app/map'); }}
            className={cn(
              "w-full rounded-2xl p-4 flex items-center gap-4 mb-4 active:scale-[0.98] transition-transform",
              isContributionEnabled 
                ? "bg-green-500/10 border border-green-500/30" 
                : "bg-red-500/10 border border-red-500/30"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              isContributionEnabled ? "bg-green-500/20" : "bg-red-500/20"
            )}>
              <Radio className={cn(
                "w-6 h-6",
                isContributionEnabled ? "text-green-500" : "text-red-500"
              )} />
            </div>
            <div className="flex-1 text-left">
              <p className={cn(
                "text-base font-semibold",
                isContributionEnabled ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {isContributionEnabled ? 'Contributing Now' : 'Start Contributing'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isContributionEnabled ? 'Earning points in background' : 'Tap to enable earning'}
              </p>
            </div>
            <ChevronRight className={cn(
              "w-5 h-5",
              isContributionEnabled ? "text-green-500" : "text-red-500"
            )} />
          </motion.button>

          {/* Main Balance Card - Clean & Trustworthy */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl bg-card border border-border p-6 mb-4"
          >
            <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-bold text-foreground tabular-nums">
                {totalPoints.toLocaleString()}
              </span>
              <span className="text-lg text-muted-foreground">pts</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Convertible to $NOMIQA
            </p>

            {/* Mini Stats Row */}
            <div className="flex gap-4 pt-4 border-t border-border">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">Today</span>
                </div>
                <p className="text-sm font-semibold text-foreground">+{todayEarnings} pts</p>
              </div>
              <div className="w-px bg-border" />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-xs">Streak</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{streakDays} days</p>
              </div>
              <div className="w-px bg-border" />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-xs">Team</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{referralCount}</p>
              </div>
            </div>
          </motion.div>

          {/* Referral Section - Prominent & Clean */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl bg-primary/5 border border-primary/20 p-5 mb-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-foreground">Invite & Earn Together</h3>
                <p className="text-sm text-muted-foreground">Earn 10% of your team's earnings</p>
              </div>
            </div>

            {/* Referral Link Display */}
            <div className="bg-background rounded-xl p-3 flex items-center gap-2 mb-4 border border-border">
              <span className="flex-1 text-sm text-muted-foreground truncate font-mono">
                nomiqa.com/{username || 'invite'}
              </span>
              <button
                onClick={() => { lightTap(); handleCopyLink(); }}
                className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <button
              onClick={() => { mediumTap(); handleShareReferral(); }}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Share2 className="w-4 h-4" />
              Share Invite Link
            </button>

            {referralCount > 0 && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                You have {referralCount} team member{referralCount !== 1 ? 's' : ''} earning with you
              </p>
            )}
          </motion.div>

          {/* How It Works - Simple */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl bg-card border border-border p-5 mb-4"
          >
            <h3 className="text-base font-semibold text-foreground mb-4">How You Earn</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">App runs in background</p>
                  <p className="text-xs text-muted-foreground">Uses &lt;3% battery daily</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Contribute network data</p>
                  <p className="text-xs text-muted-foreground">Anonymous signal quality info</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Earn points automatically</p>
                  <p className="text-xs text-muted-foreground">Redeem for rewards anytime</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <button
              onClick={() => { lightTap(); navigate('/app/rewards'); }}
              className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-4 active:scale-[0.99] transition-transform"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">Rewards</p>
                <p className="text-xs text-muted-foreground">View your earnings</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={() => { lightTap(); navigate('/app/leaderboard'); }}
              className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-4 active:scale-[0.99] transition-transform"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">Leaderboard</p>
                <p className="text-xs text-muted-foreground">See top earners</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </motion.div>

        </div>
      </div>

      <WeeklySummaryModal />
    </>
  );
};
