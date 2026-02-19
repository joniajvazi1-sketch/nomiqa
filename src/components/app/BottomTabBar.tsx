import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Gift, ShoppingBag, User } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface TabItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

/**
 * Universal Bottom Tab Bar
 * Compatible: iOS 12-26, Android 7-16, all browsers
 * 
 * Design:
 * - Modern floating pill on iOS 15+/Android 12+ 
 * - Classic docked bar on older devices
 * - 48pt minimum touch targets (WCAG AAA)
 * - Graceful degradation for backdrop-blur
 */
export const BottomTabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lightTap } = useHaptics();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const isAndroid = Capacitor.getPlatform() === 'android';
  
  // Android: use calc() with env() + fallback for all nav styles (gesture, 2-button, 3-button)
  const ANDROID_NAV_FALLBACK = 48;

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
      className="fixed left-0 right-0 z-50"
      role="navigation"
      aria-label="Main navigation"
      style={{
        // CRITICAL: On Android, offset the entire nav ABOVE the system 3-button/gesture bar
        // env(safe-area-inset-bottom) is unreliable on Android WebViews, so use fixed fallback
        bottom: isAndroid 
          ? `max(env(safe-area-inset-bottom, ${ANDROID_NAV_FALLBACK}px), ${ANDROID_NAV_FALLBACK}px)`
          : '0px',
        paddingBottom: isAndroid 
          ? '8px'
          : 'max(env(safe-area-inset-bottom, 0px), constant(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 8px)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 8px)',
      }}
    >
      {/* Floating container with fallbacks */}
      <div 
        className="mx-auto"
        style={{ 
          maxWidth: '420px',
        }}
      >
        {/* Glass background with graceful degradation */}
        <div 
          className={cn(
            "relative overflow-hidden",
            // Rounded corners with fallback
            "rounded-3xl",
            // Shadow for depth - works on all devices
            "shadow-lg"
          )}
          style={{
            borderRadius: '24px',
            boxShadow: isDark 
              ? '0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)'
              : '0 4px 24px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.05)'
          }}
        >
          {/* Background layer - solid color fallback, then glass */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              // Solid background fallback (always visible)
              backgroundColor: 'var(--card)',
              // Then apply backdrop-blur where supported
              zIndex: 0,
            }}
          />
          {/* Glass overlay - theme aware */}
          <div 
            className="absolute inset-0 backdrop-blur-xl pointer-events-none"
            style={{
              backgroundColor: isDark 
                ? 'rgba(22, 30, 46, 0.9)' 
                : 'rgba(255, 255, 255, 0.92)',
              borderTop: isDark 
                ? '1px solid rgba(255,255,255,0.08)' 
                : '1px solid rgba(0,0,0,0.05)',
              zIndex: 1,
            }}
          />
          
          {/* Subtle border ring - theme aware */}
          <div 
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              border: isDark 
                ? '1px solid rgba(255,255,255,0.08)' 
                : '1px solid rgba(0,0,0,0.06)',
              borderRadius: '24px',
              zIndex: 2,
            }}
          />
          
          {/* Tab buttons - universal height that works everywhere */}
          <div 
            className="relative z-10 flex items-stretch"
            style={{ 
              height: '56px', // Fixed height for consistency
              minHeight: '56px'
            }}
          >
            {tabs.map((tab) => {
              const active = isActive(tab.path);
              const Icon = tab.icon;
              
              return (
                <button
                  key={tab.path}
                  onClick={() => handleTabPress(tab.path)}
                  aria-label={tab.label}
                  aria-current={active ? 'page' : undefined}
                  type="button"
                  className={cn(
                    // Flex layout - works on all browsers
                    'relative flex-1 flex flex-col items-center justify-center gap-1',
                    // Touch handling
                    'touch-manipulation select-none',
                    // Transitions with fallback
                    'transition-all duration-200',
                    // Active state feedback
                    'active:opacity-70'
                  )}
                  style={{
                    // Minimum touch target (48x48 WCAG AAA)
                    minHeight: '48px',
                    minWidth: '48px',
                    // Remove default button styles
                    WebkitTapHighlightColor: 'transparent',
                    outline: 'none',
                    border: 'none',
                    background: 'transparent',
                    // Cursor for web
                    cursor: 'pointer',
                    // Smooth transition
                    transition: 'transform 0.15s ease, opacity 0.15s ease'
                  }}
                >
                  {/* Active indicator background */}
                  {active && (
                    <div 
                      className="absolute rounded-2xl"
                      style={{
                        top: '6px',
                        bottom: '6px',
                        left: '8px',
                        right: '8px',
                        backgroundColor: 'hsl(var(--primary) / 0.12)',
                        borderRadius: '14px',
                        // Simple fade animation
                        animation: 'fadeIn 0.2s ease-out',
                        // Critical: never let decorative layers steal taps
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  
                  {/* Icon */}
                  <Icon 
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      width: active ? '22px' : '20px',
                      height: active ? '22px' : '20px',
                      strokeWidth: active ? 2.4 : 1.8,
                      color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      transition: 'all 0.15s ease'
                    }}
                  />
                  
                  {/* Label */}
                  <span 
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      fontSize: '10px',
                      lineHeight: '1.2',
                      fontWeight: active ? 600 : 500,
                      color: active ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      opacity: active ? 1 : 0.8,
                      transition: 'all 0.15s ease'
                    }}
                  >
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
