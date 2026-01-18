import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

/**
 * Handles OAuth deep link callbacks in the native apps.
 * Supports multiple callback URL patterns:
 * - com.nomiqa.app://oauth-callback#access_token=...
 * - com.nomiqa.app://app/auth#access_token=...
 * 
 * We intentionally avoid logging the full URL because it can contain auth tokens.
 */
export const useDeepLinkAuth = () => {
  const navigate = useNavigate();
  const lastHandledUrlRef = useRef<string | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleDeepLink = async (event: URLOpenListenerEvent) => {
      const url = event.url || '';

      // Prevent double-processing
      if (processingRef.current) return;
      
      // Check for OAuth tokens in the URL (can be in hash or as part of URL)
      const hasTokens = url.includes('access_token') || url.includes('refresh_token');
      if (!hasTokens) return;

      // Ignore duplicate callbacks (some providers fire multiple events)
      if (lastHandledUrlRef.current === url) return;
      lastHandledUrlRef.current = url;
      processingRef.current = true;

      console.log('[DeepLink] OAuth callback received');

      try {
        // Parse the URL to extract tokens
        // URL format: com.nomiqa.app://oauth-callback#access_token=...&refresh_token=...
        // or: com.nomiqa.app://app/auth#access_token=...&refresh_token=...
        let fragment = '';
        
        // Try to extract hash fragment
        const hashIndex = url.indexOf('#');
        if (hashIndex !== -1) {
          fragment = url.substring(hashIndex + 1);
        }
        
        // If no hash, try query params (some OAuth flows use this)
        if (!fragment) {
          const queryIndex = url.indexOf('?');
          if (queryIndex !== -1) {
            fragment = url.substring(queryIndex + 1);
          }
        }

        if (!fragment) {
          console.warn('[DeepLink] No token fragment found in callback URL');
          processingRef.current = false;
          return;
        }

        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken || !refreshToken) {
          console.warn('[DeepLink] Missing required tokens');
          processingRef.current = false;
          return;
        }

        console.log('[DeepLink] Setting session from tokens...');
        
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        // Close the system browser (if it is still open)
        try {
          await Browser.close();
        } catch {
          // Browser might already be closed
        }

        if (error) {
          console.warn('[DeepLink] Failed to set session:', error.message);
          navigate('/app/auth', { replace: true });
        } else {
          console.log('[DeepLink] Session set successfully, navigating to app...');
          // Navigate to auth page which will detect the session and proceed
          navigate('/app/auth', { replace: true });
        }
      } catch (err) {
        console.warn('[DeepLink] OAuth callback error');
        navigate('/app/auth', { replace: true });
      } finally {
        processingRef.current = false;
      }
    };

    // Listen for deep link events
    const listener = App.addListener('appUrlOpen', handleDeepLink);

    // Also check if the app was opened with a URL (cold start)
    App.getLaunchUrl().then((result) => {
      if (result?.url) {
        handleDeepLink({ url: result.url });
      }
    });

    return () => {
      listener.then((l) => l.remove());
      lastHandledUrlRef.current = null;
      processingRef.current = false;
    };
  }, [navigate]);
};
