import { useCallback, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

// Type imports only - actual module loaded dynamically
type HapticsModule = typeof import('@capacitor/haptics');
type ImpactStyleType = import('@capacitor/haptics').ImpactStyle;
type NotificationTypeType = import('@capacitor/haptics').NotificationType;

/**
 * Haptic feedback hook for native app interactions
 * Uses dynamic imports to avoid bundling Capacitor haptics on web
 */
export const useHaptics = () => {
  const hapticsRef = useRef<HapticsModule | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // Dynamically load haptics module only on native
  useEffect(() => {
    if (isNative && !hapticsRef.current) {
      import('@capacitor/haptics').then(mod => {
        hapticsRef.current = mod;
      }).catch(() => {
        // Haptics not available
      });
    }
  }, [isNative]);

  const impact = useCallback(async (style?: ImpactStyleType) => {
    if (!isNative || !hapticsRef.current) return;
    try {
      const { Haptics, ImpactStyle } = hapticsRef.current;
      await Haptics.impact({ style: style ?? ImpactStyle.Medium });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }, [isNative]);

  const notification = useCallback(async (type?: NotificationTypeType) => {
    if (!isNative || !hapticsRef.current) return;
    try {
      const { Haptics, NotificationType } = hapticsRef.current;
      await Haptics.notification({ type: type ?? NotificationType.Success });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }, [isNative]);

  const vibrate = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    try {
      await hapticsRef.current.Haptics.vibrate();
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }, [isNative]);

  const selectionStart = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    try {
      await hapticsRef.current.Haptics.selectionStart();
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }, [isNative]);

  const selectionChanged = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    try {
      await hapticsRef.current.Haptics.selectionChanged();
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }, [isNative]);

  const selectionEnd = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    try {
      await hapticsRef.current.Haptics.selectionEnd();
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }, [isNative]);

  // Quick access methods with dynamic style loading
  const lightTap = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    await impact(hapticsRef.current.ImpactStyle.Light);
  }, [isNative, impact]);

  const mediumTap = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    await impact(hapticsRef.current.ImpactStyle.Medium);
  }, [isNative, impact]);

  const heavyTap = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    await impact(hapticsRef.current.ImpactStyle.Heavy);
  }, [isNative, impact]);

  const success = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    await notification(hapticsRef.current.NotificationType.Success);
  }, [isNative, notification]);

  const warning = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    await notification(hapticsRef.current.NotificationType.Warning);
  }, [isNative, notification]);

  const error = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    await notification(hapticsRef.current.NotificationType.Error);
  }, [isNative, notification]);

  return {
    impact,
    notification,
    vibrate,
    selectionStart,
    selectionChanged,
    selectionEnd,
    lightTap,
    mediumTap,
    heavyTap,
    success,
    warning,
    error
  };
};
