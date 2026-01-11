import { useCallback, useRef, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

// Type imports only - actual module loaded dynamically
type HapticsModule = typeof import('@capacitor/haptics');
type ImpactStyleType = import('@capacitor/haptics').ImpactStyle;
type NotificationTypeType = import('@capacitor/haptics').NotificationType;

/**
 * Enhanced haptic feedback hook with distinct patterns for different events
 * Provides premium tactile feedback for native app interactions
 */
export const useEnhancedHaptics = () => {
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

  // Base impact function
  const impact = useCallback(async (style?: ImpactStyleType) => {
    if (!isNative || !hapticsRef.current) return;
    try {
      const { Haptics, ImpactStyle } = hapticsRef.current;
      await Haptics.impact({ style: style ?? ImpactStyle.Medium });
    } catch (error) {
      // Silently fail
    }
  }, [isNative]);

  // Base notification function
  const notification = useCallback(async (type?: NotificationTypeType) => {
    if (!isNative || !hapticsRef.current) return;
    try {
      const { Haptics, NotificationType } = hapticsRef.current;
      await Haptics.notification({ type: type ?? NotificationType.Success });
    } catch (error) {
      // Silently fail
    }
  }, [isNative]);

  // ===== ENHANCED PATTERN FUNCTIONS =====

  /**
   * Button tap - light feedback for standard buttons
   */
  const buttonTap = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    try {
      const { Haptics, ImpactStyle } = hapticsRef.current;
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {}
  }, [isNative]);

  /**
   * Selection changed - for toggles, switches, pickers
   */
  const selectionTap = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    try {
      await hapticsRef.current.Haptics.selectionChanged();
    } catch (error) {}
  }, [isNative]);

  /**
   * Success pattern - double tap for confirmations
   */
  const successPattern = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    try {
      const { Haptics, ImpactStyle } = hapticsRef.current;
      await Haptics.impact({ style: ImpactStyle.Light });
      await new Promise(resolve => setTimeout(resolve, 80));
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {}
  }, [isNative]);

  /**
   * Points earned - progressive vibration (light → medium → heavy)
   */
  const pointsEarnedPattern = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    try {
      const { Haptics, ImpactStyle } = hapticsRef.current;
      await Haptics.impact({ style: ImpactStyle.Light });
      await new Promise(resolve => setTimeout(resolve, 50));
      await Haptics.impact({ style: ImpactStyle.Medium });
      await new Promise(resolve => setTimeout(resolve, 50));
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {}
  }, [isNative]);

  /**
   * Achievement unlocked - celebration pattern
   */
  const achievementPattern = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    try {
      const { Haptics, NotificationType, ImpactStyle } = hapticsRef.current;
      await Haptics.notification({ type: NotificationType.Success });
      await new Promise(resolve => setTimeout(resolve, 150));
      await Haptics.impact({ style: ImpactStyle.Heavy });
      await new Promise(resolve => setTimeout(resolve, 100));
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {}
  }, [isNative]);

  /**
   * Error pattern - sharp warning buzz
   */
  const errorPattern = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    try {
      const { Haptics, NotificationType } = hapticsRef.current;
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {}
  }, [isNative]);

  /**
   * Warning pattern - attention-getting
   */
  const warningPattern = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    try {
      const { Haptics, NotificationType } = hapticsRef.current;
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {}
  }, [isNative]);

  /**
   * Add to cart pattern - satisfying confirmation
   */
  const addToCartPattern = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    try {
      const { Haptics, ImpactStyle } = hapticsRef.current;
      await Haptics.impact({ style: ImpactStyle.Medium });
      await new Promise(resolve => setTimeout(resolve, 100));
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {}
  }, [isNative]);

  /**
   * Navigation tap - subtle feedback for screen changes
   */
  const navigationTap = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    try {
      const { Haptics, ImpactStyle } = hapticsRef.current;
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {}
  }, [isNative]);

  /**
   * Pull-to-refresh threshold reached
   */
  const pullThresholdReached = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    try {
      const { Haptics, ImpactStyle } = hapticsRef.current;
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {}
  }, [isNative]);

  /**
   * Long press feedback
   */
  const longPressFeedback = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    try {
      const { Haptics, ImpactStyle } = hapticsRef.current;
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {}
  }, [isNative]);

  /**
   * Milestone reached - big celebration
   */
  const milestonePattern = useCallback(async () => {
    if (!isNative || !hapticsRef.current) return;
    try {
      const { Haptics, NotificationType, ImpactStyle } = hapticsRef.current;
      // Triple burst
      for (let i = 0; i < 3; i++) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        await new Promise(resolve => setTimeout(resolve, 80));
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {}
  }, [isNative]);

  return {
    // Base functions
    impact,
    notification,
    
    // Enhanced patterns
    buttonTap,
    selectionTap,
    successPattern,
    pointsEarnedPattern,
    achievementPattern,
    errorPattern,
    warningPattern,
    addToCartPattern,
    navigationTap,
    pullThresholdReached,
    longPressFeedback,
    milestonePattern,
  };
};
