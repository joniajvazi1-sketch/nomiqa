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
}

// Genesis Referral Challenge: 7-day rolling window
const CHALLENGE_DURATION_DAYS = 7;

export const useReferralLeaderboard = (): UseReferralLeaderboardReturn => {
  const [entries, setEntries] = useState<ReferralLeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<ReferralLeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

      // First get all affiliates with usernames
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('affiliates')
        .select('id, user_id, username, total_registrations')
        .eq('status', 'active')
        .order('total_registrations', { ascending: false })
        .limit(100);

      if (affiliatesError) throw affiliatesError;

      if (!affiliatesData || affiliatesData.length === 0) {
        setEntries([]);
        setUserRank(null);
        return;
      }

      // Get weekly registration counts for each affiliate
      const affiliateIds = affiliatesData.map(a => a.id);
      
      const { data: weeklyReferrals, error: referralsError } = await supabase
        .from('affiliate_referrals')
        .select('affiliate_id')
        .in('affiliate_id', affiliateIds)
        .gte('registered_at', weekAgo.toISOString())
        .not('registered_user_id', 'is', null);

      if (referralsError) throw referralsError;

      // Count referrals per affiliate
      const weeklyCountMap = new Map<string, number>();
      weeklyReferrals?.forEach(ref => {
        const current = weeklyCountMap.get(ref.affiliate_id) || 0;
        weeklyCountMap.set(ref.affiliate_id, current + 1);
      });

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
  };
};
