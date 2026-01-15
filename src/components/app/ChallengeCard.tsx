import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  MapPin, 
  Flame, 
  Target, 
  Database,
  Activity,
  Gift,
  Check,
  Sparkles,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useEnhancedSounds } from '@/hooks/useEnhancedSounds';
import { AnimatedProgressBar } from './AnimatedProgressBar';
import { Confetti } from '@/components/Confetti';

interface ChallengeCardProps {
  id: string;
  type: 'daily' | 'weekly' | 'special';
  title: string;
  description: string;
  targetValue: number;
  rewardPoints: number;
  metricType: string;
  progress: number;
  isCompleted: boolean;
  isClaimed: boolean;
  onClaim: (id: string) => Promise<boolean>;
}

const metricIcons: Record<string, React.ElementType> = {
  speed_tests: Zap,
  distance_meters: MapPin,
  streak_days: Flame,
  data_points: Database,
  sessions: Activity
};

const typeColors: Record<string, { border: string; text: string; badge: string }> = {
  daily: {
    border: 'border-border',
    text: 'text-primary',
    badge: 'bg-primary/10 text-primary'
  },
  weekly: {
    border: 'border-border',
    text: 'text-primary',
    badge: 'bg-primary/10 text-primary'
  },
  special: {
    border: 'border-amber-500/30',
    text: 'text-amber-500',
    badge: 'bg-amber-500/10 text-amber-500'
  }
};

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  id,
  type,
  title,
  description,
  targetValue,
  rewardPoints,
  metricType,
  progress,
  isCompleted,
  isClaimed,
  onClaim
}) => {
  const { buttonTap, successPattern, pointsEarnedPattern } = useEnhancedHaptics();
  const { playSuccess, playCelebration, playCoin } = useEnhancedSounds();
  const [claiming, setClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const Icon = metricIcons[metricType] || Target;
  const colors = typeColors[type];

  const handleClaim = async () => {
    if (!isCompleted || isClaimed || claiming) return;
    
    buttonTap();
    setClaiming(true);
    
    const success = await onClaim(id);
    
    if (success) {
      pointsEarnedPattern();
      playCoin();
      playCelebration();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    setClaiming(false);
  };

  const formatMetricValue = (value: number, metric: string): string => {
    if (metric === 'distance_meters') {
      return value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${value}m`;
    }
    return value.toString();
  };

  const getTimeRemaining = (): string => {
    const now = new Date();
    if (type === 'daily') {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const hours = Math.floor((endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60));
      return `${hours}h left`;
    } else if (type === 'weekly') {
      const day = now.getDay();
      const daysUntilSunday = 7 - day;
      return `${daysUntilSunday}d left`;
    }
    return '';
  };

  return (
    <>
      <Confetti trigger={showConfetti} />
      
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          'relative rounded-2xl overflow-hidden bg-card/80 backdrop-blur-xl',
          'border transition-all duration-300',
          colors.border,
          isCompleted && !isClaimed && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          isClaimed && 'opacity-60'
        )}
      >

        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                'bg-muted'
              )}>
                <Icon className={cn('w-5 h-5', colors.text)} />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                    colors.badge
                  )}>
                    {type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            
            {/* Time remaining */}
            {!isClaimed && type !== 'special' && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{getTimeRemaining()}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <AnimatedProgressBar
              value={Math.round(progress * targetValue / 100)}
              max={targetValue}
              showPercentage={false}
              barClassName="from-primary to-primary/70"
            />
            <div className="flex justify-between items-center mt-1.5 text-xs">
              <span className="text-muted-foreground">
                {formatMetricValue(Math.round(progress * targetValue / 100), metricType)} / {formatMetricValue(targetValue, metricType)}
              </span>
              <span className={cn('font-mono font-semibold', colors.text)}>
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                +{rewardPoints} pts
              </span>
            </div>

            <AnimatePresence mode="wait">
              {isClaimed ? (
                <motion.div
                  key="claimed"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30"
                >
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs font-semibold text-green-400">Claimed</span>
                </motion.div>
              ) : isCompleted ? (
                <motion.button
                  key="claim"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClaim}
                  disabled={claiming}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full',
                    'font-semibold text-sm',
                    'transition-all duration-200',
                    'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  {claiming ? (
                    <Sparkles className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Claim</span>
                    </>
                  )}
                </motion.button>
              ) : (
                <motion.div
                  key="progress"
                  className="text-xs text-muted-foreground"
                >
                  In Progress
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
};
