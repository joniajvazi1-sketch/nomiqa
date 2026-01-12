import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationPreferences {
  daily_reminders: boolean;
  streak_warnings: boolean;
  referral_conversions: boolean;
  weekly_summaries: boolean;
  achievement_unlocks: boolean;
  push_enabled: boolean;
  reminder_time: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  daily_reminders: true,
  streak_warnings: true,
  referral_conversions: true,
  weekly_summaries: true,
  achievement_unlocks: true,
  push_enabled: false,
  reminder_time: '09:00'
};

interface UseNotificationPreferencesReturn {
  preferences: NotificationPreferences;
  loading: boolean;
  updatePreference: (key: keyof NotificationPreferences, value: boolean | string) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

export const useNotificationPreferences = (): UseNotificationPreferencesReturn => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          daily_reminders: data.daily_reminders,
          streak_warnings: data.streak_warnings,
          referral_conversions: data.referral_conversions,
          weekly_summaries: data.weekly_summaries,
          achievement_unlocks: data.achievement_unlocks,
          push_enabled: data.push_enabled,
          reminder_time: data.reminder_time || '09:00'
        });
      } else {
        // Create default preferences
        const { error: insertError } = await supabase
          .from('notification_preferences')
          .insert({ user_id: user.id, ...DEFAULT_PREFERENCES });
        
        if (insertError) console.error('Error creating preferences:', insertError);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = useCallback(async (
    key: keyof NotificationPreferences, 
    value: boolean | string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Optimistic update
      setPreferences(prev => ({ ...prev, [key]: value }));

      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) {
        // Revert on error
        setPreferences(prev => ({ ...prev, [key]: !value }));
        throw error;
      }
    } catch (error) {
      console.error('Error updating notification preference:', error);
    }
  }, []);

  return {
    preferences,
    loading,
    updatePreference,
    refreshPreferences: fetchPreferences
  };
};
