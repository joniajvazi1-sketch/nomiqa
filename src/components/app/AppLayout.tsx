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
 * Native App Layout - Used only when running as installed app
 * Edge-to-edge display with content flowing behind status bar
 * Handles notch/cutout on iOS (Dynamic Island) and Samsung (punch-hole cameras)
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isNative = Capacitor.isNativePlatform();
  const isIOS = Capacitor.getPlatform() === 'ios';
  const isAndroid = Capacitor.getPlatform() === 'android';
  const location = useLocation();
  const statusBarRef = useRef<StatusBarModule | null>(null);
  const { isOffline } = useNetworkStatus();
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark' || theme === 'dark';
  const [safeAreaReady, setSafeAreaReady] = useState(false);

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
          
          // Set style based on theme
          await StatusBar.setStyle({ 
            style: isDark ? Style.Dark : Style.Light 
          });
          
          if (isAndroid) {
            // Android: Make status bar & navigation bar transparent, overlay content
            await StatusBar.setBackgroundColor({ color: '#00000000' });
            await StatusBar.setOverlaysWebView({ overlay: true });
          }
          // iOS: viewport-fit=cover handles this automatically
          
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
  }, [isNative, isIOS, isAndroid, isDark]);

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
        "app-theme fixed inset-0 flex flex-col overflow-hidden transition-colors duration-300",
        isDark 
          ? "dark bg-gradient-to-b from-[hsl(220,40%,10%)] via-[hsl(220,40%,8%)] to-[hsl(220,45%,6%)]" 
          : "light bg-gradient-to-b from-[hsl(210,40%,98%)] via-[hsl(210,35%,96%)] to-[hsl(210,30%,94%)]"
      )}
      style={{
        // Ensure content respects device safe areas
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Scrollable content area with swipe support */}
      <main 
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none"
        style={{ 
          // Bottom padding accounts for tab bar + safe area
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
          // Smooth momentum scrolling on iOS
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <SwipeablePages>
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </SwipeablePages>
      </main>
      
      {/* Bottom navigation - fixed to screen bottom */}
      <BottomTabBar />
    </div>
  );
};
