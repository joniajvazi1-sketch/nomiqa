import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

interface SwipeablePagesProps {
  children: React.ReactNode;
}

const TAB_ROUTES = ['/app', '/app/rewards', '/app/shop', '/app/profile'];

// Routes where swipe navigation should be DISABLED (map/globe interactions conflict)
const SWIPE_DISABLED_ROUTES = ['/app/map', '/app/network', '/app/challenges', '/app/leaderboard', '/app/achievements'];

/**
 * Swipeable wrapper for main app pages
 * Enables left/right swipe navigation between tabs.
 *
 * IMPORTANT (Capacitor/WKWebView/Android WebView): React onTouchMove handlers can
 * block vertical scrolling because they are treated as non-passive listeners.
 * We attach native touch listeners with { passive: true } to avoid scroll lock.
 */
export const SwipeablePages: React.FC<SwipeablePagesProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lightTap } = useHaptics();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const isVerticalScroll = useRef<boolean>(false);

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if we're on a route where swipe should be disabled
  const isSwipeDisabled = SWIPE_DISABLED_ROUTES.some((route) => location.pathname.includes(route));

  const getCurrentIndex = useCallback(() => {
    const currentPath = location.pathname;
    // Handle exact match for /app
    if (currentPath === '/app' || currentPath === '/app/') return 0;
    // Check other routes
    const index = TAB_ROUTES.findIndex((route, i) => i > 0 && currentPath.startsWith(route));
    return index >= 0 ? index : 0;
  }, [location.pathname]);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (isAnimating || isSwipeDisabled) return;
      if (!e.touches?.length) return;

      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchEndX.current = e.touches[0].clientX;
      isSwiping.current = false;
      isVerticalScroll.current = false;
    },
    [isAnimating, isSwipeDisabled]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isAnimating || isSwipeDisabled) return;
      if (!e.touches?.length) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - touchStartX.current;
      const diffY = currentY - touchStartY.current;

      // If the user has clearly started a vertical scroll, never treat this gesture as a swipe.
      // This is especially important on Android where non-perfectly-vertical drags are common.
      if (!isSwiping.current && !isVerticalScroll.current) {
        const isClearlyVertical = Math.abs(diffY) > 8 && Math.abs(diffY) > Math.abs(diffX) * 1.2;
        if (isClearlyVertical) {
          isVerticalScroll.current = true;
          setSwipeOffset(0);
          return;
        }

        // Only start swiping if the gesture is strongly horizontal.
        const isClearlyHorizontal = Math.abs(diffX) > 25 && Math.abs(diffX) > Math.abs(diffY) * 3.0;
        if (isClearlyHorizontal) {
          isSwiping.current = true;
        }
      }

      if (isVerticalScroll.current || !isSwiping.current) return;

      touchEndX.current = currentX;

      const currentIndex = getCurrentIndex();
      const isAtStart = currentIndex === 0 && diffX > 0;
      const isAtEnd = currentIndex === TAB_ROUTES.length - 1 && diffX < 0;

      if (isAtStart || isAtEnd) {
        setSwipeOffset(diffX * 0.3);
      } else {
        setSwipeOffset(diffX * 0.5);
      }
    },
    [isAnimating, isSwipeDisabled, getCurrentIndex]
  );

  const handleTouchEnd = useCallback(() => {
    // Always reset direction locks
    const wasSwiping = isSwiping.current;
    isSwiping.current = false;
    isVerticalScroll.current = false;

    if (!wasSwiping || isAnimating || isSwipeDisabled) {
      setSwipeOffset(0);
      return;
    }

    const diffX = touchEndX.current - touchStartX.current;
    const threshold = 80;
    const currentIndex = getCurrentIndex();

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && currentIndex > 0) {
        lightTap();
        setIsAnimating(true);
        navigate(TAB_ROUTES[currentIndex - 1]);
        setTimeout(() => setIsAnimating(false), 300);
      } else if (diffX < 0 && currentIndex < TAB_ROUTES.length - 1) {
        lightTap();
        setIsAnimating(true);
        navigate(TAB_ROUTES[currentIndex + 1]);
        setTimeout(() => setIsAnimating(false), 300);
      }
    }

    setSwipeOffset(0);
  }, [getCurrentIndex, isAnimating, isSwipeDisabled, lightTap, navigate]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Passive listeners so vertical scroll is never blocked.
    const opts: AddEventListenerOptions = { passive: true };

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
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={containerRef}
      // IMPORTANT: do NOT force a fixed height here.
      className="w-full min-h-full"
      style={{ touchAction: 'pan-y' }}
    >
      <div
        className={cn("w-full min-h-full", isAnimating && "transition-transform duration-300 ease-out")}
        style={{
          transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};

