import { Navbar } from "@/components/Navbar";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
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
                <img 
                  src="/nomiqa-token-logo.gif" 
                  alt="Nomiqa Token" 
                  className="w-32 h-32 relative z-10 rounded-2xl shadow-2xl shadow-neon-cyan/50" 
                />
              </div>
              <div className="flex items-center gap-3 text-white/60 font-light">
                <img 
                  src="/nomiqa-token-logo.gif" 
                  alt="Nomiqa" 
                  className="w-8 h-8 rounded-lg" 
                />
                <span>{t("tokenLaunchingOn")}</span>
                <img 
                  src="/nomiqa-token-logo.gif" 
                  alt="Nomiqa" 
                  className="w-8 h-8 rounded-lg" 
                />
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
      <Footer />
      <SupportChatbot />
    </div>
  );
};

export default Token;
