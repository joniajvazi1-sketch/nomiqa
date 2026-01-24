import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// Dynamic import types
type GoogleAuthModule = typeof import('@codetrix-studio/capacitor-google-auth');

interface GoogleUser {
  email: string;
  familyName: string;
  givenName: string;
  id: string;
  imageUrl: string;
  name: string;
  authentication: {
    accessToken: string;
    idToken: string;
    refreshToken?: string;
  };
}

/**
 * Native Google Sign-In hook
 * Uses native SDK on mobile, falls back to web OAuth on browsers
 */
export const useNativeGoogleAuth = () => {
  const isNative = Capacitor.isNativePlatform();
  const googleAuthRef = useRef<GoogleAuthModule | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize native Google Auth on mount
  useEffect(() => {
    const initGoogleAuth = async () => {
      if (!isNative) {
        setIsInitialized(true);
        return;
      }

      try {
        googleAuthRef.current = await import('@codetrix-studio/capacitor-google-auth');
        
        // Initialize with your Google Client ID
        // The client ID is configured in native code (google-services.json / GoogleService-Info.plist)
        googleAuthRef.current.GoogleAuth.initialize({
          clientId: '', // Leave empty - uses native config
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
        
        setIsInitialized(true);
        console.log('[NativeGoogleAuth] Initialized successfully');
      } catch (error) {
        console.error('[NativeGoogleAuth] Init failed:', error);
        setIsInitialized(true); // Allow fallback
      }
    };

    initGoogleAuth();
  }, [isNative]);

  const signIn = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      if (isNative && googleAuthRef.current) {
        // Native Google Sign-In
        console.log('[NativeGoogleAuth] Starting native sign-in...');
        
        const user: GoogleUser = await googleAuthRef.current.GoogleAuth.signIn();
        console.log('[NativeGoogleAuth] Got user:', user.email);

        // Use the ID token to sign in with Supabase
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: user.authentication.idToken,
          access_token: user.authentication.accessToken,
        });

        if (error) {
          console.error('[NativeGoogleAuth] Supabase error:', error);
          return { success: false, error: error.message };
        }

        console.log('[NativeGoogleAuth] Signed in successfully');
        return { success: true };
      } else {
        // Web fallback - use existing OAuth flow
        console.log('[NativeGoogleAuth] Using web OAuth fallback');
        
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/app/oauth-redirect`,
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      }
    } catch (error: any) {
      console.error('[NativeGoogleAuth] Sign-in failed:', error);
      
      // Handle user cancellation gracefully
      if (error?.message?.includes('canceled') || error?.message?.includes('cancelled')) {
        return { success: false, error: 'Sign-in cancelled' };
      }
      
      return { success: false, error: error?.message || 'Sign-in failed' };
    } finally {
      setIsLoading(false);
    }
  }, [isNative]);

  const signOut = useCallback(async () => {
    try {
      if (isNative && googleAuthRef.current) {
        await googleAuthRef.current.GoogleAuth.signOut();
      }
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[NativeGoogleAuth] Sign-out error:', error);
    }
  }, [isNative]);

  const refresh = useCallback(async () => {
    if (isNative && googleAuthRef.current) {
      try {
        await googleAuthRef.current.GoogleAuth.refresh();
      } catch (error) {
        console.error('[NativeGoogleAuth] Refresh failed:', error);
      }
    }
  }, [isNative]);

  return {
    signIn,
    signOut,
    refresh,
    isInitialized,
    isLoading,
    isNative,
  };
};
