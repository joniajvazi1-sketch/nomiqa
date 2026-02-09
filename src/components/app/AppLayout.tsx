import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useTheme } from 'next-themes';
import { BottomTabBar } from './BottomTabBar';
import { PageTransition } from './PageTransition';
import { OfflineScreen } from './OfflineScreen';
import { SwipeablePages } from './SwipeablePages';
import { FullscreenPortal } from './FullscreenPortal';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

// Type imports only - actual module loaded dynamically
type StatusBarModule = typeof import('@capacitor/status-bar');

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Universal Native App Layout
 * Compatible: iOS 12-26, Android 7-16 (API 24-35+)
 * 
 * Features:
 * - Edge-to-edge with graceful fallbacks
 * - Safe area handling for all device types
 * - Viewport height fixes for all browsers
 * - Reduced motion support
 * - RTL language support ready
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === 'android';
  const isIOS = Capacitor.getPlatform() === 'ios';
  const location = useLocation();
  const statusBarRef = useRef<StatusBarModule | null>(null);
  const { isOffline } = useNetworkStatus();
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark' || theme === 'dark';
  const mainRef = useRef<HTMLDivElement>(null);

  // Detect if user prefers reduced motion
  const prefersReducedMotion = typeof window !== 'undefined' 
    && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  // WebGL/canvas safety: avoid parent transforms on map/network routes
  const isMapRoute = location.pathname === '/app/map' || location.pathname === '/app/network';

  // Bottom navigation height (56px bar + 16px margin + safe area buffer)
  // Android needs extra padding since env() may not work consistently
  const BOTTOM_NAV_HEIGHT = isAndroid ? 88 : 72;
  
  // Android status bar height fallback (typically 24-32dp)
  const ANDROID_STATUS_BAR_HEIGHT = 32;

  // Universal viewport height fix
  // Works on: iOS Safari 12+, Chrome, Firefox, Samsung Internet, WebViews
  const setViewportHeight = useCallback(() => {
    // Use visualViewport if available (more accurate on mobile)
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const vhUnit = vh * 0.01;
    
    document.documentElement.style.setProperty('--vh', `${vhUnit}px`);
    document.documentElement.style.setProperty('--viewport-height', `${vh}px`);
    
    // Also set for legacy browsers
    document.documentElement.style.setProperty('--app-height', `${vh}px`);
  }, []);

  useEffect(() => {
    // Initial set
    setViewportHeight();
    
    // Standard resize events
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
    
    // Visual viewport API (keyboard, address bar)
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', setViewportHeight);
      vv.addEventListener('scroll', setViewportHeight);
    }
    
    // Fallback: periodic check for edge cases
    const intervalId = setInterval(setViewportHeight, 1000);
    
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
      if (vv) {
        vv.removeEventListener('resize', setViewportHeight);
        vv.removeEventListener('scroll', setViewportHeight);
      }
      clearInterval(intervalId);
    };
  }, [setViewportHeight]);

  // Scroll to top on route change
  useLayoutEffect(() => {
    // Use requestAnimationFrame for smoother scroll reset
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      window.scrollTo(0, 0);
    });
  }, [location.pathname]);

  // Status bar configuration with fallbacks
  // DEFERRED: Wait 500ms before configuring to let WebView stabilize on iOS
  useEffect(() => {
    if (!isNative) return;

    const configureStatusBar = async () => {
      try {
        if (!statusBarRef.current) {
          statusBarRef.current = await import('@capacitor/status-bar');
        }
        const { StatusBar, Style } = statusBarRef.current;
        
        // Set style based on theme
        await StatusBar.setStyle({ 
          style: isDark ? Style.Dark : Style.Light 
        }).catch(() => {});
        
        // Edge-to-edge overlay
        await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
        
        // Android: transparent background
        if (isAndroid) {
          await StatusBar.setBackgroundColor({ color: '#00000000' }).catch(() => {});
        }
      } catch (error) {
        // Silently fail - app still works without status bar config
        console.warn('StatusBar config skipped:', error);
      }
    };
    
    // Delay status bar config to prevent blocking initial render
    const timer = setTimeout(configureStatusBar, 300);
    return () => clearTimeout(timer);
  }, [isNative, isAndroid, isDark]);

  // Theme change handler
  useEffect(() => {
    if (!isNative || !statusBarRef.current) return;
    
    const { StatusBar, Style } = statusBarRef.current;
    StatusBar.setStyle({ 
      style: isDark ? Style.Dark : Style.Light 
    }).catch(() => {});
  }, [isDark, isNative]);

  // Offline screen
  if (isOffline) {
    return <OfflineScreen />;
  }

  return (
    <div 
      className={cn(
        "app-theme flex flex-col",
        // Theme-specific gradients
        isDark 
          ? "dark bg-gradient-to-b from-[hsl(220,40%,10%)] via-[hsl(220,40%,8%)] to-[hsl(220,45%,6%)]" 
          : "light bg-gradient-to-b from-[hsl(210,40%,98%)] via-[hsl(210,35%,96%)] to-[hsl(210,30%,94%)]",
        // Transition only if reduced motion not preferred
        !prefersReducedMotion && "transition-colors duration-300"
      )}
      style={{
        // CRITICAL: Use min-height only, NOT fixed height.
        // Fixed height prevents the scroll container from working on some devices.
        minHeight: 'calc(var(--vh, 1vh) * 100)',
        // Use 100% height to fill viewport but allow growth
        height: '100%',
        // Prevent body scroll - main handles scrolling
        overflow: 'hidden',
        
        // Safe areas with fallbacks
        // Android: use fixed fallback since env() is inconsistent on older WebViews
        // iOS: use env() with constant() fallback for older versions
        paddingTop: isAndroid 
          ? `${ANDROID_STATUS_BAR_HEIGHT}px` 
          : 'max(env(safe-area-inset-top, 0px), constant(safe-area-inset-top, 0px))',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), constant(safe-area-inset-left, 0px))',
        paddingRight: 'max(env(safe-area-inset-right, 0px), constant(safe-area-inset-right, 0px))',
      }}
    >
      {/* Main content area - native scroll for performance */}
      <main 
        ref={mainRef}
        className={cn(
          "flex-1 min-h-0",
          isMapRoute ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden",
          // Force hardware-accelerated scrolling layer
          !isMapRoute && "will-change-scroll"
        )}
        style={{ 
          // Bottom padding for floating nav
          // Android: use fixed padding since env() doesn't work reliably
          paddingBottom: isAndroid 
            ? `${BOTTOM_NAV_HEIGHT + 24}px`  // Extra 24px for Android nav bar
            : `calc(${BOTTOM_NAV_HEIGHT}px + max(env(safe-area-inset-bottom, 0px), constant(safe-area-inset-bottom, 0px)))`,
          // iOS momentum scrolling
          WebkitOverflowScrolling: isMapRoute ? undefined : 'touch',
          // Contain overscroll - important for Android scroll behavior
          overscrollBehavior: 'contain',
          // IMPORTANT: Do NOT use smooth scrolling - it causes jank and scroll lag
          // on Android devices, especially with heavy content like the home screen
          scrollBehavior: 'auto',
          // Android: ensure touch scrolling works properly
          touchAction: 'pan-y',
        }}
      >
        <SwipeablePages>
          <PageTransition
            key={location.pathname}
            variant={isMapRoute || prefersReducedMotion ? 'instant' : 'spring'}
            disableTransform={isMapRoute}
          >
            {children}
          </PageTransition>
        </SwipeablePages>
      </main>
      
      {/* Bottom navigation */}
      {/*
        IMPORTANT (iOS/WKWebView): rendering the fixed bottom nav via a portal prevents
        scroll-layer / stacking-context bugs where a momentum scrolling container can
        visually show the bar but intercept taps and/or shift its fixed positioning.
      */}
      <FullscreenPortal>
        <BottomTabBar />
      </FullscreenPortal>
    </div>
  );
};
