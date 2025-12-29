import { Capacitor } from '@capacitor/core';

/**
 * Check for dev preview mode via URL parameter
 * Add ?appPreview=true to URL to see native app UI in browser
 */
const isAppPreviewMode = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('appPreview') === 'true';
  }
  return false;
};

/**
 * Platform detection hook for conditional rendering between web and native app
 * CRITICAL: This ensures website visitors see the standard website,
 * while native app users see the app-specific interface
 * 
 * DEV MODE: Add ?appPreview=true to URL to preview native app UI
 */
export const usePlatform = () => {
  const platform = Capacitor.getPlatform();
  const isActuallyNative = Capacitor.isNativePlatform();
  const isPreviewMode = isAppPreviewMode();
  
  // In preview mode, pretend we're native
  const isNative = isActuallyNative || isPreviewMode;
  
  return {
    isNative,
    isWeb: !isNative,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    platform,
    isPreviewMode // Expose this so components know it's simulated
  };
};

/**
 * Static check for use outside of React components
 */
export const isPlatformNative = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();
