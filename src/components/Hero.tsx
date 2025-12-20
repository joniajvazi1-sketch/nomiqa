import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import heroSunsetBg from "@/assets/hero-sunset-background.png";
import heroMobileSunset from "@/assets/hero-mobile-sunset.png";
import { useTranslation } from "@/contexts/TranslationContext";
import { ArrowRight, Check, Loader2, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: t("heroNetworkErrorTitle"),
        description: t("heroNetworkErrorInvalidEmail"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("register-network", {
        body: { email: email.trim().toLowerCase(), source: "hero" },
      });

      if (error) {
        console.error("Registration error:", error);
        toast({
          title: t("heroNetworkErrorTitle"),
          description: t("heroNetworkErrorGeneric"),
          variant: "destructive",
        });
        return;
      }

      setIsRegistered(true);
      toast({
        title: t("heroNetworkSuccessTitle"),
        description: t("heroNetworkSuccessDescription"),
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: t("heroNetworkErrorTitle"),
        description: t("heroNetworkErrorGeneric"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Premium background with elegant overlay */}
      <div className="absolute inset-0">
        <picture>
          <source media="(min-width: 768px)" srcSet={heroSunsetBg} />
          <img 
            src={heroMobileSunset} 
            alt="Sunset cityscape" 
            className="w-full h-full object-cover object-center md:object-center object-[70%_center]" 
            loading="eager"
            decoding="async"
          />
        </picture>
        {/* Ultra minimal overlay - maximum background visibility */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      
      <div className="container relative z-10 px-6 md:px-8 py-24 md:py-32">
        <div className="max-w-4xl mx-auto">
          
          {/* DePIN Trust Badge */}
          <div className="flex justify-center mb-6 animate-fade-in" style={{ animationDelay: "0.05s" }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-neon-cyan/30 text-neon-cyan text-xs md:text-sm font-medium">
              <Wifi className="w-3.5 h-3.5" />
              <span>{t("heroNetworkBadge")}</span>
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
          
          {/* Registration Form or Success State */}
          <div className="max-w-md mx-auto animate-fade-in" style={{ animationDelay: "0.25s" }}>
            {!isRegistered ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder={t("heroNetworkEmailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 h-12 md:h-14 bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-neon-cyan focus:ring-neon-cyan/20"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit"
                    size="lg" 
                    disabled={isLoading}
                    className="h-12 md:h-14 px-6 md:px-8 text-sm md:text-base font-medium bg-white hover:bg-white/95 text-deep-space rounded-xl shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105 whitespace-nowrap"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span className="hidden sm:inline">{t("heroNetworkCta")}</span>
                        <span className="sm:hidden">{t("heroNetworkCtaShort")}</span>
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Microcopy */}
                <p className="text-center text-white/60 text-xs md:text-sm">
                  {t("heroNetworkMicrocopy")}
                </p>
              </form>
            ) : (
              <div className="text-center p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-neon-cyan/30">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-neon-cyan" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{t("heroNetworkRegisteredTitle")}</h3>
                <p className="text-white/70 text-sm">{t("heroNetworkRegisteredDescription")}</p>
              </div>
            )}
          </div>

          {/* Secondary Action */}
          <div className="text-center mt-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <button 
              onClick={() => navigate('/shop')} 
              className="text-white/60 hover:text-white text-sm md:text-base font-light transition-colors duration-200 hover:underline underline-offset-4"
            >
              {t("heroNetworkSecondary")}
            </button>
          </div>

        </div>
      </div>

      {/* Elegant scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
          <div className="w-1 h-3 rounded-full bg-white/40"></div>
        </div>
      </div>
    </section>
  );
};
