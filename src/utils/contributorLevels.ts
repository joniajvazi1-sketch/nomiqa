/**
 * Contributor Levels System
 * Tier-based progression based on team size (referrals)
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
    teamMembers: number;
  };
  bonus: number; // One-time bonus points when level achieved
  description: string;
}

export const CONTRIBUTOR_LEVELS: ContributorLevel[] = [
  {
    level: 1,
    name: 'Starter',
    nameKey: 'tierStarter',
    icon: Star,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    requirements: { teamMembers: 0 },
    bonus: 0,
    description: 'Welcome to the network!',
  },
  {
    level: 2,
    name: 'Builder',
    nameKey: 'tierBuilder',
    icon: Medal,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/20',
    requirements: { teamMembers: 5 },
    bonus: 100,
    description: 'Build your team of 5',
  },
  {
    level: 3,
    name: 'Leader',
    nameKey: 'tierLeader',
    icon: Trophy,
    color: 'text-sky-500',
    bgColor: 'bg-sky-500/20',
    requirements: { teamMembers: 15 },
    bonus: 300,
    description: 'Lead a team of 15',
  },
  {
    level: 4,
    name: 'Ambassador',
    nameKey: 'tierAmbassador',
    icon: Crown,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/20',
    requirements: { teamMembers: 50 },
    bonus: 1000,
    description: 'Ambassador with 50+ team',
  },
  {
    level: 5,
    name: 'Pioneer',
    nameKey: 'tierPioneer',
    icon: Sparkles,
    color: 'text-gradient-primary',
    bgColor: 'bg-primary/20',
    requirements: { teamMembers: 100 },
    bonus: 2500,
    description: 'Elite pioneer status',
  },
];

export const getLevelByNumber = (level: number): ContributorLevel => {
  return CONTRIBUTOR_LEVELS.find(l => l.level === level) || CONTRIBUTOR_LEVELS[0];
};

export const getCurrentLevel = (teamMembers: number): ContributorLevel => {
  // Find highest level user qualifies for
  for (let i = CONTRIBUTOR_LEVELS.length - 1; i >= 0; i--) {
    const level = CONTRIBUTOR_LEVELS[i];
    if (teamMembers >= level.requirements.teamMembers) {
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
  teamMembers: number, 
  currentLevel: ContributorLevel
): { progress: number; membersNeeded: number } => {
  const nextLevel = getNextLevel(currentLevel.level);
  
  if (!nextLevel) {
    return { progress: 100, membersNeeded: 0 };
  }
  
  const membersNeeded = nextLevel.requirements.teamMembers;
  const progress = membersNeeded > 0 ? Math.min(100, (teamMembers / membersNeeded) * 100) : 100;
  
  return {
    progress,
    membersNeeded: Math.max(0, membersNeeded - teamMembers),
  };
};

export const formatLevelRequirements = (level: ContributorLevel): string => {
  if (level.requirements.teamMembers === 0) {
    return 'No requirements';
  }
  return `${level.requirements.teamMembers} team members`;
};
