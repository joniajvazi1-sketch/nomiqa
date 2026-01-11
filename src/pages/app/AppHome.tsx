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
  Flame,
  Trophy,
  Gift,
  Calendar
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
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
import { RewardCelebration } from '@/components/app/RewardCelebration';
import { ShimmerButton } from '@/components/app/ShimmerButton';
import { OnboardingFlow } from '@/components/app/OnboardingFlow';
import { AnimatePresence } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/app/PullToRefreshIndicator';
import { LanguageSelector } from '@/components/app/LanguageSelector';
import { HomeScreenSkeleton } from '@/components/app/skeletons';
import { FloatingQuickEarn } from '@/components/app/FloatingQuickEarn';
import { DailyCheckIn } from '@/components/app/DailyCheckIn';
import { SectionErrorBoundary } from '@/components/app/SectionErrorBoundary';
import { StreakCalendar } from '@/components/app/StreakCalendar';
import { SpinWheel } from '@/components/app/SpinWheel';
import { SocialProofToast } from '@/components/app/SocialProofIndicator';
import { PersonalizedGoals } from '@/components/app/PersonalizedGoals';

interface DailyEarning {
  date: string;
  points: number;
}

// Point to USD conversion rate (mock for now)
const POINTS_TO_USD = 0.01;

// Daily goal threshold for celebration
const DAILY_GOAL_POINTS = 100;

/**
 * App Home Dashboard - Compact Single-Screen Layout
 * Optimized to fit all key information in one viewport without scrolling
 */
