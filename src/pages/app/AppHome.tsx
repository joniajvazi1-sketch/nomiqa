import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap,
  ChevronRight,
  MapPin,
  TrendingUp,
  Settings,
  Bell,
  Flame,
  Trophy,
  Calendar,
  Signal,
  Users,
  Target,
  Crown
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
import { LeaderboardSection } from '@/components/app/LeaderboardSection';
import { OnboardingFlow } from '@/components/app/OnboardingFlow';
import { AnimatePresence } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/app/PullToRefreshIndicator';
import { LanguageSelector } from '@/components/app/LanguageSelector';
import { AppSpinner } from '@/components/app/AppSpinner';
import { DailyCheckIn } from '@/components/app/DailyCheckIn';
import { SectionErrorBoundary } from '@/components/app/SectionErrorBoundary';
import { StreakCalendar } from '@/components/app/StreakCalendar';
import { SpinWheel } from '@/components/app/SpinWheel';
import { PersonalizedGoals } from '@/components/app/PersonalizedGoals';
import { RatingPrompt, useRatingPrompt } from '@/components/app/RatingPrompt';
import { FloatingPoints, useFloatingPoints } from '@/components/app/FloatingPoints';
import { Confetti } from '@/components/Confetti';

interface DailyEarning {
  date: string;
  points: number;
}

const POINTS_TO_USD = 0.01;
const DAILY_GOAL_POINTS = 100;

