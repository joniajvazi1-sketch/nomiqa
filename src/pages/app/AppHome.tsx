import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { 
  Zap,
  MapPin,
  Settings,
  Flame,
  Signal,
  Crown,
  Gift,
  Target,
  Trophy,
  ChevronRight,
  Users,
  Share2,
  Sun,
  Moon
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAchievements } from '@/hooks/useAchievements';
import { useChallenges } from '@/hooks/useChallenges';
import { OnboardingFlow } from '@/components/app/OnboardingFlow';
import { AnimatePresence, motion } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/app/PullToRefreshIndicator';
import { AppSpinner } from '@/components/app/AppSpinner';
import { DailyCheckIn } from '@/components/app/DailyCheckIn';
// SpinWheel removed per user request
import { StatusBanner } from '@/components/app/StatusBanner';
import { WeeklySummaryModal } from '@/components/app/WeeklySummaryModal';
import { TOKENOMICS, pointsToUsd } from '@/utils/tokenomics';
import { useNativeShare } from '@/hooks/useNativeShare';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export const AppHome: React.FC = () => {
  const navigate = useNavigate();
  const { mediumTap } = useHaptics();
  const { isOnline, connectionType } = useNetworkStatus();
  const { streakDays } = useAchievements();
  const { unclaimedCount } = useChallenges();
  const { share } = useNativeShare();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark' || theme === 'dark';
  // SpinWheel removed
  const [streakBonus, setStreakBonus] = useState(0);
  const [showReferralNudge, setShowReferralNudge] = useState(false);
  
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
  const [todayPoints, setTodayPoints] = useState(0);
  const [recentActivity, setRecentActivity] = useState<Array<{
    type: 'scan' | 'referral' | 'bonus';
    points: number;
    time: string;
    distance?: number;
    username?: string;
  }>>([]);

  // Check for one-time referral nudge (after 100 points)
  useEffect(() => {
    const hasSeenNudge = localStorage.getItem('hasSeenReferralNudge') === 'true';
    const currentPoints = points?.total_points || 0;
    if (!hasSeenNudge && currentPoints >= 100) {
      // Small delay so it feels natural
      const timer = setTimeout(() => setShowReferralNudge(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [points?.total_points]);

  const handleDismissNudge = () => {
    localStorage.setItem('hasSeenReferralNudge', 'true');
    setShowReferralNudge(false);
  };

  const handleShareReferral = async () => {
    const referralLink = username 
      ? `https://nomiqa.com/${username}` 
      : 'https://nomiqa.com/download';
    
    await share({
      title: 'Join Nomiqa',
      text: 'Earn rewards just by using your phone. Join me on Nomiqa!',
      url: referralLink
    });
  };

  const loadData = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        // Load profile
        const { data: profileData } = await supabase
          .from('profiles')
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

        // Spin wheel removed - skip check

        // Load recent sessions for activity
        const { data: sessionsData } = await supabase
          .from('contribution_sessions')
          .select('total_points_earned, started_at, total_distance_meters')
          .eq('user_id', currentUser.id)
          .order('started_at', { ascending: false })
          .limit(5);

        // Load recent referral commissions earned
        const { data: commissionsData } = await supabase
          .from('referral_commissions')
          .select('commission_points, created_at, referred_user_id')
          .eq('referrer_user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(3);

        // Build combined activity list
        const allActivity: typeof recentActivity = [];

        const todayStr = new Date().toISOString().split('T')[0];
        if (sessionsData && sessionsData.length > 0) {
          // Calculate today's points
          const todayTotal = sessionsData
            .filter(s => s.started_at.startsWith(todayStr))
            .reduce((sum, s) => sum + (s.total_points_earned || 0), 0);
          setTodayPoints(todayTotal);

          // Add scan activities
          sessionsData.slice(0, 3).forEach(s => {
            allActivity.push({
              type: 'scan',
              points: s.total_points_earned || 0,
              distance: s.total_distance_meters || 0,
              time: formatRelativeTime(new Date(s.started_at))
            });
          });
        }

        // Add referral commission activities
        if (commissionsData && commissionsData.length > 0) {
          commissionsData.forEach(c => {
            allActivity.push({
              type: 'referral',
              points: c.commission_points || 0,
              time: formatRelativeTime(new Date(c.created_at)),
              username: 'friend'
            });
          });
        }

        // Sort and take top 5
        allActivity.sort((a, b) => {
          const getMinutes = (t: string) => {
            const match = t.match(/(\d+)([mhd])/);
            if (!match) return 0;
            const [, num, unit] = match;
            const n = parseInt(num);
            if (unit === 'm') return n;
            if (unit === 'h') return n * 60;
            if (unit === 'd') return n * 1440;
            return 0;
          };
          return getMinutes(a.time) - getMinutes(b.time);
        });

        setRecentActivity(allActivity.slice(0, 5));
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

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    if (km >= 1) return km.toFixed(1) + ' km';
    return meters.toFixed(0) + ' m';
  };

  const getConnectionLabel = () => {
    if (!isOnline) return 'Offline';
    const type = connectionType?.toLowerCase() || 'wifi';
    if (type === 'wifi') return 'WiFi';
    if (type === 'cellular') return 'Cellular';
    if (type === '4g') return 'LTE';
    if (type === '5g') return '5G';
    return type.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AppSpinner size="lg" />
      </div>
    );
  }

  const displayName = username || 'Explorer';
  const todayUSD = pointsToUsd(todayPoints);
  const totalPoints = points?.total_points || 0;
  const totalUSD = pointsToUsd(totalPoints);
  const isNewUser = totalPoints === 0 && recentActivity.length === 0;

  return (
    <>
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>

      <div 
        className="min-h-screen overflow-y-auto"
        {...handlers}
      >
        <PullToRefreshIndicator 
          pullDistance={pullDistance}
          pullProgress={pullProgress}
          isRefreshing={isRefreshing}
        />

        <div className="px-4 py-4 pb-24 space-y-4">
          {/* Header - Minimal */}
          <header className="flex items-center justify-between">
            {user && (
              <h1 className="text-xl font-bold text-foreground">
                Hi, {displayName}
              </h1>
            )}

            <div className="flex items-center gap-2">
              <button 
                onClick={() => { mediumTap(); setTheme(isDark ? 'light' : 'dark'); }}
                className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center active:scale-95 transition-transform"
              >
                {isDark ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
              </button>
              <button 
                onClick={() => { mediumTap(); navigate('/app/profile'); }}
                className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center active:scale-95 transition-transform"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </header>

          {/* Hero Balance Card - Glassmorphism */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-[var(--shadow-elevated)] p-5"
          >
            {/* Integrated status bar */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isOnline ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
                )} />
                <span className="text-xs font-medium text-muted-foreground">
                  {isOnline ? 'Collecting ✓' : 'Paused'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>{connectionType || 'WiFi'}</span>
                <span>•</span>
                <span>Synced</span>
              </div>
            </div>
            
            {/* Main earnings display */}
            <div className="mb-3">
              <div className="text-3xl font-bold text-foreground tabular-nums">
                {totalPoints.toLocaleString()} <span className="text-lg font-semibold text-muted-foreground">pts</span>
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                Estimated value: ${totalUSD.toFixed(2)}
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                1 point = 1 token (redeem in app)
              </p>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Uses &lt;3% battery per day · Runs quietly in the background
            </p>

            <button
              onClick={() => { mediumTap(); navigate('/app/map'); }}
              className={cn(
                "w-full h-12 rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2",
                isOnline 
                  ? "bg-green-500 text-white" 
                  : "bg-primary text-primary-foreground"
              )}
            >
              <Signal className="w-4 h-4" />
              {isOnline ? 'Contribution Active' : 'Resume Contribution'}
            </button>
          </motion.div>

          {/* Referral Micro-Card - Glassmorphism */}
          <motion.button
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            onClick={() => { mediumTap(); handleShareReferral(); }}
            className="w-full rounded-xl bg-card/60 backdrop-blur-sm border border-border p-3 flex items-center gap-3 active:scale-[0.98] transition-transform shadow-[var(--shadow-card)]"
          >
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Invite friends</p>
              <p className="text-xs text-muted-foreground">Earn 10% of their lifetime rewards</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              <Share2 className="w-3 h-3" />
              Share
            </div>
          </motion.button>

          {/* Quick Stats - Glass cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-card/60 backdrop-blur-sm border border-border p-3 text-center shadow-[var(--shadow-card)]">
              <MapPin className="w-4 h-4 text-primary mx-auto mb-1" />
              <div className="text-sm font-semibold text-foreground">
                {formatDistance(points?.total_distance_meters || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Distance</p>
            </div>
            
            <div className="rounded-xl bg-card/60 backdrop-blur-sm border border-border p-3 text-center shadow-[var(--shadow-card)]">
              <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
              <div className="text-sm font-semibold text-foreground">
                {streakDays}{streakDays >= 2 ? ' 🔥' : ''}
              </div>
              <p className="text-xs text-muted-foreground">Streak</p>
            </div>
            
            <button 
              onClick={() => { mediumTap(); navigate('/app/leaderboard'); }}
              className="rounded-xl bg-card/60 backdrop-blur-sm border border-border p-3 text-center active:scale-95 transition-transform shadow-[var(--shadow-card)]"
            >
              <Crown className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <div className="text-sm font-semibold text-foreground">
                #{points?.total_points ? Math.max(1, Math.floor(1000 / (points.total_points || 1))) : '-'}
              </div>
              <p className="text-xs text-muted-foreground">Rank</p>
            </button>
          </div>

          {/* Quick Actions - Glass cards */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { mediumTap(); navigate('/app/challenges'); }}
              className="rounded-xl bg-card/60 backdrop-blur-sm border border-border p-4 text-center relative active:scale-95 transition-transform shadow-[var(--shadow-card)]"
            >
              {unclaimedCount > 0 && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unclaimedCount}
                </span>
              )}
              <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">Challenges</p>
              <p className="text-xs font-medium text-muted-foreground">{unclaimedCount > 0 ? 'Claim rewards!' : 'View all'}</p>
            </button>
            
            <button
              onClick={() => { mediumTap(); navigate('/app/leaderboard'); }}
              className="rounded-xl bg-card/60 backdrop-blur-sm border border-border p-4 text-center active:scale-95 transition-transform shadow-[var(--shadow-card)]"
            >
              <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">Leaderboard</p>
              <p className="text-xs font-medium text-muted-foreground">Compete</p>
            </button>
          </div>

          {/* Recent Activity - Glass card */}
          <div className="rounded-xl bg-card/60 backdrop-blur-sm border border-border overflow-hidden shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
              <button 
                onClick={() => { mediumTap(); navigate('/app/rewards'); }}
                className="text-xs text-primary flex items-center gap-0.5"
              >
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-border">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      activity.type === 'scan' ? "bg-green-500/20" :
                      activity.type === 'referral' ? "bg-blue-500/20" : "bg-amber-500/20"
                    )}>
                      {activity.type === 'scan' ? (
                        <Signal className="w-4 h-4 text-green-500" />
                      ) : activity.type === 'referral' ? (
                        <Gift className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Zap className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {activity.type === 'scan' ? 'Network scan' :
                         activity.type === 'referral' ? 'Referral bonus' : 'Bonus'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                        {activity.distance ? ` • ${formatDistance(activity.distance)}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-green-500">
                      +{activity.points}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <Signal className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground/70">Start a scan to earn points</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SpinWheel removed per user request */}

      {/* One-time Referral Nudge - Semantic theme */}
      <Sheet open={showReferralNudge} onOpenChange={setShowReferralNudge}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8 bg-card border-border">
          <SheetHeader className="text-center pb-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
              <Gift className="w-6 h-6 text-green-500" />
            </div>
            <SheetTitle className="text-lg text-foreground">You're earning automatically 🎉</SheetTitle>
          </SheetHeader>
          <p className="text-center text-muted-foreground text-sm mb-6">
            Invite friends and earn <span className="font-semibold text-foreground">10% of everything they earn</span> — forever.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDismissNudge}
              className="flex-1 h-11 rounded-xl border border-border text-sm font-medium text-muted-foreground active:scale-95 transition-transform"
            >
              Maybe later
            </button>
            <button
              onClick={() => { handleDismissNudge(); handleShareReferral(); }}
              className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Share2 className="w-4 h-4" />
              Share now
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {user && <DailyCheckIn userId={user.id} />}
      <WeeklySummaryModal />
    </>
  );
};
