import React, { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { BottomTabBar } from './BottomTabBar';
import { usePlatform } from '@/hooks/usePlatform';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Native App Layout - Used only when running as installed app
 * No header/footer, uses bottom tab navigation, handles safe areas
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isNative, isIOS } = usePlatform();

  useEffect(() => {
    // Configure status bar for native app
    if (isNative) {
      const configureStatusBar = async () => {
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
          if (!isIOS) {
            await StatusBar.setOverlaysWebView({ overlay: false });
          }
        } catch (error) {
          console.warn('StatusBar configuration failed:', error);
        }
      };
      configureStatusBar();
    }
  }, [isNative, isIOS]);

  return (
    <div 
      className="min-h-screen bg-background flex flex-col"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      {/* Main content area */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      
      {/* Bottom navigation */}
      <BottomTabBar />
    </div>
  );
};
