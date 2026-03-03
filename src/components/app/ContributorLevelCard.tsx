import React, { useState, useEffect } from 'react';
import { ChevronRight, Info, Star, Users, Flame, MapPin, Zap, Calendar, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { 
  CONTRIBUTOR_LEVELS, 
  getCurrentLevel, 
  getNextLevel, 
  getProgressToNextLevel,
  type ContributorLevel 
} from '@/utils/contributorLevels';

interface ContributorLevelCardProps {
  onTap?: () => void;
  compact?: boolean;
}

export const ContributorLevelCard: React.FC<ContributorLevelCardProps> = ({ 
  onTap,
  compact = false 
}) => {
  const [currentLevel, setCurrentLevel] = useState<ContributorLevel>(CONTRIBUTOR_LEVELS[0]);
  const [teamMembers, setTeamMembers] = useState(0);
  const [miningBoost, setMiningBoost] = useState(0);
  const [totalKm, setTotalKm] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [todayPoints, setTodayPoints] = useState(0);
  const [lastContributionDate, setLastContributionDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLevelData();
  }, []);

  const loadLevelData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [affiliateResult, pointsResult, dailyResult] = await Promise.all([
        supabase
          .from('affiliates')
          .select('total_registrations, miner_boost_percentage')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('user_points')
          .select('total_distance_meters, contribution_streak_days, last_contribution_date')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('user_daily_limits')
          .select('points_earned')
          .eq('user_id', user.id)
          .eq('limit_date', new Date().toISOString().split('T')[0])
          .maybeSingle()
      ]);

      const members = affiliateResult.data?.total_registrations || 0;
      setTeamMembers(members);
      setMiningBoost(affiliateResult.data?.miner_boost_percentage || 0);
      
      if (pointsResult.data) {
        setTotalKm((pointsResult.data.total_distance_meters || 0) / 1000);
        setStreakDays(pointsResult.data.contribution_streak_days || 0);
        setLastContributionDate(pointsResult.data.last_contribution_date);
      }

      setTodayPoints(dailyResult.data?.points_earned || 0);
      
      const level = getCurrentLevel(members);
      setCurrentLevel(level);
    } catch (error) {
      console.error('Error loading level data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border animate-pulse">
        <CardContent className={cn("p-4", compact && "p-3")}>
          <div className="h-16" />
        </CardContent>
      </Card>
    );
  }

  const LevelIcon = currentLevel.icon;
  const nextLevel = getNextLevel(currentLevel.level);
  const progress = getProgressToNextLevel(teamMembers, currentLevel);

  // Determine streak status
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const isStreakActiveToday = lastContributionDate === today;
  const isStreakAtRisk = !isStreakActiveToday && lastContributionDate === yesterday && streakDays > 0;
  const isStreakBroken = !isStreakActiveToday && lastContributionDate !== yesterday && streakDays === 0;

  if (compact) {
    return (
      <button
        onClick={onTap}
        className="w-full rounded-xl bg-card border border-border p-3 text-left active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", currentLevel.bgColor)}>
              <LevelIcon className={cn("w-4 h-4", currentLevel.color)} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{currentLevel.name}</p>
              <p className="text-xs text-muted-foreground">Tier {currentLevel.level}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>
    );
  }

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Header: Level + Today's Earnings */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              currentLevel.bgColor
            )}>
              <LevelIcon className={cn("w-6 h-6", currentLevel.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">{currentLevel.name}</h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Tier {currentLevel.level}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">{currentLevel.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{todayPoints}</p>
            <p className="text-[10px] text-muted-foreground">pts today</p>
          </div>
        </div>

        {/* Streak Banner */}
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-xl",
          isStreakActiveToday && "bg-emerald-500/10 border border-emerald-500/20",
          isStreakAtRisk && "bg-amber-500/10 border border-amber-500/20",
          (!isStreakActiveToday && !isStreakAtRisk) && "bg-muted/50 border border-border"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isStreakActiveToday && "bg-emerald-500/20",
            isStreakAtRisk && "bg-amber-500/20",
            (!isStreakActiveToday && !isStreakAtRisk) && "bg-muted"
          )}>
            <Flame className={cn(
              "w-5 h-5",
              isStreakActiveToday && "text-emerald-500",
              isStreakAtRisk && "text-amber-500",
              (!isStreakActiveToday && !isStreakAtRisk) && "text-muted-foreground"
            )} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                {streakDays} day{streakDays !== 1 ? 's' : ''} streak
              </p>
              {isStreakActiveToday && (
                <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Active ✓</span>
              )}
              {isStreakAtRisk && (
                <span className="text-[10px] font-medium text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">At risk!</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isStreakActiveToday 
                ? `Keep it up! Mining today extends your streak`
                : isStreakAtRisk 
                  ? `Start mining today to keep your ${streakDays}-day streak`
                  : 'Start mining to begin a new streak'
              }
            </p>
          </div>
        </div>

        {/* Stats Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-muted/40 p-3 flex items-center gap-3">
            <Users className="w-4.5 h-4.5 text-primary shrink-0" />
            <div>
              <p className="text-base font-bold text-foreground">{teamMembers}</p>
              <p className="text-[10px] text-muted-foreground">Team Members</p>
            </div>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 flex items-center gap-3">
            <Zap className="w-4.5 h-4.5 text-amber-500 shrink-0" />
            <div>
              <p className="text-base font-bold text-foreground">{miningBoost.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground">Mining Boost</p>
            </div>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 flex items-center gap-3">
            <MapPin className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-base font-bold text-foreground">{totalKm.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">km Mapped</p>
            </div>
          </div>
          <div className="rounded-xl bg-muted/40 p-3 flex items-center gap-3">
            <Calendar className="w-4.5 h-4.5 text-sky-500 shrink-0" />
            <div>
              <p className="text-base font-bold text-foreground">{streakDays}</p>
              <p className="text-[10px] text-muted-foreground">Streak Days</p>
            </div>
          </div>
        </div>

        {/* Progress to Next Level */}
        {nextLevel ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress to {nextLevel.name}</span>
              <span className="font-semibold text-foreground">{Math.round(progress.progress)}%</span>
            </div>
            <Progress value={progress.progress} className="h-2" />
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" />
              {progress.membersNeeded} more member{progress.membersNeeded !== 1 ? 's' : ''} → +{nextLevel.bonus} pts bonus
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-primary/10 p-3 text-center">
            <Star className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-sm font-semibold text-primary">Max Tier Reached!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContributorLevelCard;
