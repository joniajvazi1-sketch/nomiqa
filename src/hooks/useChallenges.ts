import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

type ChallengeType = 'daily' | 'weekly' | 'special';
type MetricType = 
  | 'speed_tests' 
  | 'distance_meters' 
  | 'streak_days' 
  | 'data_points' 
  | 'sessions'
  | 'session_hours'
  | 'network_changes'
  | 'passive'
  | 'active_days'
  | 'unique_locations'
  | 'network_diversity'
  | 'no_pause';

interface Challenge {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  target_value: number;
  reward_points: number;
  metric_type: MetricType;
  is_active: boolean;
}

interface ChallengeProgress {
  id: string;
  challenge_id: string;
  current_value: number;
  period_start: string;
  started_at: string;
  completed_at: string | null;
  claimed_at: string | null;
  active_days_this_period?: number;
  unique_geohashes_this_period?: string[];
  network_types_this_period?: string[];
}

interface ChallengeWithProgress extends Challenge {
  progress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  progressId: string | null;
  bonusPoints: number;
}

// Background streak bonus (7d = +10%, 30d = 2x)
export const getStreakMultiplier = (streakDays: number): number => {
  if (streakDays >= 30) return 2.0;
  if (streakDays >= 7) return 1.1 + (0.9 * (streakDays - 7) / 23.0);
  return 1.0;
};

export const getStreakBonusPercent = (streakDays: number): number => {
  return Math.round((getStreakMultiplier(streakDays) - 1) * 100);
};

interface UseChallengesReturn {
  challenges: ChallengeWithProgress[];
  dailyChallenges: ChallengeWithProgress[];
  weeklyChallenges: ChallengeWithProgress[];
  specialChallenges: ChallengeWithProgress[];
  loading: boolean;
  error: string | null;
  claimReward: (challengeId: string) => Promise<boolean>;
  refreshProgress: () => Promise<void>;
  unclaimedCount: number;
  completedTodayCount: number;
  dailyChallengeStreak: number;
  streakBonusPercent: number;
  backgroundStreakDays: number;
}

