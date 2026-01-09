import { Smartphone, Wifi, MapPin, Coins, Network, Globe, Users, ArrowRight, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/TranslationContext";
import { SiteNavigation } from "@/components/SiteNavigation";
import { lazy, Suspense, useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const SupportChatbot = lazy(() => import("@/components/SupportChatbot").then(m => ({ default: m.SupportChatbot })));

const HowItWorks = () => {
  const { t } = useTranslation();
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const steps = [
    { 
      icon: Smartphone, 
      titleKey: "howItWorksStep1Title", 
      descKey: "howItWorksStep1Desc",
      color: "neon-cyan"
    },
    { 
      icon: MapPin, 
      titleKey: "howItWorksStep2Title", 
      descKey: "howItWorksStep2Desc",
      color: "neon-violet"
    },
    { 
      icon: Wifi, 
      titleKey: "howItWorksStep3Title", 
      descKey: "howItWorksStep3Desc",
      color: "neon-coral"
    },
    { 
      icon: Coins, 
      titleKey: "howItWorksStep4Title", 
      descKey: "howItWorksStep4Desc",
      color: "neon-cyan"
    },
  ];

  const dataTypes = [
    { icon: Wifi, labelKey: "howItWorksDataSignal" },
    { icon: MapPin, labelKey: "howItWorksDataLocation" },
    { icon: Network, labelKey: "howItWorksDataNetwork" },
    { icon: Zap, labelKey: "howItWorksDataSpeed" },
  ];

  const whyContribute = [
    { titleKey: "howItWorksWhyContribute1Title", descKey: "howItWorksWhyContribute1Desc" },
    { titleKey: "howItWorksWhyContribute2Title", descKey: "howItWorksWhyContribute2Desc" },
    { titleKey: "howItWorksWhyContribute3Title", descKey: "howItWorksWhyContribute3Desc" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Helmet>
        <title>{t("howItWorksPageTitle")} | Nomiqa</title>
        <meta name="description" content={t("howItWorksPageSubtitle")} />
      </Helmet>
      
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(0,255,200,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,200,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,200,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Hero Section */}
      <section 
        id="hero"
        ref={(el: HTMLDivElement | null) => { sectionRefs.current['hero'] = el; }}
        className="pt-28 pb-16 md:pt-36 md:pb-24 px-4 relative z-10"
      >
        <div className={`container max-w-4xl mx-auto text-center transition-all duration-1000 ${visibleSections.has('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-5 py-2 rounded-full bg-white/[0.03] backdrop-blur-xl text-neon-cyan text-sm font-medium mb-6 border border-white/10">
            {t("howItWorksBadge")}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6">
            <span className="bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
              {t("howItWorksPageTitle")}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t("howItWorksPageSubtitle")}
          </p>
        </div>
      </section>

      {/* What is DePIN Section */}
      <section 
        id="what-is-depin"
        ref={(el: HTMLDivElement | null) => { sectionRefs.current['what-is-depin'] = el; }}
        className="py-16 md:py-24 px-4 relative z-10"
      >
        <div className="container max-w-6xl mx-auto">
          <div className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-1000 delay-100 ${visibleSections.has('what-is-depin') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div>
              <h2 className="text-3xl md:text-4xl font-light mb-6">
                <span className="bg-gradient-to-r from-neon-cyan to-white bg-clip-text text-transparent">
                  {t("howItWorksWhatIsDePINTitle")}
                </span>
              </h2>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                {t("howItWorksWhatIsDePINDesc1")}
              </p>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {t("howItWorksWhatIsDePINDesc2")}
              </p>
              
              <div className="flex flex-wrap gap-3">
                {dataTypes.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={index}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10"
                    >
                      <Icon className="w-4 h-4 text-neon-cyan" />
                      <span className="text-sm text-white/80">{t(item.labelKey)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Network Visualization */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 to-neon-violet/10 rounded-3xl blur-3xl" />
              <div className="relative aspect-square max-w-md mx-auto">
                {/* Central hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center z-10">
                  <Globe className="w-10 h-10 text-white" />
                </div>
                
                {/* Orbiting nodes */}
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                  <div
                    key={i}
                    className="absolute w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"
                    style={{
                      top: `${50 + 35 * Math.sin((angle * Math.PI) / 180)}%`,
                      left: `${50 + 35 * Math.cos((angle * Math.PI) / 180)}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <Smartphone className="w-5 h-5 text-neon-cyan" />
                    <div className="absolute inset-0 rounded-full bg-neon-cyan/20 animate-ping" style={{ animationDelay: `${i * 0.3}s` }} />
                  </div>
                ))}
                
                {/* Connection lines (SVG) */}
                <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                  {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                    <line
                      key={i}
                      x1="50%"
                      y1="50%"
                      x2={`${50 + 35 * Math.cos((angle * Math.PI) / 180)}%`}
                      y2={`${50 + 35 * Math.sin((angle * Math.PI) / 180)}%`}
                      stroke="rgba(0,255,200,0.3)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step by Step Section */}
      <section 
        id="steps"
        ref={(el: HTMLDivElement | null) => { sectionRefs.current['steps'] = el; }}
        className="py-16 md:py-24 px-4 relative z-10"
      >
        <div className="container max-w-6xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-1000 ${visibleSections.has('steps') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl md:text-4xl font-light mb-4">
              <span className="bg-gradient-to-r from-neon-cyan to-neon-violet bg-clip-text text-transparent">
                {t("howItWorksStepsTitle")}
              </span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("howItWorksStepsSubtitle")}
            </p>
          </div>

          <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-1000 delay-200 ${visibleSections.has('steps') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative group">
                  {/* Connection line */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-white/20 to-transparent z-0" />
                  )}
                  
                  <div className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-neon-cyan/30 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-${step.color}/20 to-${step.color}/5 flex items-center justify-center border border-${step.color}/20`}>
                          <Icon className={`w-7 h-7 text-${step.color}`} />
                        </div>
                        <span className="text-4xl font-light text-white/20">{index + 1}</span>
                      </div>
                      <h3 className="text-xl font-medium text-white mb-3">{t(step.titleKey)}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t(step.descKey)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Contribute Section */}
      <section 
        id="why-contribute"
        ref={(el: HTMLDivElement | null) => { sectionRefs.current['why-contribute'] = el; }}
        className="py-16 md:py-24 px-4 relative z-10"
      >
        <div className="container max-w-5xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-1000 ${visibleSections.has('why-contribute') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl md:text-4xl font-light mb-4">
              <span className="bg-gradient-to-r from-neon-violet to-neon-coral bg-clip-text text-transparent">
                {t("howItWorksWhyContributeTitle")}
              </span>
            </h2>
          </div>

          <div className={`grid md:grid-cols-3 gap-8 transition-all duration-1000 delay-200 ${visibleSections.has('why-contribute') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {whyContribute.map((item, index) => (
              <div 
                key={index}
                className="relative p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-6 h-6 text-neon-cyan" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3">{t(item.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Buyers Section */}
      <section 
        id="data-buyers"
        ref={(el: HTMLDivElement | null) => { sectionRefs.current['data-buyers'] = el; }}
        className="py-16 md:py-24 px-4 relative z-10"
      >
        <div className="container max-w-5xl mx-auto">
          <div className={`relative transition-all duration-1000 ${visibleSections.has('data-buyers') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-neon-violet/10 to-neon-coral/10 rounded-3xl blur-2xl" />
            <div className="relative p-8 md:p-12 rounded-3xl bg-white/[0.02] border border-white/10">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-2xl md:text-3xl font-light mb-4 text-white">
                    {t("howItWorksDataBuyersTitle")}
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {t("howItWorksDataBuyersDesc")}
                  </p>
                  <ul className="space-y-3">
                    {['howItWorksDataBuyer1', 'howItWorksDataBuyer2', 'howItWorksDataBuyer3'].map((key, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-neon-cyan" />
                        </div>
                        <span className="text-white/80">{t(key)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-center">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-br from-neon-violet/20 to-neon-coral/20 flex items-center justify-center border border-white/10">
                    <Users className="w-20 h-20 text-white/60" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 relative z-10">
        <div className="container max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/10 to-neon-violet/10 rounded-3xl blur-2xl" />
            <div className="relative p-8 md:p-12 rounded-3xl bg-white/[0.02] border border-white/10 text-center">
              <h2 className="text-2xl md:text-3xl font-light mb-4 text-white">
                {t("howItWorksCTATitle")}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                {t("howItWorksCTASubtitle")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/download">
                  <Button className="bg-gradient-to-r from-neon-cyan to-neon-violet hover:opacity-90 text-white px-8 py-6 rounded-xl">
                    {t("howItWorksDownloadApp")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/shop">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 px-8 py-6 rounded-xl">
                    {t("howItWorksBrowsePlans")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteNavigation />
      <Suspense fallback={null}>
        <SupportChatbot />
      </Suspense>
    </div>
  );
};

export default HowItWorks;