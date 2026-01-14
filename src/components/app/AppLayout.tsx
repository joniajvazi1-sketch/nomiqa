import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { BottomTabBar } from './BottomTabBar';
import { PageTransition } from './PageTransition';
import { OfflineScreen } from './OfflineScreen';
import { SwipeablePages } from './SwipeablePages';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Type imports only - actual module loaded dynamically
type StatusBarModule = typeof import('@capacitor/status-bar');

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Native App Layout - Used only when running as installed app
 * Edge-to-edge display with content flowing behind status bar
 * No header/footer, uses bottom tab navigation
 * Shows offline screen when no internet connection
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isNative = Capacitor.isNativePlatform();
  const isIOS = Capacitor.getPlatform() === 'ios';
  const location = useLocation();
  const statusBarRef = useRef<StatusBarModule | null>(null);
  const { isOffline } = useNetworkStatus();

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
          
          // Light content (white text/icons) for dark backgrounds
          await StatusBar.setStyle({ style: Style.Dark });
          
          if (isIOS) {
            // iOS: Let content flow behind status bar (handled by viewport-fit=cover)
            // Status bar will overlay content with translucent background
          } else {
            // Android: Make status bar transparent and overlay content
            await StatusBar.setBackgroundColor({ color: '#00000000' });
            await StatusBar.setOverlaysWebView({ overlay: true });
          }
        } catch (error) {
          console.warn('StatusBar configuration failed:', error);
        }
      };
      configureStatusBar();
    }
  }, [isNative, isIOS]);

  // Show offline screen when no internet connection
  if (isOffline) {
    return <OfflineScreen />;
  }

  return (
    <div className="app-theme fixed inset-0 flex flex-col overflow-hidden bg-background">
      {/* Scrollable content area with swipe support */}
      <main 
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none"
        style={{ 
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          // Bottom nav height (64px) + safe area
          paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))',
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
