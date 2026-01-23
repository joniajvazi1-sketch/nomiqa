import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReferralLeaderboardEntry {
  rank: number;
  username: string;
  referrals_count: number;
  isCurrentUser: boolean;
}

interface UseReferralLeaderboardReturn {
  entries: ReferralLeaderboardEntry[];
  userRank: ReferralLeaderboardEntry | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  challengeEndsAt: Date;
  daysRemaining: number;
  dailyRegistrations: number;
  totalWeeklyRegistrations: number;
}

// Genesis Referral Challenge: 7-day rolling window
const CHALLENGE_DURATION_DAYS = 7;

export const useReferralLeaderboard = (): UseReferralLeaderboardReturn => {
  const [entries, setEntries] = useState<ReferralLeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<ReferralLeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [dailyRegistrations, setDailyRegistrations] = useState(0);
  const [totalWeeklyRegistrations, setTotalWeeklyRegistrations] = useState(0);

  // Calculate challenge end date (7 days from now, resets weekly)
  const getNextSundayMidnight = () => {
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(23, 59, 59, 999);
    return nextSunday;
  };

  const challengeEndsAt = getNextSundayMidnight();
  const daysRemaining = Math.ceil((challengeEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Get all affiliates with their registration counts
      // Only count registrations from the last 7 days for the challenge
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - CHALLENGE_DURATION_DAYS);

      // First get all affiliates with usernames (this is public data)
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('affiliates')
        .select('id, user_id, username, total_registrations')
        .eq('status', 'active')
        .order('total_registrations', { ascending: false })
        .limit(100);

      if (affiliatesError) {
        console.error('Affiliates query error:', affiliatesError);
        // If user not authenticated, show empty leaderboard gracefully
        if (affiliatesError.code === 'PGRST301' || affiliatesError.message?.includes('JWT')) {
          setEntries([]);
          setUserRank(null);
          setTotalWeeklyRegistrations(0);
          setDailyRegistrations(0);
          return;
        }
        throw affiliatesError;
      }

      if (!affiliatesData || affiliatesData.length === 0) {
        setEntries([]);
        setUserRank(null);
        setTotalWeeklyRegistrations(0);
        setDailyRegistrations(0);
        return;
      }

      // Get weekly registration counts for each affiliate
      const affiliateIds = affiliatesData.map(a => a.id);
      
      // Get weekly registration counts - use total_registrations as fallback for public view
      // affiliate_referrals has RLS so we'll use the cached total_registrations from affiliates table
      // For the weekly view, we can only get detailed data if user is authenticated
      let weeklyCountMap = new Map<string, number>();
      let weeklyTotal = 0;
      let todayTotal = 0;

      // Try to get referral data if user is logged in (RLS requires auth)
      if (user) {
        try {
          const { data: weeklyReferrals } = await supabase
            .from('affiliate_referrals')
            .select('affiliate_id')
            .in('affiliate_id', affiliateIds)
            .gte('registered_at', weekAgo.toISOString())
            .not('registered_user_id', 'is', null);

          weeklyReferrals?.forEach(ref => {
            const current = weeklyCountMap.get(ref.affiliate_id) || 0;
            weeklyCountMap.set(ref.affiliate_id, current + 1);
          });
          weeklyTotal = weeklyReferrals?.length || 0;

          // Fetch today's registrations
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const { data: todayReferrals } = await supabase
            .from('affiliate_referrals')
            .select('id')
            .gte('registered_at', today.toISOString())
            .not('registered_user_id', 'is', null);
          
          todayTotal = todayReferrals?.length || 0;
        } catch (e) {
          // If referral query fails, fall back to total_registrations
          console.log('Using cached totals for leaderboard');
        }
      }

      // If no weekly data (not logged in or query failed), use total_registrations
      if (weeklyCountMap.size === 0) {
        affiliatesData.forEach(a => {
          if (a.total_registrations > 0) {
            weeklyCountMap.set(a.id, a.total_registrations);
            weeklyTotal += a.total_registrations;
          }
        });
      }
      
      setTotalWeeklyRegistrations(weeklyTotal);
      setDailyRegistrations(todayTotal);

      // Build leaderboard entries with weekly counts
      const leaderboardEntries = affiliatesData
        .map(affiliate => ({
          user_id: affiliate.user_id,
          username: affiliate.username || 'Anonymous',
          referrals_count: weeklyCountMap.get(affiliate.id) || 0,
        }))
        .filter(entry => entry.referrals_count > 0) // Only show users with referrals this week
        .sort((a, b) => b.referrals_count - a.referrals_count)
        .slice(0, 50) // Top 50
        .map((entry, index) => ({
          rank: index + 1,
          username: entry.username,
          referrals_count: entry.referrals_count,
          isCurrentUser: entry.user_id === user?.id,
        }));

      setEntries(leaderboardEntries);

      // Find current user's rank
      const currentUserEntry = leaderboardEntries.find(e => e.isCurrentUser);
      setUserRank(currentUserEntry || null);

    } catch (err: any) {
      console.error('Error fetching referral leaderboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    entries,
    userRank,
    loading,
    error,
    refresh: fetchLeaderboard,
    challengeEndsAt,
    daysRemaining,
    dailyRegistrations,
    totalWeeklyRegistrations,
  };
};
