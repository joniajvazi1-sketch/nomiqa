import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroSunsetBg from "@/assets/hero-sunset-background.png";
import heroMobileSunset from "@/assets/hero-mobile-sunset.png";
import { useTranslation } from "@/contexts/TranslationContext";

export const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background images with very light overlay */}
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
        <div className="absolute inset-0 bg-gradient-to-br from-background/10 via-deep-space/15 to-background/10"></div>
      </div>
      
      <div className="container relative z-10 px-4 py-24 md:py-32">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-6 md:mb-8 animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold font-display leading-tight">
              <span className="text-neon-cyan">{t("heroPrivate")}</span>{" "}
              <span className="text-neon-blue">{t("heroBorderless")}</span>{" "}
              <span className="bg-gradient-to-r from-neon-pink via-neon-coral to-warm-sand bg-clip-text text-transparent">{t("heroHuman")}</span>
            </h1>
          </div>
          
          <div className="mb-6 md:mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <p className="text-lg md:text-xl lg:text-2xl text-white/95 mb-2 leading-relaxed">{t("heroDescription1")}</p>
            <p className="text-base md:text-lg lg:text-xl text-white/90 leading-relaxed">{t("heroDescription2")}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Button size="lg" onClick={() => navigate('/shop')} className="bg-neon-coral hover:bg-neon-coral/90 text-white font-semibold px-8 py-5 text-base md:text-lg rounded-xl shadow-xl hover:shadow-neon-coral/50 transition-all">
              {t("heroBuyNow")}
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/getting-started')} className="border-2 border-neon-cyan/70 text-neon-cyan hover:bg-neon-cyan/10 px-6 py-5 text-base md:text-lg rounded-xl backdrop-blur-sm">
              {t("heroWatchHow")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
