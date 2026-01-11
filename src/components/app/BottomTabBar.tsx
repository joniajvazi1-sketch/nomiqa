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
        // Extend to absolute bottom of screen
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Glass background - extends to screen edge */}
      <div 
        className="absolute inset-0 bg-background/90 backdrop-blur-xl transform-gpu"
        style={{ transform: 'translateZ(0)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Tab content - fixed height with large tap targets */}
      <div className="relative flex items-stretch h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.path}
              onClick={() => handleTabPress(tab.path)}
              className={cn(
                // FULL tap area - entire column is pressable
                'relative flex-1 flex flex-col items-center justify-center',
                'touch-manipulation select-none',
                // Minimum touch target 48x48px per WCAG
                'min-h-[48px] min-w-[48px]',
                // Visual feedback
                'active:bg-white/5 active:scale-95 transform-gpu',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                transition: 'transform 0.1s ease-out, background-color 0.1s',
              }}
            >
              {/* Active glow effect */}
              {active && (
                <div className="absolute inset-2 rounded-2xl bg-primary/10 blur-lg" />
              )}
              
              {/* Icon with active background */}
              <div 
                className={cn(
                  'relative flex items-center justify-center w-12 h-10 rounded-xl transform-gpu',
                  active ? 'bg-primary/15' : 'bg-transparent'
                )}
                style={{ transition: 'background-color 0.15s' }}
              >
                <Icon 
                  className={cn(
                    'w-6 h-6 transform-gpu',
                    active && 'scale-105'
                  )} 
                  strokeWidth={active ? 2.5 : 1.75}
                  fill={active ? 'currentColor' : 'none'}
                  style={{ transition: 'transform 0.15s' }}
                />
              </div>
              
              {/* Label */}
              <span 
                className={cn(
                  'text-[10px] font-semibold mt-0.5 uppercase tracking-wide',
                  active ? 'opacity-100' : 'opacity-60'
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
