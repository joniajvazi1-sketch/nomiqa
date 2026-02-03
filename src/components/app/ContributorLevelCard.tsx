import React, { useState, useEffect } from 'react';
import { ChevronRight, Info, Star, Users, Flame, MapPin, Zap } from 'lucide-react';
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
  formatLevelRequirements,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLevelData();
  }, []);

  const loadLevelData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get affiliate data for team members count and mining boost
      const { data: affiliateData } = await supabase
        .from('affiliates')
        .select('total_registrations, miner_boost_percentage')
        .eq('user_id', user.id)
        .maybeSingle();

      const members = affiliateData?.total_registrations || 0;
      setTeamMembers(members);
      setMiningBoost(affiliateData?.miner_boost_percentage || 0);
      
      // Get distance and streak from user_points
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('total_distance_meters, contribution_streak_days')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (pointsData) {
        setTotalKm((pointsData.total_distance_meters || 0) / 1000);
        setStreakDays(pointsData.contribution_streak_days || 0);
      }
      
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
      <CardContent className="p-4">
        {/* Current Level Display - Website Style */}
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center",
            currentLevel.bgColor
          )}>
            <LevelIcon className={cn("w-7 h-7", currentLevel.color)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-lg font-bold text-foreground">{currentLevel.name}</h3>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Tier {currentLevel.level}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{currentLevel.description}</p>
          </div>
        </div>

        {/* Stats Grid - 4 columns */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="rounded-xl bg-muted/50 p-2.5 text-center">
            <Users className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-base font-bold text-foreground">{teamMembers}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Team</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2.5 text-center">
            <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-base font-bold text-foreground">{miningBoost.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Boost</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2.5 text-center">
            <MapPin className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
            <p className="text-base font-bold text-foreground">{totalKm.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">km</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2.5 text-center">
            <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
            <p className="text-base font-bold text-foreground">{streakDays}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Streak</p>
          </div>
        </div>

        {/* Progress to Next Level */}
        {nextLevel ? (
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress to {nextLevel.name}</span>
              <span className="font-semibold text-foreground">{Math.round(progress.progress)}%</span>
            </div>
            <Progress value={progress.progress} className="h-2" />
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" />
              {progress.membersNeeded} more members → +{nextLevel.bonus} pts
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-primary/10 p-3 text-center mb-4">
            <Star className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-sm font-semibold text-primary">Max Tier!</p>
          </div>
        )}

        {/* Tier Roadmap - Compact */}
        <div className="pt-3 border-t border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tier Roadmap</p>
          <div className="flex flex-wrap gap-1.5">
            {CONTRIBUTOR_LEVELS.slice(1).map((level) => {
              const LIcon = level.icon;
              const isUnlocked = currentLevel.level >= level.level;
              
              return (
                <div 
                  key={level.level}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium transition-colors",
                    isUnlocked 
                      ? "bg-primary/15 text-primary" 
                      : "bg-muted/50 text-muted-foreground"
                  )}
                >
                  <LIcon className="w-3 h-3" />
                  <span>{level.name}</span>
                  {!isUnlocked && <span className="opacity-60">({level.requirements.teamMembers})</span>}
                  {isUnlocked && <span>✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContributorLevelCard;
