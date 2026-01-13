/**
 * Contributor Levels System
 * Achievement-based progression (not MLM-based)
 */

import { Star, Medal, Trophy, Crown, Sparkles } from 'lucide-react';

export interface ContributorLevel {
  level: number;
  name: string;
  nameKey: string;
  icon: typeof Star;
  color: string;
  bgColor: string;
  requirements: {
    activeDays?: number;
    areasMapped?: number;
  };
  bonus: number; // One-time bonus points when level achieved
  description: string;
}

export const CONTRIBUTOR_LEVELS: ContributorLevel[] = [
  {
    level: 1,
    name: 'Newcomer',
    nameKey: 'levelNewcomer',
    icon: Star,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    requirements: {},
    bonus: 0,
    description: 'Welcome to the network!',
  },
  {
    level: 2,
    name: 'Contributor',
    nameKey: 'levelContributor',
    icon: Medal,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/20',
    requirements: { activeDays: 7 },
    bonus: 50,
    description: '7 days of active contribution',
  },
  {
    level: 3,
    name: 'Explorer',
    nameKey: 'levelExplorer',
    icon: Trophy,
    color: 'text-sky-500',
    bgColor: 'bg-sky-500/20',
    requirements: { areasMapped: 10 },
    bonus: 100,
    description: 'Mapped 10 unique areas',
  },
  {
    level: 4,
    name: 'Mapper',
    nameKey: 'levelMapper',
    icon: Crown,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/20',
    requirements: { activeDays: 30, areasMapped: 25 },
    bonus: 250,
    description: '30 days active, 25 areas mapped',
  },
  {
    level: 5,
    name: 'Pioneer',
    nameKey: 'levelPioneer',
    icon: Sparkles,
    color: 'text-gradient-primary',
    bgColor: 'bg-primary/20',
    requirements: { activeDays: 60, areasMapped: 50 },
    bonus: 500,
    description: 'Elite contributor status',
  },
];

export const getLevelByNumber = (level: number): ContributorLevel => {
  return CONTRIBUTOR_LEVELS.find(l => l.level === level) || CONTRIBUTOR_LEVELS[0];
};

export const getCurrentLevel = (activeDays: number, areasMapped: number): ContributorLevel => {
  // Find highest level user qualifies for
  for (let i = CONTRIBUTOR_LEVELS.length - 1; i >= 0; i--) {
    const level = CONTRIBUTOR_LEVELS[i];
    const meetsActiveDays = !level.requirements.activeDays || activeDays >= level.requirements.activeDays;
    const meetsAreasMapped = !level.requirements.areasMapped || areasMapped >= level.requirements.areasMapped;
    
    if (meetsActiveDays && meetsAreasMapped) {
      return level;
    }
  }
  return CONTRIBUTOR_LEVELS[0];
};

export const getNextLevel = (currentLevel: number): ContributorLevel | null => {
  if (currentLevel >= CONTRIBUTOR_LEVELS.length) return null;
  return CONTRIBUTOR_LEVELS[currentLevel]; // currentLevel is 1-indexed, array is 0-indexed
};

export const getProgressToNextLevel = (
  activeDays: number, 
  areasMapped: number, 
  currentLevel: ContributorLevel
): { daysProgress: number; areasProgress: number; daysNeeded: number; areasNeeded: number } => {
  const nextLevel = getNextLevel(currentLevel.level);
  
  if (!nextLevel) {
    return { daysProgress: 100, areasProgress: 100, daysNeeded: 0, areasNeeded: 0 };
  }
  
  const daysNeeded = nextLevel.requirements.activeDays || 0;
  const areasNeeded = nextLevel.requirements.areasMapped || 0;
  
  const daysProgress = daysNeeded > 0 ? Math.min(100, (activeDays / daysNeeded) * 100) : 100;
  const areasProgress = areasNeeded > 0 ? Math.min(100, (areasMapped / areasNeeded) * 100) : 100;
  
  return {
    daysProgress,
    areasProgress,
    daysNeeded: Math.max(0, daysNeeded - activeDays),
    areasNeeded: Math.max(0, areasNeeded - areasMapped),
  };
};

export const formatLevelRequirements = (level: ContributorLevel): string => {
  const parts: string[] = [];
  
  if (level.requirements.activeDays) {
    parts.push(`${level.requirements.activeDays} days active`);
  }
  if (level.requirements.areasMapped) {
    parts.push(`${level.requirements.areasMapped} areas mapped`);
  }
  
  return parts.join(' + ') || 'No requirements';
};
