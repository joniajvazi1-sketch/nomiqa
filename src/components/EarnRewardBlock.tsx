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
  return <section ref={sectionRef} className="py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-gradient-to-b from-black/40 via-deep-space/60 to-black/40">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-neon-violet/30 bg-gradient-to-br from-neon-violet/5 via-neon-coral/5 to-neon-cyan/5 p-8 sm:p-10 md:p-14 shadow-2xl shadow-neon-violet/10 backdrop-blur-xl">
          {/* Premium decorative glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-violet/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-neon-coral/20 rounded-full blur-3xl" />
          
          <div className={`relative z-10 text-center space-y-6 sm:space-y-7 md:space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Headline with Logo */}
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center justify-center gap-4 mb-2">
                <img 
                  src={tokenLogo} 
                  alt="NOMIQA Token" 
                  className="w-auto h-14 sm:h-16 md:h-20 object-contain" 
                  loading="lazy"
                />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent px-4">
                {t("earnAsConnectTitle")}
              </h2>
            </div>

            {/* Subline */}
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed px-4">
              {t("earnAsConnectDesc")}
            </p>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 pt-6 sm:pt-7 md:pt-8">
              {benefits.map((benefit, index) => <div key={index} className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl md:rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-violet/30 hover:bg-white/[0.04] transition-all duration-500 hover-lift ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{
              animationDelay: `${index * 150}ms`
            }}>
                  <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-neon-violet/10 flex items-center justify-center text-neon-violet border border-neon-violet/20">
                    {benefit.icon}
                  </div>
                  <p className="text-xs sm:text-sm md:text-base font-light text-white text-left leading-relaxed">
                    {benefit.text}
                  </p>
                </div>)}
            </div>

            {/* CTA Button */}
            <div className="pt-6 sm:pt-7 md:pt-8">
              <Button size="lg" onClick={() => navigate('/token')} className="bg-white text-black hover:bg-white/90 font-light text-sm sm:text-base md:text-lg px-8 sm:px-10 md:px-12 py-5 sm:py-6 md:py-7 rounded-xl md:rounded-2xl shadow-lg hover:scale-105 transition-all duration-300 w-full sm:w-auto">
                {t("discoverToken")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>;
};