import { SiteNavigation } from "@/components/SiteNavigation";
import { SupportChatbot } from "@/components/SupportChatbot";
import { NetworkBackground } from "@/components/NetworkBackground";
import { Coins, Rocket, TrendingUp, Lock, Zap } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "@/contexts/TranslationContext";


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
      
      {/* Premium glowing orbs background */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-violet/30 rounded-full blur-3xl"></div>
        <div className="absolute top-60 right-20 w-[500px] h-[500px] bg-neon-cyan/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-1/3 w-80 h-80 bg-neon-coral/20 rounded-full blur-3xl"></div>
      </div>
      <main className="relative z-10 pt-24 md:pt-32 pb-20 px-4" ref={sectionRef}>
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className={`text-center space-y-6 md:space-y-8 mb-12 md:mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300">
              <Coins className="w-5 h-5 md:w-6 md:h-6 text-neon-cyan animate-pulse" />
              <span className="text-base md:text-lg font-light tracking-wider text-white/90">{t("tokenBadge")}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-extralight tracking-tight">
              <span className="bg-gradient-to-r from-white via-neon-cyan to-white bg-clip-text text-transparent">
                {t("tokenComingSoon")}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl text-white/70 max-w-4xl mx-auto font-light leading-relaxed">
              {t("tokenSubtitle")}
              <br />
              <span className="text-neon-cyan">{t("tokenTagline")}</span>
            </p>
          </div>

          {/* Visual Element */}
          <div className={`relative py-12 md:py-20 lg:py-24 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-72 h-72 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px] bg-neon-cyan/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 bg-neon-violet/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            <div className="relative z-10 flex flex-col items-center gap-6 md:gap-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/30 to-neon-violet/30 rounded-full blur-xl animate-pulse" />
                <div className="w-32 md:w-40 lg:w-48 xl:w-56 h-32 md:h-40 lg:h-48 xl:h-56 relative z-10 rounded-2xl shadow-2xl shadow-neon-cyan/50 bg-gradient-to-br from-neon-cyan/20 via-neon-violet/20 to-primary/20 border border-white/10 flex items-center justify-center backdrop-blur-xl">
                  <Coins className="w-16 md:w-20 lg:w-24 xl:w-28 h-16 md:h-20 lg:h-24 xl:h-28 text-neon-cyan" />
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/60 font-light text-sm md:text-base lg:text-lg">
                <Rocket className="w-5 h-5 md:w-6 lg:w-7 text-neon-violet" />
                <span>{t("tokenLaunchingOn")}</span>
                <TrendingUp className="w-5 h-5 md:w-6 lg:w-7 text-neon-cyan" />
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

        </div>
      </main>

      <SiteNavigation />
      <SupportChatbot />
    </div>
  );
};

export default Token;
