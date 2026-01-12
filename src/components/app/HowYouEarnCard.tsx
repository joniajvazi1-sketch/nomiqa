import React from 'react';
import { Smartphone, Zap, Clock, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HowYouEarnCardProps {
  className?: string;
  compact?: boolean;
}

/**
 * How You Earn Card - Explains the earning mechanism in simple terms
 * Reduces confusion and increases engagement
 */
export const HowYouEarnCard: React.FC<HowYouEarnCardProps> = ({
  className,
  compact = false
}) => {
  const steps = [
    { icon: Smartphone, text: 'Use mobile data (not WiFi)', color: 'text-sky-400' },
    { icon: Zap, text: 'Points collected automatically', color: 'text-neon-cyan' },
    { icon: Gift, text: 'Rewards activate at launch', color: 'text-amber-400' },
  ];

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08]",
        className
      )}>
        <div className="w-6 h-6 rounded-lg bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
          <Zap className="w-3 h-3 text-neon-cyan" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground truncate">
            Use mobile data • Points collected automatically • Test phase
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl bg-gradient-to-br from-neon-cyan/10 via-primary/5 to-transparent border border-neon-cyan/15 p-4",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-neon-cyan/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-neon-cyan" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">How You Earn</h3>
          <p className="text-[10px] text-muted-foreground">Simple & automatic</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
              <step.icon className={cn("w-3 h-3", step.color)} />
            </div>
            <span className="text-xs text-foreground/80">{step.text}</span>
          </div>
        ))}
      </div>

      {/* Test Phase Note */}
      <div className="mt-3 pt-3 border-t border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] text-amber-200/70">
            Test phase – tracking starts soon, rewards activate later
          </span>
        </div>
      </div>
    </div>
  );
};

export default HowYouEarnCard;
