import { useCallback, useEffect, useRef } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { supabase } from '@/integrations/supabase/client';

interface UseNotificationTriggersReturn {
  triggerDailyReminder: () => Promise<void>;
  triggerStreakWarning: (streakDays: number) => Promise<void>;
  triggerReferralConversion: (referredUsername: string) => Promise<void>;
  triggerWeeklySummary: (points: number, distance: number, rank: number) => Promise<void>;
  triggerAchievementUnlock: (title: string, reward: number) => Promise<void>;
  scheduleStreakReminder: () => void;
}

export const useNotificationTriggers = (): UseNotificationTriggersReturn => {
  const { isEnabled, sendLocalNotification, notifyAchievementUnlock, notifyStreakReminder } = usePushNotifications();
  const { preferences } = useNotificationPreferences();
  const reminderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if notifications should be sent
  const shouldNotify = useCallback((type: keyof typeof preferences): boolean => {
    if (!isEnabled || !preferences.push_enabled) return false;
    return preferences[type] as boolean;
  }, [isEnabled, preferences]);

  // Daily reminder notification
  const triggerDailyReminder = useCallback(async () => {
    if (!shouldNotify('daily_reminders')) return;

    const messages = [
      "📍 Ready to map today? Every scan helps build the network!",
      "🌍 Your data makes a difference. Start contributing now!",
      "⚡ Quick scan? It only takes a moment to earn points.",
      "🎯 Don't miss out on today's rewards. Open the app!"
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    await sendLocalNotification({
      title: '🗺️ Daily Contribution',
      body: randomMessage,
      data: { type: 'daily_reminder' }
    });
  }, [shouldNotify, sendLocalNotification]);

  // Streak warning notification
  const triggerStreakWarning = useCallback(async (streakDays: number) => {
    if (!shouldNotify('streak_warnings')) return;
    await notifyStreakReminder(streakDays);
  }, [shouldNotify, notifyStreakReminder]);

  // Referral conversion notification
  const triggerReferralConversion = useCallback(async (referredUsername: string) => {
    if (!shouldNotify('referral_conversions')) return;

    await sendLocalNotification({
      title: '🎉 New Referral!',
      body: `${referredUsername} just joined using your link! You'll earn commission on their purchases.`,
      data: { type: 'referral_conversion', referredUsername }
    });
  }, [shouldNotify, sendLocalNotification]);

  // Weekly summary notification
  const triggerWeeklySummary = useCallback(async (points: number, distance: number, rank: number) => {
    if (!shouldNotify('weekly_summaries')) return;

    const distanceKm = (distance / 1000).toFixed(1);
    
    await sendLocalNotification({
      title: '📊 Your Weekly Recap',
      body: `You earned ${points.toLocaleString()} pts, covered ${distanceKm}km, and ranked #${rank} this week!`,
      data: { type: 'weekly_summary', points, distance, rank }
    });
  }, [shouldNotify, sendLocalNotification]);

  // Achievement unlock notification
  const triggerAchievementUnlock = useCallback(async (title: string, reward: number) => {
    if (!shouldNotify('achievement_unlocks')) return;
    await notifyAchievementUnlock(title, reward);
  }, [shouldNotify, notifyAchievementUnlock]);

  // Schedule streak reminder for end of day
  const scheduleStreakReminder = useCallback(() => {
    if (!shouldNotify('streak_warnings')) return;
    
    // Clear existing timeout
    if (reminderTimeoutRef.current) {
      clearTimeout(reminderTimeoutRef.current);
    }

    // Schedule for 8 PM local time
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(20, 0, 0, 0);
    
    // If it's past 8 PM, schedule for tomorrow
    if (now > reminderTime) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const msUntilReminder = reminderTime.getTime() - now.getTime();

    reminderTimeoutRef.current = setTimeout(async () => {
      // Check if user has contributed today
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        const { data: todayLogs } = await supabase
          .from('signal_logs')
          .select('id')
          .eq('user_id', user.id)
          .gte('recorded_at', `${today}T00:00:00`)
          .limit(1);

        if (!todayLogs || todayLogs.length === 0) {
          // No contribution today, get streak and warn
          const { data: points } = await supabase
            .from('user_points')
            .select('contribution_streak_days')
            .eq('user_id', user.id)
            .single();

          if (points?.contribution_streak_days && points.contribution_streak_days > 0) {
            await notifyStreakReminder(points.contribution_streak_days);
          }
        }
      } catch (error) {
        console.error('Error checking streak:', error);
      }

      // Reschedule for next day
      scheduleStreakReminder();
    }, msUntilReminder);
  }, [shouldNotify, notifyStreakReminder]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (reminderTimeoutRef.current) {
        clearTimeout(reminderTimeoutRef.current);
      }
    };
  }, []);

  return {
    triggerDailyReminder,
    triggerStreakWarning,
    triggerReferralConversion,
    triggerWeeklySummary,
    triggerAchievementUnlock,
    scheduleStreakReminder
  };
};
