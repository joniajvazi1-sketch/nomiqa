import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AppSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

/**
 * Premium animated loading spinner for native app
 * Features pulsing glow and smooth rotation
 */
export const AppSpinner: React.FC<AppSpinnerProps> = ({ 
  size = 'md', 
  className,
  label 
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const containerSizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative">
        {/* Glow background */}
        <div 
          className={cn(
            'absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse-glow',
            containerSizes[size]
          )} 
        />
        
        {/* Spinner container */}
        <div 
          className={cn(
            'relative rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center backdrop-blur-sm border border-primary/20',
            containerSizes[size]
          )}
        >
          <Loader2 
            className={cn(
              'text-primary animate-spin-slow',
              sizeClasses[size]
            )} 
          />
        </div>
      </div>
      
      {label && (
        <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
      )}
    </div>
  );
};

/**
 * Full page loading state
 */
export const AppLoadingScreen: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <AppSpinner size="lg" label={message || 'Loading...'} />
    </div>
  );
};

/**
 * Skeleton loading placeholder with shimmer effect
 */
export const AppSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div 
      className={cn(
        'rounded-2xl bg-white/[0.05] relative overflow-hidden',
        className
      )}
    >
      <div 
        className="absolute inset-0 -translate-x-full animate-shimmer"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        }}
      />
    </div>
  );
};
