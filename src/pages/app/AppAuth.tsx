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
  AlertCircle,
  CheckCircle2,
  XCircle,
  Fingerprint,
  User,
  Gift
} from 'lucide-react';
import { useAffiliateTracking } from '@/hooks/useAffiliateTracking';
import { UsernameSelection } from '@/components/UsernameSelection';
import { EmailVerification } from '@/components/EmailVerification';
import { PostSignupSuccess } from '@/components/PostSignupSuccess';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { z } from 'zod';
import { lovable } from '@/integrations/lovable';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

// sessionStorage can throw in some iOS/WKWebView privacy modes (or when storage is disabled).
// If that happens during sign-in, it can crash the React tree and look like a black screen.
const safeSessionStorage = {
  getItem(key: string) {
    try {
      if (typeof window === 'undefined') return null;
      return window.sessionStorage.getItem(key);
    } catch (e) {
      console.warn('[AppAuth] sessionStorage.getItem failed:', e);
      return null;
    }
  },
  setItem(key: string, value: string) {
    try {
      if (typeof window === 'undefined') return;
      window.sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn('[AppAuth] sessionStorage.setItem failed:', e);
    }
  },
  removeItem(key: string) {
    try {
      if (typeof window === 'undefined') return;
      window.sessionStorage.removeItem(key);
    } catch (e) {
      console.warn('[AppAuth] sessionStorage.removeItem failed:', e);
    }
  },
};

// Validation schemas
const emailSchema = z.string().email('Please enter a valid email address').max(255, 'Email is too long');
const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password is too long');
const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be less than 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed');

// Password strength checker
const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-destructive' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
};

// Error message mapping for better UX
const getReadableError = (error: string): string => {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Email or password is incorrect. Please try again.',
    'Email not confirmed': 'Please verify your email before signing in.',
    'User already registered': 'An account with this email already exists.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters.',
    'Unable to validate email address': 'Please enter a valid email address.',
    'Signup requires a valid password': 'Please enter a password.',
    'rate limit': 'Too many attempts. Please wait a moment and try again.',
  };

  const lowerError = error.toLowerCase();
  for (const [key, value] of Object.entries(errorMap)) {
    if (lowerError.includes(key.toLowerCase())) {
      return value;
    }
  }
  return error;
};

/**
 * In-App Auth Page - Matches app glassmorphism design
 * Enhanced with better error handling and loading states
 */
