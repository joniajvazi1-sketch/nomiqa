import { useEffect } from 'react';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to handle OAuth deep link callbacks in native apps
 * When Google OAuth completes, it redirects to com.nomiqa.app://app/auth#access_token=...
 * This hook catches that URL and extracts the session tokens
 */
export const useDeepLinkAuth = () => {
  useEffect(() => {
    // Only set up listener on native platforms
    if (!Capacitor.isNativePlatform()) return;

    const handleDeepLink = async (event: URLOpenListenerEvent) => {
      const url = event.url;
      console.log('[DeepLink] Received URL:', url);

      // Check if this is an OAuth callback with auth tokens
      // Format: com.nomiqa.app://app/auth#access_token=...&refresh_token=...
      if (url.includes('access_token') || url.includes('refresh_token')) {
        try {
          // Extract the fragment (everything after #)
          const urlObj = new URL(url);
          const fragment = urlObj.hash.substring(1); // Remove the # prefix
          
          // Parse the fragment as URL params
          const params = new URLSearchParams(fragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            console.log('[DeepLink] Setting session from OAuth callback');
            
            // Set the session using the tokens from the deep link
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('[DeepLink] Failed to set session:', error);
            } else {
              console.log('[DeepLink] Session set successfully:', data.user?.email);
            }
          }
        } catch (error) {
          console.error('[DeepLink] Error processing OAuth callback:', error);
        }
      }
    };

    // Add the deep link listener
    const listener = App.addListener('appUrlOpen', handleDeepLink);

    // Cleanup on unmount
    return () => {
      listener.then(l => l.remove());
    };
  }, []);
};
