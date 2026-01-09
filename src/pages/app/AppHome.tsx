import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap,
  ChevronRight,
  Signal,
  MapPin,
  TrendingUp,
  Settings,
  Bell,
  Sparkles,
  Flame,
  Trophy,
  Gift
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranslation } from '@/contexts/TranslationContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { MiniContributionMap } from '@/components/app/MiniContributionMap';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAchievements } from '@/hooks/useAchievements';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { StreakBonus, MilestonePopup, AchievementBadge } from '@/components/app/AchievementSystem';
import { NotificationToggle } from '@/components/app/NotificationToggle';
import { ChallengesSection } from '@/components/app/ChallengesSection';
import { LeaderboardSection } from '@/components/app/LeaderboardSection';
import { RewardCelebration } from '@/components/app/RewardCelebration';
import { ShimmerButton } from '@/components/app/ShimmerButton';
import { OnboardingFlow } from '@/components/app/OnboardingFlow';
import { AnimatePresence } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/app/PullToRefreshIndicator';
import { LanguageSelector } from '@/components/app/LanguageSelector';

interface DailyEarning {
  date: string;
  points: number;
}

// Point to USD conversion rate (mock for now)
const POINTS_TO_USD = 0.01;

// Daily goal threshold for celebration
const DAILY_GOAL_POINTS = 100;
/**
 * App Home Dashboard - Command Center
 * Clean, focused layout with Today's earnings hero, streaks, and achievements
 */
