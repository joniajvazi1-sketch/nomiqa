import { Button } from "@/components/ui/button";
import { Trophy, Users, Coins, Gift, Zap, Percent, TrendingUp, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";
import { localizedPath } from "@/utils/localizedLinks";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";

// Use static PNG instead of large animated GIF for performance
const tokenLogoUrl = "/nomiqa-token-logo.png";

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

  // Main earning categories
  const features = [
    {
      icon: Trophy,
      title: t("loyaltyTitle"),
      description: t("loyaltySubtitle"),
      highlights: [
        { text: t("beginnerCashback"), gradient: "from-amber-600 to-amber-800", icon: Trophy },
        { text: t("travelerCashback"), gradient: "from-gray-400 to-gray-600", icon: Trophy },
        { text: t("adventurerCashback"), gradient: "from-yellow-400 to-yellow-600", icon: Trophy },
        { text: t("explorerCashback"), gradient: "from-purple-400 to-purple-600", icon: Trophy },
      ],
      cta: t("loyaltyViewRewards"),
      path: "/rewards",
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

  // Referral program tiers - 3 ways to earn
  const referralTiers = [
    {
      title: t("inviteRewardBoostTitle"),
      description: t("inviteRewardBoostDesc"),
      icon: Zap,
      color: 'text-neon-cyan',
      bg: 'bg-neon-cyan/20',
      borderColor: 'border-neon-cyan/30',
      highlight: t("inviteRewardBoostHighlight"),
      detail: t("inviteRewardBoostDetail")
    },
    {
      title: t("inviteSalesCommissionTitle"),
      description: t("inviteSalesCommissionDesc"),
      icon: Percent,
      color: 'text-primary',
      bg: 'bg-primary/20',
      borderColor: 'border-primary/30',
      highlight: t("inviteSalesCommissionHighlight"),
      detail: t("inviteSalesCommissionDetail")
    },
    {
      title: t("inviteNetworkEarningsTitle"),
      description: t("inviteNetworkEarningsDesc"),
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      highlight: t("inviteNetworkEarningsHighlight"),
      detail: t("inviteNetworkEarningsDetail")
    }
  ];

  return (
    <section ref={sectionRef} className="py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-gradient-to-b from-black/40 via-deep-space/60 to-black/40 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Badge variant="outline" className="mb-4 border-neon-cyan/30 text-neon-cyan bg-neon-cyan/5">
            💰 {t("earnRealCryptoBadge")}
          </Badge>
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

        {/* Referral Program - 3 Ways to Earn */}
        <div className={`mb-16 transition-all duration-1000 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-light text-white mb-2">
              {t("inviteTitle")} <span className="text-gradient-primary">{t("inviteTitleHighlight")}</span>
            </h3>
            <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto">
              {t("inviteSubtitle")}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {referralTiers.map((tier, index) => {
              const Icon = tier.icon;
              return (
                <div 
                  key={tier.title}
                  className={`relative overflow-hidden rounded-2xl border ${tier.borderColor} bg-white/[0.03] backdrop-blur-sm p-6 hover:bg-white/[0.06] transition-all duration-300 hover:scale-[1.02]`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-xl ${tier.bg}`}>
                      <Icon className={`w-6 h-6 ${tier.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{tier.title}</h4>
                      <p className="text-xs text-white/60">{tier.description}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/[0.05] rounded-xl p-4 text-center">
                    <p className={`text-2xl font-bold ${tier.color}`}>{tier.highlight}</p>
                    <p className="text-xs text-white/50">{tier.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Referral CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg"
              onClick={() => navigate(localizedPath('/affiliate', language))}
              className="bg-gradient-to-r from-neon-cyan to-neon-violet hover:from-neon-cyan/90 hover:to-neon-violet/90 text-white font-semibold px-8 border-0"
            >
              <Users className="w-5 h-5 mr-2" />
              {t("inviteStartButton")}
            </Button>
            <Button 
              variant="outline"
              size="lg"
              onClick={() => navigate(localizedPath('/affiliate', language))}
              className="border-white/20 hover:border-white/40 hover:bg-white/5"
            >
              {t("learnMore")}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Other Ways to Earn - Cashback & Token */}
        <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-8">
            <h3 className="text-xl md:text-2xl font-light text-white/80">
              {t("moreWaysToEarn")}
            </h3>
          </div>
          
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
                              src={tokenLogoUrl} 
                              alt="NOMIQA Token" 
                              width="80"
                              height="80"
                              className="w-auto h-16 md:h-20 object-contain mx-auto md:mx-0" 
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
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

          {/* Desktop: Grid Layout - 2 columns for remaining features */}
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
                            src={tokenLogoUrl} 
                            alt="NOMIQA Token" 
                            width="64"
                            height="64"
                            className="w-auto h-14 xl:h-16 object-contain" 
                            loading="lazy"
                            decoding="async"
                            fetchPriority="low"
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
