import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { NetworkBackground } from "@/components/NetworkBackground";
import { Coins, Rocket, Sparkles, TrendingUp, Lock, Zap, Gift, Users } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import tokenLogo from "@/assets/nomiqa-token-logo.gif";

const Token = () => {
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

  const features = [
    {
      icon: Coins,
      title: t("tokenFeature1Title"),
      description: t("tokenFeature1Desc")
    },
    {
      icon: TrendingUp,
      title: t("tokenFeature2Title"),
      description: t("tokenFeature2Desc")
    },
    {
      icon: Lock,
      title: t("tokenFeature3Title"),
      description: t("tokenFeature3Desc")
    },
    {
      icon: Zap,
      title: t("tokenFeature4Title"),
      description: t("tokenFeature4Desc")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-deep-space to-black relative overflow-hidden">
      <NetworkBackground />
      <Navbar />
      
      <main className="relative z-10 pt-32 pb-20 px-4" ref={sectionRef}>
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className={`text-center space-y-8 mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300">
              <Coins className="w-6 h-6 text-neon-cyan animate-pulse" />
              <span className="text-lg font-light tracking-wider text-white/90">{t("tokenBadge")}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extralight tracking-tight">
              <span className="bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent">
                {t("tokenComingSoon")}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/70 max-w-3xl mx-auto font-light leading-relaxed">
              {t("tokenSubtitle")}
              <br />
              <span className="text-neon-cyan">{t("tokenTagline")}</span>
            </p>
          </div>

          {/* Visual Element */}
          <div className={`relative py-20 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute w-64 h-64 bg-neon-violet/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            <div className="relative z-10 flex flex-col items-center gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/30 to-neon-violet/30 rounded-full blur-xl animate-pulse" />
                <Rocket className="w-32 h-32 text-neon-cyan relative z-10 animate-bounce" />
              </div>
              <div className="flex items-center gap-2 text-white/60 font-light">
                <Sparkles className="w-5 h-5 text-neon-cyan animate-pulse" />
                <span>{t("tokenLaunchingOn")}</span>
                <Sparkles className="w-5 h-5 text-neon-violet animate-pulse" />
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className={`grid md:grid-cols-2 gap-6 mb-16 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-8 transition-all duration-500 hover:bg-white/[0.04] hover:scale-[1.02] text-center md:text-left"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-violet/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center mb-6 group-hover:bg-white/[0.08] transition-all duration-300 mx-auto md:mx-0">
                    <feature.icon className="w-7 h-7 text-neon-cyan" />
                  </div>
                  <h3 className="text-xl font-light text-white mb-3 tracking-wide">{feature.title}</h3>
                  <p className="text-white/60 font-light leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className={`text-center space-y-6 max-w-3xl mx-auto mb-12 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <p className="text-lg md:text-xl text-white/80 font-light leading-relaxed">
              {t("tokenDescription1")}
            </p>
            <p className="text-white/60 font-light">
              {t("tokenDescription2")}
            </p>
          </div>

          {/* Earn as You Connect Section */}
          <div className={`mt-20 mb-16 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="relative overflow-hidden rounded-3xl border border-neon-violet/30 bg-gradient-to-br from-neon-violet/5 via-neon-coral/5 to-neon-cyan/5 p-10 md:p-14 shadow-2xl shadow-neon-violet/10 backdrop-blur-xl">
              {/* Premium decorative glow */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon-violet/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-neon-coral/20 rounded-full blur-3xl" />
              
              <div className="relative z-10 text-center space-y-8">
                {/* Headline with Logo */}
                <div className="space-y-5">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <img 
                      src={tokenLogo} 
                      alt="NOMIQA Token" 
                      className="w-auto h-20 object-contain" 
                      loading="lazy"
                    />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-light bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent">
                    {t("earnAsConnectTitle")}
                  </h2>
                </div>

                {/* Subline */}
                <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
                  {t("earnAsConnectDesc")}
                </p>

                {/* Benefits Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8">
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-violet/30 hover:bg-white/[0.04] transition-all duration-500">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-neon-violet/10 flex items-center justify-center text-neon-violet border border-neon-violet/20">
                      <Coins className="w-5 h-5" />
                    </div>
                    <p className="text-sm md:text-base font-light text-white text-left leading-relaxed">
                      {t("redeemTokens")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-violet/30 hover:bg-white/[0.04] transition-all duration-500">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-neon-violet/10 flex items-center justify-center text-neon-violet border border-neon-violet/20">
                      <Gift className="w-5 h-5" />
                    </div>
                    <p className="text-sm md:text-base font-light text-white text-left leading-relaxed">
                      {t("earnForReferrals")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-violet/30 hover:bg-white/[0.04] transition-all duration-500">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-neon-violet/10 flex items-center justify-center text-neon-violet border border-neon-violet/20">
                      <Users className="w-5 h-5" />
                    </div>
                    <p className="text-sm md:text-base font-light text-white text-left leading-relaxed">
                      {t("growNetwork")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon Badge */}
          <div className={`text-center transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-block relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/20 to-neon-violet/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
              <div className="relative px-8 py-4 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/20 hover:border-white/30 transition-all duration-300">
                <p className="text-sm md:text-base font-light text-white/90 tracking-wider">
                  {t("tokenLaunchAnnouncement")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Token;