const getPeriodStart = (type: 'daily' | 'weekly' | 'special'): string => {
  const now = new Date();
  if (type === 'daily') {
    return now.toISOString().split('T')[0];
  } else if (type === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day;
    const weekStart = new Date(now.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  }
  return '2024-01-01';
};

export const useChallenges = (): UseChallengesReturn => {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyChallengeStreak, setDailyChallengeStreak] = useState(0);
  const [backgroundStreakDays, setBackgroundStreakDays] = useState(0);

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setChallenges([]);
        setLoading(false);
        return;
      }

      // Fetch all active challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true);

      if (challengesError) throw challengesError;

      // Fetch user's progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      // Fetch user stats
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const currentStreak = (pointsData as any)?.daily_challenge_streak_days || 0;
      const bgStreak = (pointsData as any)?.background_streak_days || 0;
      setDailyChallengeStreak(currentStreak);
      setBackgroundStreakDays(bgStreak);

      // Get today's date range
      const today = new Date().toISOString().split('T')[0];
      const todayStart = `${today}T00:00:00`;
      const todayEnd = `${today}T23:59:59`;

      // Get week start
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekStartStr = weekStart.toISOString();

      // Fetch today's sessions for session_hours calculation
      const { data: todaySessions } = await supabase
        .from('contribution_sessions')
        .select('id, started_at, ended_at, total_distance_meters, data_points_count, status')
        .eq('user_id', user.id)
        .gte('started_at', todayStart)
        .lte('started_at', todayEnd);

      // Fetch this week's sessions
      const { data: weekSessions } = await supabase
        .from('contribution_sessions')
        .select('id, started_at, ended_at, total_distance_meters, data_points_count')
        .eq('user_id', user.id)
        .gte('started_at', weekStartStr);

      // Fetch signal logs for network changes detection
      const { data: todaySignalLogs } = await supabase
        .from('signal_logs')
        .select('network_type, location_geohash')
        .eq('user_id', user.id)
        .gte('recorded_at', todayStart);

      // Fetch week's signal logs for network diversity and unique locations
      const { data: weekSignalLogs } = await supabase
        .from('signal_logs')
        .select('network_type, location_geohash, recorded_at')
        .eq('user_id', user.id)
        .gte('recorded_at', weekStartStr);

      // Calculate metrics
      const todayDistance = todaySessions?.reduce((sum, s) => sum + (s.total_distance_meters || 0), 0) || 0;
      const todayDataPoints = todaySessions?.reduce((sum, s) => sum + (s.data_points_count || 0), 0) || 0;
      const todaySessionCount = todaySessions?.length || 0;
      const weekDistance = weekSessions?.reduce((sum, s) => sum + (s.total_distance_meters || 0), 0) || 0;
      const weekSessionCount = weekSessions?.length || 0;
      const streakDays = pointsData?.contribution_streak_days || 0;

      // Calculate session hours today (sum of active/completed sessions)
      const sessionHoursToday = (todaySessions || []).reduce((sum, s) => {
        const start = new Date(s.started_at).getTime();
        const end = s.ended_at ? new Date(s.ended_at).getTime() : Date.now();
        return sum + (end - start) / (1000 * 60 * 60); // Convert to hours
      }, 0);

      // Count distinct network types today
      const todayNetworkTypes = new Set((todaySignalLogs || []).map(l => l.network_type).filter(Boolean));
      const networkChangesToday = todayNetworkTypes.size;

      // Check if app was active at all today (passive bonus)
      const wasActiveToday = (todaySessions?.length || 0) > 0 || (todaySignalLogs?.length || 0) > 0;

      // Weekly metrics
      const weekDates = new Set((weekSessions || []).map(s => s.started_at?.split('T')[0]).filter(Boolean));
      const activeDaysThisWeek = weekDates.size;

      // Unique locations this week (5-char geohash = ~5km cells)
      const weekGeohashes = new Set((weekSignalLogs || []).map(l => l.location_geohash?.substring(0, 5)).filter(Boolean));
      const uniqueLocationsWeek = weekGeohashes.size;

      // Network diversity this week
      const weekNetworkTypes = new Set((weekSignalLogs || []).map(l => l.network_type).filter(Boolean));
      const networkDiversityWeek = weekNetworkTypes.size;

      // Calculate streak bonus for background earnings (not challenge rewards)
      // Challenge bonus points are calculated separately below

      // Combine challenges with progress
      const challengesWithProgress: ChallengeWithProgress[] = (challengesData || []).map((dbChallenge) => {
        const challenge: Challenge = {
          ...dbChallenge,
          type: dbChallenge.type as ChallengeType,
          metric_type: dbChallenge.metric_type as MetricType
        };
        const periodStart = getPeriodStart(challenge.type);
        const progress = (progressData as ChallengeProgress[] | null)?.find(
          p => p.challenge_id === challenge.id && p.period_start === periodStart
        );

        // Calculate current value based on metric type
        let currentValue = progress?.current_value || 0;
        
        if (!progress || progress.current_value === 0) {
          switch (challenge.metric_type) {
            case 'session_hours':
              currentValue = challenge.type === 'daily' ? sessionHoursToday : 0;
              break;
            case 'distance_meters':
              currentValue = challenge.type === 'daily' ? todayDistance : 
                           challenge.type === 'weekly' ? weekDistance : 
                           weekDistance; // Special uses total
              break;
            case 'network_changes':
              currentValue = networkChangesToday;
              break;
            case 'data_points':
              currentValue = challenge.type === 'daily' ? todayDataPoints : 0;
              break;
            case 'passive':
              currentValue = wasActiveToday ? 1 : 0;
              break;
            case 'active_days':
              currentValue = activeDaysThisWeek;
              break;
            case 'unique_locations':
              currentValue = uniqueLocationsWeek;
              break;
            case 'network_diversity':
              currentValue = networkDiversityWeek;
              break;
            case 'no_pause':
              // Check if there was a pause in the week
              currentValue = activeDaysThisWeek; // Simplified: days active = days without pause
              break;
            case 'sessions':
              currentValue = challenge.type === 'daily' ? todaySessionCount : weekSessionCount;
              break;
            case 'streak_days':
              currentValue = streakDays;
              break;
            case 'speed_tests':
              // Already handled elsewhere
              break;
          }
        }

        const progressPercent = Math.min(100, (currentValue / challenge.target_value) * 100);
        const isCompleted = currentValue >= challenge.target_value;
        const isClaimed = !!progress?.claimed_at;

        // Bonus points: daily challenges get streak bonus
        const bonusPoints = challenge.type === 'daily' && currentStreak > 0
          ? Math.round(challenge.reward_points * (getStreakMultiplier(currentStreak) - 1))
          : 0;

        return {
          ...challenge,
          progress: progressPercent,
          isCompleted,
          isClaimed,
          progressId: progress?.id || null,
          bonusPoints
        };
      });

      setChallenges(challengesWithProgress);
    } catch (err: any) {
      console.error('Error fetching challenges:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const claimReward = useCallback(async (challengeId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge || !challenge.isCompleted || challenge.isClaimed) return false;

      const periodStart = getPeriodStart(challenge.type);

      // Use atomic server-side function to prevent race conditions
      const { data, error: rpcError } = await supabase.rpc('claim_challenge_reward', {
        p_user_id: user.id,
        p_challenge_id: challengeId,
        p_reward_points: Math.round(challenge.reward_points),
        p_bonus_points: Math.round(challenge.bonusPoints || 0),
        p_period_start: periodStart,
        p_is_daily: challenge.type === 'daily'
      });

      if (rpcError) {
        console.error('Error claiming reward via RPC:', rpcError);
        throw rpcError;
      }

      const result = data as any;
      if (!result?.success) {
        console.warn('Claim rejected:', result?.reason);
        return false;
      }

      await fetchChallenges();
      return true;
    } catch (err) {
      console.error('Error claiming reward:', err);
      return false;
    }
  }, [challenges, fetchChallenges]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const dailyChallenges = useMemo(() => 
    challenges.filter(c => c.type === 'daily'), [challenges]);
  
  const weeklyChallenges = useMemo(() => 
    challenges.filter(c => c.type === 'weekly'), [challenges]);
  
  const specialChallenges = useMemo(() => 
    challenges.filter(c => c.type === 'special'), [challenges]);

  const unclaimedCount = useMemo(() => 
    challenges.filter(c => c.isCompleted && !c.isClaimed).length, [challenges]);

  const completedTodayCount = useMemo(() => 
    dailyChallenges.filter(c => c.isCompleted).length, [dailyChallenges]);

  const streakBonusPercent = useMemo(() => 
    getStreakBonusPercent(backgroundStreakDays), [backgroundStreakDays]);

  return {
    challenges,
    dailyChallenges,
    weeklyChallenges,
    specialChallenges,
    loading,
    error,
    claimReward,
    refreshProgress: fetchChallenges,
    unclaimedCount,
    completedTodayCount,
    dailyChallengeStreak,
    streakBonusPercent,
    backgroundStreakDays
  };
};