export const AppHome: React.FC = () => {
  const navigate = useNavigate();
  const { mediumTap, lightTap } = useHaptics();
  const { playCoin, playTick } = useEnhancedSounds();
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
  const [showStreakCalendar, setShowStreakCalendar] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [checkinHistory, setCheckinHistory] = useState<{ date: string; points: number }[]>([]);
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

        // Fetch checkin history for streak calendar
        const { data: checkins } = await supabase
          .from('daily_checkins')
          .select('check_in_date, bonus_points')
          .eq('user_id', currentUser.id)
          .order('check_in_date', { ascending: false })
          .limit(90);

        if (checkins) {
          setCheckinHistory(checkins.map(c => ({
            date: c.check_in_date,
            points: c.bonus_points,
          })));
        }

        // Check if user can spin today
        const today = new Date().toISOString().split('T')[0];
        const { data: todaySpin } = await supabase
          .from('spin_wheel_results')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('spin_date', today)
          .maybeSingle();

        // Show spin wheel if no spin today (after a delay)
        if (!todaySpin) {
          setTimeout(() => setShowSpinWheel(true), 3000);
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
    playTick();
    navigate(path);
  };

  // Show skeleton while loading
  if (loading) {
    return <HomeScreenSkeleton />;
  }

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

        {/* Subtle animated background - reduced size */}
        <div className="fixed inset-0 pointer-events-none">
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-10"
            style={{
              background: 'radial-gradient(circle, hsl(var(--neon-cyan)) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
        </div>

        <div className="relative z-10 px-4 py-4 pb-24 space-y-3">
          {/* COMPACT TOP BAR */}
          <header className="flex items-center justify-between">
            {/* Status Pill - smaller */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.08]">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                isOnline ? "bg-neon-cyan animate-pulse" : "bg-red-500"
              )} />
              <span className="text-[10px] text-foreground/80 font-medium">
                {isOnline ? 'Online' : 'Offline'} • {getConnectionLabel()}
              </span>
            </div>

            {/* Icon buttons - smaller */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => { 
                  lightTap(); 
                  if (notificationsSupported && !notificationsEnabled) {
                    setShowNotificationPrompt(prev => !prev);
                  }
                }}
                className={cn(
                  "w-8 h-8 rounded-full backdrop-blur-xl border flex items-center justify-center active:scale-95 transition-all relative",
                  notificationsEnabled 
                    ? "bg-primary/10 border-primary/30" 
                    : "bg-white/[0.05] border-white/[0.08]"
                )}
              >
                <Bell className={cn(
                  "w-3.5 h-3.5",
                  notificationsEnabled ? "text-primary" : "text-muted-foreground"
                )} />
                {notificationsSupported && !notificationsEnabled && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
              
              <LanguageSelector />
              
              <button 
                onClick={() => { lightTap(); navigate('/app/profile'); }}
                className="w-8 h-8 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] flex items-center justify-center active:scale-95 transition-all"
              >
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
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

          {/* COMPACT HERO CARD */}
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/15 via-primary/10 to-transparent" />
            <div className="absolute inset-0 backdrop-blur-2xl" />
            
            <div className="relative p-4 border border-neon-cyan/15 rounded-2xl">
              {/* Label */}
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-neon-cyan" />
                <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">{t('app.home.todaysEarnings')}</span>
              </div>
              
              {/* Big USD Number - smaller */}
              <div ref={usdRef} className="mb-1">
                <div className="text-4xl font-bold text-foreground tracking-tight leading-none">
                  ${animatedUSD.toFixed(2)}
                </div>
              </div>

              {/* Sublines - more compact */}
              <div className="flex items-center flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-0.5">
                  <TrendingUp className="w-3 h-3 text-neon-cyan" />
                  <span>{streakMultiplier}x</span>
                </div>
                <span>✨ {todayPoints.toLocaleString()} pts</span>
                {streakDays >= 3 && (
                  <button 
                    onClick={() => setShowStreakCalendar(true)}
                    className="flex items-center gap-1 bg-orange-500/10 rounded-full px-2 py-0.5 active:scale-95"
                  >
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span className="text-orange-400">{streakDays}d</span>
                  </button>
                )}
              </div>

              {/* Primary CTA - smaller */}
              <ShimmerButton
                onClick={() => handleNavigation('/app/map')}
                shimmerEnabled={!loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-neon-cyan to-sky-400 text-background font-bold text-sm shadow-lg shadow-neon-cyan/30 active:scale-[0.98] transition-all group"
              >
                <Signal className="w-4 h-4" />
                {t('app.home.startEarning')}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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

          {/* PERSONALIZED GOALS - COMPACT INLINE */}
          {user && (
            <SectionErrorBoundary fallbackTitle="Goals unavailable">
              <PersonalizedGoals 
                userId={user.id} 
                currentPoints={todayPoints}
                compact={true}
              />
            </SectionErrorBoundary>
          )}

          {/* TWO MINI CARDS: Impact & Tip - more compact */}
          <div className="grid grid-cols-2 gap-2">
            {/* Impact Card */}
            <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-500/20 to-sky-500/5 flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-sky-400" />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">{t('app.home.yourImpact')}</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {formatDistance(points?.total_distance_meters || 0)}
              </div>
            </div>

            {/* Boost Card */}
            <div 
              className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-3 cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => { lightTap(); navigate('/app/profile?tab=earn'); }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center">
                  <Gift className="w-3 h-3 text-violet-400" />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">{t('app.home.tip')}</span>
              </div>
              <div className="text-sm font-semibold text-foreground">{t('app.home.earnMore')}</div>
            </div>
          </div>

          {/* STREAK BADGE (inline, small) */}
          {user && streakDays >= 1 && (
            <button 
              onClick={() => setShowStreakCalendar(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 active:scale-[0.98] transition-transform w-full"
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-foreground flex-1 text-left">{streakDays} Day Streak</span>
              <span className="text-xs text-orange-400">{streakMultiplier}x bonus</span>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* ACHIEVEMENTS ROW - compact */}
          {user && achievements.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Achievements</span>
                  <span className="text-[10px] text-muted-foreground">({unlockedCount}/{totalCount})</span>
                </div>
                <button 
                  onClick={() => handleNavigation('/app/achievements')}
                  className="text-[10px] text-primary active:scale-95"
                >
                  View All →
                </button>
              </div>
              
              <div 
                className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide cursor-pointer"
                onClick={() => handleNavigation('/app/achievements')}
              >
                {achievements.slice(0, 5).map((achievement) => (
                  <AchievementBadge 
                    key={achievement.id} 
                    achievement={achievement} 
                    size="sm"
                    showProgress={false}
                  />
                ))}
                {achievements.length > 5 && (
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.05] border border-white/10 text-muted-foreground flex-shrink-0">
                    <span className="text-[10px] font-medium">+{achievements.length - 5}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CHALLENGES SECTION - only 1 card shown */}
          {user && (
            <SectionErrorBoundary fallbackTitle="Challenges unavailable">
              <ChallengesSection 
                compact={true} 
                onViewAll={() => handleNavigation('/app/challenges')}
              />
            </SectionErrorBoundary>
          )}

          {/* MAP PREVIEW CARD - smaller */}
          <div 
            className="relative rounded-xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all group border border-white/[0.08]"
            onClick={() => handleNavigation('/app/map')}
          >
            <MiniContributionMap 
              className="w-full h-20"
              contributionPoints={points?.total_points || 0}
              dataPointsCount={dataPointsCount}
            />
            
            <div className="absolute inset-0 flex items-end">
              <div className="w-full px-3 py-2 bg-gradient-to-t from-background via-background/90 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-neon-cyan" />
                    <span className="text-xs font-semibold text-foreground">Coverage Map</span>
                    <span className="text-[10px] text-muted-foreground">
                      {dataPointsCount > 0 ? `${dataPointsCount.toLocaleString()} pts` : ''}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neon-cyan group-hover:translate-x-1 transition-transform" />
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
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4">
              <div className="text-center">
                <h3 className="text-base font-bold text-foreground mb-1">Join the Network</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Sign up to start earning rewards
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

        {/* CSS Animations */}
        <style>{`
          @keyframes shimmer {
            0%, 100% { background-position: 200% 0; }
            50% { background-position: -200% 0; }
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

      {/* Floating Quick Earn Button */}
      <FloatingQuickEarn />

      {/* Daily Check-in Modal */}
      {user && <DailyCheckIn userId={user.id} />}

      {/* Spin Wheel Modal */}
      <AnimatePresence>
        {showSpinWheel && user && (
          <SpinWheel 
            userId={user.id} 
            onClose={() => setShowSpinWheel(false)}
            onPrizeWon={() => loadData()}
          />
        )}
      </AnimatePresence>

      {/* Streak Calendar Modal */}
      <AnimatePresence>
        {showStreakCalendar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowStreakCalendar(false)}>
            <div onClick={(e) => e.stopPropagation()}>
              <StreakCalendar 
                checkins={checkinHistory}
                currentStreak={streakDays}
                onClose={() => setShowStreakCalendar(false)}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Social Proof Toast - only toast, no inline card */}
      <SocialProofToast />
    </>
  );
};

export default AppHome;
