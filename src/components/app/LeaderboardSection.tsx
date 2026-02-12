import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Crown, 
  MapPin,
  ChevronRight,
  Flame,
  Target,
  Sparkles
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

const getRankStyle = (rank: number, isCurrentUser: boolean) => {
  if (isCurrentUser) {
    return 'border-primary/50 bg-primary/20 ring-1 ring-primary/30 backdrop-blur-sm';
  }
  switch (rank) {
    case 1: return 'border-amber-500/30 bg-amber-500/10 backdrop-blur-sm';
    case 2: return 'border-slate-400/30 bg-slate-400/10 backdrop-blur-sm';
    case 3: return 'border-amber-600/30 bg-amber-600/10 backdrop-blur-sm';
    default: return 'border-border bg-card/60 backdrop-blur-sm';
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

const anonymizeUsername = (username: string | null, userId: string, isCurrentUser: boolean): string => {
  if (isCurrentUser) return 'You';
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
    userEntry, 
    loading, 
    period, 
    setPeriod,
    totalParticipants 
  } = useLeaderboard();

  const limit = maxItems ?? (compact ? 3 : entries.length);
  const displayEntries = entries.slice(0, limit);

  const periods = [
    { id: 'daily' as const, label: 'Day', icon: Flame },
    { id: 'weekly' as const, label: 'Week', icon: Target },
    { id: 'monthly' as const, label: 'Month', icon: Trophy }
  ];

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">Leaderboard</span>
        </div>
        <div className="h-24 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  // Compact view - just user's rank with rank change
  if (compact) {
    return (
      <motion.button 
        className="w-full rounded-xl bg-card/80 backdrop-blur-xl border border-border p-4 text-left active:scale-[0.98] transition-transform"
        onClick={() => { lightTap(); onViewAll?.(); }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground">Rank</span>
                <span className="text-lg font-bold text-primary">
                  #{userRank?.rank || '-'}
                </span>
              </div>
              {userRank && userRank.rankChange !== 0 && (
                <div className="absolute -top-1 -right-1">
                  <RankChangeIndicator change={userRank.rankChange} size="sm" showText={false} />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground tabular-nums">
                  {formatPoints(userRank?.totalPoints || 0)} pts
                </span>
                {userRank && userRank.rankChange !== 0 && (
                  <RankChangeIndicator change={userRank.rankChange} size="sm" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {totalParticipants} contributors
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </motion.button>
    );
  }

  // Full view
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <span className="text-lg font-bold text-foreground">Leaderboard</span>
          <span className="text-sm text-muted-foreground">
            ({totalParticipants})
          </span>
        </div>
        {onViewAll && (
          <button 
            onClick={() => { lightTap(); onViewAll(); }}
            className="flex items-center gap-1 text-sm text-primary font-medium"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Period tabs - Enhanced styling */}
      <div className="flex gap-1 p-1 bg-muted/50 backdrop-blur-sm border border-border rounded-xl">
        {periods.map((p) => {
          const Icon = p.icon;
          const isActive = period === p.id;
          return (
            <button
              key={p.id}
              onClick={() => { lightTap(); setPeriod(p.id); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* User's rank card - Prominent highlight */}
      {userRank && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-card/80 backdrop-blur-xl border border-primary/40 p-4"
        >
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Rank badge */}
              <div className="relative">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex flex-col items-center justify-center border-2 backdrop-blur-sm",
                  userRank.rank <= 3 
                    ? "bg-amber-500/10 border-amber-500/50" 
                    : "bg-primary/10 border-primary/50"
                )}>
                  {userRank.rank <= 3 ? (
                    <Crown className={cn(
                      "w-6 h-6 mb-0.5",
                      userRank.rank === 1 && "text-amber-400",
                      userRank.rank === 2 && "text-slate-300",
                      userRank.rank === 3 && "text-amber-600"
                    )} />
                  ) : (
                    <span className="text-xs text-muted-foreground">Rank</span>
                  )}
                  <span className={cn(
                    "text-xl font-bold",
                    userRank.rank <= 3 ? "text-amber-400" : "text-primary"
                  )}>
                    #{userRank.rank}
                  </span>
                </div>
                {/* Rank change badge */}
                {userRank.rankChange !== 0 && (
                  <div className="absolute -top-2 -right-2">
                    <RankChangeIndicator change={userRank.rankChange} size="md" />
                  </div>
                )}
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground mb-1">Your Position</div>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {formatPoints(userRank.totalPoints)}
                  <span className="text-base font-normal text-muted-foreground ml-1">pts</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/30 text-primary font-medium">
                    Top {userRank.percentile}%
                  </span>
                </div>
              </div>
            </div>

            {/* Points to next rank */}
            {userRank.pointsToNextRank !== null && userRank.pointsToNextRank > 0 && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">Next rank</div>
                <div className="text-lg font-bold text-primary tabular-nums">
                  +{formatPoints(userRank.pointsToNextRank)}
                </div>
                <div className="text-xs text-muted-foreground">pts needed</div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Top 3 Podium for full view */}
      {entries.length >= 3 && !compact && (
        <div className="flex items-end justify-center gap-2 py-4">
          {/* 2nd place */}
          <PodiumCard entry={entries[1]} rank={2} period={period} />
          {/* 1st place */}
          <PodiumCard entry={entries[0]} rank={1} period={period} isFirst />
          {/* 3rd place */}
          <PodiumCard entry={entries[2]} rank={3} period={period} />
        </div>
      )}

      {/* Leaderboard entries (skip top 3 if showing podium) */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {displayEntries.slice(compact ? 0 : 3).map((entry, index) => {
            const rank = period === 'daily' ? entry.rank_daily :
                        period === 'weekly' ? entry.rank_weekly :
                        period === 'monthly' ? entry.rank_monthly :
                        entry.rank_all_time;
            const displayRank = rank || index + (compact ? 1 : 4);
            const points = period === 'daily' ? entry.daily_points :
                          period === 'weekly' ? entry.weekly_points :
                          period === 'monthly' ? entry.monthly_points :
                          entry.total_points;
            
            return (
              <motion.div
                key={entry.user_id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all',
                  getRankStyle(displayRank, entry.isCurrentUser)
                )}
              >
                {/* Rank */}
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0',
                  displayRank <= 3 ? 'bg-muted' : 'bg-muted/50',
                  displayRank === 1 && 'text-amber-400',
                  displayRank === 2 && 'text-slate-400',
                  displayRank === 3 && 'text-amber-600',
                  displayRank > 3 && 'text-muted-foreground'
                )}>
                  {getRankIcon(displayRank) || displayRank}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium truncate text-sm",
                      entry.isCurrentUser ? "text-primary" : "text-foreground"
                    )}>
                      {anonymizeUsername(entry.username, entry.user_id, entry.isCurrentUser)}
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
                <div className="text-right shrink-0">
                  <div className={cn(
                    'font-bold text-sm tabular-nums',
                    entry.isCurrentUser && 'text-primary',
                    !entry.isCurrentUser && displayRank === 1 && 'text-amber-400',
                    !entry.isCurrentUser && displayRank === 2 && 'text-slate-400',
                    !entry.isCurrentUser && displayRank === 3 && 'text-amber-600',
                    !entry.isCurrentUser && displayRank > 3 && 'text-foreground'
                  )}>
                    {formatPoints(points)}
                  </div>
                  <div className="text-xs text-muted-foreground">pts</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show more button */}
      {entries.length > limit && onViewAll && (
        <button
          onClick={() => { lightTap(); onViewAll(); }}
          className="w-full py-3 text-center text-sm font-medium text-primary rounded-xl bg-card/80 backdrop-blur-sm border border-border active:scale-[0.98] transition-transform"
        >
          View full leaderboard
        </button>
      )}
    </div>
  );
};

// Podium card for top 3
interface PodiumCardProps {
  entry: {
    user_id: string;
    username: string | null;
    daily_points: number;
    weekly_points: number;
    monthly_points: number;
    total_points: number;
    rank_change: number;
    isCurrentUser: boolean;
  };
  rank: 1 | 2 | 3;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  isFirst?: boolean;
}

function PodiumCard({ entry, rank, period, isFirst }: PodiumCardProps) {
  const points = period === 'daily' ? entry.daily_points :
                period === 'weekly' ? entry.weekly_points :
                period === 'monthly' ? entry.monthly_points :
                entry.total_points;

  const colors = {
    1: { bg: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/50', text: 'text-amber-400' },
    2: { bg: 'from-slate-400/20 to-slate-500/5', border: 'border-slate-400/50', text: 'text-slate-400' },
    3: { bg: 'from-amber-600/20 to-amber-700/5', border: 'border-amber-600/50', text: 'text-amber-600' }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className={cn(
        "flex flex-col items-center p-3 rounded-xl border bg-gradient-to-b backdrop-blur-sm",
        colors[rank].bg,
        colors[rank].border,
        isFirst ? "w-28 -mt-4" : "w-24",
        entry.isCurrentUser && "ring-2 ring-primary"
      )}
    >
      {/* Crown/Medal */}
      <div className="mb-1">
        {rank === 1 ? (
          <Crown className={cn("w-6 h-6", colors[rank].text)} />
        ) : (
          <Medal className={cn("w-5 h-5", colors[rank].text)} />
        )}
      </div>
      
      {/* Rank */}
      <div className={cn("text-2xl font-bold mb-1", colors[rank].text)}>
        #{rank}
      </div>
      
      {/* Username */}
      <div className={cn(
        "text-xs font-medium truncate w-full text-center mb-1",
        entry.isCurrentUser ? "text-primary" : "text-foreground"
      )}>
        {entry.isCurrentUser ? 'You' : (entry.username?.slice(0, 6) || 'User')}
      </div>
      
      {/* Points */}
      <div className={cn("text-sm font-bold tabular-nums", colors[rank].text)}>
        {formatPoints(points)}
      </div>
      
      {/* Rank change */}
      {entry.rank_change !== 0 && (
        <div className="mt-1">
          <RankChangeIndicator change={entry.rank_change} size="sm" showText={false} />
        </div>
      )}
    </motion.div>
  );
}

export default LeaderboardSection;
