import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Star, Zap, Circle } from 'lucide-react';
import { getQualityTier, getRewardMultiplier } from '@/utils/dataQualityScoring';

interface DataQualityIndicatorProps {
  score: number;
  showMultiplier?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Visual indicator for data quality score
 * Shows tier badge and optional reward multiplier
 */
export const DataQualityIndicator: React.FC<DataQualityIndicatorProps> = ({
  score,
  showMultiplier = true,
  size = 'md',
  className
}) => {
  const { tier, color, description } = getQualityTier(score);
  const multiplier = getRewardMultiplier(score);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  const TierIcon = tier === 'Elite' ? Sparkles : 
                   tier === 'Premium' ? Star :
                   tier === 'Standard' ? Zap : Circle;
  
  const tierColors = {
    Elite: 'bg-neon-violet/20 border-neon-violet/40',
    Premium: 'bg-neon-cyan/20 border-neon-cyan/40',
    Standard: 'bg-green-500/20 border-green-500/40',
    Basic: 'bg-muted/20 border-muted/40'
  };

  return (
    <div 
      className={cn(
        'inline-flex items-center rounded-full border backdrop-blur-sm',
        sizeClasses[size],
        tierColors[tier],
        className
      )}
      title={description}
    >
      <TierIcon className={cn(iconSizes[size], color)} />
      <span className={cn('font-semibold', color)}>{tier}</span>
      {showMultiplier && multiplier > 1 && (
        <span className="font-mono text-amber-400">
          {multiplier}x
        </span>
      )}
    </div>
  );
};

/**
 * Compact quality score badge
 */
export const QualityScoreBadge: React.FC<{
  score: number;
  className?: string;
}> = ({ score, className }) => {
  const { color } = getQualityTier(score);
  
  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'bg-black/30 backdrop-blur-sm border border-white/10',
        className
      )}
    >
      <span className={cn('text-xs font-mono font-bold', color)}>
        Q{score}
      </span>
    </div>
  );
};

/**
 * Quality score progress bar
 */
export const QualityProgressBar: React.FC<{
  score: number;
  showLabel?: boolean;
  className?: string;
}> = ({ score, showLabel = true, className }) => {
  const { tier, color } = getQualityTier(score);
  
  const barColor = tier === 'Elite' ? 'bg-neon-violet' :
                   tier === 'Premium' ? 'bg-neon-cyan' :
                   tier === 'Standard' ? 'bg-green-500' : 'bg-muted-foreground';

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Data Quality</span>
          <span className={cn('font-mono font-bold', color)}>{score}/100</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div 
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};
