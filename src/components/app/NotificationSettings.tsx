import React from 'react';
import { Bell, BellRing, Calendar, Trophy, Users, BarChart3, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useNotificationPreferences, NotificationPreferences } from '@/hooks/useNotificationPreferences';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { Capacitor } from '@capacitor/core';

interface NotificationSettingItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}

const NotificationSettingItem: React.FC<NotificationSettingItemProps> = ({
  icon,
  title,
  description,
  enabled,
  onToggle,
  disabled = false
}) => {
  return (
    <div className={cn(
      'flex items-center justify-between py-3 transition-opacity',
      disabled && 'opacity-50'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center',
          enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
        )}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch 
        checked={enabled} 
        onCheckedChange={onToggle}
        disabled={disabled}
      />
    </div>
  );
};

export const NotificationSettings: React.FC = () => {
  const { preferences, loading, updatePreference } = useNotificationPreferences();
  const { isSupported, isEnabled, permissionStatus, requestPermission } = usePushNotifications();
  const { selectionTap, successPattern } = useEnhancedHaptics();

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    selectionTap();
    await updatePreference(key, value);
    if (value) successPattern();
  };

  const handleEnablePush = async () => {
    selectionTap();
    
    // If permission was previously denied, guide user to OS settings
    if (permissionStatus === 'denied') {
      // On native, open app settings
      if (Capacitor.isNativePlatform()) {
        try {
          const { App } = await import('@capacitor/app');
          // There's no direct "open settings" in Capacitor core,
          // but re-requesting will show "go to settings" on iOS/Android
          const granted = await requestPermission();
          if (granted) {
            await updatePreference('push_enabled', true);
            successPattern();
          }
        } catch (e) {
          console.error('[NotificationSettings] Failed to open settings:', e);
        }
      }
      return;
    }
    
    // Request permission (shows native OS popup if status is 'prompt')
    const granted = await requestPermission();
    if (granted) {
      await updatePreference('push_enabled', true);
      successPattern();
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="w-10 h-5 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const pushDisabled = !isSupported || !isEnabled;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <p className="text-xs text-muted-foreground">Manage your notification preferences</p>
          </div>
        </div>

        {/* Push Notifications Master Toggle */}
        {isSupported && (
          <div className="mb-4 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center',
                  isEnabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    {permissionStatus === 'denied' 
                      ? 'Blocked in settings' 
                      : isEnabled 
                        ? 'Enabled' 
                        : 'Enable to receive alerts'}
                  </p>
                </div>
              </div>
              <Switch 
                  checked={isEnabled}
                  onCheckedChange={(checked) => {
                    if (checked && !isEnabled) {
                      handleEnablePush();
                    }
                  }}
                />
            </div>
            {permissionStatus === 'denied' && (
              <p className="text-xs text-destructive mt-2 ml-12">
                Notifications are blocked. Tap the toggle to re-request or enable in your device settings.
              </p>
            )}
          </div>
        )}

        {/* Individual Notification Types */}
        <div className="space-y-1 divide-y divide-border/50">
          <NotificationSettingItem
            icon={<Calendar className="w-4 h-4" />}
            title="Daily Reminders"
            description="Get reminded to contribute"
            enabled={preferences.daily_reminders}
            onToggle={(v) => handleToggle('daily_reminders', v)}
            disabled={pushDisabled}
          />

          <NotificationSettingItem
            icon={<Clock className="w-4 h-4" />}
            title="Streak Warnings"
            description="Alert when streak is at risk"
            enabled={preferences.streak_warnings}
            onToggle={(v) => handleToggle('streak_warnings', v)}
            disabled={pushDisabled}
          />

          <NotificationSettingItem
            icon={<Trophy className="w-4 h-4" />}
            title="Achievement Unlocks"
            description="Celebrate your milestones"
            enabled={preferences.achievement_unlocks}
            onToggle={(v) => handleToggle('achievement_unlocks', v)}
            disabled={pushDisabled}
          />

          <NotificationSettingItem
            icon={<Users className="w-4 h-4" />}
            title="Referral Conversions"
            description="Know when friends join"
            enabled={preferences.referral_conversions}
            onToggle={(v) => handleToggle('referral_conversions', v)}
            disabled={pushDisabled}
          />

          <NotificationSettingItem
            icon={<BarChart3 className="w-4 h-4" />}
            title="Weekly Summaries"
            description="Your weekly activity recap"
            enabled={preferences.weekly_summaries}
            onToggle={(v) => handleToggle('weekly_summaries', v)}
            disabled={pushDisabled}
          />
        </div>

        {pushDisabled && isSupported && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Enable push notifications to customize alerts
          </p>
        )}
      </CardContent>
    </Card>
  );
};
