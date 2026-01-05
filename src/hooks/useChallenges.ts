import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

type ChallengeType = 'daily' | 'weekly' | 'special';
type MetricType = 'speed_tests' | 'distance_meters' | 'streak_days' | 'data_points' | 'sessions';

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
}

interface ChallengeWithProgress extends Challenge {
  progress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  progressId: string | null;
}

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
}

const getPeriodStart = (type: 'daily' | 'weekly' | 'special'): string => {
  const now = new Date();
  if (type === 'daily') {
    return now.toISOString().split('T')[0];
  } else if (type === 'weekly') {
    // Get start of the week (Sunday)
    const day = now.getDay();
    const diff = now.getDate() - day;
    const weekStart = new Date(now.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  }
  // Special challenges don't reset
  return '2024-01-01';
};

export const useChallenges = (): UseChallengesReturn => {
  const [challenges, setChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Fetch user stats for calculating progress
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Get today's sessions count
      const today = new Date().toISOString().split('T')[0];
      const { data: todaySessions } = await supabase
        .from('contribution_sessions')
        .select('id, total_distance_meters, data_points_count')
        .eq('user_id', user.id)
        .gte('started_at', `${today}T00:00:00`)
        .lte('started_at', `${today}T23:59:59`);

      // Get this week's sessions
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const { data: weekSessions } = await supabase
        .from('contribution_sessions')
        .select('id, total_distance_meters, data_points_count')
        .eq('user_id', user.id)
        .gte('started_at', weekStart.toISOString());

      // Calculate metrics
      const todayDistance = todaySessions?.reduce((sum, s) => sum + (s.total_distance_meters || 0), 0) || 0;
      const todayDataPoints = todaySessions?.reduce((sum, s) => sum + (s.data_points_count || 0), 0) || 0;
      const todaySessionCount = todaySessions?.length || 0;
      const weekDistance = weekSessions?.reduce((sum, s) => sum + (s.total_distance_meters || 0), 0) || 0;
      const weekSessionCount = weekSessions?.length || 0;
      const streakDays = pointsData?.contribution_streak_days || 0;

      // Get speed test count from signal_logs (approximation)
      const { count: speedTestCount } = await supabase
        .from('signal_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('speed_test_down', 'is', null)
        .gte('recorded_at', `${today}T00:00:00`);

      // Combine challenges with progress
      const challengesWithProgress: ChallengeWithProgress[] = (challengesData || []).map((dbChallenge) => {
        const challenge: Challenge = {
          ...dbChallenge,
          type: dbChallenge.type as ChallengeType,
          metric_type: dbChallenge.metric_type as MetricType
        };
        const periodStart = getPeriodStart(challenge.type);
        const progress = progressData?.find(
          p => p.challenge_id === challenge.id && p.period_start === periodStart
        );

        // Calculate current value based on metric type
        let currentValue = progress?.current_value || 0;
        
        if (!progress) {
          // Calculate from actual user data
          switch (challenge.metric_type) {
            case 'speed_tests':
              currentValue = challenge.type === 'daily' ? (speedTestCount || 0) : 0;
              break;
            case 'distance_meters':
              currentValue = challenge.type === 'daily' ? todayDistance : weekDistance;
              break;
            case 'streak_days':
              currentValue = streakDays;
              break;
            case 'data_points':
              currentValue = challenge.type === 'daily' ? todayDataPoints : 0;
              break;
            case 'sessions':
              currentValue = challenge.type === 'daily' ? todaySessionCount : weekSessionCount;
              break;
          }
        }

        const progressPercent = Math.min(100, (currentValue / challenge.target_value) * 100);
        const isCompleted = currentValue >= challenge.target_value;
        const isClaimed = !!progress?.claimed_at;

        return {
          ...challenge,
          progress: progressPercent,
          isCompleted,
          isClaimed,
          progressId: progress?.id || null
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

      // Upsert progress with claimed timestamp
      const { error: progressError } = await supabase
        .from('user_challenge_progress')
        .upsert({
          user_id: user.id,
          challenge_id: challengeId,
          current_value: challenge.target_value,
          period_start: periodStart,
          completed_at: new Date().toISOString(),
          claimed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,challenge_id,period_start'
        });

      if (progressError) throw progressError;

      // Award points to user
      const { data: currentPoints } = await supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', user.id)
        .single();

      const newTotal = (currentPoints?.total_points || 0) + challenge.reward_points;

      await supabase
        .from('user_points')
        .upsert({
          user_id: user.id,
          total_points: newTotal,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      // Refresh challenges
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
    completedTodayCount
  };
};
