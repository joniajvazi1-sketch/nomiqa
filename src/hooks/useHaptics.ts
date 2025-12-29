import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { usePlatform } from './usePlatform';

/**
 * Haptic feedback hook for native app interactions
 */
export const useHaptics = () => {
  const { isNative } = usePlatform();

  const impact = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  };

  const notification = async (type: NotificationType = NotificationType.Success) => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type });
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  };

  const vibrate = async () => {
    if (!isNative) return;
    try {
      await Haptics.vibrate();
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  };

  const selectionStart = async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionStart();
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  };

  const selectionChanged = async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionChanged();
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  };

  const selectionEnd = async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionEnd();
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  };

  return {
    impact,
    notification,
    vibrate,
    selectionStart,
    selectionChanged,
    selectionEnd,
    // Quick access
    lightTap: () => impact(ImpactStyle.Light),
    mediumTap: () => impact(ImpactStyle.Medium),
    heavyTap: () => impact(ImpactStyle.Heavy),
    success: () => notification(NotificationType.Success),
    warning: () => notification(NotificationType.Warning),
    error: () => notification(NotificationType.Error)
  };
};
