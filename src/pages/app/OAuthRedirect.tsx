import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

/**
 * OAuth Redirect Handler
 * 
 * This page handles OAuth callbacks for both web and native apps.
 * For native apps using deep links (com.nomiqa.app://oauth-callback),
 * this is used as a fallback when the web redirect is used.
 */
const OAuthRedirect = () => {
  const navigate = useNavigate();
  const [showFallback, setShowFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Completing sign in...');
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      const search = window.location.search;

      console.log('[OAuthRedirect] Processing callback...');
      console.log('[OAuthRedirect] Hash:', hash ? 'present' : 'none');
      console.log('[OAuthRedirect] Search:', search);

      const urlParams = new URLSearchParams(search);
      const errorParam = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      const code = urlParams.get('code');

      // Handle OAuth errors
      if (errorParam) {
        console.error('[OAuthRedirect] OAuth error:', errorParam, errorDescription);
        setError(errorDescription || errorParam);
        setShowFallback(true);
        return;
      }

      // PKCE flow: provider redirects with ?code=...
      if (code) {
        console.log('[OAuthRedirect] PKCE flow - exchanging code for session...');
        setStatusMessage('Exchanging authorization code...');
        
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('[OAuthRedirect] Code exchange failed:', exchangeError);
            throw exchangeError;
          }

          if (data?.session) {
            console.log('[OAuthRedirect] Session established successfully');
            setStatusMessage('Sign in successful!');
            
            // Small delay to show success message
            setTimeout(() => {
              navigate('/app', { replace: true });
            }, 500);
            return;
          }
          
          throw new Error('No session returned after code exchange');
        } catch (err: any) {
          console.error('[OAuthRedirect] Error:', err?.message);
          setError(err?.message || 'Failed to complete sign in');
          setShowFallback(true);
          return;
        }
      }

      // Implicit flow: tokens in hash fragment
      if (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) {
        console.log('[OAuthRedirect] Implicit flow - tokens in hash');
        setStatusMessage('Processing authentication...');
        
        try {
          // Parse tokens from hash
          const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
          const params = new URLSearchParams(fragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            // Set session with tokens
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) throw sessionError;

            console.log('[OAuthRedirect] Session set successfully');
            setStatusMessage('Sign in successful!');
            
            // Clear hash from URL for security
            window.history.replaceState(null, '', window.location.pathname);
            
            setTimeout(() => {
              navigate('/app', { replace: true });
            }, 500);
            return;
          }
        } catch (err: any) {
          console.error('[OAuthRedirect] Error setting session:', err);
          setError(err?.message || 'Failed to process authentication');
          setShowFallback(true);
          return;
        }
      }

      // No tokens or code - check existing session
      console.log('[OAuthRedirect] No tokens/code, checking existing session...');
      
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log('[OAuthRedirect] Existing session found');
          navigate('/app', { replace: true });
        } else {
          console.log('[OAuthRedirect] No session, redirecting to auth');
          navigate('/app/auth', { replace: true });
        }
      } catch (err) {
        console.error('[OAuthRedirect] Session check error:', err);
        navigate('/app/auth', { replace: true });
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  // Listen for deep link callbacks when app is in foreground (native only)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleDeepLink = async (event: { url: string }) => {
      console.log('[OAuthRedirect] Deep link received:', event.url);
      
      if (event.url.includes('oauth-callback')) {
        const url = new URL(event.url);
        const hash = url.hash;
        
        if (hash) {
          const params = new URLSearchParams(hash.slice(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            try {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              navigate('/app', { replace: true });
            } catch (err) {
              console.error('[OAuthRedirect] Deep link session error:', err);
              setError('Failed to complete sign in');
              setShowFallback(true);
            }
          }
        }
      }
    };

    const listener = App.addListener('appUrlOpen', handleDeepLink);
    
    return () => {
      listener.then(l => l.remove());
    };
  }, [navigate]);

  const handleRetryAuth = () => {
    navigate('/app/auth', { replace: true });
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
          <Button onClick={handleRetryAuth} className="w-full">
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
            <h2 className="text-lg font-semibold mb-2">Almost there!</h2>
            <p className="text-sm text-muted-foreground">
              Please return to the app to complete sign in.
            </p>
          </div>
          <Button onClick={handleRetryAuth} className="w-full">
            Return to Sign In
          </Button>
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
        <p className="text-sm text-muted-foreground animate-pulse">
          {statusMessage}
        </p>
      </div>
    </div>
  );
};

export default OAuthRedirect;
