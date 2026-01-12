import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, ShoppingBag, User } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/TranslationContext';

interface TabItem {
  path: string;
  icon: React.ElementType;
  labelKey: string;
}

/**
 * Clean, professional bottom navigation bar
 * No animations, no long-press popups - just simple, fast navigation
 */
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
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.path}
              onClick={() => handleTabPress(tab.path)}
              aria-label={t(tab.labelKey)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1',
                'touch-manipulation min-h-[48px]',
                'active:opacity-70 transition-opacity',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon 
                className="w-5 h-5" 
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={cn(
                'text-[10px] font-medium',
                active ? 'text-primary' : 'text-muted-foreground'
              )}>
                {t(tab.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
