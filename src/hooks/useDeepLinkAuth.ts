import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

/**
 * Handles OAuth deep link callbacks in the native apps.
 * We intentionally avoid logging the full URL because it can contain auth tokens.
 */
export const useDeepLinkAuth = () => {
  const navigate = useNavigate();
  const lastHandledUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleDeepLink = async (event: URLOpenListenerEvent) => {
      const url = event.url || '';

      // Expected format: com.nomiqa.app://app/auth#access_token=...&refresh_token=...
      if (!url.includes('access_token') && !url.includes('refresh_token')) return;

      // Ignore duplicate callbacks (some providers fire multiple events)
      if (lastHandledUrlRef.current === url) return;
      lastHandledUrlRef.current = url;

      try {
        const urlObj = new URL(url);
        const fragment = urlObj.hash.startsWith('#') ? urlObj.hash.slice(1) : urlObj.hash;
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken || !refreshToken) return;

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        // Close the system browser (if it is still open)
        try {
          await Browser.close();
        } catch {
          // ignore
        }

        // Even if setSession errors, route user to in-app auth screen
        navigate('/app/auth', { replace: true });

        if (error) {
          // Keep logs minimal (no token leakage)
          console.warn('[DeepLink] OAuth session failed');
        }
      } catch {
        // Keep logs minimal (no token leakage)
        console.warn('[DeepLink] OAuth callback parse failed');
      }
    };

    const listener = App.addListener('appUrlOpen', handleDeepLink);

    return () => {
      listener.then((l) => l.remove());
      lastHandledUrlRef.current = null;
    };
  }, [navigate]);
};
