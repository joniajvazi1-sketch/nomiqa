import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook to track app readiness state for native platforms
 * Handles Android WebView initialization delays
 */
export const useAppReady = () => {
  const [isReady, setIsReady] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    // For web, ready immediately
    if (!isNative) {
      setIsReady(true);
      return;
    }

    // For native, check if document is fully loaded
    const checkReady = () => {
      if (document.readyState === 'complete') {
        // Small delay to ensure WebView is stable
        requestAnimationFrame(() => {
          setIsReady(true);
        });
        return true;
      }
      return false;
    };

    if (checkReady()) return;

    // Listen for load event
    const handleLoad = () => {
      setIsReady(true);
    };

    window.addEventListener('load', handleLoad);

    // Timeout fallback - force ready after 5s
    // This prevents indefinite loading on problematic devices
    const timeout = setTimeout(() => {
      if (!isReady) {
        console.warn('App ready timeout - forcing initialization');
        setIsReady(true);
        setHasTimedOut(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('load', handleLoad);
      clearTimeout(timeout);
    };
  }, [isNative]);

  return { isReady, hasTimedOut, isNative };
};

/**
 * Check if WebView is in a healthy state
 * Returns false if there are signs of WebView issues
 */
export const checkWebViewHealth = (): boolean => {
  try {
    // Check if localStorage works (can fail in private mode or corrupted WebView)
    const testKey = '__wv_health_check__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);

    // Check if network APIs exist
    if (typeof fetch !== 'function') {
      console.error('fetch API not available');
      return false;
    }

    return true;
  } catch (err) {
    console.error('WebView health check failed:', err);
    return false;
  }
};
