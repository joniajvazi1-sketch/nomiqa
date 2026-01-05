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
import { useHaptics } from '@/hooks/useHaptics';
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

const typeColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  daily: {
    bg: 'from-neon-cyan/20 to-neon-cyan/5',
    border: 'border-neon-cyan/30',
    text: 'text-neon-cyan',
    glow: 'shadow-neon-cyan/20'
  },
  weekly: {
    bg: 'from-primary/20 to-primary/5',
    border: 'border-primary/30',
    text: 'text-primary',
    glow: 'shadow-primary/20'
  },
  special: {
    bg: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20'
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
  const { mediumTap, success: successHaptic } = useHaptics();
  const [claiming, setClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const Icon = metricIcons[metricType] || Target;
  const colors = typeColors[type];

  const handleClaim = async () => {
    if (!isCompleted || isClaimed || claiming) return;
    
    mediumTap();
    setClaiming(true);
    
    const success = await onClaim(id);
    
    if (success) {
      successHaptic();
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
          'relative rounded-2xl overflow-hidden backdrop-blur-xl',
          'border transition-all duration-300',
          colors.border,
          isCompleted && !isClaimed && 'ring-2 ring-offset-2 ring-offset-background',
          isCompleted && !isClaimed && type === 'daily' && 'ring-neon-cyan',
          isCompleted && !isClaimed && type === 'weekly' && 'ring-primary',
          isCompleted && !isClaimed && type === 'special' && 'ring-amber-500',
          isClaimed && 'opacity-60'
        )}
      >
        {/* Background gradient */}
        <div className={cn('absolute inset-0 bg-gradient-to-br', colors.bg)} />
        
        {/* Shimmer on complete but not claimed */}
        {isCompleted && !isClaimed && (
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s ease-in-out infinite'
            }}
          />
        )}

        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                'bg-gradient-to-br',
                colors.bg,
                'shadow-lg',
                colors.glow
              )}>
                <Icon className={cn('w-5 h-5', colors.text)} />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                    type === 'daily' && 'bg-neon-cyan/20 text-neon-cyan',
                    type === 'weekly' && 'bg-primary/20 text-primary',
                    type === 'special' && 'bg-amber-500/20 text-amber-400'
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
              barClassName={cn(
                type === 'daily' && 'from-neon-cyan to-neon-cyan/70',
                type === 'weekly' && 'from-primary to-primary/70',
                type === 'special' && 'from-amber-500 to-amber-400'
              )}
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

          {/* Reward / Claim button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className={cn('w-4 h-4', colors.text)} />
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
                    type === 'daily' && 'bg-neon-cyan text-background hover:bg-neon-cyan/90',
                    type === 'weekly' && 'bg-primary text-primary-foreground hover:bg-primary/90',
                    type === 'special' && 'bg-amber-500 text-background hover:bg-amber-500/90',
                    'shadow-lg',
                    colors.glow
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
