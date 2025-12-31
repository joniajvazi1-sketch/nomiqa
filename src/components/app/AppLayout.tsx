import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { StatusBar, Style } from '@capacitor/status-bar';
import { BottomTabBar } from './BottomTabBar';
import { PageTransition } from './PageTransition';
import { usePlatform } from '@/hooks/usePlatform';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Native App Layout - Used only when running as installed app
 * Edge-to-edge display with content flowing behind status bar
 * No header/footer, uses bottom tab navigation
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isNative, isIOS } = usePlatform();
  const location = useLocation();

  useEffect(() => {
    // Configure status bar for native app - translucent overlay style
    if (isNative) {
      const configureStatusBar = async () => {
        try {
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

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Background that extends behind status bar */}
      <div 
        className="fixed inset-0 bg-background pointer-events-none"
        style={{ zIndex: -1 }}
      />
      
      {/* Status bar spacer - creates padding but allows background to show through */}
      <div 
        className="w-full shrink-0"
        style={{ height: 'env(safe-area-inset-top, 0px)' }}
      />
      
      {/* Main content area with page transition */}
      <main 
        className="flex-1 pb-20 overflow-y-auto"
        style={{ 
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)'
        }}
      >
        <PageTransition key={location.pathname}>
          {children}
        </PageTransition>
      </main>
      
      {/* Bottom navigation */}
      <BottomTabBar />
    </div>
  );
};
