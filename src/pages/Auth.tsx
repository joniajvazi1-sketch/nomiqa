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

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
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
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        // Handle password reset
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });

        if (error) throw error;
        
        toast.success("Password reset email sent! Check your inbox.");
        setIsForgotPassword(false);
        setEmail("");
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

        // Create profile with username
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              username: username.toLowerCase()
            });

          if (profileError) throw profileError;
        }

        toast.success("Check your email to confirm your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Successfully logged in!");
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

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
              {isForgotPassword ? "Reset Password" : isSignUp ? t("createAccount") : t("welcomeBack")}
            </CardTitle>
            <CardDescription className="text-sm md:text-base text-muted-foreground">
              {isForgotPassword 
                ? "Enter your email to receive a password reset link" 
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
                {isForgotPassword ? "Send Reset Link" : isSignUp ? t("registerButton") : t("loginButton")}
              </Button>
            </form>

            {!isForgotPassword && !isSignUp && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                >
                  Forgot password?
                </button>
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
                  ? "Back to login"
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