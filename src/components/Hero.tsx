import { ShoppingCart, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import happyTravelers from "@/assets/happy-travelers.jpg";
import { useTranslation } from "@/contexts/TranslationContext";

export const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-nomiqa-cream via-nomiqa-peach/30 to-nomiqa-cream overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-nomiqa-orange/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-nomiqa-teal/20 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10 px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left side - Text */}
          <div className="text-left animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground">
              {t("heroTitle")}
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-foreground/80">
              {t("heroSubtitle")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                size="lg"
                className="bg-nomiqa-orange hover:bg-nomiqa-orange/90 text-white shadow-lg"
                onClick={() => navigate('/shop')}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {t("browseEsims")}
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-2 border-nomiqa-orange text-nomiqa-orange hover:bg-nomiqa-orange/10"
                onClick={() => navigate('/getting-started')}
              >
                {t("getStarted")}
              </Button>
            </div>
            
            <div className="flex flex-col gap-4 text-foreground/70">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-nomiqa-orange" />
                <span className="font-medium">{t("countries")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-nomiqa-orange" />
                <span className="font-medium">{t("noKyc")}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-nomiqa-orange" />
                <span className="font-medium">{t("cryptoPayments")}</span>
              </div>
            </div>
          </div>
          
          {/* Right side - Visual */}
          <div className="relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <img 
              src={happyTravelers} 
              alt="Happy travelers celebrating their connectivity"
              className="w-full h-auto rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};