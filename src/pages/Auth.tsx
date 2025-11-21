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
import nomiqaLogo from "@/assets/nomiqa-logo.jpg";

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
    <div className="min-h-screen bg-gradient-to-br from-deep-space via-midnight-blue to-deep-space relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-violet/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-coral/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-neon-cyan/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }}></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
        {/* Logo at the top - desktop only */}
        <div className="hidden md:block absolute top-8 left-1/2 -translate-x-1/2 z-20">
          <img 
            src={nomiqaLogo} 
            alt="Nomiqa" 
            className="h-16 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          />
        </div>

        <Card className="w-full max-w-md bg-white/[0.02] backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden animate-fade-in">
          {/* Card glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-neon-violet/5 via-transparent to-neon-cyan/5 pointer-events-none"></div>
          
          <CardHeader className="text-center pb-4 relative pt-8">
            {/* Logo at the top - mobile only */}
            <div className="md:hidden mb-6">
              <img 
                src={nomiqaLogo} 
                alt="Nomiqa" 
                className="h-12 w-auto mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/')}
              />
            </div>
            
            <CardTitle className="text-3xl md:text-4xl font-black bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-coral bg-clip-text text-transparent mb-2">
              {isSignUp ? t("createAccount") : t("welcomeBack")}
            </CardTitle>
            <CardDescription className="text-sm md:text-base text-foreground/70">
              {isSignUp ? t("signupSubtitle") : t("loginSubtitle")}
            </CardDescription>
          </CardHeader>

          <CardContent className="relative">
            <form onSubmit={handleAuth} className="space-y-5">
              {isSignUp && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="username" className="text-sm font-semibold text-foreground/90">
                    {t("usernameLabel")}
                  </Label>
                  <div className="relative group">
                    <Input
                      id="username"
                      type="text"
                      placeholder={t("usernamePlaceholder")}
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      required={isSignUp}
                      minLength={3}
                      maxLength={20}
                      className="bg-white/[0.03] border-white/10 focus:border-neon-cyan/50 focus:bg-white/[0.05] transition-all h-11 text-base backdrop-blur-sm group-hover:border-white/20"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-neon-cyan/10 to-neon-violet/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                  <p className="text-xs text-muted-foreground/80 mt-1.5">
                    {t("usernameHint")}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground/90">
                  {t("authEmailLabel")}
                </Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/[0.03] border-white/10 focus:border-neon-violet/50 focus:bg-white/[0.05] transition-all h-11 text-base backdrop-blur-sm group-hover:border-white/20"
                  />
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-neon-violet/10 to-neon-coral/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground/90">
                  {t("authPasswordLabel")}
                </Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-white/[0.03] border-white/10 focus:border-neon-coral/50 focus:bg-white/[0.05] transition-all h-11 text-base backdrop-blur-sm group-hover:border-white/20"
                  />
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-neon-coral/10 to-neon-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-neon-violet via-neon-coral to-neon-cyan hover:from-neon-violet/90 hover:via-neon-coral/90 hover:to-neon-cyan/90 transition-all shadow-lg hover:shadow-neon-violet/50 mt-6 relative overflow-hidden group" 
                disabled={loading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/20 via-neon-violet/20 to-neon-coral/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative flex items-center justify-center gap-2">
                  {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                  {isSignUp ? t("registerButton") : t("loginButton")}
                </span>
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-neon-cyan transition-colors font-medium inline-flex items-center gap-1 group"
              >
                <span className="relative">
                  {isSignUp
                    ? `${t("alreadyHaveAccount")} ${t("loginButton")}`
                    : `${t("noAccountYet")} ${t("registerButton")}`}
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-neon-cyan scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                </span>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="w-full hover:bg-white/[0.05] hover:text-neon-violet transition-all font-semibold group"
              >
                <span className="flex items-center gap-2">
                  <span className="group-hover:-translate-x-1 transition-transform">←</span>
                  {t("backToHome")}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}