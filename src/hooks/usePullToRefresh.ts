import { useState, useRef, useCallback, TouchEvent } from 'react';
import { useHaptics } from '@/hooks/useHaptics';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number>(0);
  const isPulling = useRef(false);
  const { lightTap, success } = useHaptics();
  const hasTriggeredHaptic = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only enable pull-to-refresh when at top of scroll
    const target = e.currentTarget as HTMLElement;
    if (target.scrollTop <= 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
      hasTriggeredHaptic.current = false;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Apply resistance curve for natural feel
      const resistance = Math.min(diff * 0.5, maxPull);
      setPullDistance(resistance);

      // Trigger haptic when crossing threshold
      if (resistance >= threshold && !hasTriggeredHaptic.current) {
        lightTap();
        hasTriggeredHaptic.current = true;
      }
    }
  }, [isRefreshing, threshold, maxPull, lightTap]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Hold at threshold during refresh
      
      try {
        await onRefresh();
        success();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh, success]);

  const pullProgress = Math.min(pullDistance / threshold, 1);

  return {
    isRefreshing,
    pullDistance,
    pullProgress,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    }
  };
}
