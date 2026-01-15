import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useEnhancedHaptics } from '@/hooks/useEnhancedHaptics';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowLeft,
  Signal,
  Coins
} from 'lucide-react';
import { useAffiliateTracking } from '@/hooks/useAffiliateTracking';
import { UsernameSelection } from '@/components/UsernameSelection';
import { EmailVerification } from '@/components/EmailVerification';
import { Capacitor } from '@capacitor/core';

/**
 * In-App Auth Page - Matches app glassmorphism design
 * Separate from web auth, but uses same Supabase backend
 */
export const AppAuth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { buttonTap, successPattern } = useEnhancedHaptics();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showUsernameSelection, setShowUsernameSelection] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const isSignup = searchParams.get('mode') === 'signup' || searchParams.get('mode') === 'register';

  useEffect(() => {
    let isMounted = true;

    const handleSession = async (session: any, isNewSignIn = false) => {
      if (!isMounted || !session) {
        setCheckingSession(false);
        return;
      }

      const userId = session.user?.id;
      if (!userId) {
        setCheckingSession(false);
        return;
      }

      try {
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, email_verified')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!isMounted) return;

        if (!existingProfile || existingProfile.username?.startsWith('temp_')) {
          // New user or incomplete profile
          setCurrentUser({ id: userId, email: session.user.email || '' });
          setShowUsernameSelection(true);
          setCheckingSession(false);
        } else {
          // Existing user - redirect to app
          if (isNewSignIn) {
            successPattern();
            toast({ title: 'Welcome back!' });
          }
          navigate('/app');
        }
      } catch (error) {
        console.error('Error handling session:', error);
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        handleSession(session, event === 'SIGNED_IN');
      }
      if (event === 'SIGNED_OUT') {
        setLoading(false);
        setShowUsernameSelection(false);
        setCurrentUser(null);
        setCheckingSession(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session, false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, successPattern, toast]);

  const handleUsernameComplete = () => {
    successPattern();
    toast({ title: 'Welcome to Nomiqa!' });
    navigate('/app');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    buttonTap();

    if (!email || !password) {
      toast({ title: 'Please enter your email and password', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    if (isSignup && !agreedToTerms) {
      toast({ title: 'Please agree to our Terms and Privacy Policy', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        // Get referral code
        let { referralCode, clearReferralCode } = useAffiliateTracking.getState();
        
        if (!referralCode) {
          try {
            const storedData = localStorage.getItem('affiliate-tracking');
            if (storedData) {
              const parsed = JSON.parse(storedData);
              referralCode = parsed?.state?.referralCode || null;
            }
          } catch (e) {
            console.error('Error reading referral code:', e);
          }
        }

        const { data, error } = await supabase.functions.invoke('signup-user', {
          body: {
            email: email.toLowerCase(),
            password,
            referralCode: referralCode || undefined,
          }
        });

        if (error) {
          let errorMessage = 'Signup failed. Please try again.';
          try {
            if (error.context?.body) {
              const bodyData = typeof error.context.body === 'string' 
                ? JSON.parse(error.context.body) 
                : error.context.body;
              errorMessage = bodyData.error || errorMessage;
            }
          } catch (e) {}
          
          if (errorMessage.includes('already exists')) {
            toast({ title: 'An account with this email already exists', variant: 'destructive' });
            navigate('/app/auth?mode=login');
          } else {
            toast({ title: errorMessage, variant: 'destructive' });
          }
          setLoading(false);
          return;
        }

        if (data?.error) {
          toast({ title: data.error, variant: 'destructive' });
          setLoading(false);
          return;
        }

        if (data?.success && data?.userId) {
          if (referralCode) {
            clearReferralCode();
          }
          setCurrentUser({ id: data.userId, email: email.toLowerCase() });
          setShowEmailVerification(true);
          toast({ title: 'Verification code sent to your email!' });
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({ title: 'Invalid email or password', variant: 'destructive' });
          } else if (error.message.includes('Email not confirmed')) {
            toast({ title: 'Your email is not verified. Please check your inbox.', variant: 'destructive' });
          } else {
            toast({ title: error.message, variant: 'destructive' });
          }
        }
        // On success, onAuthStateChange will handle redirect
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({ title: error.message || 'Authentication failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    buttonTap();
    if (!email) {
      toast({ title: 'Please enter your email address', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await supabase.functions.invoke('resend-verification-code', {
        body: { email: email.toLowerCase(), type: 'password_reset' }
      });
      toast({ title: 'Reset code sent to your email' });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({ title: 'Failed to send reset code', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerified = async () => {
    setShowEmailVerification(false);
    
    if (currentUser && email && password) {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          toast({ title: 'Verification successful! Please sign in.', variant: 'destructive' });
          return;
        }

        if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', data.user.id)
            .single();

          if (profile?.username?.startsWith('temp_')) {
            toast({ title: 'Email verified! Now choose your username.' });
            setCurrentUser({ id: data.user.id, email: data.user.email || '' });
            setShowUsernameSelection(true);
          } else {
            successPattern();
            toast({ title: 'Welcome to Nomiqa!' });
            navigate('/app');
          }
        }
      } catch (err) {
        console.error('Error during auto sign-in:', err);
        toast({ title: 'Verification successful! Please sign in.' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSignup && !agreedToTerms) {
      toast({ title: 'Please agree to our Terms and Privacy Policy', variant: 'destructive' });
      return;
    }
    
    buttonTap();
    setLoading(true);
    try {
      // For native apps, use the custom URL scheme for OAuth redirect
      // This ensures the OAuth flow returns to the app instead of the website
      const isNativeApp = Capacitor.isNativePlatform();
      const redirectTo = isNativeApp 
        ? 'com.nomiqa.app://app/auth' 
        : `${window.location.origin}/app/auth`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          // Skip the browser tab for native - it will open in system browser
          // and redirect back via deep link
          skipBrowserRedirect: false,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: error.message || 'Failed to sign in with Google', variant: 'destructive' });
      setLoading(false);
    }
  };

  // Loading state
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Username selection
  if (showUsernameSelection && currentUser) {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        <UsernameSelection 
          userId={currentUser.id} 
          email={currentUser.email} 
          onComplete={handleUsernameComplete} 
        />
      </div>
    );
  }

  // Email verification
  if (showEmailVerification && currentUser) {
    return (
      <div className="min-h-screen bg-background px-4 py-6">
        <EmailVerification 
          email={email} 
          type="registration"
          onVerified={handleEmailVerified}
        />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background flex flex-col"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
      }}
    >
      {/* Header */}
      <div className="px-4 mb-6">
        <button
          onClick={() => {
            buttonTap();
            navigate('/app');
          }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 flex flex-col">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/nomiqa-logo.jpg" 
            alt="Nomiqa" 
            className="w-20 h-20 rounded-2xl shadow-lg mb-3"
          />
          <h1 className="text-xl font-bold text-foreground">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignup ? 'Start earning rewards today' : 'Sign in to continue earning'}
          </p>
        </div>

        {/* Auth Form */}
        <div className="w-full max-w-sm mx-auto space-y-4">
          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 bg-card border-border text-foreground"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-card border-border"
                  disabled={loading}
                />
              </div>
            </div>

            {!showForgotPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-card border-border"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Terms checkbox for signup */}
            {isSignup && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-xs text-muted-foreground leading-tight">
                  I agree to the{' '}
                  <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                </Label>
              </div>
            )}

            {/* Submit Button */}
            {showForgotPassword ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Code'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <Button
                type="submit"
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isSignup ? (
                  'Create Account'
                ) : (
                  'Sign In'
                )}
              </Button>
            )}
          </form>

          {/* Switch mode */}
          <p className="text-center text-sm text-muted-foreground pt-4">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    buttonTap();
                    navigate('/app/auth?mode=login');
                  }}
                  className="text-primary font-medium hover:underline"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    buttonTap();
                    navigate('/app/auth?mode=signup');
                  }}
                  className="text-primary font-medium hover:underline"
                >
                  Create Account
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppAuth;
