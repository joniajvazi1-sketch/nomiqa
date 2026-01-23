import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

/**
 * OAuth Redirect Handler
 * 
 * This page serves as an intermediary for native OAuth:
 * 1. Supabase/Google redirects here with tokens in the URL hash
 * 2. We attempt to redirect to the deep link scheme (com.nomiqa.app://...)
 * 3. If deep link fails (user on wrong device), show manual return button
 * 4. On web: we handle session directly and navigate
 */
const OAuthRedirect = () => {
  const navigate = useNavigate();
  const [deepLinkAttempted, setDeepLinkAttempted] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Store token fragments in sessionStorage so we can remove them from the URL bar
  // (safer if the user copies/shares the URL) while still enabling the "Open Nomiqa App" button.
  const OAUTH_FRAGMENT_STORAGE_KEY = 'nomiqa_oauth_fragment';

  // More reliable deep link trigger using multiple methods
  const triggerDeepLink = (deepLinkUrl: string) => {
    console.log('[OAuthRedirect] Attempting deep link...');
    setDeepLinkAttempted(true);
    
    // Method 1: Try iframe first (more reliable on iOS Safari)
    try {
      if (iframeRef.current) {
        iframeRef.current.src = deepLinkUrl;
      }
    } catch (e) {
      console.log('[OAuthRedirect] iframe method failed');
    }
    
    // Method 2: Also try window.location after a small delay
    setTimeout(() => {
      try {
        window.location.href = deepLinkUrl;
      } catch (e) {
        console.log('[OAuthRedirect] location.href method failed');
      }
    }, 100);
    
    // Show fallback after delay
    setTimeout(() => setShowFallback(true), 2000);
  };

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      const search = window.location.search;

      console.log('[OAuthRedirect] Processing callback...');

      const urlParams = new URLSearchParams(search);
      const errorParam = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      const code = urlParams.get('code');

      if (errorParam) {
        console.error('[OAuthRedirect] OAuth error:', errorParam);
        setError(errorDescription || errorParam);
        setShowFallback(true);
        return;
      }

      // PKCE flow: provider redirects with ?code=... (no tokens in hash)
      if (code) {
        console.log('[OAuthRedirect] PKCE flow - exchanging code for tokens...');
        try {
          // Exchange code for a session (gives us access_token + refresh_token)
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;

          const accessToken = data?.session?.access_token;
          const refreshToken = data?.session?.refresh_token;

          if (!accessToken || !refreshToken) {
            throw new Error('Missing tokens after code exchange');
          }

          console.log('[OAuthRedirect] Tokens obtained, triggering deep link...');

          const params = new URLSearchParams();
          params.set('access_token', accessToken);
          params.set('refresh_token', refreshToken);

          // Store fragment for the manual fallback button.
          sessionStorage.setItem(OAUTH_FRAGMENT_STORAGE_KEY, params.toString());

          // Remove OAuth code from the address bar.
          window.history.replaceState(null, '', window.location.pathname);

          const deepLinkUrl = `com.nomiqa.app://oauth-callback#${params.toString()}`;
          triggerDeepLink(deepLinkUrl);
          return;
        } catch (err: any) {
          console.error('[OAuthRedirect] Code exchange failed:', err?.message);
          setError(err?.message || 'Failed to complete sign in');
          setShowFallback(true);
          return;
        }
      }

      // Implicit flow: tokens arrive in the hash
      if (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) {
        console.log('[OAuthRedirect] Implicit flow - tokens in hash');
        const fragment = hash.startsWith('#') ? hash.slice(1) : hash;

        // Store for fallback button + remove from URL bar
        try {
          sessionStorage.setItem(OAUTH_FRAGMENT_STORAGE_KEY, fragment);
          window.history.replaceState(null, '', window.location.pathname);
        } catch {
          // ignore storage errors
        }

        const deepLinkUrl = `com.nomiqa.app://oauth-callback#${fragment}`;
        triggerDeepLink(deepLinkUrl);
        return;
      }

      // No tokens and no code: check if a session already exists (web-only fallback)
      console.log('[OAuthRedirect] No tokens/code found, checking session...');
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          setError('Failed to complete sign in');
          setShowFallback(true);
          return;
        }

        if (session) {
          navigate('/app', { replace: true });
        } else {
          navigate('/app/auth', { replace: true });
        }
      } catch {
        setError('Authentication error');
        setShowFallback(true);
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  const handleReturnToApp = () => {
    const storedFragment = sessionStorage.getItem(OAUTH_FRAGMENT_STORAGE_KEY);
    const fragment = storedFragment || (window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash);

    if (fragment && (fragment.includes('access_token') || fragment.includes('refresh_token'))) {
      window.location.href = `com.nomiqa.app://oauth-callback#${fragment}`;
      return;
    }

    // Fallback: try to open app without tokens (user will need to retry)
    window.location.href = 'com.nomiqa.app://app/auth';
  };

  const handleWebLogin = async () => {
    // Try to set session from stored fragment tokens (web fallback)
    const storedFragment = sessionStorage.getItem(OAUTH_FRAGMENT_STORAGE_KEY);
    const fragment = storedFragment || (window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash);

    if (!fragment) return;

    const params = new URLSearchParams(fragment);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      try {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        navigate('/app/auth', { replace: true });
      } catch {
        setError('Failed to complete sign in');
      }
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

  if (showFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Sign in complete!</h2>
            <p className="text-sm text-muted-foreground">
              Tap the button below to return to the Nomiqa app.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <Button onClick={handleReturnToApp} className="w-full gap-2">
              <ExternalLink className="w-4 h-4" />
              Open Nomiqa App
            </Button>
            <Button variant="outline" onClick={handleWebLogin} className="w-full text-sm">
              Continue on web instead
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            If the app doesn't open, make sure Nomiqa is installed on this device.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* Hidden iframe for more reliable deep linking on iOS */}
      <iframe 
        ref={iframeRef} 
        style={{ display: 'none', width: 0, height: 0 }} 
        title="deep-link-trigger"
      />
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-muted animate-pulse" />
          <Loader2 className="w-8 h-8 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">
          Completing sign in...
        </p>
        {deepLinkAttempted && (
          <p className="text-xs text-muted-foreground/60">
            Opening Nomiqa app...
          </p>
        )}
      </div>
    </div>
  );
};

export default OAuthRedirect;
