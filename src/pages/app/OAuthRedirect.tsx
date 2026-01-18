import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hash = window.location.hash;
      const search = window.location.search;
      
      // Check for error in URL params (OAuth failure)
      const urlParams = new URLSearchParams(search);
      const errorParam = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      if (errorParam) {
        setError(errorDescription || errorParam);
        setShowFallback(true);
        return;
      }
      
      // Check if we have OAuth tokens in the hash
      if (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) {
        // Try to open the native app via deep link
        const deepLinkUrl = `com.nomiqa.app://oauth-callback${hash}`;
        
        // Attempt deep link redirect
        setDeepLinkAttempted(true);
        
        // Try to open the deep link
        window.location.href = deepLinkUrl;
        
        // If we're still here after a short delay, show fallback
        // This happens if the app isn't installed or deep link doesn't work
        setTimeout(() => {
          setShowFallback(true);
        }, 2500);
      } else {
        // No tokens in hash - check if Supabase can recover session
        // This happens when user completes OAuth and lands back here
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            setError('Failed to complete sign in');
            setShowFallback(true);
            return;
          }
          
          if (session) {
            // Session exists, redirect to app
            navigate('/app', { replace: true });
          } else {
            // No session and no tokens - redirect to auth
            navigate('/app/auth', { replace: true });
          }
        } catch (err) {
          setError('Authentication error');
          setShowFallback(true);
        }
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  const handleReturnToApp = () => {
    // Try deep link again
    const hash = window.location.hash;
    if (hash) {
      window.location.href = `com.nomiqa.app://oauth-callback${hash}`;
    } else {
      // Fallback: try to open app without tokens (user will need to retry)
      window.location.href = 'com.nomiqa.app://app/auth';
    }
  };

  const handleWebLogin = async () => {
    // Try to set session from hash tokens (web fallback)
    const hash = window.location.hash;
    if (hash) {
      const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
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
        } catch (err) {
          setError('Failed to complete sign in');
        }
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
