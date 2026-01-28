import { SiteNavigation } from "@/components/SiteNavigation";
import { SupportChatbot } from "@/components/SupportChatbot";
import { NetworkBackground } from "@/components/NetworkBackground";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Smartphone, Shield, Coins, ArrowRight, Download, 
  Wifi, Globe, Users, Zap, Lock, CheckCircle2, 
  Network, Wallet, TrendingUp, ShieldCheck, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/TranslationContext";
import { SEO } from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import { localizedPath } from "@/utils/localizedLinks";

export default function GettingStarted() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const steps = [
    {
      number: "01",
      icon: Download,
      title: t("gsStep1Title"),
      description: t("gsStep1Desc"),
      color: "from-neon-cyan to-neon-cyan/50",
    },
    {
      number: "02",
      icon: UserPlus,
      title: t("gsStep2Title"),
      description: t("gsStep2Desc"),
      color: "from-neon-violet to-neon-violet/50",
    },
    {
      number: "03",
      icon: Wifi,
      title: t("gsStep3Title"),
      description: t("gsStep3Desc"),
      color: "from-neon-coral to-neon-coral/50",
    },
    {
      number: "04",
      icon: Coins,
      title: t("gsStep4Title"),
      description: t("gsStep4Desc"),
      color: "from-primary to-primary/50",
    },
  ];

  const depinBenefits = [
    { icon: Network, title: t("gsDePINBenefit1Title"), desc: t("gsDePINBenefit1Desc") },
    { icon: Shield, title: t("gsDePINBenefit2Title"), desc: t("gsDePINBenefit2Desc") },
    { icon: Users, title: t("gsDePINBenefit3Title"), desc: t("gsDePINBenefit3Desc") },
  ];

  const privacyFeatures = [
    { icon: Lock, text: t("gsPrivacy1") },
    { icon: ShieldCheck, text: t("gsPrivacy2") },
    { icon: Globe, text: t("gsPrivacy3") },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SEO page="gettingStarted" />
      <NetworkBackground />
      
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,hsl(var(--primary)/0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,hsl(var(--accent)/0.08),transparent_50%)]" />

      {/* Hero Section */}
      <section className="relative pt-8 pb-12 md:pt-16 md:pb-16 px-4">
        <div className="container max-w-5xl mx-auto relative z-10 text-center">
          <span className="inline-block px-5 py-2 rounded-full bg-white/[0.03] backdrop-blur-xl text-primary text-sm font-medium mb-6 border border-white/10">
            {t("gsWelcomeBadge")}
          </span>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6">
            <span className="bg-gradient-to-r from-primary via-white to-accent bg-clip-text text-transparent">
              {t("gsTitle")}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t("gsSubtitle")}
          </p>
        </div>
      </section>

      {/* What is DePIN Section */}
      <section className="relative py-12 md:py-16 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-4">
              <Network className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-accent uppercase tracking-wider">{t("gsDePINLabel")}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-4">{t("gsDePINTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("gsDePINDesc")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {depinBenefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center hover:border-primary/30 transition-all">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4-Step Journey */}
      <section className="relative py-12 md:py-16 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-light text-white mb-4">{t("gsStepsTitle")}</h2>
            <p className="text-muted-foreground">{t("gsStepsSubtitle")}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-primary/30 transition-all group">
                  <div className="absolute top-4 right-4 text-4xl font-light text-white/10 group-hover:text-primary/20 transition-colors">
                    {step.number}
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How to Buy Token Section */}
      <section className="relative py-12 md:py-16 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="relative p-8 md:p-10 rounded-3xl bg-white/[0.02] border border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
            
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">{t("gsTokenLabel")}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-light text-white mb-4">{t("gsTokenTitle")}</h2>
                <p className="text-muted-foreground mb-6">{t("gsTokenDesc")}</p>
                
                <div className="space-y-3 mb-6">
                  {[t("gsTokenStep1"), t("gsTokenStep2"), t("gsTokenStep3")].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-white/80">{step}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => navigate(localizedPath('/token', language))}
                  className="bg-primary/10 border border-primary/30 text-white hover:bg-primary/20 gap-2"
                >
                  {t("gsLearnAboutToken")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <Wallet className="w-8 h-8 text-neon-cyan mx-auto mb-2" />
                  <span className="text-xs text-white/80">{t("gsTokenFeature1")}</span>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <TrendingUp className="w-8 h-8 text-neon-violet mx-auto mb-2" />
                  <span className="text-xs text-white/80">{t("gsTokenFeature2")}</span>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <Zap className="w-8 h-8 text-neon-coral mx-auto mb-2" />
                  <span className="text-xs text-white/80">{t("gsTokenFeature3")}</span>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <Globe className="w-8 h-8 text-primary mx-auto mb-2" />
                  <span className="text-xs text-white/80">{t("gsTokenFeature4")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Promise Section */}
      <section className="relative py-12 md:py-16 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 mb-4">
              <Shield className="w-4 h-4 text-neon-cyan" />
              <span className="text-xs font-medium text-neon-cyan uppercase tracking-wider">{t("gsPrivacyLabel")}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-4">{t("gsPrivacyTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("gsPrivacyDesc")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {privacyFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start gap-4 p-5 rounded-xl bg-white/[0.02] border border-white/10">
                  <div className="w-10 h-10 rounded-lg bg-neon-cyan/10 flex items-center justify-center flex-shrink-0 border border-neon-cyan/20">
                    <Icon className="w-5 h-5 text-neon-cyan" />
                  </div>
                  <p className="text-sm text-white/80">{feature.text}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Button 
              variant="outline"
              onClick={() => navigate(localizedPath('/privacy', language))}
              className="border-white/20 text-white/80 hover:bg-white/5 gap-2"
            >
              {t("gsReadPrivacyPolicy")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-16 md:py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <Card className="relative overflow-hidden bg-white/[0.03] backdrop-blur-xl border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-neon-cyan/10" />
            <CardContent className="relative pt-10 pb-10 md:pt-14 md:pb-14 text-center">
              <Zap className="w-12 h-12 text-primary mx-auto mb-6" />
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-light text-white mb-4">
                {t("gsCtaTitle")}
              </h3>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                {t("gsCtaDesc")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  onClick={() => navigate(localizedPath('/download', language))}
                  className="bg-primary hover:bg-primary/90 text-white gap-2"
                >
                  <Download className="w-5 h-5" />
                  {t("gsCtaDownload")}
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => navigate(localizedPath('/shop', language))}
                  className="border-white/20 text-white hover:bg-white/5 gap-2"
                >
                  {t("gsCtaBrowse")}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <SiteNavigation />
      <SupportChatbot />
    </div>
  );
}
