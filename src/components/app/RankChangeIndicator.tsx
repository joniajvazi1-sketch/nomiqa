import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RankChangeIndicatorProps {
  change: number; // positive = moved up, negative = moved down, 0 = no change
  size?: 'sm' | 'md';
  showText?: boolean;
}

/**
 * Animated rank change indicator showing +/- position movement
 * Green up arrow for gains, red down arrow for drops, gray dash for no change
 */
export const RankChangeIndicator: React.FC<RankChangeIndicatorProps> = ({
  change,
  size = 'sm',
  showText = true
}) => {
  const isUp = change > 0;
  const isDown = change < 0;
  const isNeutral = change === 0;
  
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const containerSize = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  if (isNeutral) {
    return (
      <div className={cn(
        'flex items-center gap-0.5 rounded-full bg-muted/20',
        containerSize
      )}>
        <Minus className={cn(iconSize, 'text-muted-foreground')} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'flex items-center gap-0.5 rounded-full font-medium',
        containerSize,
        isUp && 'bg-green-500/20 text-green-400',
        isDown && 'bg-red-500/20 text-red-400'
      )}
    >
      {isUp && (
        <motion.div
          initial={{ y: 3 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <TrendingUp className={iconSize} />
        </motion.div>
      )}
      {isDown && (
        <motion.div
          initial={{ y: -3 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <TrendingDown className={iconSize} />
        </motion.div>
      )}
      {showText && (
        <span className={textSize}>
          {isUp ? '+' : ''}{Math.abs(change)}
        </span>
      )}
    </motion.div>
  );
};

export default RankChangeIndicator;
