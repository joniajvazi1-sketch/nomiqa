import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  pullProgress: number;
  isRefreshing: boolean;
  threshold?: number;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  pullProgress,
  isRefreshing,
  threshold = 80
}) => {
  if (pullDistance === 0 && !isRefreshing) return null;

  const rotation = pullProgress * 180;
  const scale = 0.5 + (pullProgress * 0.5);
  const opacity = Math.min(pullProgress * 1.5, 1);
  const isReadyToRefresh = pullProgress >= 1;

  return (
    <div 
      className="absolute left-0 right-0 flex justify-center pointer-events-none z-50"
      style={{ 
        top: -40,
        transform: `translateY(${pullDistance}px)`,
        transition: isRefreshing ? 'none' : 'transform 0.2s ease-out'
      }}
    >
      <div 
        className={cn(
          "w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all",
          isReadyToRefresh || isRefreshing
            ? "bg-primary/20 border-primary/40 shadow-lg shadow-primary/30"
            : "bg-white/10 border-white/20"
        )}
        style={{ 
          opacity,
          transform: `scale(${scale})`
        }}
      >
        <RefreshCw 
          className={cn(
            "w-5 h-5 transition-colors",
            isReadyToRefresh || isRefreshing ? "text-primary" : "text-foreground/70"
          )}
          style={{ 
            transform: `rotate(${isRefreshing ? 0 : rotation}deg)`,
            animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
          }}
        />
      </div>
    </div>
  );
};
