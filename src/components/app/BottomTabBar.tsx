import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, ShoppingBag, Wallet } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';

interface TabItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

const tabs: TabItem[] = [
  { path: '/app', icon: Home, label: 'Home' },
  { path: '/app/map', icon: Map, label: 'Map' },
  { path: '/app/shop', icon: ShoppingBag, label: 'Shop' },
  { path: '/app/wallet', icon: Wallet, label: 'Wallet' }
];

export const BottomTabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lightTap } = useHaptics();

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
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.path}
              onClick={() => handleTabPress(tab.path)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-all duration-200',
                'active:scale-95 touch-manipulation',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className={cn(
                'relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300',
                active && 'bg-primary/15'
              )}>
                <Icon className={cn(
                  'w-5 h-5 transition-all duration-200',
                  active && 'scale-110'
                )} />
                {active && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium mt-0.5 transition-all duration-200',
                active ? 'opacity-100' : 'opacity-70'
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
