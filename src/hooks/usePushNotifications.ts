import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isEnabled: boolean;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unknown';
  requestPermission: () => Promise<boolean>;
  sendLocalNotification: (payload: NotificationPayload) => Promise<void>;
  notifyAchievementUnlock: (title: string, reward: number) => Promise<void>;
  notifyStreakReminder: (streakDays: number) => Promise<void>;
  notifyMilestone: (milestone: string, points: number) => Promise<void>;
}

// Local storage key for notification preferences
const NOTIFICATION_PREF_KEY = 'nomiqa_notifications_enabled';

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const isNative = Capacitor.isNativePlatform();
      setIsSupported(isNative);
      
      if (isNative) {
        try {
          // Check current permission status
          const status = await PushNotifications.checkPermissions();
          setPermissionStatus(status.receive as 'prompt' | 'granted' | 'denied');
          setIsEnabled(status.receive === 'granted');
          
          // Load user preference
          const savedPref = localStorage.getItem(NOTIFICATION_PREF_KEY);
          if (savedPref !== null) {
            setIsEnabled(savedPref === 'true' && status.receive === 'granted');
          }
        } catch (error) {
          console.error('Error checking notification permissions:', error);
        }
      }
    };
    
    checkSupport();
  }, []);

  // Set up push notification listeners
  useEffect(() => {
    if (!isSupported) return;

    const setupListeners = async () => {
      // Handle registration success
      await PushNotifications.addListener('registration', (token: Token) => {
        console.log('Push registration success, token:', token.value);
      });

      // Handle registration errors
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
      });

      // Handle push notification received while app is in foreground
      await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
      });

      // Handle notification action (user tapped on notification)
      await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('Push notification action:', action);
      });
    };

    setupListeners();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [isSupported]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.log('Push notifications not supported on this platform');
      return false;
    }

    try {
      const status = await PushNotifications.requestPermissions();
      const granted = status.receive === 'granted';
      
      setPermissionStatus(status.receive as 'prompt' | 'granted' | 'denied');
      setIsEnabled(granted);
      localStorage.setItem(NOTIFICATION_PREF_KEY, granted.toString());
      
      if (granted) {
        await PushNotifications.register();
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  // Send a local notification
  const sendLocalNotification = useCallback(async (payload: NotificationPayload): Promise<void> => {
    if (!isSupported || !isEnabled) {
      console.log('Notifications not enabled, skipping:', payload.title);
      return;
    }

    try {
      // Check/request permission for local notifications
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        const requestResult = await LocalNotifications.requestPermissions();
        if (requestResult.display !== 'granted') {
          console.log('Local notification permission denied');
          return;
        }
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: payload.title,
            body: payload.body,
            schedule: { at: new Date(Date.now() + 100) }, // Immediate
            sound: 'default',
            smallIcon: 'ic_notification',
            largeIcon: 'ic_notification',
            extra: payload.data
          }
        ]
      });
      
      console.log('Local notification sent:', payload.title);
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }, [isSupported, isEnabled]);

  // Achievement unlock notification
  const notifyAchievementUnlock = useCallback(async (title: string, reward: number): Promise<void> => {
    await sendLocalNotification({
      title: '🏆 Achievement Unlocked!',
      body: `${title} - You earned ${reward} points!`,
      data: { type: 'achievement', reward }
    });
  }, [sendLocalNotification]);

  // Streak reminder notification
  const notifyStreakReminder = useCallback(async (streakDays: number): Promise<void> => {
    const messages = [
      `🔥 Don't lose your ${streakDays}-day streak! Scan today to keep it going.`,
      `⚡ Your ${streakDays}-day streak is at risk! Open the app to contribute.`,
      `🎯 Keep the momentum! You're on a ${streakDays}-day streak.`
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    await sendLocalNotification({
      title: '🔥 Streak Reminder',
      body: randomMessage,
      data: { type: 'streak_reminder', streakDays }
    });
  }, [sendLocalNotification]);

  // Milestone celebration notification
  const notifyMilestone = useCallback(async (milestone: string, points: number): Promise<void> => {
    await sendLocalNotification({
      title: '🎉 Milestone Reached!',
      body: `${milestone} - You've earned ${points.toLocaleString()} total points!`,
      data: { type: 'milestone', points }
    });
  }, [sendLocalNotification]);

  return {
    isSupported,
    isEnabled,
    permissionStatus,
    requestPermission,
    sendLocalNotification,
    notifyAchievementUnlock,
    notifyStreakReminder,
    notifyMilestone
  };
};
