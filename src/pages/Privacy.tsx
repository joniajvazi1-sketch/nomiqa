import { SiteNavigation } from "@/components/SiteNavigation";

import { NetworkBackground } from "@/components/NetworkBackground";
import { Shield, Eye, Lock, Globe, Fingerprint, Database, Network, Users, Coins, CheckCircle, XCircle, Server, Trash2 } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { localizedPath } from "@/utils/localizedLinks";
import { LegalPrivacyPolicy } from "@/components/privacy/LegalPrivacyPolicy";

export default function Privacy() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  
  const principles = [
    {
      icon: Eye,
      title: t("privacyPrinciple1Title"),
      description: t("privacyPrinciple1Desc"),
      color: "text-neon-cyan",
      borderColor: "hover:border-neon-cyan/30",
    },
    {
      icon: Fingerprint,
      title: t("privacyPrinciple2Title"),
      description: t("privacyPrinciple2Desc"),
      color: "text-neon-violet",
      borderColor: "hover:border-neon-violet/30",
    },
    {
      icon: Database,
      title: t("privacyPrinciple3Title"),
      description: t("privacyPrinciple3Desc"),
      color: "text-neon-coral",
      borderColor: "hover:border-neon-coral/30",
    },
    {
      icon: Lock,
      title: t("privacyPrinciple4Title"),
      description: t("privacyPrinciple4Desc"),
      color: "text-primary",
      borderColor: "hover:border-primary/30",
    },
  ];

  const depinPrivacy = [
    {
      icon: Network,
      title: t("privacyDePIN1Title"),
      desc: t("privacyDePIN1Desc"),
    },
    {
      icon: Users,
      title: t("privacyDePIN2Title"),
      desc: t("privacyDePIN2Desc"),
    },
    {
      icon: Coins,
      title: t("privacyDePIN3Title"),
      desc: t("privacyDePIN3Desc"),
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SEO page="privacy" />
      <NetworkBackground color="rgb(34, 211, 238)" />
      
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,hsl(var(--primary)/0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,hsl(var(--accent)/0.08),transparent_50%)]" />

      {/* Hero Section */}
      <section className="relative pt-8 pb-12 md:pt-16 md:pb-16 px-4">
        <div className="container max-w-5xl mx-auto relative z-10">
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-neon-cyan/20 rounded-2xl blur-xl"></div>
              <div className="relative w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                <Shield className="w-10 h-10 text-neon-cyan" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6">
              <span className="bg-gradient-to-r from-primary via-white to-accent bg-clip-text text-transparent">
                {t("privacyHeroTitle")}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              {t("privacyHeroDesc")}
            </p>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-sm text-white/80">{t("privacyBadge")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Principles Grid */}
      <section className="relative py-12 md:py-16 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {principles.map((principle, index) => (
              <div
                key={index}
                className={`group p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 ${principle.borderColor} transition-all duration-300`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-4">
                    <principle.icon className={`w-7 h-7 ${principle.color}`} />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">
                    {principle.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DePIN Privacy Advantage */}
      <section className="relative py-12 md:py-16 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-4">
              <Network className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-accent uppercase tracking-wider">{t("privacyDePINLabel")}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-4">{t("privacyDePINTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("privacyDePINSubtitle")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {depinPrivacy.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center hover:border-accent/30 transition-all">
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4 border border-accent/20">
                    <Icon className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Protection Methods */}
      <section className="relative py-12 md:py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-light text-white mb-4">{t("privacyMethodsTitle")}</h2>
            <p className="text-muted-foreground">{t("privacyMethodsIntro")}</p>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-neon-cyan/30 transition-all">
              <h3 className="text-lg font-medium text-neon-cyan mb-2">{t("privacyMethod1Title")}</h3>
              <p className="text-sm text-muted-foreground">{t("privacyMethod1Desc")}</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-neon-violet/30 transition-all">
              <h3 className="text-lg font-medium text-neon-violet mb-2">{t("privacyMethod2Title")}</h3>
              <p className="text-sm text-muted-foreground">{t("privacyMethod2Desc")}</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-neon-coral/30 transition-all">
              <h3 className="text-lg font-medium text-neon-coral mb-2">{t("privacyMethod3Title")}</h3>
              <p className="text-sm text-muted-foreground">{t("privacyMethod3Desc")}</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-primary/30 transition-all">
              <h3 className="text-lg font-medium text-primary mb-2">{t("privacyMethod4Title")}</h3>
              <p className="text-sm text-muted-foreground">{t("privacyMethod4Desc")}</p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-accent/30 transition-all">
              <h3 className="text-lg font-medium text-accent mb-2">{t("privacyMethod5Title")}</h3>
              <p className="text-sm text-muted-foreground">{t("privacyMethod5Desc")}</p>
            </div>
          </div>

          <p className="text-center mt-8 text-neon-coral font-light">
            {t("privacyClosing")}
          </p>
        </div>
      </section>

      {/* What We Collect vs What We Don't */}
      <section className="relative py-12 md:py-16 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-light text-white mb-4">{t("privacyDataTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("privacyDataSubtitle")}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* What We Collect */}
            <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-neon-cyan/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-neon-cyan" />
                </div>
                <h3 className="text-lg font-medium text-neon-cyan">{t("privacyWeCollect")}</h3>
              </div>
              <ul className="space-y-3">
                {[
                  t("privacyCollect1"),
                  t("privacyCollect2"),
                  t("privacyCollect3"),
                  t("privacyCollect4"),
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-neon-cyan mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What We DON'T Collect */}
            <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-red-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-red-400">{t("privacyWeDontCollect")}</h3>
              </div>
              <ul className="space-y-3">
                {[
                  t("privacyDontCollect1"),
                  t("privacyDontCollect2"),
                  t("privacyDontCollect3"),
                  t("privacyDontCollect4"),
                  t("privacyDontCollect5"),
                  t("privacyDontCollect6"),
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Data safety highlights */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 text-center">
              <Server className="w-6 h-6 text-primary mx-auto mb-3" />
              <p className="text-sm text-white font-medium mb-1">{t("privacyEUServers")}</p>
              <p className="text-xs text-muted-foreground">{t("privacyEUServersDesc")}</p>
            </div>
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 text-center">
              <Lock className="w-6 h-6 text-primary mx-auto mb-3" />
              <p className="text-sm text-white font-medium mb-1">{t("privacyEncrypted")}</p>
              <p className="text-xs text-muted-foreground">{t("privacyEncryptedDesc")}</p>
            </div>
            <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 text-center">
              <Trash2 className="w-6 h-6 text-primary mx-auto mb-3" />
              <p className="text-sm text-white font-medium mb-1">{t("privacyDeleteAnytime")}</p>
              <p className="text-xs text-muted-foreground">{t("privacyDeleteAnytimeDesc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Promise Section */}
      <section className="relative py-12 md:py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="p-8 md:p-10 rounded-3xl bg-white/[0.02] border border-white/10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-neon-cyan/5" />
            <div className="relative">
              <Globe className="w-12 h-12 text-primary mx-auto mb-6" />
              <p className="text-xl md:text-2xl text-white mb-4 font-light">
                {t("privacyQuote")}
              </p>
              <p className="text-muted-foreground mb-6">
                {t("privacyQuoteAttribution")}
              </p>
              <Button 
                onClick={() => navigate(localizedPath('/getting-started', language))}
                className="bg-primary/10 border border-primary/30 text-white hover:bg-primary/20"
              >
                {t("privacyCtaButton")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Full Legal Privacy Policy */}
      <LegalPrivacyPolicy />
      
      <SiteNavigation />
      
    </div>
  );
}
