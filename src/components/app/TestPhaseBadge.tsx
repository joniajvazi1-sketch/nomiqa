import React from 'react';
import { Info, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestPhaseBadgeProps {
  variant?: 'inline' | 'block';
  message?: string;
  className?: string;
}

/**
 * Test Phase Badge - Shows contextual message for zero/inactive values
 * Manages user expectations during test phase
 */
export const TestPhaseBadge: React.FC<TestPhaseBadgeProps> = ({
  variant = 'inline',
  message = 'Test phase – values activate at launch',
  className
}) => {
  if (variant === 'block') {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20",
        className
      )}>
        <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span className="text-xs text-amber-200/80">{message}</span>
      </div>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20",
      className
    )}>
      <Info className="w-3 h-3 text-amber-400" />
      <span className="text-[10px] text-amber-300/80">{message}</span>
    </span>
  );
};

export default TestPhaseBadge;
