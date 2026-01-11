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
import { useTranslation } from '@/contexts/TranslationContext';

interface TabItem {
  path: string;
  icon: React.ElementType;
  labelKey: string;
}

export const BottomTabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lightTap } = useHaptics();
  const { t } = useTranslation();

  const tabs: TabItem[] = [
    { path: '/app', icon: Home, labelKey: 'app.nav.home' },
    { path: '/app/map', icon: Map, labelKey: 'app.nav.earn' },
    { path: '/app/shop', icon: ShoppingBag, labelKey: 'app.nav.shop' },
    { path: '/app/profile', icon: User, labelKey: 'app.nav.me' }
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
      className="fixed bottom-0 left-0 right-0 z-50 transform-gpu"
      style={{ 
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
      }}
    >
      {/* Glass background - GPU accelerated */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-2xl transform-gpu"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transform: 'translateZ(0)',
        }}
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
                'relative flex flex-col items-center justify-center flex-1 h-full',
                'active:scale-90 tap-instant transform-gpu',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground/80'
              )}
              style={{ 
                transition: 'transform 0.1s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.1s',
                willChange: 'transform',
              }}
            >
              {/* Active background glow */}
              {active && (
                <div 
                  className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-12 rounded-2xl bg-primary/10 blur-lg opacity-gpu"
                />
              )}
              
              {/* Icon container with GPU-accelerated transitions */}
              <div 
                className={cn(
                  'relative flex items-center justify-center w-14 h-14 rounded-2xl transform-gpu',
                  active ? 'bg-primary/15 shadow-lg shadow-primary/20' : 'bg-transparent'
                )}
                style={{ 
                  transition: 'background-color 0.15s, box-shadow 0.15s',
                }}
              >
                {/* LARGER icons: 26px, FILLED when active */}
                <Icon 
                  className={cn(
                    'w-[26px] h-[26px] transform-gpu',
                    active && 'scale-110'
                  )} 
                  strokeWidth={active ? 2.5 : 1.75}
                  fill={active ? 'currentColor' : 'none'}
                  style={{ 
                    transition: 'transform 0.15s cubic-bezier(0.32, 0.72, 0, 1)',
                  }}
                />
              </div>
              
              {/* Label with smooth opacity */}
              <span 
                className={cn(
                  'text-[10px] font-semibold mt-0.5 uppercase tracking-wider opacity-gpu',
                  active ? 'opacity-100' : 'opacity-50'
                )}
                style={{ transition: 'opacity 0.15s' }}
              >
                {t(tab.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
