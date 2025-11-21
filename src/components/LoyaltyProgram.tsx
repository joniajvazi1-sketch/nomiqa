import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Crown, TrendingUp, Award, Zap, Wallet, Trophy } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";
import { useEffect, useRef, useState } from "react";

export const LoyaltyProgram = () => {
  const navigate = useNavigate();
  const { language, t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const tiersContainerRef = useRef<HTMLDivElement>(null);
  
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

  useEffect(() => {
    const handleScroll = () => {
      if (!tiersContainerRef.current) return;
      
      const rect = tiersContainerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementHeight = rect.height;
      
      // Calculate how far through the section we've scrolled
      const start = rect.top - windowHeight + windowHeight * 0.3;
      const end = rect.top - windowHeight * 0.3 + elementHeight;
      const distance = end - start;
      const progress = Math.max(0, Math.min(1, -start / distance));
      
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getCardLitState = (index: number) => {
    const threshold = index / 4; // 0, 0.25, 0.5, 0.75
    return scrollProgress >= threshold;
  };

  const tiers = [
    {
      nameKey: "loyaltyTierBronze",
      icon: Award,
      cashback: "5%",
      color: "from-amber-600 to-amber-800",
      requirementKey: "loyaltyAutomatic",
    },
    {
      nameKey: "loyaltyTierSilver",
      icon: TrendingUp,
      cashback: "6%",
      color: "from-gray-400 to-gray-600",
      requirementKey: "loyaltySpent20",
    },
    {
      nameKey: "loyaltyTierGold",
      icon: Zap,
      cashback: "7%",
      color: "from-yellow-400 to-yellow-600",
      requirementKey: "loyaltySpent50",
    },
    {
      nameKey: "loyaltyTierPlatinum",
      icon: Crown,
      cashback: "10%",
      color: "from-purple-400 to-purple-600",
      requirementKey: "loyaltySpent150",
    },
  ];

  return (
    <section ref={sectionRef} className="py-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative overflow-hidden border-y border-white/5">
      {/* Premium background decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/3 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-violet/3 rounded-full blur-3xl"></div>

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className={`text-center mb-12 md:mb-16 lg:mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-block mb-3 md:mb-4">
            <span className="text-neon-coral text-[10px] sm:text-xs md:text-sm font-light tracking-[0.25em] uppercase">
              {t("loyaltyBadge")}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-4 md:mb-6 px-4">
            <span className="block bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent">
              {t("loyaltyTitle")}
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed px-4">
            {t("loyaltySubtitle")}
          </p>
        </div>

        {/* Tiers Grid with Lightning Connection */}
        <div ref={tiersContainerRef} className={`relative transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Animated lightning path - mobile only */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 lg:hidden overflow-hidden">
            {/* Background track */}
            <div className="absolute inset-0 bg-white/10"></div>
            {/* Animated lightning progress */}
            <div 
              className="absolute top-0 left-0 right-0 bg-gradient-to-b from-amber-400 via-yellow-300 to-purple-500 transition-all duration-300 ease-out"
              style={{ 
                height: `${scrollProgress * 100}%`,
                boxShadow: '0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.4)'
              }}
            ></div>
            {/* Glowing tip */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-yellow-300 blur-sm transition-all duration-300 ease-out"
              style={{ 
                top: `${scrollProgress * 100}%`,
                opacity: scrollProgress > 0 && scrollProgress < 1 ? 1 : 0,
                boxShadow: '0 0 15px rgba(253, 224, 71, 0.8)'
              }}
            ></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-5 md:gap-6 mb-10 md:mb-12 lg:mb-16 relative">
            {tiers.map((tier, index) => {
              const Icon = tier.icon;
              const isLit = getCardLitState(index);
              
              return (
                <div 
                  key={tier.nameKey} 
                  className={`group relative p-6 sm:p-7 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-xl border transition-all duration-700 ${
                    isLit 
                      ? index === 3
                        ? 'bg-gradient-to-br from-neon-violet/15 to-neon-coral/15 border-neon-violet/50 shadow-[0_0_40px_rgba(168,85,247,0.3)] scale-[1.02]'
                        : 'bg-white/[0.08] border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.1)] scale-[1.02]'
                      : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                  }`}
                  style={{
                    animationDelay: `${index * 0.15}s`
                  }}
                >
                  {/* Pulsing energy orb on mobile */}
                  <div className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-0 w-10 h-10 lg:hidden transition-all duration-500 ${
                    isLit ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  }`}>
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${tier.color} blur-xl animate-pulse`}></div>
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${tier.color} scale-50`}></div>
                  </div>

                  <div className="text-center space-y-4 md:space-y-5">
                    <div className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto rounded-2xl md:rounded-3xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg transition-all duration-700 ${
                      isLit ? 'scale-110 shadow-2xl' : 'group-hover:scale-110 group-hover:shadow-2xl'
                    }`}>
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                      {/* Shine effect when lit */}
                      <div className={`absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-tr from-white/30 to-transparent transition-opacity duration-500 ${
                        isLit ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}></div>
                    </div>
                    <div>
                      <h3 className={`text-lg sm:text-xl md:text-2xl font-light text-white mb-2 md:mb-3 transition-all duration-500 ${
                        isLit ? 'text-shadow-glow' : ''
                      }`}>{t(tier.nameKey)}</h3>
                      <div className={`text-3xl sm:text-4xl md:text-5xl font-extralight bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent transition-all duration-500 ${
                        isLit ? 'scale-105' : ''
                      }`}>
                        {tier.cashback}
                      </div>
                      <p className="text-xs sm:text-sm md:text-base text-white/50 font-light mt-1 md:mt-2">{t("cashback")}</p>
                    </div>
                    <div className="pt-3 md:pt-4 border-t border-white/10">
                      <p className="text-xs sm:text-sm text-white/60 font-light">{t(tier.requirementKey)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefits */}
        <div className={`bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-6 sm:p-7 md:p-10 mb-8 md:mb-12 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 text-center">
            <div className="group">
              <div className="mb-3 md:mb-4 flex justify-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-neon-coral/20 to-neon-violet/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-neon-coral" />
                </div>
              </div>
              <h4 className="font-light text-base sm:text-lg md:text-xl text-white mb-2 md:mb-3">{t("loyaltyRealCryptoTitle")}</h4>
              <p className="text-xs sm:text-sm md:text-base text-white/60 font-light leading-relaxed">{t("loyaltyRealCryptoDesc")}</p>
            </div>
            <div className="group">
              <div className="mb-3 md:mb-4 flex justify-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-neon-violet/20 to-neon-cyan/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-neon-violet" />
                </div>
              </div>
              <h4 className="font-light text-base sm:text-lg md:text-xl text-white mb-2 md:mb-3">{t("loyaltyInstantTitle")}</h4>
              <p className="text-xs sm:text-sm md:text-base text-white/60 font-light leading-relaxed">{t("loyaltyInstantDesc")}</p>
            </div>
            <div className="group">
              <div className="mb-3 md:mb-4 flex justify-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-warm-sand/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-neon-cyan" />
                </div>
              </div>
              <h4 className="font-light text-base sm:text-lg md:text-xl text-white mb-2 md:mb-3">{t("loyaltyLifetimeTitle")}</h4>
              <p className="text-xs sm:text-sm md:text-base text-white/60 font-light leading-relaxed">{t("loyaltyLifetimeDesc")}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            onClick={() => navigate(localizedPath('/account', language))}
            size="lg"
            className="bg-white text-black hover:bg-white/90 font-light text-sm sm:text-base md:text-lg px-8 sm:px-10 md:px-12 py-5 sm:py-6 md:py-7 rounded-xl md:rounded-2xl shadow-lg hover:scale-105 transition-all duration-300 w-full sm:w-auto"
          >
            {t("loyaltyViewRewards")}
          </Button>
        </div>
      </div>
    </section>
  );
};