export const AppAuth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { buttonTap, successPattern, errorPattern } = useEnhancedHaptics();
  const { toast } = useToast();

  // Biometric auth hook
  const { 
    isAvailable: biometricAvailable, 
    isEnabled: biometricEnabled, 
    isLoading: biometricLoading,
    getBiometryName,
    enableBiometric,
    authenticate: biometricAuthenticate,
  } = useBiometricAuth();

  // Loading states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  // Clear any stale OAuth pending flags on mount (prevents black screen)
  useEffect(() => {
    // Only keep the flag if we have OAuth params in the URL
    const hasOAuthParams = window.location.search.includes('code=') || 
                           window.location.hash.includes('access_token');
    if (!hasOAuthParams) {
      safeSessionStorage.removeItem('nomiqa_oauth_pending');
    }
  }, []);
  
  // UI states
  const [showUsernameSelection, setShowUsernameSelection] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showPostSignupSuccess, setShowPostSignupSuccess] = useState(false);
  const [completedUsername, setCompletedUsername] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [formError, setFormError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const isSignup = searchParams.get('mode') === 'signup' || searchParams.get('mode') === 'register';

  // Pre-fill referral input from stored tracking code
  useEffect(() => {
    if (isSignup && !referralInput) {
      const { referralCode } = useAffiliateTracking.getState();
      if (referralCode) {
        setReferralInput(referralCode);
      }
    }
  }, [isSignup]);

  // Clear form error when user types
  useEffect(() => {
    if (formError) setFormError('');
  }, [email, password]);

  // Validate email on blur
  const validateEmail = (value: string) => {
    const result = emailSchema.safeParse(value);
    if (!result.success) {
      setEmailError(result.error.errors[0].message);
      return false;
    }
    setEmailError('');
    return true;
  };

  // Validate password on blur
  const validatePassword = (value: string) => {
    const result = passwordSchema.safeParse(value);
    if (!result.success) {
      setPasswordError(result.error.errors[0].message);
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Validate and check username availability
  const validateUsername = async (value: string): Promise<boolean> => {
    const sanitized = value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
    
    if (sanitized.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setUsernameAvailable(null);
      return false;
    }

    const result = usernameSchema.safeParse(sanitized);
    if (!result.success) {
      setUsernameError(result.error.errors[0].message);
      setUsernameAvailable(false);
      return false;
    }

    setCheckingUsername(true);
    setUsernameError('');

    try {
      // Using _safe view for username check with 3s timeout
      const timeoutPromise = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 3000));
      
      const queryPromise = supabase
        .from('profiles_safe')
        .select('id')
        .eq('username', sanitized)
        .maybeSingle();
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      
      if (result === 'timeout') {
        console.warn('[AppAuth] Username check timed out, allowing signup');
        setUsernameAvailable(true);
        setCheckingUsername(false);
        return true;
      }

      const { data, error } = result;

      if (error) throw error;

      if (data) {
        setUsernameError('Username is already taken');
        setUsernameAvailable(false);
        setCheckingUsername(false);
        return false;
      }

      setUsernameAvailable(true);
      setCheckingUsername(false);
      return true;
    } catch (err) {
      console.error('Error checking username:', err);
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return false;
    }
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
    setUsername(sanitized);
    setUsernameError('');
    setUsernameAvailable(null);
  };

  useEffect(() => {
    let isMounted = true;

    // Safety net: never let the auth screen sit in "checking session" forever.
    // On iOS, storage/network edge cases can stall session initialization.
    const BOOT_TIMEOUT_MS = 5000;
    const bootTimer = window.setTimeout(() => {
      if (!isMounted) return;
      console.warn('[AppAuth] Session check timed out - continuing without blocking UI');
      safeSessionStorage.removeItem('nomiqa_oauth_pending');
      setCheckingSession(false);
      setGoogleLoading(false);
    }, BOOT_TIMEOUT_MS);

    /**
     * Handle session - checks profile and redirects appropriately
     * Returns true if navigation occurred
     */
    const handleSession = async (session: any, isNewSignIn = false): Promise<boolean> => {
      if (!isMounted || !session) {
        return false;
      }

      const userId = session.user?.id;
      const email = session.user?.email || '';
      if (!userId) {
        return false;
      }

      try {
        // Using _safe view for profile check
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles_safe')
          .select('id, username, email_verified')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!isMounted) return false;

        if (!existingProfile) {
          // NEW OAuth user - create profile with temp username
          const tempUsername = `temp_${Date.now()}`;
          
          const { error: insertError } = await supabase.from('profiles').insert({
            user_id: userId,
            username: tempUsername,
            email,
            email_verified: true,
            is_early_member: true,
          });

          if (insertError) throw insertError;

          // Track affiliate and send welcome email via create-affiliate
          // (handles referral tracking server-side with proper auth)
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
          
          try {
            await supabase.functions.invoke('create-affiliate', {
              body: {
                email: email,
                userId: userId, // Pass userId for referral tracking
                sendWelcomeOnly: true,
                referralCode: referralCode || undefined, // Pass referral code if present
                referrer: document.referrer || undefined,
              }
            });
            console.log('OAuth registration processed:', email, referralCode ? `with referral: ${referralCode}` : 'no referral');
            
            // Clear referral code after successful tracking
            if (referralCode) {
              clearReferralCode();
              try {
                const storedData = localStorage.getItem('affiliate-tracking');
                if (storedData) {
                  const parsed = JSON.parse(storedData);
                  parsed.state.referralCode = null;
                  parsed.state.referralTimestamp = null;
                  localStorage.setItem('affiliate-tracking', JSON.stringify(parsed));
                }
              } catch (e) {}
            }
          } catch (emailError) {
            console.error('Error processing OAuth registration:', emailError);
          }

          console.log('New OAuth user registered:', email);
          
          toast({ title: 'Welcome! Choose a username to continue.' });
          setCurrentUser({ id: userId, email });
          setShowUsernameSelection(true);
          return true;
        } else if (existingProfile.username?.startsWith('temp_') || existingProfile.username?.startsWith('user_')) {
          // User has incomplete profile (temp_ from OAuth, user_ from email signup) - needs to choose username
          toast({ title: 'Welcome back! Please choose your username.' });
          setCurrentUser({ id: userId, email });
          setShowUsernameSelection(true);
          return true;
        } else {
          // Existing user with proper profile - just redirect
          if (isNewSignIn) {
            successPattern();
            toast({ title: 'Welcome back!' });
          }
          navigate('/app');
          return true;
        }
      } catch (error) {
        console.error('Error handling session:', error);
        return false;
      }
    };

    // CRITICAL FIX: Set up auth listener BEFORE getSession to prevent race conditions
    // The listener handles ONGOING auth changes (does NOT control isLoading directly)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      console.log('[AppAuth] Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        // User signed in - clear pending flag and handle session
        safeSessionStorage.removeItem('nomiqa_oauth_pending');
        
        // Fire and forget - don't await, don't set loading
        // This handles ONGOING sign-ins after initial load
        handleSession(session, true).catch((err) => {
          console.error('[AppAuth] handleSession failed on SIGNED_IN:', err);
        }).finally(() => {
          setGoogleLoading(false);
        });
      }
      
      if (event === 'SIGNED_OUT') {
        setLoading(false);
        setGoogleLoading(false);
        setShowUsernameSelection(false);
        setCurrentUser(null);
        setCheckingSession(false);
      }
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('[AppAuth] Token refreshed successfully');
      }
    });

    // INITIAL session check (controls isLoading/checkingSession)
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AppAuth] getSession error:', error);
          return;
        }
        
        if (!isMounted) return;
        
        if (session) {
          // Validate session has required claims before using
          if (!session.user?.id) {
            console.warn('[AppAuth] Session missing user ID, clearing');
            await supabase.auth.signOut();
            return;
          }
          
          // Handle the existing session - await to ensure profile is fetched BEFORE setting loading false
          const handled = await handleSession(session, false);
          
          if (!handled && isMounted) {
            // Session exists but something went wrong - clear and let user sign in again
            console.warn('[AppAuth] Session handling failed, may need fresh auth');
          }
        }
      } catch (err) {
        console.error('[AppAuth] initializeAuth failed:', err);
        safeSessionStorage.removeItem('nomiqa_oauth_pending');
      } finally {
        // ONLY set loading false after ALL initial checks complete
        if (isMounted) {
          window.clearTimeout(bootTimer);
          setCheckingSession(false);
          setGoogleLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      window.clearTimeout(bootTimer);
      subscription.unsubscribe();
    };
  }, [navigate, successPattern, toast]);

  // Listen for app resume to reset loading state (after OAuth browser closes)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('appStateChange', (state) => {
      if (state.isActive && googleLoading) {
        // App came back to foreground while we were waiting for OAuth
        // Check if we have a session now
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            // No session yet - user might have cancelled
            safeSessionStorage.removeItem('nomiqa_oauth_pending');
            setGoogleLoading(false);
          }
          // If session exists, the onAuthStateChange will handle it
        });
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [googleLoading]);

  const handleUsernameComplete = async () => {
    // Fetch the username that was just set (using _safe view)
    if (currentUser) {
      const { data: profile } = await supabase
        .from('profiles_safe')
        .select('username')
        .eq('user_id', currentUser.id)
        .single();
      
      if (profile?.username) {
        setCompletedUsername(profile.username);
        setShowUsernameSelection(false);
        setShowPostSignupSuccess(true);
        successPattern();
        return;
      }
    }
    // Fallback if username fetch fails
    successPattern();
    toast({ title: 'Welcome to Nomiqa!' });
    navigate('/app');
  };

  const handlePostSignupContinue = () => {
    toast({ title: 'Welcome to Nomiqa!' });
    navigate('/app');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    buttonTap();
    setFormError('');

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    setEmailTouched(true);
    setPasswordTouched(true);

    if (!isEmailValid || !isPasswordValid) {
      errorPattern();
      return;
    }

    // For signup, also validate username
    if (isSignup) {
      setUsernameTouched(true);
      const isUsernameValid = await validateUsername(username);
      if (!isUsernameValid) {
        errorPattern();
        return;
      }
    }

    if (isSignup && !agreedToTerms) {
      setFormError('Please agree to our Terms and Privacy Policy');
      errorPattern();
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        // Use referral code from input field first, then fall back to stored tracking code
        let { referralCode, clearReferralCode } = useAffiliateTracking.getState();
        
        // If user typed a referral code in the signup form, use that instead
        if (referralInput.trim()) {
          referralCode = referralInput.trim().toLowerCase();
        } else if (!referralCode) {
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

        // Use AbortController for a 25-second timeout to prevent infinite spinner
        // (increased from 15s — mid-range Android devices on Wi-Fi need more time)
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 25000);

        let data: any;
        let error: any;

        try {
          const result = await supabase.functions.invoke('signup-user', {
            body: {
              email: email.toLowerCase().trim(),
              password,
              username: username.toLowerCase().trim(),
              referralCode: referralCode || undefined,
            },
            signal: controller.signal,
          });
          data = result.data;
          error = result.error;
        } catch (invokeErr: any) {
          if (invokeErr?.name === 'AbortError' || controller.signal.aborted) {
            setFormError('Signup is taking longer than expected. Please try again — your account may already have been created.');
            errorPattern();
            setLoading(false);
            return;
          }
          throw invokeErr;
        } finally {
          window.clearTimeout(timeoutId);
        }

        if (error) {
          let errorMessage = 'Signup failed. Please try again.';
          try {
            if (error.context) {
              if (typeof error.context.json === 'function') {
                const bodyData = await error.context.json();
                errorMessage = bodyData.error || errorMessage;
              } else if (error.context.body) {
                const bodyData = typeof error.context.body === 'string' 
                  ? JSON.parse(error.context.body) 
                  : error.context.body;
                errorMessage = bodyData.error || errorMessage;
              }
            }
          } catch (e) {}
          
          errorMessage = getReadableError(errorMessage);
          
          if (errorMessage.toLowerCase().includes('already exists')) {
            setFormError('An account with this email already exists. Try signing in instead.');
            toast({ 
              title: 'Account exists', 
              description: 'Try signing in instead.',
              variant: 'destructive' 
            });
          } else if (errorMessage.toLowerCase().includes('disposable')) {
            setFormError('Please use a real email address, not a disposable one.');
          } else if (errorMessage.toLowerCase().includes('rate') || errorMessage.toLowerCase().includes('too many')) {
            setFormError('Too many signup attempts. Please wait a few minutes and try again.');
          } else {
            setFormError(errorMessage);
          }
          errorPattern();
          setLoading(false);
          return;
        }

        if (data?.error) {
          const errMsg = data.error;
          if (errMsg.toLowerCase().includes('already exists')) {
            setFormError('An account with this email already exists. Try signing in instead.');
          } else if (errMsg.toLowerCase().includes('disposable')) {
            setFormError('Please use a real email address, not a disposable one.');
          } else if (errMsg.toLowerCase().includes('rate') || errMsg.toLowerCase().includes('too many')) {
            setFormError('Too many signup attempts. Please wait a few minutes.');
          } else {
            setFormError(getReadableError(errMsg));
          }
          errorPattern();
          setLoading(false);
          return;
        }

        if (data?.success && data?.userId) {
          if (referralCode) {
            clearReferralCode();
          }
          setCurrentUser({ id: data.userId, email: email.toLowerCase().trim() });
          setShowEmailVerification(true);
          successPattern();
          toast({ title: 'Verification code sent!', description: 'Check your email inbox.' });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        });

        if (error) {
          const readableError = getReadableError(error.message);
          setFormError(readableError);
          errorPattern();
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setFormError(getReadableError(error.message || 'Authentication failed'));
      errorPattern();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    buttonTap();
    
    if (!validateEmail(email)) {
      setEmailTouched(true);
      errorPattern();
      return;
    }

    setLoading(true);
    try {
      await supabase.functions.invoke('resend-verification-code', {
        body: { email: email.toLowerCase().trim(), type: 'password_reset' }
      });
      successPattern();
      toast({ title: 'Reset code sent!', description: 'Check your email inbox.' });
      setShowForgotPassword(false);
    } catch (error: any) {
      setFormError('Failed to send reset code. Please try again.');
      errorPattern();
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerified = async () => {
    setShowEmailVerification(false);
    
    if (currentUser && email && password) {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email: email.toLowerCase().trim(), 
          password 
        });

        if (error) {
          toast({ title: 'Please sign in', description: 'Email verified successfully!', variant: 'default' });
          return;
        }

        if (data?.user) {
          // Use profiles_safe view to exclude sensitive fields
          const { data: profile } = await supabase
            .from('profiles_safe')
            .select('username')
            .eq('user_id', data.user.id)
            .single();

          // Check if username is temporary (starts with 'temp_' from OAuth or 'user_' from email signup)
          const isTemporaryUsername = profile?.username?.startsWith('temp_') || profile?.username?.startsWith('user_');
          
          if (isTemporaryUsername) {
            toast({ title: 'Almost there!', description: 'Choose your username to complete setup.' });
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
        toast({ title: 'Email verified!', description: 'Please sign in to continue.' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    // Prevent multiple concurrent sign-in attempts
    if (googleLoading) {
      console.log('[AppAuth] Google sign-in already in progress, ignoring');
      return;
    }

    if (isSignup && !agreedToTerms) {
      setFormError('Please agree to our Terms and Privacy Policy');
      errorPattern();
      return;
    }

    buttonTap();
    setGoogleLoading(true);
    setFormError('');

    // Mark that we're starting OAuth (persists through redirect)
    safeSessionStorage.setItem('nomiqa_oauth_pending', 'true');

    // Safety timeout - if OAuth doesn't complete in 60 seconds, reset state
    const oauthTimeout = window.setTimeout(() => {
      console.warn('[AppAuth] OAuth timeout - resetting loading state');
      safeSessionStorage.removeItem('nomiqa_oauth_pending');
      setGoogleLoading(false);
      setFormError('Sign-in timed out. Please try again.');
    }, 60000);

    try {
      // NATIVE (iOS/Android): Use Lovable OAuth broker on the production domain.
      // The flow:
      // 1. Open system browser to Lovable OAuth broker on nomiqa-depin.com
      // 2. Broker redirects to Google OAuth (with correct redirect URI already configured)
      // 3. Google redirects back to Lovable callback
      // 4. Lovable redirects to our /app/oauth-redirect page with tokens
      // 5. That page triggers deep link back to native app
      // 6. useDeepLinkAuth receives the deep link and sets the session
      if (Capacitor.isNativePlatform()) {
        console.log('[AppAuth] Native platform - initiating OAuth via Lovable broker...');

        // Use the primary production domain's OAuth broker
        const SITE_ORIGIN = 'https://nomiqa-depin.com';
        const redirectUrl = `${SITE_ORIGIN}/app/oauth-redirect`;
        
        // Build the OAuth broker URL (same endpoint the web SDK uses)
        const params = new URLSearchParams({
          provider: 'google',
          redirect_uri: redirectUrl,
        });
        
        const oauthBrokerUrl = `${SITE_ORIGIN}/~oauth/initiate?${params.toString()}`;
        
        console.log('[AppAuth] Opening OAuth broker in system browser...');
        await Browser.open({ url: oauthBrokerUrl });
        
        // Clear timeout - deep link handler will take over
        window.clearTimeout(oauthTimeout);
        console.log('[AppAuth] System browser opened, waiting for OAuth callback...');
        return;
      }

      // For WEB: Use Lovable Cloud managed OAuth normally
      // IMPORTANT: Always use production domain for redirect_uri to prevent mismatches
      // when accessing from different domains (staging, custom domains, etc.)
      console.log('[AppAuth] Web platform - using standard Lovable OAuth...');
      
      // Use the current origin for redirect - the Lovable OAuth broker handles this correctly
      const redirectOrigin = window.location.origin;
      
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: `${redirectOrigin}/app/auth`,
      });

      if (result.error) {
        window.clearTimeout(oauthTimeout);
        safeSessionStorage.removeItem('nomiqa_oauth_pending');
        throw result.error;
      }

      if (!result.redirected) {
        window.clearTimeout(oauthTimeout);
        safeSessionStorage.removeItem('nomiqa_oauth_pending');
        console.log('[AppAuth] Google sign-in successful');
      } else {
        console.log('[AppAuth] Redirecting to Google OAuth...');
      }
    } catch (error: any) {
      window.clearTimeout(oauthTimeout);
      console.error('[AppAuth] Google sign-in error:', error);
      safeSessionStorage.removeItem('nomiqa_oauth_pending');
      setFormError(getReadableError(error.message || 'Failed to sign in with Google'));
      errorPattern();
      setGoogleLoading(false);
    }
  };

  // Biometric sign-in handler
  const handleBiometricSignIn = async () => {
    buttonTap();
    setFormError('');

    try {
      const credentials = await biometricAuthenticate();
      
      if (!credentials) {
        // User cancelled or auth failed - don't show error
        return;
      }

      setLoading(true);

      // Use stored tokens to restore session
      const { data, error } = await supabase.auth.setSession({
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
      });

      if (error) {
        // Tokens may have expired - ask user to sign in again
        setFormError('Session expired. Please sign in with your password.');
        errorPattern();
        return;
      }

      successPattern();
      toast({ title: `Signed in with ${getBiometryName()}!` });
      // Navigation handled by onAuthStateChange
    } catch (error: any) {
      console.error('[AppAuth] Biometric sign-in error:', error);
      setFormError('Biometric sign-in failed. Please try again.');
      errorPattern();
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const passwordStrength = password ? getPasswordStrength(password) : null;

  // Loading state - only block on initial session check
  // googleLoading is handled inline to prevent black screen from stale flags
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Username selection screen
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

  // Post-signup success screen with referral challenge
  if (showPostSignupSuccess) {
    return (
      <PostSignupSuccess 
        username={completedUsername}
        onContinue={handlePostSignupContinue}
      />
    );
  }

  // Email verification screen
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

  const isFormDisabled = loading || googleLoading;

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
          disabled={isFormDisabled}
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

        {/* Global Error Message */}
        {formError && (
          <div className="w-full max-w-sm mx-auto mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{formError}</p>
          </div>
        )}

        {/* Auth Form */}
        <div className="w-full max-w-sm mx-auto space-y-4">
          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full h-12 bg-card border-border text-foreground transition-all duration-200",
              googleLoading && "opacity-70"
            )}
            onClick={handleGoogleSignIn}
            disabled={isFormDisabled}
          >
            {googleLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Connecting...</span>
              </div>
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

          {/* Biometric Sign-In (only for login, not signup) */}
          {!isSignup && biometricAvailable && biometricEnabled && (
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full h-12 bg-card border-border text-foreground transition-all duration-200",
                biometricLoading && "opacity-70"
              )}
              onClick={handleBiometricSignIn}
              disabled={isFormDisabled || biometricLoading}
            >
              {biometricLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <Fingerprint className="w-5 h-5 mr-2" />
                  Sign in with {getBiometryName()}
                </>
              )}
            </Button>
          )}

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
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                  emailError && emailTouched ? "text-destructive" : "text-muted-foreground"
                )} />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => {
                    setEmailTouched(true);
                    if (email) validateEmail(email);
                  }}
                  className={cn(
                    "pl-10 h-12 bg-card border-border transition-all duration-200",
                    emailError && emailTouched && "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={isFormDisabled}
                  autoComplete="email"
                  autoCapitalize="none"
                />
                {emailTouched && email && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {emailError ? (
                      <XCircle className="w-4 h-4 text-destructive" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                )}
              </div>
              {emailError && emailTouched && (
                <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-150">
                  {emailError}
                </p>
              )}
            </div>

            {/* Username Input (signup only) */}
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">Username</Label>
                <div className="relative">
                  <User className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                    usernameError && usernameTouched ? "text-destructive" : "text-muted-foreground"
                  )} />
                  <Input
                    id="username"
                    type="text"
                    placeholder="your_username"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    onBlur={() => {
                      setUsernameTouched(true);
                      if (username.length >= 3) validateUsername(username);
                    }}
                    className={cn(
                      "pl-10 h-12 bg-card border-border transition-all duration-200",
                      usernameError && usernameTouched && "border-destructive focus-visible:ring-destructive"
                    )}
                    disabled={isFormDisabled}
                    autoComplete="username"
                    autoCapitalize="none"
                    maxLength={20}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingUsername && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    {!checkingUsername && usernameAvailable === true && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {!checkingUsername && usernameAvailable === false && <XCircle className="w-4 h-4 text-destructive" />}
                  </div>
                </div>
                {usernameError && usernameTouched && (
                  <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-150">
                    {usernameError}
                  </p>
                )}
                {usernameAvailable && !usernameError && (
                  <p className="text-xs text-green-500 animate-in fade-in duration-150">
                    Username is available!
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>
            )}
            {/* Password Input */}
            {!showForgotPassword && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-primary hover:underline"
                      disabled={isFormDisabled}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                    passwordError && passwordTouched ? "text-destructive" : "text-muted-foreground"
                  )} />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => {
                      setPasswordTouched(true);
                      if (password) validatePassword(password);
                    }}
                    className={cn(
                      "pl-10 pr-10 h-12 bg-card border-border transition-all duration-200",
                      passwordError && passwordTouched && "border-destructive focus-visible:ring-destructive"
                    )}
                    disabled={isFormDisabled}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isFormDisabled}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && passwordTouched && (
                  <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-150">
                    {passwordError}
                  </p>
                )}
                
                {/* Password Strength Indicator (signup only) */}
                {isSignup && password && passwordStrength && (
                  <div className="space-y-1 animate-in fade-in duration-200">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-colors duration-200",
                            level <= passwordStrength.score ? passwordStrength.color : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password strength: <span className={cn(
                        passwordStrength.score >= 4 ? "text-green-500" :
                        passwordStrength.score >= 3 ? "text-yellow-500" :
                        passwordStrength.score >= 2 ? "text-orange-500" : "text-destructive"
                      )}>{passwordStrength.label}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Referral Code Input (signup only) */}
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="referral" className="text-foreground">Referral Code <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="referral"
                    type="text"
                    placeholder="friend's username"
                    value={referralInput}
                    onChange={(e) => setReferralInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="pl-10 h-12 bg-card border-border transition-all duration-200"
                    disabled={isFormDisabled}
                    autoComplete="off"
                    autoCapitalize="none"
                    maxLength={20}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter a friend's code to earn bonus points together
                </p>
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
                  disabled={isFormDisabled}
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
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200"
                  onClick={handleForgotPassword}
                  disabled={isFormDisabled}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    'Send Reset Code'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setFormError('');
                  }}
                  disabled={isFormDisabled}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <Button
                type="submit"
                className={cn(
                  "w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200",
                  loading && "opacity-70"
                )}
                disabled={isFormDisabled}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{isSignup ? 'Creating account...' : 'Signing in...'}</span>
                  </div>
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
                    setFormError('');
                    setEmailError('');
                    setPasswordError('');
                    setUsernameError('');
                    setUsername('');
                    setUsernameAvailable(null);
                    navigate('/app/auth?mode=login');
                  }}
                  className="text-primary font-medium hover:underline"
                  disabled={isFormDisabled}
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
                    setFormError('');
                    setEmailError('');
                    setPasswordError('');
                    setUsernameError('');
                    setUsername('');
                    setUsernameAvailable(null);
                    navigate('/app/auth?mode=signup');
                  }}
                  className="text-primary font-medium hover:underline"
                  disabled={isFormDisabled}
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
