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
  Trophy
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

        // Load recent sessions for activity
        const { data: sessionsData } = await supabase
          .from('contribution_sessions')
          .select('total_points_earned, started_at, total_distance_meters')
          .eq('user_id', currentUser.id)
          .order('started_at', { ascending: false })
          .limit(5);

        if (sessionsData && sessionsData.length > 0) {
          // Calculate today's points
          const today = new Date().toISOString().split('T')[0];
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

          {/* Balance Card - Clean like Grass */}
          <div className="rounded-2xl bg-card border border-border p-5">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Today</span>
            </div>
            
            <div className="mb-4">
              <div className="text-4xl font-bold text-foreground tabular-nums">
                ${todayUSD.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">
                {todayPoints.toLocaleString()} pts • {streakMultiplier}x
              </p>
            </div>

            <button
              onClick={() => { mediumTap(); navigate('/app/map'); }}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Signal className="w-4 h-4" />
              Start Earning
            </button>
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
              className="rounded-xl bg-card border border-border p-3 text-center active:scale-[0.98] transition-transform"
            >
              <Gift className="w-4 h-4 text-pink-500 mx-auto mb-1" />
              <p className="text-xs font-medium text-foreground">Daily Spin</p>
              <p className="text-[10px] text-muted-foreground">Tap to play</p>
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

          {/* Recent Activity - Simple list like Helium */}
          {recentActivity.length > 0 && (
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
          onPrizeWon={() => loadData()}
        />
      )}
    </>
  );
};

export default AppHome;
