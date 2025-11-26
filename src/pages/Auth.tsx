import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { z } from "zod";
import nomiqaAnimatedLogo from "@/assets/nomiqa-animated-logo.gif";
import { EmailVerification } from "@/components/EmailVerification";

const authSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255, 'Email too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
  username: z.string()
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .optional()
});

export default function Auth() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [verificationType, setVerificationType] = useState<'registration' | 'password_reset'>('registration');
  const [newPassword, setNewPassword] = useState("");
  const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Don't redirect if we're showing verification
      if (session && !showVerification) {
        navigate('/');
      }
    });

    // Check if URL has mode parameter for register/login
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'register') {
      setIsSignUp(true);
    } else if (mode === 'login') {
      setIsSignUp(false);
    }
  }, [navigate, showVerification]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        // Request password reset code via edge function
        const { error } = await supabase.functions.invoke('resend-verification-code', {
          body: {
            email,
            type: 'password_reset',
          },
        });

        if (error) throw error;

        toast.success("Reset code sent! Check your email.");
        setVerificationType('password_reset');
        setShowVerification(true);
        setLoading(false);
        return;
      }

      // Validate input with Zod schema
      const validationResult = authSchema.safeParse({
        email,
        password,
        username: isSignUp ? username : undefined
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        setLoading(false);
        return;
      }

      if (isSignUp) {
        // Check if username already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username.toLowerCase())
          .maybeSingle();

        if (existingProfile) {
          throw new Error('Username already taken');
        }

        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (error) throw error;

        // Create profile with username and verification code
        if (authData.user) {
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              username: username.toLowerCase(),
              email_verified: false,
              verification_code: code,
              verification_code_expires_at: expiresAt,
            });

          if (profileError) throw profileError;

          // Send verification email
          await supabase.functions.invoke('send-email', {
            body: {
              type: 'user_verification',
              to: email,
              data: { code },
            },
          });

          // CRITICAL: Sign out immediately - no session until email verified
          await supabase.auth.signOut();
          
          toast.success("Verification code sent! Check your email to activate your account.");
          setVerificationType('registration');
          setShowVerification(true);
        }
      } else {
        // Try to sign in
        const { error, data: authData } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Only enforce email verification for accounts created after 2025-11-25
        const accountCreatedAt = new Date(authData.user.created_at);
        const verificationCutoffDate = new Date('2025-11-25T00:00:00Z');
        const requiresVerification = accountCreatedAt >= verificationCutoffDate;
        
        if (requiresVerification) {
          // Get THIS user's profile to check verification status
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('email_verified')
            .eq('user_id', authData.user.id)
            .single();
          
          if (!userProfile?.email_verified) {
            // Immediately sign them out
            await supabase.auth.signOut();
            toast.error("Email not verified. Please check your inbox for the verification code.");
            setShowResendVerification(true);
            setLoading(false);
            return;
          }
        }

        toast.success("Successfully logged in!");
        
        // Check for redirect parameter
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get('redirect') || '/';
        navigate(redirectUrl);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = async (token?: string) => {
    if (verificationType === 'registration') {
      toast.success("Email verified! You can now log in.");
      setShowVerification(false);
      setIsSignUp(false);
      setEmail("");
      setPassword("");
      setUsername("");
    } else {
      // Password reset verified, now show new password input form
      setShowVerification(false);
      setShowNewPasswordForm(true);
      if (token) {
        setResetToken(token);
      }
      toast.info("Enter your new password");
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('resend-verification-code', {
        body: {
          email,
          type: 'registration',
        },
      });

      if (error) throw error;

      toast.success("Verification code resent! Check your email.");
      setVerificationType('registration');
      setShowVerification(true);
      setShowResendVerification(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to resend verification code");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('reset-password', {
        body: {
          email,
          resetToken,
          newPassword,
        },
      });

      if (error) throw error;

      toast.success("Password reset successfully! You can now log in.");
      setShowNewPasswordForm(false);
      setNewPassword("");
      setResetToken("");
      setIsForgotPassword(false);
      setIsSignUp(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/20"></div>
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
          <EmailVerification
            email={email}
            type={verificationType}
            onVerified={handleVerified}
            onBack={() => setShowVerification(false)}
          />
        </div>
      </div>
    );
  }

  if (showNewPasswordForm) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/20"></div>
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
          <Card className="w-full max-w-md bg-card backdrop-blur-xl border-border shadow-2xl">
            <CardHeader className="text-center pb-4 relative pt-8">
              <div className="mb-8">
                <img 
                  src={nomiqaAnimatedLogo} 
                  alt="Nomiqa" 
                  className="h-24 md:h-32 w-auto mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate('/')}
                />
              </div>
              <CardTitle className="text-3xl md:text-4xl font-black text-foreground mb-2">
                {t("setNewPassword")}
              </CardTitle>
              <CardDescription className="text-sm md:text-base text-muted-foreground">
                {t("enterNewPasswordDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordReset} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-semibold">
                    {t("newPasswordLabel")}
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-11 text-base"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {t("passwordRequirements")}
                  </p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 transition-all shadow-lg" 
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
                  {t("resetPasswordButton")}
                </Button>
              </form>
              <div className="mt-6 pt-6 border-t border-border">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowNewPasswordForm(false);
                    setNewPassword("");
                    setResetToken("");
                  }}
                  className="w-full hover:bg-muted transition-all font-semibold"
                >
                  ← {t("backToLogin")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Simple background */}
      <div className="absolute inset-0 bg-muted/20"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
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
              {isForgotPassword ? t("resetPasswordTitle") : isSignUp ? t("createAccount") : t("welcomeBack")}
            </CardTitle>
            <CardDescription className="text-sm md:text-base text-muted-foreground">
              {isForgotPassword 
                ? t("resetPasswordDesc")
                : isSignUp ? t("signupSubtitle") : t("loginSubtitle")}
            </CardDescription>
          </CardHeader>

          <CardContent className="relative">
            <form onSubmit={handleAuth} className="space-y-5">
              {!isForgotPassword && isSignUp && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="username" className="text-sm font-semibold">
                    {t("usernameLabel")}
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={t("usernamePlaceholder")}
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    required={isSignUp}
                    minLength={3}
                    maxLength={20}
                    className="h-11 text-base"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {t("usernameHint")}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">
                  {t("authEmailLabel")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 text-base"
                />
              </div>

              {!isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold">
                    {t("authPasswordLabel")}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 text-base"
                  />
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 transition-all shadow-lg mt-6" 
                disabled={loading}
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
                {isForgotPassword ? t("sendResetLink") : isSignUp ? t("registerButton") : t("loginButton")}
              </Button>
            </form>

            {!isForgotPassword && !isSignUp && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  {t("forgotPassword")}
                </button>
              </div>
            )}

            {showResendVerification && !isForgotPassword && !isSignUp && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-3 text-center">
                  Your email is not verified. Need a new code?
                </p>
                <Button 
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="w-full bg-primary/90 hover:bg-primary"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Resend Verification Code
                </Button>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  if (isForgotPassword) {
                    setIsForgotPassword(false);
                  } else {
                    setIsSignUp(!isSignUp);
                  }
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                {isForgotPassword
                  ? t("backToLogin")
                  : isSignUp
                    ? `${t("alreadyHaveAccount")} ${t("loginButton")}`
                    : `${t("noAccountYet")} ${t("registerButton")}`}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
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
      </div>
    </div>
  );
}