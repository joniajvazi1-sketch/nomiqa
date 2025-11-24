import { Navbar } from "@/components/Navbar";
import { SiteNavigation } from "@/components/SiteNavigation";
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
    <div className="min-h-screen bg-gradient-to-br from-black/40 via-deep-space/60 to-black/40 relative overflow-hidden">
      {/* Premium background decorations */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-neon-cyan rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-violet rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-coral rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 md:pb-20 px-4">
        <div className="container max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12 md:mb-16 animate-fade-in-up">
            <div className="inline-block mb-4 md:mb-5">
              <span className="text-neon-cyan text-xs md:text-sm font-light tracking-[0.25em] uppercase">
                🚀 Your Journey Starts Here
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-5 md:mb-6">
              <span className="block bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
                {t("gettingStartedTitle1")}
              </span>
              <span className="block bg-gradient-to-r from-neon-coral via-neon-orange to-neon-pink bg-clip-text text-transparent mt-2">
                {t("gettingStartedTitle2")}
              </span>
            </h1>
            
            <p className="text-base md:text-lg lg:text-xl text-white/70 max-w-3xl mx-auto font-light leading-relaxed">
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
            <Accordion type="single" collapsible className="space-y-6">
              {guides.map((guide, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border-0 bg-white/[0.02] backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-neon-cyan/30 transition-all duration-300 shadow-lg"
                >
                  <AccordionTrigger className="px-6 md:px-8 py-6 md:py-7 hover:no-underline group">
                    <div className="flex items-center gap-4 text-left w-full">
                      <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-neon-cyan/10 to-neon-violet/10 flex items-center justify-center border border-neon-cyan/30 group-hover:border-neon-cyan/60 transition-all duration-300 group-hover:shadow-glow-cyan">
                        <guide.icon className="w-6 h-6 md:w-7 md:h-7 text-neon-cyan group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl font-light text-white group-hover:text-neon-cyan transition-colors mb-1">
                          {t(guide.titleKey)}
                        </h3>
                        <p className="text-sm text-white/60 mb-2 font-light">
                          {t(guide.descKey)}
                        </p>
                        <p className="text-xs text-neon-cyan/70 md:hidden flex items-center gap-1 font-light">
                          <span>{t("tapToExpand")}</span>
                          <span className="animate-pulse">→</span>
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 md:px-8 pb-6 md:pb-7">
                    <div className="pt-4 space-y-4">
                      {guide.stepKeys.map((stepKey, stepIndex) => (
                        <div 
                          key={stepIndex} 
                          className="flex items-start gap-4 p-4 md:p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-neon-cyan/20 transition-all group/step"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center text-white font-light text-sm shadow-glow-cyan">
                            {stepIndex + 1}
                          </div>
                          <p className="text-sm md:text-base text-white/80 leading-relaxed pt-1 font-light">
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
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-light mb-3 bg-gradient-to-r from-neon-cyan via-white to-neon-violet bg-clip-text text-transparent">
                {t("resourcesTitle")}
              </h2>
              <p className="text-white/60 font-light">{t("resourcesSubtitle")}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {resources.map((resource, index) => (
                <Card 
                  key={index} 
                  className="bg-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-neon-cyan/40 transition-all hover:shadow-glow-cyan cursor-pointer group hover:-translate-y-1 duration-300"
                  onClick={() => window.open(resource.url, '_blank')}
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-light text-white group-hover:text-neon-cyan transition-colors">
                      {t(resource.titleKey)}
                    </CardTitle>
                    <CardDescription className="text-sm text-white/60 font-light">
                      {t(resource.descKey)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-sm text-neon-cyan group-hover:gap-3 transition-all font-light">
                      <span>{t("resourceVisit")}</span>
                      <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-neon-violet/10 via-neon-coral/10 to-neon-cyan/10 border border-neon-violet/30 backdrop-blur-xl shadow-glow-coral">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-violet/5 pointer-events-none"></div>
            <CardContent className="pt-10 pb-10 md:pt-12 md:pb-12 relative z-10">
              <div className="flex flex-col items-center justify-center text-center gap-6">
                <div className="space-y-3">
                  <h3 className="text-3xl md:text-4xl font-light bg-gradient-to-r from-neon-coral via-neon-orange to-neon-pink bg-clip-text text-transparent">
                    {t("gettingStartedCtaTitle")}
                  </h3>
                  <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto font-light leading-relaxed">
                    {t("gettingStartedCtaDesc")}
                  </p>
                </div>
                <Button 
                  size="lg" 
                  onClick={() => window.location.href = '/shop'}
                  className="bg-gradient-to-r from-neon-cyan to-neon-violet hover:from-neon-cyan/90 hover:to-neon-violet/90 text-white shadow-glow-cyan text-base md:text-lg px-8 md:px-10 py-6 md:py-7 h-auto group rounded-xl font-light"
                >
                  {t("browsePlans")}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <SiteNavigation />
      <Footer />
      <StickyCTA />
    </div>
  );
}