import { Button } from "@/components/ui/button";
import { Users, Coins, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";
import { useEffect, useRef, useState } from "react";
import tokenLogo from "@/assets/nomiqa-token-logo.gif";

export const ScrollableFeatures = () => {
  const navigate = useNavigate();
  const { language, t } = useTranslation();
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

  const features = [
    {
      icon: Users,
      title: t("referEarnTitle"),
      description: t("referEarnSubtitle"),
      highlights: [
        { text: t("affiliateCommissionDirect"), gradient: "from-neon-cyan to-neon-cyan", icon: Users },
        { text: t("affiliateCommissionTier2"), gradient: "from-neon-violet to-neon-violet", icon: Users },
        { text: t("affiliateCommissionTier3"), gradient: "from-neon-coral to-neon-coral", icon: Users },
        { text: t("affiliateRealEarnings"), gradient: "from-warm-sand to-warm-sand", icon: Coins },
      ],
      cta: t("getStarted"),
      path: "/affiliate",
      showImage: false
    },
    {
      icon: Coins,
      title: t("earnAsConnectTitle"),
      description: t("earnAsConnectDesc"),
      highlights: [
        { text: t("redeemTokens"), gradient: "from-neon-violet to-neon-violet", icon: Coins },
        { text: t("earnForReferrals"), gradient: "from-neon-coral to-neon-coral", icon: Gift },
        { text: t("growNetwork"), gradient: "from-neon-cyan to-neon-cyan", icon: Users },
      ],
      cta: t("discoverToken"),
      path: "/token",
      showImage: true
    },
  ];

  return (
    <section ref={sectionRef} className="py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-gradient-to-b from-black/40 via-deep-space/60 to-black/40 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light mb-4 bg-gradient-to-r from-white via-white/95 to-white/90 bg-clip-text text-transparent">
            {t('earnMoreTitle')}
          </h2>
          <p className="text-base md:text-lg text-white/70 font-light max-w-2xl mx-auto mb-3">
            {t('earnMoreDesc')}
          </p>
          <p className="text-sm md:text-base text-neon-cyan/80 font-light max-w-3xl mx-auto px-4">
            {t('earnRealCrypto')}
          </p>
        </div>

        {/* Scrollable Cards Container */}
        <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Mobile: Scrollable | Desktop: Grid */}
          <div className="lg:hidden overflow-x-auto overflow-y-visible pb-6 -mx-4 px-4 md:-mx-6 md:px-6 scrollbar-glass">
            <div className="flex gap-6 min-w-min">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index}
                    className="flex-shrink-0 w-[85vw] sm:w-[400px] md:w-[450px] group"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="relative h-full overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-10 backdrop-blur-xl hover:border-white/20 hover:bg-white/[0.05] transition-all duration-500 hover:scale-[1.02]">
                      {/* Premium decorative glow */}
                      <div className="absolute -top-20 -right-20 w-48 h-48 bg-neon-violet/20 rounded-full blur-3xl" />
                      <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-neon-coral/20 rounded-full blur-3xl" />
                      
                      <div className="relative z-10 flex flex-col h-full">
                        {/* Icon or Image */}
                        <div className="mb-6 text-center md:text-left">
                          {feature.showImage ? (
                            <img 
                              src={tokenLogo} 
                              alt="NOMIQA Token" 
                              className="w-auto h-16 md:h-20 object-contain mx-auto md:mx-0" 
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center group-hover:bg-white/[0.08] transition-all duration-300 mx-auto md:mx-0">
                              <Icon className="w-8 h-8 text-neon-cyan" />
                            </div>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div className="mb-6 text-center md:text-left">
                          <h3 className="text-2xl md:text-3xl font-light text-white mb-3">
                            {feature.title}
                          </h3>
                          <p className="text-sm md:text-base text-white/70 font-light leading-relaxed">
                            {feature.description}
                          </p>
                        </div>

                        {/* Highlights */}
                        <div className="space-y-3 mb-8 flex-grow">
                          {feature.highlights.map((highlight, idx) => {
                            const HighlightIcon = highlight.icon;
                            return (
                              <div 
                                key={idx}
                                className="flex items-center gap-3 text-white/80 text-sm md:text-base font-light justify-center md:justify-start"
                              >
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${highlight.gradient} flex items-center justify-center flex-shrink-0`}>
                                  <HighlightIcon className="w-4 h-4 text-white" />
                                </div>
                                <span>{highlight.text}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* CTA Button */}
                        <Button 
                          onClick={() => navigate(localizedPath(feature.path, language))}
                          className="w-full h-auto py-3 px-4 md:py-6 text-sm md:text-base font-light bg-white/[0.05] backdrop-blur-xl border-2 border-neon-cyan/30 text-white hover:bg-neon-cyan/10 hover:border-neon-cyan/50 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-neon-cyan/20"
                        >
                          <span className="break-words">{feature.cta}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 xl:p-8 backdrop-blur-xl hover:border-white/20 hover:bg-white/[0.05] transition-all duration-500 hover:scale-[1.02]">
                    {/* Premium decorative glow */}
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-neon-violet/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-neon-coral/20 rounded-full blur-3xl" />
                    
                    <div className="relative z-10 flex flex-col h-full">
                      {/* Icon or Image */}
                      <div className="mb-4">
                        {feature.showImage ? (
                          <img 
                            src={tokenLogo} 
                            alt="NOMIQA Token" 
                            className="w-auto h-14 xl:h-16 object-contain" 
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-12 h-12 xl:w-14 xl:h-14 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center group-hover:bg-white/[0.08] transition-all duration-300">
                            <Icon className="w-6 h-6 xl:w-7 xl:h-7 text-neon-cyan" />
                          </div>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div className="mb-4">
                        <h3 className="text-xl xl:text-2xl font-light text-white mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-white/70 font-light leading-relaxed">
                          {feature.description}
                        </p>
                      </div>

                      {/* Highlights */}
                      <div className="space-y-2 mb-6 flex-grow">
                        {feature.highlights.map((highlight, idx) => {
                          const HighlightIcon = highlight.icon;
                          return (
                            <div 
                              key={idx}
                              className="flex items-center gap-2 text-white/80 text-sm font-light"
                            >
                              <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${highlight.gradient} flex items-center justify-center flex-shrink-0`}>
                                <HighlightIcon className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-xs xl:text-sm">{highlight.text}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* CTA Button */}
                      <Button 
                        onClick={() => navigate(localizedPath(feature.path, language))}
                        className="w-full h-auto py-3 px-4 text-sm font-light bg-white/[0.05] backdrop-blur-xl border-2 border-neon-cyan/30 text-white hover:bg-neon-cyan/10 hover:border-neon-cyan/50 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-neon-cyan/20"
                      >
                        <span className="break-words">{feature.cta}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Scroll Indicator - Mobile only */}
          <div className="flex justify-center mt-6 lg:hidden">
            <div className="flex gap-2 items-center text-white/40 text-xs font-light">
              <span>Swipe to explore</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
