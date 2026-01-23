import { TrendingUp } from "lucide-react";
import solanaLogo from "@/assets/solana-logo.svg";
import phantomLogo from "@/assets/phantom-logo.png";
import meteoraLogo from "@/assets/meteora-logo.jpg";
import moonpayLogo from "@/assets/moonpay-logo.jpg";
import { useSolanaPrice } from "@/hooks/useSolanaPrice";
import { useTranslation } from "@/contexts/TranslationContext";
import { useEffect, useRef, useState } from "react";

export const TrustPartners = () => {
  const { price, isLoading } = useSolanaPrice();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  
  return (
    <section ref={sectionRef} className="py-12 md:py-16 bg-gradient-to-b from-background via-card/30 to-background border-y border-border/30 relative overflow-hidden">
      <div className="container px-4 sm:px-6 relative z-10">
        <div className={`text-center mb-8 md:mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <p className="text-muted-foreground uppercase tracking-widest text-xs font-medium mb-3">
            {t("trustInfrastructureTag")}
          </p>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
            {t("trustMainTitle")}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            {t("trustSubtitle")}
          </p>
        </div>
        
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Solana */}
          <div className="group flex flex-col items-center justify-center p-5 sm:p-6 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-300">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-muted/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <img src={solanaLogo} alt="Solana" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10" loading="lazy" />
            </div>
            <span className="text-foreground font-medium text-sm sm:text-base mb-0.5">Solana</span>
            {!isLoading && price ? (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-neon-cyan text-xs sm:text-sm">${price.usd.toFixed(2)}</span>
                <TrendingUp className={`w-3 h-3 ${price.usd_24h_change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
            ) : (
              <span className="text-muted-foreground text-xs mt-1">{t("trustLightningFast")}</span>
            )}
          </div>
          
          {/* Phantom */}
          <div className="group flex flex-col items-center justify-center p-5 sm:p-6 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-300">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-muted/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <img src={phantomLogo} alt="Phantom Wallet" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" loading="lazy" />
            </div>
            <span className="text-foreground font-medium text-sm sm:text-base mb-0.5">Phantom</span>
            <span className="text-muted-foreground text-xs mt-1 text-center">{t("trustTrustedWallet")}</span>
          </div>
          
          {/* Meteora */}
          <div className="group flex flex-col items-center justify-center p-5 sm:p-6 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-300">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-muted/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <img src={meteoraLogo} alt="Meteora" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" loading="lazy" />
            </div>
            <span className="text-foreground font-medium text-sm sm:text-base mb-0.5">Meteora</span>
            <span className="text-muted-foreground text-xs mt-1 text-center">{t("trustDefiProtocol")}</span>
          </div>
          
          {/* MoonPay */}
          <div className="group flex flex-col items-center justify-center p-5 sm:p-6 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all duration-300">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-muted/50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <img src={moonpayLogo} alt="MoonPay" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" loading="lazy" />
            </div>
            <span className="text-foreground font-medium text-sm sm:text-base mb-0.5">MoonPay</span>
            <span className="text-muted-foreground text-xs mt-1 text-center">{t("trustCryptoGateway")}</span>
          </div>
        </div>
      </div>
    </section>
  );
};