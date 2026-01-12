import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, WifiOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RetryButtonProps {
  onRetry: () => Promise<void> | void;
  label?: string;
  className?: string;
  variant?: 'default' | 'compact' | 'inline';
}

/**
 * Retry button for failed network calls
 */
export const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  label = 'Try Again',
  className,
  variant = 'default'
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleRetry}
        disabled={isRetrying}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
          'bg-primary/10 text-primary hover:bg-primary/20 transition-colors',
          'disabled:opacity-50',
          className
        )}
      >
        <RefreshCw className={cn('w-3 h-3', isRetrying && 'animate-spin')} />
        {isRetrying ? 'Retrying...' : label}
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={handleRetry}
        disabled={isRetrying}
        className={cn(
          'text-primary hover:underline text-sm font-medium inline-flex items-center gap-1',
          'disabled:opacity-50',
          className
        )}
      >
        <RefreshCw className={cn('w-3 h-3', isRetrying && 'animate-spin')} />
        {isRetrying ? 'Retrying...' : label}
      </button>
    );
  }

  return (
    <Button
      onClick={handleRetry}
      disabled={isRetrying}
      variant="outline"
      className={cn('gap-2', className)}
    >
      <RefreshCw className={cn('w-4 h-4', isRetrying && 'animate-spin')} />
      {isRetrying ? 'Retrying...' : label}
    </Button>
  );
};

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => Promise<void> | void;
  type?: 'network' | 'general' | 'empty';
  className?: string;
}

/**
 * Error state component with retry functionality
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'Please try again',
  onRetry,
  type = 'general',
  className
}) => {
  const Icon = type === 'network' ? WifiOff : AlertCircle;

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center py-8 px-4 text-center',
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-destructive" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground mb-5 max-w-[250px]">
        {description}
      </p>
      
      {onRetry && (
        <RetryButton onRetry={onRetry} />
      )}
    </motion.div>
  );
};

/**
 * Wrapper component that shows error state on failure
 */
interface ErrorBoundaryWithRetryProps {
  error: Error | null;
  onRetry: () => Promise<void> | void;
  children: React.ReactNode;
  title?: string;
}

export const ErrorBoundaryWithRetry: React.FC<ErrorBoundaryWithRetryProps> = ({
  error,
  onRetry,
  children,
  title = 'Failed to load'
}) => {
  if (error) {
    return (
      <ErrorState
        title={title}
        description={error.message || 'Please try again'}
        onRetry={onRetry}
        type="network"
      />
    );
  }

  return <>{children}</>;
};
