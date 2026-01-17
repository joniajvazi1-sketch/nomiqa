import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Loader2 } from 'lucide-react';

/**
 * OAuth Redirect Handler
 * 
 * This page serves as an intermediary for native OAuth:
 * 1. Supabase/Google redirects here with tokens in the URL hash
 * 2. On native: we redirect to the deep link scheme (com.nomiqa.app://...)
 * 3. On web: we just let Supabase handle the session normally
 */
const OAuthRedirect = () => {
  useEffect(() => {
    const hash = window.location.hash;
    
    // If we have OAuth tokens in the hash, redirect to native deep link
    if (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) {
      // Construct the deep link URL with the hash fragment
      const deepLinkUrl = `com.nomiqa.app://app/auth${hash}`;
      
      // Redirect to the native app via deep link
      window.location.href = deepLinkUrl;
    } else {
      // No tokens - redirect to app auth
      window.location.href = '/app/auth';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-muted animate-pulse" />
          <Loader2 className="w-8 h-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          Completing sign in...
        </p>
        <p className="text-xs text-muted-foreground/60">
          Redirecting to the app...
        </p>
      </div>
    </div>
  );
};

export default OAuthRedirect;
