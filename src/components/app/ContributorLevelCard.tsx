import React, { useState, useEffect } from 'react';
import { ChevronRight, Info, Star } from 'lucide-react';
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
  const [activeDays, setActiveDays] = useState(0);
  const [areasMapped, setAreasMapped] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLevelData();
  }, []);

  const loadLevelData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has level data
      const { data: levelData } = await supabase
        .from('user_contribution_levels')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (levelData) {
        setActiveDays(levelData.active_days || 0);
        setAreasMapped(levelData.areas_mapped || 0);
        const level = getCurrentLevel(levelData.active_days || 0, levelData.areas_mapped || 0);
        setCurrentLevel(level);
      } else {
        // Calculate from contribution data
        const { data: sessions } = await supabase
          .from('contribution_sessions')
          .select('started_at')
          .eq('user_id', user.id);

        if (sessions) {
          // Count unique days
          const uniqueDays = new Set(
            sessions.map(s => new Date(s.started_at).toISOString().split('T')[0])
          ).size;
          setActiveDays(uniqueDays);
          
          // Estimate areas from distance (rough approximation)
          const { data: points } = await supabase
            .from('user_points')
            .select('total_distance_meters')
            .eq('user_id', user.id)
            .maybeSingle();
          
          // Roughly 1 area per 5km
          const estimatedAreas = Math.floor((points?.total_distance_meters || 0) / 5000);
          setAreasMapped(estimatedAreas);
          
          const level = getCurrentLevel(uniqueDays, estimatedAreas);
          setCurrentLevel(level);
        }
      }
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
  const progress = getProgressToNextLevel(activeDays, areasMapped, currentLevel);
  const overallProgress = nextLevel 
    ? Math.min(100, (progress.daysProgress + progress.areasProgress) / 2)
    : 100;

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
              <p className="text-xs text-muted-foreground">Level {currentLevel.level}</p>
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
                Level {currentLevel.level}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{currentLevel.description}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-lg font-bold text-foreground">{activeDays}</p>
            <p className="text-xs text-muted-foreground">Days Active</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-lg font-bold text-foreground">{areasMapped}</p>
            <p className="text-xs text-muted-foreground">Areas Mapped</p>
          </div>
        </div>

        {/* Progress to Next Level */}
        {nextLevel ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress to {nextLevel.name}</span>
              <span className="font-medium text-foreground">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="w-3 h-3" />
              <span>
                {progress.daysNeeded > 0 && `${progress.daysNeeded} more days`}
                {progress.daysNeeded > 0 && progress.areasNeeded > 0 && ' + '}
                {progress.areasNeeded > 0 && `${progress.areasNeeded} more areas`}
                {' to unlock +'}
                {nextLevel.bonus} bonus points
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-primary/10 p-3 text-center">
            <Star className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-sm font-medium text-primary">Max Level Achieved!</p>
            <p className="text-xs text-muted-foreground">You're an elite contributor</p>
          </div>
        )}

        {/* Level Roadmap */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Level Roadmap</p>
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
