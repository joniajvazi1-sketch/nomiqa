import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Crown, TrendingUp, Award, Zap } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";
import { useEffect, useRef, useState } from "react";

export const LoyaltyProgram = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();
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
      name: "Bronze",
      icon: Award,
      cashback: "5%",
      color: "from-amber-600 to-amber-800",
      requirement: "Automatic",
    },
    {
      name: "Silver",
      icon: TrendingUp,
      cashback: "6%",
      color: "from-gray-400 to-gray-600",
      requirement: "$20 spent",
    },
    {
      name: "Gold",
      icon: Zap,
      cashback: "7%",
      color: "from-yellow-400 to-yellow-600",
      requirement: "$50 spent",
    },
    {
      name: "Platinum",
      icon: Crown,
      cashback: "10%",
      color: "from-purple-400 to-purple-600",
      requirement: "$150 spent",
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
              🏆 Rewards Program
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light mb-4 md:mb-6 px-4">
            <span className="block bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent">
              Earn Cashback on Every Purchase
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed px-4">
            The more you use Nomiqa, the more you save. Unlock higher tiers and earn up to 10% cashback in crypto.
          </p>
        </div>

        {/* Tiers Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-10 md:mb-12 lg:mb-16 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            return (
              <div 
                key={tier.name} 
                className={`group relative p-6 sm:p-7 md:p-8 rounded-2xl md:rounded-3xl bg-white/[0.02] backdrop-blur-xl border transition-all duration-700 hover-lift ${
                  index === 3 
                    ? 'border-neon-violet/30 bg-gradient-to-br from-neon-violet/5 to-neon-coral/5' 
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="text-center space-y-4 md:space-y-5">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto rounded-2xl md:rounded-3xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-light text-white mb-2 md:mb-3">{tier.name}</h3>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-extralight bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
                      {tier.cashback}
                    </div>
                    <p className="text-xs sm:text-sm md:text-base text-white/50 font-light mt-1 md:mt-2">cashback</p>
                  </div>
                  <div className="pt-3 md:pt-4 border-t border-white/10">
                    <p className="text-xs sm:text-sm text-white/60 font-light">{tier.requirement}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits */}
        <div className={`bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl md:rounded-3xl p-6 sm:p-7 md:p-10 mb-8 md:mb-12 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 text-center">
            <div className="group">
              <div className="text-3xl sm:text-4xl mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">💰</div>
              <h4 className="font-light text-base sm:text-lg md:text-xl text-white mb-2 md:mb-3">Real Crypto Cashback</h4>
              <p className="text-xs sm:text-sm md:text-base text-white/60 font-light leading-relaxed">Earn in USDC or SOL, not platform credits</p>
            </div>
            <div className="group">
              <div className="text-3xl sm:text-4xl mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">⚡</div>
              <h4 className="font-light text-base sm:text-lg md:text-xl text-white mb-2 md:mb-3">Instant Rewards</h4>
              <p className="text-xs sm:text-sm md:text-base text-white/60 font-light leading-relaxed">Cashback credited immediately after purchase</p>
            </div>
            <div className="group">
              <div className="text-3xl sm:text-4xl mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">🚀</div>
              <h4 className="font-light text-base sm:text-lg md:text-xl text-white mb-2 md:mb-3">Lifetime Tiers</h4>
              <p className="text-xs sm:text-sm md:text-base text-white/60 font-light leading-relaxed">Never lose your tier level once unlocked</p>
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
            View My Rewards
          </Button>
        </div>
      </div>
    </section>
  );
};
