import { Smartphone, Database, Coins, Building2, Users, ArrowRight } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { useEffect, useRef, useState } from "react";

export const WhatIsDePIN = () => {
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

  return (
    <section ref={sectionRef} className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-background via-background/95 to-background">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--neon-cyan)/0.05),transparent_70%)]"></div>
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-neon-violet/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10 px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className={`text-center mb-16 md:mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 mb-6">
            <Database className="w-4 h-4 text-neon-cyan" />
            <span className="text-sm font-medium text-neon-cyan">{t("whatIsDePINBadge")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="text-foreground">{t("whatIsDePINTitle")}</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t("whatIsDePINSubtitle")}
          </p>
        </div>

        {/* Comparison: Traditional vs DePIN */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto mb-20 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          
          {/* Traditional Model */}
          <div className="relative p-8 md:p-10 rounded-3xl bg-gradient-to-br from-destructive/5 to-destructive/10 border border-destructive/20">
            <div className="absolute -top-4 left-8 px-4 py-1 bg-destructive/20 rounded-full">
              <span className="text-sm font-semibold text-destructive">{t("whatIsDePINOldWay")}</span>
            </div>
            <div className="flex items-center gap-4 mb-8 mt-4">
              <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">{t("whatIsDePINTraditionalTitle")}</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-destructive text-sm">✕</span>
                </div>
                <span className="text-muted-foreground">{t("whatIsDePINTraditional1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-destructive text-sm">✕</span>
                </div>
                <span className="text-muted-foreground">{t("whatIsDePINTraditional2")}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-destructive text-sm">✕</span>
                </div>
                <span className="text-muted-foreground">{t("whatIsDePINTraditional3")}</span>
              </li>
            </ul>
          </div>

          {/* DePIN Model */}
          <div className="relative p-8 md:p-10 rounded-3xl bg-gradient-to-br from-neon-cyan/5 to-neon-violet/10 border border-neon-cyan/20">
            <div className="absolute -top-4 left-8 px-4 py-1 bg-neon-cyan/20 rounded-full">
              <span className="text-sm font-semibold text-neon-cyan">{t("whatIsDePINNewWay")}</span>
            </div>
            <div className="flex items-center gap-4 mb-8 mt-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 flex items-center justify-center">
                <Users className="w-8 h-8 text-neon-cyan" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">{t("whatIsDePINDePINTitle")}</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-neon-cyan/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-neon-cyan text-sm">✓</span>
                </div>
                <span className="text-foreground">{t("whatIsDePINDePIN1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-neon-cyan/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-neon-cyan text-sm">✓</span>
                </div>
                <span className="text-foreground">{t("whatIsDePINDePIN2")}</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-neon-cyan/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-neon-cyan text-sm">✓</span>
                </div>
                <span className="text-foreground">{t("whatIsDePINDePIN3")}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* How It Works - Simple 3 Step */}
        <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-12 text-foreground">
            {t("whatIsDePINHowItWorks")}
          </h3>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4 max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 flex-1">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-cyan/10 flex items-center justify-center mb-4 border border-neon-cyan/30">
                <Smartphone className="w-10 h-10 text-neon-cyan" />
              </div>
              <div className="text-sm font-bold text-neon-cyan mb-2">{t("whatIsDePINStep1Label")}</div>
              <h4 className="text-lg font-semibold text-foreground mb-2">{t("whatIsDePINStep1Title")}</h4>
              <p className="text-sm text-muted-foreground">{t("whatIsDePINStep1Desc")}</p>
            </div>

            {/* Arrow */}
            <ArrowRight className="hidden md:block w-8 h-8 text-muted-foreground/30 flex-shrink-0" />
            <div className="md:hidden w-8 h-8 flex items-center justify-center">
              <div className="w-0.5 h-8 bg-muted-foreground/20"></div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 flex-1">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-violet/20 to-neon-violet/10 flex items-center justify-center mb-4 border border-neon-violet/30">
                <Database className="w-10 h-10 text-neon-violet" />
              </div>
              <div className="text-sm font-bold text-neon-violet mb-2">{t("whatIsDePINStep2Label")}</div>
              <h4 className="text-lg font-semibold text-foreground mb-2">{t("whatIsDePINStep2Title")}</h4>
              <p className="text-sm text-muted-foreground">{t("whatIsDePINStep2Desc")}</p>
            </div>

            {/* Arrow */}
            <ArrowRight className="hidden md:block w-8 h-8 text-muted-foreground/30 flex-shrink-0" />
            <div className="md:hidden w-8 h-8 flex items-center justify-center">
              <div className="w-0.5 h-8 bg-muted-foreground/20"></div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 flex-1">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-coral/20 to-neon-coral/10 flex items-center justify-center mb-4 border border-neon-coral/30">
                <Coins className="w-10 h-10 text-neon-coral" />
              </div>
              <div className="text-sm font-bold text-neon-coral mb-2">{t("whatIsDePINStep3Label")}</div>
              <h4 className="text-lg font-semibold text-foreground mb-2">{t("whatIsDePINStep3Title")}</h4>
              <p className="text-sm text-muted-foreground">{t("whatIsDePINStep3Desc")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
