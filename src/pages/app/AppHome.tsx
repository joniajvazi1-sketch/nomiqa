import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ChevronRight
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
import { SpinWheel } from '@/components/app/SpinWheel';
import { StatusBanner } from '@/components/app/StatusBanner';
import { WeeklySummaryModal } from '@/components/app/WeeklySummaryModal';
import { TOKENOMICS, pointsToUsd } from '@/utils/tokenomics';

export const AppHome: React.FC = () => {
  const navigate = useNavigate();
  const { mediumTap } = useHaptics();
  const { isOnline, connectionType } = useNetworkStatus();
  const { streakDays } = useAchievements();
  const { unclaimedCount } = useChallenges();
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [spinReady, setSpinReady] = useState(false);
  
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

        // Check spin status for today
        const today = new Date().toISOString().split('T')[0];
        const { data: spinData } = await supabase
          .from('spin_wheel_results')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('spin_date', today)
          .maybeSingle();
        setSpinReady(!spinData);

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

        if (sessionsData && sessionsData.length > 0) {
          // Calculate today's points
          const todayTotal = sessionsData
            .filter(s => s.started_at.startsWith(today))
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
      <div className="min-h-screen bg-background flex items-center justify-center">
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
        className="min-h-screen bg-background overflow-y-auto"
        {...handlers}
      >
        <PullToRefreshIndicator 
          pullDistance={pullDistance}
          pullProgress={pullProgress}
          isRefreshing={isRefreshing}
        />

        <div className="px-4 py-4 pb-24 space-y-4">
          {/* Header - Clean banking style */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isOnline ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-xs text-muted-foreground font-medium">
                {getConnectionLabel()}
              </span>
            </div>

            <button 
              onClick={() => { mediumTap(); navigate('/app/profile'); }}
              className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center active:scale-95 transition-transform"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          </header>

          {/* Greeting - Minimal above fold */}
          {user && (
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Hi, {displayName}
              </h1>
            </div>
          )}

          {/* Hero Balance Card - ABOVE THE FOLD: Only status, earnings, CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl bg-white border border-border shadow-elevated p-5"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                isOnline ? "bg-green-500" : "bg-muted-foreground"
              )} />
              <span className="text-xs font-medium text-muted-foreground">
                {isOnline ? 'Collecting data ✓' : 'Paused'}
              </span>
            </div>
            
            {/* Main earnings display - Points first, value second */}
            <div className="mb-2">
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

            <p className="text-xs text-muted-foreground mb-3">
              Runs quietly in the background
            </p>
            
            {/* Status line - Last sync / Samples / Mode */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-4 px-1">
              <span>Last sync: just now</span>
              <span>•</span>
              <span>Today: {todayPoints} pts</span>
              <span>•</span>
              <span>Mode: {connectionType || 'WiFi'}</span>
            </div>

            <button
              onClick={() => { mediumTap(); navigate('/app/map'); }}
              className={cn(
                "w-full h-12 rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2",
                isOnline 
                  ? "bg-green-600 text-white" 
                  : "bg-primary text-primary-foreground"
              )}
            >
              <Signal className="w-4 h-4" />
              {isOnline ? 'Contribution Active' : 'Resume Contribution'}
            </button>
          </motion.div>

          {/* BELOW THE FOLD: Secondary motivators */}
          
          {/* Quick Stats - Clean cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-card border border-border p-3 text-center">
              <MapPin className="w-4 h-4 text-primary mx-auto mb-1" />
              <div className="text-sm font-semibold text-foreground">
                {formatDistance(points?.total_distance_meters || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Distance</p>
            </div>
            
            <div className="rounded-xl bg-card border border-border p-3 text-center">
              <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
              <div className="text-sm font-semibold text-foreground">
                {streakDays}{streakDays >= 2 ? ' 🔥' : ''}
              </div>
              <p className="text-xs text-muted-foreground">Streak</p>
            </div>
            
            <button 
              onClick={() => { mediumTap(); navigate('/app/leaderboard'); }}
              className="rounded-xl bg-card border border-border p-3 text-center active:scale-95 transition-transform"
            >
              <Crown className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <div className="text-sm font-semibold text-foreground">
                #{points?.total_points ? Math.max(1, Math.floor(1000 / (points.total_points || 1))) : '-'}
              </div>
              <p className="text-xs text-muted-foreground">Rank</p>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { mediumTap(); setShowSpinWheel(true); }}
              className="rounded-xl bg-card border border-border p-3 text-center relative active:scale-95 transition-transform"
            >
              {spinReady && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500" />
              )}
              <Gift className="w-4 h-4 text-pink-500 mx-auto mb-1" />
              <p className="text-xs font-medium text-foreground">Daily Spin</p>
              <p className="text-[10px] text-muted-foreground">{spinReady ? 'Ready!' : 'Done'}</p>
            </button>
            
            <button
              onClick={() => { mediumTap(); navigate('/app/challenges'); }}
              className="rounded-xl bg-card border border-border p-3 text-center relative active:scale-95 transition-transform"
            >
              {unclaimedCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unclaimedCount}
                </span>
              )}
              <Target className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-xs font-medium text-foreground">Challenges</p>
              <p className="text-[10px] text-muted-foreground">{unclaimedCount > 0 ? 'Claim!' : 'View'}</p>
            </button>
            
            <button
              onClick={() => { mediumTap(); navigate('/app/leaderboard'); }}
              className="rounded-xl bg-card border border-border p-3 text-center active:scale-95 transition-transform"
            >
              <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-xs font-medium text-foreground">Leaderboard</p>
              <p className="text-[10px] text-muted-foreground">Compete</p>
            </button>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
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
                      activity.type === 'scan' ? "bg-green-100" :
                      activity.type === 'referral' ? "bg-blue-100" : "bg-amber-100"
                    )}>
                      {activity.type === 'scan' ? (
                        <Signal className="w-4 h-4 text-green-600" />
                      ) : activity.type === 'referral' ? (
                        <Gift className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Zap className="w-4 h-4 text-amber-600" />
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
                    <span className="text-sm font-semibold text-green-600">
                      +{activity.points}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <Signal className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground">Start a scan to earn points</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showSpinWheel && user && (
          <SpinWheel 
            userId={user.id}
            onClose={() => setShowSpinWheel(false)} 
          />
        )}
      </AnimatePresence>
      
      {user && <DailyCheckIn userId={user.id} />}
      <WeeklySummaryModal />
    </>
  );
};
