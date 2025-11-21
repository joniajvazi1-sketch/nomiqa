import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroSunsetBg from "@/assets/hero-sunset-background.png";
import heroMobileSunset from "@/assets/hero-mobile-sunset.png";
import { useTranslation } from "@/contexts/TranslationContext";
import { ArrowRight, Shield, Globe } from "lucide-react";

export const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Premium background with elegant overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroSunsetBg} 
          alt="Sunset cityscape" 
          className="hidden md:block w-full h-full object-cover object-center" 
          loading="eager"
        />
        <img 
          src={heroMobileSunset} 
          alt="Person using phone at sunset" 
          className="md:hidden w-full h-full object-cover object-center" 
          loading="eager"
        />
        {/* Ultra minimal overlay - maximum background visibility */}
        <div className="absolute inset-0 bg-black/10"></div>
      </div>
      
      <div className="container relative z-10 px-6 md:px-8 py-32 md:py-40">
        <div className="max-w-6xl mx-auto">
          {/* Premium badge */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
              <Shield className="w-4 h-4 text-neon-cyan" />
              <span className="text-xs md:text-sm font-semibold tracking-widest uppercase text-white/90">
                {t("heroBadge")}
              </span>
            </div>
          </div>

          {/* Hero headline - Premium typography */}
          <div className="text-center mb-10 md:mb-12 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-light font-display leading-[1.1] tracking-tight mb-6">
              <span className="block text-white font-extralight mb-3">{t("heroPrivate")}</span>
              <span className="block bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent font-semibold">
                {t("heroBorderless")} {t("heroHuman")}
              </span>
            </h1>
          </div>
          
          {/* Premium description */}
          <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <p className="text-lg md:text-xl lg:text-2xl text-white/95 font-light leading-relaxed mb-4">
              {t("heroDescription1")}
            </p>
            <p className="text-base md:text-lg text-white/70 font-light leading-relaxed">
              {t("heroDescription2")}
            </p>
          </div>
          
          {/* Premium CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button 
              size="lg" 
              onClick={() => navigate('/shop')} 
              className="group bg-white hover:bg-white/95 text-deep-space font-semibold px-10 py-7 text-base md:text-lg rounded-2xl shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:scale-105 border border-white/20"
            >
              {t("heroBuyNow")}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="ghost" 
              size="lg" 
              onClick={() => navigate('/getting-started')} 
              className="group backdrop-blur-xl bg-white/5 hover:bg-white/10 text-white border-2 border-white/20 hover:border-white/40 px-10 py-7 text-base md:text-lg rounded-2xl transition-all duration-300"
            >
              {t("heroWatchHow")}
              <Globe className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
            </Button>
          </div>

          {/* Premium trust indicators */}
          <div className="mt-16 md:mt-20 flex flex-wrap justify-center items-center gap-8 md:gap-12 text-white/60 text-sm animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan"></div>
              <span className="font-light">{t("heroCountries")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-violet"></div>
              <span className="font-light">{t("heroNoKyc")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-coral"></div>
              <span className="font-light">{t("heroCryptoOnly")}</span>
            </div>
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
