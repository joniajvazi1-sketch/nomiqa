import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NetworkBackground } from "@/components/NetworkBackground";
import { toast } from "sonner";
import { Loader2, Mail, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import nomiqaAnimatedLogo from "@/assets/nomiqa-animated-logo.gif";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { UsernameSelection } from "@/components/UsernameSelection";
import { EmailVerification } from "@/components/EmailVerification";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showUsernameSelection, setShowUsernameSelection] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showPasswordResetVerification, setShowPasswordResetVerification] = useState(false);
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Email auth states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const isSignup = searchParams.get('mode') === 'signup' || searchParams.get('mode') === 'register';
  const isResetMode = searchParams.get('mode') === 'reset';

  // Check for password reset mode on mount
  useEffect(() => {
    if (isResetMode) {
      // User came from password reset email link - show reset form
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setShowResetPassword(true);
          setCheckingSession(false);
        }
      });
    }
  }, [isResetMode]);
  useEffect(() => {
    let isMounted = true;
    let handlingUserId: string | null = null;
    let handledUserId: string | null = null;

    const handleSession = async (session: any, isNewSignIn = false) => {
      if (!isMounted) return;

      if (!session) {
        setCheckingSession(false);
        return;
      }

      const userId = session.user?.id as string | undefined;
      if (!userId) {
        setCheckingSession(false);
        return;
      }

      // Prevent duplicate processing (OAuth redirect can trigger multiple events quickly)
      if (handledUserId === userId || handlingUserId === userId) return;
      handlingUserId = userId;

      try {
        const email = session.user.email || "";

        // Check if user has a profile with proper username
        const { data: existingProfile, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, email_verified")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!isMounted) return;

        if (!existingProfile) {
          // This is an OAuth sign-in for a new user (Google, etc.)
          // Create profile with temp username - they need to choose one
          const tempUsername = `temp_${Date.now()}`;

          const { error: insertError } = await supabase.from("profiles").insert({
            user_id: userId,
            username: tempUsername,
            email,
            email_verified: true,
            is_early_member: true,
          });

          if (insertError) throw insertError;

          // Track affiliate if applicable
          const { referralCode, clearReferralCode } = useAffiliateTracking.getState();
          if (referralCode) {
            try {
              await supabase.functions.invoke("track-affiliate-registration", {
                body: {
                  referralCode,
                  userId,
                  referrer: document.referrer,
                },
              });
              clearReferralCode();
            } catch (trackError) {
              console.error("Error tracking affiliate:", trackError);
            }
          }

          console.log("New OAuth user registered:", email);

          toast.success("Successfully registered — choose a username.");
          setCurrentUser({ id: userId, email });
          setShowUsernameSelection(true);
          setCheckingSession(false);
        } else if (existingProfile.username?.startsWith("temp_")) {
          // User has incomplete profile - needs to choose username
          toast.success("Welcome — choose your username to finish setup.");
          setCurrentUser({ id: userId, email });
          setShowUsernameSelection(true);
          setCheckingSession(false);
        } else {
          // Existing user with proper profile - just redirect
          if (isNewSignIn) toast.success("Successfully signed in!");
          const redirectUrl = searchParams.get("redirect") || "/";
          navigate(redirectUrl);
        }

        handledUserId = userId;
      } catch (error) {
        console.error("Error handling session:", error);
        if (isMounted) {
          setCheckingSession(false);
          setShowUsernameSelection(false);
          setCurrentUser(null);
        }
      } finally {
        if (handlingUserId === (session?.user?.id as string | undefined)) {
          handlingUserId = null;
        }
      }
    };

    // Set up auth state listener FIRST (prevents missing OAuth session events)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      // OAuth redirects frequently come back as INITIAL_SESSION
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        handleSession(session, event === "SIGNED_IN");
      }

      if (event === "SIGNED_OUT") {
        setLoading(false);
        setShowUsernameSelection(false);
        setCurrentUser(null);
        setCheckingSession(false);
      }
    });

    // THEN check for any already-persisted session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Session error:", error);
        setCheckingSession(false);
        return;
      }
      handleSession(session, false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, searchParams]);

  const handleUsernameComplete = () => {
    toast.success("Welcome to Nomiqa!");
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get('redirect') || '/';
    navigate(redirectUrl);
  };

  const handleGoogleSignIn = async () => {
    if (isSignup && !agreedToTerms) {
      toast.error(t("pleaseAgreeToTerms") || "Please agree to our Terms and Privacy Policy");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (isSignup && !agreedToTerms) {
      toast.error(t("pleaseAgreeToTerms") || "Please agree to our Terms and Privacy Policy");
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        // Use signup-user edge function to handle signup with service role
        const { referralCode, clearReferralCode } = useAffiliateTracking.getState();
        
        const { data, error } = await supabase.functions.invoke('signup-user', {
          body: {
            email: email.toLowerCase(),
            password,
            referralCode: referralCode || undefined,
          }
        });

        if (error) {
          console.error("Signup error:", error);
          // Extract error message from edge function response
          let errorMessage = "Signup failed. Please try again.";
          try {
            if (error.context?.body) {
              const bodyData = typeof error.context.body === 'string' 
                ? JSON.parse(error.context.body) 
                : error.context.body;
              errorMessage = bodyData.error || errorMessage;
            } else if (error.message) {
              errorMessage = error.message;
            }
          } catch (e) {
            // Use default error message
          }
          
          if (errorMessage.includes("already exists")) {
            toast.error("An account with this email already exists. Switching to login...");
            // Switch to login mode
            navigate('/auth?mode=login');
          } else {
            toast.error(errorMessage);
          }
          setLoading(false);
          return;
        }

        if (data?.error) {
          if (data.error.includes("already exists")) {
            toast.error("An account with this email already exists. Switching to login...");
            navigate('/auth?mode=login');
          } else {
            toast.error(data.error);
          }
          setLoading(false);
          return;
        }

        if (data?.success && data?.userId) {
          if (referralCode) {
            clearReferralCode();
          }
          setCurrentUser({ id: data.userId, email: email.toLowerCase() });
          setShowEmailVerification(true);
          toast.success("Verification code sent to your email!");
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please try again.");
          } else if (error.message.includes("Email not confirmed")) {
            // Email not confirmed - tell user to check their email or sign up again
            toast.error("Your email is not verified. Please check your inbox for a verification code, or sign up again.");
          } else {
            throw error;
          }
        } else if (data?.user) {
          // Login successful - the onAuthStateChange handler will redirect
          // No need to do anything here
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      // Use resend-verification-code edge function for password reset
      const { data, error } = await supabase.functions.invoke('resend-verification-code', {
        body: {
          email: email.toLowerCase(),
          type: 'password_reset'
        }
      });

      if (error) {
        console.error("Email error:", error);
      }

      toast.success("Reset code sent to your email");
      setShowForgotPassword(false);
      setShowPasswordResetVerification(true);
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast.error(error.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetVerified = (token?: string) => {
    if (token) {
      setResetToken(token);
      setShowPasswordResetVerification(false);
      setShowNewPasswordForm(true);
    }
  };

  const handleEmailVerified = async () => {
    setShowEmailVerification(false);
    
    if (currentUser && email && password) {
      // Auto-sign in the user after email verification
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("Auto sign-in failed:", error);
          toast.error("Verification successful! Please sign in with your credentials.");
          navigate('/auth');
          return;
        }

        if (data?.user) {
          // Check if user needs username selection
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("user_id", data.user.id)
            .single();

          if (profile?.username?.startsWith("temp_")) {
            toast.success("Email verified! Now choose your username.");
            setCurrentUser({ id: data.user.id, email: data.user.email || "" });
            setShowUsernameSelection(true);
          } else {
            toast.success("Welcome to Nomiqa!");
            navigate('/');
          }
        }
      } catch (err) {
        console.error("Error during auto sign-in:", err);
        toast.success("Verification successful! Please sign in.");
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback if we don't have credentials stored
      toast.success("Email verified! Please sign in to continue.");
      navigate('/auth');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please enter and confirm your new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Use the reset-password edge function with the verified token
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: {
          email: email.toLowerCase(),
          resetToken: resetToken,
          newPassword: newPassword
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Password reset successfully! Please sign in.");
      setShowNewPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
      setResetToken("");
      navigate('/auth');
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // Show email verification screen (for signup)
  if (showEmailVerification && currentUser) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <NetworkBackground color="rgb(34, 211, 238)" />
        <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
          <EmailVerification 
            email={currentUser.email}
            type="registration"
            onVerified={handleEmailVerified}
            onBack={() => {
              setShowEmailVerification(false);
              setCurrentUser(null);
            }}
          />
        </div>
      </div>
    );
  }

  // Show password reset OTP verification screen
  if (showPasswordResetVerification) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <NetworkBackground color="rgb(34, 211, 238)" />
        <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
          <EmailVerification 
            email={email}
            type="password_reset"
            onVerified={handlePasswordResetVerified}
            onBack={() => {
              setShowPasswordResetVerification(false);
              setShowForgotPassword(true);
            }}
          />
        </div>
      </div>
    );
  }

  // Show new password form (after OTP verified)
  if (showNewPasswordForm) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <NetworkBackground color="rgb(34, 211, 238)" />
        <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
          <Card className="w-full max-w-md bg-card backdrop-blur-xl border-border shadow-2xl overflow-hidden animate-fade-in">
            <CardHeader className="text-center pb-4 pt-8">
              <div className="mb-8">
                <img 
                  src={nomiqaAnimatedLogo} 
                  alt="Nomiqa" 
                  className="h-24 md:h-32 w-auto mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/')}
                />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                {t("resetPassword") || "Create New Password"}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("enterNewPassword") || "Enter your new password"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("newPassword") || "New Password"}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("confirmPassword") || "Confirm Password"}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("resetPassword") || "Reset Password"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowNewPasswordForm(false);
                  navigate('/auth');
                }}
                className="w-full"
              >
                ← {t("backToLogin") || "Back to Login"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show reset password form (from email link - Supabase redirect)
  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <NetworkBackground color="rgb(34, 211, 238)" />
        <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
          <Card className="w-full max-w-md bg-card backdrop-blur-xl border-border shadow-2xl overflow-hidden animate-fade-in">
            <CardHeader className="text-center pb-4 pt-8">
              <div className="mb-8">
                <img 
                  src={nomiqaAnimatedLogo} 
                  alt="Nomiqa" 
                  className="h-24 md:h-32 w-auto mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/')}
                />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                {t("resetPassword") || "Reset Password"}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("enterNewPassword") || "Enter your new password"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("newPassword") || "New Password"}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("confirmPassword") || "Confirm Password"}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("resetPassword") || "Reset Password"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowResetPassword(false);
                  navigate('/auth');
                }}
                className="w-full"
              >
                ← {t("backToLogin") || "Back to Login"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show forgot password form
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <NetworkBackground color="rgb(34, 211, 238)" />
        <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
          <Card className="w-full max-w-md bg-card backdrop-blur-xl border-border shadow-2xl overflow-hidden animate-fade-in">
            <CardHeader className="text-center pb-4 pt-8">
              <div className="mb-8">
                <img 
                  src={nomiqaAnimatedLogo} 
                  alt="Nomiqa" 
                  className="h-24 md:h-32 w-auto mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/')}
                />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                {t("forgotPassword") || "Forgot Password"}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("forgotPasswordDescription") || "Enter your email and we'll send you a reset code"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email") || "Email"}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <Button
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("sendResetCode") || "Send Reset Code"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowForgotPassword(false)}
                className="w-full"
              >
                ← {t("backToLogin") || "Back to Login"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <NetworkBackground color="rgb(34, 211, 238)" />
      
      {/* Simple background */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-1/4 w-[500px] h-[500px] bg-neon-cyan/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
        {checkingSession ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">{t("loading") || "Loading..."}</p>
          </div>
        ) : showUsernameSelection && currentUser ? (
          <UsernameSelection 
            userId={currentUser.id}
            email={currentUser.email}
            onComplete={handleUsernameComplete}
          />
        ) : (
          <Card className="w-full max-w-md bg-card backdrop-blur-xl border-border shadow-2xl overflow-hidden animate-fade-in">
            <CardHeader className="text-center pb-4 relative pt-8">
              {/* Animated Logo */}
              <div className="mb-8">
                <img 
                  src={nomiqaAnimatedLogo} 
                  alt="Nomiqa" 
                  className="h-24 md:h-32 w-auto mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/')}
                />
              </div>
              
              <CardTitle className="text-3xl md:text-4xl font-black text-foreground mb-2">
                {isSignup ? t("createAccount") : t("welcomeBack")}
              </CardTitle>
              <CardDescription className="text-sm md:text-base text-muted-foreground">
                {isSignup ? t("signupSubtitle") : t("loginSubtitle")}
              </CardDescription>
            </CardHeader>

            <CardContent className="relative space-y-4">
              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("email") || "Email"}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">{t("password") || "Password"}</Label>
                    {!isSignup && (
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        {t("forgotPassword") || "Forgot password?"}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isSignup && (
                  <div className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                    <Checkbox 
                      id="terms" 
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                      className="mt-0.5"
                    />
                    <label 
                      htmlFor="terms" 
                      className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                    >
                      {t("agreeToTerms") || "I agree to the"}{" "}
                      <a 
                        href="/terms" 
                        target="_blank" 
                        className="text-primary hover:underline font-medium"
                      >
                        {t("termsOfService") || "Terms of Service"}
                      </a>{" "}
                      {t("andWord") || "and"}{" "}
                      <a 
                        href="/privacy" 
                        target="_blank" 
                        className="text-primary hover:underline font-medium"
                      >
                        {t("privacyPolicy") || "Privacy Policy"}
                      </a>
                    </label>
                  </div>
                )}

                <Button 
                  type="submit"
                  className="w-full h-12 text-base font-medium"
                  disabled={loading || (isSignup && !agreedToTerms)}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-5 w-5 mr-2" />
                  )}
                  {loading ? t("loading") : (isSignup ? t("signUp") || "Sign Up" : t("login") || "Sign In")}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {t("orContinueWith") || "or continue with"}
                  </span>
                </div>
              </div>

              {/* Google Sign In */}
              <Button 
                onClick={handleGoogleSignIn}
                className="w-full h-12 text-base font-medium bg-white text-gray-800 hover:bg-gray-100 border border-gray-300 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-3" 
                disabled={loading || (isSignup && !agreedToTerms)}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                {isSignup ? t("signUpWithGoogle") || "Sign up with Google" : t("continueWithGoogle") || "Continue with Google"}
              </Button>

              <div className="pt-4 border-t border-border text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  {isSignup ? t("alreadyHaveAccount") : t("noAccountYet")}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(isSignup ? '/auth' : '/auth?mode=signup')}
                  className="w-full"
                >
                  {isSignup ? t("login") : t("createAccount")}
                </Button>
              </div>

              <div className="pt-2">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/')}
                  className="w-full hover:bg-muted transition-all font-semibold"
                >
                  ← {t("backToHome")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
