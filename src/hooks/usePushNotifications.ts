import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

// Type-only imports
type PushNotificationsModule = typeof import('@capacitor/push-notifications');
type LocalNotificationsModule = typeof import('@capacitor/local-notifications');

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
  
  // Refs to hold dynamically loaded modules
  const pushRef = useRef<PushNotificationsModule | null>(null);
  const localRef = useRef<LocalNotificationsModule | null>(null);

  // Check if push notifications are supported and load modules
  useEffect(() => {
    const checkSupport = async () => {
      const isNative = Capacitor.isNativePlatform();
      setIsSupported(isNative);
      
      if (isNative) {
        try {
          // Dynamically load modules
          pushRef.current = await import('@capacitor/push-notifications');
          localRef.current = await import('@capacitor/local-notifications');
          
          const { PushNotifications } = pushRef.current;
          
          // Check current permission status
          const status = await PushNotifications.checkPermissions();
          setPermissionStatus(status.receive as 'prompt' | 'granted' | 'denied');
          setIsEnabled(status.receive === 'granted');
          
          // Load user preference
          try {
            const savedPref = localStorage.getItem(NOTIFICATION_PREF_KEY);
            if (savedPref !== null) {
              setIsEnabled(savedPref === 'true' && status.receive === 'granted');
            }
          } catch (e) {
            // localStorage not available
          }
        } catch (error) {
          console.error('Error loading notification modules:', error);
        }
      }
    };
    
    checkSupport();
  }, []);

  // Set up push notification listeners
  useEffect(() => {
    if (!isSupported || !pushRef.current) return;

    const setupListeners = async () => {
      const { PushNotifications } = pushRef.current!;
      
      // Handle registration success
      await PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token:', token.value);
      });

      // Handle registration errors
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
      });

      // Handle push notification received while app is in foreground
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
      });

      // Handle notification action (user tapped on notification)
      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Push notification action:', action);
      });
    };

    setupListeners();

    return () => {
      pushRef.current?.PushNotifications.removeAllListeners();
    };
  }, [isSupported]);

  // Request notification permission.
  // IMPORTANT: We request LOCAL notification permission (no Firebase required)
  // and only attempt to register for PUSH if the FCM service is available.
  // Without google-services.json, calling PushNotifications.register() crashes
  // the Android app — so we wrap it in try/catch and never fail the user flow.
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.log('Notifications not supported on this platform');
      return false;
    }

    let granted = false;

    // 1) Local notifications (works without Firebase) — primary permission
    try {
      if (!localRef.current) {
        localRef.current = await import('@capacitor/local-notifications');
      }
      const { LocalNotifications } = localRef.current;
      const localStatus = await LocalNotifications.requestPermissions();
      granted = localStatus.display === 'granted';
      setPermissionStatus(granted ? 'granted' : 'denied');
      setIsEnabled(granted);
      try {
        localStorage.setItem(NOTIFICATION_PREF_KEY, granted.toString());
      } catch {
        // localStorage not available
      }
    } catch (error) {
      console.error('Error requesting local notification permission:', error);
      return false;
    }

    // 2) Push notifications (best-effort) — guarded so missing FCM never crashes
    if (granted && pushRef.current) {
      try {
        const { PushNotifications } = pushRef.current;
        await PushNotifications.requestPermissions();
        await PushNotifications.register();
      } catch (error) {
        // Expected when google-services.json / FCM is not configured.
        // Local notifications still work — do not surface this to the user.
        console.log('Push registration unavailable (FCM not configured):', error);
      }
    }

    return granted;
  }, [isSupported]);

  // Send a local notification
  const sendLocalNotification = useCallback(async (payload: NotificationPayload): Promise<void> => {
    if (!isSupported || !isEnabled || !localRef.current) {
      console.log('Notifications not enabled, skipping:', payload.title);
      return;
    }

    try {
      const { LocalNotifications } = localRef.current;
      
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
