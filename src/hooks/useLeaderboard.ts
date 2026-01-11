import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  username: string | null;
  total_points: number;
  weekly_points: number;
  monthly_points: number;
  total_distance_meters: number;
  rank_all_time: number | null;
  rank_weekly: number | null;
  rank_monthly: number | null;
  rank_change: number; // positive = moved up, negative = moved down
}

interface UserRank {
  rank: number;
  totalPoints: number;
  percentile: number;
}

type LeaderboardPeriod = 'all_time' | 'weekly' | 'monthly';

interface UseLeaderboardReturn {
  entries: LeaderboardEntry[];
  userRank: UserRank | null;
  loading: boolean;
  error: string | null;
  period: LeaderboardPeriod;
  setPeriod: (period: LeaderboardPeriod) => void;
  refresh: () => Promise<void>;
  totalParticipants: number;
}

export const useLeaderboard = (): UseLeaderboardReturn => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Always fetch fresh data from user_points to ensure accuracy
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('user_id, total_points, total_distance_meters')
        .order('total_points', { ascending: false })
        .limit(100);

      if (pointsError) throw pointsError;

      // Get usernames for all users
      const userIds = pointsData?.map(p => p.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profileMap = new Map(profilesData?.map(p => [p.user_id, p.username]) || []);

      // Calculate weekly/monthly points from contribution_sessions
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(now);
      monthAgo.setDate(monthAgo.getDate() - 30);

      // Get weekly points per user
      const { data: weeklySessions } = await supabase
        .from('contribution_sessions')
        .select('user_id, total_points_earned')
        .gte('started_at', weekAgo.toISOString())
        .in('user_id', userIds);

      const weeklyPointsMap = new Map<string, number>();
      weeklySessions?.forEach(s => {
        const current = weeklyPointsMap.get(s.user_id) || 0;
        weeklyPointsMap.set(s.user_id, current + (s.total_points_earned || 0));
      });

      // Get monthly points per user
      const { data: monthlySessions } = await supabase
        .from('contribution_sessions')
        .select('user_id, total_points_earned')
        .gte('started_at', monthAgo.toISOString())
        .in('user_id', userIds);

      const monthlyPointsMap = new Map<string, number>();
      monthlySessions?.forEach(s => {
        const current = monthlyPointsMap.get(s.user_id) || 0;
        monthlyPointsMap.set(s.user_id, current + (s.total_points_earned || 0));
      });

      // Get cached ranks for comparison (to calculate rank changes)
      const { data: cachedData } = await supabase
        .from('leaderboard_cache')
        .select('user_id, rank_all_time, rank_weekly, rank_monthly')
        .in('user_id', userIds);
      
      const cachedRanksMap = new Map(cachedData?.map(c => [c.user_id, {
        rank_all_time: c.rank_all_time,
        rank_weekly: c.rank_weekly,
        rank_monthly: c.rank_monthly
      }]) || []);

      // Build entries with accurate data
      const entriesData: LeaderboardEntry[] = (pointsData || []).map((entry, index) => ({
        user_id: entry.user_id,
        username: profileMap.get(entry.user_id) || null,
        total_points: entry.total_points || 0,
        weekly_points: weeklyPointsMap.get(entry.user_id) || 0,
        monthly_points: monthlyPointsMap.get(entry.user_id) || 0,
        total_distance_meters: entry.total_distance_meters || 0,
        rank_all_time: index + 1,
        rank_weekly: null, // Will be calculated below
        rank_monthly: null, // Will be calculated below
        rank_change: 0 // Will be calculated after sorting
      }));

      // Calculate weekly and monthly ranks
      const sortedByWeekly = [...entriesData].sort((a, b) => b.weekly_points - a.weekly_points);
      sortedByWeekly.forEach((entry, index) => {
        const original = entriesData.find(e => e.user_id === entry.user_id);
        if (original) original.rank_weekly = index + 1;
      });

      const sortedByMonthly = [...entriesData].sort((a, b) => b.monthly_points - a.monthly_points);
      sortedByMonthly.forEach((entry, index) => {
        const original = entriesData.find(e => e.user_id === entry.user_id);
        if (original) original.rank_monthly = index + 1;
      });

      // Calculate rank changes based on cached ranks
      entriesData.forEach(entry => {
        const cached = cachedRanksMap.get(entry.user_id);
        if (cached) {
          // Get the relevant old and new ranks based on period
          const oldRank = period === 'weekly' ? cached.rank_weekly :
                         period === 'monthly' ? cached.rank_monthly :
                         cached.rank_all_time;
          const newRank = period === 'weekly' ? entry.rank_weekly :
                         period === 'monthly' ? entry.rank_monthly :
                         entry.rank_all_time;
          
          if (oldRank && newRank) {
            // Positive change means moved UP (lower rank number is better)
            entry.rank_change = oldRank - newRank;
          }
        }
      });

      // Sort by selected period
      let sortedEntries = entriesData;
      if (period === 'weekly') {
        sortedEntries = [...entriesData].sort((a, b) => b.weekly_points - a.weekly_points);
      } else if (period === 'monthly') {
        sortedEntries = [...entriesData].sort((a, b) => b.monthly_points - a.monthly_points);
      }

      setEntries(sortedEntries);

      // Update cache for current user (if logged in)
      if (user) {
        const userEntry = entriesData.find(e => e.user_id === user.id);
        if (userEntry) {
          await supabase
            .from('leaderboard_cache')
            .upsert({
              user_id: user.id,
              username: userEntry.username,
              total_points: userEntry.total_points,
              weekly_points: userEntry.weekly_points,
              monthly_points: userEntry.monthly_points,
              total_distance_meters: userEntry.total_distance_meters,
              rank_all_time: userEntry.rank_all_time,
              rank_weekly: userEntry.rank_weekly,
              rank_monthly: userEntry.rank_monthly,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        }
      }

      // Calculate user's rank
      if (user) {
        const userEntry = sortedEntries.find(e => e.user_id === user.id);
        if (userEntry) {
          const rank = period === 'weekly' ? userEntry.rank_weekly : 
                       period === 'monthly' ? userEntry.rank_monthly : 
                       userEntry.rank_all_time;
          
          const points = period === 'weekly' ? userEntry.weekly_points :
                        period === 'monthly' ? userEntry.monthly_points :
                        userEntry.total_points;
          
          setUserRank({
            rank: rank || 1,
            totalPoints: points,
            percentile: Math.round((1 - ((rank || 1) / Math.max(sortedEntries.length, 1))) * 100)
          });
        } else {
          // User not in top 100, get their data
          const { data: userPoints } = await supabase
            .from('user_points')
            .select('total_points')
            .eq('user_id', user.id)
            .maybeSingle();

          if (userPoints) {
            const { count } = await supabase
              .from('user_points')
              .select('*', { count: 'exact', head: true })
              .gt('total_points', userPoints.total_points || 0);

            const { count: totalCount } = await supabase
              .from('user_points')
              .select('*', { count: 'exact', head: true });

            setUserRank({
              rank: (count || 0) + 1,
              totalPoints: userPoints.total_points || 0,
              percentile: Math.round((1 - (((count || 0) + 1) / Math.max(totalCount || 1, 1))) * 100)
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const totalParticipants = useMemo(() => entries.length, [entries]);

  return {
    entries,
    userRank,
    loading,
    error,
    period,
    setPeriod,
    refresh: fetchLeaderboard,
    totalParticipants
  };
};
