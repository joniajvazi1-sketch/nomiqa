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
 * Native App Layout - Modern edge-to-edge fullscreen design
 * Uses .app-shell class for safe area handling via CSS
 * Handles notch/cutout on iOS (Dynamic Island) and Android (punch-hole cameras)
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isNative = Capacitor.isNativePlatform();
  const isAndroid = Capacitor.getPlatform() === 'android';
  const location = useLocation();
  const statusBarRef = useRef<StatusBarModule | null>(null);
  const { isOffline } = useNetworkStatus();
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark' || theme === 'dark';
  const [safeAreaReady, setSafeAreaReady] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // WebGL/canvas safety: avoid parent transforms on map/network routes
  const isMapRoute = location.pathname === '/app/map' || location.pathname === '/app/network';

  // iOS viewport height fix - sets --vh CSS variable for reliable 100vh
  const setViewportHeight = useCallback(() => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }, []);

  useEffect(() => {
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
    
    // Also listen to visual viewport changes (keyboard, etc.)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setViewportHeight);
    }
    
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setViewportHeight);
      }
    };
  }, [setViewportHeight]);

  // Scroll to top on route change - critical for native app feel
  useLayoutEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    // Configure status bar for native app - translucent overlay style
    if (isNative) {
      const configureStatusBar = async () => {
        try {
          // Dynamically load StatusBar module
          if (!statusBarRef.current) {
            statusBarRef.current = await import('@capacitor/status-bar');
          }
          const { StatusBar, Style } = statusBarRef.current;
          
          // Set style based on theme - light icons on dark bg, dark icons on light bg
          await StatusBar.setStyle({ 
            style: isDark ? Style.Dark : Style.Light 
          });
          
          // CRITICAL: Both platforms need overlay mode for true edge-to-edge
          // iOS: Works with viewport-fit=cover + this setting
          // Android: Requires transparent background + overlay
          await StatusBar.setOverlaysWebView({ overlay: true });
          
          if (isAndroid) {
            // Android: Also needs transparent background color
            await StatusBar.setBackgroundColor({ color: '#00000000' });
          }
          
          setSafeAreaReady(true);
        } catch (error) {
          console.warn('StatusBar configuration failed:', error);
          setSafeAreaReady(true); // Continue anyway
        }
      };
      configureStatusBar();
    } else {
      setSafeAreaReady(true);
    }
  }, [isNative, isAndroid, isDark]);

  // Update status bar style when theme changes
  useEffect(() => {
    if (isNative && statusBarRef.current) {
      const { StatusBar, Style } = statusBarRef.current;
      StatusBar.setStyle({ 
        style: isDark ? Style.Dark : Style.Light 
      }).catch(() => {});
    }
  }, [isDark, isNative]);

  // Show offline screen when no internet connection
  if (isOffline) {
    return <OfflineScreen />;
  }

  // Tab bar height: 49pt (Apple HIG) + safe area
  const TAB_BAR_HEIGHT = 49;

  return (
    <div 
      className={cn(
        // Edge-to-edge fullscreen container
        "app-theme flex flex-col transition-colors duration-300",
        isDark 
          ? "dark bg-gradient-to-b from-[hsl(220,40%,10%)] via-[hsl(220,40%,8%)] to-[hsl(220,45%,6%)]" 
          : "light bg-gradient-to-b from-[hsl(210,40%,98%)] via-[hsl(210,35%,96%)] to-[hsl(210,30%,94%)]"
      )}
      style={{
        // Dynamic viewport height for iOS keyboard/address bar handling
        minHeight: 'calc(var(--vh, 1dvh) * 100)',
        height: 'calc(var(--vh, 1dvh) * 100)',
        // Safe area for notch (Dynamic Island) and edges
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Main scrollable content - single scroll container pattern */}
      <main 
        ref={mainRef}
        className={cn(
          "flex-1 overflow-x-hidden",
          isMapRoute ? "overflow-hidden" : "overflow-y-auto"
        )}
        style={{ 
          // Bottom padding: tab bar + home indicator safe area
          paddingBottom: `calc(${TAB_BAR_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
          // iOS momentum scrolling for native feel
          WebkitOverflowScrolling: isMapRoute ? undefined : 'touch',
          // Contain scroll bounce within this element
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
      
      {/* Fixed bottom navigation */}
      <BottomTabBar />
    </div>
  );
};
