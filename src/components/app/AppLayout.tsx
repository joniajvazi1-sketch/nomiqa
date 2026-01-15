import React, { useEffect, useRef, useState } from 'react';
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

  // WebGL/canvas safety: avoid parent transforms on map/network routes
  const isMapRoute = location.pathname === '/app/map' || location.pathname === '/app/network';

  useEffect(() => {
    // Configure status bar for native app - translucent overlay style (Option A)
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
          
          if (isAndroid) {
            // Android: Transparent status bar + navigation bar, overlay content
            await StatusBar.setBackgroundColor({ color: '#00000000' });
            await StatusBar.setOverlaysWebView({ overlay: true });
          }
          // iOS: viewport-fit=cover in index.html handles this automatically
          
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

  return (
    <div 
      className={cn(
        // Use app-shell class for safe area handling via CSS
        "app-shell app-theme fixed inset-0 overflow-hidden transition-colors duration-300",
        isDark 
          ? "dark bg-gradient-to-b from-[hsl(220,40%,10%)] via-[hsl(220,40%,8%)] to-[hsl(220,45%,6%)]" 
          : "light bg-gradient-to-b from-[hsl(210,40%,98%)] via-[hsl(210,35%,96%)] to-[hsl(210,30%,94%)]"
      )}
    >
      {/* Scrollable content area - flex-1 fills remaining space */}
      <main 
        className={cn(
          "flex-1 overflow-x-hidden overscroll-none",
          isMapRoute ? "overflow-hidden" : "overflow-y-auto"
        )}
        style={{ 
          // Bottom padding: 64px tab bar height + safe area for home indicator
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
          // Smooth momentum scrolling on iOS (avoid on WebGL routes)
          WebkitOverflowScrolling: isMapRoute ? undefined : 'touch',
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
      
      {/* Bottom navigation - fixed to screen bottom, handles its own safe area */}
      <BottomTabBar />
    </div>
  );
};
