import { Button } from "@/components/ui/button";
import { SiteNavigation } from "@/components/SiteNavigation";
import { SupportChatbot } from "@/components/SupportChatbot";
import { NetworkBackground } from "@/components/NetworkBackground";
import { SEO } from "@/components/SEO";
import { Plane, Compass, Mountain, Rocket, Wallet, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";
import { useEffect, useRef, useState } from "react";

export default function Rewards() {
  const navigate = useNavigate();
  const { language, t } = useTranslation();
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

  const tiers = [
    {
      nameKey: "loyaltyTierBronze",
      icon: Plane,
      cashback: "5%",
      color: "from-amber-600 to-amber-800",
      requirementKey: "loyaltyAutomatic",
    },
    {
      nameKey: "loyaltyTierSilver",
      icon: Compass,
      cashback: "6%",
      color: "from-gray-400 to-gray-600",
      requirementKey: "loyaltySpent20",
    },
    {
      nameKey: "loyaltyTierGold",
      icon: Mountain,
      cashback: "7%",
      color: "from-yellow-400 to-yellow-600",
      requirementKey: "loyaltySpent50",
    },
    {
      nameKey: "loyaltyTierPlatinum",
      icon: Rocket,
      cashback: "10%",
      color: "from-purple-400 to-purple-600",
      requirementKey: "loyaltySpent150",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-deep-space to-black relative overflow-hidden">
      <SEO page="rewards" />
      <NetworkBackground color="rgb(251, 146, 60)" />
      
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-orange-500/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-neon-coral/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-1/4 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-3xl"></div>
      </div>
      <main ref={sectionRef} className="relative z-10 pt-8 pb-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Hero Section */}
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/10">
              <Sparkles className="w-6 h-6 text-neon-cyan animate-pulse" />
              <span className="text-neon-coral text-xs md:text-sm font-light tracking-[0.25em] uppercase">
                {t("loyaltyBadge")}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light mb-6">
              <span className="bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent">
                {t("loyaltyTitle")}
              </span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white/70 font-light max-w-3xl mx-auto leading-relaxed">
              {t("loyaltySubtitle")}
            </p>
          </div>

          {/* Tiers Grid */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {tiers.map((tier, index) => {
              const Icon = tier.icon;
              
              return (
                <div 
                  key={tier.nameKey} 
                  className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/30 rounded-2xl md:rounded-3xl p-8 transition-all duration-500 hover:bg-white/[0.05] hover:scale-[1.02]"
                  style={{
                    animationDelay: `${index * 0.15}s`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-violet/5 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10 text-center space-y-5">
                    <div className={`w-20 h-20 mx-auto rounded-2xl md:rounded-3xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-500`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-light text-white mb-3">{t(tier.nameKey)}</h3>
                      <div className="text-5xl font-extralight bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
                        {tier.cashback}
                      </div>
                      <p className="text-sm text-white/50 font-light mt-2">{t("cashback")}</p>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-sm text-white/60 font-light">{t(tier.requirementKey)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Benefits */}
          <div className={`bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-10 mb-12 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="group">
                <div className="mb-4 flex justify-center">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-coral/20 to-neon-violet/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Wallet className="w-7 h-7 text-neon-coral" />
                  </div>
                </div>
                <h4 className="font-light text-xl text-white mb-3">{t("loyaltyRealCryptoTitle")}</h4>
                <p className="text-base text-white/60 font-light leading-relaxed">{t("loyaltyRealCryptoDesc")}</p>
              </div>
              <div className="group">
                <div className="mb-4 flex justify-center">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-violet/20 to-neon-cyan/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Zap className="w-7 h-7 text-neon-violet" />
                  </div>
                </div>
                <h4 className="font-light text-xl text-white mb-3">{t("loyaltyInstantTitle")}</h4>
                <p className="text-base text-white/60 font-light leading-relaxed">{t("loyaltyInstantDesc")}</p>
              </div>
              <div className="group">
                <div className="mb-4 flex justify-center">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-warm-sand/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-7 h-7 text-neon-cyan" />
                  </div>
                </div>
                <h4 className="font-light text-xl text-white mb-3">{t("loyaltyLifetimeTitle")}</h4>
                <p className="text-base text-white/60 font-light leading-relaxed">{t("loyaltyLifetimeDesc")}</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className={`text-center transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Button 
              onClick={() => navigate(localizedPath('/account', language))}
              size="lg"
              className="h-auto py-3 px-4 md:px-12 md:py-7 text-sm md:text-base lg:text-lg font-light bg-white/[0.05] backdrop-blur-xl border-2 border-neon-violet/30 text-white hover:bg-neon-violet/10 hover:border-neon-violet/50 rounded-xl md:rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-neon-violet/20 w-full md:w-auto"
            >
              <span className="break-words">{t("loyaltyViewRewards")}</span>
            </Button>
          </div>
        </div>
      </main>

      <SiteNavigation />
      <SupportChatbot />
    </div>
  );
}
