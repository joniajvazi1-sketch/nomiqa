import React, { useEffect, useState, useMemo } from 'react';
import { 
  Trophy, 
  Flame, 
  MapPin, 
  Zap, 
  Users, 
  Star, 
  Target, 
  Rocket,
  Shield,
  Crown,
  Gift,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'contribution' | 'streak' | 'referral' | 'milestone' | 'special';
  progress: number; // 0-100
  unlocked: boolean;
  unlockedAt?: Date;
  reward: number; // points
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  onClick?: () => void;
}

interface StreakBonusProps {
  streakDays: number;
  isActive: boolean;
}

interface MilestonePopupProps {
  show: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}

// Tier colors and gradients
const tierStyles = {
  bronze: {
    bg: 'from-amber-700/30 to-amber-800/20',
    border: 'border-amber-600/40',
    text: 'text-amber-500',
    glow: 'shadow-amber-600/30'
  },
  silver: {
    bg: 'from-slate-300/30 to-slate-400/20',
    border: 'border-slate-400/40',
    text: 'text-slate-300',
    glow: 'shadow-slate-400/30'
  },
  gold: {
    bg: 'from-yellow-500/30 to-amber-500/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/40'
  },
  platinum: {
    bg: 'from-cyan-400/30 to-blue-500/20',
    border: 'border-cyan-400/50',
    text: 'text-cyan-300',
    glow: 'shadow-cyan-400/40'
  }
};

/**
 * Achievement Badge Component
 */
export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = 'md',
  showProgress = true,
  onClick
}) => {
  const { lightTap } = useHaptics();
  const tier = tierStyles[achievement.tier];
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };
  
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9'
  };

  return (
    <button
      onClick={() => { lightTap(); onClick?.(); }}
      className={cn(
        'relative flex flex-col items-center gap-2 p-2 rounded-xl transition-all',
        'hover:scale-105 active:scale-95',
        onClick && 'cursor-pointer'
      )}
    >
      {/* Badge circle */}
      <div className={cn(
        'relative rounded-full flex items-center justify-center',
        'bg-gradient-to-br border-2 backdrop-blur-xl',
        sizeClasses[size],
        tier.bg,
        tier.border,
        achievement.unlocked && `shadow-lg ${tier.glow}`,
        !achievement.unlocked && 'opacity-40 grayscale'
      )}>
        {/* Icon */}
        <div className={cn(tier.text, iconSizes[size])}>
          {achievement.icon}
        </div>
        
        {/* Progress ring for locked achievements */}
        {!achievement.unlocked && showProgress && achievement.progress > 0 && (
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-white/10"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${achievement.progress * 2.89} 289`}
              className={tier.text}
            />
          </svg>
        )}
        
        {/* Unlocked checkmark */}
        {achievement.unlocked && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-background">
            <Star className="w-3 h-3 text-white fill-white" />
          </div>
        )}
      </div>
      
      {/* Title */}
      <span className={cn(
        'text-[10px] font-medium text-center max-w-[60px] leading-tight',
        achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {achievement.title}
      </span>
    </button>
  );
};

/**
 * Streak Bonus Display
 */
