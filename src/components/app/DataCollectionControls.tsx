import React, { useState, useEffect } from 'react';
import { Signal, Pause, Play, Battery, Zap, Clock, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { APP_COPY } from '@/utils/appCopy';

interface CollectionPreferences {
  collection_enabled: boolean;
  pause_until: string | null;
  battery_saver_mode: boolean;
  low_power_collection: boolean;
  send_usage_stats: boolean;
}

const defaultPreferences: CollectionPreferences = {
  collection_enabled: true,
  pause_until: null,
  battery_saver_mode: false,
  low_power_collection: false,
  send_usage_stats: true,
};

export const DataCollectionControls: React.FC = () => {
  const { toast } = useToast();
  const { mediumTap, lightTap } = useHaptics();
  const [preferences, setPreferences] = useState<CollectionPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [showPauseOptions, setShowPauseOptions] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_collection_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setPreferences({
          collection_enabled: data.collection_enabled ?? true,
          pause_until: data.pause_until,
          battery_saver_mode: data.battery_saver_mode ?? false,
          low_power_collection: data.low_power_collection ?? false,
          send_usage_stats: data.send_usage_stats ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (updates: Partial<CollectionPreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newPrefs = { ...preferences, ...updates };
      setPreferences(newPrefs);

      const { error } = await supabase
        .from('user_collection_preferences')
        .upsert({
          user_id: user.id,
          ...newPrefs,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    }
  };

  const handleToggleCollection = () => {
    mediumTap();
    if (preferences.collection_enabled) {
      // Show pause options
      setShowPauseOptions(true);
    } else {
      // Resume immediately
      savePreferences({ collection_enabled: true, pause_until: null });
      toast({ title: 'Data collection resumed', description: "You're earning points again!" });
    }
  };

  const handlePause = (duration: 'hour' | 'tomorrow' | 'indefinite') => {
    lightTap();
    setShowPauseOptions(false);
    
    let pauseUntil: string | null = null;
    let message = '';
    
    if (duration === 'hour') {
      const date = new Date();
      date.setHours(date.getHours() + 1);
      pauseUntil = date.toISOString();
      message = 'Paused for 1 hour';
    } else if (duration === 'tomorrow') {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      date.setHours(6, 0, 0, 0);
      pauseUntil = date.toISOString();
      message = 'Paused until tomorrow';
    } else {
      message = 'Paused indefinitely';
    }
    
    savePreferences({ collection_enabled: false, pause_until: pauseUntil });
    toast({ title: message, description: 'Tap anytime to resume earning' });
  };

  const handleToggleBatterySaver = () => {
    lightTap();
    savePreferences({ battery_saver_mode: !preferences.battery_saver_mode });
    toast({ 
      title: preferences.battery_saver_mode ? 'Battery saver off' : 'Battery saver on',
      description: preferences.battery_saver_mode ? 'Collecting anytime' : 'Only collecting when charging',
    });
  };

  const handleToggleLowPower = () => {
    lightTap();
    savePreferences({ low_power_collection: !preferences.low_power_collection });
    toast({ 
      title: preferences.low_power_collection ? 'Normal mode' : 'Low power mode',
      description: preferences.low_power_collection ? 'Full earning potential' : 'Reduced collection, lower earnings',
    });
  };

  if (loading) {
    return (
      <Card className="bg-card border-border animate-pulse">
        <CardContent className="p-4 h-24" />
      </Card>
    );
  }

  const isActive = preferences.collection_enabled;
  const isPausedWithTimer = !isActive && preferences.pause_until;

  return (
    <div className="space-y-3">
      {/* Main Collection Toggle */}
      <Card className={cn(
        "border transition-colors",
        isActive ? "bg-card border-border" : "bg-muted/50 border-amber-500/30"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isActive ? "bg-green-500/20" : "bg-amber-500/20"
              )}>
                {isActive ? (
                  <Signal className="w-5 h-5 text-green-500" />
                ) : (
                  <Pause className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {APP_COPY.settings.dataCollectionTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isActive 
                    ? APP_COPY.settings.dataCollectionOn 
                    : APP_COPY.settings.dataCollectionOff}
                </p>
              </div>
            </div>
            <Switch 
              checked={isActive} 
              onCheckedChange={handleToggleCollection}
            />
          </div>

          {/* Pause Options Dropdown */}
          {showPauseOptions && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              <p className="text-xs text-muted-foreground mb-2">Pause for how long?</p>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePause('hour')}
                  className="text-xs"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  1 hour
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePause('tomorrow')}
                  className="text-xs"
                >
                  Tomorrow
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePause('indefinite')}
                  className="text-xs"
                >
                  Indefinite
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPauseOptions(false)}
                className="w-full text-xs text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Pause Timer Display */}
          {isPausedWithTimer && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Auto-resume at</span>
                <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                  {new Date(preferences.pause_until!).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Battery Saver Toggle */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Battery className={cn(
                "w-5 h-5",
                preferences.battery_saver_mode ? "text-green-500" : "text-muted-foreground"
              )} />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {APP_COPY.settings.batterySaverTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {APP_COPY.settings.batterySaverDescription}
                </p>
              </div>
            </div>
            <Switch 
              checked={preferences.battery_saver_mode} 
              onCheckedChange={handleToggleBatterySaver}
            />
          </div>
        </CardContent>
      </Card>

      {/* Low Power Mode Toggle */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className={cn(
                "w-5 h-5",
                preferences.low_power_collection ? "text-amber-500" : "text-muted-foreground"
              )} />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {APP_COPY.settings.lowPowerTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {APP_COPY.settings.lowPowerDescription}
                </p>
              </div>
            </div>
            <Switch 
              checked={preferences.low_power_collection} 
              onCheckedChange={handleToggleLowPower}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Info */}
      <div className="flex items-start gap-2 px-1">
        <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          {APP_COPY.privacy.lowBattery} {APP_COPY.privacy.yourControl}
        </p>
      </div>
    </div>
  );
};

export default DataCollectionControls;
