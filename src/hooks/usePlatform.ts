import { Capacitor } from '@capacitor/core';

/**
 * Platform detection hook for conditional rendering between web and native app
 * CRITICAL: This ensures website visitors see the standard website,
 * while native app users see the app-specific interface
 */
export const usePlatform = () => {
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();
  
  return {
    isNative,
    isWeb: !isNative,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    platform
  };
};

/**
 * Static check for use outside of React components
 */
export const isPlatformNative = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();
