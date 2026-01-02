import React, { useEffect, useState } from 'react';
import { Confetti } from '@/components/Confetti';
import { cn } from '@/lib/utils';
import { Trophy, Zap, Star } from 'lucide-react';

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

  useEffect(() => {
    if (trigger) {
      setShowBadge(true);
      const timer = setTimeout(() => {
        setShowBadge(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  const getIcon = () => {
    switch (type) {
      case 'achievement':
        return <Trophy className="w-8 h-8 text-amber-400" />;
      case 'session-end':
        return <Star className="w-8 h-8 text-neon-cyan" />;
      default:
        return <Zap className="w-8 h-8 text-neon-cyan" />;
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
      <Confetti trigger={trigger} />
      
      {showBadge && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div 
            className={cn(
              'bg-background/90 backdrop-blur-xl border-2 border-neon-cyan/50 rounded-2xl p-6',
              'shadow-[0_0_50px_rgba(0,255,255,0.3)] animate-bounce-in'
            )}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 animate-ping">
                  {getIcon()}
                </div>
                {getIcon()}
              </div>
              
              <div className="text-center">
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  {getMessage()}
                </div>
                <div 
                  className="text-3xl font-bold text-neon-cyan mt-1"
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
