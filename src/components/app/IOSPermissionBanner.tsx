import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, AlertTriangle, ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IOSPermissionBannerProps {
  onRequestAlways: () => void;
  className?: string;
}

/**
 * Banner that shows when iOS has "While Using" but not "Always" permission
 * Warns user that background collection won't work and offers upgrade
 */
export const IOSPermissionBanner: React.FC<IOSPermissionBannerProps> = ({
  onRequestAlways,
  className
}) => {
  const [permissionStatus, setPermissionStatus] = useState<{
    foregroundGranted: boolean;
    backgroundGranted: boolean;
    isLoading: boolean;
  }>({
    foregroundGranted: false,
    backgroundGranted: false,
    isLoading: true
  });

  const isIOS = Capacitor.getPlatform() === 'ios';

  useEffect(() => {
    if (!isIOS) {
      setPermissionStatus({ foregroundGranted: true, backgroundGranted: true, isLoading: false });
      return;
    }

    const checkPermissions = async () => {
      try {
        const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
        const status = await BackgroundLocation.getPermissionStatus();
        
        setPermissionStatus({
          foregroundGranted: status.foregroundStatus === 'granted',
          backgroundGranted: status.backgroundStatus === 'granted',
          isLoading: false
        });
      } catch (error) {
        console.error('[IOSPermissionBanner] Failed to check permissions:', error);
        setPermissionStatus({ foregroundGranted: false, backgroundGranted: false, isLoading: false });
      }
    };

    checkPermissions();
    
    // Re-check when app resumes
    const handleResume = () => {
      checkPermissions();
    };
    
    // Listen for app state changes
    import('@capacitor/app').then(({ App }) => {
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) handleResume();
      });
    }).catch(console.error);
  }, [isIOS]);

  // Don't show on non-iOS or if still loading
  if (!isIOS || permissionStatus.isLoading) return null;

  // Don't show if we already have Always permission
  if (permissionStatus.backgroundGranted) return null;

  // Don't show if we don't even have foreground permission yet
  if (!permissionStatus.foregroundGranted) return null;

  // Show the upgrade banner
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "mx-4 rounded-xl overflow-hidden",
          className
        )}
      >
        <button
          onClick={onRequestAlways}
          className="w-full flex items-center gap-3 p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl backdrop-blur-md hover:bg-amber-500/30 transition-colors"
        >
          <div className="shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-amber-200">
              Background tracking limited
            </p>
            <p className="text-xs text-amber-300/70">
              Tap to enable "Always Allow" for locked-screen collection
            </p>
          </div>
          
          <ChevronRight className="w-5 h-5 text-amber-400 shrink-0" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Compact permission indicator for the globe overlay
 */
export const IOSPermissionIndicator: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => {
  const [hasAlways, setHasAlways] = useState<boolean | null>(null);
  const isIOS = Capacitor.getPlatform() === 'ios';

  useEffect(() => {
    if (!isIOS) {
      setHasAlways(true);
      return;
    }

    const checkPermissions = async () => {
      try {
        const BackgroundLocation = (await import('@/plugins/BackgroundLocationPlugin')).default;
        const status = await BackgroundLocation.getPermissionStatus();
        setHasAlways(status.backgroundStatus === 'granted');
      } catch {
        setHasAlways(null);
      }
    };

    checkPermissions();
  }, [isIOS]);

  // Don't render on non-iOS or if already has Always
  if (!isIOS || hasAlways === true || hasAlways === null) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 backdrop-blur-md hover:bg-amber-500/30 transition-colors"
    >
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
      <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
        While Using
      </span>
    </button>
  );
};

export default IOSPermissionBanner;
