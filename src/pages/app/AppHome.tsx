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
  Footprints,
  Info
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAchievements } from '@/hooks/useAchievements';
import { useChallenges } from '@/hooks/useChallenges';
import { OnboardingFlow } from '@/components/app/OnboardingFlow';
import { AnimatePresence } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/app/PullToRefreshIndicator';
import { AppSpinner } from '@/components/app/AppSpinner';
import { DailyCheckIn } from '@/components/app/DailyCheckIn';
import { SpinWheel } from '@/components/app/SpinWheel';

const POINTS_TO_USD = 0.01;

export const AppHome: React.FC = () => {
  const navigate = useNavigate();
  const { mediumTap } = useHaptics();
  const { isOnline, connectionType } = useNetworkStatus();
  const { streakDays, streakMultiplier, unlockedCount, totalCount } = useAchievements();
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
    type: string;
    points: number;
    time: string;
    distance?: number;
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

        if (sessionsData && sessionsData.length > 0) {
          // Calculate today's points
          const todayTotal = sessionsData
            .filter(s => s.started_at.startsWith(today))
            .reduce((sum, s) => sum + (s.total_points_earned || 0), 0);
          setTodayPoints(todayTotal);

          // Format recent activity
          const activity = sessionsData.slice(0, 3).map(s => ({
            type: 'scan',
            points: s.total_points_earned || 0,
            distance: s.total_distance_meters || 0,
            time: formatRelativeTime(new Date(s.started_at))
          }));
          setRecentActivity(activity);
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
  const todayUSD = todayPoints * POINTS_TO_USD;
  const totalPoints = points?.total_points || 0;
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
          {/* Header - Clean like Helium */}
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

          {/* Greeting - Simple like Nodle */}
          {user && (
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Hi, {displayName}
              </h1>
              {streakDays >= 2 && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  {streakDays}-day streak
                </p>
              )}
            </div>
          )}

          {/* Balance Card - Enhanced with visual depth */}
          <div className="rounded-2xl bg-card border border-border p-5 relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Today</span>
                <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-400">
                  Beta
                </span>
              </div>
              
              <div className="mb-4">
                <div className="text-4xl font-bold text-foreground tabular-nums">
                  ${todayUSD.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {todayPoints.toLocaleString()} pts • {streakMultiplier}x multiplier
                </p>
              </div>

              <button
                onClick={() => { mediumTap(); navigate('/app/map'); }}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2 relative overflow-hidden group"
              >
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Signal className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{isNewUser ? 'Start Your First Scan' : 'Start Earning'}</span>
              </button>
            </div>
          </div>

          {/* Quick Stats - Simple row like DIMO */}
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
                {streakDays}
              </div>
              <p className="text-xs text-muted-foreground">Streak</p>
            </div>
            
            <button 
              onClick={() => { mediumTap(); navigate('/app/leaderboard'); }}
              className="rounded-xl bg-card border border-border p-3 text-center active:scale-[0.98] transition-transform"
            >
              <Crown className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <div className="text-sm font-semibold text-foreground">
                #{points?.total_points ? Math.max(1, Math.floor(1000 / (points.total_points || 1))) : '-'}
              </div>
              <p className="text-xs text-muted-foreground">Rank</p>
            </button>
          </div>

          {/* Quick Actions - Gamification Entry Points */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { mediumTap(); setShowSpinWheel(true); }}
              className="rounded-xl bg-card border border-border p-3 text-center active:scale-[0.98] transition-transform relative"
            >
              {spinReady && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
              <Gift className="w-4 h-4 text-pink-500 mx-auto mb-1" />
              <p className="text-xs font-medium text-foreground">Daily Spin</p>
              <p className="text-[10px] text-muted-foreground">{spinReady ? 'Ready!' : 'Tap to play'}</p>
            </button>
            
            <button
              onClick={() => { mediumTap(); navigate('/app/challenges'); }}
              className="rounded-xl bg-card border border-border p-3 text-center active:scale-[0.98] transition-transform relative"
            >
              <Target className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-xs font-medium text-foreground">Challenges</p>
              <p className="text-[10px] text-muted-foreground">
                {unclaimedCount > 0 ? `${unclaimedCount} ready` : 'View all'}
              </p>
              {unclaimedCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </button>
            
            <button
              onClick={() => { mediumTap(); navigate('/app/achievements'); }}
              className="rounded-xl bg-card border border-border p-3 text-center active:scale-[0.98] transition-transform"
            >
              <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-xs font-medium text-foreground">Badges</p>
              <p className="text-[10px] text-muted-foreground">{unlockedCount}/{totalCount}</p>
            </button>
          </div>

          {/* Getting Started Card - For new users */}
          {user && isNewUser && (
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Complete your first scan</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Walk or drive 1 km with cellular data to unlock your first reward
                  </p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">Progress</span>
                  <span className="text-xs font-medium text-foreground">0 / 1 km</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-0 bg-primary rounded-full transition-all duration-500" />
                </div>
              </div>

              {/* How it works */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-card/50">
                  <Signal className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-[10px] text-muted-foreground">Tap Start</p>
                </div>
                <div className="p-2 rounded-lg bg-card/50">
                  <Footprints className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-[10px] text-muted-foreground">Walk or drive</p>
                </div>
                <div className="p-2 rounded-lg bg-card/50">
                  <Zap className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-[10px] text-muted-foreground">Earn points</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity - Simple list like Helium */}
          {recentActivity.length > 0 ? (
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-sm text-foreground">
                        Scanned {activity.distance ? formatDistance(activity.distance) : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-primary">
                        +{activity.points.toFixed(0)} pts
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : user && !isNewUser ? (
            /* Empty state for returning users with no recent activity */
            <div className="rounded-xl bg-card border border-border border-dashed p-6 text-center">
              <Signal className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Start scanning to see activity here</p>
            </div>
          ) : null}

          {/* Beta info tooltip */}
          {user && (
            <div className="rounded-xl bg-muted/50 border border-border p-3 flex items-start gap-3">
              <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Beta phase:</span> Points are being tracked. Token rewards and cash-out coming soon!
              </p>
            </div>
          )}

          {/* Auth CTA for non-logged-in users */}
          {!user && (
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="text-center">
                <h3 className="text-base font-bold text-foreground mb-1">Join the Network</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Sign up to start earning
                </p>
                <button
                  onClick={() => navigate('/auth')}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-all"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Check-in modal */}
      {user && <DailyCheckIn userId={user.id} />}

      {/* Spin Wheel modal */}
      {user && showSpinWheel && (
        <SpinWheel 
          userId={user.id} 
          onClose={() => setShowSpinWheel(false)}
          onPrizeWon={() => {
            setSpinReady(false);
            loadData();
          }}
        />
      )}
    </>
  );
};

export default AppHome;
