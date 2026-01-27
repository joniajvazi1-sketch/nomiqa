import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Achievement, generateAchievements } from '@/components/app/AchievementSystem';
import { usePushNotifications } from './usePushNotifications';
import { useNotificationTriggers } from './useNotificationTriggers';

interface UserStats {
  totalPoints: number;
  totalDistance: number;
  streakDays: number;
  totalReferrals: number;
  dataPointsCount: number;
  sessionsCount: number;
}

interface UseAchievementsReturn {
  achievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
  recentUnlock: Achievement | null;
  clearRecentUnlock: () => void;
  streakDays: number;
  streakMultiplier: number;
  loading: boolean;
  refreshAchievements: () => Promise<void>;
  notificationsEnabled: boolean;
  requestNotificationPermission: () => Promise<boolean>;
}

// Local storage key for tracking previously unlocked achievements
const UNLOCKED_CACHE_KEY = 'nomiqa_unlocked_achievements';

export const useAchievements = (): UseAchievementsReturn => {
  const { isEnabled, requestPermission } = usePushNotifications();
  const { triggerAchievementUnlock, scheduleStreakReminder } = useNotificationTriggers();
  
  const [stats, setStats] = useState<UserStats>({
    totalPoints: 0,
    totalDistance: 0,
    streakDays: 0,
    totalReferrals: 0,
    dataPointsCount: 0,
    sessionsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentUnlock, setRecentUnlock] = useState<Achievement | null>(null);
  const [previouslyUnlocked, setPreviouslyUnlocked] = useState<Set<string>>(new Set());

  // Load previously unlocked achievements from localStorage
  useEffect(() => {
    try {
      const cached = localStorage.getItem(UNLOCKED_CACHE_KEY);
      if (cached) {
        setPreviouslyUnlocked(new Set(JSON.parse(cached)));
      }
    } catch (e) {
      console.error('Error loading achievement cache:', e);
    }
  }, []);

  // Fetch user stats
  const fetchStats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch points data
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch sessions count and data points (bounded to avoid slow loads)
      const { data: sessionsData } = await supabase
        .from('contribution_sessions')
        .select('id, data_points_count')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(500);

      // Fetch referrals count (using _safe view)
      const { data: affiliateData } = await supabase
        .from('affiliates_safe')
        .select('total_registrations')
        .eq('user_id', user.id)
        .maybeSingle();

      const totalDataPoints = sessionsData?.reduce((sum, s) => sum + (s.data_points_count || 0), 0) || 0;

      setStats({
        totalPoints: pointsData?.total_points || 0,
        totalDistance: pointsData?.total_distance_meters || 0,
        streakDays: pointsData?.contribution_streak_days || 0,
        totalReferrals: affiliateData?.total_registrations || 0,
        dataPointsCount: totalDataPoints,
        sessionsCount: sessionsData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching achievement stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Schedule streak reminder on mount
  useEffect(() => {
    scheduleStreakReminder();
  }, [scheduleStreakReminder]);

  // Generate achievements from stats
  const achievements = useMemo(() => {
    return generateAchievements(stats);
  }, [stats]);

  // Check for newly unlocked achievements
  useEffect(() => {
    if (loading) return;

    const currentlyUnlocked = achievements.filter(a => a.unlocked);
    const newUnlocks = currentlyUnlocked.filter(a => !previouslyUnlocked.has(a.id));

    if (newUnlocks.length > 0) {
      // Show the most recent unlock
      const latestUnlock = newUnlocks[newUnlocks.length - 1];
      setRecentUnlock(latestUnlock);
      
      // Send push notification for achievement unlock using the new trigger
      triggerAchievementUnlock(latestUnlock.title, latestUnlock.reward);

      // Update cache
      const newCache = new Set(previouslyUnlocked);
      newUnlocks.forEach(a => newCache.add(a.id));
      setPreviouslyUnlocked(newCache);
      
      try {
        localStorage.setItem(UNLOCKED_CACHE_KEY, JSON.stringify([...newCache]));
      } catch (e) {
        console.error('Error saving achievement cache:', e);
      }
    }
  }, [achievements, previouslyUnlocked, loading, triggerAchievementUnlock]);

  // Calculate streak multiplier
  const streakMultiplier = useMemo(() => {
    if (stats.streakDays >= 30) return 2.0;
    if (stats.streakDays >= 14) return 1.75;
    if (stats.streakDays >= 7) return 1.5;
    if (stats.streakDays >= 3) return 1.25;
    return 1.0;
  }, [stats.streakDays]);

  const clearRecentUnlock = useCallback(() => {
    setRecentUnlock(null);
  }, []);

  return {
    achievements,
    unlockedCount: achievements.filter(a => a.unlocked).length,
    totalCount: achievements.length,
    recentUnlock,
    clearRecentUnlock,
    streakDays: stats.streakDays,
    streakMultiplier,
    loading,
    refreshAchievements: fetchStats,
    notificationsEnabled: isEnabled,
    requestNotificationPermission: requestPermission
  };
};
