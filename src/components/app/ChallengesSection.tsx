import React, { useState } from 'react';
import { Target, ChevronRight, Flame, Calendar, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChallenges } from '@/hooks/useChallenges';
import { ChallengeCard } from './ChallengeCard';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { useTranslation } from '@/contexts/TranslationContext';

type ChallengeTab = 'daily' | 'weekly' | 'special';

interface ChallengesSectionProps {
  compact?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
}

export const ChallengesSection: React.FC<ChallengesSectionProps> = ({ 
  compact = false,
  maxItems,
  onViewAll 
}) => {
  const { buttonTap, selectionTap } = useEnhancedHaptics();
  const { playPop } = useEnhancedSounds();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ChallengeTab>('daily');
  const { 
    dailyChallenges, 
    weeklyChallenges, 
    specialChallenges,
    loading,
    claimReward,
    unclaimedCount,
    backgroundStreakDays,
    streakBonusPercent
  } = useChallenges();

  const tabs = [
    { id: 'daily' as const, label: 'Daily', icon: Flame, count: dailyChallenges.length },
    { id: 'weekly' as const, label: 'Weekly', icon: Calendar, count: weeklyChallenges.length },
    { id: 'special' as const, label: 'Special', icon: Star, count: specialChallenges.length }
  ];

  const currentChallenges = activeTab === 'daily' ? dailyChallenges :
                           activeTab === 'weekly' ? weeklyChallenges :
                           specialChallenges;

  // Determine how many to display
  const limit = maxItems ?? (compact ? 1 : currentChallenges.length);
  const displayChallenges = currentChallenges.slice(0, limit);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">Challenges</span>
        </div>
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div 
              key={i}
              className="h-24 rounded-xl bg-card border border-border animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">Challenges</span>
          {unclaimedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {unclaimedCount}
            </span>
          )}
        </div>
        {onViewAll && (
          <button 
            onClick={() => { buttonTap(); playPop(); onViewAll(); }}
            className="flex items-center gap-1 text-xs text-primary"
          >
            View All
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Streak bonus indicator (only show if streak active) */}
      {backgroundStreakDays >= 7 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-xs text-foreground">
            <span className="font-semibold text-primary">+{streakBonusPercent}%</span> background bonus ({backgroundStreakDays} day streak)
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { selectionTap(); setActiveTab(tab.id); }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            <span className={cn(
              'text-xs',
              activeTab === tab.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              ({tab.count})
            </span>
          </button>
        ))}
      </div>

      {/* Challenge cards */}
      <div className="space-y-2">
        {displayChallenges.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No {activeTab} challenges available</p>
          </div>
        ) : (
          displayChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              id={challenge.id}
              type={challenge.type}
              title={challenge.title}
              description={challenge.description}
              targetValue={challenge.target_value}
              rewardPoints={challenge.reward_points}
              metricType={challenge.metric_type}
              progress={challenge.progress}
              isCompleted={challenge.isCompleted}
              isClaimed={challenge.isClaimed}
              onClaim={claimReward}
            />
          ))
        )}
      </div>

      {/* Show more button */}
      {currentChallenges.length > limit && onViewAll && (
        <button
          onClick={() => { buttonTap(); playPop(); onViewAll(); }}
          className="w-full py-2.5 text-center text-sm font-medium text-primary rounded-xl bg-card border border-border active:scale-[0.98] transition-transform"
        >
          +{currentChallenges.length - limit} more challenges
        </button>
      )}
    </div>
  );
};
