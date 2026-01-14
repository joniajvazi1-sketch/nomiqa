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
 * Clean bottom navigation bar (4 tabs max)
 * Banking/Health app style - Home, Rewards, Shop, Profile
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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-14">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          const isRewardsTab = tab.path === '/app/rewards';
          
          return (
            <button
              key={tab.path}
              onClick={() => handleTabPress(tab.path)}
              aria-label={tab.label}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5',
                'touch-manipulation min-h-[44px]',
                'transition-colors duration-150',
                'active:bg-muted/50',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon 
                className={cn(
                  // Make Rewards icon slightly larger - core loop emphasis
                  isRewardsTab ? 'w-[22px] h-[22px]' : 'w-5 h-5'
                )}
                strokeWidth={active ? 2.5 : (isRewardsTab ? 2.2 : 2)}
              />
              <span className={cn(
                'text-[10px] transition-all duration-150',
                active ? 'font-semibold' : 'font-medium',
                isRewardsTab && !active && 'font-semibold'
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
