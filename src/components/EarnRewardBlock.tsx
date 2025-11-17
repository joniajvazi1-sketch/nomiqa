import { Button } from "@/components/ui/button";
import { Coins, Gift, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import tokenLogo from "@/assets/nomiqa-token-logo.gif";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/contexts/TranslationContext";

export const EarnRewardBlock = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
      }
    }, {
      threshold: 0.1
    });
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);
  
  const benefits = [{
    icon: <Coins className="w-5 h-5" />,
    text: t("redeemTokens")
  }, {
    icon: <Gift className="w-5 h-5" />,
    text: t("earnForReferrals")
  }, {
    icon: <Users className="w-5 h-5" />,
    text: t("growNetwork")
  }];
  return <section ref={sectionRef} className="py-12 px-4 bg-gradient-to-b from-background via-background/95 to-background">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-accent/10 to-primary/15 p-8 md:p-12 shadow-xl shadow-primary/10">
          {/* Decorative glow - brighter */}
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-primary/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-accent/40 rounded-full blur-3xl animate-pulse" />
          
          <div className={`relative z-10 text-center space-y-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Headline with Logo */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 mb-2">
                <img 
                  src={tokenLogo} 
                  alt="NOMIQA Token" 
                  className="w-auto h-16 md:h-20 object-contain animate-pulse" 
                  loading="lazy"
                />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
                {t("earnAsConnectTitle")}
              </h2>
            </div>

            {/* Subline */}
            <p className="text-base md:text-lg text-foreground/90 max-w-2xl mx-auto font-medium">
              {t("earnAsConnectDesc")}
            </p>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              {benefits.map((benefit, index) => <div key={index} className={`flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/30 hover:border-primary/50 hover:bg-primary/15 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{
              animationDelay: `${index * 150}ms`
            }}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                    {benefit.icon}
                  </div>
                  <p className="text-sm font-medium text-foreground text-left">
                    {benefit.text}
                  </p>
                </div>)}
            </div>

            {/* CTA Button */}
            <div className="pt-6">
              <Button size="lg" variant="cyber" onClick={() => navigate('/token')} className="text-base px-8 hover:scale-105 transition-transform duration-300 shadow-lg shadow-primary/20">
                {t("discoverToken")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>;
};