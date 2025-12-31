import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Map, 
  ShoppingBag, 
  User,
  // Filled variants (using same icons with fill prop)
} from 'lucide-react';
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
  { path: '/app/profile', icon: User, label: 'Profile' }
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
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      {/* Glass background - extends fully to bottom edge including safe area */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      />
      <div 
        className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Tab content - icons have padding above home indicator */}
      <div 
        className="relative flex items-center justify-around h-[72px] px-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.path}
              onClick={() => handleTabPress(tab.path)}
              className={cn(
                'relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-200',
                'active:scale-90 active:opacity-70 touch-manipulation',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground/80'
              )}
            >
              {/* Active background glow */}
              {active && (
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-12 rounded-2xl bg-primary/10 blur-lg" />
              )}
              
              {/* Icon container with premium styling */}
              <div className={cn(
                'relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300',
                active ? 'bg-primary/15 shadow-lg shadow-primary/20' : 'bg-transparent'
              )}>
                {/* LARGER icons: 26px, FILLED when active via fill prop */}
                <Icon 
                  className={cn(
                    'w-[26px] h-[26px] transition-all duration-300',
                    active && 'scale-110'
                  )} 
                  strokeWidth={active ? 2.5 : 1.75}
                  fill={active ? 'currentColor' : 'none'}
                />
                
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary shadow-lg shadow-primary/50" />
                )}
              </div>
              
              {/* Label with fade effect */}
              <span className={cn(
                'text-[10px] font-semibold mt-0.5 transition-all duration-300 uppercase tracking-wider',
                active ? 'opacity-100' : 'opacity-50'
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
