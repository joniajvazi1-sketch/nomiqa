import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EarningExplainerProps {
  type: 'network' | 'referral' | 'boost' | 'commission';
  value?: string | number;
  className?: string;
}

const EXPLAINERS = {
  network: {
    label: 'Network Value Share',
    description: 'Share of value from your direct referrals\' contributions',
  },
  referral: {
    label: 'Contributors Invited',
    description: 'People who joined using your link',
  },
  boost: {
    label: 'Contribution Boost',
    description: 'Active community = higher bonus on your rewards',
  },
  commission: {
    label: 'Value Share Rate',
    description: 'Percentage shared when referrals use network services',
  },
};

/**
 * Earning Explainer - Provides human-readable context for earnings metrics
 * Prevents MLM associations and clarifies value creation
 */
export const EarningExplainer: React.FC<EarningExplainerProps> = ({
  type,
  value,
  className
}) => {
  const config = EXPLAINERS[type];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex items-center gap-1 cursor-help", className)}>
            <span className="text-muted-foreground">{config.label}</span>
            {value !== undefined && (
              <span className="font-semibold text-foreground">
                {typeof value === 'number' ? `${value}%` : value}
              </span>
            )}
            <Info className="w-3 h-3 text-muted-foreground/60" />
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-[200px] bg-popover/95 backdrop-blur-xl border-border/50 text-xs"
        >
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Inline text explainer for use in cards
 */
export const InlineExplainer: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className }) => (
  <p className={cn("text-[10px] text-muted-foreground/70 italic", className)}>
    {text}
  </p>
);

export default EarningExplainer;
