import { Capacitor } from '@capacitor/core';
import { useMemo } from 'react';

/**
 * Check for dev preview mode via URL parameter
 * Add ?appPreview=true to URL to see native app UI in browser
 * SECURITY: Only works on localhost or Lovable staging - blocked on production
 */
const isAppPreviewMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  
  // Allow preview on: localhost, 127.0.0.1, *.lovableproject.com (staging)
  // Block on production domains (e.g., nomiqa.io)
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isLovableStaging = hostname.endsWith('.lovableproject.com');
  
  if (!isLocalhost && !isLovableStaging) return false;
  
  // Check both search params and hash (in case of hash routing)
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  return urlParams.get('appPreview') === 'true' || hashParams.get('appPreview') === 'true';
};

// Store preview mode at module level to persist across re-renders
// This is set once when the app loads
let cachedPreviewMode: boolean | null = null;

const getPreviewMode = (): boolean => {
  if (cachedPreviewMode === null) {
    cachedPreviewMode = isAppPreviewMode();
    if (cachedPreviewMode) {
      console.log('[usePlatform] App Preview Mode ENABLED');
    }
  }
  return cachedPreviewMode;
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
  const isPreviewMode = useMemo(() => getPreviewMode(), []);
  
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
export const isPlatformNative = () => Capacitor.isNativePlatform() || getPreviewMode();
export const getPlatform = () => Capacitor.getPlatform();