type ContentTab = 'activity' | 'challenges' | 'community';

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
  const { 
    isOpen: ratingPromptOpen, 
    triggerReason, 
    triggerRatingPrompt, 
    handleRate, 
    handleDismiss, 
    trackSession,
    close: closeRatingPrompt 
  } = useRatingPrompt();
  
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
  const [lastActiveDate, setLastActiveDate] = useState<Date | null>(null);
  const [showFirstPurchaseConfetti, setShowFirstPurchaseConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentTab>('activity');
  const usdRef = useRef<HTMLDivElement>(null);
  const { trigger: floatingTrigger, points: floatingPointsValue, showPoints } = useFloatingPoints();

  const loadData = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
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

        const { data: sessionsData } = await supabase
          .from('contribution_sessions')
          .select('data_points_count, started_at, total_points_earned')
          .eq('user_id', currentUser.id)
          .order('started_at', { ascending: false })
          .limit(500);

        if (sessionsData) {
          const totalDataPoints = sessionsData.reduce((sum, s) => sum + (s.data_points_count || 0), 0);
          setDataPointsCount(totalDataPoints);

          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const dailyMap = new Map<string, number>();
          const today = new Date();
          
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            dailyMap.set(dateKey, 0);
          }
          
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
          if (checkins.length > 0) {
            setLastActiveDate(new Date(checkins[0].check_in_date));
          }
        }

        const today = new Date().toISOString().split('T')[0];
        const { data: todaySpin } = await supabase
          .from('spin_wheel_results')
          .select('id')
          .eq('user_id', currentUser.id)
          .eq('spin_date', today)
          .maybeSingle();

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

  const { isRefreshing, pullDistance, pullProgress, handlers } = usePullToRefresh({
    onRefresh: loadData
  });

  const todayPoints = useMemo(() => {
    if (earningsData.length === 0) return 0;
    return earningsData[earningsData.length - 1].points;
  }, [earningsData]);

  const todayUSD = useMemo(() => todayPoints * POINTS_TO_USD, [todayPoints]);

  useEffect(() => {
    const celebratedKey = `daily-goal-celebrated-${new Date().toISOString().split('T')[0]}`;
    const alreadyCelebrated = localStorage.getItem(celebratedKey) === 'true';
    
    if (todayPoints >= DAILY_GOAL_POINTS && !alreadyCelebrated && !dailyGoalCelebrated) {
      setShowDailyGoalCelebration(true);
      setDailyGoalCelebrated(true);
      localStorage.setItem(celebratedKey, 'true');
      
      setTimeout(() => {
        triggerRatingPrompt('milestone');
      }, 3000);
    }
  }, [todayPoints, dailyGoalCelebrated, triggerRatingPrompt]);

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

  const handleTabChange = (tab: ContentTab) => {
    lightTap();
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <AppSpinner size="lg" label="Loading..." />
      </div>
    );
  }

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

  const displayName = username || 'Explorer';

  const tabs = [
    { id: 'activity' as const, label: 'Activity', icon: Zap },
    { id: 'challenges' as const, label: 'Challenges', icon: Target },
    { id: 'community' as const, label: 'Community', icon: Users },
  ];

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
          {/* ZONE 1: Header */}
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

            <div className="flex items-center gap-2">
              <button 
                onClick={() => { 
                  lightTap(); 
                  if (notificationsSupported && !notificationsEnabled) {
                    setShowNotificationPrompt(prev => !prev);
                  }
                }}
                className={cn(
                  "w-9 h-9 rounded-full border flex items-center justify-center active:scale-95 transition-transform",
                  notificationsEnabled 
                    ? "bg-primary/10 border-primary/30" 
                    : "bg-card border-border"
                )}
              >
                <Bell className={cn(
                  "w-4 h-4",
                  notificationsEnabled ? "text-primary" : "text-muted-foreground"
                )} />
              </button>
              
              <LanguageSelector />
              
              <button 
                onClick={() => { lightTap(); navigate('/app/profile'); }}
                className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center active:scale-95 transition-transform"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </header>

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

          {/* ZONE 2: Hero - Greeting + Balance */}
          <div className="space-y-3">
            {/* Greeting - simplified, no animation */}
            {user && (
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Hi, {displayName}
                </h1>
                {streakDays >= 3 && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    {streakDays} day streak
                  </p>
                )}
              </div>
            )}

            {/* Balance Card */}
            <div className="rounded-2xl bg-card border border-border p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Today's Earnings</span>
              </div>
              
              <div ref={usdRef} className="mb-3">
                <div className="text-4xl font-bold text-foreground tabular-nums">
                  ${animatedUSD.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {todayPoints.toLocaleString()} pts • {streakMultiplier}x multiplier
                </p>
              </div>

              <button
                onClick={() => handleNavigation('/app/map')}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Signal className="w-4 h-4" />
                Start Earning
              </button>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-card border border-border p-3 text-center">
                <MapPin className="w-4 h-4 text-primary mx-auto mb-1" />
                <div className="text-sm font-semibold text-foreground">
                  {formatDistance(points?.total_distance_meters || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Distance</p>
              </div>
              
              <button 
                onClick={() => setShowStreakCalendar(true)}
                className="rounded-xl bg-card border border-border p-3 text-center active:scale-[0.98] transition-transform"
              >
                <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                <div className="text-sm font-semibold text-foreground">
                  {streakDays}
                </div>
                <p className="text-xs text-muted-foreground">Streak</p>
              </button>
              
              <button 
                onClick={() => handleNavigation('/app/leaderboard')}
                className="rounded-xl bg-card border border-border p-3 text-center active:scale-[0.98] transition-transform"
              >
                <Crown className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <div className="text-sm font-semibold text-foreground">
                  #{points?.total_points ? Math.max(1, Math.floor(1000 / (points.total_points || 1))) : '-'}
                </div>
                <p className="text-xs text-muted-foreground">Rank</p>
              </button>
            </div>
          </div>

          {/* ZONE 3: Tabbed Content */}
          {user && (
            <div className="space-y-4">
              {/* Tab Navigation */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground'
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[200px]">
                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    {/* Map Preview */}
                    <button
                      onClick={() => handleNavigation('/app/map')}
                      className="w-full rounded-2xl overflow-hidden active:scale-[0.99] transition-transform"
                    >
                      <MiniContributionMap 
                        className="w-full h-32"
                        contributionPoints={points?.total_points || 0}
                        dataPointsCount={dataPointsCount}
                      />
                    </button>

                    {/* Goals */}
                    <SectionErrorBoundary fallbackTitle="Goals unavailable">
                      <PersonalizedGoals 
                        userId={user.id} 
                        currentPoints={todayPoints}
                        compact={true}
                      />
                    </SectionErrorBoundary>

                    {/* Achievements Row */}
                    {achievements.length > 0 && (
                      <div className="rounded-xl bg-card border border-border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Trophy className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">Achievements</span>
                            <span className="text-xs text-muted-foreground">({unlockedCount}/{totalCount})</span>
                          </div>
                          <button 
                            onClick={() => handleNavigation('/app/achievements')}
                            className="text-xs text-primary"
                          >
                            View All
                          </button>
                        </div>
                        
                        <div className="flex gap-1.5 overflow-x-auto">
                          {achievements.slice(0, 5).map((achievement) => (
                            <AchievementBadge 
                              key={achievement.id} 
                              achievement={achievement} 
                              size="sm"
                              showProgress={false}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'challenges' && (
                  <SectionErrorBoundary fallbackTitle="Challenges unavailable">
                    <ChallengesSection 
                      compact={false}
                      maxItems={3}
                      onViewAll={() => handleNavigation('/app/challenges')}
                    />
                  </SectionErrorBoundary>
                )}

                {activeTab === 'community' && (
                  <SectionErrorBoundary fallbackTitle="Leaderboard unavailable">
                    <LeaderboardSection 
                      compact={false}
                      maxItems={5}
                      onViewAll={() => handleNavigation('/app/leaderboard')}
                    />
                  </SectionErrorBoundary>
                )}
              </div>
            </div>
          )}

          {/* Auth CTA for non-logged-in users */}
          {!user && !loading && (
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="text-center">
                <h3 className="text-base font-bold text-foreground mb-1">Join the Network</h3>
                <p className="text-sm text-muted-foreground mb-3">
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
      </div>

      {/* Modals */}
      {user && <DailyCheckIn userId={user.id} />}

      <AnimatePresence>
        {showSpinWheel && user && (
          <SpinWheel 
            userId={user.id} 
            onClose={() => setShowSpinWheel(false)}
            onPrizeWon={() => loadData()}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStreakCalendar && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" 
            onClick={() => setShowStreakCalendar(false)}
          >
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

      <RewardCelebration
        trigger={showDailyGoalCelebration}
        points={todayPoints}
        type="milestone"
        onComplete={() => setShowDailyGoalCelebration(false)}
      />

      <FloatingPoints 
        trigger={floatingTrigger} 
        points={floatingPointsValue} 
      />

      <Confetti 
        trigger={showFirstPurchaseConfetti} 
        onComplete={() => setShowFirstPurchaseConfetti(false)} 
      />

      <MilestonePopup 
        show={!!recentUnlock} 
        achievement={recentUnlock} 
        onClose={clearRecentUnlock} 
      />

      <RatingPrompt
        isOpen={ratingPromptOpen}
        onClose={closeRatingPrompt}
        onRate={handleRate}
        onDismiss={handleDismiss}
        triggerReason={triggerReason}
      />
    </>
  );
};

export default AppHome;
