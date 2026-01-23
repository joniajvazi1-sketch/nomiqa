import { SiteNavigation } from "@/components/SiteNavigation";
import { SupportChatbot } from "@/components/SupportChatbot";
import { SEO } from "@/components/SEO";
import { Users, Globe, Shield, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { NetworkBackground } from "@/components/NetworkBackground";

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

  const utilities = [
    {
      icon: Users,
      title: t("tokenUtility1Title"),
      description: t("tokenUtility1Desc"),
    },
    {
      icon: TrendingUp,
      title: t("tokenUtility2Title"),
      description: t("tokenUtility2Desc"),
    },
    {
      icon: Shield,
      title: t("tokenUtility3Title"),
      description: t("tokenUtility3Desc"),
    },
    {
      icon: Globe,
      title: t("tokenUtility4Title"),
      description: t("tokenUtility4Desc"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative">
      <SEO page="token" />
      <NetworkBackground />
      
      {/* Premium background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-violet/30 rounded-full blur-3xl"></div>
      </div>

      <main className="relative z-10 pt-32 md:pt-40 pb-24 px-4" ref={sectionRef}>
        <div className="max-w-5xl mx-auto">
          
          {/* Hero Section */}
          <div className={`text-center space-y-8 mb-16 md:mb-24 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] backdrop-blur-xl border border-white/10">
              <Sparkles className="w-4 h-4 text-neon-cyan" />
              <span className="text-sm font-light text-white/90">{t("tokenBadge")}</span>
            </div>

            {/* Main heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight">
                <span className="bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
                  $NOMIQA
                </span>
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl font-light text-white/70">
                {t("tokenComingSoon")}
              </p>
            </div>

            {/* Subtitle */}
            <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto font-light leading-relaxed">
              {t("tokenSubtitle")}
            </p>

            {/* Launch info with premium styling */}
            <div className="pt-4">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10">
                <span className="font-light text-white/80">{t("tokenLaunchingOn")}</span>
              </div>
            </div>

            {/* Decorative line */}
            <div className="py-4">
              <div className="w-32 h-px mx-auto bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
            </div>
          </div>

          {/* Token Utilities Section */}
          <div className={`mb-16 md:mb-24 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center mb-10 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-light mb-3">
                <span className="bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
                  {t("tokenUtilitiesTitle")}
                </span>
              </h2>
              <p className="text-white/60 font-light">
                {t("tokenUtilitiesSubtitle")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 md:gap-5">
              {utilities.map((utility, index) => (
                <div
                  key={index}
                  className="group relative p-6 md:p-7 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 hover:border-neon-cyan/30 transition-all duration-300 hover:bg-white/[0.05]"
                >
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-cyan/10 flex items-center justify-center flex-shrink-0 border border-neon-cyan/20 group-hover:scale-105 transition-transform duration-300">
                      <utility.icon className="w-6 h-6 text-neon-cyan" />
                    </div>
                    <div>
                      <h3 className="text-lg font-light text-white mb-2">
                        {utility.title}
                      </h3>
                      <p className="text-white/60 font-light leading-relaxed text-sm md:text-base">
                        {utility.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description Section */}
          <div className={`text-center max-w-2xl mx-auto mb-12 md:mb-16 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-base md:text-lg text-white/70 font-light leading-relaxed mb-5">
              {t("tokenDescription1")}
            </p>
            <p className="text-white/50 font-light text-sm md:text-base">
              {t("tokenDescription2")}
            </p>
          </div>

          {/* CTA Section */}
          <div className={`text-center transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="gap-2 bg-gradient-to-r from-neon-cyan/20 to-neon-violet/20 border border-neon-cyan/30 hover:border-neon-cyan/50 hover:bg-neon-cyan/20 text-white">
                <Link to="/affiliate">
                  {t("tokenStartEarning")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/20 hover:border-white/40 hover:bg-white/[0.05] text-white">
                <Link to="/getting-started">
                  {t("tokenLearnMore")}
                </Link>
              </Button>
            </div>
          </div>

        </div>
      </main>

      <SiteNavigation />
      <SupportChatbot />
    </div>
  );
};

export default Token;
