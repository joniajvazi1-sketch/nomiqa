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
  Info,
  Coins
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
import { TokenInfoModal } from '@/components/app/TokenInfoModal';
import { TOKENOMICS, pointsToUsd, formatTokens } from '@/utils/tokenomics';

export const AppHome: React.FC = () => {
  const navigate = useNavigate();
  const { mediumTap } = useHaptics();
  const { isOnline, connectionType } = useNetworkStatus();
  const { streakDays, streakMultiplier, unlockedCount, totalCount } = useAchievements();
  const { unclaimedCount } = useChallenges();
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [spinReady, setSpinReady] = useState(false);
  const [showTokenInfo, setShowTokenInfo] = useState(false);
  
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
              username: 'friend' // We could look up the username if needed
            });
          });
        }

        // Sort by most recent and take top 5
        allActivity.sort((a, b) => {
          // Parse relative time back for sorting (hacky but works for display)
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

          {/* Balance Card - Premium Hero Style */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl card-hero p-5 relative overflow-hidden"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse-soft" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse-soft" style={{ animationDelay: '1s' }} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Today</span>
                <button 
                  onClick={() => { mediumTap(); setShowTokenInfo(true); }}
                  className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 active:scale-95 transition-transform hover:bg-amber-500/30"
                >
                  <span className="text-[10px] font-medium">Beta</span>
                  <Info className="w-3 h-3" />
                </button>
              </div>
              
              {/* Today's earnings with counting animation */}
              <div className="mb-3">
                <motion.div 
                  key={todayUSD}
                  initial={{ scale: 1.1, color: 'hsl(var(--primary))' }}
                  animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
                  transition={{ duration: 0.2 }}
                  className="text-4xl font-bold tabular-nums"
                >
                  ${todayUSD.toFixed(2)}
                </motion.div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <motion.span
                    key={todayPoints}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    className="font-medium"
                  >
                    {todayPoints.toLocaleString()} pts
                  </motion.span>
                  <span className="text-xs opacity-60">•</span>
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-primary" />
                    <span className="text-gradient-primary font-medium">{todayPoints.toLocaleString()} tokens</span>
                  </span>
                </div>
              </div>

              {/* Total balance row */}
              <div className="flex items-center justify-between bg-muted/40 rounded-xl px-3 py-2.5 mb-4 border border-border/50">
                <div className="text-xs text-muted-foreground">Total Balance</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    ${totalUSD.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({formatTokens(totalPoints)} tokens)
                  </span>
                </div>
              </div>

              <button
                onClick={() => { mediumTap(); navigate('/app/map'); }}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm press-effect relative overflow-hidden group pulse-glow"
              >
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <Signal className="w-4 h-4 relative z-10 inline-block mr-2" />
                <span className="relative z-10">{isNewUser ? 'Start Your First Scan' : 'Start Earning'}</span>
              </button>
            </div>
          </motion.div>

          {/* Quick Stats - Premium cards with stagger */}
          <div className="grid grid-cols-3 gap-2">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-xl card-premium p-3 text-center"
            >
              <MapPin className="w-4 h-4 text-primary mx-auto mb-1" />
              <motion.div 
                key={points?.total_distance_meters}
                className="text-sm font-semibold text-foreground"
              >
                {formatDistance(points?.total_distance_meters || 0)}
              </motion.div>
              <p className="text-xs text-muted-foreground">Distance</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl card-premium p-3 text-center"
            >
              <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
              <div className="text-sm font-semibold text-foreground">
                {streakDays}
              </div>
              <p className="text-xs text-muted-foreground">Streak</p>
            </motion.div>
            
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onClick={() => { mediumTap(); navigate('/app/leaderboard'); }}
              whileTap={{ scale: 0.97 }}
              className="rounded-xl card-premium p-3 text-center"
            >
              <Crown className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <div className="text-sm font-semibold text-foreground">
                #{points?.total_points ? Math.max(1, Math.floor(1000 / (points.total_points || 1))) : '-'}
              </div>
              <p className="text-xs text-muted-foreground">Rank</p>
            </motion.button>
          </div>

          {/* Quick Actions - Premium Gamification Cards */}
          <div className="grid grid-cols-3 gap-2">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { mediumTap(); setShowSpinWheel(true); }}
              className="rounded-xl card-premium p-3 text-center relative overflow-hidden"
            >
              {spinReady && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 animate-pulse-soft"
                />
              )}
              <Gift className="w-4 h-4 text-pink-500 mx-auto mb-1" />
              <p className="text-xs font-medium text-foreground">Daily Spin</p>
              <p className="text-[10px] text-muted-foreground">{spinReady ? 'Ready!' : 'Tap to play'}</p>
            </motion.button>
            
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { mediumTap(); navigate('/app/challenges'); }}
              className="rounded-xl card-premium p-3 text-center relative overflow-hidden"
            >
              <Target className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-xs font-medium text-foreground">Challenges</p>
              <p className="text-[10px] text-muted-foreground">
                {unclaimedCount > 0 ? `${unclaimedCount} ready` : 'View all'}
              </p>
              {unclaimedCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse-soft"
                />
              )}
            </motion.button>
            
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { mediumTap(); navigate('/app/achievements'); }}
              className="rounded-xl card-premium p-3 text-center"
            >
              <Trophy className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-xs font-medium text-foreground">Badges</p>
              <p className="text-[10px] text-muted-foreground">{unlockedCount}/{totalCount}</p>
            </motion.button>
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

          {/* Recent Activity - Premium list with animations */}
          {recentActivity.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-xl card-premium p-4"
            >
              <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full animate-pulse-soft",
                        activity.type === 'referral' ? "bg-accent" : "bg-primary"
                      )} />
                      <span className="text-sm text-foreground">
                        {activity.type === 'referral' 
                          ? `Commission from ${activity.username || 'friend'}`
                          : `Scanned ${activity.distance ? formatDistance(activity.distance) : ''}`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-sm font-medium",
                        activity.type === 'referral' ? "text-gradient-reward" : "text-gradient-primary"
                      )}>
                        +{activity.points.toFixed(0)} pts
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {activity.time}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
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

      {/* Token Info modal */}
      <TokenInfoModal 
        isOpen={showTokenInfo} 
        onClose={() => setShowTokenInfo(false)} 
      />
    </>
  );
};

export default AppHome;
