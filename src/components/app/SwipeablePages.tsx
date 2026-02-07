import React, { useCallback, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

interface SwipeablePagesProps {
  children: React.ReactNode;
}

const TAB_ROUTES = ['/app', '/app/rewards', '/app/shop', '/app/profile'];

// Routes where swipe navigation should be DISABLED (map/globe interactions conflict)
const SWIPE_DISABLED_ROUTES = ['/app/map', '/app/network'];

/**
 * Swipeable wrapper for main app pages
 * Enables left/right swipe navigation between tabs
 * DISABLED on map/globe routes to prevent conflicts with pinch-zoom/drag
 */
export const SwipeablePages: React.FC<SwipeablePagesProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lightTap } = useHaptics();
  
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if we're on a route where swipe should be disabled
  const isSwipeDisabled = SWIPE_DISABLED_ROUTES.some(route => 
    location.pathname.includes(route)
  );

  const getCurrentIndex = useCallback(() => {
    const currentPath = location.pathname;
    // Handle exact match for /app
    if (currentPath === '/app' || currentPath === '/app/') return 0;
    // Check other routes
    const index = TAB_ROUTES.findIndex((route, i) => 
      i > 0 && currentPath.startsWith(route)
    );
    return index >= 0 ? index : 0;
  }, [location.pathname]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimating || isSwipeDisabled) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    isSwiping.current = false;
  }, [isAnimating, isSwipeDisabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isAnimating || isSwipeDisabled) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;
    
    // Only track horizontal swipes (more horizontal than vertical)
    if (!isSwiping.current && Math.abs(diffX) > 10) {
      if (Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        isSwiping.current = true;
      }
    }
    
    if (isSwiping.current) {
      touchEndX.current = currentX;
      // Apply resistance at edges
      const currentIndex = getCurrentIndex();
      const isAtStart = currentIndex === 0 && diffX > 0;
      const isAtEnd = currentIndex === TAB_ROUTES.length - 1 && diffX < 0;
      
      if (isAtStart || isAtEnd) {
        setSwipeOffset(diffX * 0.3); // Reduced movement at edges
      } else {
        setSwipeOffset(diffX * 0.5); // Partial follow during swipe
      }
    }
  }, [isAnimating, getCurrentIndex]);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping.current || isAnimating || isSwipeDisabled) {
      setSwipeOffset(0);
      return;
    }

    const diffX = touchEndX.current - touchStartX.current;
    const threshold = 80; // Minimum swipe distance
    const currentIndex = getCurrentIndex();
    
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0 && currentIndex > 0) {
        // Swipe right - go to previous tab
        lightTap();
        setIsAnimating(true);
        navigate(TAB_ROUTES[currentIndex - 1]);
        setTimeout(() => setIsAnimating(false), 300);
      } else if (diffX < 0 && currentIndex < TAB_ROUTES.length - 1) {
        // Swipe left - go to next tab
        lightTap();
        setIsAnimating(true);
        navigate(TAB_ROUTES[currentIndex + 1]);
        setTimeout(() => setIsAnimating(false), 300);
      }
    }
    
    setSwipeOffset(0);
    isSwiping.current = false;
  }, [isAnimating, getCurrentIndex, lightTap, navigate]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      // IMPORTANT: do NOT force a fixed height here.
      // `h-full` prevents the parent (<main>) scroll container from growing,
      // which breaks vertical scrolling on long pages (Shop/Challenges/etc.).
      className="w-full min-h-full"
      style={{ touchAction: 'pan-y' }}
    >
      <div
        className={cn(
          "w-full min-h-full",
          isAnimating && "transition-transform duration-300 ease-out"
        )}
        style={{
          transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};

