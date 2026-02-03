import React, { useState, useEffect } from 'react';
import { ChevronRight, Info, Star, Users } from 'lucide-react';
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
  const [activeMembers, setActiveMembers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLevelData();
  }, []);

  const loadLevelData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get affiliate data for team members count
      const { data: affiliateData } = await supabase
        .from('affiliates')
        .select('total_registrations')
        .eq('user_id', user.id)
        .maybeSingle();

      const members = affiliateData?.total_registrations || 0;
      setTeamMembers(members);
      
      // Estimate active members (those who contributed recently)
      // For now, estimate as ~30% of total
      setActiveMembers(Math.floor(members * 0.3));
      
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
        {/* Current Level Display */}
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            currentLevel.bgColor
          )}>
            <LevelIcon className={cn("w-6 h-6", currentLevel.color)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">{currentLevel.name}</h3>
              <Badge variant="outline" className={cn("text-xs", currentLevel.color, "border-current/30")}>
                Tier {currentLevel.level}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{currentLevel.description}</p>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <p className="text-lg font-bold text-foreground">{teamMembers}</p>
            </div>
            <p className="text-xs text-muted-foreground">Team Members</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-lg font-bold text-foreground">{activeMembers}</p>
            </div>
            <p className="text-xs text-muted-foreground">Active Contributors</p>
          </div>
        </div>

        {/* Progress to Next Level */}
        {nextLevel ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress to {nextLevel.name}</span>
              <span className="font-medium text-foreground">{Math.round(progress.progress)}%</span>
            </div>
            <Progress value={progress.progress} className="h-2" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="w-3 h-3" />
              <span>
                {progress.membersNeeded} more team members to unlock +{nextLevel.bonus} bonus points
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-primary/10 p-3 text-center">
            <Star className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-sm font-medium text-primary">Max Tier Achieved!</p>
            <p className="text-xs text-muted-foreground">You're an elite pioneer</p>
          </div>
        )}

        {/* Tier Roadmap */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Tier Roadmap</p>
          <div className="space-y-1.5">
            {CONTRIBUTOR_LEVELS.slice(1).map((level) => {
              const LIcon = level.icon;
              const isUnlocked = currentLevel.level >= level.level;
              const isCurrent = currentLevel.level === level.level;
              
              return (
                <div 
                  key={level.level}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg transition-colors",
                    isCurrent && "bg-primary/10",
                    !isUnlocked && "opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    isUnlocked ? level.bgColor : "bg-muted"
                  )}>
                    <LIcon className={cn("w-3 h-3", isUnlocked ? level.color : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-xs font-medium",
                      isUnlocked ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {level.name}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px]",
                      isUnlocked ? "text-green-500 border-green-500/30" : "text-muted-foreground"
                    )}
                  >
                    {isUnlocked ? '✓ Unlocked' : formatLevelRequirements(level)}
                  </Badge>
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
