import React from 'react';
import { Bell, BellOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface NotificationToggleProps {
  isEnabled: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown';
  onRequestPermission: () => Promise<boolean>;
  compact?: boolean;
}

export const NotificationToggle: React.FC<NotificationToggleProps> = ({
  isEnabled,
  permissionStatus,
  onRequestPermission,
  compact = false
}) => {
  const { lightTap, success } = useHaptics();
  const [loading, setLoading] = React.useState(false);

  const handleToggle = async () => {
    lightTap();
    setLoading(true);
    
    try {
      const granted = await onRequestPermission();
      if (granted) {
        success();
      }
    } finally {
      setLoading(false);
    }
  };

  if (permissionStatus === 'denied') {
    return (
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl',
        'bg-red-500/10 border border-red-500/20'
      )}>
        <BellOff className="w-5 h-5 text-red-400" />
        <div className="flex-1">
          <p className="text-sm text-foreground">Notifications Blocked</p>
          <p className="text-xs text-muted-foreground">Enable in device settings</p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        disabled={loading || isEnabled}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
          'border backdrop-blur-xl',
          isEnabled 
            ? 'bg-primary/20 border-primary/30 text-primary' 
            : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
        )}
      >
        {isEnabled ? (
          <>
            <Check className="w-4 h-4" />
            <span className="text-xs font-medium">Enabled</span>
          </>
        ) : (
          <>
            <Bell className="w-4 h-4" />
            <span className="text-xs font-medium">{loading ? 'Enabling...' : 'Enable'}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading || isEnabled}
      className={cn(
        'w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all',
        'bg-gradient-to-r backdrop-blur-xl border',
        isEnabled 
          ? 'from-primary/20 to-primary/10 border-primary/30' 
          : 'from-white/[0.03] to-white/[0.02] border-white/[0.08] hover:border-white/20'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center',
        isEnabled ? 'bg-primary/20' : 'bg-white/10'
      )}>
        {isEnabled ? (
          <Bell className="w-5 h-5 text-primary" />
        ) : (
          <BellOff className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex-1 text-left">
        <p className="text-sm font-medium text-foreground">
          {isEnabled ? 'Notifications Enabled' : 'Enable Notifications'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isEnabled 
            ? 'You\'ll receive achievement & streak alerts' 
            : 'Get notified about achievements & streaks'
          }
        </p>
      </div>
      
      {!isEnabled && (
        <div className={cn(
          'px-3 py-1.5 rounded-full text-xs font-medium',
          'bg-primary text-primary-foreground'
        )}>
          {loading ? 'Enabling...' : 'Enable'}
        </div>
      )}
      
      {isEnabled && (
        <Check className="w-5 h-5 text-primary" />
      )}
    </button>
  );
};
