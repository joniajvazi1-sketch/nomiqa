import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Users, 
  TrendingUp,
  MapPin,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useHaptics } from '@/hooks/useHaptics';

interface LeaderboardSectionProps {
  compact?: boolean;
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

const getRankColors = (rank: number) => {
  switch (rank) {
    case 1: return 'from-amber-500/20 to-amber-500/5 border-amber-500/40';
    case 2: return 'from-slate-400/20 to-slate-400/5 border-slate-400/40';
    case 3: return 'from-amber-600/20 to-amber-600/5 border-amber-600/40';
    default: return 'from-white/5 to-transparent border-white/10';
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

  const displayEntries = compact ? entries.slice(0, 5) : entries;

  const periods = [
    { id: 'weekly' as const, label: 'This Week' },
    { id: 'monthly' as const, label: 'This Month' },
    { id: 'all_time' as const, label: 'All Time' }
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">Leaderboard</span>
          </div>
        </div>
        <div className="h-24 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] animate-pulse" />
      </div>
    );
  }

  // Compact view - simplified rank card with View All button
  if (compact) {
    return (
      <div 
        className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] overflow-hidden cursor-pointer active:scale-[0.98] transition-all group"
        onClick={() => { lightTap(); onViewAll?.(); }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Leaderboard</span>
            <span className="text-xs text-muted-foreground">
              ({totalParticipants} contributors)
            </span>
          </div>
        </div>

        {/* User Rank Display */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-4">
            {/* Rank badge */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-neon-cyan/10 border border-primary/30 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground">Rank</span>
                <span 
                  className="text-2xl font-bold text-primary"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  #{userRank?.rank || '-'}
                </span>
              </div>
              {userRank && userRank.rank <= 3 && (
                <div className="absolute -top-1 -right-1">
                  {userRank.rank === 1 && <Crown className="w-5 h-5 text-amber-400" />}
                  {userRank.rank === 2 && <Medal className="w-5 h-5 text-slate-300" />}
                  {userRank.rank === 3 && <Medal className="w-5 h-5 text-amber-600" />}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span 
                  className="text-xl font-bold text-foreground"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  {formatPoints(userRank?.totalPoints || 0)}
                </span>
                <span className="text-sm text-muted-foreground">points</span>
              </div>
              {userRank && (
                <div className="text-xs text-muted-foreground">
                  Keep contributing to climb the ranks!
                </div>
              )}
              {!userRank && (
                <div className="text-xs text-muted-foreground">
                  Start contributing to join the leaderboard
                </div>
              )}
            </div>

            {/* View All arrow */}
            <div className="flex items-center gap-1 text-sm text-primary font-medium">
              <span>View</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full leaderboard view
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">Leaderboard</span>
          <span className="text-xs text-muted-foreground">
            ({totalParticipants} contributors)
          </span>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => { lightTap(); setPeriod(p.id); }}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
              period === p.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                : 'bg-white/[0.05] text-muted-foreground border border-white/10 hover:bg-white/[0.08]'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* User's rank card */}
      {userRank && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-neon-cyan/10 to-primary/20" />
          <div className="relative p-4 border border-primary/30 rounded-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Your Rank</div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-2xl font-bold text-foreground"
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                    >
                      #{userRank.rank}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Top {Math.max(1, 100 - userRank.percentile)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {formatPoints(userRank.totalPoints)}
                </div>
                <div className="text-xs text-muted-foreground">points</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard entries */}
      <div className="space-y-2">
        <AnimatePresence>
          {displayEntries.map((entry, index) => {
            const rank = period === 'weekly' ? entry.rank_weekly :
                        period === 'monthly' ? entry.rank_monthly :
                        entry.rank_all_time;
            const displayRank = rank || index + 1;
            const points = period === 'weekly' ? entry.weekly_points :
                          period === 'monthly' ? entry.monthly_points :
                          entry.total_points;
            
            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl',
                  'bg-gradient-to-r border backdrop-blur-xl transition-all',
                  getRankColors(displayRank)
                )}
              >
                {/* Rank */}
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center font-bold',
                  displayRank <= 3 ? 'bg-white/10' : 'bg-white/5',
                  displayRank === 1 && 'text-amber-400',
                  displayRank === 2 && 'text-slate-300',
                  displayRank === 3 && 'text-amber-600',
                  displayRank > 3 && 'text-muted-foreground'
                )}>
                  {getRankIcon(displayRank) || (
                    <span style={{ fontFamily: 'ui-monospace' }}>{displayRank}</span>
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {anonymizeUsername(entry.username, entry.user_id)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{formatDistance(entry.total_distance_meters)}</span>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div 
                    className={cn(
                      'font-bold',
                      displayRank === 1 && 'text-amber-400',
                      displayRank === 2 && 'text-slate-300',
                      displayRank === 3 && 'text-amber-600',
                      displayRank > 3 && 'text-foreground'
                    )}
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                  >
                    {formatPoints(points)}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase">pts</div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
