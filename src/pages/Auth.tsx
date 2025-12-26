import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NetworkBackground } from "@/components/NetworkBackground";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import nomiqaAnimatedLogo from "@/assets/nomiqa-animated-logo.gif";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";

export default function Auth() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST (critical for proper session handling)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, 'Session:', !!session);
      
      if (event === 'SIGNED_IN' && session) {
        // Track affiliate registration if there's a referral code
        const { referralCode, clearReferralCode } = useAffiliateTracking.getState();
        if (referralCode && session.user) {
          setTimeout(async () => {
            try {
              await supabase.functions.invoke('track-affiliate-registration', {
                body: {
                  referralCode,
                  userId: session.user.id,
                  referrer: document.referrer
                }
              });
              console.log('Affiliate registration tracked');
              clearReferralCode();
            } catch (trackError) {
              console.error('Error tracking affiliate registration:', trackError);
            }
          }, 0);
        }

        // Create or update profile for Google OAuth users
        setTimeout(async () => {
          try {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (!existingProfile) {
              // Create profile for new Google OAuth user
              const email = session.user.email || '';
              const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').substring(0, 20).toLowerCase();
              
              await supabase.from('profiles').insert({
                user_id: session.user.id,
                username: username || `user_${Date.now()}`,
                email: email,
                email_verified: true, // Google already verified email
                is_early_member: true,
              });
            }
          } catch (profileError) {
            console.error('Error creating profile:', profileError);
          }
        }, 0);

        toast.success("Successfully signed in!");
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get('redirect') || '/';
        navigate(redirectUrl);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        // Don't sign out here - just clear the error state
        return;
      }
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
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
              {t("welcomeBack")}
            </CardTitle>
            <CardDescription className="text-sm md:text-base text-muted-foreground">
              {t("loginSubtitle")}
            </CardDescription>
          </CardHeader>

          <CardContent className="relative">
            <Button 
              onClick={handleGoogleSignIn}
              className="w-full h-12 text-base font-medium bg-white text-gray-800 hover:bg-gray-100 border border-gray-300 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-3" 
              disabled={loading}
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
              {loading ? t("loading") : t("continueWithGoogle")}
            </Button>

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
