import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, ShoppingBag, User, Users, Gift } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TabItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

/**
 * Premium bottom navigation bar with animations
 * 6 tabs: Home, Earn, Invite, Rewards, Shop, Me
 */
export const BottomTabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lightTap } = useHaptics();

  const tabs: TabItem[] = [
    { path: '/app', icon: Home, label: 'Home' },
    { path: '/app/map', icon: Map, label: 'Earn' },
    { path: '/app/invite', icon: Users, label: 'Invite' },
    { path: '/app/rewards', icon: Gift, label: 'Rewards' },
    { path: '/app/shop', icon: ShoppingBag, label: 'Shop' },
    { path: '/app/profile', icon: User, label: 'Me' }
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
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Subtle top glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="flex items-stretch h-14">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          
          return (
            <motion.button
              key={tab.path}
              onClick={() => handleTabPress(tab.path)}
              aria-label={tab.label}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5',
                'touch-manipulation min-h-[44px]',
                'transition-colors duration-200',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-all duration-200",
                    active && "text-glow"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                {/* Active indicator dot */}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={cn(
                'text-[10px] transition-all duration-200',
                active ? 'font-semibold text-primary' : 'font-medium text-muted-foreground'
              )}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
