import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Gift, ShoppingBag, User } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

interface TabItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

/**
 * Modern iOS 18 / Android 15 Bottom Tab Bar
 * - 49pt standard height (Apple HIG) + safe area
 * - Subtle glassmorphism with premium blur
 * - Active indicator pill (iOS 18 style)
 * - Minimum 44pt touch targets
 */
export const BottomTabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lightTap } = useHaptics();

  const tabs: TabItem[] = [
    { path: '/app', icon: Home, label: 'Home' },
    { path: '/app/rewards', icon: Gift, label: 'Rewards' },
    { path: '/app/shop', icon: ShoppingBag, label: 'eSIMs' },
    { path: '/app/profile', icon: User, label: 'Profile' }
  ];

  const handleTabPress = (path: string) => {
    lightTap();
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app' || location.pathname === '/app/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Premium glassmorphism background */}
      <div className="absolute inset-0 bg-card/80 backdrop-blur-2xl border-t border-border/50" />
      
      {/* Tab buttons container - 49pt Apple HIG standard */}
      <div className="relative flex items-stretch" style={{ height: '49px' }}>
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.path}
              onClick={() => handleTabPress(tab.path)}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5',
                'touch-manipulation relative',
                'transition-all duration-200 ease-out',
                'active:scale-95 active:opacity-70',
                // Minimum 44pt touch target (Apple HIG)
                'min-h-[44px] min-w-[44px]'
              )}
            >
              {/* Active indicator - subtle pill behind icon (iOS 18 style) */}
              {active && (
                <div 
                  className="absolute inset-x-3 top-1 bottom-1 rounded-xl bg-primary/10"
                  style={{ 
                    animation: 'fadeIn 200ms ease-out' 
                  }}
                />
              )}
              
              <Icon 
                className={cn(
                  'relative z-10 transition-all duration-200',
                  active ? 'w-[22px] h-[22px]' : 'w-5 h-5',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={cn(
                'relative z-10 text-[10px] leading-tight transition-all duration-200',
                active 
                  ? 'font-semibold text-primary' 
                  : 'font-medium text-muted-foreground'
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
