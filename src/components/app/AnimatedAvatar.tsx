import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Crown, Sparkles, Star, Award, Zap } from 'lucide-react';

interface AnimatedAvatarProps {
  initial: string;
  tier: 'beginner' | 'traveler' | 'adventurer' | 'explorer';
  isLevelingUp?: boolean;
  onLevelUpComplete?: () => void;
  className?: string;
}

const TIER_STYLES = {
  beginner: {
    ring: 'ring-amber-500/50',
    bg: 'from-amber-500/30 to-amber-600/20',
    glow: 'shadow-amber-500/40',
    Icon: Star
  },
  traveler: {
    ring: 'ring-slate-400/50',
    bg: 'from-slate-400/30 to-slate-500/20',
    glow: 'shadow-slate-400/40',
    Icon: Award
  },
  adventurer: {
    ring: 'ring-yellow-500/50',
    bg: 'from-yellow-500/30 to-yellow-600/20',
    glow: 'shadow-yellow-500/40',
    Icon: Crown
  },
  explorer: {
    ring: 'ring-purple-500/50',
    bg: 'from-purple-500/30 to-purple-600/20',
    glow: 'shadow-purple-500/40',
    Icon: Sparkles
  }
};

/**
 * Animated avatar with tier-based styling and level-up animations
 */
export const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({
  initial,
  tier,
  isLevelingUp = false,
  onLevelUpComplete,
  className
}) => {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [particles, setParticles] = useState<number[]>([]);
  
  const styles = TIER_STYLES[tier] || TIER_STYLES.beginner;
  const TierIcon = styles.Icon;

  useEffect(() => {
    if (isLevelingUp) {
      setShowLevelUp(true);
      setParticles([1, 2, 3, 4, 5, 6, 7, 8]);
      
      // Clear level up animation after duration
      const timer = setTimeout(() => {
        setShowLevelUp(false);
        setParticles([]);
        onLevelUpComplete?.();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isLevelingUp, onLevelUpComplete]);

  return (
    <div className={cn('relative', className)}>
      {/* Particle burst on level up */}
      {particles.map((p, i) => (
        <div
          key={p}
          className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-primary animate-[particle-burst_1s_ease-out_forwards]"
          style={{
            '--particle-angle': `${i * 45}deg`,
            animationDelay: `${i * 50}ms`
          } as React.CSSProperties}
        />
      ))}
      
      {/* Glow ring on level up */}
      {showLevelUp && (
        <div className="absolute inset-0 rounded-full animate-[avatar-glow-pulse_0.5s_ease-out_3]">
          <div className="w-full h-full rounded-full bg-gradient-to-r from-primary via-primary/50 to-primary animate-spin-slow" />
        </div>
      )}
      
      {/* Main avatar container */}
      <div
        className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center relative',
          'bg-gradient-to-br transition-all duration-500',
          'ring-2',
          styles.ring,
          styles.bg,
          showLevelUp && ['scale-110', 'shadow-xl', styles.glow]
        )}
      >
        {/* Avatar letter */}
        <span className={cn(
          'text-3xl font-bold text-foreground transition-all duration-300',
          showLevelUp && 'scale-125 animate-bounce'
        )}>
          {initial.toUpperCase()}
        </span>
        
        {/* Tier badge */}
        <div className={cn(
          'absolute -bottom-1 -right-1 w-7 h-7 rounded-full',
          'bg-background border-2 border-background',
          'flex items-center justify-center',
          'transition-all duration-300',
          showLevelUp && 'scale-125 animate-bounce'
        )}>
          <div className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center',
            `bg-gradient-to-br ${styles.bg}`
          )}>
            <TierIcon className="w-3 h-3 text-foreground" />
          </div>
        </div>
      </div>
      
      {/* Level up text */}
      {showLevelUp && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap animate-[float-up_1s_ease-out_forwards]">
          <span className="text-sm font-bold text-primary flex items-center gap-1">
            <Zap className="w-4 h-4" />
            Level Up!
          </span>
        </div>
      )}
    </div>
  );
};
