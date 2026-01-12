import React from 'react';
import { 
  Trophy, 
  Medal, 
  Crown, 
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useHaptics } from '@/hooks/useHaptics';
import { RankChangeIndicator } from '@/components/app/RankChangeIndicator';

interface LeaderboardSectionProps {
  compact?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <Crown className="w-4 h-4 text-amber-400" />;
    case 2: return <Medal className="w-4 h-4 text-slate-300" />;
    case 3: return <Medal className="w-4 h-4 text-amber-600" />;
    default: return null;
  }
};

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1: return 'border-amber-500/30 bg-amber-500/5';
    case 2: return 'border-slate-400/30 bg-slate-400/5';
    case 3: return 'border-amber-600/30 bg-amber-600/5';
    default: return 'border-border bg-card';
  }
};

const formatPoints = (points: number): string => {
  if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`;
  if (points >= 1000) return `${(points / 1000).toFixed(1)}K`;
  return points.toLocaleString();
};

const formatDistance = (meters: number): string => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters)}m`;
};

const anonymizeUsername = (username: string | null, userId: string): string => {
  if (username) {
    if (username.length <= 4) return username;
    return username.slice(0, 2) + '***' + username.slice(-2);
  }
  return `User_${userId.slice(0, 4)}`;
};

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({ 
  compact = false,
  maxItems,
  onViewAll 
}) => {
  const { lightTap } = useHaptics();
  const { 
    entries, 
    userRank, 
    loading, 
    period, 
    setPeriod,
    totalParticipants 
  } = useLeaderboard();

  const limit = maxItems ?? (compact ? 3 : entries.length);
  const displayEntries = entries.slice(0, limit);

  const periods = [
    { id: 'weekly' as const, label: 'Week' },
    { id: 'monthly' as const, label: 'Month' },
    { id: 'all_time' as const, label: 'All Time' }
  ];

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">Leaderboard</span>
        </div>
        <div className="h-24 rounded-xl bg-card border border-border animate-pulse" />
      </div>
    );
  }

  // Compact view - just user's rank
  if (compact) {
    return (
      <button 
        className="w-full rounded-xl bg-card border border-border p-4 text-left active:scale-[0.98] transition-transform"
        onClick={() => { lightTap(); onViewAll?.(); }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center">
              <span className="text-xs text-muted-foreground">Rank</span>
              <span className="text-lg font-bold text-primary">
                #{userRank?.rank || '-'}
              </span>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground tabular-nums">
                {formatPoints(userRank?.totalPoints || 0)} pts
              </div>
              <p className="text-sm text-muted-foreground">
                {totalParticipants} contributors
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </button>
    );
  }

  // Full view
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">Leaderboard</span>
          <span className="text-xs text-muted-foreground">
            ({totalParticipants})
          </span>
        </div>
        {onViewAll && (
          <button 
            onClick={() => { lightTap(); onViewAll(); }}
            className="flex items-center gap-1 text-xs text-primary"
          >
            View All
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => { lightTap(); setPeriod(p.id); }}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
              period === p.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* User's rank card */}
      {userRank && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="text-lg font-bold text-primary">#{userRank.rank}</span>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Your Rank</div>
                <div className="text-xs text-muted-foreground">
                  Top {Math.max(1, 100 - userRank.percentile)}%
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary tabular-nums">
                {formatPoints(userRank.totalPoints)}
              </div>
              <div className="text-xs text-muted-foreground">points</div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard entries */}
      <div className="space-y-2">
        {displayEntries.map((entry, index) => {
          const rank = period === 'weekly' ? entry.rank_weekly :
                      period === 'monthly' ? entry.rank_monthly :
                      entry.rank_all_time;
          const displayRank = rank || index + 1;
          const points = period === 'weekly' ? entry.weekly_points :
                        period === 'monthly' ? entry.monthly_points :
                        entry.total_points;
          
          return (
            <div
              key={entry.user_id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                getRankStyle(displayRank)
              )}
            >
              {/* Rank */}
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm',
                displayRank <= 3 ? 'bg-background/50' : 'bg-muted/30',
                displayRank === 1 && 'text-amber-400',
                displayRank === 2 && 'text-slate-300',
                displayRank === 3 && 'text-amber-600',
                displayRank > 3 && 'text-muted-foreground'
              )}>
                {getRankIcon(displayRank) || displayRank}
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate text-sm">
                    {anonymizeUsername(entry.username, entry.user_id)}
                  </span>
                  {entry.rank_change !== 0 && (
                    <RankChangeIndicator change={entry.rank_change} size="sm" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{formatDistance(entry.total_distance_meters)}</span>
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <div className={cn(
                  'font-bold text-sm tabular-nums',
                  displayRank === 1 && 'text-amber-400',
                  displayRank === 2 && 'text-slate-300',
                  displayRank === 3 && 'text-amber-600',
                  displayRank > 3 && 'text-foreground'
                )}>
                  {formatPoints(points)}
                </div>
                <div className="text-xs text-muted-foreground">pts</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more button */}
      {entries.length > limit && onViewAll && (
        <button
          onClick={() => { lightTap(); onViewAll(); }}
          className="w-full py-2.5 text-center text-sm font-medium text-primary rounded-xl bg-card border border-border active:scale-[0.98] transition-transform"
        >
          View full leaderboard
        </button>
      )}
    </div>
  );
};
