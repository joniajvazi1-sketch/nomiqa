import React, { useState, useEffect } from 'react';
import { Signal, Pause, AlertTriangle, WifiOff, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { APP_COPY } from '@/utils/appCopy';

type StatusType = 'collecting' | 'paused' | 'no-gps' | 'permission-denied' | 'offline';

interface StatusConfig {
  icon: typeof Signal;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  action?: () => void;
}

export const StatusBanner: React.FC = () => {
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();
  const [status, setStatus] = useState<StatusType>('collecting');
  const [isCollectionEnabled, setIsCollectionEnabled] = useState(true);

  useEffect(() => {
    checkStatus();
  }, [isOnline]);

  const checkStatus = async () => {
    // Check network status first
    if (!isOnline) {
      setStatus('offline');
      return;
    }

    // Check collection preferences
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prefs } = await supabase
        .from('user_collection_preferences')
        .select('collection_enabled, pause_until')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prefs) {
        // Check if pause has expired
        if (!prefs.collection_enabled && prefs.pause_until) {
          const pauseUntil = new Date(prefs.pause_until);
          if (pauseUntil < new Date()) {
            // Auto-resume
            await supabase
              .from('user_collection_preferences')
              .update({ collection_enabled: true, pause_until: null })
              .eq('user_id', user.id);
            setIsCollectionEnabled(true);
            setStatus('collecting');
            return;
          }
        }
        
        setIsCollectionEnabled(prefs.collection_enabled ?? true);
        setStatus(prefs.collection_enabled ? 'collecting' : 'paused');
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const getStatusConfig = (): StatusConfig => {
    switch (status) {
      case 'collecting':
        return {
          icon: Signal,
          title: APP_COPY.status.collecting,
          subtitle: APP_COPY.status.collectingSubtext,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10 border-green-500/20',
        };
      case 'paused':
        return {
          icon: Pause,
          title: APP_COPY.status.paused,
          subtitle: APP_COPY.status.pausedCta,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10 border-amber-500/20',
          action: () => navigate('/app/profile?tab=settings'),
        };
      case 'no-gps':
        return {
          icon: MapPin,
          title: APP_COPY.status.noGps,
          subtitle: APP_COPY.status.noGpsHint,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10 border-amber-500/20',
        };
      case 'permission-denied':
        return {
          icon: AlertTriangle,
          title: APP_COPY.status.permissionDenied,
          subtitle: APP_COPY.status.permissionDeniedCta,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10 border-red-500/20',
          action: () => navigate('/app/profile?tab=settings'),
        };
      case 'offline':
        return {
          icon: WifiOff,
          title: APP_COPY.status.offline,
          subtitle: APP_COPY.status.offlineHint,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/50 border-border',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const isActionable = !!config.action;

  // Always show status (including collecting state per banking app spec)
  return (
    <button
      onClick={config.action}
      disabled={!isActionable}
      className={cn(
        "w-full rounded-xl border p-3 flex items-center gap-3 transition-all",
        config.bgColor,
        isActionable && "active:scale-[0.98] cursor-pointer",
        !isActionable && "cursor-default"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center",
        status === 'collecting' ? "bg-green-500/20" : "bg-current/10"
      )}>
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>
      <div className="flex-1 text-left">
        <p className={cn("text-sm font-medium", config.color)}>
          {config.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {config.subtitle}
        </p>
      </div>
      {isActionable && (
        <div className={cn("text-xs font-medium", config.color)}>
          Tap to fix →
        </div>
      )}
    </button>
  );
};

export default StatusBanner;