export const StreakBonus: React.FC<StreakBonusProps> = ({ streakDays, isActive }) => {
  // Calculate bonus multiplier based on streak
  const getStreakBonus = (days: number) => {
    if (days >= 30) return { multiplier: 2.0, label: 'LEGENDARY', color: 'text-purple-400', bg: 'from-purple-500/30 to-violet-600/20' };
    if (days >= 14) return { multiplier: 1.75, label: 'EPIC', color: 'text-amber-400', bg: 'from-amber-500/30 to-orange-600/20' };
    if (days >= 7) return { multiplier: 1.5, label: 'HOT', color: 'text-orange-400', bg: 'from-orange-500/30 to-red-600/20' };
    if (days >= 3) return { multiplier: 1.25, label: 'RISING', color: 'text-yellow-400', bg: 'from-yellow-500/30 to-amber-600/20' };
    return { multiplier: 1.0, label: '', color: 'text-muted-foreground', bg: '' };
  };
  
  const bonus = getStreakBonus(streakDays);
  
  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl border transition-all',
      streakDays >= 3 
        ? `bg-gradient-to-r ${bonus.bg} border-white/10` 
        : 'bg-white/[0.03] border-white/[0.08]'
    )}>
      {/* Flame icon with animation */}
      <div className="relative">
        <Flame className={cn(
          'w-6 h-6 transition-all',
          isActive ? 'text-orange-500' : 'text-muted-foreground',
          streakDays >= 7 && 'animate-pulse'
        )} />
        {streakDays >= 14 && (
          <div className="absolute -top-1 -right-1 w-3 h-3">
            <Flame className="w-3 h-3 text-amber-400 animate-bounce" />
          </div>
        )}
      </div>
      
      {/* Streak count */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span 
            className="text-lg font-bold text-foreground"
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
          >
            {streakDays}
          </span>
          <span className="text-sm text-muted-foreground">day streak</span>
          {bonus.label && (
            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', bonus.color, 'bg-white/10')}>
              {bonus.label}
            </span>
          )}
        </div>
        {bonus.multiplier > 1 && (
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className={cn('w-3 h-3', bonus.color)} />
            <span className={bonus.color}>{bonus.multiplier}x earnings bonus</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Milestone Unlock Popup
 */
export const MilestonePopup: React.FC<MilestonePopupProps> = ({ show, achievement, onClose }) => {
  const { success } = useHaptics();
  
  useEffect(() => {
    if (show && achievement) {
      success();
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, achievement, onClose, success]);
  
  if (!show || !achievement) return null;
  
  const tier = tierStyles[achievement.tier];
  
  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center px-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-fade-in" />
      
      {/* Popup card */}
      <div 
        className={cn(
          'relative bg-gradient-to-br border-2 rounded-3xl p-6 backdrop-blur-xl',
          'shadow-2xl animate-achievement-unlock',
          tier.bg,
          tier.border,
          tier.glow
        )}
        style={{ maxWidth: '320px' }}
      >
        {/* Sparkles background */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>
        
        {/* Content */}
        <div className="relative text-center">
          {/* Trophy icon */}
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center animate-bounce-in">
            <div className={cn('w-10 h-10', tier.text)}>
              {achievement.icon}
            </div>
          </div>
          
          {/* Label */}
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-1">
            Achievement Unlocked!
          </div>
          
          {/* Title */}
          <h3 className={cn('text-xl font-bold mb-2', tier.text)}>
            {achievement.title}
          </h3>
          
          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4">
            {achievement.description}
          </p>
          
          {/* Reward */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10">
            <Gift className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">+{achievement.reward} pts</span>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes achievement-unlock {
          0% { 
            opacity: 0; 
            transform: scale(0.5) translateY(20px); 
          }
          50% { 
            transform: scale(1.1) translateY(-10px); 
          }
          100% { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        .animate-achievement-unlock {
          animation: achievement-unlock 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-twinkle {
          animation: twinkle 1.5s ease-in-out infinite;
        }
        
        @keyframes bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
};

/**
 * Generate achievements based on user stats
 */
export const generateAchievements = (stats: {
  totalPoints: number;
  totalDistance: number;
  streakDays: number;
  totalReferrals: number;
  dataPointsCount: number;
  sessionsCount: number;
}): Achievement[] => {
  return [
    // Contribution achievements
    {
      id: 'first-scan',
      title: 'First Scan',
      description: 'Complete your first network scan',
      icon: <Radio className="w-full h-full" />,
      category: 'contribution',
      progress: Math.min(stats.sessionsCount, 1) * 100,
      unlocked: stats.sessionsCount >= 1,
      reward: 50,
      tier: 'bronze'
    },
    {
      id: 'data-collector',
      title: 'Data Collector',
      description: 'Collect 100 data points',
      icon: <Target className="w-full h-full" />,
      category: 'contribution',
      progress: Math.min(stats.dataPointsCount / 100, 1) * 100,
      unlocked: stats.dataPointsCount >= 100,
      reward: 100,
      tier: 'bronze'
    },
    {
      id: 'explorer',
      title: 'Explorer',
      description: 'Map 1 kilometer of coverage',
      icon: <MapPin className="w-full h-full" />,
      category: 'contribution',
      progress: Math.min(stats.totalDistance / 1000, 1) * 100,
      unlocked: stats.totalDistance >= 1000,
      reward: 150,
      tier: 'silver'
    },
    {
      id: 'pathfinder',
      title: 'Pathfinder',
      description: 'Map 10 kilometers of coverage',
      icon: <Rocket className="w-full h-full" />,
      category: 'contribution',
      progress: Math.min(stats.totalDistance / 10000, 1) * 100,
      unlocked: stats.totalDistance >= 10000,
      reward: 500,
      tier: 'gold'
    },
    {
      id: 'cartographer',
      title: 'Cartographer',
      description: 'Map 50 kilometers of coverage',
      icon: <Crown className="w-full h-full" />,
      category: 'milestone',
      progress: Math.min(stats.totalDistance / 50000, 1) * 100,
      unlocked: stats.totalDistance >= 50000,
      reward: 2000,
      tier: 'platinum'
    },
    
    // Streak achievements
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: '3-day contribution streak',
      icon: <Flame className="w-full h-full" />,
      category: 'streak',
      progress: Math.min(stats.streakDays / 3, 1) * 100,
      unlocked: stats.streakDays >= 3,
      reward: 75,
      tier: 'bronze'
    },
    {
      id: 'on-fire',
      title: 'On Fire',
      description: '7-day contribution streak',
      icon: <Flame className="w-full h-full" />,
      category: 'streak',
      progress: Math.min(stats.streakDays / 7, 1) * 100,
      unlocked: stats.streakDays >= 7,
      reward: 200,
      tier: 'silver'
    },
    {
      id: 'unstoppable',
      title: 'Unstoppable',
      description: '14-day contribution streak',
      icon: <Shield className="w-full h-full" />,
      category: 'streak',
      progress: Math.min(stats.streakDays / 14, 1) * 100,
      unlocked: stats.streakDays >= 14,
      reward: 500,
      tier: 'gold'
    },
    {
      id: 'legendary',
      title: 'Legendary',
      description: '30-day contribution streak',
      icon: <Award className="w-full h-full" />,
      category: 'streak',
      progress: Math.min(stats.streakDays / 30, 1) * 100,
      unlocked: stats.streakDays >= 30,
      reward: 1500,
      tier: 'platinum'
    },
    
    // Points milestones
    {
      id: 'centurion',
      title: 'Centurion',
      description: 'Earn 100 points',
      icon: <Zap className="w-full h-full" />,
      category: 'milestone',
      progress: Math.min(stats.totalPoints / 100, 1) * 100,
      unlocked: stats.totalPoints >= 100,
      reward: 25,
      tier: 'bronze'
    },
    {
      id: 'power-user',
      title: 'Power User',
      description: 'Earn 1,000 points',
      icon: <Zap className="w-full h-full" />,
      category: 'milestone',
      progress: Math.min(stats.totalPoints / 1000, 1) * 100,
      unlocked: stats.totalPoints >= 1000,
      reward: 100,
      tier: 'silver'
    },
    {
      id: 'elite-contributor',
      title: 'Elite Contributor',
      description: 'Earn 10,000 points',
      icon: <Star className="w-full h-full" />,
      category: 'milestone',
      progress: Math.min(stats.totalPoints / 10000, 1) * 100,
      unlocked: stats.totalPoints >= 10000,
      reward: 500,
      tier: 'gold'
    },
    
    // Referral achievements
    {
      id: 'networker',
      title: 'Networker',
      description: 'Refer 1 friend',
      icon: <Users className="w-full h-full" />,
      category: 'referral',
      progress: Math.min(stats.totalReferrals, 1) * 100,
      unlocked: stats.totalReferrals >= 1,
      reward: 100,
      tier: 'bronze'
    },
    {
      id: 'influencer',
      title: 'Influencer',
      description: 'Refer 5 friends',
      icon: <Users className="w-full h-full" />,
      category: 'referral',
      progress: Math.min(stats.totalReferrals / 5, 1) * 100,
      unlocked: stats.totalReferrals >= 5,
      reward: 300,
      tier: 'silver'
    },
    {
      id: 'ambassador',
      title: 'Ambassador',
      description: 'Refer 15 friends',
      icon: <Trophy className="w-full h-full" />,
      category: 'referral',
      progress: Math.min(stats.totalReferrals / 15, 1) * 100,
      unlocked: stats.totalReferrals >= 15,
      reward: 1000,
      tier: 'gold'
    }
  ];
};

// Helper component for Radio icon (used in achievements)
const Radio: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="2" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
  </svg>
);
