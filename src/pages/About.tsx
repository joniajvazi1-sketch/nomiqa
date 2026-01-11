import { SiteNavigation } from "@/components/SiteNavigation";
import { SupportChatbot } from "@/components/SupportChatbot";
import { SEO } from "@/components/SEO";
import { Globe, Shield, Users, Zap, Network, Database, Coins, CheckCircle, Building2, Target } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { useEffect, useRef, useState } from "react";

export default function About() {
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

  const pillars = [
    {
      icon: Network,
      title: t("aboutPillar1Title"),
      description: t("aboutPillar1Desc"),
      color: "text-primary",
      bgColor: "from-primary/20 to-primary/5",
    },
    {
      icon: Shield,
      title: t("aboutPillar2Title"),
      description: t("aboutPillar2Desc"),
      color: "text-accent",
      bgColor: "from-accent/20 to-accent/5",
    },
    {
      icon: Users,
      title: t("aboutPillar3Title"),
      description: t("aboutPillar3Desc"),
      color: "text-neon-cyan",
      bgColor: "from-neon-cyan/20 to-neon-cyan/5",
    },
  ];

  const stats = [
    { value: "190+", label: t("aboutStatCountries") },
    { value: "100K+", label: t("aboutStatUsers") },
    { value: "24/7", label: t("aboutStatSupport") },
    { value: "100%", label: t("aboutStatUptime") },
  ];

  const trustPoints = [
    t("aboutTrust1"),
    t("aboutTrust2"),
    t("aboutTrust3"),
    t("aboutTrust4"),
    t("aboutTrust5"),
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SEO page="about" />
      
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,hsl(var(--primary)/0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,hsl(var(--accent)/0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary)/0.02)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Hero Section */}
      <section 
        id="hero"
        ref={(el: HTMLDivElement | null) => { sectionRefs.current['hero'] = el; }}
        className="pt-28 pb-16 md:pt-36 md:pb-24 px-4 relative z-10"
      >
        <div className={`container max-w-5xl mx-auto text-center transition-all duration-1000 ${visibleSections.has('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-block px-5 py-2 rounded-full bg-white/[0.03] backdrop-blur-xl text-primary text-sm font-medium mb-6 border border-white/10">
            {t("aboutUs")}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6">
            <span className="bg-gradient-to-r from-primary via-white to-accent bg-clip-text text-transparent">
              {t("aboutTitle")}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            {t("aboutSubtitle")}
          </p>
          
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span className="text-sm text-white/80">{t("aboutTrustBadge")}</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        id="stats"
        ref={(el: HTMLDivElement | null) => { sectionRefs.current['stats'] = el; }}
        className="py-12 px-4 relative z-10"
      >
        <div className={`container max-w-5xl mx-auto transition-all duration-1000 ${visibleSections.has('stats') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/10"
              >
                <div className="text-3xl md:text-4xl font-light text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section 
        id="mission"
        ref={(el: HTMLDivElement | null) => { sectionRefs.current['mission'] = el; }}
        className="py-16 md:py-24 px-4 relative z-10"
      >
        <div className="container max-w-5xl mx-auto">
          <div className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-1000 ${visibleSections.has('mission') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-6">
                <Target className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium text-accent uppercase tracking-wider">{t("aboutMissionLabel")}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-light mb-6 text-white">
                {t("aboutMissionTitle")}
              </h2>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                {t("aboutMission1")}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t("aboutMission2")}
              </p>
            </div>
            
            {/* Mission Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl blur-3xl" />
              <div className="relative p-8 rounded-3xl bg-white/[0.02] border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                    <Globe className="w-8 h-8 text-primary mx-auto mb-2" />
                    <span className="text-sm text-white/80">{t("aboutMissionGlobal")}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-center">
                    <Database className="w-8 h-8 text-accent mx-auto mb-2" />
                    <span className="text-sm text-white/80">{t("aboutMissionDecentralized")}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 text-center">
                    <Shield className="w-8 h-8 text-neon-cyan mx-auto mb-2" />
                    <span className="text-sm text-white/80">{t("aboutMissionPrivate")}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-neon-violet/10 border border-neon-violet/20 text-center">
                    <Coins className="w-8 h-8 text-neon-violet mx-auto mb-2" />
                    <span className="text-sm text-white/80">{t("aboutMissionRewarding")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section 
        id="pillars"
        ref={(el: HTMLDivElement | null) => { sectionRefs.current['pillars'] = el; }}
        className="py-16 md:py-24 px-4 relative z-10"
      >
        <div className="container max-w-5xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-1000 ${visibleSections.has('pillars') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl md:text-4xl font-light mb-4 text-white">
              {t("aboutPillarsTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("aboutPillarsSubtitle")}
            </p>
          </div>

          <div className={`grid md:grid-cols-3 gap-6 transition-all duration-1000 delay-200 ${visibleSections.has('pillars') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {pillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <div 
                  key={index}
                  className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-primary/30 transition-all duration-300 text-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pillar.bgColor} flex items-center justify-center mx-auto mb-6 border border-white/10`}>
                      <Icon className={`w-8 h-8 ${pillar.color}`} />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-3">{pillar.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust & Transparency Section */}
      <section 
        id="trust"
        ref={(el: HTMLDivElement | null) => { sectionRefs.current['trust'] = el; }}
        className="py-16 md:py-24 px-4 relative z-10"
      >
        <div className="container max-w-5xl mx-auto">
          <div className={`relative transition-all duration-1000 ${visibleSections.has('trust') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl blur-2xl" />
            <div className="relative p-8 md:p-12 rounded-3xl bg-white/[0.02] border border-white/10">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary uppercase tracking-wider">{t("aboutTrustLabel")}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-light mb-4 text-white">
                    {t("aboutTrustTitle")}
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {t("aboutTrustDesc")}
                  </p>
                </div>
                <div className="space-y-3">
                  {trustPoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/80">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision CTA */}
      <section 
        id="vision"
        ref={(el: HTMLDivElement | null) => { sectionRefs.current['vision'] = el; }}
        className="py-16 md:py-24 px-4 relative z-10"
      >
        <div className="container max-w-4xl mx-auto">
          <div className={`text-center transition-all duration-1000 ${visibleSections.has('vision') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Zap className="w-12 h-12 text-accent mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-light mb-6 text-white leading-relaxed">
              {t("aboutVision1")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              {t("aboutVision2")}
            </p>
          </div>
        </div>
      </section>

      <SiteNavigation />
      <SupportChatbot />
    </div>
  );
}
