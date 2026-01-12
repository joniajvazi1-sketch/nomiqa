import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Map, 
  ShoppingBag, 
  User,
  Copy,
  Zap,
  ShoppingCart,
  Settings,
  Share2
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useNativeShare } from '@/hooks/useNativeShare';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/contexts/TranslationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface TabItem {
  path: string;
  icon: React.ElementType;
  labelKey: string;
  longPressActions?: LongPressAction[];
}

interface LongPressAction {
  id: string;
  label: string;
  icon: React.ElementType;
  action: () => void;
}

export const BottomTabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lightTap } = useHaptics();
  const { successPattern, buttonTap } = useEnhancedHaptics();
  const { share, copyToClipboard } = useNativeShare();
  const { t } = useTranslation();
  
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  // Long press actions for each tab
  const handleCopyReferralLink = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('affiliate_code')
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .single();
        
        if (affiliate) {
          const link = `https://nomiqa.com?ref=${affiliate.affiliate_code}`;
          await copyToClipboard(link);
          successPattern();
          toast.success('Referral link copied!');
          return;
        }
      }
      toast.info('Sign in to get your referral link');
    } catch (e) {
      toast.error('Failed to copy link');
    }
  }, [copyToClipboard, successPattern]);

  const handleQuickScan = useCallback(() => {
    successPattern();
    navigate('/app/map');
  }, [navigate, successPattern]);

  const handleViewCart = useCallback(() => {
    successPattern();
    navigate('/app/checkout');
  }, [navigate, successPattern]);

  const handleShareApp = useCallback(async () => {
    await share({
      title: 'Nomiqa',
      text: 'Get global eSIMs and earn rewards!',
      url: 'https://nomiqa.com'
    });
  }, [share]);

  const tabs: TabItem[] = [
    { 
      path: '/app', 
      icon: Home, 
      labelKey: 'app.nav.home',
      longPressActions: [
        { id: 'quick-scan', label: 'Quick Scan', icon: Zap, action: handleQuickScan },
        { id: 'share', label: 'Share App', icon: Share2, action: handleShareApp },
      ]
    },
    { 
      path: '/app/map', 
      icon: Map, 
      labelKey: 'app.nav.earn'
    },
    { 
      path: '/app/shop', 
      icon: ShoppingBag, 
      labelKey: 'app.nav.shop',
      longPressActions: [
        { id: 'cart', label: 'View Cart', icon: ShoppingCart, action: handleViewCart },
      ]
    },
    { 
      path: '/app/profile', 
      icon: User, 
      labelKey: 'app.nav.me',
      longPressActions: [
        { id: 'copy-link', label: 'Copy Referral', icon: Copy, action: handleCopyReferralLink },
        { id: 'settings', label: 'Settings', icon: Settings, action: () => navigate('/app/profile?tab=settings') },
      ]
    }
  ];

  const handleTabPress = (path: string) => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    lightTap();
    navigate(path);
    setActivePopup(null);
  };

  const handleTouchStart = (path: string, hasActions: boolean) => {
    if (!hasActions) return;
    
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      buttonTap();
      setActivePopup(path);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleActionClick = (action: () => void) => {
    action();
    setActivePopup(null);
  };

  const isActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app' || location.pathname === '/app/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Backdrop for popup */}
      <AnimatePresence>
        {activePopup && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePopup(null)}
          />
        )}
      </AnimatePresence>

      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 transform-gpu"
        style={{ 
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Glass background */}
        <div 
          className="absolute inset-0 bg-background/90 backdrop-blur-xl transform-gpu"
          style={{ transform: 'translateZ(0)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        {/* Tab content */}
        <div className="relative flex items-stretch h-16">
          {tabs.map((tab) => {
            const active = isActive(tab.path);
            const Icon = tab.icon;
            const hasActions = tab.longPressActions && tab.longPressActions.length > 0;
            
            return (
              <div key={tab.path} className="relative flex-1">
                {/* Long press popup */}
                <AnimatePresence>
                  {activePopup === tab.path && tab.longPressActions && (
                    <motion.div
                      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50"
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[140px]">
                        {tab.longPressActions.map((action, idx) => {
                          const ActionIcon = action.icon;
                          return (
                            <button
                              key={action.id}
                              onClick={() => handleActionClick(action.action)}
                              className={cn(
                                'flex items-center gap-3 w-full px-4 py-3 text-sm font-medium',
                                'hover:bg-muted/50 active:bg-muted transition-colors text-left',
                                idx > 0 && 'border-t border-border/50'
                              )}
                            >
                              <ActionIcon className="w-4 h-4 text-muted-foreground" />
                              <span>{action.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-r border-b border-border rotate-45 -mt-1.5" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => handleTabPress(tab.path)}
                  onTouchStart={() => handleTouchStart(tab.path, !!hasActions)}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={() => handleTouchStart(tab.path, !!hasActions)}
                  onMouseUp={handleTouchEnd}
                  onMouseLeave={handleTouchEnd}
                  aria-label={t(tab.labelKey)}
                  className={cn(
                    'relative w-full h-full flex flex-col items-center justify-center',
                    'touch-manipulation select-none',
                    'min-h-[48px] min-w-[48px]',
                    'active:bg-white/5 active:scale-95 transform-gpu',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'transform 0.1s ease-out, background-color 0.1s',
                  }}
                >
                  {/* Active glow */}
                  {active && (
                    <div className="absolute inset-2 rounded-2xl bg-primary/10 blur-lg" />
                  )}
                  
                  {/* Icon container */}
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
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
};
