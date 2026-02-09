import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ExternalLink, AlertCircle, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

/**
 * OAuth Redirect Handler
 * 
 * This page handles OAuth callbacks. For native apps:
 * 1. Supabase redirects here with tokens in URL hash or code in query
 * 2. We extract tokens and trigger deep link to native app
 * 3. Native app receives tokens via deep link and establishes session
 */
const OAuthRedirect = () => {
  const navigate = useNavigate();
  const [showNativePrompt, setShowNativePrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Completing sign in...');
  const [tokens, setTokens] = useState<{ access: string; refresh: string } | null>(null);
  const hasProcessed = useRef(false);

  // Detect if user is on mobile (likely came from native app)
  const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      const search = window.location.search;

      console.log('[OAuthRedirect] Processing callback...');
      console.log('[OAuthRedirect] User agent:', navigator.userAgent);
      console.log('[OAuthRedirect] Is mobile:', isMobileDevice);

      const urlParams = new URLSearchParams(search);
      const errorParam = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      const code = urlParams.get('code');

      // Handle OAuth errors
      if (errorParam) {
        console.error('[OAuthRedirect] OAuth error:', errorParam, errorDescription);
        setError(errorDescription || errorParam);
        return;
      }

      // PKCE flow: provider redirects with ?code=...
      if (code) {
        console.log('[OAuthRedirect] PKCE flow - exchanging code...');
        setStatusMessage('Exchanging authorization code...');
        
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) throw exchangeError;

          if (data?.session) {
            const accessToken = data.session.access_token;
            const refreshToken = data.session.refresh_token;
            
            console.log('[OAuthRedirect] Session obtained');
            
            // Clear code from URL
            window.history.replaceState(null, '', window.location.pathname);
            
            // If on mobile, show prompt to return to app
            if (isMobileDevice) {
              setTokens({ access: accessToken, refresh: refreshToken });
              // Don't show prompt immediately - triggerDeepLink handles the delay
              triggerDeepLink(accessToken, refreshToken);
              return;
            }
            
            // On desktop/web, just navigate
            setStatusMessage('Sign in successful!');
            setTimeout(() => navigate('/app', { replace: true }), 500);
            return;
          }
          
          throw new Error('No session returned');
        } catch (err: any) {
          console.error('[OAuthRedirect] Error:', err?.message);
          setError(err?.message || 'Failed to complete sign in');
          return;
        }
      }

      // Implicit flow: tokens in hash fragment
      if (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) {
        console.log('[OAuthRedirect] Implicit flow - tokens in hash');
        
        const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          // Clear hash from URL for security
          window.history.replaceState(null, '', window.location.pathname);
          
          // If on mobile, show prompt to return to app
          if (isMobileDevice) {
            setTokens({ access: accessToken, refresh: refreshToken });
            // Don't show prompt immediately - triggerDeepLink handles the delay
            triggerDeepLink(accessToken, refreshToken);
            return;
          }
          
          // On web, set session directly
          try {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            setStatusMessage('Sign in successful!');
            setTimeout(() => navigate('/app', { replace: true }), 500);
          } catch (err: any) {
            setError(err?.message || 'Failed to set session');
          }
          return;
        }
      }

      // No tokens - check existing session
      console.log('[OAuthRedirect] No tokens, checking session...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        navigate('/app', { replace: true });
      } else {
        navigate('/app/auth', { replace: true });
      }
    };

    handleOAuthCallback();
  }, [navigate, isMobileDevice]);

  const triggerDeepLink = (accessToken: string, refreshToken: string) => {
    const params = new URLSearchParams();
    params.set('access_token', accessToken);
    params.set('refresh_token', refreshToken);
    
    const deepLinkUrl = `com.nomiqa.app://oauth-callback#${params.toString()}`;
    console.log('[OAuthRedirect] Triggering deep link...');
    
    // Try to open the app
    window.location.href = deepLinkUrl;
    
    // Show the native prompt after a delay to give the deep link time to process
    // On Android, deep links can take 1-2 seconds to resolve
    setTimeout(() => {
      setShowNativePrompt(true);
    }, 1500);
  };

  const handleOpenApp = () => {
    if (tokens) {
      triggerDeepLink(tokens.access, tokens.refresh);
    } else {
      window.location.href = 'com.nomiqa.app://app/auth';
    }
  };

  const handleContinueOnWeb = async () => {
    if (tokens) {
      try {
        await supabase.auth.setSession({
          access_token: tokens.access,
          refresh_token: tokens.refresh,
        });
        navigate('/app', { replace: true });
      } catch {
        navigate('/app/auth', { replace: true });
      }
    } else {
      navigate('/app/auth', { replace: true });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Sign in failed</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={() => navigate('/app/auth', { replace: true })} className="w-full">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (showNativePrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Sign in complete! ✅</h2>
            <p className="text-sm text-muted-foreground">
              Tap the button below to return to the Nomiqa app. If nothing happens, tap it again.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Button onClick={handleOpenApp} size="lg" className="w-full gap-2 text-base py-6">
              <Smartphone className="w-5 h-5" />
              Open Nomiqa App
            </Button>
            <Button variant="outline" onClick={handleContinueOnWeb} className="w-full text-sm">
              Continue on web instead
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            If the app doesn't open automatically, make sure Nomiqa is installed on your device.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-muted animate-pulse" />
          <Loader2 className="w-8 h-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">{statusMessage}</p>
      </div>
    </div>
  );
};

export default OAuthRedirect;
