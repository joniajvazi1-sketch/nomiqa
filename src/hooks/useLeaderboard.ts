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

      // Get leaderboard from cache or user_points
      // First, try to get from leaderboard_cache
      let { data: cacheData, error: cacheError } = await supabase
        .from('leaderboard_cache')
        .select('*')
        .order(period === 'weekly' ? 'weekly_points' : period === 'monthly' ? 'monthly_points' : 'total_points', { ascending: false })
        .limit(100);

      // If cache is empty or has errors, build from user_points
      if (cacheError || !cacheData || cacheData.length === 0) {
        // Get user points with profile usernames
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

        // Build entries with ranks
        cacheData = (pointsData || []).map((entry, index) => ({
          user_id: entry.user_id,
          username: profileMap.get(entry.user_id) || null,
          total_points: entry.total_points || 0,
          weekly_points: entry.total_points || 0, // Approximation
          monthly_points: entry.total_points || 0, // Approximation
          total_distance_meters: entry.total_distance_meters || 0,
          rank_all_time: index + 1,
          rank_weekly: index + 1,
          rank_monthly: index + 1,
          updated_at: new Date().toISOString(),
          id: entry.user_id
        }));

        // Update leaderboard cache for future use
        if (cacheData.length > 0) {
          for (const entry of cacheData) {
            await supabase
              .from('leaderboard_cache')
              .upsert({
                user_id: entry.user_id,
                username: entry.username,
                total_points: entry.total_points,
                weekly_points: entry.weekly_points,
                monthly_points: entry.monthly_points,
                total_distance_meters: entry.total_distance_meters,
                rank_all_time: entry.rank_all_time,
                rank_weekly: entry.rank_weekly,
                rank_monthly: entry.rank_monthly,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id'
              });
          }
        }
      }

      setEntries(cacheData || []);

      // Calculate user's rank
      if (user && cacheData) {
        const userEntry = cacheData.find(e => e.user_id === user.id);
        if (userEntry) {
          const rank = period === 'weekly' ? userEntry.rank_weekly : 
                       period === 'monthly' ? userEntry.rank_monthly : 
                       userEntry.rank_all_time;
          
          setUserRank({
            rank: rank || cacheData.findIndex(e => e.user_id === user.id) + 1,
            totalPoints: period === 'weekly' ? userEntry.weekly_points :
                        period === 'monthly' ? userEntry.monthly_points :
                        userEntry.total_points,
            percentile: Math.round((1 - ((rank || 1) / Math.max(cacheData.length, 1))) * 100)
          });
        } else {
          // User not in top 100, calculate their position
          const { data: userPoints } = await supabase
            .from('user_points')
            .select('total_points')
            .eq('user_id', user.id)
            .single();

          if (userPoints) {
            // Count users with more points
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
