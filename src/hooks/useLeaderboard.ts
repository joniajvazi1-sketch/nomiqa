import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  username: string | null;
  total_points: number;
  weekly_points: number;
  monthly_points: number;
  daily_points: number;
  total_distance_meters: number;
  rank_all_time: number | null;
  rank_weekly: number | null;
  rank_monthly: number | null;
  rank_daily: number | null;
  rank_change: number; // positive = moved up, negative = moved down
  isCurrentUser: boolean;
}

interface UserRank {
  rank: number;
  totalPoints: number;
  percentile: number;
  rankChange: number;
  pointsToNextRank: number | null;
}

type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';

interface UseLeaderboardReturn {
  entries: LeaderboardEntry[];
  userRank: UserRank | null;
  userEntry: LeaderboardEntry | null;
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
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
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

      // Use SECURITY DEFINER function that calculates daily/weekly/monthly points server-side
      // This bypasses RLS on contribution_sessions and user_daily_limits
      const { data: pointsData, error: pointsError } = await supabase
        .rpc('get_leaderboard_with_periods', { p_limit: 100 });

      if (pointsError) throw pointsError;

      const userIds = (pointsData || []).map((p: any) => p.user_id);

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

      // Build entries with server-calculated period points
      const entriesData: LeaderboardEntry[] = (pointsData || []).map((entry: any, index: number) => ({
        user_id: entry.user_id,
        username: entry.username || null,
        total_points: entry.total_points || 0,
        daily_points: Number(entry.daily_points) || 0,
        weekly_points: Number(entry.weekly_points) || 0,
        monthly_points: Number(entry.monthly_points) || 0,
        total_distance_meters: entry.total_distance_meters || 0,
        rank_all_time: index + 1,
        rank_daily: null,
        rank_weekly: null,
        rank_monthly: null,
        rank_change: 0,
        isCurrentUser: entry.user_id === user?.id
      }));

      // Calculate daily ranks
      const sortedByDaily = [...entriesData].sort((a, b) => b.daily_points - a.daily_points);
      sortedByDaily.forEach((entry, index) => {
        const original = entriesData.find(e => e.user_id === entry.user_id);
        if (original) original.rank_daily = index + 1;
      });

      // Calculate weekly ranks
      const sortedByWeekly = [...entriesData].sort((a, b) => b.weekly_points - a.weekly_points);
      sortedByWeekly.forEach((entry, index) => {
        const original = entriesData.find(e => e.user_id === entry.user_id);
        if (original) original.rank_weekly = index + 1;
      });

      // Calculate monthly ranks
      const sortedByMonthly = [...entriesData].sort((a, b) => b.monthly_points - a.monthly_points);
      sortedByMonthly.forEach((entry, index) => {
        const original = entriesData.find(e => e.user_id === entry.user_id);
        if (original) original.rank_monthly = index + 1;
      });

      // Calculate rank changes based on cached ranks
      entriesData.forEach(entry => {
        const cached = cachedRanksMap.get(entry.user_id);
        if (cached) {
          const oldRank = period === 'daily' ? cached.rank_weekly : // Use weekly as baseline for daily
                         period === 'weekly' ? cached.rank_weekly :
                         period === 'monthly' ? cached.rank_monthly :
                         cached.rank_all_time;
          const newRank = period === 'daily' ? entry.rank_daily :
                         period === 'weekly' ? entry.rank_weekly :
                         period === 'monthly' ? entry.rank_monthly :
                         entry.rank_all_time;
          
          if (oldRank && newRank) {
            entry.rank_change = oldRank - newRank;
          }
        }
      });

      // Sort by selected period
      let sortedEntries = entriesData;
      if (period === 'daily') {
        sortedEntries = [...entriesData].sort((a, b) => b.daily_points - a.daily_points);
      } else if (period === 'weekly') {
        sortedEntries = [...entriesData].sort((a, b) => b.weekly_points - a.weekly_points);
      } else if (period === 'monthly') {
        sortedEntries = [...entriesData].sort((a, b) => b.monthly_points - a.monthly_points);
      }

      setEntries(sortedEntries);

      // Find current user entry
      const currentUserEntry = sortedEntries.find(e => e.user_id === user?.id) || null;
      setUserEntry(currentUserEntry);

      // Update cache for current user (if logged in)
      if (user) {
        const userEntryData = entriesData.find(e => e.user_id === user.id);
        if (userEntryData) {
          await supabase
            .from('leaderboard_cache')
            .upsert({
              user_id: user.id,
              username: userEntryData.username,
              total_points: userEntryData.total_points,
              weekly_points: userEntryData.weekly_points,
              monthly_points: userEntryData.monthly_points,
              total_distance_meters: userEntryData.total_distance_meters,
              rank_all_time: userEntryData.rank_all_time,
              rank_weekly: userEntryData.rank_weekly,
              rank_monthly: userEntryData.rank_monthly,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
        }
      }

      // Calculate user's rank and points to next
      if (user) {
        const userEntryData = sortedEntries.find(e => e.user_id === user.id);
        if (userEntryData) {
          const rank = period === 'daily' ? userEntryData.rank_daily :
                       period === 'weekly' ? userEntryData.rank_weekly : 
                       period === 'monthly' ? userEntryData.rank_monthly : 
                       userEntryData.rank_all_time;
          
          const points = period === 'daily' ? userEntryData.daily_points :
                        period === 'weekly' ? userEntryData.weekly_points :
                        period === 'monthly' ? userEntryData.monthly_points :
                        userEntryData.total_points;
          
          // Calculate points needed for next rank
          let pointsToNextRank: number | null = null;
          const currentRank = rank || 1;
          if (currentRank > 1) {
            const entryAbove = sortedEntries.find(e => {
              const entryRank = period === 'daily' ? e.rank_daily :
                               period === 'weekly' ? e.rank_weekly :
                               period === 'monthly' ? e.rank_monthly :
                               e.rank_all_time;
              return entryRank === currentRank - 1;
            });
            if (entryAbove) {
              const abovePoints = period === 'daily' ? entryAbove.daily_points :
                                 period === 'weekly' ? entryAbove.weekly_points :
                                 period === 'monthly' ? entryAbove.monthly_points :
                                 entryAbove.total_points;
              pointsToNextRank = Math.ceil(abovePoints - points) + 1;
            }
          }
          
          setUserRank({
            rank: rank || 1,
            totalPoints: points,
            percentile: Math.max(1, Math.ceil(((rank || 1) / Math.max(sortedEntries.length, 1)) * 100)),
            rankChange: userEntryData.rank_change,
            pointsToNextRank
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
              percentile: Math.max(1, Math.ceil((((count || 0) + 1) / Math.max(totalCount || 1, 1)) * 100)),
              rankChange: 0,
              pointsToNextRank: null
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
    userEntry,
    loading,
    error,
    period,
    setPeriod,
    refresh: fetchLeaderboard,
    totalParticipants
  };
};
