import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyCTA } from "@/components/StickyCTA";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Wallet, Shield, Coins, ArrowRight, ExternalLink, Download, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/TranslationContext";

export default function GettingStarted() {
  const { t, language } = useTranslation();
  
  // Language-aware resource URLs
  const getResourceUrls = () => {
    const langMap: Record<string, string> = {
      EN: 'en', ES: 'es', FR: 'fr', DE: 'de', RU: 'ru', 
      ZH: 'zh', JA: 'ja', PT: 'pt', AR: 'ar', IT: 'it'
    };
    const lang = langMap[language] || 'en';
    
    return {
      phantom: 'https://phantom.app/',
      solana: `https://solana.com/${lang === 'en' ? 'learn' : lang}`,
      usdc: 'https://www.circle.com/usdc'
    };
  };
  
  const resourceUrls = getResourceUrls();
  
  const guides = [
    {
      titleKey: "guidePhantomTitle",
      descKey: "guidePhantomDesc",
      icon: Wallet,
      stepKeys: ["guidePhantomStep1", "guidePhantomStep2", "guidePhantomStep3", "guidePhantomStep4", "guidePhantomStep5"]
    },
    {
      titleKey: "guideSolanaTitle",
      descKey: "guideSolanaDesc",
      icon: Coins,
      stepKeys: ["guideSolanaStep1", "guideSolanaStep2", "guideSolanaStep3", "guideSolanaStep4", "guideSolanaStep5"]
    },
    {
      titleKey: "guideNomiqaTitle",
      descKey: "guideNomiqaDesc",
      icon: TrendingUp,
      stepKeys: ["guideNomiqaStep1", "guideNomiqaStep2", "guideNomiqaStep3", "guideNomiqaStep4", "guideNomiqaStep5", "guideNomiqaStep6", "guideNomiqaStep7", "guideNomiqaStep8"]
    },
    {
      titleKey: "guidePaymentTitle",
      descKey: "guidePaymentDesc",
      icon: Download,
      stepKeys: ["guidePaymentStep1", "guidePaymentStep2", "guidePaymentStep3", "guidePaymentStep4", "guidePaymentStep5", "guidePaymentStep6"]
    },
    {
      titleKey: "guideSecurityTitle",
      descKey: "guideSecurityDesc",
      icon: Shield,
      stepKeys: ["guideSecurityStep1", "guideSecurityStep2", "guideSecurityStep3", "guideSecurityStep4", "guideSecurityStep5"]
    }
  ];

  const resources = [
    {
      titleKey: "resourcePhantomTitle",
      descKey: "resourcePhantomDesc",
      url: resourceUrls.phantom
    },
    {
      titleKey: "resourceSolanaTitle",
      descKey: "resourceSolanaDesc",
      url: resourceUrls.solana
    },
    {
      titleKey: "resourceUsdcTitle",
      descKey: "resourceUsdcDesc",
      url: resourceUrls.usdc
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-deep-space to-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Animated background glows */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-96 h-96 bg-neon-cyan/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-violet/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-coral/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
        </div>
        
        <div className="container max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-neon-cyan via-neon-violet to-neon-coral p-0.5">
              <div className="w-full h-full bg-card rounded-2xl flex items-center justify-center">
                <Wallet className="w-10 h-10 text-neon-cyan" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 font-display">
              <span className="block bg-gradient-neon bg-clip-text text-transparent">
                {t("gettingStartedTitle1")}
              </span>
              <span className="block bg-gradient-sunset bg-clip-text text-transparent mt-2">
                {t("gettingStartedTitle2")}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto">
              {t("gettingStartedSubtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative pb-20 px-4">
        <div className="container mx-auto max-w-5xl relative z-10">

          {/* Guide Cards with Accordion */}
          <div className="mb-16">
            <Accordion type="single" collapsible defaultValue="item-0" className="space-y-4">
              {guides.map((guide, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border-0 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
                >
                  <AccordionTrigger className="px-6 py-6 hover:no-underline group">
                    <div className="flex items-center gap-4 text-left w-full">
                      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-neon-cyan/20 via-neon-violet/20 to-neon-coral/20 flex items-center justify-center border border-neon-cyan/30 group-hover:border-neon-violet/50 transition-colors">
                        <guide.icon className="w-7 h-7 text-neon-cyan group-hover:text-neon-violet transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-neon-cyan transition-colors mb-1">
                          {t(guide.titleKey)}
                        </h3>
                        <p className="text-sm text-foreground/60 mb-2">
                          {t(guide.descKey)}
                        </p>
                        <p className="text-xs text-neon-cyan/70 md:hidden flex items-center gap-1">
                          <span>Tap to expand</span>
                          <span className="animate-pulse">→</span>
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="pt-4 space-y-4">
                      {guide.stepKeys.map((stepKey, stepIndex) => (
                        <div 
                          key={stepIndex} 
                          className="flex items-start gap-4 p-4 rounded-xl bg-background/50 border border-border/50 hover:border-neon-cyan/30 transition-all group/step"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {stepIndex + 1}
                          </div>
                          <p className="text-sm text-foreground/80 leading-relaxed pt-1">
                            {t(stepKey)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Resources Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3 bg-gradient-neon bg-clip-text text-transparent">
                {t("resourcesTitle")}
              </h2>
              <p className="text-foreground/60">{t("resourcesSubtitle")}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {resources.map((resource, index) => (
                <Card 
                  key={index} 
                  className="bg-card/40 backdrop-blur-sm border-border/50 hover:border-neon-cyan/50 transition-all hover:shadow-glow-cyan cursor-pointer group"
                  onClick={() => window.open(resource.url, '_blank')}
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg group-hover:text-neon-cyan transition-colors">
                      {t(resource.titleKey)}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {t(resource.descKey)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-sm text-neon-cyan group-hover:gap-3 transition-all">
                      <span>{t("resourceVisit")}</span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-neon-violet/10 via-neon-coral/10 to-neon-cyan/10 border-neon-violet/30 backdrop-blur-sm shadow-glow-coral">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-violet/5"></div>
            <CardContent className="pt-8 pb-8 relative z-10">
              <div className="flex flex-col items-center justify-center text-center gap-6">
                <div className="space-y-3">
                  <h3 className="text-3xl md:text-4xl font-bold bg-gradient-sunset bg-clip-text text-transparent">
                    {t("gettingStartedCtaTitle")}
                  </h3>
                  <p className="text-foreground/70 text-base md:text-lg max-w-xl mx-auto">
                    {t("gettingStartedCtaDesc")}
                  </p>
                </div>
                <Button 
                  size="lg" 
                  onClick={() => window.location.href = '/shop'}
                  className="bg-gradient-to-r from-neon-coral to-neon-violet hover:opacity-90 text-white shadow-glow-coral text-lg px-8 py-6 h-auto group"
                >
                  {t("browsePlans")}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
      <StickyCTA />
    </div>
  );
}