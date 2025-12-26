import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroSunsetBg from "@/assets/hero-sunset-background.png";
import heroMobileSunsetWebp from "@/assets/hero-mobile-sunset.webp";
import heroMobileSunsetPng from "@/assets/hero-mobile-sunset.png";
import { useTranslation } from "@/contexts/TranslationContext";
import { ArrowRight, Check, Wifi, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (profile?.username) {
          setUsername(profile.username);
        }
      }
    };
    checkAuthAndFetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      setIsLoggedIn(!!session);
      
      if (session?.user) {
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (profile?.username) {
            setUsername(profile.username);
          }
        }, 0);
      } else {
        setUsername(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getGreeting = () => {
    if (username) {
      return t("heroWelcomeBackUser").replace("{name}", username);
    }
    return t("heroWelcomeBack");
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Premium background with elegant overlay */}
      <div className="absolute inset-0">
        <picture>
          <source media="(min-width: 768px)" srcSet={heroSunsetBg} type="image/png" />
          <source srcSet={heroMobileSunsetWebp} type="image/webp" />
          <img 
            src={heroMobileSunsetPng} 
            alt="Sunset cityscape" 
            width={1080}
            height={1920}
            className="w-full h-full object-cover object-center md:object-center object-[70%_center]" 
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </picture>
        {/* Ultra minimal overlay - maximum background visibility */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      
      <div className="container relative z-10 px-6 md:px-8 pt-32 pb-24 md:py-32">
        <div className="max-w-4xl mx-auto">
          
          {/* DePIN Trust Badge */}
          <div className="flex justify-center mb-6 animate-fade-in" style={{ animationDelay: "0.05s" }}>
            <div className="inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-full bg-white/15 border border-neon-cyan/30 text-neon-cyan text-[10px] md:text-sm font-medium text-center">
              <Wifi className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">{t("heroNetworkBadge")}</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-6 md:mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold font-display leading-[1.1] tracking-tight">
              <span className="block bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
                {t("heroNetworkHeadline")}
              </span>
            </h1>
          </div>
          
          {/* Subheadline */}
          <div className="text-center mb-8 md:mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <p className="text-base md:text-lg lg:text-xl text-white/90 font-light leading-relaxed">
              {t("heroNetworkSubheadline")}
            </p>
          </div>

          {/* Benefits List */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 mb-8 md:mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-2 text-white/80 text-sm md:text-base">
              <div className="w-5 h-5 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-neon-cyan" />
              </div>
              <span>{t("heroNetworkBenefit1")}</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm md:text-base">
              <div className="w-5 h-5 rounded-full bg-neon-violet/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-neon-violet" />
              </div>
              <span>{t("heroNetworkBenefit2")}</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm md:text-base">
              <div className="w-5 h-5 rounded-full bg-neon-coral/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-neon-coral" />
              </div>
              <span>{t("heroNetworkBenefit3")}</span>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="max-w-md mx-auto animate-fade-in text-center" style={{ animationDelay: "0.25s" }}>
            {isLoggedIn ? (
              <div className="space-y-3">
                <p className="text-neon-cyan text-xs md:text-sm font-medium animate-pulse">
                  {getGreeting()}
                </p>
                <Button 
                  onClick={() => navigate('/affiliate')}
                  size="lg" 
                  className="h-12 md:h-14 px-8 md:px-12 text-sm md:text-base font-medium bg-white hover:bg-white/95 text-deep-space rounded-xl shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105"
                >
                  <Users className="mr-2 w-4 h-4" />
                  {t("heroStartReferring")}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => navigate('/auth?mode=register')}
                size="lg" 
                className="h-12 md:h-14 px-8 md:px-12 text-sm md:text-base font-medium bg-white hover:bg-white/95 text-deep-space rounded-xl shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105"
              >
                {t("heroRegisterCta")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
            
            {/* Microcopy */}
            <p className="mt-4 text-white/60 text-xs md:text-sm">
              {isLoggedIn ? t("heroReferringMicrocopy") : t("heroRegisterMicrocopy")}
            </p>
          </div>

          {/* Secondary Action - View eSIM Plans Button */}
          <div className="text-center mt-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button 
              onClick={() => navigate('/shop')} 
              variant="outline"
              className="bg-white/15 border-white/20 text-white hover:bg-white/25 hover:text-white rounded-xl transition-colors duration-200"
            >
              {t("heroViewEsimPlans")}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

        </div>
      </div>

      {/* Simplified scroll indicator - removed continuous animation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
          <div className="w-1 h-3 rounded-full bg-white/40"></div>
        </div>
      </div>
    </section>
  );
};
