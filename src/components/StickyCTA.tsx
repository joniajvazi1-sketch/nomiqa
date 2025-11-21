import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ShoppingBag, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";

export const StickyCTA = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 800px down
      if (window.scrollY > 800 && !isDismissed) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDismissed]);

  if (isDismissed) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-40 transition-all duration-500 ${
        isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div className="relative group">
        {/* Single subtle glow */}
        <div className="absolute inset-0 bg-neon-cyan/20 rounded-full blur-xl opacity-50 group-hover:opacity-100 group-hover:blur-2xl transition-all duration-500" />
        
        <Button
          variant="neon"
          size="lg"
          onClick={() => navigate('/shop')}
          className="relative z-10 bg-deep-space/90 backdrop-blur-xl border border-neon-cyan/40 text-white hover:border-neon-cyan hover:bg-deep-space shadow-lg hover:shadow-neon-cyan/50 transition-all duration-300 pr-12 font-light group-hover:scale-105"
        >
          <ShoppingBag className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
          <span className="hidden sm:inline">{t("getEsimNow")}</span>
          <span className="sm:hidden">{t("buyNow")}</span>
        </Button>
        
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-deep-space/95 backdrop-blur-xl border border-white/20 hover:border-neon-violet hover:bg-neon-violet/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
          aria-label={t("dismiss")}
        >
          <X className="w-3.5 h-3.5 text-white/70 hover:text-neon-violet transition-colors duration-300" />
        </button>
      </div>
    </div>
  );
};
