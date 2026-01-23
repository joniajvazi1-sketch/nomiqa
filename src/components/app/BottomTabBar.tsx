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
 * iOS 26 Liquid Glass / Android 16 Floating Tab Bar
 * - Floating pill design with rounded corners (iOS 26 style)
 * - Liquid Glass material with variable opacity and refraction blur
 * - 52pt height for modern ergonomics
 * - Active glow indicator (not just pill background)
 * - Minimum 48pt touch targets (updated HIG)
 * - Supports Android 16 edge-to-edge + predictive back
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
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
      }}
    >
      {/* iOS 26 Floating Pill Container */}
      <div 
        className="pointer-events-auto mx-auto mb-2"
        style={{ maxWidth: '400px' }}
      >
        {/* Liquid Glass material - variable blur with refraction effect */}
        <div 
          className={cn(
            "relative rounded-[28px] overflow-hidden",
            // Multi-layer glass effect for depth
            "shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)]",
            // Subtle inner glow for "liquid" feel
            "ring-1 ring-white/10"
          )}
        >
          {/* Background glass layer */}
          <div 
            className={cn(
              "absolute inset-0",
              "bg-card/70 backdrop-blur-3xl",
              // Subtle gradient for refraction simulation
              "bg-gradient-to-b from-white/5 to-transparent"
            )}
          />
          
          {/* Tab buttons - 52pt modern height */}
          <div className="relative flex items-stretch" style={{ height: '52px' }}>
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
                    'transition-all duration-250 ease-out',
                    'active:scale-90',
                    // Minimum 48pt touch target (updated HIG for iOS 26/Android 16)
                    'min-h-[48px] min-w-[48px]'
                  )}
                  style={{
                    // Smooth spring-like transition
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  {/* Active glow indicator - iOS 26 liquid effect */}
                  {active && (
                    <div 
                      className={cn(
                        "absolute inset-2 rounded-2xl",
                        "bg-primary/15",
                        // Subtle glow underneath
                        "shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                      )}
                      style={{ 
                        animation: 'liquidFadeIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)' 
                      }}
                    />
                  )}
                  
                  <Icon 
                    className={cn(
                      'relative z-10 transition-all duration-250',
                      active ? 'w-[23px] h-[23px]' : 'w-[21px] h-[21px]',
                      active ? 'text-primary' : 'text-muted-foreground'
                    )}
                    strokeWidth={active ? 2.4 : 1.7}
                    style={{
                      // Subtle lift on active
                      transform: active ? 'translateY(-1px)' : 'translateY(0)',
                      transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  />
                  <span className={cn(
                    'relative z-10 text-[10px] leading-tight transition-all duration-250',
                    active 
                      ? 'font-semibold text-primary opacity-100' 
                      : 'font-medium text-muted-foreground opacity-80'
                  )}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
