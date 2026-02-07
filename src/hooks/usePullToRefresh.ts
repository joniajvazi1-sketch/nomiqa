import { useEffect, useRef, useState } from 'react';
import { useHaptics } from '@/hooks/useHaptics';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

const isScrollableY = (el: HTMLElement) => {
  const style = window.getComputedStyle(el);
  const overflowY = style.overflowY;
  return (
    (overflowY === 'auto' || overflowY === 'scroll') &&
    el.scrollHeight > el.clientHeight + 1
  );
};

const findScrollParent = (start: HTMLElement): HTMLElement => {
  let el: HTMLElement | null = start;
  while (el) {
    if (isScrollableY(el)) return el;
    el = el.parentElement;
  }
  return start;
};

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const startY = useRef<number>(0);
  const isPulling = useRef(false);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const hasTriggeredHaptic = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  const isMountedRef = useRef(true);

  const { lightTap, success } = useHaptics();

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const opts: AddEventListenerOptions = { passive: true };

    const handleTouchStart = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;
      if (!e.touches?.length) return;

      // IMPORTANT: In our app layout, the scroll container is often the parent <main>.
      // We resolve the actual scroll parent so "only at top" checks are correct.
      const scrollParent = findScrollParent(el);
      if (scrollParent.scrollTop > 0) return;

      startY.current = e.touches[0].clientY;
      isPulling.current = true;
      hasTriggeredHaptic.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshingRef.current) return;
      if (!e.touches?.length) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      // Only pull-down gestures
      if (diff <= 0) {
        if (pullDistanceRef.current !== 0) {
          pullDistanceRef.current = 0;
          setPullDistance(0);
        }
        return;
      }

      // Apply resistance curve for natural feel
      const resistance = Math.min(diff * 0.5, maxPull);
      pullDistanceRef.current = resistance;
      setPullDistance(resistance);

      if (resistance >= threshold && !hasTriggeredHaptic.current) {
        lightTap();
        hasTriggeredHaptic.current = true;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;
      isPulling.current = false;

      const distance = pullDistanceRef.current;

      if (distance >= threshold && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        pullDistanceRef.current = threshold;

        setIsRefreshing(true);
        setPullDistance(threshold);

        try {
          await onRefreshRef.current();
          success();
        } catch (error) {
          console.error('[usePullToRefresh] Refresh failed:', error);
        } finally {
          if (!isMountedRef.current) return;
          isRefreshingRef.current = false;
          pullDistanceRef.current = 0;
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    };

    el.addEventListener('touchstart', handleTouchStart, opts);
    el.addEventListener('touchmove', handleTouchMove, opts);
    el.addEventListener('touchend', handleTouchEnd, opts);
    el.addEventListener('touchcancel', handleTouchEnd, opts);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [lightTap, maxPull, success, threshold]);

  const pullProgress = Math.min(pullDistance / threshold, 1);

  return {
    isRefreshing,
    pullDistance,
    pullProgress,
    containerRef,
  };
}

