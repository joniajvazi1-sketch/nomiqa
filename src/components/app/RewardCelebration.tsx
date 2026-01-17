import React, { useEffect, useState } from 'react';
import { Confetti } from '@/components/Confetti';
import { cn } from '@/lib/utils';
import { Trophy, Zap, Star } from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { ParticleEffect } from '@/components/app/ParticleEffect';

interface RewardCelebrationProps {
  trigger: boolean;
  points: number;
  onComplete?: () => void;
  type?: 'milestone' | 'session-end' | 'achievement';
}

export const RewardCelebration: React.FC<RewardCelebrationProps> = ({
  trigger,
  points,
  onComplete,
  type = 'milestone'
}) => {
  const [showBadge, setShowBadge] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const { playCelebration, soundEnabled } = useSoundEffects();

  useEffect(() => {
    if (trigger) {
      setShowBadge(true);
      setShowParticles(true);
      
      // Play celebration sound
      if (soundEnabled) {
        playCelebration();
      }
      
      const timer = setTimeout(() => {
        setShowBadge(false);
        setShowParticles(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete, playCelebration, soundEnabled]);

  const getIcon = () => {
    switch (type) {
      case 'achievement':
        return <Trophy className="w-8 h-8 text-amber-400" />;
      case 'session-end':
        return <Star className="w-8 h-8 text-primary" />;
      default:
        return <Zap className="w-8 h-8 text-primary" />;
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'achievement':
        return 'Achievement Unlocked!';
      case 'session-end':
        return 'Session Complete!';
      default:
        return 'Milestone Reached!';
    }
  };

  return (
    <>
      {/* Confetti removed per user request */}
      
      {showBadge && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div 
            className={cn(
              'bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-6',
              'shadow-lg animate-scale-in'
            )}
          >
          <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {getIcon()}
                {/* Particle burst around icon */}
                <ParticleEffect 
                  trigger={showParticles} 
                  count={16} 
                  color={type === 'achievement' ? 'hsl(45, 93%, 47%)' : 'hsl(var(--primary))'} 
                />
              </div>
              
              <div className="text-center">
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  {getMessage()}
                </div>
                <div 
                  className="text-3xl font-bold text-primary mt-1"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace' }}
                >
                  +{points.toFixed(0)}
                </div>
                <div className="text-sm text-foreground font-medium">Points Earned!</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