export const AppHome: React.FC = () => {
  const navigate = useNavigate();
  const { mediumTap, lightTap } = useHaptics();
  const { t } = useTranslation();
  const { isOnline, connectionType } = useNetworkStatus();
  const { 
    achievements, 
    unlockedCount, 
    totalCount, 
    recentUnlock, 
    clearRecentUnlock,
    streakDays,
    streakMultiplier,
    notificationsEnabled,
    requestNotificationPermission
  } = useAchievements();
  const { isSupported: notificationsSupported, permissionStatus } = usePushNotifications();
  
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('hasSeenOnboarding') !== 'true';
  });
  
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [points, setPoints] = useState<{
    total_points: number;
    pending_points: number;
    total_distance_meters: number;
    contribution_streak_days: number;
  } | null>(null);
  const [dataPointsCount, setDataPointsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animatedUSD, setAnimatedUSD] = useState(0);
  const [earningsData, setEarningsData] = useState<DailyEarning[]>([]);
  const [showDailyGoalCelebration, setShowDailyGoalCelebration] = useState(false);
  const [dailyGoalCelebrated, setDailyGoalCelebrated] = useState(false);
  const usdRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        // Fetch profile username
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        if (profileData?.username) {
          setUsername(profileData.username);
        }

        const { data: pointsData } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();
        
        if (pointsData) {
          setPoints(pointsData);
        }

        // Get recent session data (bounded) for chart + summary
        const { data: sessionsData } = await supabase
          .from('contribution_sessions')
          .select('data_points_count, started_at, total_points_earned')
          .eq('user_id', currentUser.id)
          .order('started_at', { ascending: false })
          .limit(500);

        if (sessionsData) {
          const totalDataPoints = sessionsData.reduce((sum, s) => sum + (s.data_points_count || 0), 0);
          setDataPointsCount(totalDataPoints);

          // Filter last 7 days for earnings chart
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          // Aggregate by day
          const dailyMap = new Map<string, number>();
          const today = new Date();
          
          // Initialize all 7 days with 0
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            dailyMap.set(dateKey, 0);
          }
          
          // Sum points per day
          sessionsData.forEach(session => {
            const sessionDate = new Date(session.started_at);
            if (sessionDate >= sevenDaysAgo) {
              const dateKey = sessionDate.toISOString().split('T')[0];
              const current = dailyMap.get(dateKey) || 0;
              dailyMap.set(dateKey, current + (session.total_points_earned || 0));
            }
          });

          const earnings: DailyEarning[] = Array.from(dailyMap.entries()).map(([date, points]) => ({
            date,
            points
          }));
          
          setEarningsData(earnings);
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

  // Pull-to-refresh
  const { isRefreshing, pullDistance, pullProgress, handlers } = usePullToRefresh({
    onRefresh: loadData
  });

  // Today's points from earnings data
  const todayPoints = useMemo(() => {
    if (earningsData.length === 0) return 0;
    return earningsData[earningsData.length - 1].points;
  }, [earningsData]);

  // Today's USD value
  const todayUSD = useMemo(() => todayPoints * POINTS_TO_USD, [todayPoints]);

  // Check for daily goal achievement
  useEffect(() => {
    const celebratedKey = `daily-goal-celebrated-${new Date().toISOString().split('T')[0]}`;
    const alreadyCelebrated = localStorage.getItem(celebratedKey) === 'true';
    
    if (todayPoints >= DAILY_GOAL_POINTS && !alreadyCelebrated && !dailyGoalCelebrated) {
      setShowDailyGoalCelebration(true);
      setDailyGoalCelebrated(true);
      localStorage.setItem(celebratedKey, 'true');
    }
  }, [todayPoints, dailyGoalCelebrated]);

  // Animate USD counter
  useEffect(() => {
    if (loading) return;
    
    const target = todayUSD;
    const duration = 1200;
    const start = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedUSD(easeOut * target);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [loading, todayUSD]);

  const handleNavigation = (path: string) => {
    mediumTap();
    navigate(path);
  };

  // Format distance to km
  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    if (km >= 1) return km.toFixed(1) + ' km';
    return meters.toFixed(0) + ' m';
  };

  // Get connection type display
  const getConnectionLabel = () => {
    if (!isOnline) return t('app.home.offline');
    const type = connectionType?.toLowerCase() || 'wifi';
    if (type === 'wifi') return 'WiFi';
    if (type === 'cellular') return t('app.network.cellular');
    if (type === '4g') return 'LTE';
    if (type === '5g') return '5G';
    return type.toUpperCase();
  };

  return (
    <>
      {/* Onboarding Flow for first-time users */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>

      <div 
        className="min-h-screen bg-background relative overflow-hidden overflow-y-auto"
        {...handlers}
      >
        {/* Pull to refresh indicator */}
        <PullToRefreshIndicator 
          pullDistance={pullDistance}
          pullProgress={pullProgress}
          isRefreshing={isRefreshing}
        />

        {/* Subtle animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, hsl(var(--neon-cyan)) 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'pulse 8s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute bottom-1/3 -right-20 w-[300px] h-[300px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'pulse 6s ease-in-out infinite 2s'
          }}
        />
      </div>

      <div className="relative z-10 px-5 py-6 pb-28 space-y-5">
        {/* NEW TOP BAR: Status pill left, icons right */}
        <header className="flex items-center justify-between animate-fade-in">
          {/* Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.08]">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isOnline ? "bg-neon-cyan animate-pulse shadow-lg shadow-neon-cyan/50" : "bg-red-500"
            )} />
            <span 
              className="text-xs text-foreground/80 font-medium"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
            >
              {isOnline ? t('app.home.online') : t('app.home.offline')} • {getConnectionLabel()}
            </span>
          </div>

          {/* Icon buttons */}
          <div className="flex items-center gap-2">
            {/* Notification button - shows different states */}
            <button 
              onClick={() => { 
                lightTap(); 
                if (notificationsSupported && !notificationsEnabled) {
                  setShowNotificationPrompt(prev => !prev);
                }
              }}
              className={cn(
                "w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center hover:bg-white/[0.08] active:scale-95 transition-all relative",
                notificationsEnabled 
                  ? "bg-primary/10 border-primary/30" 
                  : "bg-white/[0.05] border-white/[0.08]"
              )}
            >
              <Bell className={cn(
                "w-4.5 h-4.5",
                notificationsEnabled ? "text-primary" : "text-muted-foreground"
              )} />
              {notificationsSupported && !notificationsEnabled && (
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              )}
            </button>
            
            {/* Language Selector */}
            <LanguageSelector />
            
            <button 
              onClick={() => { lightTap(); navigate('/app/profile'); }}
              className="w-10 h-10 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] active:scale-95 transition-all"
            >
              <Settings className="w-4.5 h-4.5 text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* Notification Permission Prompt */}
        {showNotificationPrompt && notificationsSupported && !notificationsEnabled && (
          <div className="animate-fade-in">
            <NotificationToggle
              isEnabled={notificationsEnabled}
              permissionStatus={permissionStatus}
              onRequestPermission={async () => {
                const granted = await requestNotificationPermission();
                if (granted) {
                  setShowNotificationPrompt(false);
                }
                return granted;
              }}
            />
          </div>
        )}

        {/* "TODAY" HERO CARD */}
        <div 
          className="relative rounded-[24px] overflow-hidden animate-fade-in"
          style={{ animationDelay: '100ms' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/15 via-primary/10 to-transparent" />
          <div className="absolute inset-0 backdrop-blur-3xl" />
          
          {/* Subtle shimmer effect */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.08) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s ease-in-out infinite'
            }}
          />
          
          <div className="relative p-6 border border-neon-cyan/15 rounded-[24px]">
            {/* Label */}
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-neon-cyan" />
              <span className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">{t('app.home.todaysEarnings')}</span>
            </div>
            
            {/* Big USD Number */}
            <div ref={usdRef} className="mb-2">
              {loading ? (
                <div className="h-16 w-32 bg-neon-cyan/10 rounded-xl animate-pulse" />
              ) : (
                <div 
                  className="text-[52px] font-bold text-foreground tracking-tight leading-none"
                  style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}
                >
                  ${animatedUSD.toFixed(2)}
                </div>
              )}
            </div>

            {/* Sublines with friendly language */}
            <div className="flex items-center flex-wrap gap-3 mb-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-2.5 py-1">
                <TrendingUp className="w-3.5 h-3.5 text-neon-cyan" />
                <span>{streakMultiplier}x bonus</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-2.5 py-1">
                <span>✨ {todayPoints.toLocaleString()} points</span>
              </div>
              {streakDays >= 3 && (
                <div className="flex items-center gap-1 bg-orange-500/10 rounded-full px-2.5 py-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-orange-400">{streakDays} day streak!</span>
                </div>
              )}
            </div>

            {/* Primary CTA: Friendly language */}
            <ShimmerButton
              onClick={() => handleNavigation('/app/map')}
              shimmerEnabled={!loading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-neon-cyan to-sky-400 text-background font-bold text-lg shadow-lg shadow-neon-cyan/30 hover:shadow-neon-cyan/50 active:scale-[0.98] transition-all duration-300 group"
            >
              <Signal className="w-5 h-5 group-hover:animate-pulse" />
              {t('app.home.startEarning')}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </ShimmerButton>
          </div>
        </div>

        {/* Daily Goal Celebration */}
        <RewardCelebration
          trigger={showDailyGoalCelebration}
          points={todayPoints}
          type="milestone"
          onComplete={() => setShowDailyGoalCelebration(false)}
        />

        {/* TWO MINI CARDS: Impact & Boost */}
        <div className="grid grid-cols-2 gap-3">
          {/* Impact Card - Friendly */}
          <div 
            className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-4 animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-500/5 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-sky-400" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('app.home.yourImpact')}</span>
            </div>
            <div 
              className="text-xl font-bold text-foreground mb-0.5"
            >
              {loading ? '--' : formatDistance(points?.total_distance_meters || 0)}
            </div>
            <div className="text-xs text-muted-foreground">{t('app.home.explored')} 🗺️</div>
          </div>

          {/* Boost Card - Pressable to go to Invite */}
          <div 
            className="relative rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-4 overflow-hidden animate-fade-in cursor-pointer active:scale-[0.98] transition-transform"
            style={{ animationDelay: '250ms' }}
            onClick={() => {
              lightTap();
              navigate('/app/profile?tab=earn');
            }}
          >
            {/* Shimmer animation */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 8s ease-in-out infinite'
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center">
                  <Gift className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('app.home.tip')}</span>
              </div>
              <div className="text-sm font-semibold text-foreground mb-0.5">{t('app.home.earnMore')}</div>
              <div className="text-xs text-violet-400">{t('app.home.inviteFriends')} →</div>
            </div>
          </div>
        </div>

        {/* STREAK BONUS (if streak >= 1) */}
        {user && streakDays >= 1 && (
          <div 
            className="animate-fade-in"
            style={{ animationDelay: '300ms' }}
          >
            <StreakBonus streakDays={streakDays} isActive={true} />
          </div>
        )}

        {/* ACHIEVEMENTS ROW */}
        {user && achievements.length > 0 && (
          <div 
            className="animate-fade-in"
            style={{ animationDelay: '350ms' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Achievements</span>
                <span className="text-xs text-muted-foreground">({unlockedCount}/{totalCount})</span>
              </div>
              <button 
                onClick={() => handleNavigation('/app/achievements')}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors active:scale-95"
              >
                View All
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            
            {/* Hint text */}
            <p className="text-xs text-muted-foreground mb-2">Tap any badge to see all achievements →</p>
            
            <div 
              className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide cursor-pointer"
              onClick={() => handleNavigation('/app/achievements')}
            >
              {achievements.slice(0, 6).map((achievement) => (
                <AchievementBadge 
                  key={achievement.id} 
                  achievement={achievement} 
                  size="sm"
                  showProgress={true}
                />
              ))}
              {achievements.length > 6 && (
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.05] border border-white/10 text-muted-foreground">
                  <span className="text-xs font-medium">+{achievements.length - 6}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHALLENGES SECTION */}
        {user && (
          <div 
            className="animate-fade-in"
            style={{ animationDelay: '400ms' }}
          >
            <ChallengesSection 
              compact={true} 
              onViewAll={() => handleNavigation('/app/challenges')}
            />
          </div>
        )}

        {/* LEADERBOARD SECTION */}
        {user && (
          <div 
            className="animate-fade-in"
            style={{ animationDelay: '450ms' }}
          >
            <LeaderboardSection 
              compact={true}
              onViewAll={() => handleNavigation('/app/leaderboard')}
            />
          </div>
        )}

        {/* MAP PREVIEW CARD */}
        <div 
          className="relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-300 group animate-fade-in border border-white/[0.08]"
          style={{ animationDelay: '500ms' }}
          onClick={() => handleNavigation('/app/map')}
        >
          {/* Map preview as background */}
          <MiniContributionMap 
            className="w-full h-32"
            contributionPoints={points?.total_points || 0}
            dataPointsCount={dataPointsCount}
          />
          
          {/* Content overlay */}
          <div className="absolute inset-0 flex items-end">
            <div className="w-full p-4 bg-gradient-to-t from-background via-background/90 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <MapPin className="w-4 h-4 text-neon-cyan" />
                    <span className="text-sm font-semibold text-foreground">Your Coverage Map</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dataPointsCount > 0 
                      ? `${dataPointsCount.toLocaleString()} recent data points collected`
                      : 'Start contributing to see your coverage'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-neon-cyan font-medium">
                  <span>View</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Popup */}
        <MilestonePopup 
          show={!!recentUnlock} 
          achievement={recentUnlock} 
          onClose={clearRecentUnlock} 
        />

        {/* Auth CTA for non-logged-in users */}
        {!user && !loading && (
          <div 
            className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5 animate-fade-in"
            style={{ animationDelay: '400ms' }}
          >
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground mb-2">Join the Network</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sign up to start earning rewards for your contributions
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -200% 0; }
        }
        
        @keyframes gentle-pulse {
          0%, 100% { 
            box-shadow: 0 10px 25px -5px hsl(var(--neon-cyan) / 0.3);
          }
          50% { 
            box-shadow: 0 10px 35px -5px hsl(var(--neon-cyan) / 0.5);
          }
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      </div>
    </>
  );
};

export default AppHome;
