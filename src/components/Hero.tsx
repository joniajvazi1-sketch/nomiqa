import { ShoppingCart, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import explorerHero from "@/assets/explorer-hero.jpg";
import { useTranslation } from "@/contexts/TranslationContext";

export const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-background via-midnight/5 to-background overflow-hidden">
      {/* Signal wave decorations */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-signal blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-gradient-signal blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan/5 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10 px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left side - Text */}
          <div className="text-left animate-fade-in-up">
            <p className="text-sm uppercase tracking-[0.3em] mb-4 text-cyan font-semibold">
              {t("heroTagline")}
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground uppercase tracking-tight leading-[1.1]">
              {t("heroTitle")}
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-muted-foreground font-light italic">
              {t("heroSubtitle")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button 
                size="lg"
                className="bg-cyan hover:bg-cyan/90 text-midnight shadow-shadow-signal uppercase tracking-wide font-semibold"
                onClick={() => navigate('/shop')}
              >
                {t("browseEsims")}
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-cyan text-cyan hover:bg-cyan/10 uppercase tracking-wide"
                onClick={() => navigate('/getting-started')}
              >
                {t("getStarted")}
              </Button>
            </div>
            
            <div className="flex flex-col gap-3 text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-cyan rounded-full"></div>
                <span className="text-sm tracking-wide">{t("heroValueFreedom")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-cyan rounded-full"></div>
                <span className="text-sm tracking-wide">{t("heroValueBelonging")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-cyan rounded-full"></div>
                <span className="text-sm tracking-wide">{t("heroValueSovereignty")}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-cyan rounded-full"></div>
                <span className="text-sm tracking-wide">{t("heroValueMovement")}</span>
              </div>
            </div>
          </div>
          
          {/* Right side - Visual */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="absolute -inset-4 bg-gradient-explorer opacity-20 blur-2xl rounded-3xl"></div>
            <img 
              src={explorerHero} 
              alt="The Explorer - Global citizens who navigate the world by their own rules"
              className="relative w-full h-auto rounded-3xl shadow-shadow-warm border border-border/50"
            />
          </div>
        </div>
      </div>
    </section>
  );
};