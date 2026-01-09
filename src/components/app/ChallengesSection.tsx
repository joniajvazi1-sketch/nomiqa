import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, ChevronRight, Flame, Calendar, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChallenges } from '@/hooks/useChallenges';
import { ChallengeCard } from './ChallengeCard';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranslation } from '@/contexts/TranslationContext';

type ChallengeTab = 'daily' | 'weekly' | 'special';

interface ChallengesSectionProps {
  compact?: boolean;
  onViewAll?: () => void;
}

export const ChallengesSection: React.FC<ChallengesSectionProps> = ({ 
  compact = false,
  onViewAll 
}) => {
  const { lightTap } = useHaptics();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ChallengeTab>('daily');
  const { 
    dailyChallenges, 
    weeklyChallenges, 
    specialChallenges,
    loading,
    claimReward,
    unclaimedCount 
  } = useChallenges();

  const tabs = [
    { id: 'daily' as const, label: t('appDaily'), icon: Flame, count: dailyChallenges.length },
    { id: 'weekly' as const, label: t('appWeekly'), icon: Calendar, count: weeklyChallenges.length },
    { id: 'special' as const, label: t('appSpecial'), icon: Star, count: specialChallenges.length }
  ];

  const currentChallenges = activeTab === 'daily' ? dailyChallenges :
                           activeTab === 'weekly' ? weeklyChallenges :
                           specialChallenges;

  const displayChallenges = compact ? currentChallenges.slice(0, 1) : currentChallenges;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">{t('appChallenges')}</span>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div 
              key={i}
              className="h-32 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">{t('appChallenges')}</span>
          {unclaimedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {unclaimedCount}
            </span>
          )}
        </div>
        {compact && onViewAll && (
          <button 
            onClick={() => { lightTap(); onViewAll(); }}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {t('appViewAll')}
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { lightTap(); setActiveTab(tab.id); }}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                : 'bg-white/[0.05] text-muted-foreground border border-white/10 hover:bg-white/[0.08]'
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
      <AnimatePresence mode="popLayout">
        <motion.div layout className="space-y-3">
          {displayChallenges.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No {activeTab} challenges available</p>
            </motion.div>
          ) : (
            displayChallenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <ChallengeCard
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
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* View more button for compact mode */}
      {compact && currentChallenges.length > 1 && onViewAll && (
        <button
          onClick={() => { lightTap(); onViewAll(); }}
          className="w-full py-3 text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors rounded-xl bg-white/[0.03] border border-white/[0.08] active:scale-[0.98]"
        >
          +{currentChallenges.length - 1} more challenges
        </button>
      )}
    </div>
  );
};
