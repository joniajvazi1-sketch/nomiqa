import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useTheme } from 'next-themes';
import { BottomTabBar } from './BottomTabBar';
import { PageTransition } from './PageTransition';
import { OfflineScreen } from './OfflineScreen';
import { SwipeablePages } from './SwipeablePages';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

// Type imports only - actual module loaded dynamically
type StatusBarModule = typeof import('@capacitor/status-bar');

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * iOS 26 / Android 16 Native App Layout
 * - Liquid Glass design language (iOS 26)
 * - Full edge-to-edge with system bar handling (Android 16 SDK 35+)
 * - Dynamic Island / punch-hole camera safe areas
 * - Floating navigation with proper content insets
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
  const [safeAreaReady, setSafeAreaReady] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // WebGL/canvas safety: avoid parent transforms on map/network routes
  const isMapRoute = location.pathname === '/app/map' || location.pathname === '/app/network';

  // Floating tab bar height + margin (52px bar + 8px bottom margin + safe area)
  const FLOATING_TAB_HEIGHT = 68;

  // iOS 26 / Android 16 viewport height fix
  // Uses dvh where available, falls back to --vh for legacy
  const setViewportHeight = useCallback(() => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    // Also set actual pixel height for calculations
    document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
  }, []);

  useEffect(() => {
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
    
    // Visual viewport API for keyboard/address bar changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setViewportHeight);
      window.visualViewport.addEventListener('scroll', setViewportHeight);
    }
    
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setViewportHeight);
        window.visualViewport.removeEventListener('scroll', setViewportHeight);
      }
    };
  }, [setViewportHeight]);

  // Scroll to top on route change
  useLayoutEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    // Configure status bar for iOS 26 / Android 16
    if (isNative) {
      const configureStatusBar = async () => {
        try {
          if (!statusBarRef.current) {
            statusBarRef.current = await import('@capacitor/status-bar');
          }
          const { StatusBar, Style } = statusBarRef.current;
          
          // Adaptive style based on theme
          await StatusBar.setStyle({ 
            style: isDark ? Style.Dark : Style.Light 
          });
          
          // Edge-to-edge: overlay mode for both platforms
          await StatusBar.setOverlaysWebView({ overlay: true });
          
          if (isAndroid) {
            // Android 16: Transparent system bars for full edge-to-edge
            await StatusBar.setBackgroundColor({ color: '#00000000' });
          }
          
          setSafeAreaReady(true);
        } catch (error) {
          console.warn('StatusBar configuration failed:', error);
          setSafeAreaReady(true);
        }
      };
      configureStatusBar();
    } else {
      setSafeAreaReady(true);
    }
  }, [isNative, isAndroid, isDark]);

  // Theme change handler
  useEffect(() => {
    if (isNative && statusBarRef.current) {
      const { StatusBar, Style } = statusBarRef.current;
      StatusBar.setStyle({ 
        style: isDark ? Style.Dark : Style.Light 
      }).catch(() => {});
    }
  }, [isDark, isNative]);

  if (isOffline) {
    return <OfflineScreen />;
  }

  return (
    <div 
      className={cn(
        // iOS 26 Liquid Glass / Android 16 edge-to-edge container
        "app-theme flex flex-col transition-colors duration-300",
        isDark 
          ? "dark bg-gradient-to-b from-[hsl(220,40%,10%)] via-[hsl(220,40%,8%)] to-[hsl(220,45%,6%)]" 
          : "light bg-gradient-to-b from-[hsl(210,40%,98%)] via-[hsl(210,35%,96%)] to-[hsl(210,30%,94%)]"
      )}
      style={{
        // Modern viewport units with fallback
        minHeight: 'calc(var(--vh, 1dvh) * 100)',
        height: 'calc(var(--vh, 1dvh) * 100)',
        // Safe areas for Dynamic Island (iOS) / punch-hole (Android)
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Scrollable content area */}
      <main 
        ref={mainRef}
        className={cn(
          "flex-1 overflow-x-hidden",
          isMapRoute ? "overflow-hidden" : "overflow-y-auto"
        )}
        style={{ 
          // Floating tab bar needs more bottom space
          paddingBottom: `calc(${FLOATING_TAB_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
          // iOS momentum scrolling
          WebkitOverflowScrolling: isMapRoute ? undefined : 'touch',
          // Contain overscroll
          overscrollBehavior: 'contain',
        }}
      >
        <SwipeablePages>
          <PageTransition
            key={location.pathname}
            variant={isMapRoute ? 'instant' : 'spring'}
            disableTransform={isMapRoute}
          >
            {children}
          </PageTransition>
        </SwipeablePages>
      </main>
      
      {/* iOS 26 Floating Tab Bar */}
      <BottomTabBar />
    </div>
  );
};
